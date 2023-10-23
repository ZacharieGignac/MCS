import xapi from 'xapi';

/*****************************/
//Import scenarios here with syntax: import * as SCE_Name from './SCE_Name';
import * as sce_standby from './sce_standby';
import * as sce_como_type1 from './sce_como_type1';
import * as sce_firealarm from './sce_firealarm';
//Add scenarios to config.scenarios below.
/****************************/




/****************************/
//Import modules below
import * as mod_autosauce from './mod_autosauce';
import * as mod_hidcameraman from './mod_hidcameraman';
/****************************/



/****************************/
//Import drivers or drivers libraries below
import * as devicesLibrary from './devicesLibrary';
import * as driversLibrary from './driversLibrary';
/****************************/






const DEBUGLEVEL = {
  LOW: 3,
  MEDIUM: 2,
  HIGH: 1,
  NONE: 0
}

const DEVICETYPE = {
  CONTROLSYSTEM: 'CONTROLSYSTEM',
  DISPLAY: 'DISPLAY',
  CAMERAPRESET: 'CAMERAPRESET',
  VIDEOOUTPUT: 'VIDEOOUTPUT',
  AUDIOINPUT: 'AUDIOINPUT',
  AUDIOOUTPUT: 'AUDIOOUTPUT',
  AUDIOINPUTGROUP: 'AUDIOINPUTGROUP',
  AUDIOOUTPUTGROUP: 'AUDIOOUTPUTGROUP',
  AUDIOREPORTER: 'AUDIOREPORTER',
  SCREEN: 'SCREEN',
  LIGHT: 'LIGHT',
  LIGHTSCENE: 'LIGHTSCENE',
  SHADE: 'SHADE',
  CAMERA: 'CAMERA',
  SOFTWAREDEVICE: 'SOFTWAREDEVICE'
}


export const PRODUCT = 'PrepOS (dev)';
export const VERSION = '0.0.1';

