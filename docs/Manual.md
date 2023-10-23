# MCS (nom temporaire)
MCS est une collection de macros pour les systèmes Cisco Webex, constituant un système intégré, modulaire, flexible et simple à utiliser, destiné à être utilisé comme point central de contrôle dans une salle de cours ou de réunion. La logique de la salle ainsi que son interface utilisateur peuvent donc être centralisés sur un seul appareil qui utilise un langage de programmation connu et moderne.

## Aspects principaux
* Utilisation de seulement **1 macro active**, laissant ainsi place à 9 macros libres
* Unifier la configuration de l'ensemble du système en un seul fichier
* Ajouter des fonctionnalités accessible à l'ensemble du système par un concept de **modules**
* Supporter plusieurs comportements **complètement distinct** sur le même système par un concept de **scénario** (par exemple, "mode manuel" et "mode automatique"
* **Virtualisation** des appareils internes ou externes, rendant les particularités de chaque salle plus simple à prendre en charge par chaque scénario
* **Groupement** de différents type d'appareils dans des groupes nommés, dont plusieurs groupes standard
* Architecture de **drivers** d'appareil, qui permet d'étendre les fonctionnalités de base à d'autres appareils du même type mais qui ne partagent pas tous le même fonctionnement (protocole, connectique)
* Une grande collection d'appareils supportés directement dans la distribution (13) dont plusieurs supportant des drivers: Camera, LightScene, Light, AudioInputGroup, AudioOutputGroup, Display, CameraPreset, AudioInput, ControlSystem, Screen, SoftwareDevice, AudioReporter, Shade
* Une grande collection de drivers supportés directement dans la distribution (14) pour une variété d'appareils
* Un système de gestion et d'annonce de **statut système global**, avec événements, avec valeurs par défaut
* **Mapping automatique des widgets** pour chaque appareil, pour chaque statut système, actions
* Gestion du boot (warm, cold)
* Gestion du standby
* Gestion du debug
* Avertissements pour PresenterTrack
* Support pour plusieurs sorties audio dépendant du volume (extra)
* Analyse des entrées audio avec événements
* Interface utilisateur séparée du code
* Chaines de texte dans la configuration
* Système de **mise-à-jour automatique** via une page web ou github
* Gestion du "do not disturb"
* Panneau de contrôle **administrateur**
* Fonctionnalités de diagnostique de base et d'envoi de rapport système pour analyse
* 2 examples de modules, 3 examples de scénarios
* **Un API simple et puissant**

## Configuration
Le fichier de configuration unique se nomme "config.js". Il contient les paramètres du système, des modules, des scénarios, des statuts, des appareils et des groupes.
Chaque section est expliquée ci-dessous.

### Importation des scénarios
```JS
/*****************************/
//Import scenarios here with syntax: import * as SCE_Name from './SCE_Name';
import * as sce_standby from './sce_standby';
import * as sce_como_type1 from './sce_como_type1';
import * as sce_firealarm from './sce_firealarm';
//Add scenarios to config.scenarios below.
/****************************/
```
Dans cette section sont importés les scénarios. Les scénarios sont toujours importés avec un wildcard (*) et le nom des fichiers sont toujours préfixés de "sce_".

### Importation des modules
```JS
/****************************/
//Import modules below
import * as mod_autosauce from './mod_autosauce';
import * as mod_hidcameraman from './mod_hidcameraman';
/****************************/
```
Dans cette section sont importés les modules. Les modules sont toujours importés avec un wildcard (*) et le nom des fichiers sont toujours préfixés de "mod_".

### Importation des appareils (devices) et des drivers
```JS
/****************************/
//Import drivers or drivers libraries below
import * as devicesLibrary from './devicesLibrary';
import * as driversLibrary from './driversLibrary';
/****************************/
```
Dans cette section sont importés les devices et les drivers. Il n'y a pas de nommenclature standard pour ces fichiers.

### Définition du produit
```JS
export const PRODUCT = 'PrepOS (dev)';
export const VERSION = '0.0.1';
```
Définition du nom de produit et de la version. Il n'est pas recommandé de modifier ces variables.

### Configuration, section "scenarios"
```JS
  scenarios: [
    sce_standby,
    sce_como_type1,
    sce_firealarm,
  ],
```
Cette section est un array de tout les imports des scénarios. Si l'import n'est pas dans ce array, le scénario ne sera pas disponible

### Configuration, section "modules"
```JS
  modules: [
    mod_autosauce,
    mod_hidcameraman
  ]
```
Cette section est un array de tout les imports des modules. Si l'import n'est pas dans ce array, le module ne sera pas disponible

### Configuration, section "system"
```JS
  system: {
    coldBootWait: 120,                            // Temps (secondes) qui détermine un "cold boot"
    debugLevel: DEBUGLEVEL.MEDIUM,                // Niveau de débug (LOW, MEDIUM, HIGH)
    debugInternalMessages: false,                 // <true, false> Affichage des messages "xapi.Event.Messages"
    messagesPacing: 500,                          // Temps (ms) entre les messages de type "xpi.Command.Message"
    initDelay: 1000,                              // Temps (ms) avant l'initialisation du système
    newSessionDelay: 5000,                        // Temps (ms) pour l'ouverture d'une nouvelle session. Une progressbar s'affiche.
    forceStandby: true,                           // <true, false> Forcer un standby à une heure précise, peu importe si un appel ou une présentation sont actifs
    forceStandbyTime: '04:00',                    // Heure à laquelle le standby sera forcé
    requiredPeripheralsCheckInterval: 30000,      // Temps (ms) entre les vérifications des périphériques identifiés comme "requiredPeripheral"
    usePresenterTrack: true,                      // <true, false> Défini si PresenterTrack est utilisé. Une autre valeur identique se trouve dans systemStatus
    forcePresenterTrackActivation: false,         // <true, false> Est-ce que l'activation du PresenterTrack est forcée par le système, peu importe si le scénario actif le supporte ou pas
    presenterTrackConnector: 3,                   // Numéro du connecteur d'entrée sur lequel est connecté la caméra utilisée par le PresenterTrack
    settingsMenu: 'Locked',                       // <Locked, Unlocked> Détermine si le panneau de paramètre est vérouillé
    disableAutoLightsWhenWidgetInteraction: true, // <true, false> Détermine si le contrôle automatique de l'éclairage est automatiquement désactivé lorsqu'un widget de Light ou LightScene est touché par l'utilisateur
    systemReportApiKey: 'key',                    // Clé d'api de "paste.ee" utilisé pour l'envoi de rapport système
    onStandby: {
      setDND: false,                              // <true, false> Détermine si le mode "ne pas déranger" est activé lors du standby
      clearCallHistory: false,                    // <true, false> Détermine si l'historique d'appel est supprimé lors du standby
      enableScenario: 'standby'                   // Scénario à activer lors du standby. Le système est livré avec un scénario conseillé nommé "standby", fichier "sce_standby"
    },
    onWakeup: {
      enableScenario: 'comotype1'                 // Scénario à activer lors de la sortie du standby (wakeup).
    }
  }
```

### Configuration, section "audio"
```JS
  audio: {
    extra: {
      enabled: true,                                // <true, false> Détermine si le système gère le volume comme étant "extra", c-a-d plus fort que le volume recommandé
      outputGroup: 'system.audio.extra.output',     // Groupe contenant les devices de type "AudioOutputGroup" à utiliser si une autre sortie audio supplémentaire doit être activée au-dessu d'un certain niveau
      inputGroup: 'system.audio.extra.inputs',      // Groupe contenant les devices de type "AudioInputGroup" à connecter au outputGroup si une sortie audio supplémentaire doit être activée au-dessus d'un certain niveau
      setGainZero: ['system.audio.presentermics'],  // Groupe contenant les devices de type "AudioInput" dont le gain sera mit à "0" si choisi par l'utilisateur (recommandé pour les appareils contrôlables par l'utilisateur)
      setStatusOff: ['AudienceMics'],               // Groupe contenant les devices de type "AudioInput" dont le le mode sera mit à "off" si choisi par l'utilsateur (recommandé pour les appareils non-contrôlables par l'utilisateur)
      overVolume: 75                                // Détermine la limite entre le volume normal et le volume élevé, en pourcentage
    }
  }
```

### Configuration, section "strings"
```JS
 strings: {
    systemStartingColdBootTitle: 'Démarrage', //Titre du message quand le système vient d'allumer (Cold boot)
    systemStartingColdBootText: 'Le système vient de démarrer. Optimisation en cours...', //Texte du message quand le système vient d'allumer (Cold boot)
    systemStartingTitle: 'Démarrage du système', //Titre du message quand les macros viennent de démarrer (Warm boot)
    systemStartingText: 'Le système démarre. Un instant svp.', //Texte du message quand les macros viennent de démarrer (Warm boot)

    newSessionTitle: `Préparation de votre session`, //Titre du message quand le système sort de veille (en dessous il y a une progressbar, délais de ~2 à ~5 secondes)

    endSessionTitle: 'Terminer la session ?', //Titre du message de confirmation de fermeture de session (S'affichage uniquement si aucun appel ni présentation)
    endSessionPresentation: 'Ceci mettra fin à votre présentation.<br>Terminer la session ?', //Texte du message de confirmation de fermeture de session si une présentation est active
    endSessionCall: 'Ceci mettra fin aux communications.<br>Terminer la session ?', //Texte du message de confirmation de fermeture de session si un appel est connecté
    endSessionCallPresentation: 'Ceci mettra fin à votre présentation et aux communications.<br>Terminer la session ?', //Texte du message de confirmation de fermeture de session si une présentation est active ET qu'un appel est connecté
    endSessionChoiceYes: 'Oui (Terminer la session)', //Texte du bouton "Oui"
    endSessionChoiceNo: 'Non (Annuler)', //Texte du bouton "Non"

    deviceMonitoringWaitForDevicesTitle: 'Périphériques', //Titre du message affiché lors de l'attente des périphériques (au boot)
    deviceMonitoringWaitForDevicesText: 'En attente des périphériques: %DEVICES%', //Texte du message affiché lors de l'attente des périphériques (au boot),

    devicesMissingTitle: '🚩 Problème du système 🚩', //Titre du message d'erreur lorsqu'un périphérique cesse de répondre
    devicesMissingText: 'Contactez votre soutien technique.<br>Périphériques indisponibles:<br>', //Texte du message d'erreur lorsqu'un périphérique cesse de répondre
    devicesWaitingTitle: 'En attente des périphériques...', //Texte du message lors de l'attente des périphériques
    devicesAllConnectedTitle: 'Démarrage du système', //Titre du message lorsque tous les appareils se sont connectés
    devicesAllConnectedText: 'Tous les périphériques sont connectés. Un instant svp...', //Texte du mnessage lorsque tous les appareils se sont connectés

    presenterTrackLocked: '🟢 Cadrage automatique ACTIVÉ 🟢', //Texte affiché lorsque le PresenterTracking trouve le présentateur (affiché quelques secondes)
    presenterTrackLost: '🔴 Cadrage automatique DÉSACTIVÉ 🔴.<br>Revenez dans la zone de présentation pour le réactiver.', //Texte affiché lorsque le PresenterTrack ne trouve plus le présentateur (affiché en continu)

    sendReportTitle: 'Rapport système', //Titre de la fonctionnalité d'envoi de rapport d'erreur
    sendReportText: 'Envoi du rapport en cours...', //Texte de la fonctionnalité d'envoi de rapport d'erreur lors de l'envoi
    sendReportSuccess: 'Envoi réussi!<br>Référence: ', //Texte de la fonctionnalité d'envoi de rapport d'erreur, succès
    sendReportFailure: `Échec de l'envoi.`, //Texte de la fonctionnalité d'envoi de rapport d'erreur, échec

    audioExtraHighVolumeTitle: `Volume élevé`, //Titre du message d'avertissement de volume élevé
    audioExtraHighVolumeText: `Il est recommandé de désactiver tous les microphones lorsque le système est utilisé à un volume si élevé.<br>Voulez-vous désactiver les microphones ?`, //texte du message d'avertissement de volume élevé
    audioExtraHighVolumeYes: `Oui, désactiver`, //Option "oui" pour le message d'avertissement de volume élevé
    audioExtraHighVolumeNo: `Non, ne pas désactiver`, //Option "non" pour le message d'avertissement de volume élevé
    audioExtraNormalVolumeTitle: `Volume normal`, //Titre du message d'avertissement de volume normal
    audioExtraNormalVolumeText: `Le système est de nouveau utilisé à un volume normal.<br>Voulez-vous réactiver les microphones ?`, //Texte du message d'avertissement de volume normal
    audioExtraNormalVolumeYes: `Oui, réactiver`, //Option "oui" pour le message d'avertissement de volume normal
    audioExtraNormalVolumeNo: `Non, laisser désactivés` //Option "non" pour le message d'avertissement de volume normal
  },
