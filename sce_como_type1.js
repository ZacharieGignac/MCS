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
    this.devices.displays.presentationsecondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.secondary');
    this.devices.displays.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.farend.main');
    this.devices.displays.byod = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.byod.main');

    //Screens
    this.devices.screens = {};
    this.devices.screens.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.main');
    this.devices.screens.presentationsecondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.secondary');
    this.devices.screens.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.farend.main');

    //Lightscenes
    this.devices.lightscenes = {};
    this.devices.lightscenes.idle = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.idle');
    this.devices.lightscenes.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.presentation');
    this.devices.lightscenes.writingprimary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.writingprimary');
    this.devices.lightscenes.writingsecondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.writingsecondary');
    this.devices.lightscenes.writingboth = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.writingboth');

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
      this.devices.displays.farend.forEach(display => {
        display.setBlanking(false);
        display.powerOn();
      });

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
    this.evaluateAll(status);

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
          if (status.status.call == 'Idle' || status.status.call == 'Connected') {
            this.evaluateDisplays(status.status);
            this.evaluateScreens(status.status);
          }
          break;
        case 'ClearPresentationZoneSecondary':
        case 'presentation':
        case 'ClearPresentationZone':
        case 'PresenterLocation':
          this.evaluateDisplays(status.status);
          this.evaluateScreens(status.status);
          this.evaluateLightscene(status.status);
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

  evaluateAll(status) {
    this.evaluateDisplays(status);
    this.evaluateScreens(status);
    this.evaluateLightscene(status);
  }

  async evaluateLightscene(status) {
    console.log('ComoType1 evaluating lightscenes...');

    if (status.ClearPresentationZone == 'on' && status.ClearPresentationZoneSecondary == 'on') {
      this.devices.lightscenes.writingboth.forEach(lightscene => {
        lightscene.activate();
      });
    }
    else if (status.ClearPresentationZone == 'on' && status.ClearPresentationZoneSecondary == 'off') {
      this.devices.lightscenes.writingprimary.forEach(lightscene => {
        lightscene.activate();
      });
    }
    else if (status.ClearPresentationZone == 'off' && status.ClearPresentationZoneSecondary == 'on') {
      this.devices.lightscenes.writingsecondary.forEach(lightscene => {
        lightscene.activate();
      });
    }
    else {
      //Normal
      if (status.presentation.type == 'NOPRESENTATION' && (status.ClearPresentationZone == 'off' || status.ClearPresentationZone == undefined) && (status.ClearPresentationZoneSecondary == 'off' || status.ClearPresentationZoneSecondary == undefined)) {
        this.devices.lightscenes.idle.forEach(lightscene => {
          lightscene.activate();
        });
      }

      //Writing on board


      //Presentation or remote presenter
      if ((status.call == 'Connected' && status.PresenterLocation == 'remote') || status.presentation.type != 'NOPRESENTATION') {
        this.devices.lightscenes.presentation.forEach(lightscene => {
          lightscene.activate();
        });
      }
    }


  }

  async evaluateScreens(status) {
    console.log('ComoType1 evaluating screens...');
    //TODO: manage farend screen (improbable)
    /******************
     * 
     *  screens configuration
     * 
     ******************/

    //Evaluate primary screens
    if (status.PresenterLocation == 'local' || status.call != 'Connected') {
      if (status.ClearPresentationZone == 'on') {
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
        if (status.ClearPresentationZone == 'on') {
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

    //Evaluate secondary screens
    this.devices.screens.presentationsecondary.forEach(screen => {
      if (status.ClearPresentationZoneSecondary == 'on') {
        screen.up();
      }
      else if (status.ClearPresentationZoneSecondary == 'off') {
        if (status.presentation.type != 'NOPRESENTATION' || (status.call == 'Connected' && status.PresenterLocation == 'remote')) {
          screen.down();
        }
      }
    });

  }

  async evaluateDisplays(status) {
    console.log('ComoType1 evaluating displays...');
    /******************
     * 
     *  Displays configuration
     * 
     ******************/

    //Evaluate primary presentation displays
    await xapi.Command.Video.Matrix.Reset();
    this.devices.displays.byod.forEach(display => {
      xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('Auto');
    });

    if (status.ClearPresentationZone == 'off') {
      //when presenter is local
      if (status.PresenterLocation == 'local') {
        xapi.Config.Video.Monitors.set('DualPresentationOnly');

        this.devices.displays.presentation.forEach(display => {
          if (status.presentation.type != 'NOPRESENTATION') {
            display.setBlanking(false);
            display.powerOn();
          }
          else {
            display.setBlanking(true);
            display.powerOff();
          }

          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('Second');
        });

        this.devices.displays.farend.forEach(display => {
          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
        });
      }
      //When presenter is remote
      else {
        if (status.call == 'Connected') {
          xapi.Config.Video.Monitors.set('Single');
          this.devices.displays.presentation.forEach(display => {
            display.setBlanking(false);
            display.powerOn();
            xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
          });
          this.devices.displays.farend.forEach(display => {
            xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
            xapi.Command.Video.Matrix.Assign({
              Mode: 'Replace',
              Output: display.config.connector,
              RemoteMain: 1
            });
          });
        }
        else {
          xapi.Config.Video.Monitors.set('DualPresentationOnly');
          this.devices.displays.presentation.forEach(display => {
            if (status.presentation.type != 'NOPRESENTATION') {
              display.setBlanking(false);
              display.powerOn();
            }
            else {
              display.setBlanking(true);
              display.powerOff();
            }
            xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('First');
          });
          this.devices.displays.farend.forEach(display => {
            xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set('Second');
          });
        }


      }
    }

    else if (status.ClearPresentationZone == 'on') {
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




    //Evaluate secondary displays
    this.devices.displays.presentationsecondary.forEach(display => {
      if (status.ClearPresentationZoneSecondary == 'on') {
        if (display.config.supportsBlanking) {
          display.setBlanking(true);
        }
        else {
          display.powerOff(0);
        }
      }
      else {
        if (status.presentation.type != 'NOPRESENTATION' || (status.call == 'Connected' && status.PresenterLocation == 'remote')) {
          if (display.config.supportsBlanking) {
            display.setBlanking(false);
          }
          else {
            display.powerOn();
          }
        }
        else {
          if (display.config.supportsBlanking) {
            display.setBlanking(true);
          }
          else {
            display.powerOff();
          }
        }
      }
    });
  }




  test() {
    console.log('test from SCE_Normal');
  }
};