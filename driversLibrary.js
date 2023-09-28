import xapi from 'xapi';
import { config } from './config';


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
    let powerStatus = power ? 'ON' : 'OFF';
    let powerString = this.config.name + '_' + powerStatus;
    xapi.Command.Message.Send({ Text: powerString });
  }
  setBlanking(blanking) {
    let blankingStatus = blanking ? 'ON' : 'OFF';
    let blankingString = this.config.name + '_BLANKING_' + blankingStatus;
    xapi.Command.Message.Send({ Text: blankingString });
  }
  setSource(source) {

  }
  getUsageHours() {
    return this.usageHours;
  }
  requestUsageHours() {
    xapi.Command.Message.Send({ Text: 'LAMPREQ:' + this.config.name });
  }
  custom() { }
}


export class ScreenDriver_isc_h21 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }
  setPosition(position) {
    let positionString = position ? 'DOWN' : 'UP';
    xapi.Command.Message.Send({ Text: this.config.name + '_' + positionString });
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
    debug(1, `DRIVER AudioInput_internal (${this.config.name}): setGain: ${gain}`);
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
    debug(1, `DRIVER AudioInput_internal (${this.config.name}): Off`);
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
    debug(1, `DRIVER AudioInput_internal (${this.config.name}): On`);
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
    debug(1, `DRIVER Light_isc_h21 (${this.config.name}): On`);
  }
  off() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.name}): Off`);
  }
  dim(level) {
    debug(1, `DRIVER Light_isc_h21 (${this.config.name}): Dim ${level}`);
  }
}

export class ScreenDriver_gpio {

}

export class LightDriver_messages {

}

export class LightSceneDriver_messages {

}

