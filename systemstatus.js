import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi  } from './zapi';

const PRES_NOPRES = 'NOPRESENTATION';
const PRES_LOCALPREVIEW = 'LOCALPREVIEW';
const PRES_LOCALSHARE = 'LOCALSHARE';
const PRES_REMOTE = 'REMOTE';
const PRES_REMOTELOCALPREVIEW = 'REMOTELOCALPREVIEW';

var _systemStatus = {};
var _callbacks = [];
var eventSinks = [];
var callEventSinks = [];


function debug(level, text) {
  if (systemconfig.system.debugLevel != 0 && level >= systemconfig.system.debugLevel) {
    console.log(text);
  }
}

function compareObjects(obj1, obj2) {
  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  if (obj1Keys.length !== obj2Keys.length) {
    return false;
  }
  for (const key of obj1Keys) {
    const value1 = obj1[key];
    const value2 = obj2[key];
    if (!obj2.hasOwnProperty(key)) {
      return false;
    }
    if (value1 !== value2) {
      return false;
    }
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      if (!areObjectsIdentical(value1, value2)) {
        return false;
      }
    }
  }
  return true;
}

async function checkPresentationStatus() {
  const presStatus = await presentation.getStatus();
  processCallbacks(presStatus);
}

function processCallbacks(presStatus) {
  for (const e of eventSinks) e(presStatus);
}

function processCallCallbacks(callStatus) {
  for (const e of callEventSinks) e(callStatus);
}

xapi.Event.PresentationPreviewStarted.on(checkPresentationStatus);
xapi.Event.PresentationPreviewStopped.on(checkPresentationStatus);
xapi.Event.PresentationStarted.on(checkPresentationStatus);
xapi.Event.PresentationStopped.on(checkPresentationStatus);

xapi.Status.Call.on(call => {
  if (call.Status != undefined) {
    processCallCallbacks(call.Status);
  }
});

export var call = {
  getCallStatus: async function () {
    return new Promise((success) => {
      xapi.Status.Call.get().then(call => {
        if (call == '') {
          success('Idle');
        }
        else if (call[0].Status == 'Connected') {
          success('Connected');

        }
        else if (call[0].Status == 'Connecting') {
          success('Connecting');
        }
        else if (call[0].Status == 'Idle') {
          success('Idle');
        }
      });
    });
  },
  onChange: function (callback) {
    callEventSinks.push(callback);
  }
}

export var presentation = {
  onChange: function (callback) {
    eventSinks.push(callback);
  },
  getStatus: async function () {
    return new Promise(success => {
      var status = {};
      xapi.Status.Conference.Presentation.get().then(pres => {
        if (pres.LocalInstance !== undefined) {

          status.source = pres.LocalInstance[0].Source;
          status.id = pres.LocalInstance[0].id;
          if (status.remotePresentation == true) {
            if (status.localPresentationMode === 'LocalOnly') {
              status.type = PRES_REMOTELOCALPREVIEW;
            }
            else {
              status.type = PRES_REMOTE;
            }
          }
          else {
            if (status.localPresentationMode === 'LocalOnly') {
              status.type = PRES_LOCALPREVIEW;
            }
            else {
              status.type = PRES_LOCALSHARE;
            }
          }
          success(status);
        }
        else {
          if (status.remotePresentation == true) {
            status.type = PRES_REMOTE;
          }
          else {
            status.type = PRES_NOPRES;
          }
          success(status);
        }
      });
    });
  }
}

export class SystemStatus {
  constructor() {
    var self = this;
    this._systemStatus = {};
    this._systemStatus.presentation = {};
    this._callbacks = [];
    zapi.system.setStatus = (key, value, notify) => { self.setStatus(key, value, notify) };
    zapi.system.getAllStatus = () => { return self.getAllStatus() };
    zapi.system.onStatusChange = (callback) => { self.onChange(callback) };
    zapi.system.onStatusKeyChange = (key, callback) => { self.onKeyChg(key, callback) };
    zapi.system.getStatus = (key) => { return self.getStatus(key) };
    zapi.system.resetSystemStatus = () => { self.setDefaults() };

  }

  async init() {
    return new Promise(async success => {
      debug(1, 'SystemStatus started!');


      //Set special "presentation" status
      let presentationStatus = await presentation.getStatus();
      this.setStatus('presentation', presentationStatus, false);

      //Set special "call" status
      let callStatus = await call.getCallStatus();
      this.setStatus('call', callStatus, false);

      //Set special "hdmipassthrough" status
      let hpt = await xapi.Status.Video.Output.HDMI.Passthrough.Status.get()
      this.setStatus('hdmiPassthrough', hpt);
      xapi.Status.Video.Output.HDMI.Passthrough.Status.on(hptstatus => {
        this.setStatus('hdmiPassthrough', hptstatus);
      });

      presentation.onChange(status => {
        if (!compareObjects(this._systemStatus.presentation, status)) {
          debug(1, 'Updating presentation status');
          this.setStatus('presentation', status);
        }
      });
      call.onChange(call => {
        if (!compareObjects(this._systemStatus.call, call)) {
          debug(1, 'Updating call status');
          this.setStatus('call', call);
        };
      });

      /* Handle UI automapping */
      let widgets = await xapi.Status.UserInterface.Extensions.Widget.get();
      let amapWidgets = widgets.filter(obj => obj.WidgetId.startsWith("SS$"));


      for (let w of amapWidgets) {
        this.setStatus(w.WidgetId.split('$')[1], w.Value, false);
      }

      //Display current status at 30 seconds interval
      setInterval(() => {
        console.warn(this._systemStatus);
      }, 240000);

      this.setDefaults();
      success();
    });
  }

  setDefaults() {
    for (let prop in systemconfig.systemStatus) {
      if (systemconfig.systemStatus.hasOwnProperty(prop)) {
        zapi.system.setStatus(prop, systemconfig.systemStatus[prop], false);
      }
    }
  }

  setStatus(key, value, notifyChange = true) {
    if (key.startsWith('SS$')) {
      key = key.split('$')[1];
    }
    if (this._systemStatus[key] != value) {
      this._systemStatus[key] = value;
      if (notifyChange) {
        debug(1, `SystemStatus: CHANGED (notify) Key="${key}" Value="${value}"`);
        this.notifySystemStatusChange(key);
      }
      else {
        debug(1, `SystemStatus: CHANGED (skip notify) Key="${key}", Value="${value}"`);
      }
      zapi.ui.setWidgetValue('SS$' + key, value);
    }
    else {
      debug(1, `SystemStatus: CHANGED (filtered, identical values) Key="${key}" Value="${value}"`);
    }
  }

  getStatus(key) {
    return this._systemStatus[key];
  }

  getAllStatus() {
    return this._systemStatus;
  }

  notifySystemStatusChange(key) {
    var newStatus = {
      key: key,
      value: this._systemStatus[key],
      status: this._systemStatus
    };
    for (let cb of this._callbacks) {
      if (cb.key == undefined || cb.key == key) {
        cb.callback(newStatus);
      }
    }
  }

  onChange(f) {
    this._callbacks.push({
      key: undefined,
      callback: f
    });
  }

  onKeyChg(key, f) {
    this._callbacks.push({
      key: key,
      callback: f
    });
  }
  
  displayStatus() {
    console.warn(this._systemStatus);
  }
}