import xapi from 'xapi';
import { zapiv1 } from './zapi';


const api = zapiv1;

const DEVICETYPE = api.devices.DEVICETYPE;

export var Manifest = {
  fileName: 'sce_como_type1',
  id: 'como_type1',
  friendlyName: 'Salle Comodale (Type 1)',
  version: '0.0.1',
  description: 'Comportement normal pour une salle comodale de type 1',
  panels: {
    hide: ['*'],
    show: ['normal_settings']
  },
  features: {
    shareStart:true,
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
    this.api = api;
    this.api.system.onStatusChange(status => {

    });
    this.api.system.onStatusKeyChange('call',call => {

    });

  }
  enable() {
    return new Promise(success => {
      success(true);
    });


  }
  disable() {
    return new Promise(success => {
      success(true);
    });
  }
  start() {
    
  }
  test() {
    console.log('test from SCE_Normal');
  }
};