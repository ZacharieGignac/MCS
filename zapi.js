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
      SOFTWAREDEVICE:'SOFTWAREDEVICE'
    }
  },
  scenarios: {
    getScenarios: () => { },
    enableScenario: () => { },
    enablePreviousScenario: () => { },
    getPreviousScenario: () => { }
  },
  modules: {
    isModuleAvailable: () => { },
    getModule: () => { }
  },
  system: {
    resetSystemStatus: () => { },
    endSession: () => { },
    setStatus: () => { },
    getStatus: () => { },
    getAllStatus: () => { },
    onStatusChange: () => { },
    onStatusKeyChange: () => { },
    systemReport:{},
    sendSystemReport:() => {},
    events:{
      on: () => {},
      off: () => {},
      emit: () => {}
    }
  },
  performance: {
    setElapsedStart: () => { },
    setElapsedEnd: () => { },
    inc: () => { },
    dec: () => { },
    reset: () => { }
  },
  audio:{
    getLocalInputId: () => { },
    getLocalOutputId: () => { },
    getRemoteInputsIds: () => { },
    getRemoteOutputIds: () => { },
    addAudioReportAnalyzer: () => { },
    applyAudioConfig: () => { }
  },
  ui: {
    addActionMapping: () => { },
    addWidgetMapping: () => { },
    setWidgetValue: () => { },
    getAllWidgets: () => { },
    showProgressBar: () => { }
  },
  storage: {
    read:() => {},
    write:() => {},
    list:() => {},
    del:() => {},
    resetStorage:() => {}
  },
  communication: {
    httpClient:() => {},
    sendMessage:() => {}
  },
  telemetry:{
    available:false,
    dailyReport:{},
    sessionReport:{},
    send:(data) => {}
  },
  obj2string:() => {}
}