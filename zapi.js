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
      AUDIOINPUTGROUP: 'AUDIOINPUTGROUP',
      AUDIOOUTPUTGROUP: 'AUDIOOUTPUTGROUP',
      SCREEN: 'SCREEN',
      LIGHT: 'LIGHT',
      LIGHTSCENE: 'LIGHTSCENE',
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
    resetSystemStatus: () => { },
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
  audio:{
    getLocalInputId: () => { },
    getLocalOutputId: () => { },
    getRemoteInputsIds: () => { }
  },
  ui: {
    addActionMapping: () => { },
    addWidgetMapping: () => { },
    setWidgetValue: () => { },
    getAllWidgets: () => { }
  }
}