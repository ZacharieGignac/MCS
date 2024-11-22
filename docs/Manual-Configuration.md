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
* Stockage permanent à travers les redémarrages
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
    showStatusAndPerformanceReports:false,        //Affiche le rapport de status après le boot et à interval (pour le developement)
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
Cet appareil prends automatiquement en charge certain widgets. Les widgets doivent avoir une identification particulière.
* **display.projector:POWERON** : Bouton, allume l'affichage
* **display.projector:POWEROFF** : Bouton, éteint l'affichage
* **display.projector:POWER** : Toggle, affiche le statut de l'affichage et contrôle son alimentation

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
      peripheralCheckMethod: 'internal',                  //Méthode à utiliser pour la vérification du device. "internal" réfère à la liste interne du codec (peripheral list)
      peripheralId: 'FOC2447N5FW',                        //Numéro de série ou MACADDR du device (Status/Peripherals)
      heartbeatInterval: 5000                             //Interval à laquelle le driver signalera sa présence au système de contrôle
    }
```

### Screen (toile motorisée)
#### En utilisant un système de contrôle externe
```JS
    {
      id: 'screen',                                 //Identification unique
      type: DEVICETYPE.SCREEN,                      //Type = 'SCREEN'
      name: 'SCREEN',                               //Nom, utilisé par le drivwer pour la communication
      device: devicesLibrary.Screen,                //Classe à utiliser
      driver: driversLibrary.ScreenDriver_isc_h21,  //Driver à utiliser par le device
      defaultPosition: 'up'                         //Position par défaut lors du démarrage du système
      alwaysUse: false,                             //Déclare que cette toile n'est PAS un obstacle à l'utilisation de la surface d'écriture
    }
```
#### En utilisant les GPIO du CodecPro
```JS
    {
      id: 'screen.gpio',                          //Identification unique
      type: DEVICETYPE.SCREEN,                    //Type = 'SCREEN'
      name: 'SCREEN2',                            //Nom
      device: devicesLibrary.Screen,              //Classe à utiliser
      driver: driversLibrary.ScreenDriver_gpio,   //Driver à utiliser par le device (GPIO)
      pin1: 1,                                    //Pin GPIO pour monter la toile
      pin2: 2,                                    //Pin GPIO pour descendre la toile
      defaultPosition: 'up'                       //Position par défaut
    }
```
#### En utilisant un Global Caché iTach Flex
```JS
    {
      id: 'screen.main',                          //Identification unique
      type: DEVICETYPE.SCREEN,                    //Type = 'SCREEN'
      name: 'SCREEN2',                            //Nom
      device: devicesLibrary.Screen,              //Classe à utiliser
      driver: driversLibrary.ScreenDriver_gc_itachflex,   //Driver à utiliser par le device (GPIO)
      host:'169.254.1.30',                        //Host ou IP du Global Caché iTach
      upRelay: 3,                                    //Relais pour monter la toile
      downRelay: 4,                                    //Relais pour descendre la toile
      pulseLength: 3000,                          //Temps d'activation du relais en ms, 1000ms si la propriété est omise
      defaultPosition: 'up'                       //Position par défaut
    }
```
Cet appareil prends automatiquement en charge certain widgets. Les widgets doivent avoir une identification particulière.
* **screen:UP** : Bouton, monte la toile
* **screen:DOWN** : Bouton, descends la toile

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
Cet appareil prends automatiquement en charge certain widgets. Les widgets doivent avoir une identification particulière.
* **shades:UP** : Bouton, monte la toile
* **shades:DOWN** : Bouton, descends la toile

### AudioInput (entrée audio du codec)
```JS
    {
      id: 'audioinput.presenter.sf1',                   //Identification unique
      type: DEVICETYPE.AUDIOINPUT,                      //Type = 'AUDIOINPUT'
      name: 'Micro sans-fil',                           //Nom
      device: devicesLibrary.AudioInput,                //Classe à utiliser
      driver: driversLibrary.AudioInputDriver_codecpro, //Driver à utiliser par le device
      connector: 7,                                     //Connecteur d'entrée du codec
      input: 'microphone',                              //Type d'entrée, microphone, hdmi, ethernet. Ethernet requiert la propriété "channel". (non testé)
      bias: 0,                                          //Biais de niveau audio, peut être positif ou négatif. Utilisé par l'analyze d'entrée audio
      gainLowLimit: 20,                                 //Limite basse du gain de l'entrée
      gainHighLimit: 70,                                //Limite supérieure du gain de l'entrée
      defaultGain: 60,                                  //Gain par défaut au démarrage du système
      gainStep: 1,                                      //Gain ajouté ou retiré de la valeur actuelle lorsque les fonctionas increase() et decrease() sont appelées
      defaultMode: 'on',                                //Mode par défaut lors du démarrage du système
      lowGain: 60,                                      //Gain "bas" (utilisé par les widgets de type "button group")
      mediumGain: 65,                                   //Gain "moyen" (utilisé par les widgets de type "button group")
      highGain: 70,                                     //Gain "haut" (utilisé par les widgets de type "button group")
      boost: 70                                         //Gain "Boost, utilisé par le module "AutoSauce"
    }
