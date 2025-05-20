# MCS
"MODULAR CONTROL SYSTEM". Original.

## v1.2.0 (developement)
### Bugs connus

### Ajouts / Modifications
* Ajout du driver `AudioInput_aes67` pour les sources AES67 (Celine Mic Pro, Table Mic Pro, etc...)
* Retrait du type `ethernet` dans la configuration d'un device de type `AudioInput_codecpro`  

## v1.1.0 (version actuelle)
### Bugs connus / limitation
* Support manquant pour les microphone Ceiling Microphone Pro et Table Microphone Pro

### Ajouts / Modifications
* Nouveau type de device, `AudioOutput`, qui permet de contrôler les sorties audio
* Nouveau type de driver, `AudioOutputDriver_codecpro` qui permet de contrôler les sorties audio sur un codec pro, utilisé par le driver `AudioOutput`
* MCS rapporte maintenant sa version dans Webex Control Hub, en ajoutant un faux périphérique nommé "MCS", avec une valeur avec la nommenclature "mcs-x.x.x"
* Structure `zapi.telemetry` pour supporter la télémétrie
* Module `mod_telemetry` en example pour un module de télémétrie complexe
* Propriété `supportsSystemStatus` <true/false> et `systemStatusRequestInterval` pour les devices de type DISPLAY 
* Propriété `supportsFilterStatus` <true/false> et `filterStatusRequestInterval` pour les devices de type DISPLAY
* Modification majeure de `Display`, `DisplayDriver_serial_sonybpj`, `DisplayDriver_serial_epson`, `DisplayDriver_serial_panasonic` pour pemettre la télémétrie (si disponible), la communication avec le display en mode asynchrone
* `DisplayDriver_serial_sonybpj` supporte maintenant la communication avec le projecteur pour obtenir les informations suivantes: Statut du projecteur, statut du filtre, nombre d'heures de la lampe
* `DisplayDriver_serial_epson` supporte maintenant la communication avec le projecteur pour obtenir les informations suivantes: Statut du projecteur, nombre d'heures de la lampe
* `DisplayDriver_serial_panasonic` supporte maintenant la communication avec le projecteur pour obtenir les informations suivantes: Statut du projecteur (incluant filtre), nombre d'heure de la lampe

### Bugfix
* Arrangé le contrôle de gain et de mute sur les entrées `AudioInput` de type `HDMI` ou `Ethernet`
* Arrangé quelques nesting qui empêchent le transpiler de restaurer un backup (core, mod_cafeine)
* La mise en veille n'est plus bloquée lorsque la session est fermée par l'utilisateur et qu'une présentation ou un appel est actif
* Gestion de l'alimentation CEC (`DisplayDriver_CEC`) qui s'assure d'allumer les affichages CEC lorsqu'ils sont requis
* Ajouté .gitignore pour les fichiers de metadata de MacOS


## v1.0.1
### Bugs connus
* Pour une raison encore inconnue, le message de PresenterTrack peut être affiché même lorsque le système n'est pas en appel ou en mode hdmiPassthrough. Une tentative de correction est appliquée dans cette version.

### Ajouts / Modification
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