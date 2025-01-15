/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';


export class LightSceneDriver_lights {
  constructor(device, config) {
    this.device = device;
    this.config = config;
  }

  activate() {
    debug(1, `DRIVER LightSceneDriver_lights (${this.config.id}): ACTIVATE`);
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
    debug(1, `DRIVER LightSceneDriver_isc (${this.config.id}): ACTIVATE`);
    zapi.communication.sendMessage(`${this.config.name}:ACTIVATE`);
  }
}

export class LightSceneDriver_gc_itachflex {
  constructor(device, config) {
    this.device = device;
    this.config = config;
    if (!this.config.pulseLength) this.config.pulseLength = 1000;
    if (!this.config.relay) this.config.relay = 1;
    if (!this.config.host) {
      debug(3, `DRIVER LightSceneDriver_gc_itachflex (${this.config.id}): Property 'host' not defined in config.`);
    }
    this.headers = [`Content-Type: application/json`];

  }
  async activate() {
    debug(1, `DRIVER LightSceneDriver_gc_itachflex (${this.config.id}): ACTIVATE`);
    zapi.communication.httpClient.Put({
      AllowInsecureHTTPS: true,
      Header: this.headers,
      Timeout: 5,
      Url: `http://${this.config.host}/api/host/modules/1/relays/logicals/${this.config.relay}`,
      Body: `{ "type": "SPST", "state": "on" }`
    });


    setTimeout(() => {
      zapi.communication.httpClient.Put({
        AllowInsecureHTTPS: true,
        Header: this.headers,
        Timeout: 5,
        Url: `http://${this.config.host}/api/host/modules/1/relays/logicals/${this.config.relay}`,
        Body: `{ "type": "SPST", "state": "off" }`
      });
    }, this.config.pulseLength);
  }
}

