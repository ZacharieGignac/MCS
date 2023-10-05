import xapi from 'xapi';
import { zapiv1 } from './zapi';


var zapi = zapiv1;

const DEVICETYPE = zapi.devices.DEVICETYPE;

export var Manifest = {
  fileName: 'sce_como_type1',
  id: 'comotype1',
  friendlyName: 'Salle Comodale (Type 1)',
  version: '0.0.1',
  description: 'Comportement normal pour une salle comodale de type 1',
  panels: {
    hide: ['*'],
    show: ['comotype1_settings']
  },
  features: {
    shareStart: true,
    cameraControls: true,
    endCallButton: true,
    hdmiPassthrough: true,
    joinGoogleMeet: false,
    joinWebex: true,
    joinZoom: true,
    joinMicrosoftTeamsCVI: true,
    keypad: true,
    layoutControls: true,
    midCallControls: true,
    musicMode: false,
    participantList: true,
    selfviewControls: true,
    start: true,
    videoMute: true
  },
};

export class Scenario {
  constructor() {
    this.devices = {};

    zapi.system.onStatusChange(status => {

    });
    zapi.system.onStatusKeyChange('call', call => {

    });

  }

  enable() {
    return new Promise(async success => {

      
      /* getting devices from config */
      //Displays
      this.devices.displays = {};   
      this.devices.displays.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.main');
      this.devices.displays.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.farend.main');
      this.devices.displays.byod = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.byod.main');

      //Screens
      this.devices.screens = {};
      this.devices.screens.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.main');
      this.devices.screens.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.farend.main');

      //Lightscenes
      this.devices.lightscenes = {};
      this.devices.lightscenes.idle = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.idle');
      this.devices.lightscenes.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.presentation.main');

      //AudioOutputGroups
      this.devices.audiooutputgroups = {};
      this.devices.audiooutputgroups.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOOUTPUTGROUP, 'system.presentation.main');
      this.devices.audiooutputgroups.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOOUTPUTGROUP, 'system.farend.main');

      //AudioInputs
      this.devices.audioinputs = {};
      this.devices.audioinputs.presentermics = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOINPUT, 'system.audio.presentermics');
      this.devices.audioinputs.audiencemics = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOINPUT, 'system.audio.audiencemics');
      

      success(true);
    });


  }

  disable() {
    return new Promise(async success => {
      success(true);
    });
  }

  start() {
    



    /* Setting video outputs */
    xapi.Config.Video.Monitors.set('DualPresentationOnly');


    if (zapi.system.getStatus('AutoLights') == 'on') {
        for (let lightscene of this.devices.lightscenes.idle) {
            lightscene.activate();
        }
    }
  }

  test() {
    console.log('test from SCE_Normal');
  }
};