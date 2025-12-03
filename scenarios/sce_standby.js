/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { config as systemconfig } from './config';

function safeStringify(obj, cache = new Set()) {
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



export var Manifest = {
  fileName: 'sce_standby',
  id: 'standby',
  friendlyName: 'En veille',
  version: '1.1.0-release',
  description: 'Comportement standby',
  panels: {
    hide: [],
    show: []
  },
  features: {

  }
};


export class Scenario {
  constructor(api) {
    this.standbyTimeout;
  }

  enable() {
    return new Promise(success => {
      success(true);
    });
  }

  disable() {
    return new Promise(success => {
      success(true);
    });
  }

  start() {
    xapi.Command.Audio.Microphones.Unmute().catch(() => {});

    //Clear prompts and alerts
    xapi.Command.UserInterface.Message.Prompt.Clear().catch(() => {});
    xapi.Command.UserInterface.Message.Alert.Clear().catch(() => {});

    //Stop presentation
    xapi.Command.Presentation.Stop().catch(() => {});

    //Stop HdmiPassthrough (only if active)
    try {
      if (zapi.system && typeof zapi.system.getStatus === 'function' && zapi.system.getStatus('hdmiPassthrough') === 'Active') {
        xapi.Command.Video.Output.HDMI.Passthrough.Stop().catch(() => {});
      }
    } catch (_) {}

    //Set default volume
    xapi.Command.Audio.Volume.SetToDefault().catch(() => {});

    //Disable HDMIPassthrough

    let devices = zapi.devices.getAllDevices();

    for (let d of devices) {
      try {
        d.reset();
      }
      catch (e) { }
    }

    zapi.system.resetSystemStatus();
    let lightscenes = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.LIGHTSCENE, 'system.lightscene.standby');
    if (lightscenes.length > 0) {


      for (let lightscene of lightscenes) {
        lightscene.activate();
      }

    }

    clearTimeout(this.standbyTimeout);
  }

  test() {

  }
}