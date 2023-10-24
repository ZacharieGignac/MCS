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

Même si cette fonctionnalité doit être utilisée avec grande prudence, il est possible d'overrider n'importe quelle fonction ou objet de zapi, ainsi permettre à des modules de modifier le comportement de l'api. Il est important de ne pas modifier les arguments des appels de functions au risque de causer une erreur irrécupérable.


## ZAPI Version 1
- [Dispositifs (Devices)](#dispositifs-devices)
- [Scénarios (Scenarios)](#scénarios-scenarios)
- [Modules (Modules)](#modules-modules)
- [Système (System)](#système-system)
- [Performance (Performance)](#performance-performance)
- [Audio (Audio)](#audio-audio)
- [Interface Utilisateur (UI)](#interface-utilisateur-ui)

## Dispositifs (Devices)

### Méthodes

- `getDevice`: Récupère un dispositif spécifique.
- `getAllDevices`: Récupère tous les dispositifs.
- `getDevicesByType`: Récupère les dispositifs par type.
- `getDevicesByTypeInGroup`: Récupère les dispositifs par type dans un groupe spécifique.
- `activateCameraPreset`: Active un préréglage de caméra spécifique. Prend `presetId` en paramètre.

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

## Scénarios (Scenarios)

### Méthodes

- `getScenarios`: Récupère tous les scénarios.
- `enableScenario`: Active un scénario spécifique.
- `enablePreviousScenario`: Active le scénario précédent.
- `getPreviousScenario`: Récupère le scénario précédent.

## Modules (Modules)

### Méthodes

- `isModuleAvailable`: Vérifie si un module est disponible.
- `getModule`: Récupère un module spécifique.

## Système (System)

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

## Performance (Performance)

### Méthodes

- `setElapsedStart`: Définit le début du temps écoulé.
- `setElapsedEnd`: Définit la fin du temps écoulé.
- `inc`: Incrémente une valeur.
- `dec`:
- `reset`

## Audio (Audio)

### Méthodes

- `getLocalInputId`: Récupère l'ID d'entrée audio local.
- `getLocalOutputId`: Récupère l'ID de sortie audio local.
- `getRemoteInputsIds`: Récupère les IDs d'entrées audio à distance.
- `getRemoteOutputIds`:
- `addAudioReportAnalyzer`:

## Interface Utilisateur (UI)

### Méthodes

- `addActionMapping`: Ajoute un mappage d'action.
- `addWidgetMapping`: Ajoute un mappage de widget.
- `setWidgetValue`: Définit la valeur d'un widget.
- `getAllWidgets`: Récupère tous les widgets.
