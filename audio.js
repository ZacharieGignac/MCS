import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

import { config1, config2 } from './audioconfigs';

const flatten = (arrs) => [].concat(...arrs);


export class Audio {
  constructor() {
    this.remoteLinks = [];
    this.applyFailure = 0;
    let self = this;
    zapi.audio.getLocalInputId = (name) => { return self.getLocalInputId(name); };
    zapi.audio.getLocalOutputId = (name) => { return self.getLocalOutputId(name); };
    zapi.audio.getRemoteInputsIds = () => { return self.getRemoteInputsIds(); };
    zapi.audio.getRemoteOutputIds = () => { return self.getRemoteOutputIds(); };
    zapi.audio.addAudioReportAnalyzer = (audioReporter) => { return new AudioReportAnalyzer(audioReporter); };
    zapi.audio.applyAudioConfig = (config, reset = false) => { return self.applyAudioConfig(config, reset) }

    xapi.Event.UserInterface.Extensions.Widget.Action.on(action => {
      if (action.Type == 'clicked') {
        if (action.WidgetId == 'aconfig1') {
          this.applyAudioConfig(config1);
        }
        else if (action.WidgetId == 'aconfig2') {
          this.applyAudioConfig(config2);
        }
      }
    });


  }

  getLocalInputId(name) {
    return new Promise((success, failure) => {
      xapi.Status.Audio.Input.LocalInput.get().then(li => {
        for (let i of li) {
          if (i.Name == name) {
            success(i.id);
          }
        }
        failure('LocalInput not found: ' + name);
      });
    });
  }

  getLocalOutputId(name) {
    return new Promise((success, failure) => {
      xapi.Status.Audio.Output.LocalOutput.get().then(lo => {
        for (let o of lo) {
          if (o.Name == name) {
            success(o.id);
          }
        }
        failure('LocalOutput not found: ' + name);
      });
    });
  }

  getRemoteInputsIds() {
    return new Promise((success, failure) => {
      var inputs = [];
      xapi.Status.Audio.Input.RemoteInput.get().then(ri => {
        for (let r of ri) {
          inputs.push(r.id);
        }
        if (inputs.length > 0) {
          success(inputs);
        }
        else {
          failure('No remote inputs found.');
        }
      });
    });
  }

  getRemoteOutputIds() {
    return new Promise((success, failure) => {
      var outputs = [];
      xapi.Status.Audio.Output.RemoteOutput.get().then(ro => {
        for (let r of ro) {
          outputs.push(r.id);
        }
        if (outputs.length > 0) {
          success(outputs);
        }
        else {
          failure('No remote output found.');
        }
      });
    });
  }

  getCurrentRemoteGroupsLinks() {
    return Promise.all([
      xapi.status.get('Audio Input LocalInput').catch(() => []),
      xapi.status.get('Audio Output LocalOutput').catch(() => []),
      xapi.status.get('Audio Output RemoteOutput').catch(() => [])
    ]).then(([inputGroups, outputGroups, remoteOutputGroups]) => {
      const localInputsIds = inputGroups.map((group) => group.id);
      const linksToRemoteOutputGroups = remoteOutputGroups.map((group) =>
        (group.Input || []).map((input) => ({
          inputGroupId: input.id,
          outputGroupId: group.id
        }))
      );
      const linksFromRemoteInputGroups = outputGroups.map((group) =>
        (group.Input || [])
          .map((input) => {
            if (!localInputsIds.includes(input.id)) {
              return {
                inputGroupId: input.id,
                outputGroupId: group.id
              };
            }
            return null;
          })
          .filter(Boolean)
      );
      this.remoteLinks = {
        linksFromRemoteInputGroups: flatten(linksFromRemoteInputGroups),
        linksToRemoteOutputGroups: flatten(linksToRemoteOutputGroups)
      };
      return this.remoteLinks;
    });
  }

  createLocalInputGroups(inputGroups) {
    return Promise.all(
      inputGroups.map((group) =>
        xapi
          .command('Audio LocalInput Add', {
            Name: group.name,
            InputId: group.id,
            MixerMode: group.settings.mixerMode,
            AGC: group.settings.agc,
            Mute: group.settings.mute,
            Channels: group.settings.channels,
            Direct: group.settings.direct
          })
          .catch((err) => {
            throw new Error(
              `Couldn't create LocalInput ${group.name}: ${err.message}`
            );
          })
      )
    );
  }