export var config = {
  scenarios: [
    sce_standby,
    sce_como_type1,
    sce_firealarm,
  ],

  modules: [
    mod_autosauce,
    mod_hidcameraman
  ],


  firealarm_config: {
    forceSystemShutdown: false,
    lockTouchpanel: true,
    displayWebpage: true,
    webpageUrl: `http://youtube....`,
    displayFarendMessaeg: true
  },

  mod_autosauce_config: {
    boosts: [
      {
        silent: 'system.audio.presentermics',
        boost: 'system.audio.audiencemics',
        audioReporter: 'system.audioreporter.main',
        diffLevel: 10,
        silentElapsed: 300
      }
    ]
  },

  mod_hidcameraman_config: {
    setup: false,
    keys: [
      {
        key: 'KEY_F5',
        type: 'Pressed',
        action: 'presentertrack_toggle' //presentertrack_toggle, presentertrack_enable, presentertrack_disable, callpreset

      },
      {
        key: 'KEY_PAGEDOWN',
        type: 'Pressed',
        action: 'callpreset',
        preset: 'Auditoire'
      },
      {
        key: 'KEY_PAGEUP',
        type: 'Pressed',
        action: 'callpreset',
        preset: 'Présentateur'
      },
      {
        key: 'KEY_B',
        type: 'Pressed',
        action: 'callpreset',
        preset: 'Tableau'
      },
    ]
  },


  version: VERSION,
  system: {
    coldBootWait: 120,                            // Temps (secondes) qui détermine un "cold boot"
    debugLevel: DEBUGLEVEL.HIGH,                // Niveau de débug (LOW, MEDIUM, HIGH)
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
    systemReportApiKey: 'apq9apYKMbgagowb9yo0qPIq6zdLEMYhQM21f9ocP',                    // Clé d'api de "paste.ee" utilisé pour l'envoi de rapport système
    onStandby: {
      setDND: false,                              // <true, false> Détermine si le mode "ne pas déranger" est activé lors du standby
      clearCallHistory: false,                    // <true, false> Détermine si l'historique d'appel est supprimé lors du standby
      enableScenario: 'standby'                   // Scénario à activer lors du standby. Le système est livré avec un scénario conseillé nommé "standby", fichier "sce_standby"
    },
    onWakeup: {
      enableScenario: 'comotype1'                 // Scénario à activer lors de la sortie du standby (wakeup).
    }
  },
  audio: {
    extra: {
      enabled: true,
      outputGroup: 'system.audio.extra.output',
      inputGroup: 'system.audio.extra.inputs',
      setGainZero: ['system.audio.presentermics'], //Utilisez ceci pour mettre le gain à OFF des microphones dans chacun de ces groupes.
      setStatusOff: ['AudienceMics'], //Utilisez ceci pour mettre un status à 'off', comme "AudienceMics"
      overVolume: 75
    }
  },
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


  devices: [
    {
      id: 'system.audioreporter.main',
      type: DEVICETYPE.AUDIOREPORTER,
      name: 'Internal VuMeter',
      device: devicesLibrary.AudioReporter,
      driver: driversLibrary.AudioReporterDriver_internal,
      inputs: [1, 2, 3, 7, 8],
      sampleMs: 100,
      start: true
    },

    /* CONTROL SYSTEM */
    {
      id: 'controlsystem',
      type: DEVICETYPE.CONTROLSYSTEM,
      name: 'CTRLSYS',
      device: devicesLibrary.ControlSystem,
      driver: driversLibrary.ControlSystemDriver_isc_h21,
      syncRestart: true,
      restartString: 'HW_RESTART',
      peripheralRequired: true,
      peripheralId: 'FOC2447N5FW',
      heartbeatInterval: 5000
    },


    /* DISPLAYS */
    {
      id: 'display.projector',
      type: DEVICETYPE.DISPLAY,
      name: 'PROJ',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      connector: 1,
      supportsPower: true,
      supportsBlanking: false,
      supportsSource: false,
      supportsUsageHours: false,
      defaultPower: 'off',
      defaultBlanking: false,
      blankBeforePowerOff: true,
      powerOffDelay: 6000,
      usageHoursRequestInterval: 100000,
    },
    {
      id: 'display.projector.secondary',
      type: DEVICETYPE.DISPLAY,
      name: 'PROJ2',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      //alwaysUse: true,
      connector: 1,
      supportsPower: true,
      supportsBlanking: true,
      supportsSource: false,
      supportsUsageHours: false,
      defaultPower: 'off',
      defaultBlanking: false,
      blankBeforePowerOff: true,
      powerOffDelay: 6000,
      usageHoursRequestInterval: 100000,
    },
    {
      id: 'display.monitor',
      type: DEVICETYPE.DISPLAY,
      name: 'TV',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      connector: 3,
      supportsPower: true,
      supportsBlanking: false,
      supportsSource: false,
      supportsUsageHours: false,
      defaultPower: 'off',
      blankBeforePowerOff: false,
      powerOffDelay: 0,
    },
    {
      id: 'display.byod',
      type: DEVICETYPE.DISPLAY,
      name: 'BYOD',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      connector: 2,
      supportsPower: false,
      supportsBlanking: false,
      supportsSource: false,
      supportsUsageHours: false,
      defaultPower: 'on',
      blankBeforePowerOff: false,
      powerOffDelay: 0,
    },


    /* MOTORIZED SCREENS */
    {
      id: 'screen',
      type: DEVICETYPE.SCREEN,
      name: 'SCREEN',
      device: devicesLibrary.Screen,
      driver: driversLibrary.ScreenDriver_isc_h21,
      defaultPosition: 'up'
    },
    {
      id: 'screen.secondary',
      type: DEVICETYPE.SCREEN,
      name: 'SCREEN2',
      device: devicesLibrary.Screen,
      driver: driversLibrary.ScreenDriver_gpio,
      //alwaysUse: true,
      //pin:1,
      pin1: 1,
      pin2: 2,
      defaultPosition: 'up'
    },

    /* Shades */
    {
      id: 'shades',
      type: DEVICETYPE.SHADE,
      name: 'SHADES-EAST',
      device: devicesLibrary.Shade,
      driver: driversLibrary.ShadeDriver_basic_isc,
      defaultPosition: 'up'
    },


    /* AUDIO INPUTS */
    {
      id: 'audioinput.presenter.sf1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro sans-fil',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInputDriver_codecpro,
      connector: 7,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      bias: 0,
      gainLowLimit: 20,
      gainHighLimit: 70,
      defaultGain: 60,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 60,
      mediumGain: 65,
      highGain: 70,
      boost: 70
    },
    {
      id: 'audioinput.presenter.bat1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro bâton',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInputDriver_codecpro,
      connector: 8,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      bias: 0,
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 20,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 50,
      highGain: 60,
      boost: 70
    },
    {
      id: 'audioinput.ceilingmic.1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro plafond 1',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInputDriver_codecpro,
      connector: 1,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 40,
      highGain: 60,
      boost: 70
    },
    {
      id: 'audioinput.ceilingmic.2',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro plafond 2',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInputDriver_codecpro,
      connector: 2,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 40,
      highGain: 60,
      boost: 70
    },
    {
      id: 'audioinput.ceilingmic.3',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro plafond 3',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInputDriver_codecpro,
      connector: 3,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 40,
      highGain: 60,
      boost: 70
    },




    /* CAMERA PRESETS */
    {
      id: 'campreset.presenter',
      name: 'Présentateur',
      type: DEVICETYPE.CAMERAPRESET,
      device: devicesLibrary.CameraPreset,
      presetName: 'Présentateur'
    },
    {
      id: 'campreset.board',
      name: 'Preset Tableau',
      type: DEVICETYPE.CAMERAPRESET,
      device: devicesLibrary.CameraPreset,
      presetName: 'Tableau'
    },
    {
      id: 'campreset.audience',
      name: 'Preset Tableau',
      type: DEVICETYPE.CAMERAPRESET,
      device: devicesLibrary.CameraPreset,
      presetName: 'Auditoire'
    },


    /* LIGHTS */
    {
      id: 'light.presenter',
      name: 'ZONE1',
      type: DEVICETYPE.LIGHT,
      device: devicesLibrary.Light,
      driver: driversLibrary.LightDriver_isc_h21,
      sliderEvent: 'changed', //released, changed
      supportsPower: false,
      supportsDim: true,
      defaultPower: 'on',
      defaultDim: 100
    },
    {
      id: 'light.board',
      name: 'ZONE2',
      type: DEVICETYPE.LIGHT,
      device: devicesLibrary.Light,
      driver: driversLibrary.LightDriver_isc_h21,
      sliderEvent: 'changed', //released, changed
      supportsPower: true,
      supportsDim: true,
      defaultPower: 'on',
      defaultDim: 100
    },
    {
      id: 'light.audience',
      name: 'ZONE3',
      type: DEVICETYPE.LIGHT,
      device: devicesLibrary.Light,
      driver: driversLibrary.LightDriver_isc_h21,
      sliderEvent: 'changed', //released, changed
      supportsPower: true,
      supportsDim: true,
      defaultPower: 'on',
      defaultDim: 100
    },


    /* LIGHTSCENES */
    {
      id: 'lightscene.100%',
      name: 'STANDBY',
      type: DEVICETYPE.LIGHTSCENE,
      device: devicesLibrary.LightScene,
      driver: driversLibrary.LightSceneDriver_lights,
      lights: [
        {
          id: 'light.presenter',
          power: 'on',
          dim: 100
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
    },
    {
      id: 'lightscene.50%',
      name: 'IDLE',
      type: DEVICETYPE.LIGHTSCENE,
      device: devicesLibrary.LightScene,
      driver: driversLibrary.LightSceneDriver_lights,
      lights: [
        {
          id: 'light.presenter',
          dim: 50
        },
        {
          id: 'light.board',
          power: 'on',
          dim: 50
        },
        {
          id: 'light.audience',
          power: 'on',
          dim: 50
        }
      ]
    },
    {
      id: 'lightscene.75%',
      name: 'IDLE',
      type: DEVICETYPE.LIGHTSCENE,
      device: devicesLibrary.LightScene,
      driver: driversLibrary.LightSceneDriver_lights,
      lights: [
        {
          id: 'light.presenter',
          dim: 75
        },
        {
          id: 'light.board',
          power: 'on',
          dim: 75
        },
        {
          id: 'light.audience',
          power: 'on',
          dim: 75
        }
      ]
    },
    {
      id: 'lightscene.presentation',
      name: 'IDLE',
      type: DEVICETYPE.LIGHTSCENE,
      device: devicesLibrary.LightScene,
      driver: driversLibrary.LightSceneDriver_lights,
      lights: [
        {
          id: 'light.presenter',
          power: 'on',
          dim: 70
        },
        {
          id: 'light.board',
          power: 'on',
          dim: 0
        },
        {
          id: 'light.audience',
          power: 'on',
          dim: 100
        }
      ]
    },


    /* CAMERAS */
    {
      id: 'camera.presenter',
      type: DEVICETYPE.CAMERA,
      name: 'Caméra (enseignant)',
      device: devicesLibrary.Camera,
      peripheralRequired: true,
      peripheralId: 'FDO2515J291',
      connector: 1

    },
    {
      id: 'camera.audience',
      type: DEVICETYPE.CAMERA,
      name: 'Caméra (auditoire)',
      device: devicesLibrary.Camera,
      peripheralRequired: true,
      peripheralId: '88:C9:E8:D1:67:95',
      connector: 3
    },


    /* AUDIO INPUT GROUPS */
    {
      id: 'aig.presentationsources',
      name: 'PC',
      type: DEVICETYPE.AUDIOINPUTGROUP,
      device: devicesLibrary.AudioInputGroup,
      extraGain: 10 //Needed for "Extra"
    },
    {
      id: 'aig.microphones.all',
      name: 'Microphone',
      type: DEVICETYPE.AUDIOINPUTGROUP,
      device: devicesLibrary.AudioInputGroup
    },
    {
      id: 'aig.reinforcement',
      name: 'Reinforcement',
      type: DEVICETYPE.AUDIOINPUTGROUP,
      device: devicesLibrary.AudioInputGroup,
      extraGain: 15 //Needed for "Extra"
    },


    /* AUDIO OUTPUT GROUPS */
    {
      id: 'aog.room',
      name: 'Room',
      type: DEVICETYPE.AUDIOOUTPUTGROUP,
      device: devicesLibrary.AudioOutputGroup
    },
    {
      id: 'aog.monitor',
      name: 'Monitor',
      type: DEVICETYPE.AUDIOOUTPUTGROUP,
      device: devicesLibrary.AudioOutputGroup
    },
    {
      id: 'aog.extra',
      name: 'RoomExtra',
      type: DEVICETYPE.AUDIOOUTPUTGROUP,
      device: devicesLibrary.AudioOutputGroup
    }

  ],




  groups: [
    //Default general groups
    {
      id: 'system.presentation.main',
      devices: ['display.projector', 'screen', 'display.projector.secondary', 'screen.secondary', 'campreset.presenter', 'lightscene.presentation', 'camera.presenter', 'aog.room']
    },

    {
      id: 'system.farend.main',
      devices: ['display.monitor', 'campreset.audience', 'camera.audience', 'aog.monitor']
    },
    {
      id: 'system.byod.main',
      devices: ['display.byod']
    },

    //Audio input configuration
    {
      id: 'system.audio.allmics',
      devices: ['audioinput.presenter.sf1', 'audioinput.presenter.bat1', 'audioinput.ceilingmic.1', 'audioinput.ceilingmic.2', 'audioinput.ceilingmic.3']
    },
    {
      id: 'system.audio.presentermics',
      devices: ['audioinput.presenter.sf1', 'audioinput.presenter.bat1']
    },
    {
      id: 'system.audio.presentationsources',
      devices: ['aig.presentationsources']
    },
    {
      id: 'system.audio.audiencemics',
      devices: ['audioinput.ceilingmic.1', 'audioinput.ceilingmic.2', 'audioinput.ceilingmic.3']
    },

    //Lightscenes groups
    {
      id: 'system.lightscene.standby',
      devices: ['lightscene.100%']
    },
    {
      id: 'system.lightscene.idle',
      devices: ['lightscene.100%']
    },
    {
      id: 'system.lightscene.presentation',
      devices: ['lightscene.50%']
    },
    {
      id: 'system.lightscene.writing',
      devices: ['lightscene.75%']
    },

    //Extra groups
    {
      id: 'system.audio.extra.output',
      devices: ['aog.extra']
    },
    {
      id: 'system.audio.extra.inputs',
      devices: ['aig.presentationsources', 'aig.reinforcement']
    },

  ],

  systemStatus: {
    //System status
    Product: PRODUCT,
    Version: VERSION,
    PresenterLocation: 'local', //Mandatory value
    PresenterTrackWarnings: 'on', //Mandatory value
    UsePresenterTrack: 'on', //Mandatory value
    AutoDisplays: 'on', //Mandatory value
    AutoScreens: 'on', //Mandatory value
    AutoLights: 'on', //Mandatory value
    AutoCamPresets: 'on', //Mandatory value
    AutoCamSelection: 'off', //Mandatory value
    AudienceMics: 'on', //Mandatory valuee
    PresenterMics: 'on', //Mandatory value
    PresenterDetected: false, //Mandatory value
    ClearPresentationZone: 'off', //Mandatory value
    AudioExtra: 'normal' //Mandatory value (normal, louder, loudest)

    //Scenario-specific status

  },

};





