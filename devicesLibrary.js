import xapi from 'xapi';
import { config } from './config';
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

export class Light { //TODO: UI Handling
  constructor(config) {
    this.api = zapiv1;
    this.config = config;
    this.driver = new config.driver(this, config);
    this.lastPowerStatus = undefined;
    this.lastDimLevel = undefined;

    this.setDefaults();


  }
  setDefaults() {
    if (this.config.defaultPower != undefined) {
      this.setPower(this.config.defaultPower);
    }
    if (this.config.defaultDim != undefined) {
      this.dim(this.config.defaultDim);
    }
  }
  on() {
    if (this.config.supportsPower) {
      if (this.lastPowerStatus != true) {
        debug(1, `DEVICE ${this.config.id} (${this.config.name}): On`);
        this.driver.on();
      }
    }
  }
  off() {
    if (this.config.supportsPower) {
      if (this.lastPowerStatus != false) {
        debug(1, `DEVICE ${this.config.id} (${this.config.name}): Off`);
        this.driver.off();
      }
    }
    else {
      if (this.config.supportsDim) {
        debug(1, `DEVICE ${this.config.id} (${this.config.name}): Dim 0 (device does not support power commands)`);
        this.driver.dim(0);
      }
    }
  }
  setPower(power) {
    if (power) {
      this.on();
    }
    else {
      this.off();
    }
  }
  dim(level) {
    if (this.config.supportsDim) {
      if (this.lastDimLevel != level) {
        debug(1, `DEVICE ${this.config.id} (${this.config.name}): Dim ${level}`);
        this.driver.dim(level);
      }
    }
  }
  reset() {
    this.setDefaults();
  }
}


export class CameraPreset {
  constructor(config) {
    this.api = zapiv1;
    this.config = config;

  }
  activate() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Activating preset`);
    this.api.devices.activateCameraPreset(this.config.presetName);
  }

}


export class AudioInput {
  constructor(config) {
    this.api = zapiv1;
    this.config = config;
    this.driver = new config.driver(this, config);
    this.currentGain = undefined;
    this.currentMute = undefined;
    this.widgetModeName = this.config.id + '_MODE';
    this.widgetLevelName = this.config.id + '_LEVEL';
    this.widgetLevelGroupName = this.config.id + '_LEVELGROUP';

    //Default UI Handling
    this.modeSwitch = this.api.ui.addWidgetMapping(this.widgetModeName);
    this.modeSwitch.on('changed', value => {
      this.setMode(value);
    });

    this.levelSlider = this.api.ui.addWidgetMapping(this.widgetLevelName);
    this.levelSlider.on('changed', value => {
      let mappedGain = this.mapValue(value, 0, 255, this.config.gainLowLimit, this.config.gainHighLimit);
      this.setGain(mappedGain);
    });

    if (this.config.lowGain || this.config.mediumGain || this.config.highGain) {
      this.levelGroup = this.api.ui.addWidgetMapping(this.widgetLevelGroupName);
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
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): setGain: ${gain}`);
    if (gain < this.config.gainLowLimit) {
      gain = this.config.gainLowLimit;
    }
    if (gain > this.config.gainHighLimit) {
      gain = this.config.gainHighLimit;
    }

    this.currentGain = gain;
    this.driver.setGain(gain);
    let mappedGain = this.mapValue(gain, this.config.gainLowLimit, this.config.gainHighLimit, 0, 255);
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
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Increasing gain: ${this.currentGain + this.config.gainStep}`);
    if ((this.currentGain + this.config.gainStep) <= this.config.gainHighLimit) {
      this.setGain(this.currentGain + this.config.gainStep);
    }
    else {
      this.setGain(this.config.gainHighLimit);
    }
  }
  increaseLEvel() {
    this.increaseGain();
  }
  decreaseGain() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Decreasing gain: ${this.currentGain - this.config.gainStep}`);
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
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Off`);
    this.currentMute = true;
    this.driver.off();
    this.modeSwitch.setValue('off');
  }
  on() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): On`);
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
  mapValue(value, fromMin, fromMax, toMin, toMax) {
    if (value < fromMin) value = fromMin;
    if (value > fromMax) value = fromMax;
    const normalizedValue = (value - fromMin) / (fromMax - fromMin);
    const mappedValue = Math.round((normalizedValue * (toMax - toMin)) + toMin);
    return mappedValue;
  }
  reset() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): RESET`);
    this.setDefaults();
  }
}

export class ControlSystem {
  constructor(config) {
    this.config = config;
  }
  reset() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): RESET`);
  }
}

