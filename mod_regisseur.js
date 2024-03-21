import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';

const CAMERAS =
{
  cam1: {
    id: 'reg_cam1',
    sourceId: 1,
    defaultSelection: 'reg_cam1_preset_auditoire',
    selections: [
      {
        widgetId: `reg_cam1_preset_auditoire`,
        presetId: `Auditoire`
      },
      {
        widgetId: `reg_cam1_preset_jure`,
        presetId: `Juré`
      },
      {
        widgetId: `reg_cam1_preset_wide`,
        presetId: `Plan large arrière`
      }
    ]
  },
  cam2: {
    id: 'reg_cam2',
    sourceId: 2,
    defaultSelection: 'reg_cam2_preset_presenter',
    selections: [
      {
        widgetId: `reg_cam2_preset_presenter`,
        presetId: `Présentateur`
      },
      {
        widgetId: `reg_cam2_preset_tableau`,
        presetId: `Tableau`
      },
      {
        widgetId: `reg_cam2_preset_wide`,
        presetId: `Plan large avant`
      }
    ]
  },


  both: {
    id: 'reg_camboth'
  }
}

const MODES = {
  CAM1: 'CAM1',
  CAM2: 'CAM2',
  BOTH: 'BOTH'
}

const DEFAULT_REG_ENABLED = 'on';
const DEFAULT_MODE = MODES.CAM1;
const WIDGET_REG_ENABLED = 'reg_enabled';
const WIDGET_CAM_SELECTION = 'reg_cam_selection';
const WIDGET_CAM1_SELECTION = 'reg_cam1_selection';
const WIDGET_CAM2_SELECTION = 'reg_cam2_selection';
const ON = 'on';
const OFF = 'off';





export var Manifest = {
  fileName: 'mod_regisseur',
  id: 'regisseur',
  friendlyName: 'Régisseur',
  version: '1.0.0-beta',
  description: `Mode régisseur pour PSA1724 (soutenance de thèse)`
};


export class Module {
  constructor() {

  }
  setCamSelection(mode) {
    var lastMode = this.currentMode;
    console.log(`mode=${mode}`);
    switch (mode) {
      case MODES.CAM1:
        zapi.ui.setWidgetValue(WIDGET_CAM_SELECTION, CAMERAS.cam1.id);
        this.currentMode = MODES.CAM1;
        break;
      case MODES.CAM2:
        zapi.ui.setWidgetValue(WIDGET_CAM_SELECTION, CAMERAS.cam2.id);
        this.currentMode = MODES.CAM2;
        break;
      case MODES.BOTH:
        zapi.ui.setWidgetValue(WIDGET_CAM_SELECTION, CAMERAS.both.id);
        this.currentMode = MODES.BOTH;
        break;
    }
    if (this.currentMode != lastMode) {
      this.updateVideoMatrix();
    }
  }

  setCam1Selection(selection) {
    this.cam1selection = selection;
    let presetName = this.getPresetName(1, selection);
    zapi.devices.activateCameraPreset(presetName);
  }

  setCam2Selection(selection) {
    this.cam2selection = selection;
  }

  setRegMode(mode) {
    this.regenabled = mode;
    zapi.ui.setWidgetValue(WIDGET_REG_ENABLED, mode);
  }

  updateVideoMatrix() {
    if (this.regenabled == ON) {
      console.log(`Current cam mode is ${this.currentMode}`);
      console.log('Updating video matrix');

      if (this.currentMode == MODES.BOTH) {
        //xapi.Command.Video.Matrix.Reset();
        xapi.Command.Video.Matrix.Assign({
          Layout: 'Equal',
          Mode: 'Replace',
          Output: 1,
          SourceId: [CAMERAS.cam1.sourceId, CAMERAS.cam2.sourceId]
        });
      }
      else if (this.currentMode == MODES.CAM1) {
        //xapi.Command.Video.Matrix.Reset();
        xapi.Command.Video.Matrix.Assign({
          Layout: 'Equal',
          Mode: 'Replace',
          Output: 1,
          SourceId: [1]
        });
      }

      else if (this.currentMode == MODES.CAM2) {
        //xapi.Command.Video.Matrix.Reset();
        xapi.Command.Video.Matrix.Assign({
          Layout: 'Equal',
          Mode: 'Replace',
          Output: 1,
          SourceId: [2]
        });
      }

    }


  }


  getPresetName(camera, id) {
    console.log(`Searching for CAM=${camera}, ID=${id}`);
    let cam;
    if (camera == 1) {
      cam = CAMERAS.cam1;
    }
    else {
      cam = CAMERAS.cam2;
    }

    console.log(cam);

    for (let selection of cam.selections) {
      if (selection.widgetId == id) {
        return selection.presetId;
      }
    }
    throw new Error('Preset ID not found in config.');
  }

  start() {
    console.error(`REGISSEUR STARTING`);
    this.widgetCamSelection = zapi.ui.addWidgetMapping(WIDGET_CAM_SELECTION);
    this.widgetRegEnabled = zapi.ui.addWidgetMapping(WIDGET_REG_ENABLED);
    this.widgetCam1Selection = zapi.ui.addWidgetMapping(WIDGET_CAM1_SELECTION);
    this.widgetCam2Selection = zapi.ui.addWidgetMapping(WIDGET_CAM2_SELECTION);


    this.setRegMode(DEFAULT_REG_ENABLED);
    this.setCamSelection(DEFAULT_MODE);
    this.setCam1Selection(CAMERAS.cam1.defaultSelection);
    this.setCam2Selection(CAMERAS.cam2.defaultSelection);


    zapi.system.events.on('system_wakup', () => {
      console.error(`Wake up event detected.`);
      setTimeout(() => {
        this.updateVideoMatrix();
      }, 3000);
    });


    this.widgetCamSelection.on('pressed', (event) => {
      console.log(`Widget mode changed to ${event}`);
      switch (event) {
        case 'reg_cam1':
          this.setCamSelection(MODES.CAM1);
          break;
        case 'reg_cam2':
          this.setCamSelection(MODES.CAM2);
          break;
        case 'reg_camboth':
          this.setCamSelection(MODES.BOTH)
          break;
      }
    });

    this.widgetCam1Selection.on('pressed', (event) => {
      this.setCam1Selection(event);
    });










  }

}