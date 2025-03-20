/* jshint esversion:8 */
import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';

export class Modules {
  constructor() {
    let self = this;
    //TAG:ZAPI
    zapi.modules.isModuleAvailable = (id) => { return self.isModuleAvailable(id); };
    zapi.modules.getModule = (id) => { return self.getModule(id); };
  }
  init() {
    return new Promise((success, failure) => {
      debug(2, `Module manager started`);
      this.modules = [];
      for (let mod of systemconfig.modules) {
        debug(1, `Loading module "${mod.Manifest.id}" version ${mod.Manifest.version} (${mod.Manifest.description})`);
        this.modules.push({
          module: mod,
          inst: new mod.Module()
        });
      }
      debug(2, `Finished loading ${this.modules.length} modules.`);
      zapi.system.events.emit('system_modules_init');
      success();
    });
  }
  getModule(id) {
    return (this.modules.filter(mod => mod.module.Manifest.id == id)[0].inst);
  }
  isModuleAvailable(id) {
    return (this.modules.filter(mod => mod.module.Manifest.id == id).length > 0 ? true : false);
  }
  start() {
    for (let module of this.modules) {
      try {
        module.inst.start();
      }
      catch (e) { }
    }
  }
}