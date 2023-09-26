import xapi from 'xapi';

export var Manifest = {
  fileName: 'telemetry',
  id: 'telemetry',
  friendlyName: 'Telemetry',
  version: '1.0.0',
  description: 'Télémétrie SSE'
};

export class Module {
  constructor(api) {
    this.api = api;
  }
  
  test() {
    console.log('test from module');
  }
};