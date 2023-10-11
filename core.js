import xapi from 'xapi';
import { DevicesManager } from './devices';
import { config, VERSION, PRODUCT } from './config';
import { Scenarios } from './scenarios'
import { SystemStatus } from './systemstatus';
import { zapiv1 } from './zapi';

var zapi = zapiv1;

const DEBUGLEVEL = {
  LOW: 3,
  MEDIUM: 2,
  HIGH: 1,
  NONE: 0
}

const INITSTEPDELAY = 500;

var coldbootWarningInterval = undefined;
var core;

function debug(level, text) {
  if (config.system.debugLevel != 0 && level >= config.system.debugLevel) {
    switch (level) {
      case 1:
        console.log(text);
        break;
      case 2:
        console.warn(text);
        break;
      case 3:
        console.error(text);
        break;
    }

  }
}


class Performance {
  constructor() {
    this.counters = [];
    this.elapsedStarts = [];
  }
  setElapsedStart(name) {
    this.elapsedStarts[name] = new Date();
  }
  setElapsedEnd(name) {

    this.counters[name] = new Date() - this.elapsedStarts[name];
    this.counters[name] = this.counters[name] + 'ms';
    delete this.elapsedStarts[name];
  }
  clearElapsed(name) {

  }
  setCounter(name, value) {
    this.counters[name] = value;
  }
  getCounter(name) {
    return this.counters[name];
  }
  inc(name, num = 1) {
    if (this.counters[name] != undefined) {
      this.counters[name] += num;
    }
    else {
      this.counters[name] = num;
    }
  }
  dec(name, num = 1) {
    if (this.counters[name] != undefined) {
      this.counters[name] -= num;
    }
    else {
      this.counters[name] = num;
    }
  }
}
var performance = new Performance();
performance.setElapsedStart('Boot');
var progress = 0;
var timedProgressBar;
function displayTimedProgressBar(title, time) {
  timedProgressBar = setInterval(() => {
    var done = '🟦'.repeat(progress);
    var notdone = '⬛'.repeat(20 - progress);
    xapi.Command.UserInterface.Message.Prompt.Display({
      title: title,
      text: done + notdone,
      FeedbackId: 'TimedProgressBar'
    });
    progress++;

    if (progress == 21) {
      progress = 0;
      done = '';
      clearInterval(timedProgressBar);
      xapi.Command.UserInterface.Message.Prompt.Clear({ FeedbackId: 'TimedProgressBar' });
    }
  }, time / 20);
}


class MessageQueue {
  constructor() {
    this.queue = [];
    this.sending = false;
  }

  send(text) {
    this.queue.push(text);
    if (!this.sending) {
      this.sendNextMessage();
    }
  }

  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }
    const message = this.queue.shift();
    xapi.Command.Message.Send({ Text: message });
    this.sending = true;
    setTimeout(() => {
      this.sendNextMessage();
    }, config.system.messagesPacing);
  }
}



class Audio {
  constructor() {

  }

  getLocalInputId(name) {
    return new Promise((success, failure) => {
      xapi.Status.Audio.Input.LocalInput.get().then(li => {
        for (let i of li) {
          if (i.Name == name) {
            success(i.id);
          }
        }
        failure('LocalInput not found: ' + name);
      });
    });
  }

  getLocalOutputId(name) {
    return new Promise((success, failure) => {
      xapi.Status.Audio.Output.LocalOutput.get().then(lo => {
        for (let o of lo) {
          if (o.Name == name) {
            success(o.id);
          }
        }
        failure('LocalOutput not found: ' + name);
      });
    });
  }

  getRemoteInputsIds() {
    return new Promise((success, failure) => {
      var inputs = [];
      xapi.Status.Audio.Input.RemoteInput.get().then(ri => {
        for (let r of ri) {
          inputs.push(r.id);
        }
        if (inputs.length > 0) {
          success(inputs);
        }
        else {
          failure('No remote inputs found.');
        }
      });
    });
  }

