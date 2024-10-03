import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi';

export var Manifest = {
  fileName: 'mod_autogrid',  //Nom du fichier
  id: 'autogrid',  //Identification unique
  friendlyName: 'Auto Grid Layout On Call', //Nom familier
  version: '1.0.0', //Version
  description: `Utilise automatiquement le mode "grille" lors d'un appel` //Description
};

export class Module {
  constructor() {

  }
  
  start() {
    xapi.Event.CallSuccessful.on(call => {
      setTimeout(() => {
        xapi.Command.Video.Layout.SetLayout({ LayoutName: 'Grid' });
      }, 10);
    });
  }
}