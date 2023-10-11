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

export class LightSceneDriver_lights {
  constructor(device, config) {
    this.device = device;
    this.config = config;
  }

  activate() {
    for (let light of this.config.lights) {
      for (let prop in light) {
        if (light.hasOwnProperty(prop)) {
          if (prop != 'id') {
            let l = zapi.devices.getDevice(light.id);
            l[prop](light[prop]);
          }
        }
      }
    }
  }
}


export class LightSceneDriver_isc {
  constructor(device, config) {
    this.device = device;
    this.config = config;
  }

  activate() {
    zapi.system.sendMessage(`LS_${this.config.name}`);
  }
}


export class DisplayDriver_isc_h21 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
    if (config.supportsUsageHours) {
      xapi.Event.Message.Send.Text.on(text => {
        let split = text.split('_');
        if (split[0] == config.name && split[1] == "UHREP") {
          this.device.fbUsageHours(split[2]);
        }
      });
    }
  }

  setPower(power) {
    power = power.toLowerCase();
    let powerString = this.config.name + '_' + power.toUpperCase();
    zapi.system.sendMessage(powerString);
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    let blankingStatus = blanking ? 'ON' : 'OFF';
    let blankingString = this.config.name + '_BLANKING_' + blankingStatus;
    zapi.system.sendMessage(blankingString);
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {

  }

  getUsageHours() {
    return this.usageHours;
  }

  requestUsageHours() {
    zapi.system.sendMessage('LAMPREQ:' + this.config.name);
  }

  custom() { }
}


export class ScreenDriver_isc_h21 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setPosition(position) {
    position = position.toLowerCase();
    zapi.system.sendMessage(this.config.name + '_' + position);
    debug(1, `DRIVER ScreenDriver_isc_h21 (${this.config.id}): setPosition: ${position}`);
  }

  custom() {

  }
}

export class ScreenDriver_gpio {
  constructor(device, config) {
    this.config = config;
    this.device = device;

    if (this.config.pin) {
      this.gpiotype = 'single';
      this.pin = this.config.pin;
    }
    else {
      this.gpiotype = 'pair';
      this.pin1 = this.config.pin1;
      this.pin2 = this.config.pin2;
    }
    this.setPosition(this.config.defaultPosition);

  }

  setPosition(position) {
    var config = {};
    if (this.gpiotype == 'single') {
      config['Pin' + this.pin] = position == 'up' ? 'Low' : 'High';
    }
    else if (this.gpiotype == 'pair') {
      config['Pin' + this.pin1] = position == 'up' ? 'Low' : 'High';
      config['Pin' + this.pin2] = position == 'up' ? 'High' : 'Low';
    }
    console.error(config);
    xapi.Command.GPIO.ManualState.Set(config);
  }

  custom() {

  }
}

export class AudioInput_codecpro {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setGain(gain) {
    debug(1, `DRIVER AudioInput_codecpro (${this.config.id}): setGain: ${gain}`);
    switch (this.config.input) {
      case "microphone":
        xapi.Config.Audio.Input.Microphone[this.config.connector].Level.set(gain);
        break;
      case "hdmi":
        xapi.Config.Audio.Input.HDMI[this.config.connector].Level.set(gain);
        break;
      case "ethernet":
        xapi.Config.Audio.Input.Ethernet[this.config.connector].Channel[this.config.channel].Level.set(gain);
        break;
    }
  }

  off(mute) {
    if (mute.toLowerCase() == 'off') {
      this.mute();
    }
    else {
      this.unmute();
    }
  }

  off() {
    debug(1, `DRIVER AudioInput_codecpro (${this.config.id}): Off`);
    switch (this.config.input) {
      case 'microphone':
        xapi.Config.Audio.Input.Microphone[this.config.connector].mode.set('Off');
        break;
      case 'hdmi':
        this.Config.Audio.Input.Microphone[this.config.connector].mode.set('Off');
        break;
      case 'ethernet':
        this.Config.Audio.Input.Microphone[this.config.connector].mode.set('Off');
        break;
    }
  }

  on() {
    debug(1, `DRIVER AudioInput_codecpro (${this.config.id}): On`);
    switch (this.config.input) {
      case 'microphone':
        xapi.Config.Audio.Input.Microphone[this.config.connector].mode.set('On');
        break;
      case 'hdmi':
        this.Config.Audio.Input.Microphone[this.config.connector].mode.set('On');
        break;
      case 'ethernet':
        this.Config.Audio.Input.Microphone[this.config.connector].mode.set('On');
        break;
    }
  }
}


export class Light_isc_h21 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  on() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): On`);
    zapi.system.sendMessage(`${this.config.name}_ON`);
  }

  off() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Off`);
    zapi.system.sendMessage(`${this.config.name}_OFF`);
  }

  dim(level) {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Dim ${level}`);
    zapi.system.sendMessage(`${this.config.name}_DIM ${level}`);
  }
}



