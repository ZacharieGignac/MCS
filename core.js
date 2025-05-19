/* jshint esversion:8 */
import xapi from 'xapi';
import { Storage } from './utils';
import { Performance } from './utils';
import { DevicesManager } from './devices';
import { config as systemconfig } from './config';
import { Scenarios } from './scenarios';
import { Modules } from './modules';
import { SystemStatus } from './systemstatus';
import { HttpRequestDispatcher } from './communication';
import { MessageQueue } from './communication';
import { Audio } from './audio';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';


const COREVERSION = '1.1.1-dev1';
const ZAPIVERSION = 1;

function systemKill() {
  xapi.Command.Macros.Macro.Deactivate({ Name: 'core' });
  xapi.Command.Macros.Runtime.Restart();
}

async function killswitchInit() {
  if (systemconfig.system.killswitchGPIO != undefined) {
    await xapi.Config.GPIO.Pin[systemconfig.system.killswitchGPIO].Mode.set('InputNoAction');
    let killswitchStatus = await xapi.Status.GPIO.Pin[systemconfig.system.killswitchGPIO].State.get();
    if (killswitchStatus == 'High') {
      systemKill();
    }
  }
  xapi.Status.GPIO.Pin[systemconfig.system.killswitchGPIO].State.on(state => {
    if (state == 'High') {
      systemKill();
    }
  });
}
//INIT
//GPIO Killswitch check on boot

killswitchInit();



const DEBUGLEVEL = {
  LOW: 3,
  MEDIUM: 2,
  HIGH: 1,
  NONE: 0
};

const str = systemconfig.strings;

const INITSTEPDELAY = 500;

var coldbootWarningInterval;
var core;
var storage;
var httpRequestDispatcher;
var systemEvents;



function schedule(time, action) {
  let [alarmH, alarmM] = time.split(':');
  let now = new Date();
  now = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let difference = parseInt(alarmH) * 3600 + parseInt(alarmM) * 60 - now;
  if (difference <= 0) difference += 24 * 3600;
  return setTimeout(action, difference * 1000);
}

function toOnOff(value) {
  return value ? 'on' : 'off';
}
function toBool(value) {
  return value.toLowerCase() == 'on' ? true : false;
}

var performance = new Performance();
performance.setElapsedStart('Boot');






class SystemEvents {
  constructor() {
    this.events = [];
  }

  on(event, callback) {
    this.events.push({ event: event, callback: callback });
  }

  off(event, callback) {
    for (let e of this.events) {
      if (e.event == event && e.callback == callback) {
        this.events.splice(this.events.indexOf(e), 1);
      }
    }
  }

  emit(event, ...args) {
    for (let e of this.events) {
      if (e.event == event) {
        e.callback(...args);
      }
    }
  }
}


class WidgetMapping {
  constructor(widgetId) {
    this.callbacks = [];
    this.widgetId = widgetId;
    this.value = undefined;
  }

  on(type, callback) {
    this.callbacks.push({
      type: type,
      callback: callback
    });
  }

  async getValue() {
    return this.value;
  }

  setValue(value) {
    performance.inc('WidgetMapping.setValue()');
    zapi.ui.setWidgetValue(this.widgetId, value);
  }

  processEvent(event) {
    if (event.WidgetId.includes('|')) {
      event.WidgetId = event.WidgetId.split('|')[1];
    }

    if (this.widgetId instanceof RegExp) {
      if (this.widgetId.test(event.WidgetId)) {
        for (let cb of this.callbacks) {
          if (cb.type == event.Type || cb.type == '') {
            cb.callback(event.WidgetId, event.Value);
          }
        }
      }
    }
    else {
      if (event.WidgetId == this.widgetId) {
        for (let cb of this.callbacks) {
          if (cb.type == event.Type || cb.type == '') {
            cb.callback(event.Value);
          }
        }
      }
    }
  }
}

class UiManager {
  constructor() {
    this.allWidgets = [];
    this.actionMaps = [];
    this.valueMaps = [];
    this.uiEventSubscribers = [];
    this.widgetMappings = [];
  }

  async init() {
    return new Promise(async success => {
      xapi.Event.UserInterface.on(event => {
        this.forwardUiEvents(event);
      });
      this.onUiEvent((event) => {
        this.parseUiEvent(event)
      });
      //TAG:ZAPI
      zapi.ui.addActionMapping = (regex, func) => { this.addActionMapping(regex, func); };
      zapi.ui.setWidgetValue = (widgetId, value) => { this.setWidgetValue(widgetId, value); };
      zapi.ui.getAllWidgets = () => { return this.getAllWidgets(); };
      zapi.ui.addWidgetMapping = (widgetId) => { return this.addWidgetMapping(widgetId); };
      zapi.ui.showProgressBar = (title, text, seconds) => { return this.showProgressBar(title, text, seconds) };

      //Build widgets cache
      let list = await xapi.Command.UserInterface.Extensions.List();
      this.processWidgetsCache(list); // Call the new synchronous function to process widgets

      success();
    });
  }

