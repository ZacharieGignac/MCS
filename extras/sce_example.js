/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';


export var Manifest = {
  fileName: 'sce_example',
  id: 'example',
  friendlyName: `Scénario example`,
  version: '1.0.0',
  description: `Exemple de scénario qui ne veut vraiment pas que le volume soit au dessus de 70%, et autres choses.`,
  panels: {
    hide: ['*'],
    show: ['example_settings']
  },
  features: {
    cameraControls: true,
    endCallButton: true,
    hdmiPassthrough: true,
    joinGoogleMeet: false,
    joinWebex: true,
    joinZoom: false,
    joinMicrosoftTeamsCVI: false,
    keypad: true,
    layoutControls: true,
    midCallControls: false,
    musicMode: false,
    participantList: true,
    selfviewControls: true,
    start: true,
    videoMute: true
  }
};

export class Scenario {
  constructor() {
    //Écoute l'événement de changement de volume
    xapi.Status.Audio.Volume.on(vol => {
      this.checkVolume(vol);
    });
    //Écoute les changements de statut
    zapi.system.onStatusChange((status) => { this.onStatusChange(status); });
  }

  enable() {
    //Retourne une promesse et déclaire que le scénario peut être désactivé
    return new Promise(success => {
      success(true);
    });
  }

  disable() {
    //Retourne une promesse et déclaire que le scénario peut être désactivé
    return new Promise(success => {
      success(true);
    });
  }

  start() {
    //Pas besoin de cette function. Cette function est appelée par le scenario manager lorsque le scénario est activé et que le précédent est désactivé.
  }

  //Vérification du niveau lors du changement de volume
  checkVolume(vol) {
    //Vérifie si le scénario est activé
    if (this.enabled) {
      if (vol > 70) {
        //Replace le volume à 70%
        xapi.Command.Audio.Volume.Set({ Level: 70 });
      }
    }
  }

  //Vérification du changement de statut
  onStatusChange(status) {
    //Vérifie si le scénario est activé
    if (this.enabled) {
      //Si le présentateur est "remote", laisse un délais de 500ms avant de remettre à "local"
      if (status.key == 'PresenterLocation' && status.value == 'remote') {
        setTimeout(() => {
          zapi.system.setStatus('PresenterLocation', 'local');
        }, 500);
      }
    }

  }
}