export class DisplayDriver_isc_h21 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setPower(power) {
    power = power.toLowerCase();
    let powerString = this.config.name + '_POWER_' + power.toUpperCase();
    zapi.communication.sendMessage(powerString);
    debug(1, `DRIVER DisplayDriver_isc_h21 (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    let blankingStatus = blanking ? 'ON' : 'OFF';
    let blankingString = this.config.name + '_BLANKING_' + blankingStatus;
    zapi.communication.sendMessage(blankingString);
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
        let splitText = text.split(':');
        if (splitText[0] == config.name) {
          let splitMessage = splitText[1].split(';');
          if (splitMessage[0] == 'USAGEREPLY') {
            this.device.fbUsageHours(splitMessage[1]);
          }
        }
      });

    }
  }

  setPower(power) {
    power = power.toUpperCase();
    let powerString = this.config.name + ':' + power;
    zapi.communication.sendMessage(powerString);
    debug(1, `DRIVER DisplayDriver_isc (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    let blankingAction = blanking ? 'BLANK' : 'UNBLANK';
    let blankingString = this.config.name + ':' + blankingAction;
    zapi.communication.sendMessage(blankingString);
    debug(1, `DRIVER DisplayDriver_isc (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {
    let sourceString = this.config.name + ':SOURCE;' + source;
    zapi.communication.sendMessage(sourceString);
  }

  getUsageHours() {
    return this.usageHours;
  }

  requestUsageHours() {
    zapi.communication.sendMessage(this.config.name + ':USAGEREQUEST');
  }

  custom() { }
}

export class DisplayDriver_CEC {
  constructor(device, config) {
    this.config = config;
    xapi.Config.Video.Output.Connector[this.config.connector].CEC.Mode.set('On');
    debug(1, `DRIVER DisplayDriver_CEC (${this.config.id}): Setting CEC mode to "On" for connector: ${this.config.connector}`);
  }
  setPower() { }
  setBlanking() { }
  setSource() { }
  getUsageHours() { }
  requestUsageHours() { }
}

export class DisplayDriver_NONE {
  constructor(device, config) {
    debug(1, `DRIVER DisplayDriver_NONE (${config.id}): doing absolutely nothing on connector: ${config.connector}`);
  }
  setPower() { }
  setBlanking() { }
  setSource() { }
  getUsageHours() { }
  requestUsageHours() { }
}

export class DisplayDriver_serial_sonybpj {
  constructor(device, config) {
    this.pacing = 2000;
    this.repeat = 8000;
    this.queue = [];
    this.sending = false;
    this.config = config;
    this.device = device;
    this.currentPower;
    this.currentBlanking;
    xapi.Config.SerialPort.Outbound.Mode.set('On');
    xapi.Config.SerialPort.Outbound.Port[this.config.port].BaudRate.set(38400);
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Description.set(this.config.id);
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Parity.set('Even');
    this.serialCommands = {
      TERMINATOR: '\\r\\n',
      POWERON: 'power "on"\\r\\n',
      POWEROFF: 'power "off"\\r\\n',
      BLANK: 'blank "on"\\r\\n',
      UNBLANK: 'blank "off"\\r\\n'
    };
    let self = this;

    this.stateInterval = setInterval(() => {
      if (self.currentBlanking == true) {
        self.serialSend(self.serialCommands.BLANK);
      }
      else {
        self.serialSend(self.serialCommands.UNBLANK);
      }
      if (self.currentPower == 'on') {
        self.serialSend(self.serialCommands.POWERON);
      }
      else {
        self.serialSend(self.serialCommands.POWEROFF);
      }
    }, self.repeat);
  }

  setPower(power) {
    power = power.toLowerCase();
    this.currentPower = power;
    if (power == 'on') {
      this.serialSend(this.serialCommands.POWERON);
    }
    else {
      this.serialSend(this.serialCommands.POWEROFF);
    }
    debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    this.currentBlanking = blanking;
    if (blanking) {
      this.serialSend(this.serialCommands.BLANK);
    }
    else {
      this.serialSend(this.serialCommands.UNBLANK);
    }

    debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {
    debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): This driver does not support source selection.`);
  }

  getUsageHours() {
    return 0;
  }

  requestUsageHours() {

  }
  serialSend(command) {
    this.queue.push(command);
    if (!this.sending) {
      this.sendNextMessage();
    }
  }
  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }
    const message = this.queue.shift();
    this.sending = true;
    xapi.Command.SerialPort.PeripheralControl.Send({
      PortId: this.config.port,
      ResponseTerminator: this.serialCommands.TERMINATOR,
      ResponseTimeout: 200,
      Text: message
    }).catch(e => {
      debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): ${e.message}`);
    });


    setTimeout(() => {
      this.sendNextMessage();
    }, this.pacing);
  }

  custom() { }
}

export class DisplayDriver_serial_panasonic {
  constructor(device, config) {
    this.pacing = 2000;
    this.repeat = 8000;
    this.queue = [];
    this.sending = false;
    this.config = config;
    this.device = device;
    this.currentPower;
    this.currentBlanking;
    xapi.Config.SerialPort.Outbound.Mode.set('On');
    xapi.Config.SerialPort.Outbound.Port[this.config.port].BaudRate.set(9600);
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Description.set(this.config.id);
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Parity.set('Even');
    this.serialCommands = {
      TERMINATOR: '\\x03',
      POWERON: '\\x02PON\\x03',
      POWEROFF: '\\x02POF\\x03',
      BLANK: '\\x02OSH:1\\x03',
      UNBLANK: '\\x02OSH:0\\x03'
    };
    let self = this;

    this.stateInterval = setInterval(() => {
      if (self.currentBlanking == true) {
        self.serialSend(self.serialCommands.BLANK);
      }
      else {
        self.serialSend(self.serialCommands.UNBLANK);
      }
      if (self.currentPower == 'on') {
        self.serialSend(self.serialCommands.POWERON);
      }
      else {
        self.serialSend(self.serialCommands.POWEROFF);
      }
    }, self.repeat);
  }

  setPower(power) {
    power = power.toLowerCase();
    this.currentPower = power;
    if (power == 'on') {
      this.serialSend(this.serialCommands.POWERON);
    }
    else {
      this.serialSend(this.serialCommands.POWEROFF);
    }
    debug(1, `DRIVER DisplayDriver_serial_panasonic (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    this.currentBlanking = blanking;
    if (blanking) {
      this.serialSend(this.serialCommands.BLANK);
    }
    else {
      this.serialSend(this.serialCommands.UNBLANK);
    }

    debug(1, `DRIVER DisplayDriver_serial_panasonic (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {
    debug(2, `DRIVER DisplayDriver_serial_panasonic (${this.config.id}): This driver does not support source selection.`);
  }

  getUsageHours() {
    return 0;
  }

  requestUsageHours() {

  }
  serialSend(command) {
    this.queue.push(command);
    if (!this.sending) {
      this.sendNextMessage();
    }
  }
  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }
    const message = this.queue.shift();
    this.sending = true;
    xapi.Command.SerialPort.PeripheralControl.Send({
      PortId: this.config.port,
      ResponseTerminator: this.serialCommands.TERMINATOR,
      ResponseTimeout: 200,
      Text: message
    }).catch(e => {
      debug(2, `DRIVER DisplayDriver_serial_panasonic (${this.config.id}): ${e.message}`);
    });


    setTimeout(() => {
      this.sendNextMessage();
    }, this.pacing);
  }

  custom() { }
}

export class DisplayDriver_serial_epson {
  constructor(device, config) {
    this.pacing = 2000;
    this.repeat = 8000;
    this.queue = [];
    this.sending = false;
    this.config = config;
    this.device = device;
    this.currentPower;
    this.currentBlanking;
    xapi.Config.SerialPort.Outbound.Mode.set('On');
    xapi.Config.SerialPort.Outbound.Port[this.config.port].BaudRate.set(9600);
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Description.set(this.config.id);
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Parity.set('None');
    this.serialCommands = {
      TERMINATOR: '\\r\\n',
      POWERON: 'PWR ON\\r\\n',
      POWEROFF: 'PWR OFF\\r\\n',
      BLANK: 'MUTE ON\\r\\n',
      UNBLANK: 'MUTE OFF\\r\\n'
    };
    let self = this;

    this.stateInterval = setInterval(() => {
      if (self.currentBlanking == true) {
        self.serialSend(self.serialCommands.BLANK);
      }
      else {
        self.serialSend(self.serialCommands.UNBLANK);
      }
      if (self.currentPower == 'on') {
        self.serialSend(self.serialCommands.POWERON);
      }
      else {
        self.serialSend(self.serialCommands.POWEROFF);
      }
    }, self.repeat);
  }

  setPower(power) {
    power = power.toLowerCase();
    this.currentPower = power;
    if (power == 'on') {
      this.serialSend(this.serialCommands.POWERON);
    }
    else {
      this.serialSend(this.serialCommands.POWEROFF);
    }
    debug(1, `DRIVER DisplayDriver_serial_epson (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    this.currentBlanking = blanking;
    if (blanking) {
      this.serialSend(this.serialCommands.BLANK);
    }
    else {
      this.serialSend(this.serialCommands.UNBLANK);
    }

    debug(1, `DRIVER DisplayDriver_serial_epson (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {
    debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): This driver does not support source selection.`);
  }

  getUsageHours() {
    return 0;
  }

  requestUsageHours() {

  }
  serialSend(command) {
    this.queue.push(command);
    if (!this.sending) {
      this.sendNextMessage();
    }
  }
  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }
    const message = this.queue.shift();
    this.sending = true;
    xapi.Command.SerialPort.PeripheralControl.Send({
      PortId: this.config.port,
      ResponseTerminator: this.serialCommands.TERMINATOR,
      ResponseTimeout: 200,
      Text: message
    }).catch(e => {
      debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): ${e.message}`);
    });


    setTimeout(() => {
      this.sendNextMessage();
    }, this.pacing);
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
    position = position == 'up' ? 'UP' : 'DN';
    zapi.communication.sendMessage(this.config.name + '_' + position);
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
    zapi.communication.sendMessage(this.config.name + ':' + position);
    debug(1, `DRIVER ScreenDriver_isc (${this.config.id}): setPosition: ${position}`);
  }

  custom() {

  }
}

export class ScreenDriver_gc_itachflex {
  constructor(device, config) {
    this.device = device;
    this.config = config;
    if (!this.config.pulseLength) this.config.pulseLength = 1000;
    this.headers = [`Content-Type: application/json`];

  }
  setPosition(position) {
    var relay;
    if (position.toUpperCase() == 'UP') {
      relay = this.config.upRelay;
    }
    else if (position.toUpperCase() == 'DOWN') {
      relay = this.config.downRelay;
    }

    debug(1, `DRIVER ScreenDriver_gc_itachflex (${this.config.id}): setPosition: ${position}`);

    zapi.communication.httpClient.Put({
      AllowInsecureHTTPS: true,
      Header: this.headers,
      Timeout: 5,
      Url: `http://${this.config.host}/api/host/modules/1/relays/logicals/${relay}`,
      Body: `{ "type": "SPST", "state": "on" }`
    });


    setTimeout(() => {
      zapi.communication.httpClient.Put({
        AllowInsecureHTTPS: true,
        Header: this.headers,
        Timeout: 5,
        Url: `http://${this.config.host}/api/host/modules/1/relays/logicals/${relay}`,
        Body: `{ "type": "SPST", "state": "off" }`
      });
    }, this.config.pulseLength);
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
    let args = {};
    if (this.gpiotype == 'single') {
      var voltage = position == 'up' ? 'High' : 'Low';
      args['Pin' + this.pin] = voltage;
    }
    else if (this.gpiotype == 'pair') {
      let voltage1 = position == 'up' ? 'High' : 'Low';
      let voltage2 = position == 'up' ? 'Low' : 'High';
      args['Pin' + this.pin1] = voltage1;
      args['Pin' + this.pin2] = voltage2;
    }
    xapi.Command.GPIO.ManualState.Set(args);


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

  setMode(mute) {
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
        xapi.Config.Audio.Input.HDMI[this.config.connector].mode.set('Off');
        break;
      case 'ethernet':
        xapi.Config.Audio.Input.Ethernet[this.config.connector].Channel[this.config.channel].mode.set('Off');
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
        xapi.Config.Audio.Input.HDMI[this.config.connector].mode.set('On');
        break;
      case 'ethernet':
        xapi.Config.Audio.Input.Ethernet[this.config.connector].Channel[this.config.channel].mode.set('On');
        break;
    }
  }
}

