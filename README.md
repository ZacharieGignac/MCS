# MCS
"MODULAR CONTROL SYSTEM". Original.

## Statut
Version actuelle: 1.0.0

## Installation (pour une salle comodale de type 1)
* Activer AudioConsole
* Activer httpclient
* Copier les fichiers suivants sur le codec:
* * audio.js
  * communication.js
  * core.js
  * debug.js
  * devices.js
  * devicesLibrary.js
  * driversLibrary.js
  * modules.js
  * scenarios.js
  * systemstatus.js
  * utils.js
  * zapi.js
  * sce_standby.js
  * sce_comotype1.js
* Renommer le fichier config.js.example en config.js et le copier sur le codec
* Ajuster le fichier config.js selon les besoins
* Activer le fichier `ce-audio-config` et `core`


## Version dévelopement (pas de release)
* Ajout du module `mod_cafeine`: Empêche les affichages d'être éteint si l'affichage supporte le "blanking". Accélère l'allumage des affichages, mais peut diminuer la durée de vie des équipements
* Bugfix: Activation de la scène d'éclairage lors du mode veille