  createLocalOutputGroups(outputGroups) {
    return Promise.all(
      outputGroups.map((group) =>
        xapi
          .command('Audio LocalOutput Add', {
            Name: group.name,
            OutputId: group.id,
            AutoconnectRemote: group.settings.autoconnectRemote,
            Loudspeaker: group.settings.loudspeaker,
            Channels: group.settings.channels,
            VolumeControlled: group.settings.volumeControlled
          })
          .catch((err) => {
            throw new Error(
              `Couldn't create LocalOutput ${group.name}: ${err.message}`
            );
          })
      )
    );
  }

  createLinks(links, remote) {
    return Promise.all(
      flatten(
        links.map((link) =>
          xapi
            .command('Audio LocalOutput ConnectInput', {
              InputId: link.inputGroupId,
              OutputId: link.outputGroupId
            })
            .catch((err) => {
              throw new Error(
                `Couldn't create Link from group ${link.inputGroupId} to group ${link.outputGroupId}: ${err.message}`
              );
            })
        ),
        remote.linksFromRemoteInputGroups.map((link) =>
          xapi
            .command('Audio LocalOutput ConnectInput', {
              InputId: link.inputGroupId,
              OutputId: link.outputGroupId
            })
            .catch(() => { })
        ),
        remote.linksToRemoteOutputGroups.map((link) =>
          xapi
            .command(`Audio RemoteOutput ConnectInput`, {
              InputId: link.inputGroupId,
              OutputId: link.outputGroupId
            })
            .catch(() => { })
        )
      )
    );
  }

  updateGains(links) {
    return Promise.all(
      links.map((link) =>
        xapi
          .command('Audio LocalOutput UpdateInputGain', {
            InputId: link.inputGroupId,
            OutputId: link.outputGroupId,
            InputGain: link.gain
          })
          .catch((err) => {
            throw new Error(
              `Couldn't update gain from group ${link.inputGroupId} to group ${link.outputGroupId}: ${err.message}`
            );
          })
      )
    );
  }

  findConnector = (connectors, groupConnector) => {
    const connector = connectors.find((c) => c.id === groupConnector);
    return !connector
      ? groupConnector.split('.')
      : [connector.connectorType, connector.originalId];
  };

  generateConnector = (connectors, type, groupId) => (
    groupConnector
  ) => {
    const [connectorType, originalId] = this.findConnector(connectors, groupConnector);
    return xapi
      .command(`Audio Local${type} AddConnector`, {
        [`${type}Id`]: groupId,
        ConnectorType: connectorType,
        ConnectorId: originalId
      })
      .catch((err) => {
        throw new Error(
          `Couldn't generate Connector ${connectorType}.${originalId} in Group ${groupId}: ${err.message}`
        );
      });
  };

  assignLocalInputConnectors(config) {
    let self = this;
    return Promise.all(
      flatten(
        config.inputGroups.map((group) =>
          group.connectors.map(
            self.generateConnector(config.inputs, 'Input', group.id)
          )
        )
      )
    );
  }

  assignLocalOutputConnectors(config) {
    let self = this;
    return Promise.all(
      flatten(
        config.outputGroups.map((group) =>
          group.connectors.map(
            self.generateConnector(config.outputs, 'Output', group.id)
          )
        )
      )
    );
  }

  setupEqualizers(config) {
    return Promise.all(
      flatten(
        config.equalizers.map((equalizer) =>
          equalizer.sections.map((section) =>
            xapi.command('Audio Equalizer Update', {
              EqualizerId: equalizer.id,
              Section: section.id,
              Enabled: section.enabled,
              FilterType: section.filterType,
              Frequency: section.frequency,
              Gain: section.gain,
              Q: section.q
            })
          )
        )
      )
    );
  }

