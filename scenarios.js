/* jshint esversion:8 */
import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';


export class Scenarios {
  constructor() {
    this.uiPanels = [];
    this.scenariosLibrary = [];
    zapi.performance.setElapsedStart('Scenarios.init');
    this.currentScenario = undefined;
    this.previousScenario = undefined;

    zapi.system.setStatus('currentScenario', undefined, false);
    var self = this;

    //TAG:ZAPI
    zapi.scenarios.enableScenario = (id) => { self.enableScenario(id); };
    zapi.scenarios.enablePreviousScenario = () => { self.enablePreviousScenario(); };
    zapi.scenarios.getPreviousScenario = () => { return this.previousScenario; };
    zapi.scenarios.getScenario = (id) => { return this.getScenario(id); };

    //Add scenarios-related auto-mapping

    zapi.ui.addActionMapping(/^ENABLESCENARIO$/, (id) => {
      self.enableScenario(id);
    });

    zapi.ui.addActionMapping(/^ENABLESCENARIOASK$/, () => {
      xapi.Command.UserInterface.Message.TextInput.Display({
        Duration: 0,
        FeedbackId: 'scenarios_enablescenario_ask',
        InputType: 'SingleLine',
        KeyboardState: 'Open',
        Placeholder: 'Scenario Id',
        Title: 'Enable scenario',
        Text: 'Entrez le "id" du scénario à activer'
      });
    });

    xapi.Event.UserInterface.Message.TextInput.Response.on(event => {
      if (event.FeedbackId == 'scenarios_enablescenario_ask') {
        this.enableScenario(event.Text);
      }
    });


    //Keep panels list
    xapi.Command.UserInterface.Extensions.List().then(list => {
      const panels = list.Extensions.Panel;
      for (let panel of panels) {
        this.uiPanels.push(panel.PanelId);
      }
    });

    debug(2, 'Scenarios Manager starting...');
    debug(1, `Loading ${systemconfig.scenarios.length} scenarios..`);
    for (let sce of systemconfig.scenarios) {
      let newScenario = {
        manifest: sce.Manifest,
        scenario: new sce.Scenario()
      };
      this.scenariosLibrary.push(newScenario);
      debug(1, `Scenario loaded: ${newScenario.manifest.friendlyName}, version ${newScenario.manifest.version}`);
    }
    debug(1, 'All scenarios loaded.');
    setTimeout(() => {
      this.enableScenario(systemconfig.system.onStandby.enableScenario);
    }, 1000);
    zapi.performance.setElapsedEnd('Scenarios.init');
    zapi.system.events.emit('system_scenarios_init');
  }

  getScenario(id) {
    return this.scenariosLibrary.filter(sce => { return sce.manifest.id == id })[0];
  }

  async enableScenario(id) {

    zapi.performance.setElapsedStart('Scenarios.enableScenario');
    var currManifest;
    var currScenario;
    var disableResult;
    this.previousScenario = this.currentScenario;
    debug(1, `EnableScenario request. Current scenario is "${this.currentScenario}", requested scenario is "${id}"`);
    if (this.currentScenario != id) {
      var match = this.scenariosLibrary.filter(sce => { return sce.manifest.id == id });
      if (match.length > 1) {
        debug(3, `SCENARIOS ERROR!!! More than one scenario use id "${id}". No scenario will be enabled.`);
      }
      else {
        currManifest = match[0].manifest;
        // Disabling current scenario
        if (this.currentScenario == undefined) {
          debug(1, `No scenario loaded. Enabling default scenario: ${id}`);
          currScenario = undefined;
          disableResult = true;
        }
        else {
          debug(1, `Disabling current scenario: ${this.currentScenario}`);
          currScenario = this.getScenario(this.currentScenario).scenario;
          currScenario.enabled = false;
          disableResult = await currScenario.disable();
        }



        if (disableResult) {
          if (this.currentScenario != undefined) {
            debug(1, `Scenario "${this.currentScenario}" disable success!`);
          }

          let scenarioToEnable = this.getScenario(id).scenario;
          scenarioToEnable.enabled = true;
          let enableResult = await scenarioToEnable.enable();
          if (enableResult) {
            debug(1, `Scenario "${id}" enable success!`);

            this.currentScenario = id;
            zapi.system.setStatus('currentScenario', this.currentScenario);


            this.hidePanels(currManifest.panels.hide);
            this.showPanels(currManifest.panels.show);
            if (currManifest.features != undefined) {
              this.setupFeatures(currManifest.features);
            }


            debug(1, `Started scenario "${id}"`);
            scenarioToEnable.start();


          }
          else {
            debug(3, `Scenario "${id}" enable FAILURE!`);
          }
        }
        else {
          debug(3, `Scenario "${this.currentScenario}" disable FAILURE!`);
        }



      }
    }
    else {
      debug(1, `Can't enable scenario "${id}" because this scenario is already the current enabled scenario.`);
    }
    debug(1, `Current scenario is: ${this.currentScenario}`);
    zapi.performance.setElapsedEnd('Scenarios.enableScenario');

  }

