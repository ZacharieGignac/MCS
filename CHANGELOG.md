# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.3.0-dev] - En cours
### Ajouts / Modifications
- Scénario `sce_como_type2` : nouvelle version évoluée du scénario Comodale Type 1 avec support de groupes d'affichages supplémentaires (télésouffleur, affichages secondaires de présentation) et gestion fine des modes d'affichage. Voir `docs/Manual-ComoType2.md` pour la documentation complète.
- Documentation complète des nouveaux drivers audio introduits en v1.2.0 : `AudioInputDriver_aes67`, `AudioOutputDriver_aes67`, `AudioInputDriver_usb`, `AudioOutputDriver_usb`, et `AudioInputDriver_codeceq`
- Nouveau manuel `docs/Manual-ComoType2.md` documentant le scénario Comodale Type 2, ses différences avec le Type 1, les nouveaux groupes d'affichages, et les configurations avancées
- Nouveau driver `USBSerialDriver` pour devices de type `SoftwareDevice` : communication série USB générique avec gestion automatique de la configuration du port série, file d'attente des commandes, et pacing entre les envois. Supporte les méthodes `send()`, `sendRaw()`, et `reset()`. Documentation complète dans `docs/Manual-Devices.md`.

### Bugfix

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

## [1.1.0] - 2025-??-??
Voir README pour le détail de cette version antérieure.

## [1.0.1]
Détails historiques conservés dans README.

---
Format inspiré de Keep a Changelog. Les numéros suivent semver: MAJEUR.MINEUR.PATCH.
