/* jshint esversion:8 */
import xapi from 'xapi';
import { DevicesManager } from './devices';
import { config as systemconfig } from './config';
import { PRODUCT, VERSION } from './config';
import { Scenarios } from './scenarios';
import { Modules } from './modules';
import { SystemStatus } from './systemstatus';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

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
var httpClientQueue;
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

class HTTPClientQueue {
  constructor(requestsPacing = 0) {
    console.log(`HTTPClientQueue: Initialized: ${id}`);
    this.requestsPacing = requestsPacing;
    this.working = false;
    this.getBuffer = [];
    this.postBuffer = [];
  }

  processNextGet() {
    if (!this.working && this.getBuffer.length > 0) {
      this.working = true;
      let nextRequest = this.getBuffer.shift();
      xapi.Command.HttpClient.Get(
        nextRequest.clientParameters
      ).then(response => {
        try {
          nextRequest.callback(response);
        }
        catch { }
        this.working = false;
        setTimeout(() => { this.processNextGet() }, this.requestsPacing);
      }).catch(err => {
        try {
          nextRequest.errorcallback(err);
        }
        catch { }
        this.working = false;
        setTimeout(() => { this.processNextGet() }, this.requestsPacing);
      });
    }
  }

  processNextPost() {
    if (!this.working && this.postBuffer.length > 0) {
      this.working = true;
      let nextRequest = this.postBuffer.shift();
      xapi.Command.HttpClient.Post(
        nextRequest.clientParameters
      ).then(response => {
        try {
          nextRequest.callback(response);
        }
        catch { }
        this.working = false;
        setTimeout(this.processNextPost, this.requestsPacing);
      }).catch(err => {
        try {
          nextRequest.errorcallback(err);
        }
        catch { }
        this.working = false;
        setTimeout(this.processNextPost, this.requestsPacing);
      });
    }
  }

  httpGet(clientParameters, callback, errorcallback) {
    this.getBuffer.push({
      clientParameters: clientParameters,
      callback: callback,
      errorcallback: errorcallback
    });
    this.processNextGet();
  }

  httpPost(clientParameters, callback, errorcallback) {
    this.postBuffer.push({
      clientParameters: clientParameters,
      callback: callback,
      errorcallback: errorcallback
    });
    this.processNextPost();
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
  reset() {
    this.counters = [];
    this.elapsedStarts = [];
  }
}
var performance = new Performance();
performance.setElapsedStart('Boot');



function displayNewSessionMessage() {
  xapi.Command.UserInterface.Message.Prompt.Display({
    title: systemconfig.strings.newSessionTitle,
    text: `Veuillez patienter ${systemconfig.system.newSessionDelay / 1000} secondes.`,
  });

  setTimeout(() => {
    xapi.Command.UserInterface.Message.Prompt.Clear();
  }, systemconfig.system.newSessionDelay);
}

class Storage {
  constructor() {
    this.STORAGEFILE = systemconfig.system.storageFile;
    this.storage;
  }


  async init() {
    zapi.system.events.emit('system_storage_init');
    debug(2, `Storage: Init...`);
    this.storage = await this.readStorage();
    debug(2, `Storage: Init done`);
    zapi.system.events.emit('system_storage_init_done');
  }


  async readStorage() {
    debug(2, `Storage: Reading storage file...`);
    let storageMacro = await xapi.Command.Macros.Macro.Get({
      Content: true,
      Name: this.STORAGEFILE
    });
    debug(2, `Storage size: ${storageMacro.Macro[0].Content.length} bytes`);
    let storageContent = storageMacro.Macro[0].Content;
    storageContent = atob(storageContent.substring(2));
    try {
      return JSON.parse(storageContent);
    }
    catch (e) {
      console.error(`Error reading storage file. The file is malformed. Have you messed with it ?`);
      zapi.system.events.emit('system_storage_error_corrupted');
    }
    debug(2, `Storage: Storage loaded into memory.`);
  }

  read(name) {
    for (let file of this.storage.files) {
      if (file.name == name) {
        let decodedFileContent = atob(file.content);
        return (decodedFileContent);
      }
    }
  }
  async write(name, data) {
    let workingFile;
    let content = btoa(JSON.stringify(data));
    let size = content.length;
    for (let file of this.storage.files) {
      if (file.name == name) {
        workingFile = file;
      }
    }
    if (workingFile == undefined) {
      workingFile = {
        name: name,
        content: content,
        size: size
      };
      this.storage.files.push(workingFile);
    }
    else {
      workingFile.content = content;
      workingFile.size = size;
    }
    let macroContent = btoa(JSON.stringify(this.storage));
    await xapi.Command.Macros.Macro.Save({
      Name: this.STORAGEFILE,
      Overwrite: true,
      Transpile: false
    }, '//' + macroContent);
    zapi.system.events.emit('system_storage_file_modified', name);
  }


