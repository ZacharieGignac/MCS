# Scénarios
Les scénarios sont des parties de code qui seront exécutés dans le même processus que le système.

Ces scénarios définissent et prennent en charge, un à la fois, le comportement complet du système. Les scénarios sont gérés par un "Scenario Manager" qui s'occupe de changer de scénarios et indiquer à un scénario qu'il doit être activé ou non.

Techniquement, les scénarios sont toujours executés en parallèle. Ceci permet à un scénario de s'auto-activer en demandant au "Scénario Manager". Il est toutefois fortement recommandé de ne pas intéragir avec le système quand le scénario n'est pas activé.

Voici un exemple de scénario simple. Il ne modifie que quelques éléments du comportement de base du codec; Il ne permet pas de monter le volume à plus de 70%. De plus, il empêche les appels à Zoom et à Microsoft Teams, et il cache tous les icônes des autres scénarios et place un icône sur l'écran d'accueil.

```JS
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
    show: ['comotype1_settings']
  },
  features: {
    cameraControls: true,
    endCallButton: true,
    hdmiPassthrough: true,
    joinGoogleMeet: false,
    joinWebex: true,
    joinZoom: false,
    keypad: true,
    layoutControls: true,
    midCallControls: false,
    musicMode: false,
    participantList: true,
    selfviewControls: true,
    start: true,
    videoMute: true,
    joinMicrosoftTeamsCVI: false
  }
};

export class Scenario {
  constructor() {
    //Écoute l'événement de changement de volume
    xapi.Status.Audio.Volume.on(vol => {
      this.checkVolume(vol);
    });
    //Écoute les changements de statut
    zapi.system.onStatusChange((status) => { this.onStatusChange(status) });
  }

  enable() {
    //Retourne une promesse et déclaire que le scénario est activé
    return new Promise(success => {
      success(true);
    });
  }

  disable() {
    //Retourne une promesse et déclaire que le scénario est désactivé
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
```
