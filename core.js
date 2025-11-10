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


const COREVERSION = '1.2.0';
const ZAPIVERSION = 1;
// If true, skip restarting Macro Runtime after cold boot and proceed with scheduled preInit()
const SKIP_FRAMEWORK_RESTART_AFTER_COLD_BOOT = false;

function systemKill() {
  xapi.Command.Macros.Macro.Deactivate({ Name: 'core' });
  xapi.Command.Macros.Runtime.Restart();
}

async function killswitchInit() {
  if (systemconfig.system.killswitchGPIO != undefined) {
    try {
      await xapi.Config.GPIO.Pin[systemconfig.system.killswitchGPIO].Mode.set('InputNoAction');
      let killswitchStatus = await xapi.Status.GPIO.Pin[systemconfig.system.killswitchGPIO].State.get();
      if (killswitchStatus == 'High') {
        systemKill();
      }
      xapi.Status.GPIO.Pin[systemconfig.system.killswitchGPIO].State.on(state => {
        if (state == 'High') {
          systemKill();
        }
      });
    }
    catch (e) {
      debug(3, `killswitchInit() error: ${e}`);
    }
  }
}
//INIT
//GPIO Killswitch check on boot

killswitchInit();


// Watchdog responder moved to the end of init()


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
  try {
    return String(value).toLowerCase() == 'on' ? true : false;
  } catch (e) {
    return false;
  }
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
    // Use a shallow copy to avoid mutation issues if listeners add/remove during emit
    const listeners = this.events.slice();
    for (let e of listeners) {
      if (e.event == event) {
        try {
          const maybePromise = e.callback(...args);
          // Capture async rejections without awaiting
          if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
            maybePromise.catch(err => {
              try { debug(3, `SystemEvents.emit(\"${event}\"): listener error (async): ${err}`); } catch (_) { }
            });
          }
        }
        catch (err) {
          try { debug(3, `SystemEvents.emit(\"${event}\"): listener error (sync): ${err}`); } catch (_) { }
        }
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
          try {
            const maybePromise = map.func(...paramsArray);
            if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
              maybePromise.catch(err => {
                try { debug(3, `UiManager.processAction(\"${act}\"): action handler error (async): ${err}`); } catch (_) { }
              });
            }
          }
          catch (err) {
            try { debug(3, `UiManager.processAction(\"${act}\"): action handler error (sync): ${err}`); } catch (_) { }
          }
        }
      }
    }

    else {
      for (let map of this.actionMaps) {
        if (map.regex.test(act)) {
          try {
            const maybePromise = map.func();
            if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
              maybePromise.catch(err => {
                try { debug(3, `UiManager.processAction(\"${act}\"): action handler error (async): ${err}`); } catch (_) { }
              });
            }
          }
          catch (err) {
            try { debug(3, `UiManager.processAction(\"${act}\"): action handler error (sync): ${err}`); } catch (_) { }
          }
        }
      }
    }
  }

  showProgressBar(title, text, seconds) {
    const totalSteps = 30;
    const interval = seconds * 1000 / totalSteps;
    let currentStep = 0;

    const intervalId = setInterval(() => {
      currentStep++;
      const progressBar = '▓'.repeat(currentStep) + '░'.repeat(totalSteps - currentStep);
      const remainingSeconds = Math.max(0, Math.ceil(seconds - ((currentStep * seconds) / totalSteps)));
      xapi.Command.UserInterface.Message.Prompt.Display({
        Title: title,
        Text: text + '<br>' + progressBar + '<br>' + `Temps restant : ${remainingSeconds}s`
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

    // Mute button admin panel trigger variables
    this.mutePressCount = 0;
    this.muteTimeout = null;
    this.lastMuteState = null;
    this.firstPressTime = null;

    //TAG:ZAPI
    zapi.system.systemReport = {};
    zapi.system.systemReport.systemVersion = COREVERSION;
    zapi.system.sendSystemReport = () => this.sendSystemReport();
    zapi.ui.displayMessage = (title, text) => this.displayMessage(title, text);
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
    if (!this.audioExtraModeOutput) {
      debug(1, 'audioExtraModeOutput is undefined; skipping enableExtraOutput');
      return;
    }
    this.audioExtraModeInputs.forEach(input => {
      try {
        this.audioExtraModeOutput.connectLocalInput(input);
        this.audioExtraModeOutput.updateInputGain(input, input.config.extraGain);
      } catch (e) {
        debug(3, `enableExtraOutput error: ${e}`);
      }
    });
  }

  async disableExtraOutput() {
    if (!this.audioExtraModeOutput) {
      debug(1, 'audioExtraModeOutput is undefined; skipping disableExtraOutput');
      return;
    }
    this.audioExtraModeInputs.forEach(input => {
      try {
        this.audioExtraModeOutput.disconnectLocalInput(input);
      } catch (e) {
        debug(3, `disableExtraOutput error: ${e}`);
      }
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

    this.systemStatus.onKeyChg('byod', (status) => {
      if (status.value !== 'Active') {
        this.handleHDMIPassThroughOff();
      }
    });


    xapi.Event.UserInterface.Message.Prompt.Response.on(event => {
      if (event.FeedbackId == 'system_ask_standby') {
        if (event.OptionId == '1') {
          xapi.Command.Presentation.Stop();
          xapi.Command.Call.Disconnect();
          try {
            xapi.Command.Video.Output.HDMI.Passthrough.Stop();
          } catch (e) {
            // HDMI Passthrough might not be supported on this device
          }
          setTimeout(() => {
            xapi.Command.Standby.Activate();
          }, 2000);
        }
      } else if (event.FeedbackId && event.FeedbackId.startsWith('system_update_folders_p')) {
        // Folder selection or pagination
        try {
          const pageStr = event.FeedbackId.split('system_update_folders_p')[1];
          const pageIdx = parseInt(pageStr, 10) || 0;
          const idx = parseInt(event.OptionId, 10); // 1..5
          const currentStart = pageIdx * 4;

          if (idx === 5) {
            const totalPages = Math.ceil((this._systemUpdateFolders?.length || 0) / 4);
            if (pageIdx < totalPages - 1) {
              this.showSystemUpdateFolderPromptPage(pageIdx + 1);
            } else {
              xapi.Command.UserInterface.Message.Prompt.Clear();
            }
            return;
          }

          const selIndex = currentStart + (idx - 1);
          const folderName = this._systemUpdateFolders && this._systemUpdateFolders[selIndex];
          if (folderName) {
            (async () => { await this.fetchAndShowFilesForFolder(folderName); })();
          }
        } catch (e) {
          try { debug(3, `system_update folder prompt handler error: ${e}`); } catch (_) {}
          this.displayMessage('Mises à jour', 'Erreur lors du traitement de la sélection de système.');
        }
      } else if (event.FeedbackId && event.FeedbackId.startsWith('system_update_files_p')) {
        // File selection or pagination
        try {
          const pageStr = event.FeedbackId.split('system_update_files_p')[1];
          const pageIdx = parseInt(pageStr, 10) || 0;
          const idx = parseInt(event.OptionId, 10); // 1..5
          const currentStart = pageIdx * 4;

          if (idx === 5) {
            const totalPages = Math.ceil((this._systemUpdateFiles?.length || 0) / 4);
            if (pageIdx < totalPages - 1) {
              this.showSystemUpdateFilesPromptPage(pageIdx + 1);
            } else {
              xapi.Command.UserInterface.Message.Prompt.Clear();
            }
            return;
          }

          const selIndex = currentStart + (idx - 1);
          const fileItem = this._systemUpdateFiles && this._systemUpdateFiles[selIndex];
          if (fileItem) {
            this._systemUpdatePendingFile = fileItem; // store for confirmation
            this.showSystemUpdateConfirmPrompt(fileItem);
          }
        } catch (e) {
          try { debug(3, `system_update files prompt handler error: ${e}`); } catch (_) {}
          this.displayMessage('Mises à jour', 'Erreur lors du traitement du fichier sélectionné.');
        }
      } else if (event.FeedbackId === 'system_update_confirm') {
        // Confirmation to apply selected update
        try {
          if (event.OptionId === '1') {
            // Yes
            (async () => { await this.applySelectedUpdate(); })();
          } else {
            // No / Cancel
            this.displayMessage('Mises à jour', 'Mise à jour annulée par l’utilisateur.');
          }
        } catch (e) {
          try { debug(3, `system_update confirm prompt handler error: ${e}`); } catch (_) {}
          this.displayMessage('Mises à jour', 'Erreur lors du traitement de la confirmation.');
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

    //Handle system_admin button short and long press
    let systemAdminButton = self.uiManager.addWidgetMapping('system_admin');
    systemAdminButton.on('pressed', () => {
      this.systemAdminPressTime = Date.now();
      this.systemAdminTimeout = setTimeout(() => {
        this.openAdminPanel();
      }, 5000);
    });
    systemAdminButton.on('released', () => {
      const pressDuration = Date.now() - this.systemAdminPressTime;
      clearTimeout(this.systemAdminTimeout);

      // If released before 5 seconds, show system info (short press)
      if (pressDuration < 5000) {
        this.showSystemInfo();
      }
    });

    // Handle system update button press
    let systemUpdateButton = self.uiManager.addWidgetMapping('system_update');
    systemUpdateButton.on('pressed', async () => {
      try {
        await this.checkAndDisplayAvailableUpdates();
      } catch (e) {
        try { debug(3, `system_update: error: ${e}`); } catch (_) { }
        this.displayMessage('Mises à jour', 'Erreur lors de la vérification des mises à jour.');
      }
    });

    self.uiManager.addActionMapping(/^SETSS$/, (key, value) => {
      zapi.system.setStatus(key, value);
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

    self.uiManager.addActionMapping(/^MSG$/, (title, text) => {
      this.displayMessage(title, text);
    });

    self.uiManager.addActionMapping(/^TESTMSG$/, () => {
      // Test the MSG action with different scenarios
      this.displayMessage('Test Message', 'This is a test message from the MSG action system.<br><b>Bold text test</b><br>Message will stay until dismissed by user.');
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
        try {
          xapi.Command.Video.Output.HDMI.Passthrough.Stop();
        } catch (e) {
          // HDMI Passthrough might not be supported on this device
        }
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
      try {
        let presenterDetected = await xapi.Status.Cameras.PresenterTrack.PresenterDetected.get();
        let presenterDetectedBool = String(presenterDetected).toLowerCase() === 'true';
        this.systemStatus.setStatus('PresenterDetected', presenterDetectedBool, false);
      } catch (e) {
        // PresenterTrack might not be supported on this device
        this.systemStatus.setStatus('PresenterDetected', false, false);
      }
      try {
        xapi.Status.Cameras.PresenterTrack.PresenterDetected.on(value => {
          if (this.systemStatus.getStatus('PresenterTrackWarnings') == 'on') {
            let valBool = String(value).toLowerCase() === 'true';
            this.systemStatus.setStatus('PresenterDetected', valBool);
            this.processPresenterDetectedStatus(valBool);
          }
        });
      } catch (e) {
        // PresenterTrack event listener might not be supported on this device
      }
    }
    this.systemStatus.onKeyChg('PresenterTrackWarnings', status => {
      if (status.value == 'off') {
        xapi.Command.UserInterface.Message.TextLine.Clear();
      }
    });
    if (systemconfig.system.forcePresenterTrackActivation) {
      this.systemStatus.onKeyChg('call', status => {
        if (status.value == 'Connected') {
          try {
            xapi.Command.Cameras.PresenterTrack.Set({
              Mode: 'Follow'
            });
          } catch (e) {
            // PresenterTrack might not be supported on this device
          }
        }
      });
      this.systemStatus.onKeyChg('hdmiPassthrough', status => {
        if (status.value == 'Active') {
          try {
            xapi.Command.Cameras.PresenterTrack.Set({
              Mode: 'Follow'
            });
          } catch (e) {
            // PresenterTrack might not be supported on this device
          }
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
      if (!this.audioExtraModeOutput) {
        debug(3, `Audio extra mode output group not found or empty: ${systemconfig.audio.extra.outputGroup}`);
      }

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

    // Initialize mute button monitoring for admin panel trigger
    this.initMuteButtonMonitoring();

  }

  async checkAndDisplayAvailableUpdates() {
    try {
      // Inform user while fetching
      xapi.Command.UserInterface.Message.Alert.Display({
        Duration: 3,
        Title: 'Mises à jour',
        Text: 'Vérification des systèmes disponibles...'
      });

      const url = 'https://api.github.com/repos/ZacharieGignac/MCS/contents/releases?ref=main';
      const response = await zapi.communication.httpClient.Get({
        AllowInsecureHTTPS: true,
        Url: url,
        Timeout: 10,
        Header: [
          'User-Agent: MCS-Device',
          'Accept: application/vnd.github.v3+json'
        ]
      });

      let folders = [];
      try {
        const body = JSON.parse(response.Body);
        if (Array.isArray(body)) {
          // Keep only directories (versions)
          folders = body.filter(item => item.type === 'dir').map(item => item.name);
        }
      } catch (parseErr) {
        try { debug(3, `checkAndDisplayAvailableUpdates: JSON parse error: ${parseErr}`); } catch (_) { }
      }

      if (!folders || folders.length === 0) {
        this.displayMessage('Mises à jour', 'Aucun système n\'a été trouvé dans \'releases\'.');
        return;
      }

      // Store folders and show first page of prompt options
      this._systemUpdateFolders = folders;
      this._systemUpdateFoldersPage = 0;
      this._systemUpdateSelectedFolder = undefined;
      this.showSystemUpdateFolderPromptPage(0);
    } catch (error) {
      try { debug(3, `checkAndDisplayAvailableUpdates: request error: ${error}`); } catch (_) { }
      this.displayMessage('Mises à jour', 'Impossible d\'accéder à GitHub pour vérifier les mises à jour.');
    }
  }

  showSystemUpdateFolderPromptPage(pageIndex) {
    if (!Array.isArray(this._systemUpdateFolders) || this._systemUpdateFolders.length === 0) {
      this.displayMessage('Mises à jour', 'Aucun système n\'a été trouvé.');
      return;
    }

    const pageSize = 4; // 4 folders per page, 5th reserved for Next
    const totalPages = Math.ceil(this._systemUpdateFolders.length / pageSize);
    const page = Math.max(0, Math.min(pageIndex, totalPages - 1));
    this._systemUpdateFoldersPage = page;

    const start = page * pageSize;
    const slice = this._systemUpdateFolders.slice(start, start + pageSize);

    const promptParams = {
      Duration: 0,
      Title: 'Systèmes disponibles',
      Text: `Choisissez un système (page ${page + 1}/${totalPages})`
    };

    slice.forEach((fname, i) => {
      promptParams[`Option.${i + 1}`] = fname;
    });

    if (page < totalPages - 1) {
      promptParams['Option.5'] = 'Suivant';
    } else {
      promptParams['Option.5'] = 'Fermer';
    }

    promptParams['FeedbackId'] = `system_update_folders_p${page}`;

    try {
      xapi.Command.UserInterface.Message.Prompt.Display(promptParams);
    } catch (e) {
      try { debug(3, `showSystemUpdateFolderPromptPage error: ${e}`); } catch (_) {}
      this.displayMessage('Mises à jour', 'Erreur d\'affichage de la liste des systèmes.');
    }
  }

  async fetchAndShowFilesForFolder(folderName) {
    try {
      this._systemUpdateSelectedFolder = folderName;
      const url = `https://api.github.com/repos/ZacharieGignac/MCS/contents/releases/${encodeURIComponent(folderName)}?ref=main`;
      const response = await zapi.communication.httpClient.Get({
        AllowInsecureHTTPS: true,
        Url: url,
        Timeout: 10,
        Header: [
          'User-Agent: MCS-Device',
          'Accept: application/vnd.github.v3+json'
        ]
      });

      let files = [];
      try {
        const body = JSON.parse(response.Body);
        if (Array.isArray(body)) {
          // keep full file objects we need (name + download_url)
          files = body
            .filter(item => item.type === 'file')
            .map(item => ({ name: item.name, download_url: item.download_url, path: item.path }));
        }
      } catch (parseErr) {
        try { debug(3, `fetchAndShowFilesForFolder: JSON parse error: ${parseErr}`); } catch (_) {}
      }

      if (!files || files.length === 0) {
        this.displayMessage('Mises à jour', `Aucun fichier disponible pour le système: ${folderName}`);
        return;
      }

      this._systemUpdateFiles = files;
      this._systemUpdateFilesPage = 0;
      this.showSystemUpdateFilesPromptPage(0);
    } catch (e) {
      try { debug(3, `fetchAndShowFilesForFolder error: ${e}`); } catch (_) {}
      this.displayMessage('Mises à jour', 'Erreur lors du chargement des fichiers du système.');
    }
  }

  showSystemUpdateFilesPromptPage(pageIndex) {
    if (!Array.isArray(this._systemUpdateFiles) || this._systemUpdateFiles.length === 0) {
      this.displayMessage('Mises à jour', 'Aucun fichier à afficher.');
      return;
    }

    const pageSize = 4; // 4 files per page, 5th reserved for Next
    const totalPages = Math.ceil(this._systemUpdateFiles.length / pageSize);
    const page = Math.max(0, Math.min(pageIndex, totalPages - 1));
    this._systemUpdateFilesPage = page;

  const start = page * pageSize;
  const slice = this._systemUpdateFiles.slice(start, start + pageSize);

    const folderName = this._systemUpdateSelectedFolder || '';
    const promptParams = {
      Duration: 0,
      Title: 'Fichiers disponibles',
      Text: `Système: ${folderName} (page ${page + 1}/${totalPages})`
    };

    slice.forEach((f, i) => {
      promptParams[`Option.${i + 1}`] = f.name;
    });

    if (page < totalPages - 1) {
      promptParams['Option.5'] = 'Suivant';
    } else {
      promptParams['Option.5'] = 'Fermer';
    }

    promptParams['FeedbackId'] = `system_update_files_p${page}`;

    try {
      xapi.Command.UserInterface.Message.Prompt.Display(promptParams);
    } catch (e) {
      try { debug(3, `showSystemUpdateFilesPromptPage error: ${e}`); } catch (_) {}
      this.displayMessage('Mises à jour', 'Erreur d\'affichage de la liste des fichiers.');
    }
  }

  showSystemUpdateConfirmPrompt(fileItem) {
    const folderName = this._systemUpdateSelectedFolder || '';
    const fileName = fileItem?.name || String(fileItem);
    xapi.Command.UserInterface.Message.Prompt.Display({
      Duration: 0,
      Title: 'Confirmer la mise à jour',
      Text: `Êtes-vous absolument certain de vouloir appliquer cette mise à jour ?<br>Système: ${folderName}<br>Fichier: ${fileName}`,
      FeedbackId: 'system_update_confirm',
      'Option.1': 'Oui',
      'Option.2': 'Non'
    });
  }

  async applySelectedUpdate() {
    try {
      const folderName = this._systemUpdateSelectedFolder;
      const fileItem = this._systemUpdatePendingFile;
      if (!folderName || !fileItem) {
        this.displayMessage('Mises à jour', 'Aucun fichier sélectionné.');
        return;
      }

      // Resolve a direct download URL
      // Prefer GitHub API-provided download_url; if missing, construct raw URL to the file in main branch
      let downloadUrl = fileItem.download_url;
      if (!downloadUrl) {
        downloadUrl = `https://raw.githubusercontent.com/ZacharieGignac/MCS/main/releases/${encodeURIComponent(folderName)}/${encodeURIComponent(fileItem.name)}`;
      }

      // Show a short progress/info prompt
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        Title: 'Mise à jour',
        Text: `Téléchargement et application de la mise à jour...<br>${fileItem.name}`,
        FeedbackId: 'system_update_running'
      });

      // Apply update using Provisioning Service Fetch
      // See: Command.Provisioning.Service.Fetch
      await xapi.Command.Provisioning.Service.Fetch({
        URL: downloadUrl
      });

      // Clear the running prompt before showing success message
      try { xapi.Command.UserInterface.Message.Prompt.Clear(); } catch (_) {}
      // Success message
      this.displayMessage('Mise à jour', 'La mise à jour a été demandée avec succès. Le système peut redémarrer ou appliquer des changements automatiquement.');
    } catch (e) {
      try { debug(3, `applySelectedUpdate error: ${e}`); } catch (_) {}
      this.displayMessage('Mises à jour', 'Échec lors de l\'application de la mise à jour.');
    }
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
    try {
      let pts = await xapi.Status.Cameras.PresenterTrack.Status.get();
      if (pts == 'Follow') {
        if (this.systemStatus.getStatus('call') == 'Connected' || this.systemStatus.getStatus('byod') == 'Active') {
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
    } catch (e) {
      // PresenterTrack Status might not be supported on this device
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
      try {
        xapi.Command.CallHistory.DeleteAll();
      } catch (e) {
        // CallHistory might not be supported on this device
      }
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
    zapi.system.events.emit('system_wakeup');
    this.displaySystemStatus();

  }

  setPresenterLocation(location) {
    const normalized = String(location).toLowerCase();
    if (normalized !== 'local' && normalized !== 'remote') {
      debug(3, `setPresenterLocation(): invalid value "${location}"`);
      return;
    }
    zapi.system.setStatus('PresenterLocation', normalized);
  }

  setDND() {
    this.setDNDInterval = setInterval(() => { this.setDND(); }, 82800000);
    try {
      xapi.Command.Conference.DoNotDisturb.Activate({ Timeout: 1440 });
    } catch (e) {
      // DoNotDisturb might not be supported on this device
    }
  }

  displaySystemStatus() {
    let allStatus = zapi.system.getAllStatus();
    if (allStatus.DisplaySystemStatus != 'on')
      return;

    try {
      // Format system status with better readability and organization
      const statusText = this.formatSystemStatusText(allStatus);

      xapi.Command.Video.Graphics.Text.Display({
        Target: 'LocalOutput',
        Text: statusText
      });
    } catch (e) {
      // Video.Graphics.Text.Display might not be supported on this device
    }
  }

  formatSystemStatusText(allStatus) {
    // Helper function to format boolean values
    const formatBool = (value) => value ? 'ON' : 'OFF';

    // Helper function to format status values with better readability
    const formatStatus = (value, trueText = 'ON', falseText = 'OFF') => {
      if (typeof value === 'boolean') {
        return value ? trueText : falseText;
      }
      return value || 'N/A';
    };

    // Build compact single-line status display with most critical information
    const statusParts = [
      `CALL:${formatStatus(allStatus.call)}`,
      `PRES:${formatStatus(allStatus.presentation?.type, 'NOPRES')}`,
      `BYOD:${formatStatus(allStatus.byod)}`,
      `PD:${formatBool(allStatus.PresenterDetected)}`,
      `PL:${formatStatus(allStatus.PresenterLocation)}`,
      `SCE:${formatStatus(allStatus.currentScenario)}`,
      `MODE:${formatStatus(allStatus.comotype1Mode)}`
    ];

    return statusParts.join(' | ');
  }

  clearDisplaySystemStatus() {
    try {
      xapi.Command.Video.Graphics.Text.Display({
        Target: 'LocalOutput',
        Text: ''
      });
    } catch (e) {
      // Video.Graphics.Text.Display might not be supported on this device
    }
  }

  async initMuteButtonMonitoring() {
    // Get initial mute state
    try {
      this.lastMuteState = await xapi.Status.Audio.Microphones.Mute.get();
    } catch (error) {
      // Silent error handling
    }

    // Monitor mute status changes
    xapi.Status.Audio.Microphones.Mute.on((muteState) => {
      this.handleMuteStateChange(muteState);
    });
  }

  handleMuteStateChange(newMuteState) {
    // Only count when mute is turned OFF (unmuting the system)
    if (newMuteState === 'Off' && this.lastMuteState === 'On') {
      this.handleUnmuteAction();
    }

    this.lastMuteState = newMuteState;
  }

  handleUnmuteAction() {
    const currentTime = Date.now();

    // If this is the first unmute, start the 10-second window
    if (this.mutePressCount === 0) {
      this.firstPressTime = currentTime;
    }

    // Increment unmute count
    this.mutePressCount++;

    // Check if we've reached 5 unmutes
    if (this.mutePressCount >= 5) {
      this.triggerAdminPanel();
      this.resetMuteCounter();
      return;
    }

    // Check if we're still within the 10-second window
    const timeElapsed = currentTime - this.firstPressTime;
    if (timeElapsed >= 10000) {
      this.resetMuteCounter();
      return;
    }

    // Set timeout to reset counter when the 10-second window expires
    if (this.muteTimeout) {
      clearTimeout(this.muteTimeout);
    }
    const remainingTime = 10000 - timeElapsed;
    this.muteTimeout = setTimeout(() => {
      this.resetMuteCounter();
    }, remainingTime);
  }

  resetMuteCounter() {
    this.mutePressCount = 0;
    this.firstPressTime = null;
    if (this.muteTimeout) {
      clearTimeout(this.muteTimeout);
      this.muteTimeout = null;
    }
  }

  triggerAdminPanel() {
    // Use the PANELOPEN action to open the system_admin panel
    xapi.Command.UserInterface.Extensions.Panel.Open({
      PanelId: 'system_admin'
    });

    // Show a brief message to confirm the action
    xapi.Command.UserInterface.Message.TextLine.Display({
      Duration: 3,
      Text: 'Admin panel opened',
      X: 10000,
      Y: 1
    });
  }

  openAdminPanel() {
    // Open the system_admin panel via long press on system_admin button
    xapi.Command.UserInterface.Extensions.Panel.Open({
      PanelId: 'system_admin'
    });

    // Show a confirmation message
    xapi.Command.UserInterface.Message.TextLine.Display({
      Duration: 3,
      Text: 'Admin panel opened via long press',
      X: 10000,
      Y: 1
    });

    debug(1, 'Admin panel opened via system_admin button long press');
  }

  showSystemInfo() {
    // Display system information in a message box on short press
    const systemInfo = this.getSystemInfoText();

    xapi.Command.UserInterface.Message.Prompt.Display({
      Duration: 0,
      Text: systemInfo,
      Title: 'Informations système',
      FeedbackId: 'system_info_display'
    });

    debug(1, 'System information displayed via system_admin button short press');
  }

  getSystemInfoText() {
    // Gather system information for display
    const allStatus = zapi.system.getAllStatus();
    const currentScenario = allStatus.currentScenario || 'Unknown';
    const coreVersion = allStatus.CoreVersion || 'Unknown';
    const uptime = allStatus.Uptime || 'Unknown';
    const temperature = allStatus.Temperature || 'Unknown';
    const presenterLocation = allStatus.PresenterLocation || 'Unknown';
    const presenterDetected = allStatus.PresenterDetected ? 'Yes' : 'No';
    const byod = allStatus.byod || 'Unknown';
    const call = allStatus.call || 'Unknown';
    const comotype1Mode = allStatus.comotype1Mode || 'Unknown';

    // Format with better organization and readability
    return `Version: ${coreVersion}<br>` +
      `Uptime: ${uptime}<br>` +
      `Temperature: ${temperature}`
  }

  displayMessage(title, text) {
    try {
      // Validate parameters
      if (!title || !text) {
        debug(3, 'MSG action error: title and text parameters are required');
        return;
      }

      // Log the message display for debugging
      debug(2, `MSG action: Displaying message - Title: "${title}"`);

      // xAPI prompts don't support raw newlines in parameters
      const safeTitle = String(title).replace(/\r?\n/g, ' / ');
      const safeText = String(text).replace(/\r?\n/g, '<br>');

      // Display the message (always persistent - user must dismiss)
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        Title: safeTitle,
        Text: safeText,
        FeedbackId: 'msg_action_display'
      });

    } catch (error) {
      debug(3, `MSG action error: ${error}`);

      // Fallback: try to display a simple alert if prompt fails
      try {
        xapi.Command.UserInterface.Message.Alert.Display({
          Duration: 5,
          Title: title || 'Message',
          Text: text || 'An error occurred displaying the message'
        });
      } catch (fallbackError) {
        debug(3, `MSG action fallback error: ${fallbackError}`);
      }
    }
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


  clearInterval(bootWaitPromptIntervalId);


  xapi.Event.Message.Send.Text.on(text => {
    try {
      if (systemconfig.system.debugInternalMessages) {
        debug(1, `[INTERNAL MESSAGE] ${text}`);
      }
      if (typeof text === 'string') {
        let actionMatch;
        let actionsMatch;
        try {
          actionMatch = text.match(/MCSACTION\$(.+)/);
          actionsMatch = text.match(/MCSACTIONS\$(.+)/);
        }
        catch (e) {
          try { debug(3, `[InternalMsg] Regex parse error: ${e}`); } catch (_) { }
          return;
        }

        if (actionMatch) {
          if (core && core.uiManager && core.uiManager.processMatchAction) {
            try {
              const maybePromise = core.uiManager.processMatchAction('ACTION$' + actionMatch[1]);
              if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
                maybePromise.catch(err => {
                  try { debug(3, `[InternalMsg] ACTION handler error (async): ${err}`); } catch (_) { }
                });
              }
            }
            catch (e) {
              try { debug(3, `[InternalMsg] ACTION handler error (sync): ${e}`); } catch (_) { }
            }
          }
        } else if (actionsMatch) {
          if (core && core.uiManager && core.uiManager.processMatchAction) {
            try {
              const maybePromise = core.uiManager.processMatchAction('ACTIONS$' + actionsMatch[1]);
              if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
                maybePromise.catch(err => {
                  try { debug(3, `[InternalMsg] ACTIONS handler error (async): ${err}`); } catch (_) { }
                });
              }
            }
            catch (e) {
              try { debug(3, `[InternalMsg] ACTIONS handler error (sync): ${e}`); } catch (_) { }
            }
          }
        }
      }
    }
    catch (e) {
      try { debug(3, `[InternalMsg] Dispatcher error: ${e}`); } catch (_) { }
    }
  });

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

  // Watchdog responder: reply to watchdog pings only once init is complete
  debug(1, '[Watchdog] Registering PING responder (post-init)');
  xapi.Event.Message.Send.Text.on(text => {
    if (text === 'MCS_WD_PING') {
      debug(1, '[Watchdog] Received PING -> sending PONG');
      try {
        xapi.Command.Message.Send({ Text: 'MCS_WD_PONG' });
      }
      catch (e) {
        debug(3, `[Watchdog] Error sending PONG: ${e}`);
      }
    }
  });


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
      if (!SKIP_FRAMEWORK_RESTART_AFTER_COLD_BOOT) {
        clearInterval(bootWaitPromptIntervalId); // Using the new name here
        xapi.Command.Macros.Runtime.Restart();
      }
    }
  } catch (error) {
    console.error("Error getting uptime in interval:", error);
    clearInterval(bootWaitPromptIntervalId); // And here
  }
}

function startColdBootWarning() {
  const totalSteps = 30;
  const totalSeconds = systemconfig.system.coldBootWait;
  const interval = (totalSeconds * 1000) / totalSteps;
  let currentStep = 0;

  bootWaitPromptIntervalId = setInterval(() => {
    currentStep++;
    const progressBar = '▓'.repeat(currentStep) + '░'.repeat(totalSteps - currentStep);
    const remainingSeconds = Math.max(0, Math.ceil(totalSeconds - ((currentStep * totalSeconds) / totalSteps)));
    xapi.Command.UserInterface.Message.Prompt.Display({
      Duration: 0,
      Text: str.systemStartingColdBootText + '<br>' + progressBar + '<br>' + `Temps restant : ${remainingSeconds}s`,
      Title: str.systemStartingColdBootTitle,
    });
    checkUptimeAndRestart();

    if (currentStep >= totalSteps) {
      clearInterval(bootWaitPromptIntervalId);
    }
  }, interval);
}

handleBoot();