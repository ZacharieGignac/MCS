import xapi from 'xapi';
import { zapiv1 } from './zapi';



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
    this.enabled = false;
    this.api = zapiv1;
  }


  enable() {
    return new Promise(success => {
      this.enabled = true;
      success(true);
    });
  }


  disable() {
    return new Promise(success => {
      this.enabled = false;
      success(true);
    });
  }


  start() {
    xapi.Command.Standby.Activate();
    let devices = this.api.devices.getAllDevices();

    for (let d of devices) {
      try {
        d.reset();
      }
      catch { }
    }

    this.api.system.resetSystemStatus();

    if (this.api.system.getStatus('SS$AutoLights') == 'on') {

      let lightscenes = this.api.devices.getDevicesByTypeInGroup(this.api.devices.DEVICETYPE.LIGHTSCENE, 'system.lightscene.standby');
      if (lightscenes.length > 0) {
        for (let lightscene of lightscenes) {
          let lsdevice = this.api.devices.getDevice(lightscene.config.id);
          if (lsdevice) {
            lsdevice.activate();
          }
        }
      }
    }
  }


  test() {
    console.log('test from SCE_Standby');
  }
};