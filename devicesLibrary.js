import xapi from 'xapi';
import { config } from './config';
import { zapiv1 } from './zapi';

var zapi = zapiv1;

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
    this.driver = new config.driver(this, config);
    zapi.ui.addActionMapping(/^LIGHTSCENE$/, (id) => {
      if (id == this.config.id) {
        this.activate();
      }
    });
  }
  activate() {
    debug(1, `DEVICE ${this.config.id}: activate`);
    this.driver.activate();
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
      debug(2, `DEVICE ${this.config.id} connectToRemoteOutputs error: ${e}`);
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
      debug(2, `DEVICE ${this.config.id} disconnectFromRemoteOutputs error: ${e}`);
    }
  }

  connectToLocalOutput(lo) {
    try {
      xapi.Command.Audio.LocalOutput.ConnectInput({
        InputId: this.inputId,
        OutputId: lo.inputId
      });
      debug(1, `DEVICE ${this.config.id}: ConnectToLocalOutput: ${li.id}`);
    }
    catch (e) {
      debug(2, `DEVICE ${this.config.id} ConnectToLocalOutput error: ${e}`);
    }
  }

  disconnectFromLocalOutput(lo) {
    try {
      xapi.Command.Audio.LocalOutput.DisconnectInput({
        InputId: this.inputId,
        OutputId: lo.outputId
      });
      debug(1, `DEVICE ${this.config.id}: DisconnectFromLocalOutput: ${li.id}`);
    }
    catch (e) {
      debug(2, `DEVICE ${this.config.id} DisconnectFromLocalOutput error: ${e}`);
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
    console.error('IT WORKS!');
  }
  connectLocalInput(li) {
    try {
      xapi.Command.Audio.LocalOutput.ConnectInput({
        InputId: li.inputId,
        OutputId: this.outputId
      });
      debug(1, `DEVICE ${this.config.id}: ConnectLocalInput: ${li.id}`);
    }
    catch (e) {
      debug(2, `DEVICE ${this.config.id} ConnectLocalInput error: ${e}`);
    }
  }

  disconnectLocalInput(li) {
    try {
      xapi.Command.Audio.LocalOutput.DisconnectInput({
        InputId: li.inputId,
        OutputId: this.outputId
      });
      debug(1, `DEVICE ${this.config.id}: disConnectLocalInput: ${li.id}`);
    }
    catch (e) {
      debug(2, `DEVICE ${this.config.id} DisconnectLocalInput error: ${e}`);
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
      debug(2, `DEVICE ${this.config.id} connectRemoteInputs error: ${e}`);
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
      debug(2, `DEVICE ${this.config.id} disConnectRemoteInputs error: ${e}`);
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
    this._usageHoursReqTimeout = undefined;
    this.powerOffTimeout = undefined;
    var self = this;

    if (config.supportsUsageHours) {
      this._usageHoursRequestInterval = setInterval(() => {
        debug(1, `Requesting usage hours for display "${this.config.id}"`);
        self.driver.requestUsageHours();
        this._usageHoursReqTimeout = setTimeout(() => {
          debug(1, `No usage hours response for display "${this.config.id}"`);
        }, 5000);
      }, this.config.usageHoursRequestInterval);
    }

    // Load driver
    this.driver = new config.driver(this, config);

    this.setDefaults();

    // Default WidgetMapping
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

  setDefaults() {
    if (this.config.defaultPower === 'on') {
      this.powerOn();
    } else {
      this.powerOff(0);
    }
  }

  setPower(power, delay = this.config.powerOffDelay) {
    power = power.toLowerCase();
    if (this.config.supportsPower) {
      if (this._currentPower !== power) {
        if (power === 'on') {
          this.powerOn();
        } else {
          this.powerOff(delay);
        }
      }
    }
  }

  off (delay = this.config.powerOffDelay) {
    this.powerOff(delay);
  }
  powerOff(delay = this.config.powerOffDelay) {
    debug(1, `DEVICE ${this.config.id}: OFF`);
    zapi.performance.inc('DEVICE.' + this.config.id + '.powerOff');
    if (this.config.supportsPower) {
      if (this._currentPower !== 'off') {
        this._currentPower = 'off';
        zapi.ui.setWidgetValue(this.config.id + ':POWERSTATUS', `OFF (transiting ${delay}ms)`);
        zapi.ui.setWidgetValue(this.config.id + ':POWER', 'off');
        debug(1, `Display "${this.config.id}" POWER set to OFF. Delay: ${delay} ms"`);
        clearTimeout(this.powerOffTimeout);
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
    clearTimeout(this._usageHoursReqTimeout);
    debug(1, `Received usage hours report for display "${this.config.id}": ${usage}`);
    this._usageHours = usage;
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
    this.driver = new config.driver(this, config);
    this.currentPowerStatus = undefined;
    this.widgetLevelName = this.config.id + ':LEVEL';
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
          this.beforeOffLevel = this.currentDimLevel
          this.dim(0);
        }
      }

    });

    this.levelSlider = zapi.ui.addWidgetMapping(this.widgetLevelName);
    this.levelSlider.on(this.config.sliderEvent, value => {
      let mappedValue = mapValue(value, 0, 255, 0, 100);
      this.dim(mappedValue);
      if (!this.config.supportsPower) {
        this.powerSwitch.setValue('on');
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

  dim(level, force = false) {
    if (this.config.supportsDim) {
      if (this.currentDimLevel != level || force) {
        debug(1, `DEVICE ${this.config.id}: Dim ${level}`);
        this.driver.dim(level);
        this.currentDimLevel = level;
        let mappedValue = mapValue(level, 0, 100, 0, 255);
        this.levelSlider.setValue(mappedValue);
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
  activate() {
    debug(1, `DEVICE ${this.config.id}: Activating preset`);
    zapi.devices.activateCameraPreset(this.config.presetName);
  }
}


export class AudioInput {
  constructor(config) {
    this.config = config;
    this.driver = new config.driver(this, config);
    this.currentGain = undefined;
    this.currentMute = undefined;
    this.widgetModeName = this.config.id + ':MODE';
    this.widgetLevelName = this.config.id + ':LEVEL';
    this.widgetLevelGroupName = this.config.id + ':LEVELGROUP';

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
    }
    if (this.config.defaultMode != undefined) {
      this.setMode(this.config.defaultMode);
    }

  }

  setGain(gain) {
    debug(1, `DEVICE ${this.config.id}: setGain: ${gain}`);
    if (gain < this.config.gainLowLimit) {
      gain = this.config.gainLowLimit;
    }
    if (gain > this.config.gainHighLimit) {
      gain = this.config.gainHighLimit;
    }

    this.currentGain = gain;
    this.driver.setGain(gain);
    let mappedGain = mapValue(gain, this.config.gainLowLimit, this.config.gainHighLimit, 0, 255);
    this.levelSlider.setValue(mappedGain);
    if (this.config.lowGain || this.config.mediumGain || this.config.highGain) {
      if (gain <= this.config.lowGain) {
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

  setLevel(level) {
    this.setGain(level);
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

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
    this.setDefaults();
  }
}


export class ControlSystem {
  constructor(config) {
    this.config = config;
  }
  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
  }
}

export class Screen {
  constructor(config) {
    this.config = config;
    var self = this;
    this._currentPosition = undefined;
    this.driver = new config.driver(this, config);

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
      this.driver.setPosition(position)
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


export class Virtual {
  constructor(config) {
    this.config = config;
  }

  reset() {
    debug(1, `DEVICE ${this.config.id}: RESET`);
  }
}










