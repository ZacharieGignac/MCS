/* jshint esversion:8 */
import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

const ON = 'on';
const OFF = 'off';



function mapValue(value, fromMin, fromMax, toMin, toMax) {
  if (value < fromMin) value = fromMin;
  if (value > fromMax) value = fromMax;
  const normalizedValue = (value - fromMin) / (fromMax - fromMin);
  const mappedValue = Math.round((normalizedValue * (toMax - toMin)) + toMin);
  return mappedValue;
}

export class Camera {
  constructor(config) {
    this.config = config;
  }
}



export class LightScene {
  constructor(config) {
    this.config = config;
    this.driver = new this.config.driver(this, config);
    zapi.ui.addActionMapping(/^LIGHTSCENE$/, (id) => {
      if (id == this.config.id) {
        this.activateUi();
      }
    });
    var activateButton = zapi.ui.addWidgetMapping(this.config.id + ':ACTIVATE');
    activateButton.on('clicked', () => {
      this.activate();
    });

  }
  activate() {
    debug(1, `DEVICE ${this.config.id}: activate`);
    this.driver.activate();
  }
  activateUi() {
    this.activate();
    if (systemconfig.system.disableAutoLightsWhenWidgetInteraction) {
      zapi.system.setStatus('AutoLights', OFF);
    }
  }
}


export class AudioInputGroup {
  constructor(config) {
    this.config = config;
    this.inputId = undefined;
    zapi.audio.getLocalInputId(this.config.name).then(id => {
      this.inputId = id;
    });
  }

  async connectToRemoteOutputs() {
    try {
      let remoteOutputs = await zapi.audio.getRemoteOutputIds();
      for (let ro of remoteOutputs) {
        xapi.Command.Audio.RemoteOutput.ConnectInput({
          InputId: this.inputId,
          OutputId: ro
        });
      }
      debug(1, `DEVICE ${this.config.id}: connectToRemoteOutputs`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} connectToRemoteOutputs error: ${e}`);
    }
  }

  async disconnectFromRemoteOutputs() {
    try {
      let remoteOutputs = await zapi.audio.getRemoteOutputIds();
      for (let ro of remoteOutputs) {
        xapi.Command.Audio.RemoteOutput.DisconnectInput({
          InputId: this.inputId,
          OutputId: ro
        });
      }
      debug(1, `DEVICE ${this.config.id}: disconnectFromRemoteOutputs`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} disconnectFromRemoteOutputs error: ${e}`);
    }
  }

  connectToLocalOutput(lo) {
    try {
      xapi.Command.Audio.LocalOutput.ConnectInput({
        InputId: this.inputId,
        OutputId: lo.inputId
      });
      debug(1, `DEVICE ${this.config.id}: ConnectToLocalOutput: ${lo.config.id}`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} ConnectToLocalOutput error: ${e}`);
    }
  }

  disconnectFromLocalOutput(lo) {
    try {
      xapi.Command.Audio.LocalOutput.DisconnectInput({
        InputId: this.inputId,
        OutputId: lo.outputId
      });
      debug(1, `DEVICE ${this.config.id}: DisconnectFromLocalOutput: ${lo.config.id}`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} DisconnectFromLocalOutput error: ${e}`);
    }
  }
}