  enablePreviousScenario() {
    if (this.previousScenario != undefined) {
      this.enableScenario(this.previousScenario);
    }
  }

  hideAllPanels(force = false) {
    zapi.performance.setElapsedStart('Scenarios.hideAllPanels');
    for (let panel of this.uiPanels) {
      if ((!panel.startsWith('*') || force) && panel != '') {
        debug(1, `Hiding panel ${panel}`);
        xapi.Command.UserInterface.Extensions.Panel.Update({
          PanelId: panel,
          Visibility: 'Hidden'
        });
      }

    }
    zapi.performance.setElapsedEnd('Scenarios.hideAllPanels');
  }

  hidePanels(panels) {
    zapi.performance.setElapsedStart('Scenarios.hidePanels');
    for (let panel of panels) {
      if (panel == '*') {
        debug(1, `Hiding all panels...`);
        this.hideAllPanels();
      }
      else if (panel == '**') {
        debug(1, `Hiding all panels... (force)`);
        this.hideAllPanels(true);
      }
    }
    zapi.performance.setElapsedEnd('Scenarios.hidePanels');
  }

  showPanels(panels) {
    zapi.performance.setElapsedStart('Scenarios.showPanels');
    for (let panel of panels) {
      debug(1, `Showing panel ${panel}`);
      if (panel != '') {
        xapi.Command.UserInterface.Extensions.Panel.Update({
          PanelId: panel,
          Visibility: 'Auto'
        });
      }

    }
    zapi.performance.setElapsedEnd('Scenarios.showPanels');
  }

  setupFeatures(features) {
    zapi.performance.setElapsedStart('Scenarios.setupFeatures');
    xapi.Config.UserInterface.Features.Call.CameraControls.set(features.cameraControls ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.End.set(features.endCallButton ? 'Auto' : 'Hidden');
    if (features.hdmiPassthrough || features.webcam) {
      xapi.Config.UserInterface.Features.Call.Webcam.set('Auto').catch(e => { });
      xapi.Config.UserInterface.Features.Call.HdmiPassthrough.set('Auto').catch(e => { });
    }
    else {

      xapi.Config.UserInterface.Features.Call.Webcam.set('Hidden').catch(e => { });
      xapi.Config.UserInterface.Features.Call.HdmiPassthrough.set('Hidden').catch(e => { });
    }
    xapi.Config.UserInterface.Features.Call.JoinWebex.set(features.joinWebex ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.JoinGoogleMeet.set(features.joinGoogleMeet ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.JoinZoom.set(features.joinZoom ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.Keypad.set(features.keypad ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.LayoutControls.set(features.layoutControls ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.MidCallControls.set(features.midCallControls ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.MusicMode.set(features.musicMode ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.ParticipantList.set(features.participantList ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.SelfviewControls.set(features.selfviewControls ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Share.Start.set(features.shareStart ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.Start.set(features.start ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.VideoMute.set(features.videoMute ? 'Auto' : 'Hidden');
    xapi.Config.UserInterface.Features.Call.JoinMicrosoftTeamsCVI.set(features.joinMicrosoftTeamsCVI ? 'Auto' : 'Hidden');
    zapi.performance.setElapsedEnd('Scenarios.setupFeatures');
  }
}