  async applyConfig(config) {
    let self = this;



    return new Promise(async (success, failure) => {
      debug(1, `AudioConfig: Getting current remote groups links`);
      await self.getCurrentRemoteGroupsLinks();
      debug(1, `AudioConfig: Clearing current config`);
      xapi.Command.Audio.Setup.Clear();
      debug(1, `AudioConfig: Creating local input groups`);
      await self.createLocalInputGroups(config.inputGroups);
      debug(1, `AudioConfig: Creating local output groups`);
      await self.createLocalOutputGroups(config.outputGroups);
      debug(1, `AudioConfig: Creating links`);
      await self.createLinks(config.links, this.remoteLinks);
      debug(1, `AudioConfig: Updating gains`);
      await self.updateGains(config.links);
      debug(1, `AudioConfig: Assigning local input connectors`);
      await self.assignLocalInputConnectors(config);
      debug(1, `AudioConfig: Assigning local output connectors`);
      await self.assignLocalOutputConnectors(config);
      debug(1, `AudioConfig: Setting up equalizers`);
      await self.setupEqualizers(config);

      success();
    });

  }

  async applyAudioConfig(config, reset = false) {
    return new Promise(async (success, failure) => {
      debug(1, `AudioConfig: Applying config...`);
      let startTime = new Date();
      await this.applyConfig(config);
      let endTime = new Date();
      let timeElapsed = endTime - startTime;
      debug(1, `AudioConfig: Config applied. Time: ${timeElapsed}ms`);


      let audioInputDevices = zapi.devices.getDevicesByType(zapi.devices.DEVICETYPE.AUDIOINPUT);

      for (let device of audioInputDevices) {
        if (reset) {
          device.reset();
        }
        else {
          device.refresh();
        }

      }

      success();
    });
  }


}




/*
xapi.Event.UserInterface.Extensions.Widget.Action.on(async action => {
  if (action.Type == 'clicked') {
    if (action.WidgetId == 'load1') {
      console.log('Applying config1');
      await applyConfig(xapi, config1);
    }
    else if (action.WidgetId == 'load2') {
      console.log('Applying config2');
      await applyConfig(xapi, config2);
    }
  }
});
*/

export class AudioReportAnalyzer {
  constructor(audioReporter) {
    this.audioReporter = audioReporter;
    this.audioReporter.onReport((report) => { this.reportReceived(report); });
    this.enabled = false;
    this.rawAnalysisCallbacks = [];
    this.loudestGroupAnalysisCallbacks = [];
    this.customAnalysisCallbacks = [];
    this.groups = [];
    this.lastAnalysisData = undefined;
  }
  start() {
    this.enabled = true;
  }
  stop() {
    this.enabled = false;
  }
  reportReceived(report) {

    this.lastAnalysisData = report;
    if (this.enabled) {


      //Process raw analysis callbacks
      for (let rac of this.rawAnalysisCallbacks) {
        rac(report);
      }


      //Find first group that contains the loudest input level
      var loudestReport = report;
      loudestReport.group = undefined;
      delete loudestReport.inputs;
      for (let group of this.groups) {
        if (group.inputs.includes(loudestReport.highInputId)) {
          loudestReport.group = group.group;
        }
      }

      for (let lga of this.loudestGroupAnalysisCallbacks) {
        if (loudestReport.highestSince >= lga.elapsed) {
          loudestReport.significant = loudestReport.highestAverageDiff > 0 ? true : false;
          lga.callback(loudestReport);
        }
      }


    }


  }
  addSingleGroup(group) {
    var newGroup = { group: group, inputs: [] };
    let inputDevices = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUT, group);
    for (let ai of inputDevices) {
      newGroup.inputs.push(ai.config.connector);
    }
    this.groups.push(newGroup);
  }
  addGroup(groups) {
    if (Array.isArray(groups)) {
      for (let group of groups) {
        this.addSingleGroup(group);
      }
    }
    else {
      this.addSingleGroup(groups);
    }
  }
  onRawAnalysis(callback) {
    this.rawAnalysisCallbacks.push(callback);
  }
  onLoudestGroup(elapsed, callback) {
    this.loudestGroupAnalysisCallbacks.push({ elapsed: elapsed, callback: callback });
  }
  onCustomAnalysis(filter, callback) {
    this.customAnalysisCallbacks.push({ filter: filter, callback: callback });
  }
}
