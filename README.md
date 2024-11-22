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


# En dévelopement
## Bugs connus
* Pour une raison encore inconnue, le message de PresenterTrack peut être affiché même lorsque le système n'est pas en appel ou en mode hdmiPassthrough. Une tentative de correction est appliquée dans cette version.

## Ajouts
* Module `mod_cafeine`: Empêche les affichages d'être éteint si l'affichage supporte le "blanking". Accélère l'allumage des affichages, mais peut diminuer la durée de vie des équipements
* Nouveau widget mapping pour les devices de type `Light` pour afficher le pourcentage dans un label. Syntaxe: `my.light.id:LEVEL%`
* Ajout du driver de toile motorisée `ScreenDriver_gc_itachflex` pour contrôle à partir d'un module "Global Caché iTach Flex" + "Relay Flex Cable"
* Ajout du driver de scène d'éclairage `LightSceneDriver_gc_itachflex` pour contrôle à partir d'un module "Global Caché iTach Flex" + "Relay Flex Cable"

## Bugfix
* L'Activation de la scène d'éclairage lors du mode veille ne s'effectue pas
* Modification de la méthode de détection des appels (Idle, Connected)
* Retirer le message de PresenterTrack quand le système n'est pas en appel ou en mode hdmiPassthrough
* Les requètes HTTP au travers `zapi.communication.httpClient` n'envoyaient pas de "body" dans la requête. Il faut utiliser la propriété `Body` dans les paramêtres de la requête.