  // New synchronous function to process widget data
  processWidgetsCache(list) {
    if (!list?.Extensions?.Panel) {
      return; // Exit early if no relevant data
    }

    const panels = list.Extensions.Panel;
    for (const panel of panels) {
      if (!panel?.Page) continue;
      const pages = panel.Page;
      for (const page of pages) {
        if (!page?.Row) continue;
        const rows = page.Row;
        for (const row of rows) {
          if (!row?.Widget) continue;
          const widgets = row.Widget;
          for (const widget of widgets) {
            this.allWidgets.push({ widgetId: widget.WidgetId, type: widget.Type });
          }
        }
      }
    }
  }

  forwardUiEvents(event) {
    for (let s of this.uiEventSubscribers) {
      s(event);
    }
  }

  getAllWidgets() {
    return this.allWidgets;
  }

  setWidgetValue(widgetId, value) {
    for (let w of this.allWidgets) {
      var targetWidgetId = w.widgetId;
      if (w.widgetId.includes('|')) {
        targetWidgetId = w.widgetId.split('|')[1];
      }
      if (targetWidgetId == widgetId) {
        try {
          let setValue = value;

          if (typeof value === 'boolean') {
            setValue = value ? 'on' : 'off';
          }

          xapi.Command.UserInterface.Extensions.Widget.SetValue({
            WidgetId: w.widgetId,
            Value: setValue
          });
        }
        catch (e) {
          debug(3, e);
        }
      }
    }
  }

  onUiEvent(callback) {
    this.uiEventSubscribers.push(callback);
  }

  addWidgetMapping(widgetId) {
    var tempWidgetMapping = new WidgetMapping(widgetId);
    this.widgetMappings.push(tempWidgetMapping);
    return tempWidgetMapping;
  }

  parseUiEvent(event) {
    performance.inc('UiManager.ParsedUiEvents');
    var eventId;

    if (event.Extensions && event.Extensions.Widget && event.Extensions.Widget.Action) {
      if (event.Extensions.Widget.Action.Type === 'pressed') {
        eventId = event.Extensions.Widget.Action.WidgetId;
        this.processMatchAction(eventId);
      }

      this.processWidgetMappingsEvent(event.Extensions.Widget.Action);
      //UGLY FIX
      eventId = event.Extensions.Widget.Action.WidgetId;
      if (eventId && eventId.includes('|')) {
        eventId = eventId.split('|')[1];
      }
      if (eventId && eventId.startsWith('SS$')) {
        zapi.system.setStatus(eventId, event.Extensions.Widget.Action.Value);
      }
      else if (eventId && eventId.startsWith('SS?')) {
        zapi.system.setStatus(eventId, toBool(event.Extensions.Widget.Action.Value));
      }
    }
    else if (event.Extensions && event.Extensions.Panel && event.Extensions.Panel.Clicked) {
      eventId = event.Extensions.Panel.Clicked.PanelId;
      this.processMatchAction(eventId);
    }
  }

  processWidgetMappingsEvent(event) {
    performance.inc('UiManager.WidgetMappingEventProcessed');
    for (let wm of this.widgetMappings) {
      wm.processEvent(event);
    }
  }

  processMatchAction(eventId) {
    performance.inc('UiManager.ActionMappingProcessed');
    if (eventId != undefined) {
      if (eventId.startsWith('ACTION$') || eventId.startsWith('*ACTION$')) {
        this.processAction(eventId.split('$')[1]);
      }
      else if (eventId.startsWith('ACTIONS$') || eventId.startsWith('*ACTIONS$')) {
        let actions = eventId.split('$')[1];
        let actionArray = actions.split('&');
        for (let a of actionArray) {
          this.processAction(a);
        }
      }
    }
  }

  addActionMapping(action, func) {
    this.actionMaps.push({
      regex: action,
      func: func
    });
  }

  processAction(act) {
    if (act.includes(':')) {
      let actionParamsSplit = act.split(':');
      let action = actionParamsSplit[0];
      let params = actionParamsSplit[1];
      let paramsArray = params.split(',');


      for (let map of this.actionMaps) {
        if (map.regex.test(action)) {
          map.func(...paramsArray);
        }
      }
    }

    else {
      for (let map of this.actionMaps) {
        if (map.regex.test(act)) {
          map.func();
        }
      }
    }
  }

  showProgressBar(title, text, seconds) {
    const totalSteps = 10;
    const interval = seconds * 1000 / totalSteps;
    let currentStep = 0;

    const intervalId = setInterval(() => {
      currentStep++;
      const progressBar = '🟦'.repeat(currentStep) + '⬛'.repeat(totalSteps - currentStep);
      xapi.Command.UserInterface.Message.Prompt.Display({
        Title: title,
        Text: text + '<br>' + progressBar
      });

      if (currentStep === totalSteps) {
        clearInterval(intervalId);
        xapi.Command.UserInterface.Message.Prompt.Clear();
      }
    }, interval);
  }
}

class Core {
  constructor() {
    zapi.system.events.emit('system_corestarted');
    var self = this;
    this.messageQueue = new MessageQueue();
    this.audio = new Audio();

    this.lastPresenterDetectedStatus = false;

    //TAG:ZAPI
    zapi.system.systemReport = {};
    zapi.system.systemReport.systemVersion = COREVERSION;
    zapi.system.sendSystemReport = () => this.sendSystemReport();
  }