```
Cette section contient tous les messages pour l'interface utilisateur

### Configuration, section "systemStatus"
```JS
  systemStatus: {
    //System status
    Product: PRODUCT, //System, nom du produit
    Version: VERSION, //System, version du produit
    PresenterLocation: 'local', //System, <local, remote>, emplacement du présentateur
    PresenterTrackWarnings: 'on', //System, <on, off>, affichage des messages d'avertissement PresenterTrack
    UsePresenterTrack: 'on', //System, <on, off>, utilisation de PresenterTrack
    AutoDisplays: 'on', //System, <on, off>, gestion des affichages automatique (doit être pris en charge dans le scénario)
    AutoScreens: 'on', //System, <on, off>, gestion des toiles motorisées automatique (doit être pris en charge dans le scénario)
    AutoLights: 'on', //System, <on, off>, gestion de l'éclairage automatique (doit être pris en charge dans le scénario)
    AutoCamPresets: 'on', //System, <on, off> gestion des presets de caméra automatique (doit être pris en charge dans le scénario)
    AutoCamSelection: 'off', //System, <on, off> selection de la caméra automatique (doit être pris en charge dans le scénario)
    AudienceMics: 'on', //System, <on, off> Utilisation des microphones de l'auditoire (doit être pris en charge dans le scénario)
    PresenterMics: 'on', //System, <on, off> Utilisation des microphones du présentateur (doit êter pris en charge dans le scénario)
    PresenterDetected: false, //System, <true, false>, indique si le présentateur est détecté par le système (utilise le statut de PresenterTrack)
    ClearPresentationZone: 'off', //System, <on, off>, indique si la zone de présentateur doit être dégagée (doit être pris en charge dans le scénario)

    //Scenario-specific status

  }
