import xapi from 'xapi';
import { config as systemconfig } from './config';
import { zapiv1 as zapi } from './zapi';
import { debug } from './debug';





export var Manifest = {
  fileName: 'mod_psacamcontrols',
  id: 'psacamcontrols',
  friendlyName: 'Contrôle de caméra personnalisé pour PSA', //Nom familier
  version: '1.0.0',
  description: `Contrôle le mainVideoSource et la position des caméras`
};


export class Module {
  constructor() {
    this.mainVideoSource = systemconfig.system.mainVideoSource;
    this.camToControl = systemconfig.system.mainVideoSource;
    this.panSpeed = systemconfig.mod_psacamcontrols_config.panSpeed;
    this.tiltSpeed = systemconfig.mod_psacamcontrols_config.tiltSpeed;
    this.zoomSpeed = systemconfig.mod_psacamcontrols_config.zoomSpeed;
  }
  start() {
    zapi.system.events.on('system_standby', () => {
      debug(1, `mod_psacamcontrols: Standby detected`);
      this.init();
    });

    this.init();
  }
  selectCamera(id) {

    id = id.toString();

    this.mainVideoSource = id;

    if (id.includes('+')) {
      xapi.Command.Video.Input.SetMainVideoSource({
        ConnectorId: id.split('+')
      });
    } else {
      xapi.Command.Video.Input.SetMainVideoSource({
        ConnectorId: id
      });
    }


  }
  stop() {
    xapi.Command.Camera.Ramp({
      CameraId: this.camToControl,
      Pan: 'Stop',
      Tilt: 'Stop',
      Zoom: 'Stop'
    });
  }
  pan(direction) {
    xapi.Command.Camera.Ramp({
      CameraId: this.camToControl,
      Pan: direction,
      PanSpeed: this.panSpeed
    });

  }
  tilt(direction) {
    xapi.Command.Camera.Ramp({
      CameraId: this.camToControl,
      Tilt: direction,
      TiltSpeed: this.tiltSpeed
    });
  }
  zoom(direction) {
    xapi.Command.Camera.Ramp({
      CameraId: this.camToControl,
      Zoom: direction,
      ZoomSpeed: this.zoomSpeed
    });
  }
  handleCamPositionButton(action) {
    if (action.Type == 'pressed') {
      if (action.Value == 'up' || action.Value == 'down') {
        this.tilt(action.Value);
      }
      else if (action.Value == 'left' || action.Value == 'right') {
        this.pan(action.Value);
      }

    }
    else if (action.Type == 'released') {
      this.stop();
    }
  }
  handleCamControlSelection(action) {
    this.camToControl = action.Value;
  }
  async init() {
    debug(1, `mod_psacamcontrols: Init()`);

    this.mainVideoSource = systemconfig.system.mainVideoSource;
    this.camToControl = systemconfig.system.mainVideoSource;

    this.selectCamera(this.mainVideoSource);
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: 'camselection',
      Value: this.mainVideoSource
    });

    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: 'camcontrolselection',
      Value: this.camToControl
    });

    xapi.Event.UserInterface.Extensions.Widget.Action.on(action => {
      if (action.WidgetId == 'camselection' && action.Type == 'pressed') {
        this.selectCamera(action.Value);
      }
      if (action.WidgetId == 'camposition' && action.Type == 'pressed') {
        this.handleCamPositionButton(action);
      }
      if (action.WidgetId == 'camposition' && action.Type == 'released') {
        this.stop();
      }
      if (action.WidgetId == 'camcontrolselection' && action.Type == 'pressed') {
        this.handleCamControlSelection(action);
      }
      if (action.WidgetId == 'camzoomout' && action.Type == 'pressed') {
        this.zoom('Out');
      }
      if (action.WidgetId == 'camzoomin' && action.Type == 'pressed') {
        this.zoom('In');
      }
      if (action.WidgetId == 'camzoomout' && action.Type == 'released') {
        this.stop();
      }
      if (action.WidgetId == 'camzoomin' && action.Type == 'released') {
        this.stop();
      }

    });
  }
}