  safeStringify(obj, cache = new Set()) {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          // Remove cyclic reference
          return;
        }
        cache.add(value);
      }
      return value;
    });
  }

  async sendSystemReport() {
    let systemunitName = await xapi.Config.SystemUnit.Name.get();
    let codecConfig = await xapi.Config.get();
    let codecStatus = await xapi.Status.get();
    let date = new Date();

    debug(1, `Sending system report...`);
    xapi.Command.UserInterface.Message.Alert.Display({
      Title: str.sendReportTitle,
      Text: str.sendReportText
    });
    let allDevices = zapi.devices.getAllDevices();
    zapi.system.systemReport.devices = allDevices;
    zapi.system.systemReport.scenarios = this.scenarios;
    zapi.system.systemReport.systemStatus = zapi.system.getAllStatus();
    zapi.system.systemReport.codecConfig = codecConfig;
    zapi.system.systemReport.codecStatus = codecStatus;

    var data = this.safeStringify(zapi.system.systemReport);
    var key = systemconfig.system.systemReportApiKey;
    var url = 'https://api.paste.ee/v1/pastes';
    var body = {
      "description": systemunitName + ' - ' + date,
      "sections": [{
        "name": "Section1",
        "syntax": "autodetect",
        "contents": data
      }]
    };

    xapi.Command.HttpClient.Post({
      AllowInsecureHTTPS: true,
      Header: ['Content-type: application/json', `X-Auth-Token: ${key}`],
      ResultBody: 'PlainText',
      Timeout: 10,
      Url: url
    },
      JSON.stringify(body)
    ).then(result => {
      let resultObj = JSON.parse(result.Body);
      if (resultObj.success == true) {
        xapi.Command.UserInterface.Message.Alert.Display({
          Title: str.sendReportTitle,
          Text: str.sendReportSuccess + resultObj.id
        });
        debug(1, resultObj.link);
      }
      else {
        xapi.Command.UserInterface.Message.Alert.Display({
          Title: str.sendReportTitle,
          Text: str.sendReportFailure
        });
      }
    }).catch(error => {
      xapi.Command.UserInterface.Message.Alert.Display({
        Title: str.sendReportTitle,
        Text: str.sendReportFailure
      });
    });

    delete (zapi.system.systemReport.codecConfig);
    delete (zapi.system.systemReport.codecStatus);


  }



  async handleOverVolume() {
    zapi.system.events.emit('system_volumeoverlimit');
    if (!this.audioExtraMode) {
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        Title: str.audioExtraHighVolumeTitle,
        Text: str.audioExtraHighVolumeText,
        FeedbackId: 'system_overvolume',
        "Option.1": str.audioExtraHighVolumeYes,
        "Option.2": str.audioExtraHighVolumeNo
      });
    }
  }
  async handleUnderVolume() {
    zapi.system.events.emit('system_volumeunderlimit');
    if (this.audioExtraMode && this.audioExtraModeRestoreGains && !this.audioExtraSkipPrompt) {
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        Title: str.audioExtraNormalVolumeTitle,
        Text: str.audioExtraNormalVolumeText,
        FeedbackId: 'system_undervolume',
        "Option.1": str.audioExtraNormalVolumeYes,
        "Option.2": str.audioExtraNormalVolumeNo
      });
    }
    else {
      this.audioExtraMode = false;
    }
  }
  async handleOverVolumePromptResponse(response) {
    this.audioExtraMode = true;
    if (response.OptionId == '1') {
      this.audioExtraModeRestoreGains = true;
      this.setExtraModeGain();
      this.setExtraModeStatus();
    }
    else {
      this.audioExtraModeRestoreGains = false;
    }
    //Connect inputs
    this.enableExtraOutput();

  }
  async handleUnderVolumePromptResponse(response) {
    this.audioExtraMode = false;
    if (response.OptionId == '1') {
      if (this.audioExtraModeRestoreGains) {
        this.resetExtraModeGain();
        this.resetExtraModeStatus();
      }
    }
    this.disableExtraOutput();
  }

  async enableExtraOutput() {

    this.audioExtraModeInputs.forEach(input => {
      this.audioExtraModeOutput.connectLocalInput(input);
      this.audioExtraModeOutput.updateInputGain(input, input.config.extraGain);
    });
  }

  async disableExtraOutput() {
    this.audioExtraModeInputs.forEach(input => {
      this.audioExtraModeOutput.disconnectLocalInput(input);
    });
  }

  async handleOverVolumePromptClear() {
    this.audioExtraMode = false;
    xapi.Command.Audio.Volume.Set({ Level: systemconfig.audio.extra.overVolume });
  }
  async handleUnderVolumePromptClear() {
    this.audioExtraMode = true;
    xapi.Command.Audio.Volume.Set({ Level: systemconfig.audio.extra.overVolume + 1 });
  }

  async setExtraModeGain() {
    for (let g of systemconfig.audio.extra.setGainZero) {
      let inputs = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUT, g);
      for (let i of inputs) {
        i.storeGain();
        i.setGain(0, true);
      }
    }
  }
  async setExtraModeStatus() {
    for (let s of systemconfig.audio.extra.setStatusOff) {
      zapi.system.setStatus(s, 'off');
    }
  }
  async resetExtraModeGain() {
    for (let g of systemconfig.audio.extra.setGainZero) {
      let inputs = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUT, g);
      for (let i of inputs) {
        i.restoreGain();
      }
    }
  }
  async resetExtraModeStatus() {
    for (let s of systemconfig.audio.extra.setStatusOff) {
      zapi.system.setStatus(s, 'on');
    }
  }


  async init() {
    debug(2, `Core init.`);
    zapi.system.events.emit('system_coreinit');
    var self = this;
    this.uiManager = new UiManager();
    this.systemStatus = new SystemStatus();
    this.audioExtraMode = false;
    this.audioExtraModeRestoreGains = false;
    this.audioExtraModeOutput = undefined;
    this.audioExtraModeInputs = [];
    this.audioExtraSkipPrompt = false;
    await this.uiManager.init();
    await this.systemStatus.init();
    debug(1, 'Setting versions...');
    this.systemStatus.setStatus('CoreVersion', COREVERSION, false);
    this.systemStatus.setStatus('ZapiVersion', ZAPIVERSION, false);
    await this.modules.start();


    xapi.Config.UserInterface.SettingsMenu.Mode.set(systemconfig.system.settingsMenu);


    //Listen for call ended and hdmipassthrough disable
    this.systemStatus.onKeyChg('call', (status) => {
      if (status.value === 'Idle') {
        this.handleCallEnded();
      }
    });

    this.systemStatus.onKeyChg('hdmiPassthrough', (status) => {
      if (status.value !== 'Active') {
        this.handleHDMIPassThroughOff();
      }
    });


    xapi.Event.UserInterface.Message.Prompt.Response.on(event => {
      if (event.FeedbackId == 'system_ask_standby') {
        if (event.OptionId == '1') {
          xapi.Command.Presentation.Stop();
          xapi.Command.Call.Disconnect();
          xapi.Command.Video.Output.HDMI.Passthrough.Stop();
          setTimeout(() => {
            xapi.Command.Standby.Activate();
          }, 2000);
        }
      }
    });
    //Add UI-related mappings


    //Handle hidden admin panel
    let enableAdmin = self.uiManager.addWidgetMapping('SS$PresenterLocation');
    enableAdmin.on('pressed', () => {
      this.adminPanelTimeout = setTimeout(() => {
        xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: 'system_admin' });
      }, 5000);
    });
    enableAdmin.on('released', () => {
      clearTimeout(this.adminPanelTimeout);
    });

    self.uiManager.addActionMapping(/^SETTINGSLOCK$/, () => {
      xapi.Config.UserInterface.SettingsMenu.Mode.set('Locked');
    });

    self.uiManager.addActionMapping(/^SETTINGSUNLOCK$/, () => {
      xapi.Config.UserInterface.SettingsMenu.Mode.set('Unlocked');
    });

    self.uiManager.addActionMapping(/^PRESETSLOCK$/, () => {
      xapi.Config.UserInterface.CameraControl.Presets.Mode.set('Locked');
    });

    self.uiManager.addActionMapping(/^PRESETSUNLOCK/, () => {
      xapi.Config.UserInterface.CameraControl.Presets.Mode.set('Auto');
    });

    self.uiManager.addActionMapping(/^SENDSYSTEMREPORT$/, () => {
      this.sendSystemReport();
    });
    self.uiManager.addActionMapping(/^PANELCLOSE$/, () => {
      xapi.Command.UserInterface.Extensions.Panel.Close();
    });
    self.uiManager.addActionMapping(/^STANDBY$/, async () => {
      let status = await zapi.system.getAllStatus();
      let presentationStatus = status.presentation.type;
      let callStatus = status.call;

      var msg;
      var displayMsg = false;
      if (presentationStatus != 'NOPRESENTATION' && callStatus == 'Idle') {
        msg = str.endSessionPresentation;
        displayMsg = true;
      }
      else if (presentationStatus == 'NOPRESENTATION' && callStatus == 'Connected') {
        msg = str.endSessionCall;
        displayMsg = true;
      }
      else if (presentationStatus != 'NOPRESENTATION' && callStatus == 'Connected') {
        msg = str.endSessionCallPresentation;
        displayMsg = true;
      }

      if (displayMsg) {
        xapi.Command.UserInterface.Message.Prompt.Display({
          Title: str.endSessionTitle,
          Text: msg,
          FeedbackId: 'system_ask_standby',
          "Option.1": str.endSessionChoiceYes,
          "Option.2": str.endSessionChoiceNo
        });

      }
      else {
        xapi.Command.Video.Output.HDMI.Passthrough.Stop();
        xapi.Command.Standby.Activate();


      }

    });
    self.uiManager.addActionMapping(/^PANELOPEN$/, (panelId, pageId) => {
      xapi.Command.UserInterface.Extensions.Panel.Open({
        PanelId: panelId,
        PageId: pageId
      });

    });
    self.uiManager.addActionMapping(/^RESETDEVICES$/, (params) => {
      if (params.includes(',')) {
        params = params.split(',');
      }
      else {
        params = [params];
      }
      for (let d of params) {
        try {
          let tempDevice = zapi.devices.getDevice(d);
          tempDevice.reset();
        }
        catch (e) { }
      }
    });

    //Presenter track
    xapi.Command.UserInterface.Message.TextLine.Clear();
    if (systemconfig.system.usePresenterTrack) {
      let presenterDetected = await xapi.Status.Cameras.PresenterTrack.PresenterDetected.get();
      this.systemStatus.setStatus('PresenterDetected', presenterDetected, false);
      xapi.Status.Cameras.PresenterTrack.PresenterDetected.on(value => {
        if (this.systemStatus.getStatus('PresenterTrackWarnings') == 'on') {
          this.systemStatus.setStatus('PresenterDetected', value);
          this.processPresenterDetectedStatus(value == 'True' ? true : false);
        }
      });
    }
    this.systemStatus.onKeyChg('PresenterTrackWarnings', status => {
      if (status.value == 'off') {
        xapi.Command.UserInterface.Message.TextLine.Clear();
      }
    });
    if (systemconfig.system.forcePresenterTrackActivation) {
      this.systemStatus.onKeyChg('call', status => {
        if (status.value == 'Connected') {
          xapi.Command.Cameras.PresenterTrack.Set({
            Mode: 'Follow'
          });
        }
      });
      this.systemStatus.onKeyChg('hdmipassthrough', status => {
        if (status.value == 'Active') {
          xapi.Command.Cameras.PresenterTrack.Set({
            Mode: 'Follow'
          });
        }
      });
    }

    //Watch DisplaySystemStatus
    zapi.system.onStatusChange(cb => {
      this.displaySystemStatus();
    });
    this.systemStatus.onKeyChg('DisplaySystemStatus', status => {
      this._displaySystemStatus = status.value;
      if (this._displaySystemStatus == 'on') {
        this.displaySystemStatus();
      }
      else {
        this.clearDisplaySystemStatus();
      }
    });

    this.scheduleStandby = () => {
      schedule(systemconfig.system.forceStandbyTime, () => {
        zapi.system.events.emit('system_forcestandby');
        this.scenarios.enableScenario(systemconfig.system.onStandby.enableScenario);
        this.scheduleStandby();
      });
    };
    this.scheduleStandby();

    //Setup devices
    debug(2, `Starting Devices Manager...`);
    this.devicesManager = new DevicesManager();
    this.devicesManager.init();


    //Handle standby
    xapi.Status.Standby.State.on(status => {
      if (status == 'Standby') {
        this.handleStandby();
      }
      else if (status == 'Off') {
        this.handleWakeup();
      }
    });

    //Set DND
    this.setDNDInterval = undefined;
    if (systemconfig.system.onStandby.setDND) {
      this.setDND();
    }

    //Starts devices monitoring

    this.devicesMonitoringInterval = setInterval(async () => {
      zapi.system.events.emit('system_peripheralscheck');
      let missingDevices = await getDisconnectedRequiredPeripherals();
      if (missingDevices.length > 0) {
        zapi.system.events.emit('system_peripheralsmissing', missingDevices);
        this.deviceMissingState = true;
        this.devicesMonitoringMissing(missingDevices);
      }
      else {
        if (this.deviceMissingState == true) {
          this.deviceMissingState = false;
          zapi.system.events.emit('system_peripheralsok');
          xapi.Command.UserInterface.Message.Alert.Clear();
        }

      }
    }, systemconfig.system.requiredPeripheralsCheckInterval);


    zapi.system.setStatus('Uptime', await xapi.Status.SystemUnit.Uptime.get());
    zapi.system.setStatus('Temperature', await xapi.Status.SystemUnit.Hardware.Monitoring.Temperature.Status.get());
    setInterval(async () => {
      zapi.system.setStatus('Uptime', await xapi.Status.SystemUnit.Uptime.get());
      zapi.system.setStatus('Temperature', await xapi.Status.SystemUnit.Hardware.Monitoring.Temperature.Status.get());
    }, 480000);



    //Basic diagnostics
    self.uiManager.addActionMapping(/^VIEWSYSTEMDIAGNOSTICS$/, async () => {
      this.diags = await xapi.Status.Diagnostics.Message.get();
      this.displayNextDiagnosticsMessages();
    });

    xapi.Event.UserInterface.Message.Prompt.Response.on(value => {
      if (value.FeedbackId == 'systemDiagsNext') {
        this.displayNextDiagnosticsMessages();
      }
    });


    //this.modules.start();



    //Handle *extra* room loudspeaker volume
    if (systemconfig.audio.extra.enabled) {
      this.audioExtraModeOutput = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOOUTPUTGROUP, systemconfig.audio.extra.outputGroup)[0];
      this.audioExtraModeInputs = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUTGROUP, systemconfig.audio.extra.inputGroup);

      xapi.Event.UserInterface.Message.Prompt.Response.on(response => {
        if (response.FeedbackId == 'system_overvolume') {
          this.handleOverVolumePromptResponse(response);
        }
        else if (response.FeedbackId == 'system_undervolume') {
          this.handleUnderVolumePromptResponse(response);
        }
      });
      xapi.Event.UserInterface.Message.Prompt.Cleared.on((response) => {
        if (response.FeedbackId == 'system_overvolume') {
          this.handleOverVolumePromptClear();
        }
        else if (response.FeedbackId == 'system_undervolume') {
          this.handleUnderVolumePromptClear();
        }
      });
      xapi.Status.Audio.Volume.on(vol => {
        if (vol > systemconfig.audio.extra.overVolume) {
          this.handleOverVolume();
        }
        else if (vol < systemconfig.audio.extra.overVolume) {
          this.handleUnderVolume();
        }
      });
    }

    this.displaySystemStatus();

  }

  displayNextDiagnosticsMessages() {
    if (this.diags.length > 0) {
      let diag = this.diags.shift();
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        FeedbackId: 'systemDiagsNext',
        "Option.1": 'Prochain message',
        Text: diag.Description,
        Title: diag.Level + " / " + diag.Type
      });
    }
    else {
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        FeedbackId: 'systemDiagsEnd',
        "Option.1": 'Ferner',
        Text: 'Si vous voyez ceci, le logiciel fonctionne.<br>Prennez en note ces messages pour faciliter le dépannage.',
        Title: 'Fin des messages du système'
      });
    }
  }



  async processPresenterDetectedStatus(status) {
    let pts = await xapi.Status.Cameras.PresenterTrack.Status.get();
    if (pts == 'Follow') {
      if (this.systemStatus.getStatus('call') == 'Connected' || this.systemStatus.getStatus('hdmiPassthrough') == 'Active') {
        if (status != this.lastPresenterDetectedStatus) {
          this.lastPresenterDetectedStatus = status;
          if (status == true) {
            if (zapi.system.getStatus('UsePresenterTrack') == 'on' && zapi.system.getStatus('PresenterTrackWarnings') == 'on') {
              this.displayPresenterTrackLockedMessage();
            }
          }
          else {
            if (zapi.system.getStatus('UsePresenterTrack') == 'on' && zapi.system.getStatus('PresenterTrackWarnings') == 'on') {
              this.displayPresenterTrackLostMessage();
            }
          }
        }
      }
      else {
        xapi.Command.UserInterface.Message.TextLine.Clear();
      }
    }
    else if (pts == 'Off') {
      xapi.Command.UserInterface.Message.TextLine.Clear();
    }

  }

  displayPresenterTrackLockedMessage() {
    xapi.Command.UserInterface.Message.TextLine.Clear();
    xapi.Command.UserInterface.Message.TextLine.Display({
      Duration: 5,
      Text: systemconfig.strings.presenterTrackLocked
    });
  }

  displayPresenterTrackLostMessage() {
    xapi.Command.UserInterface.Message.TextLine.Display({
      Duration: 0,
      Text: systemconfig.strings.presenterTrackLost
    });
  }

  handleCallEnded() {
    this.clearPresenterTrackMessages();
  }

  // Fonction pour gérer la désactivation du HDMI pass-through
  handleHDMIPassThroughOff() {
    this.clearPresenterTrackMessages();
  }

  // Fonction pour effacer les messages de Presenter Track
  clearPresenterTrackMessages() {
    xapi.Command.UserInterface.Message.TextLine.Clear();
  }


  devicesMonitoringMissing(devices) {
    var devs = [];
    for (let d of devices) {
      devs.push(d.name);
    }
    xapi.Command.UserInterface.Message.Alert.Display({
      Duration: 0,
      Title: str.devicesMissingTitle,
      Text: str.devicesMissingText + devs.join(', ')
    });
  }

  async loadScenarios() {
    this.scenarios = new Scenarios();
  }

  async loadModules() {
    this.modules = new Modules();
    return (this.modules.init());
  }

  handleStandby() {
    debug(1, 'Entering standby...');
    this.audioExtraSkipPrompt = true;
    if (systemconfig.system.onStandby.setDND) {
      this.setDND();
    }
    if (systemconfig.system.onStandby.clearCallHistory) {
      xapi.Command.CallHistory.DeleteAll();
    }
    this.disableExtraOutput();

    this.scenarios.enableScenario(systemconfig.system.onStandby.enableScenario);
    zapi.system.events.emit('system_standby');
  }

  handleWakeup() {
    debug(1, 'Waking up...');
    this.audioExtraSkipPrompt = false;
    if (this.scenarios.currentScenario == systemconfig.system.onStandby.enableScenario) {
      this.scenarios.enableScenario(systemconfig.system.onWakeup.enableScenario);
    }
    zapi.system.events.emit('system_wakup');
    this.displaySystemStatus();
  }

  setPresenterLocation(location) {
    this.eventPresenterLocationSet(location);
  }
  setDND() {
    this.setDNDInterval = setInterval(() => { this.setDND(); }, 82800000);
    xapi.Command.Conference.DoNotDisturb.Activate({ Timeout: 1440 });
  }

  displaySystemStatus() {
    let allStatus = zapi.system.getAllStatus();
    if (allStatus.DisplaySystemStatus != 'on')
      return;

    xapi.Command.Video.Graphics.Text.Display({
      Target: 'LocalOutput',
      Text: `P:${allStatus.presentation.type} C:${allStatus.call} HPT:${allStatus.hdmiPassthrough} PD:${allStatus.PresenterDetected} PL:${allStatus.PresenterLocation} CPZ:${allStatus.ClearPresentationZone} PM:${allStatus.PresenterMics} AM:${allStatus.AudienceMics}`
    });
  }

  clearDisplaySystemStatus() {
    xapi.Command.Video.Graphics.Text.Display({
      Target: 'LocalOutput',
      Text: ''
    });
  }
}