export class AudioOutputGroup {
  constructor(config) {
    this.config = config;
    this.outputId = undefined;
    zapi.audio.getLocalOutputId(this.config.name).then(id => {
      this.outputId = id;
    });
  }
  test() {

  }
  connectLocalInput(li) {
    try {
      xapi.Command.Audio.LocalOutput.ConnectInput({
        InputId: li.inputId,
        OutputId: this.outputId
      });
      debug(1, `DEVICE ${this.config.id}: ConnectLocalInput: ${li.config.id}`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} ConnectLocalInput error: ${e}`);
    }
  }

  disconnectLocalInput(li) {
    try {
      xapi.Command.Audio.LocalOutput.DisconnectInput({
        InputId: li.inputId,
        OutputId: this.outputId
      });
      debug(1, `DEVICE ${this.config.id}: disConnectLocalInput: ${li.config.id}`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} DisconnectLocalInput error: ${e}`);
    }
  }

  async connectRemoteInputs() {
    try {
      let remoteinputs = await zapi.audio.getRemoteInputsIds();
      for (let ri of remoteinputs) {
        xapi.Command.Audio.LocalOutput.ConnectInput({
          InputId: ri,
          OutputId: this.outputId
        });
      }
      debug(1, `DEVICE ${this.config.id}: ConnectRemoteInputs`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} connectRemoteInputs error: ${e}`);
    }
  }

  async disconnectRemoteInputs() {
    try {
      let remoteinputs = await zapi.audio.getRemoteInputsIds();
      for (let ri of remoteinputs) {
        xapi.Command.Audio.LocalOutput.DisconnectInput({
          InputId: ri,
          OutputId: this.outputId
        });
      }

      debug(1, `DEVICE ${this.config.id}: DisconnectRemoteInputs`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} disConnectRemoteInputs error: ${e}`);
    }

  }
  async updateInputGain(li, gain) {
    try {
      xapi.Command.Audio.LocalOutput.UpdateInputGain({
        InputId: li.inputId,
        OutputId: this.outputId,
        InputGain: gain
      });
      debug(1, `DEVICE ${this.config.id}: updateInputGain: ${li.config.id}`);
    }
    catch (e) {
      debug(1, `DEVICE ${this.config.id} updateInputGain error: ${e}`);
    }
  }

}


export class Display {
  constructor(config) {
    this.config = config;
    this._currentPower = undefined;
    this._currentBlanking = undefined;
    this._currentSource = undefined;
    this._usageHours = undefined;
    this._usageHoursTimeout = undefined;
    this.powerOffTimeout = undefined;
    var self = this;


    if (config.supportsUsageHours) {
      self.startRequestUsageHours(self);
    }

    if (config.supportsFilterStatus) {
      self.startRequestFilterStatus(self);
    }

    if (config.supportsSystemStatus) {
      self.startRequestSystemStatus(self);
    }

    // Load driver
    this.driver = new this.config.driver(this, config);
    this.setDefaults();

    // Default WidgetMapping
    //TAG:ZAPI
    var onButton = zapi.ui.addWidgetMapping(this.config.id + ':POWERON');
    var offButton = zapi.ui.addWidgetMapping(this.config.id + ':POWEROFF');
    var powerToggle = zapi.ui.addWidgetMapping(this.config.id + ':POWER');

    onButton.on('clicked', () => {
      self.powerOn();
    });

    offButton.on('clicked', () => {
      self.powerOff();
    });

    powerToggle.on('changed', (value) => {
      this.setPower(value);
    });
  }

  startRequestUsageHours(self) {
    self._usageHoursInterval = setInterval(() => {
      debug(1, `${this.config.id}: Requesting usage hours...`);
      self.driver.requestUsageHours().then(usage => {
        debug(1, `${this.config.id}: Received usage hours: ${usage}`);
        self._usageHours = usage;
        if (zapi.telemetry.available == true) {
          const dynamicUsage = `lampUsage_${this.config.id}`;
          const resultObject = {
            [dynamicUsage]: usage,
          };
          zapi.telemetry.send(resultObject);
        }
      }).catch(err => {
        debug(3, `${this.config.id}: Error getting usage hours report: ${err}`);
        if (zapi.telemetry.available == true) {
          const dynamicError = `systemStatus_${this.config.id}`;
          const resultObject = {
            [dynamicError]: err
          };
          zapi.telemetry.send(resultObject);
        }
      });
    }, self.config.usageHoursRequestInterval);
  }