  list() {
    let filelist = [];
    for (let file of this.storage.files) {
      debug(1, `FILE=${file.name}, SIZE=${file.size}`);
      filelist.push({ name: file.name, size: file.size });
    }
    return filelist;
  }

  async del(name) {
    for (let file of this.storage.files) {
      if (file.name == name) {
        let index = this.storage.files.indexOf(file);
        this.storage.files.splice(index, 1);
        zapi.system.events.emit('system_storage_file_deleted', name);
      }
    }
  }


  async resetStorage() {
    zapi.system.events.emit('system_storage_reset');
    debug(3, 'Reseting storage to default...');
    this.storage = {
      files: []
    };
    this.write('storage.version', '1');
    this.write('storage.encoding', 'json');
    this.write('storage.encapsulation', 'base64');
    this.write('system.bootcount', 0);
  }
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
    }, systemconfig.system.messagesPacing);
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




class AudioReportAnalyzer {
  constructor(audioReporter) {
    this.audioReporter = audioReporter;
    this.audioReporter.onReport((report) => { this.reportReceived(report); });
    this.enabled = false;
    this.rawAnalysisCallbacks = [];
    this.loudestGroupAnalysisCallbacks = [];
    this.customAnalysisCallbacks = [];
    this.groups = [];
    this.lastAnalysisData = undefined;
  }
  start() {
    this.enabled = true;
  }
  stop() {
    this.enabled = false;
  }
  reportReceived(report) {

    this.lastAnalysisData = report;
    if (this.enabled) {


      //Process raw analysis callbacks
      for (let rac of this.rawAnalysisCallbacks) {
        rac(report);
      }


      //Find first group that contains the loudest input level
      var loudestReport = report;
      loudestReport.group = undefined;
      delete loudestReport.inputs;
      for (let group of this.groups) {
        if (group.inputs.includes(loudestReport.highInputId)) {
          loudestReport.group = group.group;
        }
      }

      for (let lga of this.loudestGroupAnalysisCallbacks) {
        if (loudestReport.highestSince >= lga.elapsed) {
          loudestReport.significant = loudestReport.highestAverageDiff > 0 ? true : false;
          lga.callback(loudestReport);
        }
      }


    }


  }
  addSingleGroup(group) {
    var newGroup = { group: group, inputs: [] };
    let inputDevices = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUT, group);
    for (let ai of inputDevices) {
      newGroup.inputs.push(ai.config.connector);
    }
    this.groups.push(newGroup);
  }
  addGroup(groups) {
    if (Array.isArray(groups)) {
      for (let group of groups) {
        this.addSingleGroup(group);
      }
    }
    else {
      this.addSingleGroup(groups);
    }
  }
  onRawAnalysis(callback) {
    this.rawAnalysisCallbacks.push(callback);
  }
  onLoudestGroup(elapsed, callback) {
    this.loudestGroupAnalysisCallbacks.push({ elapsed: elapsed, callback: callback });
  }
  onCustomAnalysis(filter, callback) {
    this.customAnalysisCallbacks.push({ filter: filter, callback: callback });
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







class SystemEvents {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    const index = this.events[event].indexOf(callback);
    if (index !== -1) {
      this.events[event].splice(index, 1);
    }
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
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
      xapi.Event.UserInterface.on(event => { this.forwardUiEvents(event); });
      this.onUiEvent((event) => this.parseUiEvent(event));
      zapi.ui.addActionMapping = (regex, func) => { this.addActionMapping(regex, func); };
      zapi.ui.setWidgetValue = (widgetId, value) => { this.setWidgetValue(widgetId, value); };
      zapi.ui.getAllWidgets = () => { return this.getAllWidgets(); };
      zapi.ui.addWidgetMapping = (widgetId) => { return this.addWidgetMapping(widgetId); };

      //Build widgets cache
      let list = await xapi.Command.UserInterface.Extensions.List();

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
      success();
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
        try {
          xapi.Command.UserInterface.Extensions.Widget.SetValue({
            WidgetId: w.widgetId,
            Value: value
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
}

class Core {
  constructor() {
    zapi.system.events.emit('system_corestarted');
    var self = this;
    this.messageQueue = new MessageQueue();
    this.audio = new Audio();


    //Building zapi
    zapi.performance.setElapsedStart = (test) => { performance.setElapsedStart(test); };
    zapi.performance.setElapsedEnd = (test) => { performance.setElapsedEnd(test); };
    zapi.performance.inc = (name, num) => { performance.inc(name, num); };
    zapi.performance.dec = (name, num) => { performance.dec(name, num); };
    zapi.performance.reset = () => { performance.reset(); };
    zapi.system.sendMessage = (message) => { self.messageQueue.send(message); };
    zapi.audio.getLocalInputId = (name) => { return self.audio.getLocalInputId(name); };
    zapi.audio.getLocalOutputId = (name) => { return self.audio.getLocalOutputId(name); };
    zapi.audio.getRemoteInputsIds = () => { return self.audio.getRemoteInputsIds(); };
    zapi.audio.getRemoteOutputIds = () => { return self.audio.getRemoteOutputIds(); };
    zapi.audio.addAudioReportAnalyzer = (audioReporter) => { return new AudioReportAnalyzer(audioReporter); };





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


    xapi.Config.UserInterface.SettingsMenu.Mode.set(systemconfig.system.settingsMenu);






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
      if (presentationStatus != 'NOPRESENTATION' && callStatus == 'Idle') {
        msg = str.endSessionPresentation;
      }
      else if (presentationStatus == 'NOPRESENTATION' && callStatus == 'Connected') {
        msg = str.endSessionCall;
      }
      else if (presentationStatus != 'NOPRESENTATION' && callStatus == 'Connected') {
        msg = str.endSessionCallPresentation;
      }

      if (msg != undefined) {
        xapi.Command.UserInterface.Message.Prompt.Display({
          Title: str.endSessionTitle,
          Text: msg,
          FeedbackId: 'system_ask_standby',
          "Option.1": str.endSessionChoiceYes,
          "Option.2": str.endSessionChoiceNo
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


    this.modules.start();



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
    displayNewSessionMessage();
    if (this.scenarios.currentScenario == systemconfig.system.onStandby.enableScenario) {
      this.scenarios.enableScenario(systemconfig.system.onWakeup.enableScenario);
    }
    zapi.system.events.emit('system_wakup');
  }

  setPresenterLocation(location) {
    this.eventPresenterLocationSet(location);
  }
  setDND() {
    this.setDNDInterval = setInterval(() => { this.setDND(); }, 82800000);
    xapi.Command.Conference.DoNotDisturb.Activate({ Timeout: 1440 });
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
    let httpresponse = await xapi.Command.HttpClient.Get({
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

async function preInit() {
  debug(2, `Starting System Events Manager...`);
  systemEvents = new SystemEvents();
  zapi.system.events.on = (event, callback) => { systemEvents.on(event, callback); };
  zapi.system.events.off = (event, callback) => { systemEvents.off(event, callback); };
  zapi.system.events.emit = (event, ...args) => { systemEvents.emit(event, ...args); };

  zapi.system.events.emit('system_preinit');

  /* Storage */
  debug(2, `Starting Storage Manager...`)
  storage = new Storage();
  await storage.init();
  zapi.storage.read = async (name) => { return await storage.read(name); };
  zapi.storage.write = async (name, data) => { await storage.write(name, data); };
  zapi.storage.list = async () => { return await storage.list(); };
  zapi.storage.del = async (name) => { await storage.del(name); };
  zapi.storage.resetStorage = async () => { storage.resetStorage(); };

  /* HTTP Client Queue */
  httpClientQueue = new HTTPClientQueue(systemconfig.system.httpRequestPacing);
  zapi.communication.httpGet = (clientParameters, callback, errorcallback) => { httpClientQueue.httpGet(clientParameters, callback, errorcallback); };
  zapi.communication.httpPost = (clientParameters, callback, errorcallback) => { httpClientQueue.httpPost(clientParameters, callback, errorcallback); };

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
  bootcount++;
  zapi.storage.write('system.bootcount', bootcount);
  console.warn(`BOOT COUNTER: ${bootcount}`);

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


debug(1, `${PRODUCT} is starting...`);
debug(1, `Version: ${VERSION}`);
debug(1, `Debug level is: ${systemconfig.system.debugLevel}`);




xapi.Status.SystemUnit.Uptime.get().then(uptime => {

  if (uptime > systemconfig.system.coldBootTime) {
    debug(1, 'Warm boot detected, running preInit() now.');
    preInit();
  }
  else {
    debug(1, `Cold boot detected, running preInit() in ${systemconfig.system.coldBootWait} seconds...`);
    setTimeout(preInit, systemconfig.system.coldBootWait * 1000);
    var x = 0;
    let waitChar = '🟦';
    coldbootWarningInterval = setInterval(() => {
      x++;
      xapi.Command.UserInterface.Message.Prompt.Display({
        Duration: 0,
        Text: str.systemStartingColdBootText + '<br>' + waitChar.repeat(x),
        Title: str.systemStartingColdBootTitle,
      });
      xapi.Status.SystemUnit.Uptime.get().then(uptime => {
        if (uptime > systemconfig.system.coldBootTime) {
          clearInterval(coldbootWarningInterval);
          xapi.Command.Macros.Runtime.Restart();

        }
      });
    }, 5000);
  }
});