```
Cette section contient les pairs clé/valeurs qui seront automatiquement incluses dans la structure de donnée "systemStatus". Les clés identifiées "System" sont obligatoires pour le bon fonctionnement du système. Aucun événement de changement de valeur ne sera déclanché pour l'initialisation de ces valeurs.

Ces valeurs seront automatiquement restaurées lorsque le système tombe en veille. Le changement de ces valeurs enclanche un processus d'événement si la valeur est différente de la valeur actuelle, ou si le déclanchement d'événement est forcé (documenté dans l'API)

Il est possible de "connecter" ces valeurs à un widget dans l'interface tactile sans programmation. Si un widget a un "id" commençant par "SS$", suivi du nom d'une clé de systemStatus, le widget sera automatiquement connecté à cette clé. Par exemple, un widget de type "toggle", nommé "SS$AudienceMics" affichera le statut actuel des microphones de l'auditoire, et changera la valeur si changé par l'utilisateur. Un widget de type "button group", nommé "SS$PresenterLocation", changera l'emplacement du présentateur tout en affichant l'emplacement actuel.

## Section devices
La section "devices" contient tous les appareils (virtuels ou physiques) que le système contrôle. Le système est livré avec une bibliothèque de devices standards, disponibles dans le fichier "devicesLibrary.js". Il est possible d'ajouter d'autres devices à partir d'autres fichiers.

Quelques propriétés sont utilisés par tout les devices:
* **id**: Identifiant unique pour le device. Il est recommandé d'utiliser un string sans espaces
* **type**: Type d'appareil. Une liste standard est définie par "DEVICEYTYPE". Il est possible d'utiliser n'importe quel string comme type
* **name**: Nom de l'appareil. Ce nom est souvent utilisé par les device drivers pour la communication avec d'autres systèmes
* **device**: Classe qui gère cet appareil. Plusieurs classes sont fournies dans le fichier devicesLibrary.js
* **driver**: Driver pour la classe de device. La classe gère ce driver à l'interne

Ci-dessous une description de chaque type de device inclus par défaut.
### Display (projecteur, téléviseur)
```JS
    {
      id: 'display.projector',                      //identification unique
      type: DEVICETYPE.DISPLAY,                     //Type = 'DISPLAY'
      name: 'PROJ',                                 //Nom, utilisé par le driver pour la communication
      device: devicesLibrary.Display,               //Classe à utiliser
      driver: driversLibrary.DisplayDriver_isc_h21, //Driver à utiliser par le device
      connector: 1,                                 //Connecteur HDMI de sortie sur le codec
      supportsPower: true,                          //Défini si l'affichage supporte les commandes d'alimentation (ON, OFF)
      supportsBlanking: false,                      //Défini si l'affichage supporte les commandes de blanking (BLANK, UNBLANK)
      supportsSource: false,                        //Défini si l'affichage supporte le changement de source (HDMI1, HDMI2, SDI)
      supportsUsageHours: false,                    //Défini si l'affichage supporte le rapport de temps d'utilisation
      defaultPower: 'off',                          //Alimentation par défaut lors du démarrage du système (ON, OFF)
      defaultBlanking: false,                       //Blanking par défaut lors du démarrage du système (BLANK, UNBLANK)
      blankBeforePowerOff: true,                    //Défini si l'affichage doit être BLANK entre le moment où il reçoit la commande "OFF" et le moment où il est réellement OFF (powerOffDelay)
      powerOffDelay: 6000,                          //Délais entre la commande OFF du système et le véritable changement d'alimentation à OFF
      usageHoursRequestInterval: 100000,            //Interval de demande du temps d'utilisation
    }
