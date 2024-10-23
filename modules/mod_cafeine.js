import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { config as systemconfig } from './config';
import { debug } from './debug';

export var Manifest = {
  fileName: 'mod_cafeine',  //Nom du fichier
  id: 'cafeine',  //Identification unique
  friendlyName: 'Display Cafeine', //Nom familier
  version: '1.0.0', //Version
  description: `Remplace la fonction "off" des drivers par la fonction "blank", si le device le supporte.` //Description
};

export class Module {
  constructor() {

  }

  start() {
    let devicesLoaded = zapi.system.events.on('system_devices_init', () => {
      for (let d of systemconfig.devices) {
        if (d.type == zapi.devices.DEVICETYPE.DISPLAY) {
          if(d.supportsBlanking) {
            let device = zapi.devices.getDevice(d.id);
            device.driver.cafeinePowerFunction = device.driver.setPower;
            device.driver.setPower = (state) => {
              if (state == 'off') {
                debug(1, `Cafeine: Overriding POWER OFF. Setting ON and BLANKING instead.`);
                device.driver.cafeinePowerFunction('on');
                device.driver.setBlanking(true);
              }
              else {
                device.driver.cafeinePowerFunction(state);
              }
            }
          }
        }
      }
    });
  }
}