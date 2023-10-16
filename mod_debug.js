import xapi from 'xapi';

import { zapiv1 as zapi } from './zapi';
import { config as systemconfig } from './config';

export var Manifest = {
  fileName: 'mod_debug',
  id: 'mod_debug',
  friendlyName: 'Debug',
  version: '1.0.0',
  description: 'System wide debug'
};

export class Module {
  constructor() {
    
  }
  debug(level, text) {
    if (systemconfig.system.debugLevel != 0 && level >= systemconfig.system.debugLevel) {
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


};