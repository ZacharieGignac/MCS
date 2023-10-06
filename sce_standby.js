import xapi from 'xapi';
import { zapiv1 } from './zapi';

var zapi = zapiv1;

//TODO: stop any presentation

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

    xapi.Command.Presentation.Stop();
    
    let devices = zapi.devices.getAllDevices();

    for (let d of devices) {
      try {
        d.reset();
      }
      catch { }
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
      /*
      let pcinputgroup = this.api.devices.getDevice('PC');
      let roomoutputgroup = this.api.devices.getDevice('ROOM');

      roomoutputgroup.disconnectLocalInput(pcinputgroup);
      */
      xapi.Command.Standby.Activate();
  }

  test() {
    console.log('test from SCE_Standby');
  }
};