export class Screen {
  constructor(config) {
    this.config = config;
    var self = this;
    this.api = zapiv1;
    this._currentPosition = undefined;
    this.driver = new config.driver(this, config);

    this.setDefaults();

    //Default WidgetMapping
    var downButton = this.api.ui.addWidgetMapping(this.config.id + '_SETPOSITION:DOWN');
    var upButton = this.api.ui.addWidgetMapping(this.config.id + '_SETPOSITION:UP');

    downButton.on('clicked', () => {
      self.down();
    });

    upButton.on('clicked', () => {
      self.up();
    });
  }
  setDefaults() {
    this.setPosition(config.defaultPosition);
  }
  setPosition(position) {
    if (position != this._currentPosition) {
      this._currentPosition = position;
      this.driver.setPosition(position)
    }
  }
  up() {
    this.api.performance.inc('DEVICE.' + this.config.name + '.up');
    this.setPosition(false);
  }
  down() {
    this.api.performance.inc('DEVICE.' + this.config.name + '.down');
    this.setPosition(true);
  }
  reset() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): RESET`);
  }
}


export class Virtual {
  constructor(config) {
    this.config = config;
  }
  reset() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): RESET`);
  }
}

export class Display {
  constructor(config) {
    this.api = zapiv1;
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
        debug(1, `Requesting usage hours for display "${this.config.name}"`);
        self.driver.requestUsageHours();
        this._usageHoursReqTimeout = setTimeout(() => {
          debug(1, `No usage hours response for display "${this.config.name}"`);
        }, 5000);
      }, this.config.usageHoursRequestInterval);
    }

    //Load driver
    this.driver = new config.driver(this, config);

    this.setDefaults();


    //Default WidgetMapping
    var onButton = this.api.ui.addWidgetMapping(this.config.name + '_SETPOWER:ON');
    var offButton = this.api.ui.addWidgetMapping(this.config.name + '_SETPOWER:OFF');

    onButton.on('clicked', () => {
      self.powerOn();
    });

    offButton.on('clicked', () => {
      self.powerOff();
    });
  }
  setDefaults() {
    //Set defaults (adds a 1 second delay to accomodate other UI threads)
    setTimeout(() => {
      if (this.config.defaultPower) {
        this.powerOn();
      }
      else {
        this.powerOff(0);
      }
    }, 1000);
  }
  getType() { return 'DISPLAY ' }

  setPower(power, delay = this.config.powerOffDelay) {
    if (this.config.supportsPower) {
      if (this._currentPower != power) {
        if (power) {
          this.powerOn();
        }
        else {
          this.powerOff(delay);
        }
      }
    }
  }
  powerOff(delay = this.config.powerOffDelay) {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Power OFF`);
    this.api.performance.inc('DEVICE.' + this.config.name + '.powerOff');
    if (this.config.supportsPower) {
      if (this._currentPower != false) {
        this._currentPower = false;
        this.api.ui.setWidgetValue(this.config.name + '_POWERSTATUS', `OFF (transiting ${delay}ms)`);
        debug(1, `Display "${this.config.name}" POWER set to OFF. Delay: ${delay} ms"`);
        clearTimeout(this.powerOffTimeout);
        this.powerOffTimeout = setTimeout(() => {
          this.driver.setPower(false);
          this.api.ui.setWidgetValue(this.config.name + '_POWERSTATUS', `OFF`);
        }, delay);
        if (this.config.blankBeforePowerOff) {
          this.driver.setBlanking(true);
        }
      }
    }
  }
  powerOn() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Power ON`);
    this.api.performance.inc('DEVICE.' + this.config.name + '.powerOn');
    if (this.config.supportsPower) {
      if (this._currentPower != true) {
        this._currentPower = true;
        this.api.ui.setWidgetValue(this.config.name + '_POWERSTATUS', 'ON');
        clearTimeout(this.powerOffTimeout);
        this.driver.setPower(true);
        if (this.config.blankBeforePowerOff) {
          this.driver.setBlanking(false);
        }
      }
    }
  }
  getPower() {
    return this._currentPower;
  }
  setBlanking(blanking) {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Blanking ${blanking}`);
    if (this.config.supportsBlanking) {
      if (this._currentBlanking != blanking) {
        debug(1, `Display "${this.config.id}" sets blanking to "${blanking}"`);
        this.driver.setBlanking(blanking);
        this._currentBlanking = blanking;
      }
    }
  }
  getBlanking() {
    return this._currentBlanking;
  }
  setSource(source) {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Source ${source}`);
    if (this.config.supportsSource) {
      if (this._currentSource != source) {
        debug(1, `Display "${this.config.id}" sets source to "${source}"`);
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
    debug(1, `Received usage hours report for display "${this.config.name}": ${usage}`);
    this._usageHours = usage;
  }

  processActionPower(power) {
    if (power == 'ON') {
      this.powerOn();
    }
    else if (power == 'OFF') {
      this.powerOff(0);
    }
  }
  processActionPowerDelay(power) {
    if (power == 'ON') {
      this.powerOn();
    }
    else if (power == 'OFF') {
      this.powerOff(this.config.powerOffDelay);
    }
  }

  reset() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): RESET`);
  }
}





export class ACInputGroup {

}
export class ACOutputGroup {

}




export class LightScene {

}

export class VideoOutput {

}

export class Camera {
  constructor() {

  }
}

export class AudioInputGroup {

}
export class AudioOutputGroup {

}
export class LightsGroup {

}



