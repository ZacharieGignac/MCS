/* jshint esversion:8 */
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';
import { config as systemconfig } from './config'


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
  version: '1.2.0-dev',
  description: 'Comportement normal pour une salle comodale de type 1',
  panels: {
    hide: ['*'],
    show: ['comotype1_settings']
  },
  features: {
    shareStart: true,
    cameraControls: true,
    endCallButton: true,
    byod: true, // Active automatiquement HDMI.Passthrough et/ou Webcam selon le système
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


    zapi.system.onStatusChange(status => { self.onStatusChange(status); });

    this.originalUsePresenterTrack = zapi.system.getStatus('UsePresenterTrack');

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
      zapi.ui.showProgressBar(systemconfig.strings.newSessionTitle, 'Un instant...', 5);
      this.devices.displays.farend.forEach(display => {
        display.setBlanking(false);
        display.powerOn();
      });

      success(true);
    });


  }

  disable() {
    return new Promise(async success => {
      success(true);
    });
  }

  start() {
    
    zapi.system.setStatus('comotype1Mode', '-1');
    let status = zapi.system.getAllStatus();
    this.evaluateAll(status);
  }

  onStatusChange(status) {
    if (this.enabled) {
      switch (status.key) {
        case 'hdmiPassthrough':
          this.evaluateCameras(status.status);
          break;
        case 'call':
          //Filter non-important call status
          if (status.status.call == 'Idle' || status.status.call == 'Connected') {
            this.evaluateDisplays(status.status);
            this.evaluateScreens(status.status);
          }
          this.evaluateAudio(status.status);
          this.evaluateCameras(status.status);
          break;
        case 'UsePresenterTrack':
        case 'AutoCamPresets':
          this.evaluateCameras(status.status);
          break;
        case 'presentation':
        case 'ClearPresentationZone':
        case 'PresenterLocation':
          this.evaluateDisplays(status.status);
          this.evaluateScreens(status.status);
          this.evaluateLightscene(status.status);
          this.evaluateAudio(status.status);
          this.evaluateCameras(status.status);
          break;
        case 'AudienceMics':
          this.setAudienceMics(status.value);
          break;
        case 'PresenterMics':
          this.setPresenterMics(status.value);
          break;
        case 'AutoLights':
          this.evaluateLightscene(status.status);
          break;

      }
    }
  }

  displayEnableMessage() {
    xapi.Command.UserInterface.Message.Prompt.Display({
      title: systemconfig.strings.newSessionTitle,
      text: `Veuillez patienter ${systemconfig.system.newSessionDelay / 1000} secondes.`,
    });

    setTimeout(() => {
      xapi.Command.UserInterface.Message.Prompt.Clear();
    }, systemconfig.system.newSessionDelay);
  }


  setAudienceMics(mode) {
    this.devices.audioinputs.audiencemics.forEach(mic => {
      if (mode == ON) {
        mic.on();
      }
      else if (mode == OFF) {
        mic.off();
      }
    });
  }

  setPresenterMics(mode) {
    this.devices.audioinputs.presentermics.forEach(mic => {
      if (mode == ON) {
        mic.on();
      }
      else if (mode == OFF) {
        mic.off();
      }
    });
  }

  evaluateAll(status) {
    this.evaluateDisplays(status);
    this.evaluateScreens(status);
    this.evaluateLightscene(status);
    this.evaluateAudio(status);
    this.evaluateCameras(status);
  }

  evaluateCameras(status) {
    if (status.PresenterLocation == 'local') {
      if (status.UsePresenterTrack == ON && (status.call == 'Connected' || status.byod == 'Active')) {
        let camConnector = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERA, 'system.presentation.main')[0].config.connector;
        xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camConnector });
        xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Follow' });
      }
      else {
        xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Off' });
        let presenterPreset = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERAPRESET, 'system.presentation.main')[0];
        if (status.AutoCamPresets == ON) {
          presenterPreset.activate();
        }

      }
    }
    else if (status.PresenterLocation == 'remote') {
      xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Off' });
      if (status.call == 'Connected' || status.byod == 'Active') {
        let audiencePreset = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERAPRESET, 'system.farend.main')[0];
        if (status.AutoCamPresets == ON) {
          audiencePreset.activate();
        }
      }
    }

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
    debug(1, 'ComoType1 evaluating screens...');
    /******************
     * 
     *  screens configuration
     * 
     ******************/
    if (status.AutoScreens == ON) {
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
    debug(1, 'ComoType1 evaluating displays...');
    
    // Key state variables
    const needClearZone = status.ClearPresentationZone == ON;
    const permanentDisplays = this.devices.displays.presentation.filter(disp => disp.config.alwaysUse == true).length > 0;
    const presentationActive = status.presentation.type != 'NOPRESENTATION';
    const callConnected = status.call == 'Connected';
    const remotePresenterPresent = callConnected && status.PresenterLocation == REMOTE;
    const presentationSupportsBlanking = this.devices.displays.presentation.filter(disp => disp.config.supportsBlanking).length == this.devices.displays.presentation.length;

    const presentationDisplays = this.devices.displays.presentation;
    const farendDisplays = this.devices.displays.farend;

    // Helper functions for display operations
    const setDisplaysRole = (displays, role) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set(role);
        });
      }
    };

    const setMonitors = (monitors) => {
      if (status.AutoDisplays == ON) {
        xapi.Config.Video.Monitors.set(monitors);
      }
    };

    const powerOffDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => display.off());
      }
    };

    const powerOnDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => display.on());
      }
    };

    const blankDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => display.setBlanking(true));
      }
    };

    const unblankDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => display.setBlanking(false));
      }
    };

    const matrixBlankDisplay = displays => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (display.config.skipVideoMatrix) return;
          xapi.Command.Video.Matrix.Assign({
            Mode: 'Replace',
            Output: display.config.connector
          });
        });
      }
    };

    const matrixRemoteToDisplay = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(disp => {
          if (disp.config.skipVideoMatrix) return;
          xapi.Command.Video.Matrix.Assign({
            Mode: 'Replace',
            Output: disp.config.connector,
            RemoteMain: 1
          });
        });
      }
    };

    const matrixReset = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (display.config.skipVideoMatrix) return;
          setTimeout(() => {
            xapi.Command.Video.Matrix.Reset({
              Output: display.config.connector
            });
          }, 1000);
        });
      }
    };

    // Determine display configuration based on state
    const getDisplayConfig = () => {
      // Base configuration
      let config = {
        monitors: DUALPRESENTATIONONLY,
        farendRole: FIRST,
        presentationRole: SECOND,
        presentationPower: false,
        presentationBlank: true,
        matrixReset: true
      };

      // Adjust based on presentation state
      if (presentationActive || remotePresenterPresent) {
        config.presentationPower = true;
        config.presentationBlank = false;
      }

      // Adjust based on presenter location
      if (presentationActive && !remotePresenterPresent && status.PresenterLocation == REMOTE) {
        config.farendRole = SECOND;
        config.presentationRole = FIRST;
      }

      // Adjust for remote presenter with presentation
      if (remotePresenterPresent && presentationActive) {
        config.matrixReset = false;
        config.matrixRemoteToDisplay = true;
      }

      // Adjust for clear zone
      if (needClearZone) {
        if (permanentDisplays) {
          config.presentationPower = config.presentationPower && permanentDisplays;
        } else {
          config.monitors = SINGLE;
          config.farendRole = FIRST;
          config.presentationRole = FIRST;
        }
      }

      return config;
    };

    // Apply the configuration
    const config = getDisplayConfig();
    
    // Set monitor configuration
    setMonitors(config.monitors);
    
    // Set display roles
    setDisplaysRole(farendDisplays, config.farendRole);
    setDisplaysRole(presentationDisplays, config.presentationRole);
    
    // Handle presentation displays
    if (config.presentationPower) {
      if (permanentDisplays) {
        powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
        blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
      } else {
        powerOnDisplays(presentationDisplays);
        if (config.presentationBlank) {
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          } else {
            matrixBlankDisplay(presentationDisplays);
          }
        } else {
          unblankDisplays(presentationDisplays);
        }
      }
    } else {
      powerOffDisplays(presentationDisplays);
      blankDisplays(presentationDisplays);
    }
    
    // Handle matrix operations
    if (config.matrixReset) {
      matrixReset(farendDisplays);
      matrixReset(presentationDisplays);
    }
    if (config.matrixRemoteToDisplay) {
      matrixRemoteToDisplay(farendDisplays);
    }

    // Set mode for debugging
    const calculateMode = () => {
      // Base mode is 1 (minimum mode in original file)
      let mode = 1;

      if (needClearZone) {
        if (permanentDisplays) {
          if (!presentationActive && !remotePresenterPresent) mode = 1;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == LOCAL) mode = 2;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == REMOTE) mode = 3;
          else if (remotePresenterPresent && !presentationActive) mode = 4;
          else if (remotePresenterPresent && presentationActive) mode = 5;
        } else {
          if (!presentationActive && !remotePresenterPresent) mode = 11;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == LOCAL) mode = 12;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == REMOTE) mode = 13;
          else if (remotePresenterPresent && !presentationActive) mode = 14;
          else if (remotePresenterPresent && presentationActive) mode = 15;
        }
      } else {
        if (permanentDisplays) {
          if (!presentationActive && !remotePresenterPresent) mode = 6;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == LOCAL) mode = 7;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == REMOTE) mode = 8;
          else if (remotePresenterPresent && !presentationActive) mode = 9;
          else if (remotePresenterPresent && presentationActive) mode = 10;
        } else {
          if (!presentationActive && !remotePresenterPresent) mode = 16;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == LOCAL) mode = 17;
          else if (presentationActive && !remotePresenterPresent && status.PresenterLocation == REMOTE) mode = 18;
          else if (remotePresenterPresent && !presentationActive) mode = 19;
          else if (remotePresenterPresent && presentationActive) mode = 20;
        }
      }

      return mode;
    };

    zapi.system.setStatus('comotype1Mode', calculateMode());
  }

  test() {

  }
}