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

var eventSinks = [];
var callEventSinks = [];

function toOnOff(value) {
  return value ? 'on' : 'off';
}

function areObjectsIdentical(obj1, obj2) {
  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  if (obj1Keys.length !== obj2Keys.length) {
    return false;
  }
  for (const key of obj1Keys) {
    if (!obj2.hasOwnProperty(key)) {
      return false;
    }
    const value1 = obj1[key];
    const value2 = obj2[key];

    if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'object' && value2 !== null) {
      if (!areObjectsIdentical(value1, value2)) {
        return false;
      }
    } else if (value1 !== value2) {
      return false;
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


xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(calls => {
  var callStatus;
  if (calls >= 1) {
    callStatus = 'Connected';
  }
  else {
    callStatus = 'Idle';
  }
  processCallCallbacks(callStatus);
});



export var call = {
  getCallStatus: async function () {
    return new Promise((success) => {
      xapi.Status.SystemUnit.State.NumberOfActiveCalls.get().then(calls => {
        var callStatus;
        if (calls >= 1) {
          callStatus = 'Connected';
        }
        else {
          callStatus = 'Idle';
        }
        success(callStatus);
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
        var localPresentation = false;
        var remotePresentation = false;
        var localPresentationSending = false;

        if (pres.LocalInstance != undefined) {
          if (pres.LocalInstance != undefined) {
            localPresentation = true;
          }
          else {
            localPresentation = false;
          }
        }
        else {
          localPresentation = false;
        }


        //Check if remote presentation
        if (pres.Mode == 'Receiving') {
          remotePresentation = true;
        }

        if (!localPresentation && !remotePresentation) {
          status.type = PRES_NOPRES;
        }

        if (localPresentation && !remotePresentation) {
          if (localPresentationSending) {
            status.type = PRES_LOCALSHARE;
            status.source = pres.LocalSource;
          }
          else {
            status.type = PRES_LOCALPREVIEW;
            status.source = pres.LocalSource;
          }
        }

        if (!localPresentation && remotePresentation) {
          status.type = PRES_REMOTE;
        }

        if (localPresentation && remotePresentation) {
          status.type = PRES_REMOTELOCALPREVIEW;
          status.source = pres.LocalSource;
        }
        success(status);

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
      this.setStatus('hdmiPassthrough', hpt, false);
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

      debug(2, `SystemStatus running.`);
      success();
    });

  }



  setDefaults() {
    for (let prop in systemconfig.systemStatus) {
      if (systemconfig.systemStatus.hasOwnProperty(prop)) {
        zapi.system.setStatus(prop, systemconfig.systemStatus[prop], false);
      }
    }
    //Set status that are not "settings" in config file
    zapi.system.setStatus('PresenterDetected', false);
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
