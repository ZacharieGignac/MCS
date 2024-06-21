/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';


export var Manifest = {
  fileName: 'sce_firealarm',
  id: 'firealarm',
  friendlyName: `Alarme d'incendie`,
  version: '1.0.0',
  description: `Comportement en cas d'alarme d'incendie`,
  panels: {
    hide: ['*'],
    show: ['']
  },
  features: {
    cameraControls: false,
    endCallButton: false,
    hdmiPassthrough: false,
    joinGoogleMeet: false,
    joinWebex: false,
    joinZoom: false,
    keypad: false,
    layoutControls: false,
    midCallControls: false,
    musicMode: false,
    participantList: false,
    selfviewControls: false,
    start: false,
    videoMute: false,
    joinMicrosoftTeamsCVI: false
  }
};

export class Scenario {
  constructor() {
    this.alertMessage = undefined;
    xapi.Status.RoomAnalytics.T3Alarm.Detected.on(value => {
      console.log(`Current T3 value is: ${value}`);
      if (value == 'True') {
        console.warn('🔥🚨 WARNING: FIRE ALARM DETECTED 🚨🔥');
        if (!this.enabled) {
          zapi.scenarios.enableScenario('firealarm');
        }
      }
      else {
        if (this.enabled) {
          zapi.scenarios.enablePreviousScenario();
        }
      }
    });
  }

  test() {
    console.log('test from SCE_FireAlarm');
  }

  enable() {
    return new Promise(success => {
      success(true);
    });
  }

  disable() {
    clearInterval(this.alertMessage);
    xapi.Command.UserInterface.Message.Prompt.Clear();
    xapi.Command.UserInterface.WebView.Clear();
    return new Promise(success => {
      success(true);
    });
  }

  start() {
    this.alertMessage = setInterval(() => {
      xapi.Command.UserInterface.Message.Prompt.Display({
        Title: `🚨🔥 ALARME D'INCENDIE 🔥🚨`,
        Text: 'DIRIGEZ-VOUS VERS LA SORTIE LA PLUS PROCHE<br>RENDEZ-VOUS AU POINT DE RASSEMBLEMENT'
      });
    }, 1000);
    xapi.Command.UserInterface.WebView.Display({
      Mode: 'Fullscreen',
      Target: 'OSD',
      Title: 'ALARME INCENDIE',
      Url: 'https://www.nfpa.org/-/media/Images/Blog-Images/Blog-Post-Attachments/NFPA-Today/EvacuationBlog_web.ashx?h=400&w=800&la=en&hash=C8C18868074E7BA20202DEBD170D2737'
    });
  }
}