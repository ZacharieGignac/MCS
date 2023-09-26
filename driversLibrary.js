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

export class AudioInput_internal {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }
  setGain(gain) {
    debug(1, `DRIVER AudioInput_internal (${this.config.name}): setGain: ${gain}`);
  }
  setMute(mute) {
    if (mute) {
      this.mute();
    }
    else {
      this.unmute();
    }
  }
  mute() {
    debug(1, `DRIVER AudioInput_internal (${this.config.name}): Muting`);
  }
  unmute() {
    debug(1, `DRIVER AudioInput_internal (${this.config.name}): Unmuting`);
  }
}

export class ScreenDriver_gpio {

}

export class LightDriver_messages {

}

export class LightSceneDriver_messages {

}

