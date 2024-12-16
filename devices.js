/* jshint esversion:8 */
import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';


export class DevicesManager {
  constructor() {
    zapi.performance.setElapsedStart('DevicesManager.init');
    this.displays = [];
    this.screens = [];
    this.lights = [];
    this.controlsystems = [];
    this.allDevices = [];
    this.allGroups = [];

    var self = this;

    //TAG:ZAPI
    zapi.devices.getAllDevices = () => { return self.getAllDevices(); };
    zapi.devices.getDevice = (id) => { return self.getDevice(id); };
    zapi.devices.getDevicesByType = (type) => { return self.getDevicesByType(type); };
    zapi.devices.getDevicesInGroup = (group) => { return self.getDevicesInGroup(group); };
    zapi.devices.getDevicesByTypeInGroup = (type, group) => { return self.getDevicesByTypeInGroup(type, group); };
    zapi.devices.activateCameraPreset = (presetId) => { self.activateCameraPreset(presetId); };
    zapi.devices.setMainVideoSource = (source) => { self.setMainVideoSource(source); };

  }

  init() {
    debug(1, `Checking ${systemconfig.devices.length} devices...`);
    for (let dev of systemconfig.devices) {
      this.allDevices.push(dev);
    }
    for (let group of systemconfig.groups) {
      this.allGroups.push(group);
    }

    //Init devices (instances)
    for (let d of this.allDevices) {
      if (d.device != undefined) {
        let deviceClass = d.device;
        debug(1, `Creating instance for device ID="${d.id}" NAME="${d.name}" TYPE="${d.type}"`);
        let tempDevice = new deviceClass(d);
        d.inst = tempDevice;
      }
      else {
        debug(3, `Device with id "${d.id}" is not configured correctly: Missing "device" property. Device not loaded.`);
      }


    }


    zapi.ui.addActionMapping(/^ACTIVATECAMPRESET$/, (params) => {
      this.activateCameraPreset(params);
    });

    zapi.performance.setElapsedEnd('DevicesManager.init');
    zapi.system.events.emit('system_devices_init');
  }

  getAllDevices() {
    let devicesList = [];
    for (let d of this.allDevices) {
      devicesList.push(d.inst);
    }
    return devicesList;
  }

  getDevice(id, includeConfig = false) {
    if (!includeConfig) {
      let found = this.allDevices.filter(dev => dev.id == id);
      if (found.length > 0) {
        return found[0].inst;
      }
      else {
        debug(3, `Cannot get device with id "${id}". Are you sure you got the right id (case sensitive) ?"`);
        return [];
      }
    }
    else {
      let found = this.allDevices.filter(dev => dev.id == id);
      if (found.length > 0) {
        return found[0];
      }
      else {
        debug(3, `Cannot get device with id "${id}". Are you sure you got the right id (case sensitive) ?"`);
        return [];
      }
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
    if (foundGroup) {
      for (let d of foundGroup.devices) {
        let tempDevice = this.getDevice(d, true);
        if (tempDevice.type == type) {
          devices.push(tempDevice.inst);
        }
      }
    }
    return devices;
  }

  async activateCameraPreset(presetName, skipSetVideoSource = false) {
    try {
      let allPresets = await xapi.Command.Camera.Preset.List();
      let preset = allPresets.Preset.filter(p => p.Name == presetName)[0];
      let presetDetails = await xapi.Command.Camera.Preset.Show({ PresetId: preset.PresetId });
      let presetCamId = presetDetails.CameraId;
      let connectors = await xapi.Config.Video.Input.Connector.get();
      let camConnectorDetails = connectors.filter(connector => {
        return connector.CameraControl && connector.CameraControl.CameraId === presetCamId;
      })[0];
      let camConnector = camConnectorDetails.id;

      xapi.Command.Camera.Preset.Activate({ PresetId: preset.PresetId });
      if (!skipSetVideoSource) {
        xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camConnector });
      }
    }
    catch (e) {
      debug(3, `activateCameraPreset() error; ${e}`);
    }
  }
  async setMainVideoSource(source) {
    try {
      xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: source });
    }
    catch (e) {
      debug(3, `setMainVideoSource() error: ${e}`);
    }
  }
}