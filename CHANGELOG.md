# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.3.0-dev] - En cours
### Ajouts / Modifications
- Nouveau driver Sharp : `DisplayDriver_serial_sharp` pour le contrôle d'écrans via RS-232 (Power, Blanking). Envoi automatique de `RSPW0001` à l'initialisation.
- `LightSceneDriver_lights` : Support des tableaux d'IDs pour contrôler plusieurs lumières avec les mêmes paramètres dans une scène.
- Nouveaux drivers Tridonic DALI : `Tridonic_DALIBM` (passerelle série) et `LightDriver_TridonicDALI` (contrôle d'éclairage). Documentation disponible dans `docs/Manual-Drivers.md`.
- Nouveau manuel `docs/Manual-Drivers.md` pour documenter les drivers spécifiques et leur configuration.
- Mise à jour de `docs/README.md` pour inclure le lien vers le manuel des drivers.
- Scénario `sce_como_type2` : Réécriture majeure et simplification. Passage de 20 à 12 modes de fonctionnement (`CLEARZONE.1-6` et `NORMAL.1-6`). Gestion dynamique des affichages permanents intégrée aux modes. Amélioration de la logique de basculement et de la stabilité.
- Scénario `sce_como_type2` : Extension du mécanisme de debouncing aux commandes d'alimentation et de blanking des affichages pour une meilleure stabilité visuelle.
- Scénario `sce_como_type2` : Suppression du fallback vers la configuration système pour `enableStateEvaluationDebounce`. Ce paramètre doit désormais être défini spécifiquement dans l'objet `sce_como_type2` de la configuration.
- Scénario `sce_como_type1` et `sce_como_type2` : Ajout d'un mécanisme de "Probe" (sondage) pour détecter l'arrivée tardive des flux audio de présentation distants et appliquer le routage intelligent.
- Scénario `sce_como_type2` : nouvelle version évoluée du scénario Comodale Type 1 avec support de groupes d'affichages supplémentaires (télésouffleur, affichages secondaires de présentation) et gestion fine des modes d'affichage. Voir `docs/Manual-ComoType2.md` pour la documentation complète.
- Documentation complète des nouveaux drivers audio introduits en v1.2.0 : `AudioInputDriver_aes67`, `AudioOutputDriver_aes67`, `AudioInputDriver_usb`, `AudioOutputDriver_usb`, et `AudioInputDriver_codeceq`
- Nouveau manuel `docs/Manual-ComoType2.md` documentant le scénario Comodale Type 2, ses différences avec le Type 1, les nouveaux groupes d'affichages, et les configurations avancées
- Nouveau driver `USBSerialDriver` pour devices de type `SoftwareDevice` : communication série USB générique avec gestion automatique de la configuration du port série, file d'attente des commandes, et pacing entre les envois. Supporte les méthodes `send()`, `sendRaw()`, et `reset()`. Documentation complète dans `docs/Manual-Devices.md`.
- Configuration `system.defaultPipPosition` : permet de définir la position par défaut du PIP (Picture-in-Picture) lors de l'utilisation du layout "Overlay". Valeurs possibles : `UpperLeft`, `UpperCenter`, `UpperRight`, `CenterLeft`, `CenterRight`, `LowerLeft`, `LowerRight`. Supporté par les scénarios `sce_como_type1` et `sce_como_type2`.

### Bugfix
- core: Protection try-catch pour `Video.Output.HDMI.Passthrough.Stop()` lors de la fermeture de session et de la mise en veille pour éviter les erreurs sur les systèmes ne supportant pas cette fonctionnalité.

## [1.2.1] - 2025-11-25
### Ajouts / Modifications
- devices/Display: les écrans avec `supportsBlanking: false` n'envoient plus de commandes de blanking, même si `blankBeforePowerOff` est configuré à `true`.

### Bugfix

## [1.2.0] - 2025-11-10
### Ajouts / Modifications
- Flux de mise à jour UI (`system_update`) avec sélection de dossier/fichier, pagination et confirmation explicite (Provisioning.Service.Fetch).
- Drivers série (Sony, Panasonic, Epson): nouveaux paramètres `pacing`, `repeat`, `timeout`, gestion d'erreurs centralisée, logs optimisés.
- Sony (DisplayDriver_serial_sonybpj): nouvelle logique de répétition sur accusé de réception, nettoyage de file, journalisation détaillée, robustesse RX non câblé.
- Nouveaux drivers audio: `AudioInputDriver_aes67`, `AudioOutputDriver_aes67`, `AudioInputDriver_usb`, `AudioOutputDriver_usb`.
- Nouveau driver `AudioInputDriver_codeceq` pour codecs EQ/Bar/Board.
- Retrait du type `ethernet` dans `AudioInput_codecpro` (utiliser AES67 dédié).
- `sce_comotype1`: support de `skipVideoMatrix: true` pour les `DISPLAY`.
- SystemStatus: initialisation automatique de `Occupancy`; injection automatique de `PresenterDetected`.
- Action mapping: nouvelle action `SETSS$key,value` et action message persistante `MSG:title,text`.
- Messages XAPI: support `MCSACTION$ACTION,VALUE` et `MCSACTIONS$ACTION,VALUE&ACTION,VALUE`.
- Raccourci admin (mute micro x5) ouvrant panneau `system_admin`.
- Nouveau widget/panneau administrateur `system_admin` (appui court info système, appui long administration).
- Watchdog macro séparée (`watchdog.js`).
- Audio scénario como_type1: routage intelligent des entrées distantes par rôle.
- API Audio: `zapi.audio.getRemoteInputsDetailed()` expose `{ id, role, callId, streamId }`.
- Devices/AudioOutputGroup: méthodes `connectSpecificRemoteInputs(ids)` / `disconnectSpecificRemoteInputs(ids)`.
- Journaux audio/scénarios simplifiés (rôles, ids).
- Statut BYOD unifié avec détection HDMI.Passthrough/Webcam selon génération système.
- Robustesse accrue (events, UI action mappings, dispatcher MCSACTIONS, queue message, storage try/catch).

### Corrections
- `sce_standby`: unmute correct des micros à l'activation.
- UI LightScenes: plus de forçage OFF inopiné.
- LightSceneDriver_gc_itachflex / ScreenDriver_gc_itachflex: séquençage HTTP asynchrone.
- core: `setPresenterLocation` validation et mise à jour SystemStatus.
- core: Killswitch GPIO protégé (garde + try/catch).
- core/SystemStatus/UI: booléen `PresenterDetected` évite erreur "Switch expects a value".
- modules: `getModule(id)` retourne `undefined` proprement.
- scenarios: `enableScenario(id)` gère IDs dupliqués/introuvables + événement d'échec.
- devices: `getDevicesInGroup`, `getDevicesByTypeInGroup` ignorent groupes/devices introuvables.
- core (audio.extra): gardes null/undefined sur groupes d'entrées/sorties supplémentaires.
- core: `toBool` robuste pour valeurs non-string.

## Mises à jour logicielles (UI)

À partir de la version 1.2.0, MCS intègre un flux de mise à jour directement depuis l'interface utilisateur RoomOS.

**Accès:** Appuyer sur le bouton UI `system_update`.

**Parcours:**
1. Choisir un « système » (dossier) listé sous `releases/` du dépôt GitHub.
2. Choisir un fichier dans ce système. L'interface propose jusqu'à 4 éléments par page; utilisez « Suivant » pour paginer, « Fermer » pour quitter.
3. Confirmer: une boîte de dialogue demande si vous êtes absolument certain d'appliquer la mise à jour sélectionnée (système + fichier).
4. Application: en cas de confirmation, le périphérique lance la commande xAPI `Provisioning Service Fetch` avec l'URL de téléchargement du fichier choisi. Selon le package, le périphérique peut redémarrer ou appliquer les changements automatiquement.

**Notes:**
- Les textes des invites respectent les contraintes xAPI (pas de retours à la ligne bruts; utilisation de `<br>`).
- Les listes utilisent des boutons d'options (max 5 avec le bouton de pagination/Laisser), pas d'HTML libre.
- L'URL de téléchargement est résolue depuis GitHub (`download_url`) ou, à défaut, construite via `raw.githubusercontent.com` sur la branche `main`.
- Ce flux ne filtre pas encore par extension; si nécessaire, ne proposez que des archives `.zip` dans vos dossiers `releases/<systeme>/`.

**Dépannage:**
- « Impossible d'accéder à GitHub »: vérifier la connectivité Internet et les proxys du périphérique.
- « Aucun système trouvé »: assurez-vous que le dossier `releases/` du dépôt contient des sous-dossiers.
- « Aucun fichier disponible pour le système »: placez les fichiers d'update dans `releases/<systeme>/`.

## Watchdog

Un macro séparé `watchdog.js` agit comme chien de garde pour vérifier que le core fonctionne et répond dans des délais raisonnables.

**Principe:**
- Le watchdog envoie un message texte XAPI (`MCS_WD_PING`).
- Le core répond avec (`MCS_WD_PONG`) une fois l'initialisation du core terminée (le répondeur est enregistré post-init).
- Le watchdog attend un PONG pendant 15 secondes.
- Après 3 tentatives consécutives sans réponse (3 minutes), le watchdog redémarre le moteur de macros.

**Détails:**
- Délai initial avant le premier ping (pendant le boot): 10 minutes.
- Après réception du premier PONG, la fréquence passe à 1 ping par minute.
- Fenêtre d'attente de PONG: 15 secondes.
- Seuil de redémarrage: 3 PING consécutifs sans PONG.
- Redémarrage exécuté via `xapi.Command.Macros.Runtime.Restart()`.

**Déploiement:**
- Installer `watchdog.js` comme macro séparée (distincte de `core`).
- Aucun paramètre requis; les constantes par défaut sont:
  - PING: `MCS_WD_PING`
  - PONG: `MCS_WD_PONG`
  - Délai initial: 60s, Intervalle: 60s, Attente PONG: 15s, Échecs avant restart: 3

## [1.1.0] - 2025-??-??
### Bugs connus / limitation
- Support manquant pour les microphone Ceiling Microphone Pro et Table Microphone Pro

### Ajouts / Modifications
- Nouveau type de device, `AudioOutput`, qui permet de contrôler les sorties audio
- Nouveau type de driver, `AudioOutputDriver_codecpro` qui permet de contrôler les sorties audio sur un codec pro, utilisé par le driver `AudioOutput`
- MCS rapporte maintenant sa version dans Webex Control Hub, en ajoutant un faux périphérique nommé "MCS", avec une valeur avec la nommenclature "mcs-x.x.x"
- Structure `zapi.telemetry` pour supporter la télémétrie
- Module `mod_telemetry` en exemple pour un module de télémétrie complexe
- Propriété `supportsSystemStatus` <true/false> et `systemStatusRequestInterval` pour les devices de type DISPLAY
- Propriété `supportsFilterStatus` <true/false> et `filterStatusRequestInterval` pour les devices de type DISPLAY
- Modification majeure de `Display`, `DisplayDriver_serial_sonybpj`, `DisplayDriver_serial_epson`, `DisplayDriver_serial_panasonic` pour permettre la télémétrie (si disponible), la communication avec le display en mode asynchrone
- `DisplayDriver_serial_sonybpj` supporte maintenant la communication avec le projecteur pour obtenir les informations suivantes: Statut du projecteur, statut du filtre, nombre d'heures de la lampe
- `DisplayDriver_serial_epson` supporte maintenant la communication avec le projecteur pour obtenir les informations suivantes: Statut du projecteur, nombre d'heures de la lampe
- `DisplayDriver_serial_panasonic` supporte maintenant la communication avec le projecteur pour obtenir les informations suivantes: Statut du projecteur (incluant filtre), nombre d'heure de la lampe

### Bugfix
- Corrigé le contrôle de gain et de mute sur les entrées `AudioInput` de type `HDMI` ou `Ethernet`
- Corrigé quelques nesting qui empêchent le transpiler de restaurer un backup (core, mod_cafeine)
- La mise en veille n'est plus bloquée lorsque la session est fermée par l'utilisateur et qu'une présentation ou un appel est actif
- Gestion de l'alimentation CEC (`DisplayDriver_CEC`) qui s'assure d'allumer les affichages CEC lorsqu'ils sont requis
- Ajouté .gitignore pour les fichiers de metadata de MacOS

## [1.0.1]
### Bugs connus
- Pour une raison encore inconnue, le message de PresenterTrack peut être affiché même lorsque le système n'est pas en appel ou en mode hdmiPassthrough. Une tentative de correction est appliquée dans cette version.

### Ajouts / Modification
- Module `mod_cafeine`: Empêche les affichages d'être éteint si l'affichage supporte le "blanking". Accélère l'allumage des affichages, mais peut diminuer la durée de vie des équipements
- Module `mod_autogrid`: Configure automatiquement la conférence en mode "grille" à la connexion
- Nouveau widget mapping pour les devices de type `Light` pour afficher le pourcentage dans un label. Syntaxe: `my.light.id:LEVEL%`
- Ajout du driver de toile motorisée `ScreenDriver_gc_itachflex` pour contrôle à partir d'un module "Global Caché iTach Flex" + "Relay Flex Cable"
- Ajout du driver de scène d'éclairage `LightSceneDriver_gc_itachflex` pour contrôle à partir d'un module "Global Caché iTach Flex" + "Relay Flex Cable"
- Ajout du feature "Webcam" dans le manifest d'un scénario pour les codecs EQ et BarPro (au lieu de hdmiPassthrough)

### Bugfix
- L'Activation de la scène d'éclairage lors du mode veille ne s'effectue pas
- Modification de la méthode de détection des appels (Idle, Connected)
- Retrait du message de PresenterTrack quand le système n'est pas en appel ou en mode hdmiPassthrough
- Les requêtes HTTP au travers `zapi.communication.httpClient` n'envoyaient pas de "body" dans la requête. Il faut utiliser la propriété `Body` dans les paramètres de la requête.
- Désactivation automatique du mode hdmipassthrough lors de la fermeture de session
- Désactivation automatique du mode hdmipassthrough dans le scénario standby

---

## [1.1.0] - 2025-??-??
Voir README pour le détail de cette version antérieure.

## [1.0.1]
Détails historiques conservés dans README.

---
Format inspiré de Keep a Changelog. Les numéros suivent semver: MAJEUR.MINEUR.PATCH.
