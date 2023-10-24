# ZAPI
Le système utilise son propre API nommé "zapi". L'api est accessible via l'importation du module "zapi.js".

Plusieurs version de l'API peuvent être présente dans ce module, et sont toujours nommés "zapiv<version>", par exemple: zapiv1, zapiv2, zapiv3.

L'utilisation de zapi est possible dans un module qui a été chargé par le système, en tant que scénario ou module.

Il est très simple d'importer et d'utiliser zapi dans un scénario ou un module. Zapi doit être importé en utilisant la nommenclature d'importation ES6, c'est à dire "import".

Voici comment importer la version 1 de zapi à un module ou un scénario:
```JS
import { zapiv1 as zapi } from './zapi';
```

L'api est maintenat accessible via l'objet "zapi".

Même si cette fonctionnalité doit être utilisée avec grande prudence, il est possible d'overrider (surcharger) n'importe quelle fonction ou objet de zapi, ainsi permettre à des modules de modifier le comportement de l'api. Il est important de ne pas modifier les arguments des appels de functions au risque de causer une erreur irrécupérable.


## ZAPI Version 1
- [Dispositifs (devices)](#dispositifs-devices)
- [Scénarios (scenarios)](#scénarios-scenarios)
- [Modules (modules)](#modules-modules)
- [Système (system)](#système-system)
- [Performance (performance)](#performance-performance)
- [Audio (audio)](#audio-audio)
- [Interface Utilisateur (ui)](#interface-utilisateur-ui)

### Constantes de type de dispositif

- `CONTROLSYSTEM`: Système de contrôle
- `DISPLAY`: Affichage
- `CAMERAPRESET`: Préréglage de caméra
- `VIDEOOUTPUT`: Sortie vidéo
- `AUDIOINPUT`: Entrée audio
- `AUDIOOUTPUT`: Sortie audio
- `AUDIOINPUTGROUP`: Groupe d'entrée audio
- `AUDIOOUTPUTGROUP`: Groupe de sortie audio
- `AUDIOREPORTER`: Rapporteur de niveau audio
- `SCREEN`: Toile motorisée
- `LIGHT`: Éclairage (zone, luminaire)
- `LIGHTSCENE`: Scène d'éclairage
- `SHADE`: Toile de fenêtre
- `CAMERA`: Caméra
- `SOFTWAREDEVICE`: Appareil "logiciel" ou "virtuel"
  
## Dispositifs (devices)

### Méthodes

- `device getDevice`: Récupère un dispositif spécifique.
  - `id`: id du device
- `devices[] getAllDevices`: Récupère tous les dispositifs.
- `devices[] getDevicesByType`: Récupère les dispositifs par type.
  - `type`: type de devices
- `devices[] getDevicesByTypeInGroup`: Récupère les dispositifs par type dans un groupe spécifique.
  - `type`: type de devices
  - `group`: groupe
- `activateCameraPreset`: Active un préréglage de caméra spécifique.
  - `name`: Nom du preset

## Scénarios (scenarios)

### Méthodes

- `getScenarios`: Récupère tous les scénarios.
- `enableScenario`: Active un scénario spécifique.
- `enablePreviousScenario`: Active le scénario précédent.
- `getPreviousScenario`: Récupère le scénario précédent.

## Modules (modules)

### Méthodes

- `isModuleAvailable`: Vérifie si un module est disponible.
- `getModule`: Récupère un module spécifique.

## Système (system)

### Méthodes

- `resetSystemStatus`: Réinitialise l'état du système.
- `endSession`: Termine la session en cours.
- `setStatus`: Définit l'état du système.
- `getStatus`:
- `getAllStatus`:
- `onStatusChange`
- `onStatusKeyChange`
- `sendMessage`
- `systemReport`
- `sendSystemReport`

### Propriétés

- `systemReport`: Rapport du système.

## Performance (performance)

### Méthodes

- `setElapsedStart`: Définit le début du temps écoulé.
- `setElapsedEnd`: Définit la fin du temps écoulé.
- `inc`: Incrémente une valeur.
- `dec`:
- `reset`

## Audio (audio)

### Méthodes

- `getLocalInputId`: Récupère l'ID d'entrée audio local.
- `getLocalOutputId`: Récupère l'ID de sortie audio local.
- `getRemoteInputsIds`: Récupère les IDs d'entrées audio à distance.
- `getRemoteOutputIds`:
- `addAudioReportAnalyzer`:

## Interface Utilisateur (ui)

### Méthodes

- `addActionMapping`: Ajoute un mappage d'action.
- `addWidgetMapping`: Ajoute un mappage de widget.
- `setWidgetValue`: Définit la valeur d'un widget.
- `getAllWidgets`: Récupère tous les widgets.