function configValidityCheck() {
  var valid = true;

  //Check for devices names doubles
  debug(1, `Checking for non-unique device ids...`);
  var doubles = [];
  for (let device of systemconfig.devices) {
    let count = systemconfig.devices.filter(dev => { return device.id == dev.id }).length;
    if (count > 1 && !doubles.includes(device.id)) {
      debug(3, `Device "${device.id}" is declared ${count} times.`);
      doubles.push(device.id);
      valid = false;
    }
  }

  //Check if all devices in groups are declared in devices list
  debug(1, `Checking devices groups for non-declared devices...`);
  for (let group of systemconfig.groups) {
    for (let device of group.devices) {
      if (systemconfig.devices.filter(dev => dev.id == device).length == 0) {
        debug(3, `Device "${device}" in group "${group.id}" is referencing a device that is not declared in the devices list.`);
        valid = false;
      }
    }
  }
  return valid;
}

async function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

async function isPeripheralConnectedInternal(pid) {
  let peripherals = await xapi.Status.Peripherals.get();
  for (let p of peripherals.ConnectedDevice) {
    if ((pid.peripheralId == p.SerialNumber || pid.peripheralId == p.ID) && p.Status == 'Connected') {
      return true;
    }
  }
  return false;
}

async function isPeripheralConnectedHttpRequest(pid) {
  try {
    let httpresponse = await zapi.communication.httpClient.Get({
      AllowInsecureHTTPS: true,
      Timeout: 3,
      Url: pid.peripheralId
    });

    //Check response status code
    if (httpresponse.StatusCode == pid.peripheralCheckStatusCode) {
      return true;
    }
  }
  catch (e) {
    //If it fails, check the status code in the error data structure
    if (e.data.StatusCode == pid.peripheralCheckStatusCode) {
      return true;
    }
    debug(3, `Required peripherals: Device disconnected: ${pid.id}, ID=${pid.peripheralId}, METHOD=httprequest`);
    return false;
  }
  debug(3, `Required peripherals: Device disconnected: ${pid.id}, ID=${pid.peripheralId}, METHOD=httprequest`);
  return false;
}

