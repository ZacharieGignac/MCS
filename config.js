import xapi from 'xapi';

/*****************************/
//Import scenarios here with syntax: import * as SCE_Name from './SCE_Name';
import * as sce_standby from './sce_standby';
import * as sce_como_type1 from './sce_como_type1';
import * as sce_firealarm from './sce_firealarm';
import * as sce_normal_nocall from './sce_normal_nocall';
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
  VIDEOOUTPUT: 'VIDEOOUTPUT',
  AUDIOINPUT: 'AUDIOINPUT',
  AUDIOOUTPUT: 'AUDIOOUTPUT',
  SCREEN: 'SCREEN',
  LIGHT: 'LIGHT',
  LIGHTSCENEMGR: 'LIGHTSCENEMGR',
  SHADE: 'SHADE',
  CAMERA: 'CAMERA',
  AUDIOSTAT: 'AUDIOSTAT',
  HID: 'HID',
  VIRTUAL: 'VIRTUAL',
  TERMINALEMULATION: 'TERMINALEMULATION',
  CUSTOM: 'CUSTOM'
}


export var config = {
  version: '0.0.1',
  system: {
    coldBootWait: 120,
    debugLevel: DEBUGLEVEL.HIGH,
    debugInternalMessages: false,
    initDelay: 1000,
    forceSleepEnabled: true,
    forceSleepTime: '2:00',
    requiredPeripheralsCheckInterval: 5000,
    onStandby: {
      setDND: true,
      resetPresenterLocation: true,
      resetAudioLevels: true,
      clearCallLogs: true,
      enableScenario: 'standby'
    },
    onWakeup: {
      enableScenario: 'como_type1'
    }
  },

  strings: {
    systemStart: 'Démarrage du système',
    newSessionTitle: `Préparation de votre session`,
    endSessionTitle: 'Fin de la session',
    endSessionText: 'À la prochaine!',
    deviceMonitoringWaitForDevicesTitle: 'Périphériques',
    deviceMonitoringWaitForDevicesText: 'En attente des périphériques: %DEVICES%'
  },

  scenarios: [
    sce_standby,
    sce_como_type1,
    sce_firealarm,
    sce_normal_nocall
  ],

  modules: [
    telemetry
  ],


  devices: [
    //Types: DISPLAY, SCREEN, CONTROLSYSTEM, LIGHT, LIGHTSCENE, VIDEOOUTPUT
    {
      id:'controlsystem',
      type:DEVICETYPE.CONTROLSYSTEM,
      name:'RaspberryPi / Crestron',
      device:devicesLibrary.ControlSystem,
      peripheralRequired:true,
      peripheralId:'FOC2447N5FW'
    },
    {
      id: 'display.presentation.main',
      type: DEVICETYPE.DISPLAY,
      name: 'PROJ',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      connector: 1,
      supportsPower: true,
      supportsBlanking: true,
      supportsSource: false,
      supportsUsageHours: true,
      defaultPower: false,
      blankBeforePowerOff: true,
      powerOffDelay: 60000,
      usageHoursRequestInterval: 100000,
    },
    {
      id: 'screen.presentation.main',
      type: DEVICETYPE.SCREEN,
      name: 'SCREEN',
      device: devicesLibrary.Screen,
      driver: driversLibrary.ScreenDriver_isc_h21,
      defaultPosition: false,
    },
    {
      id:'audioinput.presenter.mic1',
      type:DEVICETYPE.AUDIOINPUT,
      name:'Micro présentateur 1',
      device: devicesLibrary.AudioInput,
      driver: driversLibrary.AudioInput_internal,
      connector:1,
      gainLowLimit:0,
      gainHighLimit:70,
      defaultGain:50,      
      gainStep:1,
      defaultMute:false
    }


    /*
    {
      id: 'display.usbmode',
      type: DEVICETYPE.DISPLAY,
      name: 'INOGENI',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      connector: 2,
      supportsPower: false,
      supportsBlanking: false,
      supportsSource: false,
      supportsUsageHours: false,
      defaultPower: false,
      defaultBlanking: false,
    },
    {
      id: 'display.farend',
      type: DEVICETYPE.DISPLAY,
      name: 'TV',
      device: devicesLibrary.Display,
      driver: driversLibrary.DisplayDriver_isc_h21,
      connector: 3,
      supportsPower: true,
      supportsBlanking: false,
      supportsSource: false,
      supportsUsageHours: false,
      defaultPower: false,
      defaultBlanking: false,
    },
    {
      id:'VirtualDevice',
      type:DEVICETYPE.VIRTUAL,
      name:'Système de contrôle (RaspberryPI)',
      device: devicesLibrary.Virtual,
      peripheralRequired: false,
      peripheralId: 'test'

    },
    {
      id: 'default.presentation.output',
      type: DEVICETYPE.VIDEOOUTPUT,
      name: 'default.presentation.output',
      //device: devicesLibrary.VideoOutput,
      connector: 1
    },

    {
      id: 'light.presenter.desk',
      type: DEVICETYPE.LIGHT,
      name: 'Éclairage présentateur',
      //device: devices.Light,
      //driver: deviceDrivers.LightDriver_messages,
      supportsOnOff: true,
      supportsDim: true,
      rangeLow: 0,
      rangeHigh: 100
    },

    {
      id: 'lightscenes',
      type: DEVICETYPE.LIGHTSCENEMGR,
      name: 'CRESTRON_MANAGED_LIGHTSCENES',
      //device: devices.LightScene,
      //driver: deviceDrivers.LightSceneDriver_messages,
      pattern: 'LS_EXEC_%LIGHTSCENE%'
    },
    {
      id: 'camera.teacher',
      type: DEVICETYPE.CAMERA,
      name: 'Caméra Prof',
      //device: devicesLibrary.Camera,
      peripheralRequired: false,
      peripheralId: '6C:13:D5:2E:51:FA'
    },
    {
      id: 'camera.room',
      type: DEVICETYPE.CAMERA,
      name: 'Caméra Salle',
      //device: devicesLibrary.Camera,
      peripheralRequired: false,
      peripheralId: '6C:13:D5:2E:51:FF'
    },
    {
      id: 'controlsystem',
      type: DEVICETYPE.CONTROLSYSTEM,
      name: 'Système de contrôle',
      peripheralRequired: false,
      peripheralId: 'abc'
    },
    {
      id: 'teacher.sf.1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'Microphone sans-fil 1',
      //device: devices.AudioInput,
      //driver: devicesDrivers.AudioInputInternal,
      gainLow: 40,
      gainHigh: 61,
      gainDefault: 50,
      muteDefault: false
    },
    {
      id: 'audience.ceilingmic.1',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'ceiling 1',
      //device: devices.AudioInput,
      //driver: devicesDrivers.AudioInputInternal,
      input:1,
      gainLow: 51,
      gainHigh: 51,
      gainDefault: 51,
      muteDefault: false
    },
    {
      id: 'audience.ceilingmic.2',
      type: DEVICETYPE.AUDIOINPUT,
      name: 'ceiling 2',
      //device: devices.AudioInput,
      //driver: devicesDrivers.AudioInputInternal,
      input:2,
      gainLow: 51,
      gainHigh: 51,
      gainDefault: 51,
      muteDefault: false
    }
    */

  ],


  normal_config: {
    mysetting:true
  },

  firealarm_config: {
    forceSystemShutdown: false,
    lockTouchpanel: true,
    displayWebpage: true,
    webpageUrl: `http://youtube....`,
    displayFarendMessaeg: true
  },


  lightScenes: [
    {
      id: 'emergency',
      lights: [
        {
          id: 'light.presenter.desk',
          power: true,
          dim: 100
        },
        {
          id: 'light.room',
          power: true,
          dim: 100
        },
        {
          id: 'lightscene.emergency',
        }
      ]
    },
    {
      id: 'presentation',
      lights: [
        {
          id: 'lightscene.presentation',
        }
      ]
    },
    {
      id: 'alloff',
      lights: [
        {
          id: 'lightscene.alloff',
        }
      ]
    }
  ],



  groups: [
    {
      id: 'presentation.main',
      devices: ['display.presentation', 'display.farend', 'screen.presentation', 'camera.teacher', 'teacher.sf.1']
    },
    {
      id: 'audienceMics',
      devices: ['audience.ceilingmic.1', 'audience.ceilingmic.2']
    }
  ],

  defaultSystemStatus: {
    SS$PresenterLocation: 'local', //Needed for core
    SS$PresenterTrackWarnings: 'on', //Needed for core
    SS$AutoDisplays:true,
    SS$AutoScreens:true,
    
  },

};





