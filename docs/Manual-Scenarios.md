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
    show: ['example_settings']
  },
  features: {
    cameraControls: true,
    endCallButton: true,
    hdmiPassthrough: true,
    webcam:true,
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
    zapi.system.onStatusChange((status) => { this.onStatusChange(status) });
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
```

## Section `export var Manifest`
- `fileName` : Nom du fichier.
- `id` : Identification unique du scénario. Cet identifiant est utilisé pour référencer le scénario, pour l'activer/désactiver.
- `friendlyName` : Nom lisible.
- `version` : Version du scénario.
- `description` : Description du scénario.
- `panels` : Permet de cacher ou d'afficher des "panels" ou des "action buttons".
  - `hide` : Array des panels/buttons à cacher. Si une étoile (*) est placée dans ce array, tous les panneaux seront cachés.
  - `show` : Array des panels/buttons à afficher.
- `features` : Permet d'afficher ou non les différentes fonctionnalités du système
  - `cameraControls` : Contrôles de caméra
  - `endCallButton` : Bouton "terminer l'appel"
  - `hdmiPassthrough` : Fonctionnalité "BYOD" (pour codec pro, room kit, room 55, etc..) *Interchangeable par la propriété `webcam`
  - `webcam` : Fonctionnalité "BYOD" (pour EQ, BarPro, etc..) *Interchangeable par la propriété `hdmiPassthrough`
  - `joinGoogleMeet` : Joindre Google Meet
  - `joinWebex` : Joindre Webex
  - `joinZoom` : Joindre Zoom
  - `joinMicrosoftTeamsCVI` : Joindre Microsoft Teams (CVI)
  - `keypad` : Clavier numérique pendant l'appel
  - `layoutControls` : Contrôle de la disposition
  - `midCallControls` : Fonctionnalités de hold, transfer, resume
  - `musicMode` : Mode musique
  - `participantList` : Liste des participants
  - `selfviewControls` : Controle du selfview
  - `start` : Bouton appel
  - `videoMute` : Désactivation de la vidéo
  - `shareStart` : Partage d'écran
 
## Section `export class Scenario`
Cette classe est le scénario. Elle sera instanciée au démarrage du système.

### constructor (obligatoire)
On peut initialiser des propriétés ici, mais en aucun cas n'agir sur le système. À cette étape, le scénario n'est pas considéré actif. Certaines fonctions du système ne peuvent être disponibles à ce moment.

### enable (obligatoire)
Cette function est appelée lorsque le système active le scénario. Une promesse doit être retournée et le premier argument executé avec la valeur `true` si le scénario s'est activé correctement.
```JS
  enable() {
    //Retourne une promesse et déclaire que le scénario peut être activé
    return new Promise(success => {
      success(true);
    });
  }
```
Dans cet exemple, vu qu'il n'y a pas de condition à l'activation du scénario, l'argument `success` est toujours executé avec la valeur `true`. Si `success` est executé avec la valeur `false`, le système n'activera pas le scénario, et le scénario précédent sera activé automatiquement. Si tous les scénarios refusent de s'activer, le système sera en erreur.

Une fois la valeur `true` retournée, la valeur `this.enabled` sera aussi à `true`, permettant au scénario de déterminer si il est présentement actif.

La promesse permet au scénario d'effectuer des tâches asynchrones. Le système attends la résolution de cette promesse pour continuer.

```JS
  enable() {
    //Retourne une promesse et déclaire que le scénario ne peut pas s'activer
    return new Promise(success => {
      success(false);
    });
  }
```
Dans cet exemple, le scénario ne s'activera jamais.

### disable (obligatoire)
Cette function est appelée lorsque le système désactive le scénario. Une promesse doit être retournée et le premier argument executé avec la valeur `true` si le scénario s'est désactivé correctement.
```JS
  disable() {
    //Retourne une promesse et déclaire que le scénario peut être désactivé
    return new Promise(success => {
      success(true);
    });
  }
```
Dans cet exemple, vu qu'il n'y a pas de condition à la désactivation du scénario, l'argument `success` est toujours executé avec la valeur `true`. Si `success` est executé avec la valeur `false`, le système ne désactivera pas le scénario.

Une fois la valeur `true` retournée, la valeur `this.enabled` sera à `false`, permettant au scénario de déterminer si il est présentement actif.

### start (obligatoire)
Cette function est executée quand le scénario est activé et que le scénario précédent est désactivé. Toute les fonctionnalités du système sont disponibles, les modules sont chargés, les scénarios sont chargés, le système est stabilisé.

## Activation d'un scénario
Le système a besoin d'au moins 1 scénario pour fonctionner. Lorsque le système tombe en veille, il activera le scénario indiqué dans la configuration `config.system.onStandby.enableScenario`. Lorsqu'il se réveille, il activara le scénario indiqué dans la configuration `config.system.onWakeup.enableScenario`

