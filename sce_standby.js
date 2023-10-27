/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';

export var Manifest = {
  fileName: 'sce_standby',
  id: 'standby',
  friendlyName: 'En veille',
  version: '1.0.0',
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

    xapi.Command.Presentation.Stop();
    xapi.Command.Audio.Volume.SetToDefault();

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
        let lsdevice = zapi.devices.getDevice(lightscene.config.id);
        if (lsdevice) {
          lsdevice.activate();
        }
      }
    }
    xapi.Command.Standby.Activate();
  }

  test() {

  }
}