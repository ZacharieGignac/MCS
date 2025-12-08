# Drivers

## Table des matières
- [Tridonic](#tridonic)
  - [Tridonic_DALIBM](#tridonic_dalibm)
  - [LightDriver_TridonicDALI](#lightdriver_tridonicdali)
- [Sharp](#sharp)
  - [DisplayDriver_serial_sharp](#displaydriver_serial_sharp)
- [Sony](#sony)
  - [DisplayDriver_serial_sonybpj](#displaydriver_serial_sonybpj)
- [Panasonic](#panasonic)
  - [DisplayDriver_serial_panasonic](#displaydriver_serial_panasonic)
- [Epson](#epson)
  - [DisplayDriver_serial_epson](#displaydriver_serial_epson)
- [Audio](#audio)
  - [AudioInputDriver_codecpro](#audioinputdriver_codecpro)
  - [AudioInputDriver_codeceq](#audioinputdriver_codeceq)
  - [AudioInputDriver_aes67](#audioinputdriver_aes67)
  - [AudioInputDriver_usb](#audioinputdriver_usb)
  - [AudioOutputDriver_codecpro](#audiooutputdriver_codecpro)
  - [AudioOutputDriver_aes67](#audiooutputdriver_aes67)
  - [AudioOutputDriver_usb](#audiooutputdriver_usb)
- [Autres Drivers](#autres-drivers)
  - [USBSerialDriver](#usbserialdriver)
  - [ScreenDriver_gpio](#screendriver_gpio)
  - [ScreenDriver_gc_itachflex](#screendriver_gc_itachflex)
  - [DisplayDriver_CEC](#displaydriver_cec)

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
  * `pacing`: (number) Délais en ms entre l'envoi de deux commandes (défaut: 100).
  * `repeat`: (number) Intervalle en ms pour la répétition des commandes d'état (défaut: 2000).
  * `timeout`: (number) Timeout de réponse en ms (Fixé à 200ms).
  * `debug`: (boolean) Active les logs détaillés TX/RX du port série lorsqu'à `true` (défaut: `false`).

**Fonctionnalités supportées:**
* Alimentation (Power On/Off)
* Blanking (Mute vidéo)
* Activation automatique du contrôle série (`RSPW0001`) au démarrage
* *Note: Le changement de source n'est pas implémenté.*
* *Note: Le driver n'attend pas de réponse de l'écran (Fire and Forget). Il attend 200ms après chaque envoi pour éviter de saturer le port, puis passe à la commande suivante.*

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

## Sony

### DisplayDriver_serial_sonybpj
Driver pour projecteurs Sony contrôlés via RS-232.

* **Device Class**: `Display`
* **Configuration**:
  * `port`: (number) Le port série du codec utilisé (1-4).
  * `pacing`: (number) Délais en ms entre l'envoi de deux commandes (défaut: 500).
  * `repeat`: (number) Intervalle en ms pour la répétition des commandes d'état (défaut: 2000).
  * `timeout`: (number) Timeout de réponse en ms (défaut: 100).

**Fonctionnalités supportées:**
* Alimentation (Power On/Off)
* Blanking (Mute vidéo)
* Heures de lampe (Usage Hours)
* Statut du filtre
* Statut système

**Exemple de configuration:**
```javascript
{
  id: 'display.sony',
  type: DEVICETYPE.DISPLAY,
  name: 'Projecteur Sony',
  device: devicesLibrary.Display,
  driver: driversLibrary.DisplayDriver_serial_sonybpj,
  port: 1,
  pacing: 500,
  repeat: 2000
}
```

## Panasonic

### DisplayDriver_serial_panasonic
Driver pour projecteurs Panasonic contrôlés via RS-232.

* **Device Class**: `Display`
* **Configuration**:
  * `port`: (number) Le port série du codec utilisé (1-4).
  * `pacing`: (number) Délais en ms entre l'envoi de deux commandes (défaut: 500).
  * `repeat`: (number) Intervalle en ms pour la répétition des commandes d'état (défaut: 2000).
  * `timeout`: (number) Timeout de réponse en ms (défaut: 100).

**Fonctionnalités supportées:**
* Alimentation (Power On/Off)
* Blanking (Mute vidéo)
* Heures de lampe (Usage Hours)
* Statut système

**Exemple de configuration:**
```javascript
{
  id: 'display.panasonic',
  type: DEVICETYPE.DISPLAY,
  name: 'Projecteur Panasonic',
  device: devicesLibrary.Display,
  driver: driversLibrary.DisplayDriver_serial_panasonic,
  port: 1
}
```

## Epson

### DisplayDriver_serial_epson
Driver pour projecteurs Epson contrôlés via RS-232.

* **Device Class**: `Display`
* **Configuration**:
  * `port`: (number) Le port série du codec utilisé (1-4).
  * `pacing`: (number) Délais en ms entre l'envoi de deux commandes (défaut: 500).
  * `repeat`: (number) Intervalle en ms pour la répétition des commandes d'état (défaut: 2000).
  * `timeout`: (number) Timeout de réponse en ms (défaut: 100).

**Fonctionnalités supportées:**
* Alimentation (Power On/Off)
* Blanking (Mute vidéo)
* Heures de lampe (Usage Hours)
* Statut système

**Exemple de configuration:**
```javascript
{
  id: 'display.epson',
  type: DEVICETYPE.DISPLAY,
  name: 'Projecteur Epson',
  device: devicesLibrary.Display,
  driver: driversLibrary.DisplayDriver_serial_epson,
  port: 1
}
```

## Audio

### AudioInputDriver_codecpro
Driver pour les entrées audio du Codec Pro (Microphone ou HDMI).

* **Device Class**: `AudioInput`
* **Configuration**:
  * `input`: (string) Type d'entrée: 'microphone' ou 'hdmi'.
  * `connector`: (number) Numéro du connecteur physique.

**Exemple de configuration:**
```javascript
{
  id: 'audio.mic1',
  type: DEVICETYPE.AUDIOINPUT,
  name: 'Microphone 1',
  device: devicesLibrary.AudioInput,
  driver: driversLibrary.AudioInputDriver_codecpro,
  input: 'microphone',
  connector: 1,
  gainStep: 1,
  defaultGain: 50
}
```

### AudioInputDriver_codeceq
Driver pour les entrées audio du Codec EQ / Room Kit EQ.

* **Device Class**: `AudioInput`
* **Configuration**:
  * `connector`: (number) Numéro du connecteur physique (Microphone).

**Exemple de configuration:**
```javascript
{
  id: 'audio.mic1',
  type: DEVICETYPE.AUDIOINPUT,
  name: 'Microphone 1',
  device: devicesLibrary.AudioInput,
  driver: driversLibrary.AudioInputDriver_codeceq,
  connector: 1,
  gainStep: 1,
  defaultGain: 50
}
```

### AudioInputDriver_aes67
Driver pour les entrées audio AES67.

* **Device Class**: `AudioInput`
* **Configuration**:
  * `connector`: (number) Numéro du connecteur Ethernet.
  * `channel`: (number) Canal audio (défaut: 1).

**Exemple de configuration:**
```javascript
{
  id: 'audio.aes67.1',
  type: DEVICETYPE.AUDIOINPUT,
  name: 'Microphone Plafond',
  device: devicesLibrary.AudioInput,
  driver: driversLibrary.AudioInputDriver_aes67,
  connector: 1,
  channel: 1,
  gainStep: 1,
  defaultGain: 0
}
```

### AudioInputDriver_usb
Driver pour les entrées audio USB.

* **Device Class**: `AudioInput`
* **Configuration**:
  * `connector`: (number) Numéro de l'interface USB.

**Exemple de configuration:**
```javascript
{
  id: 'audio.usb.1',
  type: DEVICETYPE.AUDIOINPUT,
  name: 'USB Input',
  device: devicesLibrary.AudioInput,
  driver: driversLibrary.AudioInputDriver_usb,
  connector: 1,
  gainStep: 1,
  defaultGain: 0
}
```

### AudioOutputDriver_codecpro
Driver pour les sorties audio du Codec Pro (Line ou HDMI).

* **Device Class**: `AudioOutput`
* **Configuration**:
  * `output`: (string) Type de sortie: 'line' ou 'hdmi'.
  * `connector`: (number) Numéro du connecteur physique.

**Exemple de configuration:**
```javascript
{
  id: 'audio.out.line1',
  type: DEVICETYPE.AUDIOOUTPUT,
  name: 'Line Out 1',
  device: devicesLibrary.AudioOutput,
  driver: driversLibrary.AudioOutputDriver_codecpro,
  output: 'line',
  connector: 1
}
```

### AudioOutputDriver_aes67
Driver pour les sorties audio AES67.

* **Device Class**: `AudioOutput`
* **Configuration**:
  * `connector`: (number) Numéro du connecteur Ethernet.

**Exemple de configuration:**
```javascript
{
  id: 'audio.out.aes67.1',
  type: DEVICETYPE.AUDIOOUTPUT,
  name: 'AES67 Out 1',
  device: devicesLibrary.AudioOutput,
  driver: driversLibrary.AudioOutputDriver_aes67,
  connector: 1
}
```

### AudioOutputDriver_usb
Driver pour les sorties audio USB.

* **Device Class**: `AudioOutput`
* **Configuration**:
  * `connector`: (number) Numéro de l'interface USB.

**Exemple de configuration:**
```javascript
{
  id: 'audio.out.usb.1',
  type: DEVICETYPE.AUDIOOUTPUT,
  name: 'USB Out 1',
  device: devicesLibrary.AudioOutput,
  driver: driversLibrary.AudioOutputDriver_usb,
  connector: 1
}
```

## Autres Drivers

### USBSerialDriver
Driver générique pour communication série via adaptateur USB (supporté par certains codecs).

* **Device Class**: `SoftwareDevice`
* **Configuration**:
  * `port`: (number) Port série (1-4).
  * `baudRate`: (number) Vitesse en bauds.
  * `parity`: (string) Parité ('None', 'Odd', 'Even').
  * `terminator`: (string) Caractère de fin de ligne (défaut: '\\r\\n').
  * `pacing`: (number) Délais entre envois (ms).
  * `timeout`: (number) Timeout de réponse (ms).

**Exemple de configuration:**
```javascript
{
  id: 'serial.device',
  type: DEVICETYPE.SOFTWAREDEVICE,
  name: 'Generic Serial Device',
  device: devicesLibrary.SoftwareDevice,
  driver: driversLibrary.USBSerialDriver,
  port: 1,
  baudRate: 9600,
  parity: 'None',
  terminator: '\\r\\n',
  pacing: 200
}
```

### ScreenDriver_gpio
Driver pour écran motorisé contrôlé par GPIO.

* **Device Class**: `Screen`
* **Configuration**:
  * `pin`: (number) Pour contrôle simple (1 pin).
  * `pin1`, `pin2`: (number) Pour contrôle double (2 pins, Up/Down).
  * `defaultPosition`: (string) Position par défaut ('up' ou 'down').

**Exemple de configuration (Simple):**
```javascript
{
  id: 'screen.main',
  type: DEVICETYPE.SCREEN,
  name: 'Toile',
  device: devicesLibrary.Screen,
  driver: driversLibrary.ScreenDriver_gpio,
  pin: 1,
  defaultPosition: 'up'
}
```

**Exemple de configuration (Double):**
```javascript
{
  id: 'screen.main',
  type: DEVICETYPE.SCREEN,
  name: 'Toile',
  device: devicesLibrary.Screen,
  driver: driversLibrary.ScreenDriver_gpio,
  pin1: 1,
  pin2: 2,
  defaultPosition: 'up'
}
```

### ScreenDriver_gc_itachflex
Driver pour écran motorisé contrôlé par Global Caché iTach Flex.

* **Device Class**: `Screen`
* **Configuration**:
  * `host`: (string) Adresse IP du Global Caché.
  * `upRelay`: (number) ID du relais pour la montée.
  * `downRelay`: (number) ID du relais pour la descente.
  * `pulseLength`: (number) Durée de l'impulsion en ms (défaut: 1000).

**Exemple de configuration:**
```javascript
{
  id: 'screen.main',
  type: DEVICETYPE.SCREEN,
  name: 'Toile',
  device: devicesLibrary.Screen,
  driver: driversLibrary.ScreenDriver_gc_itachflex,
  host: '192.168.1.50',
  upRelay: 1,
  downRelay: 2,
  pulseLength: 1000,
  defaultPosition: 'up'
}
```

### DisplayDriver_CEC
Driver pour écran contrôlé via HDMI CEC.

* **Device Class**: `Display`
* **Configuration**:
  * `connector`: (number) Numéro du connecteur HDMI de sortie.

**Exemple de configuration:**
```javascript
{
  id: 'display.tv',
  type: DEVICETYPE.DISPLAY,
  name: 'TV CEC',
  device: devicesLibrary.Display,
  driver: driversLibrary.DisplayDriver_CEC,
  connector: 1
}
```