  startRequestFilterStatus(self) {
    self._filterStatusInterval = setInterval(() => {
      debug(1, `${this.config.id}: Requesting filter status...`);
      self.driver.requestFilterStatus().then(status => {
        debug(1, `${this.config.id}: Received filter status report: ${status}`);
        if (zapi.telemetry.available == true) {
          const dynamicKey = `filterStatus_${this.config.id}`;
          const resultObject = {
            [dynamicKey]: status
          };
          zapi.telemetry.send(resultObject);
        }
      }).catch(err => {
        debug(3, `${this.config.id}: Error getting filter status report: ${err}`);
        if (zapi.telemetry.available == true) {
          const dynamicError = `systemStatus_${this.config.id}`;
          const resultObject = {
            [dynamicError]: err
          };
          zapi.telemetry.send(resultObject);
        }
      });
    }, self.config.filterStatusRequestInterval);
  }

  startRequestSystemStatus(self) {
    self._systemStatusInterval = setInterval(() => {
      debug(1, `${this.config.id}: Requesting system status...`);
      self.driver.requestSystemStatus().then(status => {
        debug(1, `${this.config.id}: Received system status report: ${status}`);
        if (zapi.telemetry.available == true) {
          const dynamicKey = `systemStatus_${this.config.id}`;
          const resultObject = {
            [dynamicKey]: status
          };
          zapi.telemetry.send(resultObject);
        }
      }).catch(err => {
        debug(3, `${this.config.id}: Error getting system status report: ${err}`);
        if (zapi.telemetry.available == true) {
          const dynamicError = `systemStatus_${this.config.id}`;
          const resultObject = {
            [dynamicError]: err
          };
          zapi.telemetry.send(resultObject);
        }
      });
    }, self.config.systemStatusRequestInterval);
  }

  setDefaults() {
    if (this.config.defaultPower === 'on') {
      this.powerOn();
    } else {
      this.powerOff(0);
    }
  }

  setPower(power, delay = this.config.powerOffDelay, overrideCurrentDelay = false) {
    power = power.toLowerCase();
    if (this.config.supportsPower) {
      if (this._currentPower !== power) {
        if (power === 'on') {
          this.powerOn();
        } else {
          this.powerOff(delay, overrideCurrentDelay);
        }
      }
    }
  }

