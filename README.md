# MCS
"MODULAR CONTROL SYSTEM". Original.

## v1.2.0 (developement)
### Bugs connus

### Ajouts / Modifications
* Drivers série (Sony, Panasonic, Epson): support des paramètres `pacing`, `repeat`, `timeout` avec valeurs par défaut, gestion d'erreurs centralisée et logs "debouncés".
* Sony (DisplayDriver_serial_sonybpj): logique de répétition basée sur l'accusé de réception. Les commandes `power` et `blank`/`unblank` sont renvoyées au `repeat` jusqu'à réception d'un « ok », puis arrêt des renvois pour cet état.
* Sony (DisplayDriver_serial_sonybpj): journalisation TX/RX détaillée (ligne envoyée et réponse brute), détection « ok » robuste (espaces, guillemets, caractères de contrôle).
* Sony (DisplayDriver_serial_sonybpj): file d'attente nettoyée pour éviter les collisions lors des bascules rapides `blank`/`unblank` ou `power on/off` (priorise l'état le plus récent).
* Sony (DisplayDriver_serial_sonybpj): si la voie RX n'est pas câblée (TX uniquement), le driver continue d'envoyer au `repeat` (comportement intentionnel).
* AES67: nouveaux drivers `AudioInputDriver_aes67` et `AudioOutputDriver_aes67` (gain par canal, entrées/sorties 1-6 et canaux 1-8).
* `AudioInput_codecpro`: retrait du type `ethernet` (utiliser AES67 dédié).
* `sce_comotype1`: support de `skipVideoMatrix: true` pour les `DISPLAY`.
* SystemStatus: `Occupancy` est initialisé automatiquement à `undefined`; `PresenterDetected` est désormais injecté automatiquement (à ne plus définir dans la config).
* Action mapping: nouvelle action `SETSS$key,value` pour écrire un SystemStatus.
* Messages XAPI: prise en charge de `MCSACTION$ACTION,VALUE` et `MCSACTIONS$ACTION,VALUE&ACTION,VALUE` (multiples actions).
* Raccourci admin: 5 désactivations successives du mute micro ouvrent le panneau `system_admin`.
* Widget admin: nouveau widget `system_admin` avec double fonctionnalité:
  - Appui court: affiche les informations système dans une boîte de dialogue "Informations système" (version, uptime, statut d'appel, BYOD, localisation présentateur, détection présentateur, scénario actuel, mode comotype1)
  - Appui long (5 secondes): ouvre le panneau d'administration
* Watchdog: nouvelle macro `watchdog.js` pour surveiller le core (voir Watchdog ci-dessous).
* Audio (sce_como_type1): routage des entrées distantes selon leur rôle. Les entrées avec rôle `Presentation` vont toujours vers `system.presentation.main`; les autres suivent `PresenterLocation`.
* API Audio: `zapi.audio.getRemoteInputsDetailed()` expose `{ id, role, callId, streamId }`.
* Devices/AudioOutputGroup: ajout de `connectSpecificRemoteInputs(ids)` et `disconnectSpecificRemoteInputs(ids)`.
* Journaux: logs audio/scénarios simplifiés et structurés (rôles, ids) pour le diagnostic.
* **BYOD unifié**: nouveau statut `byod` avec détection automatique HDMI.Passthrough (anciens systèmes) ou Webcam (nouveaux). Les scénarios avec `features.byod: true` activent automatiquement les UI features pertinentes.
* Gestion des erreurs (robustesse):
  - Bus d'événements: `SystemEvents.emit` protège chaque écouteur (sync/async) via try/catch, un handler défaillant ne bloque plus les autres.
  - UI Action mappings: exécution des handlers protégée (try/catch) et capture des rejets asynchrones.
  - Messages internes: le dispatcher des messages `MCSACTION$...` / `MCSACTIONS$...` est encapsulé (regex + exécution) pour éviter les erreurs au niveau global.
  - Communication: la file d'envoi de messages (`MessageQueue`) journalise les erreurs de `xapi.Command.Message.Send` et continue toujours la file.
  - Stockage: `Storage.read/write/del/resetStorage` sont entourés de try/catch; en cas d'erreur, un log est émis et l'exécution se poursuit.

### Bugfix
* `sce_standby`: unmute correct des micros à l'activation.
* UI LightScenes: l'auto-lumière n'est plus forcée à OFF lors d'interactions de widgets s'il ne faut pas.
* LightSceneDriver_gc_itachflex / ScreenDriver_gc_itachflex: séquençage HTTP asynchrone pour éviter les timings incorrects en cas de latence.
* core: `setPresenterLocation` met à jour SystemStatus avec validation (`local`, `remote`).
* core: Killswitch GPIO protégé par garde et try/catch quand non configuré.
* core/SystemStatus/UI: `PresenterDetected` converti en booléen avant mise à jour (fini l'erreur "Switch expects a value: <on/off>").
* modules: `getModule(id)` retourne `undefined` et journalise au lieu de planter.
* scenarios: `enableScenario(id)` gère IDs dupliqués/introuvables, protège `panels`/`features`, émet `system_scenario_enable_failed`.
* devices: `getDevicesInGroup` et `getDevicesByTypeInGroup` ignorent groupes/devices introuvables.
* core (audio.extra): gardes null/undefined sur groupes d'entrées/sorties supplémentaires.
* core: `toBool` robuste pour valeurs non-string.

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