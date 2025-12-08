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
      let ids = Array.isArray(light.id) ? light.id : [light.id];
      for (let id of ids) {
        for (let prop in light) {
          if (light.hasOwnProperty(prop)) {
            if (prop != 'id') {
              let l = zapi.devices.getDevice(id);
              if (l && typeof l[prop] === 'function') {
                l[prop](light[prop]);
              }
            }
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
    await zapi.communication.httpClient.Put({
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
    this.cecSupported = false;

    // Check if CEC is supported on this connector
    try {
      xapi.Config.Video.Output.Connector[this.config.connector].CEC.Mode.set('On');
      this.cecSupported = true;
      debug(1, `DRIVER DisplayDriver_CEC (${this.config.id}): Setting CEC mode to "On" for connector: ${this.config.connector}`);
    } catch (e) {
      debug(2, `DRIVER DisplayDriver_CEC (${this.config.id}): CEC not supported on connector ${this.config.connector}: ${e.message}`);
      this.cecSupported = false;
    }
  }
  setPower(power) {
    if (!this.cecSupported) {
      debug(2, `DRIVER DisplayDriver_CEC (${this.config.id}): CEC not supported, ignoring power command`);
      return;
    }

    if (power == 'on') {
      this.setOnInterval = setInterval(() => {
        try {
          xapi.Command.Video.CEC.Output.SendActiveSourceRequest({ ConnectorId: this.config.connector });
          debug(1, `DRIVER DisplayDriver_CEC (${this.config.id}): Sending SEND_ACTIVE_SOURCE_REQUEST on connector: ${this.config.connector}`);
        } catch (e) {
          debug(2, `DRIVER DisplayDriver_CEC (${this.config.id}): Failed to send active source request: ${e.message}`);
        }
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
    this.pacing = config.pacing || 500;
    this.repeat = config.repeat || 2000;
    this.timeout = config.timeout || 100;
    this.queue = [];
    this.sending = false;
    this.config = config;
    this.device = device;
    this.currentPower;
    this.currentBlanking;
    this._lastErrorAt = 0;
    this._errorDebounceMs = 5000;
    this._ack = { power: undefined, blanking: undefined };
    this._pending = { power: false, blanking: false };

    this.serialPortConfigured = false;
    this.configureSerialPort();

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
    this._lastErrorAt = 0;
    this._errorDebounceMs = 5000;
    let self = this;

    this.stateInterval = setInterval(() => {
      if (!self.serialPortConfigured) {
        return;
      }

      // Retry pending commands until acknowledged "ok"
      try {
        if (self._pending.blanking === true && typeof self.currentBlanking !== 'undefined') {
          self._sendBlankingAttempt();
        }
      } catch (e) { self.handleSerialError(e); }

      try {
        if (self._pending.power === true && typeof self.currentPower !== 'undefined') {
          self._sendPowerAttempt();
        }
      } catch (e) { self.handleSerialError(e); }
    }, self.repeat);

  }

  configureSerialPort() {
    try {
      // Check if the port number is valid
      if (!this.config.port || this.config.port < 1 || this.config.port > 4) {
        throw new Error(`Invalid serial port number: ${this.config.port}. Port must be between 1 and 4.`);
      }

      // Configure serial port settings with error handling for each step
      try {
        xapi.Config.SerialPort.Outbound.Mode.set('On');
      } catch (e) {
        debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Failed to set SerialPort.Outbound.Mode: ${e.message}`);
        throw e;
      }

      try {
        xapi.Config.SerialPort.Outbound.Port[this.config.port].BaudRate.set(38400);
      } catch (e) {
        debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Failed to set BaudRate for port ${this.config.port}: ${e.message}`);
        throw e;
      }

      try {
        xapi.Config.SerialPort.Outbound.Port[this.config.port].Description.set(this.config.id);
      } catch (e) {
        debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Failed to set Description for port ${this.config.port}: ${e.message}`);
        throw e;
      }

      try {
        xapi.Config.SerialPort.Outbound.Port[this.config.port].Parity.set('Even');
      } catch (e) {
        debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Failed to set Parity for port ${this.config.port}: ${e.message}`);
        throw e;
      }

      this.serialPortConfigured = true;
      debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Serial port ${this.config.port} configured successfully`);
    } catch (e) {
      debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Failed to configure serial port: ${e.message}`);
      this.serialPortConfigured = false;
    }
  }

  setPower(power) {
    power = power.toLowerCase();
    this.currentPower = power;
    this._pending.power = true; // mark as needing acknowledgement

    if (!this.serialPortConfigured) {
      debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Serial port not configured, cannot send power command`);
      return;
    }

    // Clear any queued power commands and send immediately once (low latency)
    this._clearQueuedDisplayCommands([this.serialCommands.POWERON, this.serialCommands.POWEROFF]);
    this._sendPowerAttempt();
    debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    this.currentBlanking = blanking;
    this._pending.blanking = true; // mark as needing acknowledgement

    if (!this.serialPortConfigured) {
      debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Serial port not configured, cannot send blanking command`);
      return;
    }

    // Clear any queued blank/unblank commands and send immediately once (low latency)
    this._clearQueuedDisplayCommands([this.serialCommands.BLANK, this.serialCommands.UNBLANK]);
    this._sendBlankingAttempt();

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

  _isOkResponse(response) {
    try {
      const raw = (response && typeof response.Response !== 'undefined') ? String(response.Response) : String(response || '');
      // Remove non-printable chars, quotes, reduce whitespace
      let cleaned = raw
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/"/g, '')
        .toLowerCase()
        .trim();
      // Fast path exact
      if (cleaned === 'ok') return true;
      // Remove all whitespace and punctuation, keep letters only then compare
      const lettersOnly = cleaned.replace(/[^a-z]/g, '');
      if (lettersOnly === 'ok') return true;
      // Substring check with word boundary
      if (/\bok\b/.test(cleaned)) return true;
      return false;
    }
    catch (_) { return false; }
  }

  _clearQueuedDisplayCommands(commandsToClear) {
    try {
      if (!Array.isArray(this.queue) || this.queue.length === 0) return;
      this.queue = this.queue.filter(item => commandsToClear.indexOf(item.command) === -1);
    } catch (_) { }
  }

  _sendBlankingAttempt() {
    try {
      const command = (this.currentBlanking === true) ? this.serialCommands.BLANK : this.serialCommands.UNBLANK;
      this.serialSend(command)
        .then(response => {
          if (this._isOkResponse(response)) {
            this._ack.blanking = this.currentBlanking;
            this._pending.blanking = false;
            debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Blanking acknowledged (${this.currentBlanking})`);
          }
        })
        .catch(e => this.handleSerialError(e));
    } catch (e) { this.handleSerialError(e); }
  }

  _sendPowerAttempt() {
    try {
      const command = (this.currentPower === 'on') ? this.serialCommands.POWERON : this.serialCommands.POWEROFF;
      this.serialSend(command)
        .then(response => {
          if (this._isOkResponse(response)) {
            this._ack.power = this.currentPower;
            this._pending.power = false;
            debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): Power acknowledged (${this.currentPower})`);
          }
        })
        .catch(e => this.handleSerialError(e));
    } catch (e) { this.handleSerialError(e); }
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
    try { debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): TX: ${String(command).trim()}`); } catch (_) { }

    try {
      return xapi.Command.SerialPort.PeripheralControl.Send({
        PortId: this.config.port,
        ResponseTerminator: this.serialCommands.TERMINATOR,
        ResponseTimeout: this.timeout, // Timeout in milliseconds
        Text: command
      })
        .then(response => {
          try {
            const rx = (response && typeof response.Response !== 'undefined') ? String(response.Response).trim() : '';
            if (rx !== '') {
              debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): RX: ${rx}`);
            } else {
              debug(1, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): RX: <empty>`);
            }
          } catch (_) { }
          resolve(response); // Always resolve here
          return new Promise(res => setTimeout(res, this.pacing));
        })
        .catch(e => {
          reject('TIMEOUT'); // Reject only on timeout/error from xapi.Send
          this.handleSerialError(e);
          return new Promise(res => setTimeout(res, this.pacing));
        })
        .finally(() => {
          this.sending = false;
          return this.sendNextMessage();
        });
    } catch (e) {
      this.sending = false;
      reject('INVALID_COMMAND');
      this.handleSerialError(e);
      return Promise.resolve();
    }
  }
  handleSerialError(e) {
    const now = Date.now();
    if (now - this._lastErrorAt >= this._errorDebounceMs) {
      this._lastErrorAt = now;
      const msg = (e && e.message) ? e.message : String(e);
      debug(2, `DRIVER DisplayDriver_serial_sonybpj (${this.config.id}): ${msg}`);
    }
  }
  custom() { }
}

export class DisplayDriver_serial_panasonic {
  constructor(device, config) {
    this.pacing = config.pacing || 500;
    this.repeat = config.repeat || 2000;
    this.timeout = config.timeout || 100;
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
      ResponseTerminator: '\\x03', // **MODIFIED: Using \xE0 as ResponseTerminator**
      ResponseTimeout: this.timeout, // Timeout in milliseconds
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
    this.pacing = config.pacing || 500;
    this.repeat = config.repeat || 2000;
    this.timeout = config.timeout || 100;
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
    this._lastErrorAt = 0;
    this._errorDebounceMs = 5000;
    let self = this;

    this.stateInterval = setInterval(() => {
      if (self.currentBlanking == true) {
        self.serialSend(self.serialCommands.BLANK).catch(e => self.handleSerialError(e));
      }
      else {
        self.serialSend(self.serialCommands.UNBLANK).catch(e => self.handleSerialError(e));
      }
      if (self.currentPower == 'on') {
        self.serialSend(self.serialCommands.POWERON).catch(e => self.handleSerialError(e));
      }
      else {
        self.serialSend(self.serialCommands.POWEROFF).catch(e => self.handleSerialError(e));
      }
    }, self.repeat);
  }

  setPower(power) {
    power = power.toLowerCase();
    this.currentPower = power;
    if (power == 'on') {
      this.serialSend(this.serialCommands.POWERON).catch(e => this.handleSerialError(e));
    }
    else {
      this.serialSend(this.serialCommands.POWEROFF).catch(e => this.handleSerialError(e));
    }
    debug(1, `DRIVER DisplayDriver_serial_epson (${this.config.id}): setPower: ${power}`);
  }

  setBlanking(blanking) {
    this.currentBlanking = blanking;
    if (blanking) {
      this.serialSend(this.serialCommands.BLANK).catch(e => this.handleSerialError(e));
    }
    else {
      this.serialSend(this.serialCommands.UNBLANK).catch(e => this.handleSerialError(e));
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
      ResponseTimeout: this.timeout, // Timeout in milliseconds
      Text: command
    })
      .then(response => {
        resolve(response); // Always resolve here
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .catch(e => {
        reject('TIMEOUT'); // Reject only on timeout/error from xapi.Send
        this.handleSerialError(e);
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .finally(() => {
        this.sending = false;
        return this.sendNextMessage();
      });
  }
  handleSerialError(e) {
    const now = Date.now();
    if (now - this._lastErrorAt >= this._errorDebounceMs) {
      this._lastErrorAt = now;
      const msg = (e && e.message) ? e.message : String(e);
      debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): ${msg}`);
      if (String(msg).includes('Unable to open outgoing connection')) {
        debug(2, `DRIVER DisplayDriver_serial_epson (${this.config.id}): USB serial not available (projector unplugged?)`);
      }
    }
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
  async setPosition(position) {
    var relay;
    if (position.toUpperCase() == 'UP') {
      relay = this.config.upRelay;
    }
    else if (position.toUpperCase() == 'DOWN') {
      relay = this.config.downRelay;
    }

    debug(1, `DRIVER ScreenDriver_gc_itachflex (${this.config.id}): setPosition: ${position}`);

    await zapi.communication.httpClient.Put({
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
        xapi.Config.Audio.Input.Microphone[this.config.connector].Mode.set('Off');
        break;
      case 'hdmi':
        xapi.Config.Audio.Input.HDMI[this.config.connector].Mode.set('Off');
        break;
    }
  }

  on() {
    debug(1, `DRIVER AudioInput_codecpro (${this.config.id}): On`);
    switch (this.config.input) {
      case 'microphone':
        xapi.Config.Audio.Input.Microphone[this.config.connector].Mode.set('On');
        break;
      case 'hdmi':
        xapi.Config.Audio.Input.HDMI[this.config.connector].Mode.set('On');
        break;
    }
  }
}

export class AudioInputDriver_codeceq {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setGain(gain) {
    debug(1, `DRIVER AudioInput_codeceq (${this.config.id}): setGain: ${gain}`);
    xapi.Config.Audio.Input.Microphone[this.config.connector].Gain.set(gain);
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
    debug(1, `DRIVER AudioInput_codeceq (${this.config.id}): Off`);
    xapi.Config.Audio.Input.Microphone[this.config.connector].Mode.set('Off');
  }

  on() {
    debug(1, `DRIVER AudioInput_codeceq (${this.config.id}): On`);
    xapi.Config.Audio.Input.Microphone[this.config.connector].Mode.set('On');
  }
}

export class AudioInputDriver_aes67 {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setGain(gain) {
    debug(1, `DRIVER AudioInput_aes67 (${this.config.id}): setGain: ${gain}`);
    // AES67 supports gain control per channel
    // Default to channel 1 if no channel specified in config
    const channel = this.config.channel || 1;
    xapi.Config.Audio.Input.Ethernet[this.config.connector].Channel[channel].Gain.set(gain);
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
    debug(1, `DRIVER AudioInput_aes67 (${this.config.id}): Off`);
    xapi.Config.Audio.Input.Ethernet[this.config.connector].Channel[this.config.channel].Mode.set('Off');
  }

  on() {
    debug(1, `DRIVER AudioInput_aes67 (${this.config.id}): On`);
    xapi.Config.Audio.Input.Ethernet[this.config.connector].Channel[this.config.channel].Mode.set('On');
  }
}

export class AudioInputDriver_usb {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setGain(gain) {
    debug(1, `DRIVER AudioInput_usb (${this.config.id}): setGain: ${gain}`);
    // Try both Level and Gain settings as different systems use different APIs
    // Handle errors silently since we don't know which API the device supports
    const connectorId = this.config.connector;

    try {
      xapi.config.get(`Audio.Input.USBInterface[${connectorId}].Level`).then(() => {
        xapi.Config.Audio.Input.USBInterface[connectorId].Level.set(gain);
      }).catch((e) => {
        // Try Gain instead
        xapi.config.get(`Audio.Input.USBInterface[${connectorId}].Gain`).then(() => {
          // USB interfaces typically have a smaller gain range, try to constrain the value
          let constrainedGain = Math.max(0, Math.min(gain, 24)); // Constrain between 0-24
          if (constrainedGain !== gain) {
            debug(1, `DRIVER AudioInput_usb (${this.config.id}): Constraining gain from ${gain} to ${constrainedGain} for USB interface`);
          }
          xapi.Config.Audio.Input.USBInterface[connectorId].Gain.set(constrainedGain);
        }).catch((e2) => {
          debug(2, `DRIVER AudioInput_usb (${this.config.id}): Both Level and Gain settings failed for connector ${connectorId}`);
        });
      });
    } catch (e) {
      debug(2, `DRIVER AudioInput_usb (${this.config.id}): setGain failed: ${e.message}`);
    }
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
    debug(1, `DRIVER AudioInput_usb (${this.config.id}): Off`);
    const connectorId = this.config.connector;
    try {
      xapi.config.get(`Audio.Input.USBInterface[${connectorId}].Mode`).then(() => {
        xapi.Config.Audio.Input.USBInterface[connectorId].Mode.set('Off');
      }).catch((e) => {
        debug(2, `DRIVER AudioInput_usb (${this.config.id}): Failed to set mode Off: ${e.message}`);
      });
    } catch (e) {
      debug(2, `DRIVER AudioInput_usb (${this.config.id}): Off failed: ${e.message}`);
    }
  }

  on() {
    debug(1, `DRIVER AudioInput_usb (${this.config.id}): On`);
    const connectorId = this.config.connector;
    try {
      xapi.config.get(`Audio.Input.USBInterface[${connectorId}].Mode`).then(() => {
        xapi.Config.Audio.Input.USBInterface[connectorId].Mode.set('On');
      }).catch((e) => {
        debug(2, `DRIVER AudioInput_usb (${this.config.id}): Failed to set mode On: ${e.message}`);
      });
    } catch (e) {
      debug(2, `DRIVER AudioInput_usb (${this.config.id}): On failed: ${e.message}`);
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
    xapi.Config.Audio.Input.Ethernet[this.config.connector].mode.set('Off');
  }

  on() {
    debug(1, `DRIVER AudioOutput_aes67 (${this.config.id}): On`);
    xapi.Config.Audio.Input.Ethernet[this.config.connector].mode.set('On');
  }
}

export class AudioOutputDriver_usb {
  constructor(device, config) {
    this.config = config;
    this.device = device;
  }

  setLevel(level) {
    // USB audio outputs don't support setLevel
    debug(2, `DRIVER AudioOutput_usb (${this.config.id}): setLevel not supported for USB interfaces`);
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
    debug(1, `DRIVER AudioOutput_usb (${this.config.id}): Off`);
    const connectorId = this.config.connector;
    try {
      xapi.config.get(`Audio.Output.USBInterface[${connectorId}].Mode`).then(() => {
        xapi.Config.Audio.Output.USBInterface[connectorId].Mode.set('Off');
      }).catch((e) => {
        debug(2, `DRIVER AudioOutput_usb (${this.config.id}): Failed to set mode Off: ${e.message}`);
      });
    } catch (e) {
      debug(2, `DRIVER AudioOutput_usb (${this.config.id}): Off failed: ${e.message}`);
    }
  }

  on() {
    debug(1, `DRIVER AudioOutput_usb (${this.config.id}): On`);
    const connectorId = this.config.connector;
    try {
      xapi.config.get(`Audio.Output.USBInterface[${connectorId}].Mode`).then(() => {
        xapi.Config.Audio.Output.USBInterface[connectorId].Mode.set('On');
      }).catch((e) => {
        debug(2, `DRIVER AudioOutput_usb (${this.config.id}): Failed to set mode On: ${e.message}`);
      });
    } catch (e) {
      debug(2, `DRIVER AudioOutput_usb (${this.config.id}): On failed: ${e.message}`);
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
        xapi.Status.Standby.State.on(status => {
      if (status == 'Standby') {
        debug(1, `Sending ${this.config.name}:STANDBY_ON to ${this.config.name}`);
        zapi.communication.sendMessage(`${this.config.name}:STANDBY_ON`);
      }
      else if (status == 'Off') {
        debug(1, `Sending ${this.config.name}:STANDBY_OFF to ${this.config.name}`);
        zapi.communication.sendMessage(`${this.config.name}:STANDBY_OFF`);
      }
    });
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


export class USBSerialDriver {
  constructor(device, config) {
    this.device = device;
    this.config = config;
    this.queue = [];
    this.sending = false;
    this.pacing = this.config.pacing || 200;
    this.timeout = this.config.timeout || 200;
    this.terminator = (typeof this.config.terminator !== 'undefined') ? this.config.terminator : '\\r\\n';
    this.port = this.config.port || 1;

    try {
      if (this.port < 1 || this.port > 4) {
        throw new Error(`Invalid serial port number: ${this.port}. Port must be between 1 and 4.`);
      }
      xapi.Config.SerialPort.Outbound.Mode.set('On');
      if (this.config.baudRate) {
        xapi.Config.SerialPort.Outbound.Port[this.port].BaudRate.set(this.config.baudRate);
      }
      if (this.config.parity) {
        xapi.Config.SerialPort.Outbound.Port[this.port].Parity.set(this.config.parity);
      }
      xapi.Config.SerialPort.Outbound.Port[this.port].Description.set(this.config.id || 'SerialPort');
      this.serialPortConfigured = true;
      debug(1, `DRIVER USBSerialDriver (${this.config.id}): Serial port configured on port ${this.port}`);
    }
    catch (e) {
      this.serialPortConfigured = false;
      debug(2, `DRIVER USBSerialDriver (${this.config.id}): Failed to configure serial port: ${e.message}`);
    }
  }

  send(command) {
    return new Promise((resolve, reject) => {
      if (!this.serialPortConfigured) {
        debug(2, `DRIVER USBSerialDriver (${this.config.id}): Serial port not configured, cannot send command`);
        reject('SERIAL_NOT_CONFIGURED');
        return;
      }
      this.queue.push({ command, resolve, reject });
      if (!this.sending) {
        this._sendNext();
      }
    });
  }

  sendRaw(text) {
    return this.send(text);
  }

  _sendNext() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }
    if (this.sending) {
      return;
    }
    this.sending = true;
    const { command, resolve, reject } = this.queue.shift();

    debug(1, `DRIVER USBSerialDriver (${this.config.id}): TX: ${String(command).trim()}`);

    const sendParams = {
      PortId: this.port,
      ResponseTimeout: this.timeout,
      Text: command
    };

    if (this.terminator !== null && this.terminator !== '') {
      sendParams.ResponseTerminator = this.terminator;
    }

    xapi.Command.SerialPort.PeripheralControl.Send(sendParams)
      .then(response => {
        try {
          const rx = (response && typeof response.Response !== 'undefined') ? String(response.Response).trim() : '';
          debug(1, `DRIVER USBSerialDriver (${this.config.id}): RX: ${rx === '' ? '<empty>' : rx}`);
        }
        catch (e) {
          debug(2, `DRIVER USBSerialDriver (${this.config.id}): RX parse error: ${e.message}`);
        }
        resolve(response);
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .catch(e => {
        debug(2, `DRIVER USBSerialDriver (${this.config.id}): Serial send error: ${e.message || e}`);
        reject('TIMEOUT');
        return new Promise(res => setTimeout(res, this.pacing));
      })
      .finally(() => {
        this.sending = false;
        this._sendNext();
      });
  }

  reset() {
    this.queue = [];
    this.sending = false;
  }
}

export class TridonicDALI_BM {
  constructor(device, config) {
    this.device = device;
    this.config = config;
    this.queue = [];
    this.sending = false;
    this.pacing = 50;
    this.port = this.config.port || 1;

    try {
      xapi.Config.SerialPort.Outbound.Mode.set('On');
      xapi.Config.SerialPort.Outbound.Port[this.port].BaudRate.set(19200);
      xapi.Config.SerialPort.Outbound.Port[this.port].Parity.set('None');
      xapi.Config.SerialPort.Outbound.Port[this.port].Description.set('TridonicDALI');
      debug(1, `DRIVER TridonicDALI_BM (${this.config.id}): Serial port ${this.port} configured`);
    } catch (e) {
      debug(2, `DRIVER TridonicDALI_BM (${this.config.id}): Failed to configure serial port: ${e.message}`);
    }
  }

  sendDaliCommand(zone, intensity) {
    const prefix = 0xA3;
    const reserved = 0x00;
    let checksum = prefix ^ reserved ^ reserved ^ reserved ^ zone ^ intensity;
    
    // Build escaped hex string for serial transmission (e.g. "\xA3\x00\x00...")
    // The xAPI requires hex values to be escaped in the Text parameter
    let bytes = [prefix, reserved, reserved, reserved, zone, intensity, checksum];
    let commandString = bytes.map(b => '\\x' + b.toString(16).padStart(2, '0').toUpperCase()).join('');
    
    debug(1, `DRIVER TridonicDALI_BM (${this.config.id}): sendDaliCommand zone=${zone}, intensity=${intensity}, checksum=${checksum}`);

    this.queue.push(commandString);
    if (!this.sending) {
      this._processQueue();
    }
  }

  async _processQueue() {
    if (this.queue.length === 0) {
      this.sending = false;
      return;
    }

    this.sending = true;
    const command = this.queue.shift();

    try {

      await xapi.Command.SerialPort.PeripheralControl.Send({
        PortId: this.port,
        Text: command,
        ResponseTimeout: 100
      });
    } catch (e) {
      debug(2, `DRIVER TridonicDALI_BM (${this.config.id}): Exception caught - ${e.message}`);
      if (!String(e.message).includes('Timeout')) {
        debug(2, `DRIVER TridonicDALI_BM (${this.config.id}): Send error: ${e.message}`);
      }
    }

    setTimeout(() => {
      this._processQueue();
    }, this.pacing);
  }
}

export class LightDriver_TridonicDALI {
  constructor(device, config) {
    this.device = device;
    this.config = config;
  }

  _getGateway() {
    if (this.config.gatewayId) {
      let gatewayDevice = zapi.devices.getDevice(this.config.gatewayId);
      if (gatewayDevice && gatewayDevice.driver) {
        return gatewayDevice.driver;
      }
    }
    debug(2, `DRIVER LightDriver_TridonicDALI (${this.config.id}): No gatewayId configured or gateway driver not found.`);
    return null;
  }

  on() {
    let gateway = this._getGateway();
    if (gateway) {
      gateway.sendDaliCommand(this.config.zone, 254);
      debug(1, `DRIVER LightDriver_TridonicDALI (${this.config.id}): ON -> Zone ${this.config.zone}`);
    }
  }

  off() {
    let gateway = this._getGateway();
    if (gateway) {
      gateway.sendDaliCommand(this.config.zone, 0);
      debug(1, `DRIVER LightDriver_TridonicDALI (${this.config.id}): OFF -> Zone ${this.config.zone}`);
    }
  }

  dim(level) {
    let gateway = this._getGateway();
    if (gateway) {
      let val = Math.round((level / 100) * 254);
      gateway.sendDaliCommand(this.config.zone, val);
      debug(1, `DRIVER LightDriver_TridonicDALI (${this.config.id}): DIM ${level}% -> ${val} -> Zone ${this.config.zone}`);
    }
  }
}

