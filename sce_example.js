import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';


export var Manifest = {
  fileName: 'sce_example',
  id: 'example',
  friendlyName: `Scénario example`,
  version: '1.0.0',
  description: `Exemple de scénario qui ne veut vraiment pas que le volume soit au dessus de 70%.`,
  panels: {
    hide: ['*'],
    show: ['']
  },
  features: {
    cameraControls: true,
    endCallButton: true,
    hdmiPassthrough: true,
    joinGoogleMeet: false,
    joinWebex: true,
    joinZoom: false,
    keypad: true,
    layoutControls: true,
    midCallControls: false,
    musicMode: false,
    participantList: true,
    selfviewControls: true,
    start: true,
    videoMute: true,
    joinMicrosoftTeamsCVI: false
  }
};

export class Scenario {
  constructor() {
    this.alertMessage;
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