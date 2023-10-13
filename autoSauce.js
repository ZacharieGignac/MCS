import xapi from 'xapi';

import { zapiv1 } from './zapi';
import { config } from './config';

var zapi = zapiv1;

export var Manifest = {
  fileName: 'autoSauce',
  id: 'autosauce',
  friendlyName: 'Auditoire extra sauce!',
  version: '1.0.0',
  description: `Boost les microphones d'un groupe lorsque le niveau d'un autre groupe est faible`
};

export class Module {
  constructor(api) {

  }



};