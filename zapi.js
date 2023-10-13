import xapi from 'xapi';


export var zapiv1 = {
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
      AUDIOREPORTER:'AUDIOREPORTER',
      SCREEN: 'SCREEN',
      LIGHT: 'LIGHT',
      LIGHTSCENE: 'LIGHTSCENE',
      SHADE:'SHADE',
      CAMERA: 'CAMERA',
      AUDIOSTAT: 'AUDIOSTAT',
      HID: 'HID',
      SOFTWAREDEVICE:'SOFTWAREDEVICE'
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
    sendMessage:() => { },
    systemReport:{},
    sendSystemReport:() => {}
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