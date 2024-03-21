import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';


export class Audio {
  constructor() {
    let self = this;
    zapi.audio.getLocalInputId = (name) => { return self.getLocalInputId(name); };
    zapi.audio.getLocalOutputId = (name) => { return self.getLocalOutputId(name); };
    zapi.audio.getRemoteInputsIds = () => { return self.getRemoteInputsIds(); };
    zapi.audio.getRemoteOutputIds = () => { return self.getRemoteOutputIds(); };
    zapi.audio.addAudioReportAnalyzer = (audioReporter) => { return new AudioReportAnalyzer(audioReporter); };
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
}




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
