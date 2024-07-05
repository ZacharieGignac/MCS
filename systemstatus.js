/* jshint esversion:8 */
import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

const PRES_NOPRES = 'NOPRESENTATION';
const PRES_LOCALPREVIEW = 'LOCALPREVIEW';
const PRES_LOCALSHARE = 'LOCALSHARE';
const PRES_REMOTE = 'REMOTE';
const PRES_REMOTELOCALPREVIEW = 'REMOTELOCALPREVIEW';
const CALLSTATUS_IDLE = 'Idle';
const CALLSTATUS_CONNECTED = 'Connected';
const CALLSTATUS_CONNECTING = 'Connecting';

var eventSinks = [];
var callEventSinks = [];

function toOnOff(value) {
  return value ? 'on' : 'off';
}

function areObjectsIdentical(obj1, obj2) {
  const stack = [[obj1, obj2]];

  while (stack.length > 0) {
    const [currentObj1, currentObj2] = stack.pop();

    const obj1Keys = Object.keys(currentObj1);
    const obj2Keys = Object.keys(currentObj2);

    if (obj1Keys.length !== obj2Keys.length) {
      return false;
    }

    for (const key of obj1Keys) {
      if (!currentObj2.hasOwnProperty(key)) {
        return false;
      }

      const value1 = currentObj1[key];
      const value2 = currentObj2[key];

      if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'object' && value2 !== null) {
        stack.push([value1, value2]);
      } else if (value1 !== value2) {
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
          success(CALLSTATUS_IDLE);
        }
        else if (call[0].Status == CALLSTATUS_CONNECTED) {
          success(CALLSTATUS_CONNECTED);

        }
        else if (call[0].Status == CALLSTATUS_CONNECTING) {
          success(CALLSTATUS_CONNECTING);
        }
        else if (call[0].Status == CALLSTATUS_IDLE) {
          success(CALLSTATUS_IDLE);
        }
      });
    });
  },
  onChange: function (callback) {
    callEventSinks.push(callback);
  }
};

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
};

export class SystemStatus {
  constructor() {
    var self = this;
    this._systemStatus = {};
    this._systemStatus.presentation = {};
    this._callbacks = [];
    //TAG:ZAPI
    zapi.system.setStatus = (key, value, notify) => { self.setStatus(key, value, notify); };
    zapi.system.getAllStatus = () => { return self.getAllStatus(); };
    zapi.system.onStatusChange = (callback) => { self.onChange(callback); };
    zapi.system.onStatusKeyChange = (key, callback) => { self.onKeyChg(key, callback); };
    zapi.system.getStatus = (key) => { return self.getStatus(key); };
    zapi.system.resetSystemStatus = () => { self.setDefaults(); };

  }

  async init() {
    return new Promise(async success => {
      debug(2, 'Starting SystemStatus...');


      //Set special "presentation" status
      let presentationStatus = await presentation.getStatus();
      this.setStatus('presentation', presentationStatus, false);

      //Set special "call" status
      let callStatus = await call.getCallStatus();
      this.setStatus('call', callStatus, false);

      //Set special "hdmipassthrough" status
      let hpt = await xapi.Status.Video.Output.HDMI.Passthrough.Status.get();
      this.setStatus('hdmiPassthrough', hpt,false);
      xapi.Status.Video.Output.HDMI.Passthrough.Status.on(hptstatus => {
        this.setStatus('hdmiPassthrough', hptstatus);
      });

      presentation.onChange(status => {
        if (!areObjectsIdentical(this._systemStatus.presentation, status)) {
          debug(1, 'Updating presentation status');
          this.setStatus('presentation', status);
        }
      });
      call.onChange(call => {
        if (!areObjectsIdentical(this._systemStatus.call, call)) {
          debug(1, 'Updating call status');
          this.setStatus('call', call);
        }
      });

      /* Handle UI automapping */
      let widgets = await xapi.Status.UserInterface.Extensions.Widget.get();
      let amapWidgets = widgets.filter(obj => obj.WidgetId.startsWith("SS$"));


      for (let w of amapWidgets) {
        this.setStatus(w.WidgetId.split('$')[1], w.Value, false);
      }

      //Display current status at 30 seconds interval
      if (systemconfig.system.showStatusAndPerformanceReports) {
        setInterval(() => {
          debug(2, this._systemStatus);
        }, 240000);
      }
      this.setDefaults();
      debug(2,`SystemStatus running.`);
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
      if (typeof value == 'boolean') {
        zapi.ui.setWidgetValue('SS?' + key, toOnOff(value));
      }
      else {
        zapi.ui.setWidgetValue('SS$' + key, value);
      }


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
    debug(2, this._systemStatus);
  }
}