async function getDisconnectedRequiredPeripherals() {
  var disconnectedPeripherals = [];
  var disconnected = 0;
  let requiredPeripherals = systemconfig.devices.filter(dev => { return dev.peripheralRequired == true });

  for (let rp of requiredPeripherals) {
    let matchCount = 0;
    if (rp.peripheralCheckMethod == 'internal') {
      if (await isPeripheralConnectedInternal(rp)) {
        matchCount++;
      }
    }
    else if (rp.peripheralCheckMethod == 'httprequest') {
      if (await isPeripheralConnectedHttpRequest(rp)) {
        matchCount++;
      }
    }

    if (matchCount == 0) {
      disconnectedPeripherals.push(rp);
      disconnected++;
    }
  }

  return disconnectedPeripherals;
}

async function waitForAllDevicesConnected(disconnectedCallback) {
  return new Promise(async resolve => {
    let discdevs = await getDisconnectedRequiredPeripherals();
    if (await discdevs.length == 0) {
      resolve();
    }
    else {
      var checkInterval = setInterval(async () => {
        let discdevs = await getDisconnectedRequiredPeripherals();
        if (discdevs.length == 0) {
          clearInterval(checkInterval);
          resolve();
        } else {
          disconnectedCallback(discdevs);
        }
      }, systemconfig.system.requiredPeripheralsCheckInterval);
      disconnectedCallback(discdevs);
    }
  });
}

