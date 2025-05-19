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
    this.setOnInterval;
    xapi.Config.Video.Output.Connector[this.config.connector].CEC.Mode.set('On');
    debug(1, `DRIVER DisplayDriver_CEC (${this.config.id}): Setting CEC mode to "On" for connector: ${this.config.connector}`);
  }
  setPower(power) {
    if (power == 'on') {
      this.setOnInterval = setInterval(() => {
        xapi.Command.Video.CEC.Output.SendActiveSourceRequest(this.config.connector);
        debug(1, `DRIVER DisplayDriver_CEC (${this.config.id}): Sending SEND_ACTIVE_SOURCE_REQUEST on connector: ${this.config.connector}`);
      }, 10000);
    }
    else {
      clearInterval(this.setOnInterval);
    }
  }
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
      UNBLANK: 'blank "off"\\r\\n',
      USAGE: 'timer ?\\r\\n',
      FILTER_STATUS: 'filter_status ?\\r\\n',
      SYSTEM_STATUS: 'error ?\\r\\n'
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


  requestUsageHours() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.USAGE)
        .then(response => {
          if (response.Response == '') {
            reject('TIMEOUT');
          }
          resolve(response.Response.replaceAll('"', ''));
        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Request timed out: ${err}`);
        });
    });

  }

  // New function to request filter status
  requestFilterStatus() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.FILTER_STATUS)
        .then(response => {
          if (response.Response == '') {
            reject('TIMEOUT');
          }
          const filterStatus = response.Response.trim().replaceAll('"', ''); // Trim whitespace from response
          debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Filter Status Response: ${filterStatus}`);
          resolve(filterStatus); // Resolve with the filter status string
        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Request Filter Status timed out: ${err}`);
        });
    });
  }

  // New function to request system status (previously error status)
  requestSystemStatus() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.SYSTEM_STATUS) // Use SYSTEM_STATUS command
        .then(response => {
          if (response.Response == '') {
            reject('TIMEOUT');
          }
          var systemStatus = response.Response.trim().replaceAll('"', ''); // Trim whitespace from response
          if (systemStatus == 'no_err') {
            systemStatus = 'normal';
          }
          debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): System Status Response: ${systemStatus}`); // Updated debug message
          resolve(systemStatus); // Resolve with the system status string
        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Request System Status timed out: ${err}`); // Updated debug message
        });
    });
  }


  serialSend(command) {
    return new Promise((resolve, reject) => {
      this.queue.push({ command, resolve, reject });
      if (!this.sending) {
        this.sendNextMessage();
      }
    });
  }

  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return Promise.resolve();
    }

    if (this.sending) {
      return Promise.resolve();
    }

    this.sending = true;
    const { command, resolve, reject } = this.queue.shift();

    return xapi.Command.SerialPort.PeripheralControl.Send({
      PortId: this.config.port,
      ResponseTerminator: this.serialCommands.TERMINATOR,
      ResponseTimeout: 1000,
      Text: command
    })
      .then(response => {
        resolve(response); // Always resolve here
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .catch(e => {
        reject('TIMEOUT'); // Reject only on timeout/error from xapi.Send
        debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): ${e.message}`);
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .finally(() => {
        this.sending = false;
        return this.sendNextMessage();
      });
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
    xapi.Config.SerialPort.Outbound.Port[this.config.port].Parity.set('None');
    this.serialCommands = {
      TERMINATOR: '\\x03',
      POWERON: '\\x02PON\\x03',
      POWEROFF: '\\x02POF\\x03',
      BLANK: '\\x02OSH:1\\x03',
      UNBLANK: '\\x02OSH:0\\x03',
      USAGE: '\\x02Q$L\\x03', // Updated to Q$L:1 for Lamp Hours (more common command)
      SYSTEM_STATUS: '\\x02\\x00\\xfe\\x03' // Keeping CTR for System Status for now (from PT-D6000U doc)
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

  analyserReponseProjecteur(reponse) {
    // Étape 1 : Convertir la chaîne hexadécimale en tableau de bytes
    // Split sur "\\x" pour extraire les parties hexadécimales (ex. "02", "00", "FE", etc.)
    const hexParts = reponse.split('\\x').filter(part => part); // Filtrer les parties vides
    const bytes = hexParts.map(part => parseInt(part, 16)); // Convertir en nombres

    // Étape 2 : Vérifier la validité de la réponse
    let erreursValidation = []; // Renamed to erreursValidation for clarity
    if (bytes[0] !== 0x02) {
      erreursValidation.push("TIMEOUT");
    }
    else if (bytes[1] !== 0x00 || bytes[2] !== 0xFE) {
      erreursValidation.push("TIMEOUT");
    }

    // If there are validation errors, return them immediately
    if (erreursValidation.length > 0) {
      return erreursValidation; // Return the array of validation errors
    }

    // Étape 3 : Extraire les données d'état (bytes après 0x00 0xFE)
    const donneesEtat = bytes.slice(3);

    // Étape 4 : Définir les descriptions des composants
    // Cette liste est hypothétique et doit être ajustée selon la documentation réelle
    const descriptionsComposants = [
      "Lampe",
      "Ventilateur",
      "Température",
      "Filtre",
      "Alimentation",
      "Système",
      "Réseau",
      "Capteur",
      "Mémoire",
      "Processeur",
      "Logiciel",
      "Matériel",
      "Communication",
      "Configuration",
      "Mise à jour",
      "Inconnu"
    ];

    // Étape 5 : Identifier les composants en erreur
    const composantsEnErreur = [];
    donneesEtat.forEach((byte, index) => {
      if (byte !== 0x00) { // Check for non-zero byte (indicating error)
        const composant = descriptionsComposants[index] || `Composant inconnu ${index + 1}`;
        composantsEnErreur.push(composant);
      }
    });

    if (composantsEnErreur.length > 0) {
      return composantsEnErreur.join(', '); // Return comma-separated string of component errors
    } else {
      return null; // Return null if no component errors (and no validation errors)
    }
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
    debug(1, `DRIVER DisplayDriver_panasonic (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    this.currentBlanking = blanking;
    if (blanking) {
      this.serialSend(this.serialCommands.BLANK);
    }
    else {
      this.serialSend(this.serialCommands.UNBLANK);
    }

    debug(1, `DRIVER DisplayDriver_panasonic (${this.config.id}): setBlanking: ${blanking}`);
  }

  setSource(source) {
    debug(2, `DRIVER DisplayDriver_panasonic (${this.config.id}): This driver does not support source selection.`);
  }


  requestUsageHours() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.USAGE)
        .then(response => {
          let val = response.Response;
          val = val.substring(4);
          resolve(val);
        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_panasonic (${this.config.id}): Request System Status timed out: ${err}`); // Updated debug message
        });
    });
  }

  requestFilterStatus() {
    return new Promise((resolve, reject) => {
      reject(`DisplayDriver_serial_panasonic: REQUEST_FILTER_NOT_SUPPORTED. Please remove filter request from device configuration!`);
    });
  }

  requestSystemStatus() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.SYSTEM_STATUS) // Use SYSTEM_STATUS command
        .then(response => {
          var val = response.Response;

          const resultatAnalyse = this.analyserReponseProjecteur(val); // Get the result from the analyser

          if (Array.isArray(resultatAnalyse)) { // Check if the result is an array (validation errors)
            const stringErreursValidation = resultatAnalyse.join(", "); // Join validation errors into a single string
            reject(resultatAnalyse);
          } else if (typeof resultatAnalyse === 'string' && resultatAnalyse.length > 0) { // Check if result is a non-empty string (component errors)
            reject(resultatAnalyse);
          } else if (resultatAnalyse === null) { // Check if the result is null (no errors)
            resolve('normal');
          } else {
            resolve('normal');
          }
        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_panasonic (${this.config.id}): Request System Status timed out: ${err}`); // Updated debug message
        });
    });
  }


  serialSend(command) {
    return new Promise((resolve, reject) => {
      this.queue.push({ command, resolve, reject });
      if (!this.sending) {
        this.sendNextMessage();
      }
    });
  }

  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return Promise.resolve();
    }

    if (this.sending) {
      return Promise.resolve();
    }

    this.sending = true;
    const { command, resolve, reject } = this.queue.shift();

    return xapi.Command.SerialPort.PeripheralControl.Send({
      PortId: this.config.port,
      ResponseTerminator: '\x03', // **MODIFIED: Using \xE0 as ResponseTerminator**
      ResponseTimeout: 5000,
      Text: command
    })
      .then(response => {
        resolve(response);
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .catch(e => {
        reject('TIMEOUT');
        debug(2, `DRIVER DisplayDriver_panasonic (${this.config.id}): ${e.message}`);
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .finally(() => {
        this.sending = false;
        return this.sendNextMessage();
      });
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
      UNBLANK: 'MUTE OFF\\r\\n',
      USAGE: 'LAMP?\\r\\n',
      FILTER_STATUS: 'FILTER?\\r\\n',
      SYSTEM_STATUS: 'PWR?\\r\\n'        // Renamed ERROR_STATUS to SYSTEM_STATUS
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

  requestUsageHours() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.USAGE)
        .then(response => {
          if (response.Response == '') {
            reject('TIMEOUT');
          }
          try {
            let lamp = response.Response;
            lamp = lamp.split('=')[1];
            lamp = lamp.split('\\')[0];
            resolve(lamp);
          }
          catch {
            reject('BAD_OR_MALFORMED_DATA')
          }

        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): Request timed out: ${err}`);
        });
    });
  }

  requestFilterStatus() {
    return new Promise((resolve, reject) => {
      reject(`DisplayDriver_serial_epson: REQUEST_FILTER_NOT_SUPPORTED. Please remove filter request from device configuration!`);
    });
  }

  // New function to request system status (previously error status)
  requestSystemStatus() {
    return new Promise((resolve, reject) => {
      this.serialSend(this.serialCommands.SYSTEM_STATUS) // Use SYSTEM_STATUS command
        .then(response => {
          if (response.Response == '') {
            reject('TIMEOUT');
          }
          let status = response.Response;
          status = status.split('=')[1].substring(0, 2);
          if (status != '05') {
            status = 'normal';
          }
          else {
            status = 'error: ' + status;
          }
          debug(1, `DRIVER DisplayDriver_serial_epson (${this.config.id}): System Status Response: ${status}`); // Updated debug message
          resolve(status); // Resolve with the system status string
        })
        .catch(err => {
          reject('TIMEOUT');
          debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): Request System Status timed out: ${err}`); // Updated debug message
        });
    });
  }

  serialSend(command) {
    return new Promise((resolve, reject) => {
      this.queue.push({ command, resolve, reject });
      if (!this.sending) {
        this.sendNextMessage();
      }
    });
  }
  sendNextMessage() {
    if (this.queue.length === 0) {
      this.sending = false;
      return Promise.resolve();
    }

    if (this.sending) {
      return Promise.resolve();
    }

    this.sending = true;
    const { command, resolve, reject } = this.queue.shift();

    return xapi.Command.SerialPort.PeripheralControl.Send({
      PortId: this.config.port,
      ResponseTerminator: this.serialCommands.TERMINATOR,
      ResponseTimeout: 1000,
      Text: command
    })
      .then(response => {
        resolve(response); // Always resolve here
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .catch(e => {
        reject('TIMEOUT'); // Reject only on timeout/error from xapi.Send
        debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): ${e.message}`);
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .finally(() => {
        this.sending = false;
        return this.sendNextMessage();
      });
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
      let args = {};
      args['Pin' + this.pin1] = 'High';
      args['Pin' + this.pin2] = 'High';
      xapi.Command.GPIO.ManualState.Set(args);
    }
    this.setPosition(this.config.defaultPosition);

  }

  async sleep(time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  async setPosition(position) {
    debug(1, `DRIVER ScreenDriver_gpio (${this.config.id}): setPosition: ${position}`);
    var config = {};
    let args = {};
    if (this.gpiotype == 'single') {
      var voltage = position == 'up' ? 'High' : 'Low';
      args['Pin' + this.pin] = voltage;
      xapi.Command.GPIO.ManualState.Set(args);
    }
    else if (this.gpiotype == 'pair') {
      if (position == 'up') {
        let args = {};
        args['Pin' + this.pin2] = 'High';
        xapi.Command.GPIO.ManualState.Set(args);
        await this.sleep(500);

        args = {};
        args['Pin' + this.pin1] = 'Low';
        xapi.Command.GPIO.ManualState.Set(args);
        await this.sleep(2000);

        args = {};
        args['Pin' + this.pin1] = 'High';
        xapi.Command.GPIO.ManualState.Set(args);
      }
      else {
        let args = {};
        args['Pin' + this.pin1] = 'High';
        xapi.Command.GPIO.ManualState.Set(args);
        await this.sleep(500);

        args = {};
        args['Pin' + this.pin2] = 'Low';
        xapi.Command.GPIO.ManualState.Set(args);
        await this.sleep(2000);

        args = {};
        args['Pin' + this.pin2] = 'High';
        xapi.Command.GPIO.ManualState.Set(args);
      }
    }
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

export class AudioOutputDriver_aes67 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setLevel(level) {
    //AES67 audio inputs don't support setLevel
  }

  setMode(mute) {
    if (mute.toLowerCase() == 'off') {
      this.off();
    }
    else {
      this.on();
    }
  }

  off() {
    debug(1, `DRIVER AudioOutput_aes67 (${this.config.id}): Off`);
    xapi.Config.Audio.Input.Ethernet[2].mode.set('Off');
  }

  on() {
    debug(1, `DRIVER AudioOutput_aes67 (${this.config.id}): On`);
    xapi.Config.Audio.Input.Ethernet[2].mode.set('On');
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

