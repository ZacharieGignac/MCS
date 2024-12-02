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
  - `skipSetVideoSource` <`false`> : Quand `true`, ne change pas le "MainVideoSource"

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

- `resetSystemStatus`: Réinitialise de tous les status.
- `endSession`: Termine la session en cours.
- `setStatus`: Définit un statut à une certain valeur.
  - `key` : Clé du statut.
  - `value` : Valeur du statut.
- `getStatus`: Récupère la valeur d'un statut.
  - `key` : Clé du statut.
- `getAllStatus`: Récupère tout les statuts.
- `onStatusChange` : Ajoute un écouteur d'événement lors du changement de n'importe quel statut.
  - `callback` : Fonction qui sera executée lors d'un changement de statut.
- `onStatusKeyChange` : Ajoute un écouteur d'événement lors du changement d'un statut particulier.
  - `key` : Clé du statut.
  - `callback` : Fonction qui sera executée lors du changement du statut particulier.
- `sendSystemReport` : Envoie le rapport système.

### Propriétés

- `systemReport`: Structure de donnée qui sera envoyée lors de l'envoi rapport système. Il est possible d'ajouter des données dans cette structure, par exemple: `sendSystemReport['myData'] = { payload:'test!', anotherProperty:'Ok!' }`

## Événemements (system.events)
- `events`
  - `on` : Ajoute un écouteur d'événement.
    - `id` : Identication de l'événement.
    - `callback` : Fonction appelée lors de l'événement.
  - `off` : Retire un événement.
    - `id` : Identification de l'événement.
  - `emit`: Emet un événement.
    - `id` : Identification de l'événement.
    - `...args` : Arguments de l'événement.

### Méthodes

## Performance (performance)

### Méthodes

- `setElapsedStart`: Définit le début d'un chronomètre.
  - `id` : Identification du chronomètre.
- `setElapsedEnd`: Définit la fin d'un chronomètre.
  - `id` : Identification du chronomètre.
- `inc`: Incrémente une valeur.
  - `id`: : Identification de la valeur.
- `dec`: Décrémente une valeur.
  - Identification de la valeur.
- `setCounter` : Ajoute un compteur.
  - `id` : Identification du compteur.
  - `value` : Valeur du compteur.
- `getCounter` : Récupère un compteur.
  - `id` : Identication du compteur.
- `reset` : Remet à zéro toute les métriques de performance.

## Audio (audio)

### Méthodes

- `getLocalInputId`: Récupère l'ID d'entrée audio local.
  - `name` : Nom du groupe d'entrée dans audio console.
- `getLocalOutputId`: Récupère l'ID de sortie audio local.
  - `name` : Nom du groupe de sortie dans audio console.
- `getRemoteInputsIds`: Récupère les IDs d'entrées audio du site distant.
- `getRemoteOutputIds`: Récupère les IDs de sortie audio du site distant.
- `addAudioReportAnalyzer`: Récupère un nouvel analyseur de rapport audio.
- `applyAudioConfig`: Applique une configuration audio. (audio-console).
  - `config` : Structure de donnée qui doit être extraite d'un fichier ce-audio-config (const config).
  - `reset (false)` :  Si `true`, les `AuduiInput` seront remis dans l'état initial défini dans la config `reset()`, si `false` ils seront remis à jour `refresh()`.

## Interface Utilisateur (ui)

### Méthodes

- `addActionMapping`: Ajoute un mappage d'action.
  - `regex` : Regex qui match l'action.
  - `callback` : Fonction appelée lors de l'action.
- `addWidgetMapping`: Ajoute un mappage de widget.
  - `èvent` : Événement du widget.
  - `callback` : Fonction appelée lors de l'événement.
- `setWidgetValue`: Définit la valeur d'un widget.
  - `widgetId` : Identification du widget.
  - `value` : Valeur du widget.
- `getAllWidgets`: Récupère tous les widgets.
- `showProgressBar`: Affiche une progressbar ainsi qu'un titre et un texte pour une durée spécifiée
  - `title`: Titre du message
  - `text`: Texte du message
  - `seconds`: Durée de la progressBar (secondes)
  
## Stockage (storage)

### Méthodes
- `write`: Écris des données dans un fichier virtuel. Ces données sont permanentes, même après un redémarrage
  - `name`: Nom du fichier
  - `data`: Contenu du fichier
- `read`: Lis un fichier et retourne le contenu
  - `name`: Nom du fichier
- `del`: Efface un fichier
  - `name`: Nom du fichier
- `list`: Liste tous les fichiers dans le stockage
- `resetStorage`: Remet le stockage par défaut en effacant tout

## Communication (communication)

### Méthodes
- `sendMessage` : Envoie un message texte _xapi.Command.Message.Send.Text_ en respectant une cadence prédéfinie.
  - `text` : Texte à envoyer.
- `httpClient` : Client HTTP multi-thread. Toute les méthodes du client natif XAPI sont disponibles, mais seulement "GET" et "POST" sont décrites ici.
  - `Get` : Envoie une requête "GET"
    - `args` : Mêmes arguments que le client HTTP natif XAPI. Le request body doit être placé dans la propriété `Body` de cet objet.
  - `Post` : Envoie une requête "POST"
    - `args` : Mêmes arguments que le client HTTP natif XAPI. Le request body doit être placé dans la propriété `Body` de cet objet.


## À la racine (zapi.)
- `obj2string` : Retourne un JSON qui retire automatiquement les références cycliques
  - `object` : Objet à transformer en JSON 