function mcsVersionPeripheralHeartbeat() {
  xapi.Command.Peripherals.HeartBeat(
    {
      ID: 'mcs',
      Timeout: 65535
    });
}

async function preInit() {
  //Register a MCS peripheral to write macros version number to WCH
  xapi.Command.Peripherals.Connect(
    {
      ID: 'mcs',
      Name: `mcs-${COREVERSION}`,
      SoftwareInfo: `mcs-${COREVERSION}`,
      Type: 'ControlSystem'
    });
  mcsVersionPeripheralHeartbeat();

  setInterval(() => {
    mcsVersionPeripheralHeartbeat();
  }, 50000);


  debug(2, `Starting System Events Manager...`);
  systemEvents = new SystemEvents();
  //TAG:ZAPI
  zapi.system.events.on = (event, callback) => { systemEvents.on(event, callback); };
  zapi.system.events.off = (event, callback) => { systemEvents.off(event, callback); };
  zapi.system.events.emit = (event, ...args) => { systemEvents.emit(event, ...args); };

  zapi.system.events.emit('system_preinit');

  /* Storage */
  debug(2, `Starting Storage Manager...`)
  storage = new Storage();
  await storage.init();

  /* HTTP Client Queue */
  httpRequestDispatcher = new HttpRequestDispatcher();



  /* Wakeup system */
  xapi.Command.Standby.Deactivate();
  xapi.Command.UserInterface.Message.Prompt.Display({
    Duration: 0,
    Text: str.systemStartingText,
    Title: str.systemStartingTitle
  });
  await sleep(INITSTEPDELAY);

  xapi.Command.UserInterface.Message.Prompt.Display({
    Duration: 0,
    Text: '',
    Title: str.devicesWaitingTitle,
  });
  await sleep(INITSTEPDELAY);

  await waitForAllDevicesConnected(deviceAlert => {
    let devices = [];
    for (let d of deviceAlert) {
      devices.push(d.name);
    }

    xapi.Command.UserInterface.Message.Prompt.Display({
      Duration: 0,
      Text: devices.join(', '),
      Title: str.devicesWaitingTitle,
    });
  });


  xapi.Command.UserInterface.Message.Prompt.Display({
    Duration: 0,
    Text: str.devicesAllConnectedText,
    Title: str.devicesAllConnectedTitle,
  });
  await sleep(INITSTEPDELAY);

  debug(2, `PreInit started...`);


  clearInterval(coldbootWarningInterval);
  if (systemconfig.system.debugInternalMessages) {
    xapi.Event.Message.Send.Text.on(text => {
      debug(1, `[INTERNAL MESSAGE] ${text}`);
    });
  }

  debug(1, `Checking config validity...`);
  let validConfig = configValidityCheck();

  if (validConfig) {
    zapi.system.events.emit('system_configvalid');
    setTimeout(init, systemconfig.system.initDelay);
    debug(1, `Waiting for init... (${systemconfig.system.initDelay}ms)`);
  }
  else {
    zapi.system.events.emit('system_configinvalid');
    debug(3, `Config is NOT valid. Please review errors above. System will not start.`);
  }

  debug(2, `PreInit finished.`);
}

