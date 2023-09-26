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

export class AudioInput {
  constructor(config) {
    this.config = config;
    this.driver = new config.driver(this, config);
    this.currentGain = undefined;
    this.currentMute = undefined;
    this.setDefaults();

  }
  setDefaults() {
    this.setGain(this.config.defaultGain);
    this.setMute(this.config.defaultMute);
  }
  reset() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): RESET`);
    this.setDefaults();
  }
  setGain(gain) {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): setGain: ${gain}`);
    this.currentGain = gain;
    this.driver.setGain(gain);
  }
  getGain() {
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
  decreaseGain() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Decreasing gain: ${this.currentGain - this.config.gainStep}`);
    if ((this.currentGain - this.config.gainLowLimit) >= this.config.gainLowLimit) {
      this.setGain(this.currentGain + this.config.gainStep);
    }
    else {
      this.setGain(this.config.gainLowLimit);
    }

  }
  mute() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Muting`);
    this.currentMute = true;
    this.driver.mute();
  }
  unmute() {
    debug(1, `DEVICE ${this.config.id} (${this.config.name}): Unmuting`);
    this.currentMute = false;
    this.driver.unmute();
  }
  setMute(mute) {
    if (mute) {
      this.mute();
    }
    else {
      this.unmute();
    }
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
    var downButton = this.api.ui.addWidgetMapping(this.config.name + '_SETPOSITION:DOWN');
    var upButton = this.api.ui.addWidgetMapping(this.config.name + '_SETPOSITION:UP');

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


    //this.setBlanking(this.config.defaultBlanking);

    //Setup UI ID mapping
    //Regex style with addActionMapping
    /*
    let powerPattern = new RegExp('^' + this.config.name + '_POWER');
    this.api.ui.addActionMapping(powerPattern, (power) => { self.processActionPower(power); });

    let powerDelayPattern = new RegExp('^' + this.config.name + '_DELAYPOWER');
    this.api.ui.addActionMapping(powerDelayPattern, (power) => { self.processActionPowerDelay(power) });
    */




    /* TEST
    var testslider = this.api.ui.addWidgetMapping('TEST_SLIDER');
    var slidervalue = this.api.ui.addWidgetMapping('slider_value');
    testslider.setValue(30);
    slidervalue.setValue('Normal');

    testslider.on('changed', value => {
      if (value >= 0 && value < 85) {
        slidervalue.setValue('Normal');
      }
      else if (value >= 85 && value < 170) {
        slidervalue.setValue('Fort');
      }
      else if (value >= 170) {
        slidervalue.setValue('Trop fort');
      }
    });


    var testbutton = this.api.ui.addWidgetMapping('testbutton');
    testbutton.on('clicked', event => {
      testslider.setValue(30);
      slidervalue.setValue('Normal');
    });
    */



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


export class Light {

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



