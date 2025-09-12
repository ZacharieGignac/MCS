# MCS
"MODULAR CONTROL SYSTEM". Original.

## v1.2.0 (developement)
### Bugs connus

### Ajouts / Modifications
* Ajout du support pour la configuration `pacing`, `repeat`, et `timeout` dans les drivers série (Sony, Panasonic, Epson) avec valeurs par défaut
* Ajout du driver `AudioInput_aes67` pour les sources AES67 (Celine Mic Pro, Table Mic Pro, etc...)
* Retrait du type `ethernet` dans la configuration d'un device de type `AudioInput_codecpro`
* Ajout du support pour la propriété `skipVideoMatrix:true` dans `sce_comotype1` pour les devices de type `DISPLAY``
* SystemStatus `Occupancy:undefined` automatiquement ajouté au status. Peut servir pour déclarer la présence dans la salle, mais le système ne le fait pas de base
* SystemStatus `PresenterDetected` retiré de la config, et est maintenant ajouté automatiquement
* Ajout de l'action `SETSS$key,value` pour définir un SystemStatus
* Ajout de la réception des messages texte `MCSACTION$ACTION,VALUE` et `MCSACTION$ACTION,VALUE&ACTION,VALUE` qui sont convertis en actions
* Unmuter 5 fois (avec le bouton mute) ouvre le panneau `system_admin``
* Nouveau macro séparé `watchdog.js` pour surveiller la santé du core (voir section Watchdog)
* Audio (sce_como_type1): Routage sélectif des entrées distantes selon leur rôle. Toute entrée distante avec rôle `Presentation` est désormais acheminée vers le groupe `system.presentation.main` (et jamais vers `system.farend.main`). Les autres entrées suivent la logique selon `PresenterLocation`.
* API Audio: Nouvelle méthode `zapi.audio.getRemoteInputsDetailed()` renvoyant la liste des entrées distantes avec leurs rôles (`[{ id, role, callId, streamId }]`).
* Devices/AudioOutputGroup: Nouvelles méthodes `connectSpecificRemoteInputs(ids)` et `disconnectSpecificRemoteInputs(ids)` pour un routage ciblé des entrées distantes.
* Journaux: Logs audio et scenario simplifiés et structurés (comptes, rôles, ids) pour faciliter le diagnostic.
* **BYOD unifié**: Nouveau statut `byod` compatible automatiquement avec HDMI.Passthrough (anciens systèmes) et Webcam (nouveaux systèmes). Les scénarios avec `byod: true` activent automatiquement les UI features appropriées selon le système.

### Bugfix
* Les microphones sont maintenant unmuté lors de l'activation du scénario sce_standby
* Le statut d'éclairage automatique ne se met pas à OFF lorsqu'on intéragit avec un bouton de scène d'éclairage
* LightSceneDriver_gc_itachflex: Les requêtes HTTP ne se font pas de façon synchrone, ce qui peut entrainer un mauvais timing en cas de latence réseau
* ScreenDriver_gc_itachflex: Les requêtes HTTP ne se font pas de façon synchrone, ce qui peut entrainer un mauvais timing enc as de latence réseau
* core: `setPresenterLocation` appelait une fonction inexistante. La méthode met maintenant à jour `SystemStatus` avec validation des valeurs (`local`, `remote`).
* core: Killswitch GPIO: l'écouteur était enregistré même si `killswitchGPIO` n'était pas défini. Ajout d'une garde et d'un try/catch pour éviter les plantages.
* core/SystemStatus/UI: `PresenterDetected` est désormais converti en booléen avant mise à jour, évitant l'erreur "Switch expects a value: <on/off>".
* modules: `getModule(id)` gère maintenant le cas module introuvable (retourne `undefined` et journalise) au lieu de provoquer un crash.
* scenarios: `enableScenario(id)` gère les IDs dupliqués/introuvables, protège l'accès aux `panels`/`features` et émet `system_scenario_enable_failed` avec une raison.
* devices: `getDevicesInGroup` et `getDevicesByTypeInGroup` gèrent les groupes introuvables et ignorent les devices non définis.
* drivers (Display série Sony/Epson): gestion d'erreurs centralisée et logs "debouncés"; plus d'"Unhandled promise rejection TIMEOUT" quand le projecteur est débranché.
* core (audio.extra): vérifications null/undefined sur les groupes d'entrées/sorties audio supplémentaires pour éviter les exceptions lors des connexions/déconnexions.
* core: `toBool` accepte maintenant des valeurs non-string en toute sécurité.

## Watchdog
Un macro séparé `watchdog.js` agit comme chien de garde pour vérifier que le core fonctionne et répondre dans des délais raisonnables.

### Principe
- Le watchdog envoie un message texte XAPI (`MCS_WD_PING`).
- Le core répond immédiatement avec (`MCS_WD_PONG`) même durant l'attente de cold boot.
- Le watchdog attend un PONG pendant 15 secondes.
- Après 3 tentatives consécutives sans réponse (3 minutes), le watchdog redémarre le moteur de macros.

### Détails
- Délai initial avant le premier ping: 1 minute.
- Fréquence: 1 ping par minute.
- Seuil de redémarrage: 3 PING sans PONG.
- Redémarrage: `xapi.Command.Macros.Runtime.Restart()`.

### Déploiement
- Installer `watchdog.js` comme macro séparée (distincte de `core`).
- Aucun paramètre requis; les constantes par défaut sont:
  - PING: `MCS_WD_PING`
  - PONG: `MCS_WD_PONG`
  - Délai initial: 60s, Intervalle: 60s, Attente PONG: 15s, Échecs avant restart: 3


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