  getRemoteOutputIds() {
    return new Promise((success, failure) => {
      var outputs = [];
      xapi.Status.Audio.Output.RemoteOutput.get().then(ro => {
        for (let r of ro) {
          outputs.push(r.id);
        }
        if (outputs.length > 0) {
          success(outputs);
        }
        else {
          failure('No remote output found.');
        }
      });
    });
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
    return new Promise(success => {
      //Build widgets cache
      xapi.Command.UserInterface.Extensions.List({}).then(list => {
        for (let panel of list.Extensions.Panel) {
          if (panel.Page) {
            for (let page of panel.Page) {
              if (page.Row) {
                for (let row of page.Row) {
                  if (row.Widget) {
                    for (let widget of row.Widget) {
                      this.allWidgets.push({ widgetId: widget.WidgetId, type: widget.Type });
                    }
                  }
                }
              }
            }
          }
        }
        xapi.Event.UserInterface.on(event => { this.forwardUiEvents(event); });
        this.onUiEvent((event) => this.parseUiEvent(event));
        zapi.ui.addActionMapping = (regex, func) => { this.addActionMapping(regex, func) }
        zapi.ui.setWidgetValue = (widgetId, value) => { this.setWidgetValue(widgetId, value) }
        zapi.ui.getAllWidgets = () => { return this.getAllWidgets() }
        zapi.ui.addWidgetMapping = (widgetId) => { return this.addWidgetMapping(widgetId) }
        success();
      });
    });
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
        xapi.Command.UserInterface.Extensions.Widget.SetValue({
          WidgetId: w.widgetId,
          Value: value
        });
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
    if (event.Extensions?.Widget?.Action?.Type == 'pressed') {
      eventId = event.Extensions.Widget.Action.WidgetId;
      this.processMatchAction(eventId);

    }
    else if (event.Extensions?.Panel?.Clicked) {
      eventId = event.Extensions.Panel.Clicked.PanelId;
      this.processMatchAction(eventId);
    }

    if (event.Extensions?.Widget?.Action) {
      this.processWidgetMappingsEvent(event.Extensions.Widget.Action);
      //UGLY FIX
      eventId = event.Extensions.Widget.Action.WidgetId;
      if (eventId.includes('|')) {
        eventId = eventId.split('|')[1];
      }
      if (eventId.startsWith('SS$')) {
        zapi.system.setStatus(eventId, event.Extensions.Widget.Action.Value);
      }
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
}




class Core {
  constructor() {
    var that = this;
    var self = this;
    this.messageQueue = new MessageQueue();
    this.audio = new Audio();

    zapi.performance.setElapsedStart = (test) => { performance.setElapsedStart(test) };
    zapi.performance.setElapsedEnd = (test) => { performance.setElapsedEnd(test) };
    zapi.performance.inc = (name, num) => { performance.inc(name, num) };
    zapi.performance.dec = (name, num) => { performance.dec(name, num) };
    zapi.system.sendMessage = (message) => { self.messageQueue.send(message) };
    zapi.audio.getLocalInputId = (name) => { return self.audio.getLocalInputId(name) };
    zapi.audio.getLocalOutputId = (name) => { return self.audio.getLocalOutputId(name) };
    zapi.audio.getRemoteInputsIds = () => { return self.audio.getRemoteInputsIds() };
    zapi.audio.getRemoteOutputIds = () => { return self.audio.getRemoteOutputIds() };

    this.lastPresenterDetectedStatus = false;


    zapi.system.systemReport = {};
    zapi.system.systemReport.systemVersion = VERSION;
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

    console.log(`Sending system report...`);
    xapi.Command.UserInterface.Message.Alert.Display({
      Title: 'Rapport système',
      Text: 'Envoi du rapport en cours...'
    });
    let allDevices = zapi.devices.getAllDevices();
    zapi.system.systemReport.devices = allDevices;
    zapi.system.systemReport.systemStatus = zapi.system.getAllStatus();
    zapi.system.systemReport.codecConfig = codecConfig;
    zapi.system.systemReport.codecStatus = codecStatus;

    var data = this.safeStringify(zapi.system.systemReport);
    var key = config.system.systemReportApiKey;
    var url = 'https://api.paste.ee/v1/pastes'
    var body = {
      "description": systemunitName + ' - ' + date,
      "sections": [{
        "name": "Section1",
        "syntax": "autodetect",
        "contents": data
      }]
    }

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
          Title: 'Rapport système',
          Text: 'Envoi réussi!<br>Référence: ' + resultObj.id
        });
        console.log(resultObj.link);
      }
      else {
        xapi.Command.UserInterface.Message.Alert.Display({
          Title: 'Rapport système',
          Text: "Échec de l'envoi."
        });
      }
    }).catch(error => {
      xapi.Command.UserInterface.Message.Alert.Display({
        Title: 'Rapport système',
        Text: "Échec de l'envoi."
      });
    });

    delete(zapi.system.systemReport.codecConfig);
    delete(zapi.system.systemReport.codecStatus);


  }



  async init() {
    var self = this;
    this.uiManager = new UiManager();
    this.systemStatus = new SystemStatus();
    await this.uiManager.init();
    await this.systemStatus.init();

    //Add UI-related mappings
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

      var msg = undefined;
      if (presentationStatus != 'NOPRESENTATION' && callStatus == 'Idle') {
        msg = 'Ceci mettra fin à votre présentation.<br>Terminer la session ?';
      }
      else if (presentationStatus == 'NOPRESENTATION' && callStatus == 'Connected') {
        msg = 'Ceci mettra fin aux communications.<br>Terminer la session ?';
      }
      else if (presentationStatus != 'NOPRESENTATION' && callStatus == 'Connected') {
        msg = 'Ceci mettra fin à votre présentation et aux communications.<br>Terminer la session ?';
      }

      if (msg != undefined) {
        xapi.Command.UserInterface.Message.Prompt.Display({
          Title: 'Terminer la session ?',
          Text: msg,
          FeedbackId: 'system_ask_standby',
          "Option.1": 'Oui (Terminer la session)',
          "Option.2": 'Non (Annuler)'
        });
        xapi.Event.UserInterface.Message.Prompt.Response.on(event => {
          if (event.FeedbackId == 'system_ask_standby') {
            if (event.OptionId == '1') {
              xapi.Command.Presentation.Stop();
              xapi.Command.Call.Disconnect();
              setTimeout(() => {
                xapi.Command.Standby.Activate();
              }, 2000);

            }
          }
        });
      }
      else {
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
        catch { }
      }
    });

    //Presenter track
    xapi.Command.UserInterface.Message.TextLine.Clear();
    if (config.system.usePresenterTrack) {
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
    if (config.system.forcePresenterTrackActivation) {
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
    zapi.system.enablePresenterTrackWarning = () => {
      debug(1, `Enabling presenter tracking`);
      this.systemStatus.setStatus('PresenterTrackWarnings', 'on');
      xapi.Command.Cameras.PresenterTrack.Set({
        Mode: 'Follow'
      });
    }
    zapi.system.disablePresenterTrackWarning = () => {
      debug(1, `Disabling presenter tracking`);
      this.systemStatus.setStatus('PresenterTrackWarnings', 'off');
      xapi.Command.Cameras.PresenterTrack.Set({
        Mode: 'Off'
      });
    }

    //Setup devices
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
    if (config.system.onStandby.setDND) {
      this.setDND();
    }

    //Starts devices monitoring
    this.devicesMonitoringInterval = setInterval(async () => {
      let missingDevices = await getDisconnectedRequiredPeripherals();
      if (missingDevices.length > 0) {
        this.deviceMissingState = true;
        this.devicesMonitoringMissing(missingDevices);
      }
      else {
        if (this.deviceMissingState == true) {
          this.deviceMissingState = false;
          xapi.Command.UserInterface.Message.Alert.Clear();
        }

      }
    }, config.system.requiredPeripheralsCheckInterval);

    zapi.system.setStatus('Uptime', await xapi.Status.SystemUnit.Uptime.get());
    zapi.system.setStatus('Temperature', await xapi.Status.SystemUnit.Hardware.Monitoring.Temperature.Status.get());
    setInterval(async () => {
      zapi.system.setStatus('Uptime', await xapi.Status.SystemUnit.Uptime.get());
      zapi.system.setStatus('Temperature', await xapi.Status.SystemUnit.Hardware.Monitoring.Temperature.Status.get());
    }, 480000);



    //Basic diagnostics
    zapi.ui.addWidgetMapping('system:DIAGNOSTICS').on('clicked', async () => {
      this.diags = await xapi.Status.Diagnostics.Message.get();
      this.displayNextDiagnosticsMessages();
    });

    xapi.Event.UserInterface.Message.Prompt.Response.on(value => {
      if (value.FeedbackId == 'systemDiagsNext') {
        this.displayNextDiagnosticsMessages();
      }
    });

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



  processPresenterDetectedStatus(status) {
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
  }

  displayPresenterTrackLockedMessage() {
    xapi.Command.UserInterface.Message.TextLine.Clear();
    xapi.Command.UserInterface.Message.TextLine.Display({
      Duration: 5,
      Text: config.strings.presenterTrackLocked
    });
  }

  displayPresenterTrackLostMessage() {
    xapi.Command.UserInterface.Message.TextLine.Display({
      Duration: 0,
      Text: config.strings.presenterTrackLost
    });
  }

  devicesMonitoringMissing(devices) {
    var devs = [];
    for (let d of devices) {
      devs.push(d.name);
    }
    xapi.Command.UserInterface.Message.Alert.Display({
      Duration: 0,
      Title: '🚩 Problème du système 🚩',
      Text: `Contactez votre soutien technique.<br>Périphériques indisponibles:<br>${devs.join(', ')}`
    });
  }

  loadScenarios() {
    //Load Scenarios
    let self = this;
    this.scenarios = new Scenarios();
  }

  handleStandby() {
    debug(1, 'Entering standby...');
    if (config.system.onStandby.setDND) {
      this.setDND();
    }
    if (config.system.onStandby.clearCallHistory) {
      xapi.Command.CallHistory.DeleteAll();
    }


    this.scenarios.enableScenario(config.system.onStandby.enableScenario);
  }

  handleWakeup() {
    debug(1, 'Waking up...');
    displayTimedProgressBar(config.strings.newSessionTitle, config.system.newSessionDelay);
    if (this.scenarios.currentScenario == config.system.onStandby.enableScenario) {
      this.scenarios.enableScenario(config.system.onWakeup.enableScenario);
    }

  }

  setPresenterLocation(location) {
    this.eventPresenterLocationSet(location);
  }
  setDND() {
    this.setDNDInterval = setInterval(() => { this.setDND() }, 82800000);
    xapi.Command.Conference.DoNotDisturb.Activate({ Timeout: 1440 });
  }

}

function configValidityCheck() {
  var valid = true;

  //Check for devices names doubles
  debug(1, `Checking for non-unique device ids...`);
  var doubles = [];
  for (let device of config.devices) {
    let count = config.devices.filter(dev => { return device.id == dev.id }).length;
    if (count > 1 && !doubles.includes(device.id)) {
      debug(3, `Device "${device.id}" is declared ${count} times.`);
      doubles.push(device.id);
      valid = false;
    }
  }

  //Check if all devices in groups are declared in devices list
  debug(1, `Checking devices groups for non-declared devices...`);
  for (let group of config.groups) {
    for (let device of group.devices) {
      if (config.devices.filter(dev => dev.id == device).length == 0) {
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

async function getDisconnectedRequiredPeripherals() {
  var disconnectedPeripherals = [];
  var disconnected = 0;
  let peripherals = await xapi.Status.Peripherals.get();
  let requiredPeripherals = config.devices.filter(dev => { return dev.peripheralRequired == true });

  for (let rp of requiredPeripherals) {
    let matchCount = 0;

    for (let p of peripherals.ConnectedDevice) {
      if (rp.peripheralId == p.SerialNumber && p.Status == 'Connected') {
        matchCount++;
      }
    }
    if (matchCount == 0) {
      debug(2, `Device disconnected: ${rp.id}, peripheralId: ${rp.peripheralId}`);
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
      }, config.system.requiredPeripheralsCheckInterval);
      disconnectedCallback(discdevs);
    }
  });
}

async function requiredPeripheralsDisconnected(callback) {

}
async function requiredPeripheralsConnected(callback) {

}

async function preInit() {
  /* Wakeup system */
  xapi.Command.Standby.Deactivate();
  xapi.Command.UserInterface.Message.Prompt.Display({
    Duration: 0,
    Text: 'Le système démarre. Un instant svp.',
    Title: 'Démarrage du système',
  });
  await sleep(INITSTEPDELAY);

  xapi.Command.UserInterface.Message.Prompt.Display({
    Duration: 0,
    Text: '',
    Title: 'En attente des périphériques...',
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
      Title: 'En attente des périphériques...',
    });
  });


  xapi.Command.UserInterface.Message.Prompt.Display({
    Duration: 0,
    Text: 'Tous les périphériques sont connectés. Un instant svp...',
    Title: 'Démarrage du système',
  });
  await sleep(INITSTEPDELAY);

  debug(2, `PreInit started...`);
  clearInterval(coldbootWarningInterval);
  if (config.system.debugInternalMessages) {
    xapi.Event.Message.Send.Text.on(text => {//TODO: Why this ?
      console.log(`[INTERNAL MESSAGE] ${text}`);
    });
  }

  debug(1, `Checking config validity...`);
  let validConfig = configValidityCheck();

  if (validConfig) {
    setTimeout(init, config.system.initDelay);
    debug(1, `Waiting for init... (${config.system.initDelay}ms)`);
  }
  else {
    debug(3, `Config is NOT valid. Please review errors above. System will not start.`);
  }

  debug(2, `PreInit finished.`);
}

