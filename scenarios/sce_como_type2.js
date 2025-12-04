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
const TRIPLE = 'Triple';
const TRIPLEPRESENTATIONONLY = 'TriplePresentationOnly';
const FIRST = 'First';
const SECOND = 'Second';
const PRESENTATIONONLY = 'PresentationOnly';
const AUTO = 'Auto';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export var Manifest = {
  fileName: 'sce_como_type2',
  id: 'comotype2',
  friendlyName: 'Salle Comodale (Type 2)',
  version: '1.0.0-dev',
  description: 'Comportement normal pour une salle comodale de type 2 (évolution de type1). Includes display role debouncing to prevent flicker from rapid state changes.',
  panels: {
    hide: ['*'],
    show: ['comotype2_settings']
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

    this._displayRoleTimers = {};   // Maps connector ID -> setTimeout timer ID
    this._displayDesiredRoles = {}; // Maps connector ID -> last requested role
    this._displayPowerTimers = new Map(); // Maps display object -> setTimeout timer ID
    this._displayBlankingTimers = new Map(); // Maps display object -> setTimeout timer ID

    zapi.system.onStatusChange(status => { self.onStatusChange(status); });

    this.originalUsePresenterTrack = zapi.system.getStatus('UsePresenterTrack');

    /* getting devices from config */
    //Displays
    this.devices.displays = {};
    this.devices.displays.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.main');
    this.devices.displays.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.farend.main');
    this.devices.displays.byod = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.byod.main');
    this.devices.displays.teleprompter = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.teleprompter');
    this.devices.displays.secondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.secondary');

    //Screens
    this.devices.screens = {};
    this.devices.screens.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.main');
    this.devices.screens.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.farend.main');
    this.devices.screens.teleprompter = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.teleprompter');
    this.devices.screens.secondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.secondary');

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
      zapi.ui.showProgressBar(systemconfig.strings.newSessionTitle, '', 5);
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

    zapi.system.setStatus('comotype2Mode', '-1');
    let status = zapi.system.getAllStatus();
    this.evaluateAll(status);
  }

  onStatusChange(status) {
    if (this.enabled) {
      try { debug(1, `ComoType2 status key=${status.key}`); } catch (e) { }
      switch (status.key) {
        case 'byod':
          // React to unified BYOD state (Active/Inactive) as well
          this.evaluateCameras(status.status);
          break;
        case 'call':
          //Filter non-important call status
          try { debug(1, `ComoType2 call: Connected, presenter=${status.status.PresenterLocation}, pres=${status.status.presentation ? status.status.presentation.type : 'n/a'}`); } catch (e) { }
          if (status.status.call == 'Idle' || status.status.call == 'Connected') {
            this.evaluateDisplays(status.status);
            this.evaluateScreens(status.status);
          }
          this.evaluateAudio(status.status);
          // If a call just connected and a presentation is ongoing, probe for remote presentation audio
          try {
            if (status.status.call == 'Connected' && status.status.presentation && status.status.presentation.type && status.status.presentation.type != 'NOPRESENTATION') {
              this._scheduleRemotePresentationProbe();
            }
          }
          catch (e) { }
          this.evaluateCameras(status.status);
          break;
        case 'UsePresenterTrack':
        case 'AutoCamPresets':
          this.evaluateCameras(status.status);
          break;
        case 'UseTeleprompter':
        case 'UseSecondaryPresentationDisplays':
          this.evaluateDisplays(status.status);
          break;
        case 'presentation':
        case 'ClearPresentationZone':
        case 'PresenterLocation':
          try { debug(1, `ComoType2 presentation change: type=${status.status.presentation ? status.status.presentation.type : 'n/a'}, presenter=${status.status.PresenterLocation}`); } catch (e) { }
          this.evaluateDisplays(status.status);
          this.evaluateScreens(status.status);
          this.evaluateLightscene(status.status);
          this.evaluateAudio(status.status);
          // On presentation start, probe until remote Presentation input is available
          try {
            if (status.status.presentation && status.status.presentation.type && status.status.presentation.type != 'NOPRESENTATION') {
              this._scheduleRemotePresentationProbe();
            }
          }
          catch (e) { }
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
        case 'currentMainVideoSource':
          if (status.status.PresenterLocation == REMOTE && status.status.call == 'Connected') {
            this.evaluateDisplays(status.status);
          }
          break;

      }
    }
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
        try {
          xapi.Command.Video.Input.SetMainVideoSource({ ConnectorId: camConnector });
        } catch (e) {
          // SetMainVideoSource might not be supported
        }
        try {
          xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Follow' });
        } catch (e) {
          // PresenterTrack might not be supported
        }
      }
      else {
        try {
          xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Off' });
        } catch (e) {
          // PresenterTrack might not be supported
        }
        let presenterPreset = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERAPRESET, 'system.presentation.main')[0];
        if (status.AutoCamPresets == ON) {
          presenterPreset.activate();
        }

      }
    }
    else if (status.PresenterLocation == 'remote') {
      try {
        xapi.Command.Cameras.PresenterTrack.Set({ Mode: 'Off' });
      } catch (e) {
        // PresenterTrack might not be supported
      }
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
      debug(1, 'ComoType2 evaluating lightscenes...');
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

  // Schedules a short retry loop to detect RemoteInput Role=Presentation that may
  // appear slightly after presentation start or call connected.
  _scheduleRemotePresentationProbe() {
    if (this._remotePresentationProbeActive) return;
    try { debug(1, 'ComoType2: schedule remote-presentation probe'); } catch (e) { }
    this._remotePresentationProbeActive = true;
    let attempts = 0;
    const maxAttempts = 6;
    const delayMs = 350;
    const attempt = async () => {
      attempts++;
      try { debug(1, `ComoType2: probe attempt ${attempts}/${maxAttempts}`); } catch (e) { }
      const applied = await this._checkAndApplyRemotePresentationRouting();
      if (applied) {
        this._remotePresentationProbeActive = false;
        return;
      }
      if (attempts < maxAttempts && this.enabled) {
        this._remotePresentationProbeTimerId = setTimeout(() => {
          attempt();
        }, delayMs);
      }
      else {
        this._remotePresentationProbeActive = false;
        try { debug(1, 'ComoType2: probe finished, no override applied'); } catch (e) { }
      }
    };
    attempt();
  }

  async _checkAndApplyRemotePresentationRouting() {
    try {
      // Ensure presentation is still active
      let status = zapi.system.getAllStatus();
      try { debug(1, `ComoType2: probe status call=${status.call}, presenter=${status.PresenterLocation}, pres=${status.presentation ? status.presentation.type : 'n/a'}`); } catch (e) { }
      if (!status.presentation || !status.presentation.type || status.presentation.type == 'NOPRESENTATION') {
        try { debug(1, 'ComoType2: probe aborted, no active presentation'); } catch (e) { }
        return false;
      }
      let detailed = await zapi.audio.getRemoteInputsDetailed().catch(() => []);
      try {
        const roles = (detailed || []).reduce((a, d) => { a[d.role] = (a[d.role] || 0) + 1; return a; }, {});
        debug(1, `ComoType2: remote inputs detailed: ${detailed.length}, roles=${JSON.stringify(roles)}`);
      } catch (e) { }
      const presentationIds = (detailed || []).filter(d => d.role === 'presentation').map(d => d.id);
      if (presentationIds.length > 0) {
        this._remotePresentationAudioOverride = true;
        this.devices.audiooutputgroups.presentation.forEach(aog => { aog.connectSpecificRemoteInputs(presentationIds); });
        // Disconnect presentation-role inputs from farend, but allow others to follow default logic
        this.devices.audiooutputgroups.farend.forEach(aog => { aog.disconnectSpecificRemoteInputs(presentationIds); });
        debug(1, `ComoType2: applied presentation override, ids=[${presentationIds.join(', ')}]`);
        return true;
      }
      else {
        try { debug(1, 'ComoType2: no Presentation-role inputs yet'); } catch (e) { }
      }
    }
    catch (e) {
      debug(3, `ComoType2 remote presentation probe error: ${e}`);
    }
    return false;
  }

  async evaluateAudio(status) {

    try { debug(1, `ComoType2 evalAudio: call=${status.call}, presenter=${status.PresenterLocation}, pres=${status.presentation ? status.presentation.type : 'n/a'}`); } catch (e) { }
    // Always read current remote inputs and route Presentation role to presentation group
    let detailed = await zapi.audio.getRemoteInputsDetailed().catch(() => []);
    const presentationIds = (detailed || []).filter(d => d.role === 'presentation').map(d => d.id);
    const nonPresentationIds = (detailed || []).filter(d => d.role !== 'presentation').map(d => d.id);

    // Route presentation-role inputs: connect to presentation, disconnect from farend
    if (presentationIds.length > 0) {
      try { debug(1, `ComoType2 evalAudio: route Presentation-role -> presentation, ids=[${presentationIds.join(', ')}]`); } catch (e) { }
      this.devices.audiooutputgroups.presentation.forEach(aog => { aog.connectSpecificRemoteInputs(presentationIds); });
      this.devices.audiooutputgroups.farend.forEach(aog => { aog.disconnectSpecificRemoteInputs(presentationIds); });
    }

    // Route non-presentation inputs according to PresenterLocation
    if (status.PresenterLocation == LOCAL) {
      try { debug(1, `ComoType2 evalAudio: LOCAL presenter, route non-presentation -> farend, ids=[${nonPresentationIds.join(', ')}]`); } catch (e) { }
      if (nonPresentationIds.length > 0) {
        this.devices.audiooutputgroups.farend.forEach(aog => { aog.connectSpecificRemoteInputs(nonPresentationIds); });
      }
      // Ensure non-presentation are not in presentation group
      if (nonPresentationIds.length > 0) {
        this.devices.audiooutputgroups.presentation.forEach(aog => { aog.disconnectSpecificRemoteInputs(nonPresentationIds); });
      }
    }
    else {
      try { debug(1, `ComoType2 evalAudio: REMOTE presenter, route non-presentation -> presentation, ids=[${nonPresentationIds.join(', ')}]`); } catch (e) { }
      if (nonPresentationIds.length > 0) {
        this.devices.audiooutputgroups.presentation.forEach(aog => { aog.connectSpecificRemoteInputs(nonPresentationIds); });
        this.devices.audiooutputgroups.farend.forEach(aog => { aog.disconnectSpecificRemoteInputs(nonPresentationIds); });
      }
    }

  }

  async evaluateScreens(status) {
    debug(1, 'ComoType2 evaluating screens...');
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

  evaluateDisplays(status) {
    if (this.evaluateDisplaysTimer) {
      clearTimeout(this.evaluateDisplaysTimer);
    }
    this.evaluateDisplaysTimer = setTimeout(() => {
      this._executeEvaluateDisplays(status);
    }, 200);
  }

  async _executeEvaluateDisplays(status) {
    debug(1, 'ComoType2 evaluating displays...');

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
    //var remotePresenterPresent = callConnected;
    var presentationSupportsBlanking = this.devices.displays.presentation.filter(disp => disp.config.supportsBlanking).length == this.devices.displays.presentation.length;
    var UseTeleprompter = status.UseTeleprompter;
    var UseSecondaryPresentationDisplays = status.UseSecondaryPresentationDisplays;
    var presentationDisplaysStartDelay = systemconfig.sce_como_type2?.presentationDisplaysStartDelay || 0;


    // Helpers to read debounce and slow-display settings from scenario-specific config or system fallback
    const getDebounceEnabled = () => {
      try {
        if (systemconfig.sce_como_type2 && typeof systemconfig.sce_como_type2.enableStateEvaluationDebounce === 'boolean') {
          return systemconfig.sce_como_type2.enableStateEvaluationDebounce === true;
        }
        return false;
      } catch (e) { return false; }
    };

    const setDisplaysRole = (displays, role, delay = 0) => {
      if (status.AutoDisplays == ON) {
        const debounceEnabled = getDebounceEnabled();

        displays.forEach(display => {
          const connector = display.config.connector;

          if (debounceEnabled) {
            debug(1, `ComoType2 setDisplaysRole with debouncing: connector=${connector}, role=${role}, delay=${delay}ms`);
            // Debouncing enabled: cancel previous timers and track desired state
            const timerId = this._displayRoleTimers[connector];

            // Cancel any existing pending timer for this connector
            if (timerId) {
              clearTimeout(timerId);
            }

            // Skip scheduling if the desired role matches the last request and delay is 0
            const lastDesired = this._displayDesiredRoles[connector];
            if (lastDesired === role && delay === 0) {
              return;
            }

            // Track the desired role for this connector
            this._displayDesiredRoles[connector] = role;

            // Schedule the role change
            this._displayRoleTimers[connector] = setTimeout(() => {
              try {
                xapi.Config.Video.Output.Connector[connector].MonitorRole.set(role);
              } catch (e) {
                // MonitorRole.set might fail if connector is invalid
              }
              // Clean up after execution
              delete this._displayRoleTimers[connector];
            }, delay);
          } else {
            // No debouncing: apply role change immediately (with delay if specified)
            debug(1, `ComoType2 setDisplaysRole without debouncing: connector=${connector}, role=${role}, delay=${delay}ms`);
            setTimeout(() => {
              try {
                xapi.Config.Video.Output.Connector[connector].MonitorRole.set(role);
              } catch (e) {
                // MonitorRole.set might fail if connector is invalid
              }
            }, delay);
          }
        });
      }
    };

    const setMonitors = (monitors) => {
      if (status.AutoDisplays == ON) {
        xapi.Config.Video.Monitors.set(monitors);
      }
    };

    const powerOffDisplays = (displays, delay = 0) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (this._displayPowerTimers.has(display)) {
            clearTimeout(this._displayPowerTimers.get(display));
            this._displayPowerTimers.delete(display);
          }
          if (delay > 0) {
            const timer = setTimeout(() => {
              display.off();
              this._displayPowerTimers.delete(display);
            }, delay);
            this._displayPowerTimers.set(display, timer);
          } else {
            display.off();
          }
        });
      }
    };

    const powerOnDisplays = (displays, delay = 0) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (this._displayPowerTimers.has(display)) {
            clearTimeout(this._displayPowerTimers.get(display));
            this._displayPowerTimers.delete(display);
          }
          if (delay > 0) {
            const timer = setTimeout(() => {
              display.on();
              this._displayPowerTimers.delete(display);
            }, delay);
            this._displayPowerTimers.set(display, timer);
          } else {
            display.on();
          }
        });
      }
    };

    const blankDisplays = (displays, delay = 0) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (this._displayBlankingTimers.has(display)) {
            clearTimeout(this._displayBlankingTimers.get(display));
            this._displayBlankingTimers.delete(display);
          }
          if (delay > 0) {
            const timer = setTimeout(() => {
              display.setBlanking(true);
              this._displayBlankingTimers.delete(display);
            }, delay);
            this._displayBlankingTimers.set(display, timer);
          } else {
            display.setBlanking(true);
          }
        });
      }
    };

    const unblankDisplays = (displays, delay = 0) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (this._displayBlankingTimers.has(display)) {
            clearTimeout(this._displayBlankingTimers.get(display));
            this._displayBlankingTimers.delete(display);
          }
          if (delay > 0) {
            const timer = setTimeout(() => {
              display.setBlanking(false);
              this._displayBlankingTimers.delete(display);
            }, delay);
            this._displayBlankingTimers.set(display, timer);
          } else {
            display.setBlanking(false);
          }
        });
      }
    };

    const matrixBlankDisplay = displays => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (display.config.skipVideoMatrix) return;
          try {
            xapi.Command.Video.Matrix.Assign({
              Mode: 'Replace',
              Output: display.config.connector
            });
          } catch (e) {
            // Video Matrix might not be supported
          }
        });
      }
    };

    const matrixRemoteToDisplay = (display, delay = 2000) => {
      if (status.AutoDisplays == ON) {
        display.forEach(disp => {
          if (disp.config.skipVideoMatrix) return;
          setTimeout(() => {
            try {
              xapi.Command.Video.Matrix.Assign({
                Mode: 'Replace',
                Output: disp.config.connector,
                RemoteMain: 1
              });
            } catch (e) {
              // Video Matrix might not be supported
            }
          }, delay);
        });
      }
    };

    const matrixCurrentMainVideoToDisplay = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(disp => {
          if (disp.config.skipVideoMatrix) return;
          try {
            const currentMainVideoSource = zapi.system.getStatus('currentMainVideoSource');
            if (currentMainVideoSource && currentMainVideoSource !== 'Unknown') {
              xapi.Command.Video.Matrix.Assign({
                Mode: 'Replace',
                Output: disp.config.connector,
                SourceId: [currentMainVideoSource]
              });
            }
          } catch (e) {
            // Video Matrix might not be supported
          }
        });
      }
    };

    const matrixReset = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          if (display.config.skipVideoMatrix) return;
          setTimeout(() => {
            try {
              xapi.Command.Video.Matrix.Reset({
                Output: display.config.connector
              });
            } catch (e) {
              // Video Matrix might not be supported
            }
          }, 1000);
        });
      }
    };


    var presentationDisplays = this.devices.displays.presentation;
    var farendDisplays = this.devices.displays.farend;
    var teleprompterDisplays = this.devices.displays.teleprompter;
    var secondaryPresentationDisplays = this.devices.displays.secondary;

      if (needClearZone) {
        //console.error('NEED CLEAR ZONE');
        //No call, no presentation
        //TESTED OK
        if (!presentationActive && !callConnected) {
          console.error('CLEARZONE.1');
          zapi.system.setStatus('comotype2Mode', 'CLEARZONE.1');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);


          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          powerOffDisplays(teleprompterDisplays);
          blankDisplays(teleprompterDisplays);


          //Secondary presentation displays
          powerOffDisplays(secondaryPresentationDisplays);
          blankDisplays(secondaryPresentationDisplays);

        }

        //no call, presentation
        //TESTED OK
        if (presentationActive && !callConnected) {
          console.error('CLEARZONE.2');
          zapi.system.setStatus('comotype2Mode', 'CLEARZONE.2');


          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          powerOffDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          if (UseTeleprompter == ON) {
            powerOnDisplays(teleprompterDisplays);
            unblankDisplays(teleprompterDisplays);
          }

          //Secondary presentation displays
          if (UseSecondaryPresentationDisplays == ON) {
            powerOnDisplays(secondaryPresentationDisplays);
            unblankDisplays(secondaryPresentationDisplays);
          }
        }

        //call, no presentation
        //TESTED OK
        if (callConnected && !presentationActive && presenterLocation == LOCAL) {
          console.error('CLEARZONE.3');
          zapi.system.setStatus('comotype2Mode', 'CLEARZONE.3');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          powerOffDisplays(teleprompterDisplays);
          blankDisplays(teleprompterDisplays);

          //Secondary presentation displays
          powerOffDisplays(secondaryPresentationDisplays);
          blankDisplays(secondaryPresentationDisplays);
        }

        //call, presentation active
        //TESTED OK
        if (callConnected && presentationActive) {
          console.error('CLEARZONE.4');
          zapi.system.setStatus('comotype2Mode', 'CLEARZONE.4');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          unblankDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          powerOffDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          if (UseTeleprompter == ON) {

            powerOnDisplays(teleprompterDisplays);
            unblankDisplays(teleprompterDisplays);
          }
          else {
            powerOffDisplays(teleprompterDisplays);
            blankDisplays(teleprompterDisplays);
          }

          //Secondary presentation displays
          if (UseSecondaryPresentationDisplays == ON) {
            powerOnDisplays(secondaryPresentationDisplays);
            unblankDisplays(secondaryPresentationDisplays);
          }
          else {
            powerOffDisplays(secondaryPresentationDisplays);
            blankDisplays(secondaryPresentationDisplays);
          }
        }

        //call, remote presenter, no presentation
        if (callConnected && !presentationActive && presenterLocation == REMOTE) {
          console.error('CLEARZONE.5');
          zapi.system.setStatus('comotype2Mode', 'CLEARZONE.5');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          powerOffDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, FIRST);
          powerOffDisplays(teleprompterDisplays);
          blankDisplays(teleprompterDisplays);

          //Secondary presentation displays
          powerOffDisplays(secondaryPresentationDisplays);
          blankDisplays(secondaryPresentationDisplays);
        }

        //call, remote presenter, presentation active
        if (callConnected && presentationActive && presenterLocation == REMOTE) {
          console.error('CLEARZONE.6');
          zapi.system.setStatus('comotype2Mode', 'CLEARZONE.6');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOffDisplays(farendDisplays, presentationDisplaysStartDelay);
          blankDisplays(farendDisplays, presentationDisplaysStartDelay);

          //Presentation displays
          setDisplaysRole(presentationDisplays, FIRST, 2000);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          powerOffDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, PRESENTATIONONLY);
          if (UseTeleprompter == ON) {
            powerOnDisplays(teleprompterDisplays);
            unblankDisplays(teleprompterDisplays);
          }
          else {
            powerOffDisplays(teleprompterDisplays);
            blankDisplays(teleprompterDisplays);
          }

          //Secondary presentation displays
          if (UseSecondaryPresentationDisplays == ON) {
            powerOnDisplays(secondaryPresentationDisplays);
            unblankDisplays(secondaryPresentationDisplays);
          }
          else {
            powerOffDisplays(secondaryPresentationDisplays);
            blankDisplays(secondaryPresentationDisplays);
          }
 
        }
      }
      //NO clear zone
      else {

        //No call, no presentation
        //TESTED OK
        if (!presentationActive && !callConnected) {
          console.error('NORMAL.1');
          zapi.system.setStatus('comotype2Mode', 'NORMAL.1');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);


          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          powerOffDisplays(teleprompterDisplays);
          blankDisplays(teleprompterDisplays);


          //Secondary presentation displays
          powerOffDisplays(secondaryPresentationDisplays);
          blankDisplays(secondaryPresentationDisplays);

        }

        //no call, presentation
        //TESTED OK
        if (presentationActive && !callConnected) {
          console.error('NORMAL.2');
          zapi.system.setStatus('comotype2Mode', 'NORMAL.2');


          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          if (UseTeleprompter == ON) {
            powerOnDisplays(teleprompterDisplays);
            unblankDisplays(teleprompterDisplays);
          }

          //Secondary presentation displays
          if (UseSecondaryPresentationDisplays == ON) {
            powerOnDisplays(secondaryPresentationDisplays);
            unblankDisplays(secondaryPresentationDisplays);
          }
        }

        //call, no presentation
        //TESTED OK
        if (callConnected && !presentationActive) {
          console.error('NORMAL.3');
          zapi.system.setStatus('comotype2Mode', 'NORMAL.3');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          powerOffDisplays(teleprompterDisplays);
          blankDisplays(teleprompterDisplays);

          //Secondary presentation displays
          powerOffDisplays(secondaryPresentationDisplays);
          blankDisplays(secondaryPresentationDisplays);
        }

        //call, presentation active
        //TESTED OK
        if (callConnected && presentationActive) {
          console.error('NORMAL.4');
          zapi.system.setStatus('comotype2Mode', 'NORMAL.4');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOnDisplays(farendDisplays);
          unblankDisplays(farendDisplays);

          //Presentation displays
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, SECOND);
          if (UseTeleprompter == ON) {

            powerOnDisplays(teleprompterDisplays);
            unblankDisplays(teleprompterDisplays);
          }
          else {
            powerOffDisplays(teleprompterDisplays);
            blankDisplays(teleprompterDisplays);
          }

          //Secondary presentation displays
          if (UseSecondaryPresentationDisplays == ON) {
            powerOnDisplays(secondaryPresentationDisplays);
            unblankDisplays(secondaryPresentationDisplays);
          }
          else {
            powerOffDisplays(secondaryPresentationDisplays);
            blankDisplays(secondaryPresentationDisplays);
          }
        }

        //call, remote presenter, no presentation
        if (callConnected && !presentationActive && presenterLocation == REMOTE) {
          console.error('NORMAL.5');
          zapi.system.setStatus('comotype2Mode', 'NORMAL.5');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOffDisplays(farendDisplays, presentationDisplaysStartDelay);
          blankDisplays(farendDisplays, presentationDisplaysStartDelay);

          //Presentation displays
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, FIRST);
          powerOffDisplays(teleprompterDisplays);
          blankDisplays(teleprompterDisplays);

          //Secondary presentation displays
          powerOffDisplays(secondaryPresentationDisplays);
          blankDisplays(secondaryPresentationDisplays);
        }

        //call, remote presenter, presentation active
        if (callConnected && presentationActive && presenterLocation == REMOTE) {
          console.error('NORMAL.6');
          zapi.system.setStatus('comotype2Mode', 'NORMAL.6');

          setMonitors(TRIPLE);

          //Farend displays
          setDisplaysRole(farendDisplays, FIRST);
          powerOffDisplays(farendDisplays, presentationDisplaysStartDelay);
          blankDisplays(farendDisplays, presentationDisplaysStartDelay);

          //Presentation displays
          setDisplaysRole(presentationDisplays, FIRST, 2000);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);

          //Teleprompter displays
          setDisplaysRole(teleprompterDisplays, PRESENTATIONONLY);
          if (UseTeleprompter == ON) {
            powerOnDisplays(teleprompterDisplays);
            unblankDisplays(teleprompterDisplays);
          }
          else {
            powerOffDisplays(teleprompterDisplays);
            blankDisplays(teleprompterDisplays);
          }

          //Secondary presentation displays
          if (UseSecondaryPresentationDisplays == ON) {
            powerOnDisplays(secondaryPresentationDisplays);
            unblankDisplays(secondaryPresentationDisplays);
          }
          else {
            powerOffDisplays(secondaryPresentationDisplays);
            blankDisplays(secondaryPresentationDisplays);
          }

          if (systemconfig.system.defaultPipPosition) {
            xapi.Command.Video.Layout.LayoutFamily.Set({
              LayoutFamily: 'Overlay',
              Target: 'Local'
            });

            xapi.Command.Video.ActiveSpeakerPIP.Set({
              Position: systemconfig.system.defaultPipPosition,
            });
          }
 
        }
       
      }
  }




  test() {

  }
}