async function init() {
  zapi.system.events.emit('system_init');
  debug(2, `Init started...`);
  debug(2, `Starting core...`);

  var safeStringify = function (obj, cache = new Set()) {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          // Remove cyclic reference
          return;
        }
        cache.add(value);
      }
      return value;
    });
  }

  zapi.obj2string = safeStringify;


  core = await new Core();
  debug(2, `Loading modules...`);
  await core.loadModules();
  await core.init();

  debug(1, 'Waiting 5 secs...');
  await sleep(5000);

  debug(2, `Loading scenarios...`);
  xapi.Command.UserInterface.Message.Prompt.Clear();
  core.loadScenarios();
  performance.setElapsedEnd('Boot');

  if (systemconfig.system.showStatusAndPerformanceReports) {
    setTimeout(() => {
      debug(2, `POST-BOOT PERFORMANCE REPORT:`);
      debug(2, performance);
      debug(2, `POST-BOOT SYSTEM STATUS REPORT:`);
      debug(2, zapi.system.getAllStatus());
    }, 5000);
    setInterval(() => {
      console.warn(performance);
    }, 240000);
  }


  let bootcount = await storage.read('system.bootcount');
  if (isNaN(bootcount)) {
    bootcount = 0;
  }
  bootcount++;
  zapi.storage.write('system.bootcount', bootcount);

  console.warn(`BOOT COUNTER: ${bootcount}`);

  xapi.Command.Standby.Activate();


  //TESTAREA AFTERBOOT

  /*
        var presenterVoiceWidget = zapi.ui.addWidgetMapping('presentervoice');
        let audioReporter = zapi.devices.getDevice('system.audioreporter.main');
        let ara = zapi.audio.addAudioReportAnalyzer(audioReporter);
        ara.onRawAnalysis(a => {
          console.log(a);
        });
        ara.start();
  */


  /*
    const setupAudioAnalyzer = () => {
      var presenterVoiceWidget = zapi.ui.addWidgetMapping('presentervoice');
      let audioReporter = zapi.devices.getDevice('system.audioreporter.main');
      let ara = new AudioReportAnalyzer(audioReporter);
      ara.addGroup(['system.audio.presentermics', 'system.audio.audiencemics']);
      
      ara.onLoudestGroup(2000, analysis => {
        if (analysis.significant && analysis.group == 'system.audio.presentermics') {
          presenterVoiceWidget.setValue('Détectée');
        }
        else {
          presenterVoiceWidget.setValue('Non détectée');
        }
      });
      
      ara.start();
    }
    setTimeout(setupAudioAnalyzer, 5000);
    */


}