  off(delay = this.config.powerOffDelay, overrideCurrentDelay = false) {
    this.powerOff(delay, overrideCurrentDelay);
  }
  powerOff(delay = this.config.powerOffDelay, overrideCurrentDelay = false) {
    debug(1, `DEVICE ${this.config.id}: OFF`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.powerOff');
    if (this.config.supportsPower) {
      if (this._currentPower !== 'off' || this._currentDelay != delay || overrideCurrentDelay) {
        this._currentPower = 'off';
        zapi.ui.setWidgetValue(this.config.id + ':POWERSTATUS', `OFF (transiting ${delay}ms)`);
        zapi.ui.setWidgetValue(this.config.id + ':POWER', 'off');
        debug(1, `Display "${this.config.id}" POWER set to OFF. Delay: ${delay} ms"`);
        clearTimeout(this.powerOffTimeout);
        this._currentDelay = delay;
        this.powerOffTimeout = setTimeout(() => {
          this.driver.setPower('off');
          zapi.ui.setWidgetValue(this.config.id + ':POWERSTATUS', `OFF`);
          zapi.ui.setWidgetValue(this.config.id + ':POWER', 'off');
        }, delay);
        if (this.config.blankBeforePowerOff) {
          this.driver.setBlanking(true);
        }
      }
    }
  }

  powerOn() {
    debug(1, `DEVICE ${this.config.id}: ON`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.powerOn');
    if (this.config.supportsPower) {
      if (this._currentPower !== 'on') {
        this._currentPower = 'on';
        zapi.ui.setWidgetValue(this.config.id + ':POWERSTATUS', 'ON');
        zapi.ui.setWidgetValue(this.config.id + ':POWER', 'on');
        clearTimeout(this.powerOffTimeout);
        this.driver.setPower('on');
        if (this.config.blankBeforePowerOff) {
          this.driver.setBlanking(false);
        }
      }
    }
  }
  on() {
    this.powerOn();
  }

  getPower() {
    return this._currentPower;
  }

  setBlanking(blanking) {
    if (this.config.supportsBlanking) {
      if (this._currentBlanking != blanking) {
        debug(1, `DEVICE ${this.config.id}: Blanking ${blanking}`);
        this.driver.setBlanking(blanking);
        this._currentBlanking = blanking;
      }
    }
  }

  getBlanking() {
    return this._currentBlanking;
  }

  setSource(source) {
    if (this.config.supportsSource) {
      if (this._currentSource != source) {
        debug(1, `DEVICE ${this.config.id}: Source ${source}`);
        this.driver.setSource(source);
        this._currentSource = source;
      }
    }
  }

  getSource() {
    return this._currentSource;
  }

  getUsageHours() {
    return this._usageHours;
  }

  custom(action) {
    this.driver.custom(action);
  }

  fbUsageHours(usage) {
    clearTimeout(this._usageHoursTimeout);


  }

  processActionPower(power) {
    power = power.toLowerCase();
    if (power == 'on') {
      this.powerOn();
    }
    else if (power == 'off') {
      this.powerOff(0);
    }
  }

  processActionPowerDelay(power) {
    power = power.toLowerCase();
    if (power == 'on') {
      this.powerOn();
    }
    else if (power == 'off') {
      this.powerOff(this.config.powerOffDelay);
    }
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
    this.setDefaults();
  }
}


export class Light {
  constructor(config) {
    this.config = config;
    this.driver = new this.config.driver(this, config);
    this.currentPowerStatus = undefined;
    this.widgetLevelName = this.config.id + ':LEVEL';
    this.widgetLevelNamePercent = this.config.id + ':LEVEL%';
    this.widgetPowerName = this.config.id + ':POWER';
    this.widgetPowerOn = this.config.id + ':POWERON';
    this.widgetPowerOff = this.config.id + ':POWEROFF';
    this.beforeOffLevel = this.config.defaultDim;
    this.currentDimLevel = this.config.defaultDim;
    this.currentPower = undefined;
    this.powerSwitch = zapi.ui.addWidgetMapping(this.widgetPowerName);
    this.powerSwitch.on('changed', value => {
      if (this.config.supportsPower) {
        this.power(value);
      }
      else {
        if (value == 'on') {
          this.dim(this.beforeOffLevel);
        }
        else {
          this.beforeOffLevel = this.currentDimLevel;
          this.dim(0);
        }
      }

    });

    this.levelSlider = zapi.ui.addWidgetMapping(this.widgetLevelName);
    this.levelLabel = zapi.ui.addWidgetMapping(this.widgetLevelNamePercent);
    this.levelSlider.on(this.config.sliderEvent, value => {
      let mappedValue = mapValue(value, 0, 255, 0, 100);
      this.dim(mappedValue);
      if (!this.config.supportsPower) {
        this.powerSwitch.setValue('on');
      }
      if (systemconfig.system.disableAutoLightsWhenWidgetInteraction) {
        zapi.system.setStatus('AutoLights', OFF);
      }
    });

    this.powerOnButton = zapi.ui.addWidgetMapping(this.widgetPowerOn);
    this.powerOnButton.on('clicked', () => {
      if (this.config.supportsPower) {
        this.on();
      }
      else {
        this.dim(this.beforeOffLevel);
      }
      if (systemconfig.system.disableAutoLightsWhenWidgetInteraction) {
        zapi.system.setStatus('AutoLights', OFF);
      }
    });

    this.powerOffButton = zapi.ui.addWidgetMapping(this.widgetPowerOff);
    this.powerOffButton.on('clicked', () => {
      if (this.config.supportsPower) {
        this.off();
      }
      else {
        this.beforeOffLevel = this.currentDimLevel;
        this.dim(0);
      }
      if (systemconfig.system.disableAutoLightsWhenWidgetInteraction) {
        zapi.system.setStatus('AutoLights', OFF);
      }
    });


    this.setDefaults();


  }

  setDefaults() {
    if (this.config.supportsPower) {
      if (this.config.defaultPower == 'on') {
        this.on();
      }
      else {
        this.off();
      }
    }
    else {
      if (this.config.defaultPower != undefined) {
        this.powerSwitch.setValue(this.config.defaultPower);
      }

    }

    //Dim
    if (this.config.supportsDim) {
      if (this.config.defaultDim != undefined) {
        this.dim(this.config.defaultDim, true);

      }

    }
  }

  on() {
    if (this.config.supportsPower) {
      if (this.currentPowerStatus != true) {
        debug(1, `DEVICE ${this.config.id}: On`);
        this.driver.on();
        this.currentPower = 'on';
        this.powerSwitch.setValue('on');
      }
    }
    else {
      if (this.config.supportsDim) {
        this.dim(this.beforeOffLevel);
        debug(1, `DEVICE ${this.config.id}: Dim ${this.currentDimLevel} (device does not support power commands)`);
      }
    }
  }

  off() {
    if (this.config.supportsPower) {
      if (this.currentPowerStatus != false) {
        debug(1, `DEVICE ${this.config.id}: Off`);
        this.driver.off();
        this.currentPower = 'off';
        this.powerSwitch.setValue('off');
      }
    }
    else {
      if (this.config.supportsDim) {
        debug(1, `DEVICE ${this.config.id}: Dim 0 (device does not support power commands)`);
        this.dim(0);
      }
    }
  }

  power(power) {
    if (power.toLowerCase() == 'on') {
      this.on();
    }
    else {
      this.off();
    }
  }

  setPower(power) {
    this.power(power);
  }

  dim(level, force = false) {
    if (this.config.supportsDim) {
      if (this.currentDimLevel != level || force) {
        debug(1, `DEVICE ${this.config.id}: Dim ${level}`);
        this.driver.dim(level);
        this.currentDimLevel = level;
        let mappedValue = mapValue(level, 0, 100, 0, 255);
        this.levelSlider.setValue(mappedValue);
        this.levelLabel.setValue(level);
      }
    }
  }

  reset() {
    this.setDefaults();
  }
}


export class CameraPreset {
  constructor(config) {
    this.config = config;
    this.camPresetWidget = zapi.ui.addWidgetMapping(this.config.id + ':ACTIVATE');
    this.camPresetWidget.on('clicked', () => {
      this.activate();
    });
  }
  activate(skipSetVideoSource = false) {
    if (this.config.presetType == 'preset') {
      debug(1, `DEVICE ${this.config.id}: Activating preset`);
      zapi.devices.activateCameraPreset(this.config.presetName, skipSetVideoSource);
    }
    else if (this.config.presetType == 'source') {
      zapi.devices.setMainVideoSource(this.config.presetSource);
    }

  }
}


export class AudioInput {
  constructor(config) {
    this.config = config;
    try {
      this.driver = new this.config.driver(this, config);
    }
    catch (e) {
      debug(3,`AudioInput (constructor) ERROR: Could not load audio driver for device ${this.config.id}`);
    }
    this.currentGain = undefined;
    this.currentMute = undefined;
    this.beforeBoostGain = undefined;
    this.widgetModeName = this.config.id + ':MODE';
    this.widgetLevelName = this.config.id + ':LEVEL';
    this.widgetLevelGroupName = this.config.id + ':LEVELGROUP';
    this.beforeBoostGain = undefined;
    this.storedGain = this.config.defaultGain;
    //Default UI Handling
    this.modeSwitch = zapi.ui.addWidgetMapping(this.widgetModeName);
    this.modeSwitch.on('changed', value => {
      this.setMode(value);
    });

    this.levelSlider = zapi.ui.addWidgetMapping(this.widgetLevelName);
    this.levelSlider.on('changed', value => {
      let mappedGain = mapValue(value, 0, 255, this.config.gainLowLimit, this.config.gainHighLimit);
      this.setGain(mappedGain);
    });
    if (this.config.lowGain || this.config.mediumGain || this.config.highGain) {
      this.levelGroup = zapi.ui.addWidgetMapping(this.widgetLevelGroupName);
      this.levelGroup.on('released', value => {
        if (value == 'off') {
          this.setGain(0, true);
        }
        if (value == 'low') {
          this.setGain(this.config.lowGain);
        }
        else if (value == 'medium') {
          this.setGain(this.config.mediumGain);
        }
        else if (value == 'high') {
          this.setGain(this.config.highGain);
        }
      });
    }
    this.setDefaults();
  }

  setDefaults() {
    if (this.config.defaultGain != undefined) {
      this.setGain(this.config.defaultGain);
      this.beforeBoostGain = this.config.defaultGain;
    }
    if (this.config.defaultMode != undefined) {
      this.setMode(this.config.defaultMode);
    }

  }

  setGain(gain, ignoreLimits = false) {
    debug(1, `DEVICE ${this.config.id}: setGain: ${gain}`);
    if (!ignoreLimits) {
      if (gain < this.config.gainLowLimit) {
        gain = this.config.gainLowLimit;
      }
      if (gain > this.config.gainHighLimit) {
        gain = this.config.gainHighLimit;
      }
    }

    this.currentGain = gain;
    this.driver.setGain(gain);
    let mappedGain = mapValue(gain, this.config.gainLowLimit, this.config.gainHighLimit, 0, 255);
    this.levelSlider.setValue(mappedGain);
    if (this.config.lowGain || this.config.mediumGain || this.config.highGain) {
      if (gain == 0) {
        this.levelGroup.setValue('off');
      }
      else if (gain <= this.config.lowGain) {
        this.levelGroup.setValue('low');
      }
      else if (gain > this.config.lowGain && gain < this.config.highGain) {
        this.levelGroup.setValue('medium');
      }
      else if (gain >= this.config.highGain) {
        this.levelGroup.setValue('high');
      }

    }
  }

  setLevel(level, ignoreLimits = false) {
    this.setGain(level, ignoreLimits);
  }

  getGain() {
    return this.currentGain;
  }

  getLevel() {
    return this.currentGain;
  }

  increaseGain() {
    debug(1, `DEVICE ${this.config.id}: Increasing gain: ${this.currentGain + this.config.gainStep}`);
    if ((this.currentGain + this.config.gainStep) <= this.config.gainHighLimit) {
      this.setGain(this.currentGain + this.config.gainStep);
    }
    else {
      this.setGain(this.config.gainHighLimit);
    }
  }

  increaseLevel() {
    this.increaseGain();
  }

  decreaseGain() {
    debug(1, `DEVICE ${this.config.id}: Decreasing gain: ${this.currentGain - this.config.gainStep}`);
    if ((this.currentGain - this.config.gainLowLimit) >= this.config.gainLowLimit) {
      this.setGain(this.currentGain + this.config.gainStep);
    }
    else {
      this.setGain(this.config.gainLowLimit);
    }
  }

  decreaseLevel() {
    this.decreaseGain();
  }

  off() {
    debug(1, `DEVICE ${this.config.id}: Off`);
    this.currentMute = true;
    this.driver.off();
    this.modeSwitch.setValue('off');
  }

  on() {
    debug(1, `DEVICE ${this.config.id}: On`);
    this.currentMute = false;
    this.driver.on();
    this.modeSwitch.setValue('on');
  }

  setMode(mode) {
    if (mode.toLowerCase() == 'off') {
      this.off();
    }
    else {
      this.on();
    }
  }

  setBoost(boost) {
    if (boost == true || boost == 'on') {
      this.beforeBoostGain = this.currentGain;
      this.setGain(this.config.boost);
    }
    else if (boost == false || boost == 'off') {
      this.setGain(this.beforeBoostGain);
    }
  }

  storeGain() {
    this.storedGain = this.currentGain;
  }
  restoreGain() {
    this.setGain(this.storedGain);
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
    this.setDefaults();
  }

  refresh() {
    this.setGain(this.currentGain, false);
  }
}


export class AudioOutput {
  constructor(config) {
    this.config = config;
    this.driver = new this.config.driver(this, config);
    this.currentLevel = undefined;
    this.currentMute = undefined;
    this.widgetModeName = this.config.id + ':MODE';
    this.widgetLevelName = this.config.id + ':LEVEL';
    this.widgetLevelGroupName = this.config.id + ':LEVELGROUP';
    this.storedLevel = this.config.defaultLevel;

    //Default UI Handling
    this.modeSwitch = zapi.ui.addWidgetMapping(this.widgetModeName);
    this.modeSwitch.on('changed', value => {
      this.setMode(value);
    });

    this.levelSlider = zapi.ui.addWidgetMapping(this.widgetLevelName);
    this.levelSlider.on('changed', value => {
      let mappedLevel = mapValue(value, 0, 255, this.config.levelLowLimit, this.config.levelHighLimit);
      this.setLevel(mappedLevel);
    });

    if (this.config.lowLevel || this.config.mediumLevel || this.config.highLevel) {
      this.levelGroup = zapi.ui.addWidgetMapping(this.widgetLevelGroupName);
      this.levelGroup.on('released', value => {
        if (value == 'off') {
          this.setLevel(-24, true);
        }
        if (value == 'low') {
          this.setLevel(this.config.lowLevel);
        }
        else if (value == 'medium') {
          this.setLevel(this.config.mediumLevel);
        }
        else if (value == 'high') {
          this.setLevel(this.config.highLevel);
        }
      });
    }

    this.setDefaults();
  }

  setDefaults() {
    if (this.config.defaultLevel != undefined) {
      this.setLevel(this.config.defaultLevel);
    }
    if (this.config.defaultMode != undefined) {
      this.setMode(this.config.defaultMode);
    }
  }

  setLevel(level, ignoreLimits = false) {
    debug(1, `DEVICE ${this.config.id}: setLevel: ${level}`);
    if (!ignoreLimits) {
      if (level < this.config.levelLowLimit) {
        level = this.config.levelLowLimit;
      }
      if (level > this.config.levelHighLimit) {
        level = this.config.levelHighLimit;
      }
    }

    this.currentLevel = level;
    this.driver.setLevel(level);
    let mappedLevel = mapValue(level, this.config.levelLowLimit, this.config.levelHighLimit, 0, 255);
    this.levelSlider.setValue(mappedLevel);
    if (this.config.lowLevel || this.config.mediumLevel || this.config.highLevel) {
      if (level == -24) {
        this.levelGroup.setValue('off');
      }
      else if (level <= this.config.lowLevel) {
        this.levelGroup.setValue('low');
      }
      else if (level > this.config.lowLevel && level < this.config.highLevel) {
        this.levelGroup.setValue('medium');
      }
      else if (level >= this.config.highLevel) {
        this.levelGroup.setValue('high');
      }

    }
  }

  getLevel() {
    return this.currentLevel;
  }

  increaseLevel() {
    debug(1, `DEVICE ${this.config.id}: Increasing level: ${this.currentLevel + this.config.levelStep}`);
    if ((this.currentLevel + this.config.levelStep) <= this.config.levelHighLimit) {
      this.setLevel(this.currentLevel + this.config.levelStep);
    }
    else {
      this.setLevel(this.config.levelHighLimit);
    }
  }

  decreaseLevel() {
    debug(1, `DEVICE ${this.config.id}: Decreasing level: ${this.currentLevel - this.config.levelStep}`);
    if ((this.currentLevel - this.config.levelLowLimit) >= this.config.levelLowLimit) {
      this.setLevel(this.currentLevel + this.config.levelStep);
    }
    else {
      this.setLevel(this.config.levelLowLimit);
    }
  }

  off() {
    debug(1, `DEVICE ${this.config.id}: Off`);
    this.currentMute = true;
    this.driver.off();
    this.modeSwitch.setValue('off');
  }

  on() {
    debug(1, `DEVICE ${this.config.id}: On`);
    this.currentMute = false;
    this.driver.on();
    this.modeSwitch.setValue('on');
  }

  setMode(mode) {
    if (mode.toLowerCase() == 'off') {
      this.off();
    }
    else {
      this.on();
    }
  }

  storeLevel() {
    this.storedLevel = this.currentLevel;
  }
  restoreLevel() {
    this.setLevel(this.storedLevel);
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
    this.setDefaults();
  }

  refresh() {
    this.setLevel(this.currentLevel, false);
  }
}


export class ControlSystem {
  constructor(config) {
    this.config = config;
    this.driver = new this.config.driver(this, config);
  }
  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
  }
}


export class Screen {
  constructor(config) {
    this.config = config;
    var self = this;
    this._currentPosition = 'unknown';
    this.driver = new this.config.driver(this, config);

    this.setDefaults();

    //Default WidgetMapping
    var downButton = zapi.ui.addWidgetMapping(this.config.id + ':DOWN');
    var upButton = zapi.ui.addWidgetMapping(this.config.id + ':UP');

    downButton.on('clicked', () => {
      self.down();
    });

    upButton.on('clicked', () => {
      self.up();
    });
  }

