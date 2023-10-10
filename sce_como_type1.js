import xapi from 'xapi';
import { zapiv1 } from './zapi';


/* NOTES
handle presentertrack activation




*/

var zapi = zapiv1;

const DEVICETYPE = zapi.devices.DEVICETYPE;
const ON = 'on';
const OFF = 'off';
const LOCAL = 'local';
const REMOTE = 'remote';
const SINGLE = 'Single';
const DUALPRESENTATIONONLY = 'DualPresentationOnly';
const FIRST = 'First';
const SECOND = 'Second';
const AUTO = 'Auto';

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
    this.devices.lightscenes.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.presentation');
    this.devices.lightscenes.writing = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.writing');

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
          this.evaluateAudio(status.status);
          break;
        case 'ClearPresentationZoneSecondary':
        case 'presentation':
        case 'ClearPresentationZone':
        case 'PresenterLocation':
          this.evaluateDisplays(status.status);
          this.evaluateScreens(status.status);
          this.evaluateLightscene(status.status);
          this.evaluateAudio(status.status);
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

  setAudienceMics(mode) {//TODO

  }

  setPresenterMics(mode) {//TODO

  }

  evaluateAll(status) {
    this.evaluateDisplays(status);
    this.evaluateScreens(status);
    this.evaluateLightscene(status);
    this.evaluateAudio(status);
  }

  async evaluateLightscene(status) {
    if (status.AutoLights == ON) {
      debug(1, 'ComoType1 evaluating lightscenes...');
      var needClearZone = status.ClearPresentationZone == ON ? true : false;
      var presenterLocation = status.PresenterLocation;
      var presentationActive = status.presentation.type != 'NOPRESENTATION';
      var callConnected = status.call == 'Connected';
      var remotePresenterPresent = callConnected && presenterLocation == REMOTE;



      if (needClearZone) {
        this.devices.lightscenes.writing.forEach(lightscene => {
          lightscene.activate();
        });
      }
      else {
        if (remotePresenterPresent || presentationActive) {
          this.devices.lightscenes.presentation.forEach(lightscene => {
            lightscene.activate();
          });
        }
        else {

          this.devices.lightscenes.idle.forEach(lightscene => {
            lightscene.activate();
          });
        }
      }
    }

  }

  async evaluateAudio(status) {

    if (status.PresenterLocation == LOCAL) {
      this.devices.audiooutputgroups.presentation.forEach(aog => {
        aog.disconnectRemoteInputs();
      });
      this.devices.audiooutputgroups.farend.forEach(aog => {
        aog.connectRemoteInputs();
      });
    }
    else {
      this.devices.audiooutputgroups.presentation.forEach(aog => {
        aog.connectRemoteInputs();
      });
      this.devices.audiooutputgroups.farend.forEach(aog => {
        aog.disconnectRemoteInputs();
      });
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
    if (status.AutoScreens) {
      var needPresentationScreen = (status.call == 'Connected' && status.PresenterLocation == REMOTE) || status.presentation.type != 'NOPRESENTATION';
      var needClearZone = status.ClearPresentationZone == ON ? true : false;

      if (needPresentationScreen) {
        if (needClearZone) {
          this.devices.screens.presentation.forEach(screen => {
            if (!screen.config.alwaysUse) {
              screen.up();
            }
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

    var needClearZone = status.ClearPresentationZone == ON ? true : false;
    var permanentDisplays = this.devices.displays.presentation.filter(disp => disp.config.alwaysUse == true).length > 0 ? true : false;
    var presenterLocation = status.PresenterLocation;
    var presentationActive = status.presentation.type != 'NOPRESENTATION';
    var callConnected = status.call == 'Connected';
    var remotePresenterPresent = callConnected && presenterLocation == REMOTE;
    var presentationSupportsBlanking = this.devices.displays.presentation.filter(disp => disp.config.supportsBlanking).length == this.devices.displays.presentation.length;



    const setDisplaysRole = (displays, role) => {
      displays.forEach(display => {
        xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set(role);
      });
    };

    const setMonitors = (monitors) => {
      xapi.Config.Video.Monitors.set(monitors);
    };

    const powerOffDisplays = (displays) => {
      displays.forEach(display => {
        display.off();
      });
    }

    const powerOnDisplays = (displays) => {
      displays.forEach(display => {
        display.on();
      });
    }

    const blankDisplays = (displays) => {
      displays.forEach(display => {
        display.setBlanking(true);
      });
    }

    const unblankDisplays = (displays) => {
      displays.forEach(display => {
        display.setBlanking(false);
      });
    }

    const matrixBlankDisplay = displays => {
      xapi.Command.Video.Matrix.Assign({
        Mode: 'Replace',
        Output: displays[0].config.connector,
        RemoteMain: 4
      })
    }

    const matrixRemoteToDisplay = (display) => {
      xapi.Command.Video.Matrix.Assign({
        Mode: 'Replace',
        Output: display[0].config.connector,
        RemoteMain: 1
      });
    };

    const matrixReset = (displays) => {
      setTimeout(() => {
        xapi.Command.Video.Matrix.Reset({
          Output: displays[0].config.connector
        });
      }, 1000);

    }


    var presentationDisplays = this.devices.displays.presentation;
    var farendDisplays = this.devices.displays.farend;



    //With permanent displays for presentation

    if (permanentDisplays) {
      if (needClearZone) {
        //Permanent displays + Clear zone
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('1');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          blankDisplays(presentationDisplays);
          powerOffDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('2');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == REMOTE) {
          //console.error('3');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, SECOND);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && !presentationActive) {
          //console.error('4');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('5');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixReset(farendDisplays);
        }
      }
      //Permanent displays + NO clear zone
      else {
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('6');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('7');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == REMOTE) {
          //console.error('8');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, SECOND);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && !presentationActive) {
          //console.error('9');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('10');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          matrixRemoteToDisplay(farendDisplays);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
        }
      }


    }




    //Without permanent displays for presentation
    else {
      //console.error('NO PRERMANENT DISPLASYS!');
      if (needClearZone) {
        //console.error('NEED CLEAR ZONE');
        //WITHOUT Permanent displays + Clear zone
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('11');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          matrixBlankDisplay(presentationDisplays)
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('12');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOffDisplays(presentationDisplays);
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          }
          else {
            matrixBlankDisplay(presentationDisplays);
          }
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == REMOTE) {
          //console.error('13');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOffDisplays(presentationDisplays);
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          }
          else {
            matrixBlankDisplay(presentationDisplays);
          }

          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && !presentationActive) {
          //console.error('14');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOffDisplays(presentationDisplays);
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          }
          else {
            matrixBlankDisplay(presentationDisplays);
          }
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('15');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOffDisplays(presentationDisplays);
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          }
          else {
            matrixBlankDisplay(presentationDisplays);
          }
          matrixReset(farendDisplays);
        }
      }
      //WITHOUT Permanent displays + NO clear zone
      else {
        //console.error('DOES NOT NEED CLEAR ZONE');
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('16');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
          matrixReset(presentationDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('17');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
          matrixReset(presentationDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == REMOTE) {
          //console.error('18');
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, SECOND);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
          matrixReset(presentationDisplays);
        }
        else if (remotePresenterPresent && !presentationActive) {
          //console.error('19');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
          matrixReset(presentationDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('20');
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          matrixRemoteToDisplay(farendDisplays);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
        }
      }

    }





  }




  test() {
    console.log('test from SCE_Normal');
  }
};