```
Cet appareil prends automatiquement en charge certain widgets. Les widgets doivent avoir une identification particulière.
* **audioinput.presenter.sf1:MODE** : Toggle, affiche et configure le mode de l'entrée à "ON" ou "OFF"
* **audioinput.presenter.sf1:LEVEL** : Slider, affiche et configure le gain de l'entrée. Automatiquement scalé entre 0 et 255 -> gainLowLimite et gainHighLimit
* **audioinput.presenter.sf1:LEVELGROUP** : Button group, affiche et configure le gain de l'entrée, en utilisant mute, lowGain, mediumGain, highGain. L'identification des 4 boutons doivent êtres "off, low, medium, high"

### CameraPreset
#### Pour caméra Cisco
```JS
    {
      id: 'campreset.presenter',            //identification unique
      name: 'Présentateur',                 //Nom
      type: DEVICETYPE.CAMERAPRESET,        //Type = 'CAMERAPRESET'
      device: devicesLibrary.CameraPreset,  //Classe à utiliser
      presetType: 'preset',                 //Pour les caméras Cisco, utilisez "preset"
      presetName: 'Présentateur'            //Nom du preset dans le codec
    }
```
#### Pour autres caméras
```JS
    {
      id: 'campreset.presenter',            //identification unique
      name: 'Présentateur',                 //Nom
      type: DEVICETYPE.CAMERAPRESET,        //Type = 'CAMERAPRESET'
      device: devicesLibrary.CameraPreset,  //Classe à utiliser
      presetType: 'source',                 //Pour les caméras non-cisco, utilisez "source"
      presetSource: 1                       //Connecteur HDMI
    }
```

### Light (Zone d'éclairage, luminaire)
```JS
    {
      id: 'light.presenter',                      //Identification unique
      name: 'ZONE1',                              //Nom, utilisé par le driver pour la communication
      type: DEVICETYPE.LIGHT,                     //Type = 'LIGHT'
      device: devicesLibrary.Light,               //Classe à utiliser
      driver: driversLibrary.LightDriver_isc_h21, //Driver utilisé par la classe
      sliderEvent: 'changed',                     //<changed, released> Événement à utiliser pour le changement du widget "slider". l'événement "changed" s'execute quand on glisse le widget (peut être demandant pour certain systèmes), "released" s'execute lorsqu'on lève le doigt
      supportsPower: false,                       //Défini si l'éclairage supporte les commandes d'alimentation. Si false, une lumière éteinte est dim à 0
      supportsDim: true,                          //Défini si l'éclairage supporte les commandes de tamisage
      defaultPower: 'on',                         //Défini l'état d'alimentation par défaut au démarrage du système
      defaultDim: 100                             //Défini le tamisage par défaut au démarrage du système
    }
```

Cet appareil prends automatiquement en charge certain widgets. Les widgets doivent avoir une identification particulière.
* **light.presenter:LEVEL** : Slider, affiche et configure le niveau de tamisage de l'éclairage
* **light.presenter:POWER** : Toggle, affiche et configure l'alimentation de l'éclairage
* **light.presenter:POWERON** : Bouton, allume l'éclairage
* **light.presenter:POWEROFF** : Bouton, éteint l'éclairage

### LightScene (Scène d'éclairage)
#### Qui contrôle les devices de type "Light"
```JS
    {
      id: 'lightscene.100%',                          //Identification unique
      name: 'STANDBY',                                //Nom
      type: DEVICETYPE.LIGHTSCENE,                    //Type = 'LIGHTSCENE'
      device: devicesLibrary.LightScene,              //Classe à utiliser
      driver: driversLibrary.LightSceneDriver_lights, //Driver utilisé par la classe. Ce driver contrôle des drivers de type "Light"
      lights: [                                       //Array contenant les "Light" à contrôler et leur paramètres
        {
          id: 'light.presenter',                      //"id" du device de type "Light"
          power: 'on',                                //Statut d'alimentation
          dim: 100                                    //Statut de tamisage
        },
        {
          id: 'light.board',
          power: 'on',
          dim: 100                                    
        },
        {
          id: 'light.audience',
          power: 'on',
          dim: 100
        }
      ]
    }
