//Importation de xapi pour intéragir avec le codec
import xapi from 'xapi';

//Importation de zapi version 1
import { zapiv1 as zapi } from './zapi';


//Le manifest est une variable exportée décrivant le module
export var Manifest = {
  fileName: 'mod_example',  //Nom du fichier
  id: 'example',  //Identification unique
  friendlyName: 'Exemple de module', //Nom familier
  version: '1.0.0', //Version
  description: `Un exemple de module qui ajoute une function test() en tant que zapi.test` //Description
};

//Le module est une classe exportée qui sera instanciée au début du processus de démarrage du système
export class Module {
  constructor() {
    zapi.test = this.test; //Assigne une nouvelle function à zapi
  }
  //Appelé lorsque le module est démarré
  start() {
    console.log(`Module example a démarré!`);
  }
  //Function qui sera ajoutée à zapi
  test(mytext) {
    xapi.Command.UserInterface.Message.Prompt.Display({
      title:'Message test',
      text:mytext
    });
  }
}