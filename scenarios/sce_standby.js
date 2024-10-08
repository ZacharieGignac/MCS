/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { config as systemconfig } from './config';

export var Manifest = {
  fileName: 'sce_standby',
  id: 'standby',
  friendlyName: 'En veille',
  version: '1.0.0-beta',
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
    xapi.Command.UserInterface.Message.Prompt.Clear();
    xapi.Command.UserInterface.Message.Alert.Clear();
    xapi.Command.Presentation.Stop();
    xapi.Command.Audio.Volume.SetToDefault();

    //xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: systemconfig.system.mainVideoSource });

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
    clearTimeout(this.standbyTimeout);
    /*
    this.standbyTimeout = setTimeout(() => {
      xapi.Command.Standby.Activate();
    }, 2000);
    */
  }

  test() {

  }
}