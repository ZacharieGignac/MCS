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
  version: '1.2.0',
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
    
    zapi.system.setStatus('comotype1Mode', '-1');
    let status = zapi.system.getAllStatus();
    this.evaluateAll(status);
  }

  onStatusChange(status) {
    if (this.enabled) {
      try { debug(1, `ComoType1 status key=${status.key}`); } catch (e) {}
      switch (status.key) {
        case 'byod':
          // React to unified BYOD state (Active/Inactive) as well
          this.evaluateCameras(status.status);
          break;
        case 'call':
          //Filter non-important call status
          try { debug(1, `ComoType1 call: Connected, presenter=${status.status.PresenterLocation}, pres=${status.status.presentation ? status.status.presentation.type : 'n/a'}`); } catch (e) {}
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
        case 'presentation':
        case 'ClearPresentationZone':
        case 'PresenterLocation':
          try { debug(1, `ComoType1 presentation change: type=${status.status.presentation ? status.status.presentation.type : 'n/a'}, presenter=${status.status.PresenterLocation}`); } catch (e) {}
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

  // Schedules a short retry loop to detect RemoteInput Role=Presentation that may
  // appear slightly after presentation start or call connected.
  _scheduleRemotePresentationProbe() {
    if (this._remotePresentationProbeActive) return;
    try { debug(1, 'ComoType1: schedule remote-presentation probe'); } catch (e) {}
    this._remotePresentationProbeActive = true;
    let attempts = 0;
    const maxAttempts = 6;
    const delayMs = 350;
    const attempt = async () => {
      attempts++;
      try { debug(1, `ComoType1: probe attempt ${attempts}/${maxAttempts}`); } catch (e) {}
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
        try { debug(1, 'ComoType1: probe finished, no override applied'); } catch (e) {}
      }
    };
    attempt();
  }

  async _checkAndApplyRemotePresentationRouting() {
    try {
      // Ensure presentation is still active
      let status = zapi.system.getAllStatus();
      try { debug(1, `ComoType1: probe status call=${status.call}, presenter=${status.PresenterLocation}, pres=${status.presentation ? status.presentation.type : 'n/a'}`); } catch (e) {}
      if (!status.presentation || !status.presentation.type || status.presentation.type == 'NOPRESENTATION') {
        try { debug(1, 'ComoType1: probe aborted, no active presentation'); } catch (e) {}
        return false;
      }
      let detailed = await zapi.audio.getRemoteInputsDetailed().catch(() => []);
      try {
        const roles = (detailed||[]).reduce((a,d)=>{a[d.role]=(a[d.role]||0)+1;return a;},{});
        debug(1, `ComoType1: remote inputs detailed: ${detailed.length}, roles=${JSON.stringify(roles)}`);
      } catch (e) {}
      const presentationIds = (detailed || []).filter(d => d.role === 'presentation').map(d => d.id);
      if (presentationIds.length > 0) {
        this._remotePresentationAudioOverride = true;
        this.devices.audiooutputgroups.presentation.forEach(aog => { aog.connectSpecificRemoteInputs(presentationIds); });
        // Disconnect presentation-role inputs from farend, but allow others to follow default logic
        this.devices.audiooutputgroups.farend.forEach(aog => { aog.disconnectSpecificRemoteInputs(presentationIds); });
        debug(1, `ComoType1: applied presentation override, ids=[${presentationIds.join(', ')}]`);
        return true;
      }
      else {
        try { debug(1, 'ComoType1: no Presentation-role inputs yet'); } catch (e) {}
      }
    }
    catch (e) {
      debug(3, `ComoType1 remote presentation probe error: ${e}`);
    }
    return false;
  }

  async evaluateAudio(status) {

    try { debug(1, `ComoType1 evalAudio: call=${status.call}, presenter=${status.PresenterLocation}, pres=${status.presentation ? status.presentation.type : 'n/a'}`); } catch (e) {}
    // Always read current remote inputs and route Presentation role to presentation group
    let detailed = await zapi.audio.getRemoteInputsDetailed().catch(() => []);
    const presentationIds = (detailed || []).filter(d => d.role === 'presentation').map(d => d.id);
    const nonPresentationIds = (detailed || []).filter(d => d.role !== 'presentation').map(d => d.id);

    // Route presentation-role inputs: connect to presentation, disconnect from farend
    if (presentationIds.length > 0) {
      try { debug(1, `ComoType1 evalAudio: route Presentation-role -> presentation, ids=[${presentationIds.join(', ')}]`); } catch (e) {}
      this.devices.audiooutputgroups.presentation.forEach(aog => { aog.connectSpecificRemoteInputs(presentationIds); });
      this.devices.audiooutputgroups.farend.forEach(aog => { aog.disconnectSpecificRemoteInputs(presentationIds); });
    }

    // Route non-presentation inputs according to PresenterLocation
    if (status.PresenterLocation == LOCAL) {
      try { debug(1, `ComoType1 evalAudio: LOCAL presenter, route non-presentation -> farend, ids=[${nonPresentationIds.join(', ')}]`); } catch (e) {}
      if (nonPresentationIds.length > 0) {
        this.devices.audiooutputgroups.farend.forEach(aog => { aog.connectSpecificRemoteInputs(nonPresentationIds); });
      }
      // Ensure non-presentation are not in presentation group
      if (nonPresentationIds.length > 0) {
        this.devices.audiooutputgroups.presentation.forEach(aog => { aog.disconnectSpecificRemoteInputs(nonPresentationIds); });
      }
    }
    else {
      try { debug(1, `ComoType1 evalAudio: REMOTE presenter, route non-presentation -> presentation, ids=[${nonPresentationIds.join(', ')}]`); } catch (e) {}
      if (nonPresentationIds.length > 0) {
        this.devices.audiooutputgroups.presentation.forEach(aog => { aog.connectSpecificRemoteInputs(nonPresentationIds); });
        this.devices.audiooutputgroups.farend.forEach(aog => { aog.disconnectSpecificRemoteInputs(nonPresentationIds); });
      }
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
    //console.error(status);
    const setDisplaysRole = (displays, role) => {
      if (status.AutoDisplays == ON) {

      }
      displays.forEach(display => {
        xapi.Config.Video.Output.Connector[display.config.connector].MonitorRole.set(role);
      });
    };

    const setMonitors = (monitors) => {
      if (status.AutoDisplays == ON) {
        xapi.Config.Video.Monitors.set(monitors);
      }
    };

    const powerOffDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          display.off();
        });
      }
    };

    const powerOnDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          display.on();
        });
      }
    };

    const blankDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          display.setBlanking(true);
        });
      }
    };

    const unblankDisplays = (displays) => {
      if (status.AutoDisplays == ON) {
        displays.forEach(display => {
          display.setBlanking(false);
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

    const matrixRemoteToDisplay = (display) => {
      if (status.AutoDisplays == ON) {
        display.forEach(disp => {
          if (disp.config.skipVideoMatrix) return;
          try {
            xapi.Command.Video.Matrix.Assign({
              Mode: 'Replace',
              Output: disp.config.connector,
              RemoteMain: 1
            });
          } catch (e) {
            // Video Matrix might not be supported
          }
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


    
    //With permanent displays for presentation

    if (permanentDisplays) {
      if (needClearZone) {
        //Permanent displays + Clear zone
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('1');
          zapi.system.setStatus('comotype1Mode', 1);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          blankDisplays(presentationDisplays);
          powerOffDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('2');
          zapi.system.setStatus('comotype1Mode', 2);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == REMOTE) {
          //console.error('3');
          zapi.system.setStatus('comotype1Mode', 3);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, SECOND);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && !presentationActive) {
          //console.error('4');
          zapi.system.setStatus('comotype1Mode', 4);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixCurrentMainVideoToDisplay(farendDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('5');
          zapi.system.setStatus('comotype1Mode', 5);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays.filter(disp => disp.config.alwaysUse));
          blankDisplays(presentationDisplays.filter(disp => !disp.config.alwaysUse));
          matrixCurrentMainVideoToDisplay(farendDisplays);
        }
      }
      //Permanent displays + NO clear zone
      else {
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('6');
          zapi.system.setStatus('comotype1Mode', 6);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          blankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('7');
          zapi.system.setStatus('comotype1Mode', 7);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == REMOTE) {
          //console.error('8');
          zapi.system.setStatus('comotype1Mode', 8);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, SECOND);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (remotePresenterPresent && !presentationActive) {
          //console.error('9');
          zapi.system.setStatus('comotype1Mode', 9);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixCurrentMainVideoToDisplay(farendDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('10');
          zapi.system.setStatus('comotype1Mode', 10);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          matrixCurrentMainVideoToDisplay(farendDisplays);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
        }
      }


    }




    //Without permanent displays for presentation
    else {
      //console.error('NO PRERMANENT DISPLAYS!');

      if (needClearZone) {
        //console.error('NEED CLEAR ZONE');
        //WITHOUT Permanent displays + Clear zone
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('11');
          zapi.system.setStatus('comotype1Mode', 11);
          setMonitors(DUALPRESENTATIONONLY);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, SECOND);
          powerOffDisplays(presentationDisplays);
          matrixBlankDisplay(presentationDisplays);
          matrixReset(farendDisplays);
        }
        else if (presentationActive && !remotePresenterPresent && presenterLocation == LOCAL) {
          //console.error('12');
          zapi.system.setStatus('comotype1Mode', 12);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          //powerOffDisplays(presentationDisplays);
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
          zapi.system.setStatus('comotype1Mode', 13);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          //powerOffDisplays(presentationDisplays);
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
          zapi.system.setStatus('comotype1Mode', 14);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          //powerOffDisplays(presentationDisplays);
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          }
          else {
            matrixBlankDisplay(presentationDisplays);
          }
          matrixCurrentMainVideoToDisplay(farendDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('15');
          zapi.system.setStatus('comotype1Mode', 15);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          //powerOffDisplays(presentationDisplays);
          if (presentationSupportsBlanking) {
            blankDisplays(presentationDisplays);
          }
          else {
            matrixBlankDisplay(presentationDisplays);
          }
          matrixCurrentMainVideoToDisplay(farendDisplays);
        }
      }
      //WITHOUT Permanent displays + NO clear zone
      else {
        //console.error('DOES NOT NEED CLEAR ZONE');
        if (!presentationActive && !remotePresenterPresent) {
          //console.error('16');
          zapi.system.setStatus('comotype1Mode', 16);
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
          zapi.system.setStatus('comotype1Mode', 17);
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
          zapi.system.setStatus('comotype1Mode', 18);
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
          zapi.system.setStatus('comotype1Mode', 19);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
          matrixCurrentMainVideoToDisplay(farendDisplays);
          matrixReset(presentationDisplays);
        }
        else if (remotePresenterPresent && presentationActive) {
          //console.error('20');
          zapi.system.setStatus('comotype1Mode', 20);
          setMonitors(SINGLE);
          setDisplaysRole(farendDisplays, FIRST);
          setDisplaysRole(presentationDisplays, FIRST);
          matrixCurrentMainVideoToDisplay(farendDisplays);
          powerOnDisplays(presentationDisplays);
          unblankDisplays(presentationDisplays);
        }
      }

    }
  }




  test() {

  }
}