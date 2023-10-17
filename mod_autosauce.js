import xapi from 'xapi';

import { zapiv1 as zapi } from './zapi';
import { config as systemconfig } from './config';
import { debug } from './debug';

export var Manifest = {
  fileName: 'mod_autoSauce',
  id: 'autosauce',
  friendlyName: 'AutoSauce',
  version: '1.0.0',
  description: `Boost les microphones d'un groupe lorsque le niveau d'un autre groupe est faible`
};

export class Module {
  constructor() {
    this.boosts = [];
  }
  start() {
    for (let boost of systemconfig.mod_autosauce_config.boosts) {
      debug(1, `mod_autosauce: Adding boost for group ${boost.boost} when ${boost.silent} is silent.`);
      this.boosts.push(new Boost(boost.silent, boost.boost, boost.silentElapsed, boost.audioReporter));
    }
  }
};

class Boost {
  constructor(silentGroup, boostGroup, silentElapsed, audioReporter) {
    this.currentBoostMode = false;
    let ar = zapi.devices.getDevice(audioReporter);
    let ara = zapi.audio.addAudioReportAnalyzer(ar);
    let boostInputs = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUT, boostGroup);
    ara.addGroup([silentGroup, boostGroup]);
    ara.onLoudestGroup(silentElapsed, report => {
      if (report.group != silentGroup && report.highestSince > silentElapsed) {
        if (this.currentBoostMode == false) {
          this.currentBoostMode = true;
          boostInputs.forEach(input => {
            input.setBoost(true);
          });
        }
      }
      else {
        if (this.currentBoostMode == true) {
          this.currentBoostMode = false;
          boostInputs.forEach(input => {
            input.setBoost(false);
          });
        }

      }
    });



    ara.start();
  }
}