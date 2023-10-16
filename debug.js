import xapi from 'xapi';

import { zapiv1 as zapi } from './zapi';
import { config } from './config';

export var Manifest = {
  fileName: 'debug',
  id: 'debug',
  friendlyName: 'Debug',
  version: '1.0.0',
  description: 'System wide debug'
};

export class Module {
  constructor(api) {

  }
  debug(level, text) {
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


};