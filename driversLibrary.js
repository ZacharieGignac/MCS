import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';


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
    zapi.system.sendMessage(`${this.config.name}:ACTIVATE`);
  }
}


export class DisplayDriver_isc_h21 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
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
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): setSource not supported`);
  }

  getUsageHours() {
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): getUsageHours not supported`);
    return 0;
  }

  requestUsageHours() {
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): requestUsageHopurs not supported`);
  }

  custom() { }
}


export class DisplayDriver_isc {
  constructor(device, config) {
    this.config = config;
    this.device = device;
    if (config.supportsUsageHours) {
      xapi.Event.Message.Send.Text.on(text => {
        let split = text.split(':');
        if (split[0] == config.name) {
          let split = split[1](';');
          if (split[0] == 'USAGEREPLY') {
            this.device.fbUsageHours(split[1]);
          }
        }
      });
    }
  }

  setPower(power) {
    power = power.toUpperCase();
    let powerString = this.config.name + ':' + power;
    zapi.system.sendMessage(powerString);
    debug(1, `DRIVER DisplayDriver_isc (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    let blankingAction = blanking ? 'BLANK' : 'UNBLANK';
    let blankingString = this.config.name + ':' + blankingAction;
    zapi.system.sendMessage(blankingString);
    debug(1, `DRIVER DisplayDriver_isc (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {
    let sourceString = this.config.name + ':SOURCE;' + source;
    zapi.system.sendMessage(sourceString);
  }

  getUsageHours() {
    return this.usageHours;
  }

  requestUsageHours() {
    zapi.system.sendMessage(this.config.name + ':USAGEREQUEST');
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


export class ScreenDriver_isc {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setPosition(position) {
    position = position.toUpperCase();
    zapi.system.sendMessage(this.config.name + ':' + position);
    debug(1, `DRIVER ScreenDriver_isc (${this.config.id}): setPosition: ${position}`);
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
    debug(1, `DRIVER ScreenDriver_gpio (${this.config.id}): setPosition: ${position}`);
    var config = {};
    if (this.gpiotype == 'single') {
      config['Pin' + this.pin] = position == 'up' ? 'Low' : 'High';
    }
    else if (this.gpiotype == 'pair') {
      config['Pin' + this.pin1] = position == 'up' ? 'Low' : 'High';
      config['Pin' + this.pin2] = position == 'up' ? 'High' : 'Low';
    }
    xapi.Command.GPIO.ManualState.Set(config);
  }

  custom() {

  }
}

export class AudioInputDriver_codecpro {
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


export class LightDriver_isc_h21 {
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


export class LightDriver_isc {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  on() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): On`);
    zapi.system.sendMessage(`${this.config.name}:ON`);
  }

  off() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Off`);
    zapi.system.sendMessage(`${this.config.name}:OFF`);
  }

  dim(level) {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Dim ${level}`);
    zapi.system.sendMessage(`${this.config.name}:DIM;${level}`);
  }
}


