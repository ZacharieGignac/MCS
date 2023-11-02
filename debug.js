import { config as systemconfig } from './config';

export function debug(level, text) {
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