  setDefaults() {
    this.setPosition(this.config.defaultPosition);
  }

  setPosition(position) {
    position = position.toLowerCase();
    if (this._currentPosition != position) {
      this._currentPosition = position;
      this.driver.setPosition(position);
    }
  }

  up() {
    debug(1, `DEVICE ${this.config.id}: Going UP`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.up');
    this.setPosition('up');
  }

  down() {
    debug(1, `DEVICE ${this.config.id}: Going DOWN`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.down');
    this.setPosition('down');
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
    this.setDefaults();
  }
}


export class SoftwareDevice {
  constructor(config) {
    this.config = config;
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
  }
}


export class AudioReporter {
  constructor(config) {
    this.config = config;
    this.driver = new this.config.driver(this, config);
    this.reportCallbacks = [];
    if (this.config.start) {
      this.start();
    }
  }
  report(data) {
    for (let reportReceiver of this.reportCallbacks) {
      reportReceiver(data);
    }
  }
  start() {
    this.driver.start();
  }
  stop() {
    this.driver.stop();
  }
  onReport(callback) {
    this.reportCallbacks.push(callback);
  }
}


export class Shade {
  constructor(config) {
    this.config = config;
    var self = this;
    this._currentPosition = undefined;
    this.driver = new this.config.driver(this, config);

    this.setDefaults();

    //Default WidgetMapping
    var downButton = zapi.ui.addWidgetMapping(this.config.id + ':DOWN');
    var upButton = zapi.ui.addWidgetMapping(this.config.id + ':UP');

    downButton.on('clicked', () => {
      self.down();
    });

    upButton.on('clicked', () => {
      self.up();
    });
  }

  setDefaults() {
    this.setPosition(this.config.defaultPosition);
  }

  setPosition(position) {
    position = position.toLowerCase();
    if (position != this._currentPosition) {
      this._currentPosition = position;
      this.driver.setPosition(position);
    }
  }

  up() {
    debug(1, `DEVICE ${this.config.id}: Going UP`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.up');
    this.setPosition('up');
  }

  down() {
    debug(1, `DEVICE ${this.config.id}: Going DOWN`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.down');
    this.setPosition('down');
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
    this.setDefaults();
  }
}