export class AudioReporterDriver_internal {
  constructor(device, config) {
    this.device = device;
    this.config = config;
    this.inputs = [];
    this.maxLevel = undefined;
    this.maxLevelId = undefined;
    this.currentReportTime = new Date();
    this.highestInput = { id: 0 };
    this.highestInputSince = undefined;

    for (let i = 1; i < this.config.inputs.length; i++) {
      this.inputs[i] = { id: i, level: 0 };
    }
  }
  start() {
    for (let input of this.config.inputs) {
      xapi.Command.Audio.VuMeter.Start({
        ConnectorId: input,
        ConnectorType: 'Microphone',
        Source: 'AfterAEC',
        IntervalMs: this.config.intervalMs
      });
    }

    xapi.Event.Audio.Input.Connectors.Microphone.on(report => {
      this.update(report.id, report.VuMeter);
    });
  }
  stop() {

  }
  update(id, level) {
    level = parseInt(level);
    var lastReportTime = this.currentReportTime;
    this.currentReportTime = new Date();
    var elapsed = (this.currentReportTime.getTime() - lastReportTime.getTime());

    let audioInputDevice = zapi.devices.getDevicesByType(zapi.devices.DEVICETYPE.AUDIOINPUT).filter(ai => ai.config.connector == id);
    if (audioInputDevice.length == 1) {
      if (audioInputDevice[0].config.bias != undefined) {
        let bias = parseInt(audioInputDevice[0].config.bias);
        level += bias;
      }
    }
    

    this.inputs[id] = { id: id, level: level };  // Update this.inputs[id] before the loop

    let highestLevelObj = null;
    let secondHighestLevelObj = null;
    let lowestLevelObj = null;
    let lowestLevelValue = Infinity;
    let highestLevelValue = -Infinity;
    var levelSum = 0;
    var highestSince;


    for (let i = 1; i < this.inputs.length; i++) {  // Start loop at index 1
      if (this.inputs[i] != undefined) {
        levelSum = levelSum + this.inputs[i].level;
        let currentObj = this.inputs[i];

        if (highestLevelObj === null || currentObj.level > highestLevelObj.level) {
          secondHighestLevelObj = highestLevelObj;
          highestLevelObj = currentObj;
          highestLevelValue = currentObj.level;
        } else if (secondHighestLevelObj === null || (currentObj.level > secondHighestLevelObj.level && currentObj.level < highestLevelObj.level)) {
          secondHighestLevelObj = currentObj;
        }

        if (lowestLevelObj === null || currentObj.level < lowestLevelObj.level) {
          lowestLevelObj = currentObj;
          lowestLevelValue = currentObj.level;
        }
      }
    }

    var average = levelSum / (this.inputs.length - 1);
    var differenceBetweenTopAndAverage = highestLevelValue - average;
    let differenceBetweenTopTwo = highestLevelValue - secondHighestLevelObj.level;
    let differenceBetweenHighestAndLowest = highestLevelValue - lowestLevelValue;

    if (highestLevelObj.id != this.highestInput.id) {
      this.highestInput = highestLevelObj;
      this.highestInputSince = new Date();
    }

    highestSince = new Date() - this.highestInputSince;

    const audioReport = {
      id: this.config.id,
      name: this.config.name,
      elapsedMs: elapsed,
      highInputId: parseInt(highestLevelObj.id),
      highInputLevel: parseInt(highestLevelValue),
      highestSince: highestSince,
      lowInputId: parseInt(lowestLevelObj.id),
      lowinputLevel: lowestLevelValue,
      average: average,
      highestAverageDiff: differenceBetweenTopAndAverage,
      topTwodiff: differenceBetweenTopTwo,
      highestLowestDiff: differenceBetweenHighestAndLowest,
      inputs: this.inputs
    };


    this.device.report(audioReport);
  }
}

export class ControlSystemDriver_isc_h21 {
  constructor(device, config) {
    this.device = device;
    this.config = config;

    //Handle sync restart
    if (this.config.syncRestart) {
      xapi.Event.BootEvent.Action.on(action => {
        if (action == 'Restart') {
          zapi.system.sendMessage(`HW_RESTART`);
        }
      });
    }
  }
}

export class ControlSystemDriver_isc {
  constructor(device, config) {
    this.device = device;
    this.config = config;

    //Handle sync restart
    if (this.config.syncRestart) {
      xapi.Event.BootEvent.Action.on(action => {
        if (action == 'Restart') {
          zapi.system.sendMessage(`${this.config.name}:HWRESET`);
        }
      });
    }

    if (this.config.heartbeatInterval != undefined) {
      setInterval(() => {
        zapi.system.sendMessage(`${this.config.name}:HEARTBEAT;CODEC`);
      }, this.config.heartbeatInterval);
    }
  }
}

export class ShadeDriver_basic_isc {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setPosition(position) {
    position = position.toUpperCase();
    zapi.system.sendMessage(this.config.name + ':' + position);
    debug(1, `DRIVER ShadeDriver_basic_isc (${this.config.id}): setPosition: ${position}`);
  }

  custom() {

  }
}

