import xapi from 'xapi';
import { config } from './config';
import * as devicesLibrary from './devices';
import { zapiv1 } from './zapi';
function debug(level, text) {
  if (config.system.debugLevel != 0 && level >= config.system.debugLevel) {
    switch (level) {
      case 1:
        console.log(text);
        break;
      case 2:
        console.warn(text);
        break;
      case 3:
        console.error(text);
        break;
    }

  }
}


export class DevicesManager {
  constructor() {
    this.api = zapiv1;

    this.api.performance.setElapsedStart('DevicesManager.init');

    this.displays = [];
    this.screens = [];
    this.lights = [];
    this.controlsystems = [];
    this.allDevices = [];
    this.allGroups = [];

    var self = this;

    //Setup ZAPI
    this.api.devices.getAllDevices = () => { return self.getAllDevices(); }
    this.api.devices.getDevice = (id) => { return self.getDevice(id); }
    this.api.devices.getDevicesByType = (type) => { return self.getDevicesByType(type); }
    this.api.devices.getDevicesInGroup = (group) => { return self.getDevicesInGroup(group); }
    this.api.devices.getDevicesByTypeInGroup = (type, group) => { return self.getDevicesByTypeInGroup(type, group); }

  }
  init() {


    //TODO: Build devices and groups cache, don't work on static config
    debug(1, `Checking ${config.devices.length} devices...`);
    for (let dev of config.devices) {
      this.allDevices.push(dev);
    }
    for (let group of config.groups) {
      this.allGroups.push(group);
    }

    //Init devices (instances)
    for (let d of this.allDevices) {
      if (d.device != undefined) {
        let deviceClass = d.device;
        debug(1,`Creating instance for device ID="${d.id}" NAME="${d.name}" TYPE="${d.type}"`);
        let tempDevice = new deviceClass(d);
        d.inst = tempDevice;
      }
      else {
        debug(3,`Device with id "${d.id}" is not configured correctly: Missing "device" property. Device not loaded.`);
      }

      
    }



    this.api.performance.setElapsedEnd('DevicesManager.init');
  }

  getAllDevices() {
    let devicesList = [];
    for (let d of this.allDevices) {
      devicesList.push(d.inst);
    }
    return devicesList;
  }
  getDevice(id,includeConfig=false) {
    if (!includeConfig) {
      return this.allDevices.filter(dev => dev.id == id)[0].inst;

    }
    else {
      return this.allDevices.filter(dev => dev.id == id)[0];
    }

  }
  getDevicesByType(type) {
    let devicesList = [];
    for (let d of this.allDevices.filter(dev => dev.type == type)) {
      devicesList.push(d.inst);
    }
    return devicesList;
    
  }
  getDevicesInGroup(group) {
    let foundGroup = this.allGroups.filter(g => g.id == group)[0];
    let devices = [];
    for (let d of foundGroup.devices) {
      devices.push(this.getDevice(d));
    }
    return devices;
  }
  getDevicesByTypeInGroup(type, group) {
    let foundGroup = this.allGroups.filter(g => g.id == group)[0];
    let devices = [];
    for (let d of foundGroup.devices) {
      let tempDevice = this.getDevice(d,true);
      if (tempDevice.type == type) {
        devices.push(tempDevice.inst);
      }
    }
    return devices;
  }
}