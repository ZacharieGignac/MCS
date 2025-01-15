# MCS
"MODULAR CONTROL SYSTEM". Original.

# Statut
Version actuelle: 1.0.1

## v1.0.1
### Bugs connus
* Pour une raison encore inconnue, le message de PresenterTrack peut être affiché même lorsque le système n'est pas en appel ou en mode hdmiPassthrough. Une tentative de correction est appliquée dans cette version.

### Ajouts
* Module `mod_cafeine`: Empêche les affichages d'être éteint si l'affichage supporte le "blanking". Accélère l'allumage des affichages, mais peut diminuer la durée de vie des équipements
* Module `mod_autogrid`: Configure automatiquement la conférence en mode "grille" à la connexion
* Nouveau widget mapping pour les devices de type `Light` pour afficher le pourcentage dans un label. Syntaxe: `my.light.id:LEVEL%`
* Ajout du driver de toile motorisée `ScreenDriver_gc_itachflex` pour contrôle à partir d'un module "Global Caché iTach Flex" + "Relay Flex Cable"
* Ajout du driver de scène d'éclairage `LightSceneDriver_gc_itachflex` pour contrôle à partir d'un module "Global Caché iTach Flex" + "Relay Flex Cable"
* Ajout du feature "Webcam" dans le manifest d'un scénario pour les codecs EQ et BarPro (au lieu de hdmiPassthrough)

### Bugfix
* L'Activation de la scène d'éclairage lors du mode veille ne s'effectue pas
* Modification de la méthode de détection des appels (Idle, Connected)
* Retirer le message de PresenterTrack quand le système n'est pas en appel ou en mode hdmiPassthrough
* Les requètes HTTP au travers `zapi.communication.httpClient` n'envoyaient pas de "body" dans la requête. Il faut utiliser la propriété `Body` dans les paramêtres de la requête.
* Désactivation automatique du mode hdmipassthrough lors de la fermeture de session
* Désactivation automatique du mode hdmipassthrough dans le scénario standby



## v1.1.0 (En dévelopement)
### Bugs connus
* aucun

### Ajouts
* Ajout d'un nouveau type de device, `AudioOutput`, qui permet de contrôler les sorties audio
* Ajout d'un nouveau type de driver, `AudioOutputDriver_codecpro` qui permet de contrôler les sorties audio sur un codec pro, utilisé par le driver `AudioOutput`
  
### Bugfix
* Arrangé le contrôle de gain et de mute sur les entrées `AudioInput` de type `HDMI` ou `Ethernet`
