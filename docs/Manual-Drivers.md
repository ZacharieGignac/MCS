# Drivers

## Table des matières
- [Tridonic](#tridonic)
  - [Tridonic_DALIBM](#tridonic_dalibm)
  - [LightDriver_TridonicDALI](#lightdriver_tridonicdali)
- [Sharp](#sharp)
  - [DisplayDriver_serial_sharp](#displaydriver_serial_sharp)

Ce document décrit les drivers disponibles dans `driversLibrary.js` et leur configuration.

## Tridonic

### Tridonic_DALIBM
Driver de passerelle pour l'interface Tridonic DALI via port série. Ce driver est responsable de la communication avec le matériel Tridonic.

* **Device Class**: `SoftwareDevice`
* **Configuration**:
  * `port`: (number) Le port série du codec utilisé (défaut: 1). Le driver configure automatiquement le port à 19200 baud, 8N1.

**Exemple de configuration:**
```javascript
{
  id: 'gateway.dali',
  type: DEVICETYPE.SOFTWAREDEVICE,
  device: devicesLibrary.SoftwareDevice,
  driver: driversLibrary.Tridonic_DALIBM,
  name: 'Tridonic DALI Gateway',
  port: 1
}
```

### LightDriver_TridonicDALI
Driver pour contrôler une zone d'éclairage DALI via la passerelle `Tridonic_DALIBM`.

* **Device Class**: `Light`
* **Configuration**:
  * `gatewayId`: (string) L'ID du device `Tridonic_DALIBM` à utiliser.
  * `zone`: (number) L'adresse de zone DALI (0-15) ou adresse courte (0-254) selon la configuration DALI (Note: le code utilise la valeur telle quelle).

**Exemple de configuration:**
```javascript
{
  id: 'light.zone1',
  type: DEVICETYPE.LIGHT,
  name: 'Zone 1',
  device: devicesLibrary.Light,
  driver: driversLibrary.LightDriver_TridonicDALI,
  gatewayId: 'gateway.dali',
  zone: 1,
  supportsPower: true,
  supportsDim: true,
  defaultPower: 'off',
  defaultDim: 100
}
```

## Sharp

### DisplayDriver_serial_sharp
Driver pour écrans Sharp contrôlés via RS-232.

* **Device Class**: `Display`
* **Configuration**:
  * `port`: (number) Le port série du codec utilisé (défaut: 1). Le driver configure automatiquement le port à 9600 baud, 8N1.
  * `pacing`: (number) Délais en ms entre l'envoi de deux commandes (défaut: 300).

**Fonctionnalités supportées:**
* Alimentation (Power On/Off)
* Blanking (Mute vidéo)
* Activation automatique du contrôle série (`RSPW0001`) au démarrage
* *Note: Le changement de source n'est pas implémenté.*

**Note importante :**
Si le système utilise un écran Sharp, celui-ci doit être **allumé** avant de démarrer MCS pour la première fois. MCS tentera de configurer l'écran pour activer la communication série (commande `RSPW0001`). Si l'écran n'est pas sous tension à ce moment, ce paramètre ne sera pas appliqué et le contrôle pourrait ne pas fonctionner (notamment si le mode éco désactive le port série en veille).

**Exemple de configuration:**
```javascript
{
  id: 'display.projector',
  type: DEVICETYPE.DISPLAY,
  name: 'Projecteur',
  device: devicesLibrary.Display,
  driver: driversLibrary.DisplayDriver_serial_sharp,
  port: 1,
  pacing: 500
}
```
