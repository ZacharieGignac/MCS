import xapi from 'xapi';

import { zapiv1 as zapi } from './zapi';
import { config as systemconfig } from './config';

export var Manifest = {
  fileName: 'mod_hidcameraman',
  id: 'hidcameraman',
  friendlyName: 'HID Cameraman',
  version: '1.0.0',
  description: `Activer / Désactiver PresenterTrack, activer des presets à l'aide d'un clavier ou d'une manette powerpoint`
};

export class Module {
  constructor() {
    this.config = systemconfig.mod_hidcameraman_config;
  }
  start() {
    xapi.Event.UserInterface.InputDevice.Key.Action.on(value => {
      if (this.config.setup) {
        this.processSetup(value);
      }
      else {
        this.processAction(value);
      }
    });
  }
  processSetup(value) {
    xapi.Command.UserInterface.Message.TextLine.Display({ Duration: 5, Text: `Key: ${value.Key} Type:${value.Type}`, X: 10000, Y: 1 });
  }
  processAction(value) {
    for (let key of this.config.keys) {
      if (key.key == value.Key && key.type == value.Type) {
        if (key.action == 'presentertrack_toggle') {
          let currentStatus = zapi.system.getStatus('UsePresenterTrack');
          let newStatus = currentStatus == 'on' ? 'off' : 'on';
          zapi.system.setStatus('UsePresenterTrack', newStatus);
          let message;
          if (newStatus == 'on') {
            message = 'Câdrage automatique ACTIVÉ ✅';
          }
          else {
            message = 'Câdrage automatique DÉSACTIVÉ ❌';
          }
          xapi.Command.UserInterface.Message.TextLine.Display({ Duration: 5, Text: message, X: 10000, Y: 1 });
        }
        else if (key.action == 'presentertrack_enable') {
          zapi.system.setStatus('UsePresenterTrack', 'on');
        }
        else if (key.action == 'presentertrack_disable') {
          zapi.system.setStatus('UsePresenterTrack', 'off');
        }
        else if (key.action == 'callpreset') {
          zapi.devices.activateCameraPreset(key.preset);
        }
      }
    }
  }
}

