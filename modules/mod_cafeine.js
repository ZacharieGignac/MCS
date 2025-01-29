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
    zapi.system.events.on('system_devices_init', this.handleDevicesInit.bind(this)); // Use bind for proper 'this' context
  }

  handleDevicesInit() {
    for (const deviceConfig of systemconfig.devices) {
      if (deviceConfig.type === zapi.devices.DEVICETYPE.DISPLAY) {
        this.processDisplayDevice(deviceConfig);
      }
    }
  }

  processDisplayDevice(deviceConfig) {
    if (!deviceConfig.supportsBlanking) {
      return; // Early return if blanking is not supported, reducing nesting
    }

    const device = zapi.devices.getDevice(deviceConfig.id);
    if (!device) {
      debug(2, `Cafeine: Device with id ${deviceConfig.id} not found.`); // Debug if device is not found
      return; // Exit if device is not found
    }

    this.overrideSetPowerFunction(device);
  }

  overrideSetPowerFunction(device) {
    device.driver.cafeinePowerFunction = device.driver.setPower;
    device.driver.setPower = (state) => {
      if (state === 'off') {
        debug(1, `Cafeine: Overriding POWER OFF. Setting ON and BLANKING instead.`);
        device.driver.cafeinePowerFunction('on');
        device.driver.setBlanking(true);
      } else {
        device.driver.cafeinePowerFunction(state);
      }
    };
  }
}