```
#### Qui appelle une scène d'éclairage externe. Par exemple, dans un panneau d'éclairage, crestron, etc...
```JS
    {
      id:'lightscene.100%',                         //Identification unique
      name:'LIGHTSCENE_100',                        //Nom de la scène d'éclairage à activer (dans le système d'éclairage)
      type: DEVICETYPE.LIGHTSCENE,                  //Type = 'LIGHTSCENE'
      device: devicesLibrary.LightScene,            //Driver à utiliser
      driver: driversLibrary.LightSceneDriver_isc,  //Driver utilisé par la classe
    }
```
#### En utilisant un contrôleur de relais réseau Global Caché iTach Flex
```JS
    {
      id: 'lightscene.100%',                          //Identification unique
      name: 'lightscene.100%',                                //Nom
      type: DEVICETYPE.LIGHTSCENE,                    //Type = 'LIGHTSCENE'
      device: devicesLibrary.LightScene,              //Classe à utiliser
      driver: driversLibrary.LightSceneDriver_gc_itachflex, //Driver utilisé par la classe. Ce driver contrôle un appareil "Global Caché iTach Flex"
      host: '169.254.1.30', //Host ou IP de l'appareil. Ici, l'appareil est connecté directement au codec
      relay: 1, //Numéro du relais (1 à 4)
      pulseLength: 500 //Temps de fermeture du relais en ms (1000 par défaut si cette valeur est omise)
    }
```
Cet appareil prends automatiquement en charge certain widgets. Les widgets doivent avoir une identification particulière.
* **lightscene.100%:ACTIVATE** : Bouton, active la scène d'éclairage
Cet appareil prends automatiquement en charge certaines actions.
* **LIGHTSCENE:lightscene.100%**

### Caméra
```JS
    {
      id: 'camera.presenter',         //Identification unique
      type: DEVICETYPE.CAMERA,        //Type = 'CAMERA'
      name: 'Caméra (enseignant)',    //Nom
      device: devicesLibrary.Camera,  //Classe à utiliser
      peripheralRequired: true,       //Périphérique requis
      peripheralId: 'FDO2515J291',    //Numéro de série de la caméra
      connector: 1                    //Connecteur d'entrée sur le codec
    }
```

### AudioInputGroup (Groupe d'entrée audio, tel qu'affiché dans AudioConsole)
```JS
    {
      id: 'aig.presentationsources',          //Identification unique
      name: 'PC',                             //Nom du groupe dans "AudioConsole"
      type: DEVICETYPE.AUDIOINPUTGROUP,       //Type = 'AUDIOINPUTGROUP'
      device: devicesLibrary.AudioInputGroup, //Classe à utiliser
      extraGain: 10                           //Gain quand le mode "Extra" connecte ce group d'entrée à un groupe de sortie
    }
```

### AudioOutputGroup (Groupe de sortie audio, tel qu'affiché dans AudioConsole)
```JS
    {
      id: 'aog.room',                         //Identification unique
      name: 'Room',                           //Nom du groupe dans "AudioConsole"
      type: DEVICETYPE.AUDIOOUTPUTGROUP,      //Type = 'AUDIOOUTPUTGROUP'
      device: devicesLibrary.AudioOutputGroup //Classe à utiliser
    }
```
### AudioReporter (Rapporteur de niveau sonore)
```JS
    {
      id: 'system.audioreporter.main',                      //Identification unique
      type: DEVICETYPE.AUDIOREPORTER,                       //Type = 'AUDIOREPORTER'
      name: 'Internal VuMeter',                             //Nom
      device: devicesLibrary.AudioReporter,                 //Classe à utiliser
      driver: driversLibrary.AudioReporterDriver_internal,  //Driver utilisé par la classe (VuMeter interne)
      inputs: [1, 2, 3, 7, 8],                              //Entrées audio à observer
      sampleMs: 100,                                        //Temps (ms) entre chaque observation
      start: true                                           //Démarrage de l'observation
    }