export class AudioOutputDriver_codecpro {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setLevel(level) {
    debug(1, `DRIVER AudioOutput_codecpro (${this.config.id}): setLevel: ${level}`);
    switch (this.config.output) {
      case "line":
        xapi.Config.Audio.Output.Line[this.config.connector].Level.set(level);
        setTimeout(() => {
          xapi.Config.Audio.Output.Line[this.config.connector].Level.set(level);
        }, 2000)

        break;
      case "hdmi":
        xapi.Config.Audio.Output.HDMI[this.config.connector].Level.set(level);
        setTimeout(() => {
          xapi.Config.Audio.Output.HDMI[this.config.connector].Level.set(level);
        }, 2000);
        break;
    }
  }

  setMode(mute) {
    if (mute.toLowerCase() == 'off') {
      this.mute();
    }
    else {
      this.unmute();
    }
  }

  off() {
    debug(1, `DRIVER AudioOutput_codecpro (${this.config.id}): Off`);
    switch (this.config.output) {
      case 'line':
        xapi.Config.Audio.Output.Line[this.config.connector].mode.set('Off');
        break;
      case 'hdmi':
        xapi.Config.Audio.Output.HDMI[this.config.connector].mode.set('Off');
        break;
    }
  }

  on() {
    debug(1, `DRIVER AudioOutput_codecpro (${this.config.id}): On`);
    switch (this.config.output) {
      case 'line':
        xapi.Config.Audio.Output.Line[this.config.connector].mode.set('On');
        break;
      case 'hdmi':
        xapi.Config.Audio.Output.HDMI[this.config.connector].mode.set('On');
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
    zapi.communication.sendMessage(`${this.config.name}_ON`);
  }

  off() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Off`);
    zapi.communication.sendMessage(`${this.config.name}_OFF`);
  }

  dim(level) {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Dim ${level}`);
    zapi.communication.sendMessage(`${this.config.name}_DIM ${level}`);
  }
}


export class LightDriver_isc {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  on() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): On`);
    zapi.communication.sendMessage(`${this.config.name}:ON`);
  }

  off() {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Off`);
    zapi.communication.sendMessage(`${this.config.name}:OFF`);
  }

  dim(level) {
    debug(1, `DRIVER Light_isc_h21 (${this.config.id}): Dim ${level}`);
    zapi.communication.sendMessage(`${this.config.name}:DIM;${level}`);
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
          zapi.communication.sendMessage(`HW_RESTART`);
          zapi.communication.sendMessage(`SYSTEM_CRESTRON_REBOOT`);
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
          zapi.communication.sendMessage(`${this.config.name}:HWRESET`);
        }
      });
    }

    if (this.config.heartbeatInterval != undefined) {
      setInterval(() => {
        zapi.communication.sendMessage(`${this.config.name}:HEARTBEAT;CODEC`);
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
    zapi.communication.sendMessage(this.config.name + ':' + position);
    debug(1, `DRIVER ShadeDriver_basic_isc (${this.config.id}): setPosition: ${position}`);
  }

  custom() {

  }
}

