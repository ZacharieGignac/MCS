import xapi from 'xapi';
import { zapiv1 } from './zapi';


/* NOTES
handle presentertrack activation




*/

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
    var self = this;
    this.devices = {};
    this.enabled = false;

    zapi.system.onStatusChange(status => { self.onStatusChange(status); });

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



  }

  enable() {
    return new Promise(async success => {
      this.enabled = true;

      success(true);
    });


  }

  disable() {
    return new Promise(async success => {
      this.enabled = false;

      success(true);
    });
  }

  start() {

    let status = zapi.system.getAllStatus();
    this.evaluateDisplays(status);

    /*
    if (zapi.system.getStatus('AutoLights') == 'on') {
      for (let lightscene of this.devices.lightscenes.idle) {
        lightscene.activate();
      }
    }
    */
  }

  onStatusChange(status) {
    if (this.enabled) {
      switch (status.key) {

        case 'hdmiPassthrough':
          break;
        case 'call':
          //Filter non-important call status
          if (status.status.call == 'Idle' && status.status.call == 'Connected') {
            this.evaluateDisplays(status.status);
            this.evaluateScreens(status.status);
          }
          break;
        case 'presentation':
        case 'ClearBoard':
        case 'PresenterLocation':
          this.evaluateDisplays(status.status);
          this.evaluateScreens(status.status);
          break;
        case 'AudienceMics':
          this.setAudienceMics(status.value);
          break;
        case 'PresenterMics':
          this.setPresenterMics(status.value);
          break;

      }
    }
  }

  setAudienceMics(mode) {

  }

  setPresenterMics(mode) {

  }

  async evaluateScreens(status) {

    //TODO: manage farend screen (improbable)
    /******************
     * 
     *  screens configuration
     * 
     ******************/
    console.error(this.devices.screens);
    if (status.PresenterLocation == 'local' || status.call != 'Connected') {
      if (status.ClearBoard == 'on') {
        this.devices.screens.presentation.forEach(screen => {
          screen.up();
        });
      }
      else {
        if (status.presentation.type != 'NOPRESENTATION') {
          this.devices.screens.presentation.forEach(screen => {
            screen.down();
          });
        }
      }
    }
    else {
      if (status.call == 'Connected') {
        if (status.ClearBoard == 'on') {
          this.devices.screens.presentation.forEach(screen => {
            screen.up();
          });
        }
        else {
          this.devices.screens.presentation.forEach(screen => {
            screen.down();
          });
        }
      }
    }

  }

  async evaluateDisplays(status) {
    console.log('ComoType1 evaluating displays...');
    /******************
     * 
     *  Displays configuration
     * 
     ******************/
    await xapi.Command.Video.Matrix.Reset();
    this.devices.displays.byod.forEach(display => {
      xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('Auto');
    });

    if (status.ClearBoard == 'off') {
      //Invert displays or not, depending on the presenter location
      if (status.PresenterLocation == 'local') {
        xapi.Config.Video.Monitors.set('DualPresentationOnly');

        this.devices.displays.presentation.forEach(display => {
          //Choose unblanking mode (display blanking or video matrix)
          if (display.config.supportsBlanking) {
            display.setBlanking(false);
          }

          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('Second');
        });

        this.devices.displays.farend.forEach(display => {
          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
        });
      }
      else {
        xapi.Config.Video.Monitors.set('Single');
        this.devices.displays.presentation.forEach(display => {
          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
        });
        this.devices.displays.farend.forEach(display => {
          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
          if (status.call == 'Connected') {
            xapi.Command.Video.Matrix.Assign({
              Mode: 'Replace',
              Output: display.config.connector,
              RemoteMain: 1
            });
          }
        });

      }
    }

    else if (status.ClearBoard == 'on') {
      xapi.Config.Video.Monitors.set('Single');
      this.devices.displays.presentation.forEach(display => {
        //Setting role
        xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');

        //Choose blanking mode (display blanking or video matrix)
        if (display.config.supportsBlanking) {
          display.setBlanking(true);
        }
        else {
          xapi.Command.Video.Matrix.Assign({
            Mode: 'Replace',
            Output: display.config.connector,
            RemoteMain: 4
          });
        }
      });

      this.devices.displays.farend.forEach(display => {
        xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
      });

    }
  }




  test() {
    console.log('test from SCE_Normal');
  }
};