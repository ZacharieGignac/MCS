import xapi from 'xapi';
import { config } from './config';
import { zapiv1 } from './zapi';

var zapi = zapiv1;

function debug(level, text) {
  if (config.system.debugLevel != 0 && level >= config.system.debugLevel) {
    switch (level) {
      case 1:
        console.log(text);
        break;
      case 2:
        console.warn(text);
        break;
      case 3:
        console.error(text);
        break;
    }

  }
}

export class Modules {
  constructor() {
    let self = this;
    zapi.modules.isModuleAvailable = (id) => { return self.isModuleAvailable(id) };
    zapi.modules.getModule = (id) => { return self.getModule(id) };
  }
  init() {
    return new Promise((success, failure) => {
      debug(1, `Module manager started!`)
      this.modules = [];
      for (let mod of config.modules) {
        debug(1, `Loading module "${mod.Manifest.id}" version ${mod.Manifest.version} (${mod.Manifest.description})`);
        this.modules.push({
          module: mod,
          inst: new mod.Module()
        });
      }
      debug(1, `Finished loading ${this.modules.length} modules.`);
      success();
    });
  }
  getModule(id) {
    return (this.modules.filter(mod => mod.module.Manifest.id == id)[0].inst);
  }
  isModuleAvailable(id) {
    return (this.modules.filter(mod => mod.module.Manifest.id == id).length > 0 ? true : false);
  }
}