async function init() {
  debug(2, `Init started...`);
  core = await new Core();
  await core.init();


  debug(1, 'Waiting 5 secs...');
  await sleep(5000);

  debug(2, `Init finished. Loading scenarios...`);
  xapi.Command.UserInterface.Message.Prompt.Clear();
  core.loadScenarios();
  performance.setElapsedEnd('Boot');


  setTimeout(() => {
    console.warn(`POST-BOOT PERFORMANCE REPORT:`);
    console.warn(performance);
    console.warn(`POST-BOOT SYSTEM STATUS REPORT:`);
    console.warn(zapi.system.getAllStatus());
  }, 5000);


  setInterval(() => {
    console.warn(performance);
  }, 240000);




  //TESTAREA AFTERBOOT

}


debug(1, `${PRODUCT} is starting...`);
debug(1, `Version: ${VERSION}`);
debug(1, `Debug level is: ${config.system.debugLevel}`);



xapi.Status.SystemUnit.Uptime.get().then(uptime => {
  if (uptime > config.system.coldBootWait) {
    debug(1, 'Warm boot detected, running preInit() now.');
    preInit();
  }
  else {
    debug(1, `Cold boot detected, running preInit() in ${config.system.coldBootWait} seconds...`);
    setTimeout(preInit, config.system.coldBootWait * 1000);
    var x = 0;
    coldbootWarningInterval = setInterval(() => {
      x++;
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        Text: `Le système vient de démarrer. Optimisation en cours...<br>Environ ${config.system.coldBootWait - (x * 5)} secondes restantes...`,
        Title: 'Démarrage',
      });
    }, 5000);
  }
});


















