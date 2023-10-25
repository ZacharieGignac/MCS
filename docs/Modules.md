# Modules
Les modules sont des parties de code qui seront exécutés dans le même processus que le système.

Ceci permet au module d'intéragir avec "zapi" et avec les devices.

Voici un exemple simple de module qui ajoute une function "test()" à zapi. Cette function est donc disponible par n'importe quel partie du système, que ce soit un autre module, un device, un scénario, etc...

```JS
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
```

Le module doit être importé dans la configuration du système (`config.js`) de cette façon:
```JS
import * as mod_example from './mod_example';
```
L'alias d'importation doit être ajoutée au array `modules[]` dans la configuration du système de cette façon:
```JS
  modules: [
    mod_example
  ],
```

La nouvelle function peut donc être appelée de cette facon: `zapi.test('Mon texte ici');`