```
### ControlSystem (Processeur Crestron, Raspberry Pi)
```JS
    {
      id: 'controlsystem',                                //Identification unique
      type: DEVICETYPE.CONTROLSYSTEM,                     //Type = 'CONTROLSYSTEM'
      name: 'CTRLSYS',                                    //Nom, utilisé par le driver pour la communication
      device: devicesLibrary.ControlSystem,               //Classe à utiliser
      driver: driversLibrary.ControlSystemDriver_isc_h21, //Driver à utiliser par le device
      syncRestart: true,                                  //Défini si le système de contrôle sera redémarré en même temps que le codec (si supporté)
      restartString: 'HW_RESTART',                        //Commande à envoyer au système de contrôle pour le redémarrage
      peripheralRequired: true,                           //Défini si ce device est requis pour l'utilisation du système. Sa présence est vérifiée au démarrage et à interval régulier
      peripheralId: 'FOC2447N5FW',                        //Numéro de série ou MACADDR du device (Status/Peripherals)
      heartbeatInterval: 5000                             //Interval à laquelle le driver signalera sa présence au système de contrôle
    }
```
### Screen (toile motorisée)
```JS
    {
      id: 'screen',                                 //Identification unique
      type: DEVICETYPE.SCREEN,                      //Type = 'SCREEN'
      name: 'SCREEN',                               //Nom, utilisé par le drivwer pour la communication
      device: devicesLibrary.Screen,                //Classe à utiliser
      driver: driversLibrary.ScreenDriver_isc_h21,  //Driver à utiliser par le device
      defaultPosition: 'up'                         //Position par défaut lors du démarrage du système
    }
```
### Shade (toiles de fenêtres)
```JS
    {
      id: 'shades',                                 //Identification unique
      type: DEVICETYPE.SHADE,                       //Type = 'SHADE'
      name: 'SHADES-EAST',                          //Nom, utilisé par le driver pour la communication
      device: devicesLibrary.Shade,                 //Classe à utiliser
      driver: driversLibrary.ShadeDriver_basic_isc, //Driver à utiliser par le device
      defaultPosition: 'up'                         //Position par défaut lors du démarrage du système
    }
```
