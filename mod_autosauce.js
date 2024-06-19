/* jshint esversion:8 */
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
    let self = this;
    let devicesLoaded = zapi.system.events.on('system_devices_init', () => {
      for (let boost of systemconfig.mod_autosauce_config.boosts) {
        debug(1, `mod_autosauce: Adding boost for group ${boost.boost} when ${boost.silent} is silent.`);
        self.boosts.push(new Boost(boost.silent, boost.boost, boost.silentElapsed, boost.diffLevel, boost.audioReporter));
      }
    });
  }
}

class Boost {
  constructor(silentGroup, boostGroup, silentElapsed, diffLevel, audioReporter) {
    this.currentBoostMode = false;
    let ar = zapi.devices.getDevice(audioReporter);
    let ara = zapi.audio.addAudioReportAnalyzer(ar);
    let boostInputs = zapi.devices.getDevicesByTypeInGroup(zapi.devices.DEVICETYPE.AUDIOINPUT, boostGroup);
    ara.addGroup([silentGroup, boostGroup]);
    ara.onLoudestGroup(silentElapsed, report => {
      if (systemconfig.mod_autosauce_config.calibration) {
        console.log(`Diff: ${report.highestLowestDiff} / ${diffLevel}, Elapsed: ${report.highestSince} / ${silentElapsed}`);
      }
      if (report.group != silentGroup && report.highestSince > silentElapsed && report.highestLowestDiff < diffLevel) {
        if (this.currentBoostMode == false) {
          this.currentBoostMode = true;
          boostInputs.forEach(input => {
            input.setBoost(true);
          });
        }
      }
      else if (report.group == silentGroup && report.highestSince > silentElapsed && report.highestLowestDiff > diffLevel) {

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
