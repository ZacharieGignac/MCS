import xapi from 'xapi';


export var zapiv1 = {
  test: undefined,
  devices: {
    getDevice: () => { },
    getAllDevices: () => { },
    getDevicesByType: () => { },
    getDevicesByTypeInGroup: () => { },
    activateCameraPreset: (presetId) => { },
    DEVICETYPE: {
      CONTROLSYSTEM: 'CONTROLSYSTEM',
      DISPLAY: 'DISPLAY',
      CAMERAPRESET:'CAMERAPRESET',
      VIDEOOUTPUT: 'VIDEOOUTPUT',
      AUDIOINPUT: 'AUDIOINPUT',
      AUDIOOUTPUT: 'AUDIOOUTPUT',
      SCREEN: 'SCREEN',
      LIGHT: 'LIGHT',
      LIGHTSCENEMGR: 'LIGHTSCENEMGR',
      SHADE:'SHADE',
      CAMERA: 'CAMERA',
      AUDIOSTAT: 'AUDIOSTAT',
      HID: 'HID',
      TERMINALEMULATION: 'TERMINALEMULATION',
      VIRTUAL:'VIRTUAL',
      CUSTOM: 'CUSTOM'
    }
  },
  groups: {
    getGroup: () => { },
    getAllGroups: () => { }
  },
  scenarios: {
    getScenarios: () => { },
    enableScenario: () => { },
    enablePreviousScenario: () => { },
    getPreviousScenario: () => { }
  },
  modules: {

  },
  system: {
    endSession: () => { },
    setStatus: () => { },
    getStatus: () => { },
    getAllStatus: () => { },
    onStatusChange: () => { },
    onStatusKeyChange: () => { },
    enablePresenterTrackWarnings: () => { },
    disablePresenterTrackWarnings: () => { },
    sendMessage:() => { }
  },
  performance: {
    setElapsedStart: () => { },
    setElapsedEnd: () => { },
    inc: () => { },
    dec: () => { }
  },
  ui: {
    addActionMapping: () => { },
    addWidgetMapping: () => { },
    setWidgetValue: () => { },
    getAllWidgets: () => { }
  }
}