let bootWaitPromptIntervalId; // Using a new name

async function handleBoot() {
  try {
    const uptime = await xapi.Status.SystemUnit.Uptime.get();

    if (uptime > systemconfig.system.coldBootTime) {
      debug(1, 'Warm boot detected, running preInit() now.');
      preInit();
    } else {
      debug(1, `Cold boot detected, running preInit() in ${systemconfig.system.coldBootWait} seconds...`);
      setTimeout(preInit, systemconfig.system.coldBootWait * 1000);
      startColdBootWarning();
    }
  } catch (error) {
    console.error("Error getting uptime:", error);
    // Handle error appropriately
  }
}


async function checkUptimeAndRestart() {
  try {
    const uptime = await xapi.Status.SystemUnit.Uptime.get();
    if (uptime > systemconfig.system.coldBootTime) {
      clearInterval(bootWaitPromptIntervalId); // Using the new name here
      xapi.Command.Macros.Runtime.Restart();
    }
  } catch (error) {
    console.error("Error getting uptime in interval:", error);
    clearInterval(bootWaitPromptIntervalId); // And here
  }
}

function startColdBootWarning() {
  let x = 0; // Declare x here
  const waitChar = '🟦';
  bootWaitPromptIntervalId = setInterval(() => { // Using the new name here to assign the interval ID
    x++;
    xapi.Command.UserInterface.Message.Prompt.Display({
      Duration: 0,
      Text: str.systemStartingColdBootText + '<br>' + waitChar.repeat(x),
      Title: str.systemStartingColdBootTitle,
    });
    checkUptimeAndRestart();
  }, 5000);
}

handleBoot();