```

### Software Device
```JS
    {
      id: 'infrastructure.webex',                               //Identification unique
      type: DEVICETYPE.SOFTWAREDEVICE,                          //Type = 'SOFTWAREDEVICE'
      device: devicesLibrary.SoftwareDevice,                    //Classe à utiliser
      name: 'Webex Infrastructure',                             //Nom
      peripheralRequired: true,                                 //Périphérique requis
      peripheralId: 'https://idbroker.webex.com/idb/oauth2/',   //Adresse HTTP de vérification
      peripheralCheckMethod: 'httprequest',                     //Méthode de vérification
      peripheralCheckStatusCode: 404                            //Code HTTP qui constitue un succès
    }
```

## Groupes
### Définition, exemple
Les groupes sont des objet qui permettent de regrouper les appareils (devices) ensemble. Chaque groupe possède une identification unique `id` et peut contenir un ou plusieurs appareils (device) du même type ou de type différent, dans un array nommé `devices`, contenant le `id` de chaque appareil.

Les groupes sont utilisés par les scénarios pour déterminer quels appareils contrôler. Ceci procure une couche d'abstraction entre les appareils et le scénario actif.

Par exemple, dans le cas d'une salle de cours qui pourrait avoir un ou deux projecteurs de présentation, le scénario doit uniquement contrôler les appareils du groupe d'appareils de présentation, peu importe le nombre d'appareils.

Le groupe d'écran de présentation pourrait être défini comme suit pour une salle à un seul affichage:
```JS
{
  id: 'system.presentation.main',
  devices: [
    'projector',
}
```
Le groupe d'écran de présentation pourrait être défini comme suit pour une salle à deux affichages:
```JS
{
  id: 'system.presentation.main',
  devices: [
    'projector.left',
    'projector.right'
}
```

### Noms de groupes
Certains noms de groupe sont "par défaut". Ces groupes sont recommandés pour unifier certains aspects des salles, et les scénarios devraient autant que possible utiliser les groupes par défaut. Les noms de ces groupes commencent toujours par "system"

#### Groupe "system.presentation.main"
Défini le groupe d'appareils de présentation principal.

Le groupe devrait contenir les appareils suivants:
- Les affichages `Display`
- Les toiles motorisées `Screen`
- Les toiles de fenêtre `Shade`
- La caméra à utiliser `Camera`
- Le preset de caméra `CameraPreset`
- La scène d'éclairage `LightScene`
- Le groupe de sortie audio utilisé pour le son de la présentation `AudioOutputGroup`

#### Groupe "system.farend.main"
- Les affichages `Display`
- Les toiles motorisées `Screen`
- La caméra à utiliser `Camera`
- Le preset de caméra `CameraPreset`
- La scène d'éclairage `LightScene`
- Le groupe de sortie audio utilisé pour le son des sites distants `AudioOutputGroup`

#### Groupe "system.byod.main"
- Les affichages `Display`

#### Groupe "system.audio.allmics"
- Tous les microphones `AudioInput`

#### Groupe "system.audio.presentermics"
- Tous les microphones des présentateurs `AudioInput`

#### Groupe "system.audio.audiencemics"
- Tous les microphones de l'auditoire `AudioInput`

#### Groupe "system.audio.presentationsources"
- Groupes d'entrées audio des sources de présentation `AudioInputGroup`

#### Groupe "system.lightscene.standby"
- Scène d'éclairage en standby `LightScene`

#### Groupe "system.lightscene.idle"
- Scène d'éclairage en mode normal, allumé, sans appel, sans présentation `LightScene`

#### Groupe "system.lightscene.presentation"
- Scène d'éclairage en mode présentation `LightScene`

#### Groupe "system.lightscene.writing
- Scène d'éclairage en mode "Écrire au tableau" `LightScene`

#### Groupe "system.lightscene.emergency"
- Scène d'éclairage en cas d'urgence (feu) `LightScene`

#### Groupe "system.audio.extra.output"
- Groupe de sortie audio supplémentaire quand le volume est au-dessus d'un certain niveau `AudioOutputGroup`

#### Groupe "system.audio.extra.inputs"
- Groupes d'entrées audio à connecter à "system.audio.extra.output" `AudioInputGroup`
