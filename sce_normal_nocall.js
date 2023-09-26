import xapi from 'xapi';
import { zapiv1 } from './zapi';


const api = zapiv1;


export var Manifest = {
  fileName: 'sce_normal_nocall',
  id: 'normal_nocall',
  friendlyName: 'Normal, sans appels',
  version: '1.0.0',
  description: 'Comportement normal, mais aucun appels',
  panels: {
    hide: ['*'],
    show: ['normal_settings']
  },
  features: {
    shareStart:true,
    cameraControls: false,
    endCallButton: false,
    hdmiPassthrough: false,
    joinGoogleMeet: false,
    joinWebex: false,
    joinZoom: false,
    joinMicrosoftTeamsCVI: false,
    keypad: false,
    layoutControls: false,
    midCallControls: false,
    musicMode: false,
    participantList: false,
    selfviewControls: false,
    start: false,
    videoMute: false
  },
  devices: [
    'DISPLAY',
    'SCREEN',
    'LIGHTS'
  ],
};

export class Scenario {
  constructor() {
    this.api = api;
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
    console.log('test from sce_normal_nocall');
  }
};