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
        if(light.hasOwnProperty(prop)) {
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
    //xapi.Command.Message.Send({ Text: powerString });
    zapi.system.sendMessage(powerString);
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    let blankingStatus = blanking ? 'ON' : 'OFF';
    let blankingString = this.config.name + '_BLANKING_' + blankingStatus;
    //xapi.Command.Message.Send({ Text: blankingString });
    zapi.system.sendMessage(blankingString);
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {

  }

  getUsageHours() {
    return this.usageHours;
  }

  requestUsageHours() {
    //xapi.Command.Message.Send({ Text: 'LAMPREQ:' + this.config.name });
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
    //xapi.Command.Message.Send({ Text: this.config.name + '_' + positionString });
    zapi.system.sendMessage(this.config.name + '_' + position);
    debug(1, `DRIVER ScreenDriver_isc_h21 (${this.config.id}): setPosition: ${position}`);
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
    //xapi.Command.Message.Send({ Text: `${this.config.name}_ON`});
    zapi.system.sendMessage(`${this.config.name}_ON`);
  }

  off() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Off`);
    //xapi.Command.Message.Send({ Text: `${this.config.name}_OFF`});
    zapi.system.sendMessage(`${this.config.name}_OFF`);
  }

  dim(level) {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Dim ${level}`);
    //xapi.Command.Message.Send({ Text: `${this.config.name}_DIM ${level}`});
    zapi.system.sendMessage(`${this.config.name}_DIM ${level}`);
  }
}



