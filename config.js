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
import * as telemetry from './telemetry';
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
  SCREEN: 'SCREEN',
  LIGHT: 'LIGHT',
  LIGHTSCENE: 'LIGHTSCENE',
  SHADE: 'SHADE',
  CAMERA: 'CAMERA',
  AUDIOSTAT: 'AUDIOSTAT',
  HID: 'HID',
  TERMINALEMULATION: 'TERMINALEMULATION',
  VIRTUAL: 'VIRTUAL',
  CUSTOM: 'CUSTOM'
}


export const PRODUCT = 'PrepOS (dev)';
export const VERSION = '0.0.1';

export var config = {
  version: VERSION,
  system: {
    coldBootWait: 120,
    debugLevel: DEBUGLEVEL.HIGH,
    debugInternalMessages: false,
    messagesPacing: 500,
    initDelay: 1000,
    forceSleepEnabled: true,
    forceSleepTime: '2:00',
    requiredPeripheralsCheckInterval: 30000,
    usePresenterTrack: true,
    forcePresenterTrackActivation: true,
    onStandby: {
      setDND: true,
      clearCallHistory: false,
      enableScenario: 'standby'
    },
    onWakeup: {
      enableScenario: 'comotype1'
    }
  },


  strings: {
    systemStart: 'Démarrage du système',
    newSessionTitle: `Préparation de votre session`,
    endSessionTitle: 'Fin de la session',
    endSessionText: 'À la prochaine!',
    deviceMonitoringWaitForDevicesTitle: 'Périphériques',
    deviceMonitoringWaitForDevicesText: 'En attente des périphériques: %DEVICES%',
    presenterTrackLocked: '🟢 Cadrage automatique ACTIVÉ 🟢',
    presenterTrackLost: '🔴 Cadrage automatique DÉSACTIVÉ 🔴.<br>Revenez dans la zone de présentation pour le réactiver.'
  },

  scenarios: [
    sce_standby,
    sce_como_type1,
    sce_firealarm,
  ],

  modules: [
    telemetry
  ],




  devices: [
    /* CONTROL SYSTEM */
    {
      id: 'controlsystem',
      type: DEVICETYPE.CONTROLSYSTEM,
      name: 'RaspberryPi / Crestron',
      device: devicesLibrary.ControlSystem,
      peripheralRequired: true,
      peripheralId: 'FOC2447N5FW'
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
      driver: driversLibrary.ScreenDriver_isc_h21,
      //alwaysUse: true,
      defaultPosition: 'up'
    },


    /* AUDIO INPUTS */
    {
      id: 'audioinput.presenter.sf1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro sans-fil',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInput_codecpro,
      connector: 7,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 50,
      highGain: 60
    },
    {
      id: 'audioinput.presenter.bat1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro bâton',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInput_codecpro,
      connector: 8,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 50,
      highGain: 60
    },
    {
      id: 'audioinput.ceilingmic.1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro plafond 1',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInput_codecpro,
      connector: 8,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 40,
      highGain: 60
    },
    {
      id: 'audioinput.ceilingmic.2',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro plafond 2',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInput_codecpro,
      connector: 8,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 40,
      highGain: 60
    },
    {
      id: 'audioinput.ceilingmic.3',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Micro plafond 3',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInput_codecpro,
      connector: 8,
      input: 'microphone', //microphone, hdmi, ethernet (ethernet require the "channel" property) : Connectors supported by driver AudioInput_codecpro
      gainLowLimit: 0,
      gainHighLimit: 70,
      defaultGain: 50,
      gainStep: 1,
      defaultMode: 'on',
      lowGain: 20,
      mediumGain: 40,
      highGain: 60
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
      driver: driversLibrary.Light_isc_h21,
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
      driver: driversLibrary.Light_isc_h21,
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
      driver: driversLibrary.Light_isc_h21,
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
      type: DEVICETYPE.VIRTUAL,
      name: 'Caméra (enseignant)',
      device: devicesLibrary.Virtual,
      peripheralRequired: true,
      peripheralId: 'FDO2515J291'

    },
    {
      id: 'camera.audience',
      type: DEVICETYPE.VIRTUAL,
      name: 'Caméra (auditoire)',
      device: devicesLibrary.Virtual,
      peripheralRequired: true,
      peripheralId: 'FDO2603J89L'
    },


    /* AUDIO INPUT GROUPS */
    {
      id: 'aig.computers',
      name: 'PC',
      type: DEVICETYPE.AUDIOINPUTGROUP,
      device: devicesLibrary.AudioInputGroup
    },
    {
      id: 'aig.microphones.all',
      name: 'Microphone',
      type: DEVICETYPE.AUDIOINPUTGROUP,
      device: devicesLibrary.AudioInputGroup
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
    }

  ],


  normal_config: {
    mysetting: true
  },

  firealarm_config: {
    forceSystemShutdown: false,
    lockTouchpanel: true,
    displayWebpage: true,
    webpageUrl: `http://youtube....`,
    displayFarendMessaeg: true
  },
  groups: [
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
    {
      id: 'system.audio.allmics',
      devices: ['audioinput.presenter.sf1', 'audioinput.presenter.bat1', 'audioinput.ceilingmic.1', 'audioinput.ceilingmic.2', 'audioinput.ceilingmic.3']
    },
    {
      id: 'system.audio.presentermics',
      devices: ['audioinput.presenter.sf1', 'audioinput.presenter.bat1']
    },
    {
      id: 'system.audio.audiencemics',
      devices: ['audioinput.ceilingmic.1', 'audioinput.ceilingmic.2', 'audioinput.ceilingmic.3']
    },
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
    }

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
    AudienceMics: 'on', //Mandatory valuee
    PresenterMics: 'on', //Mandatory value
    PresenterDetected: false, //Mandatory value
    ClearPresentationZone: 'off',
    ClearPresentationZoneSecondary: 'off'

    //Scenario-specific status

  },

};





