# Table des Matières
- [Devices](#devices)
  - [Caméra](#caméra)
  - [ControlSystem](#controlsystem)
  - [CameraPreset](#camerapreset)
  - [Display](#display)
  - [Screen](#screen)
  - [Shade](#shade)
  - [LightScene](#lightscene)
  - [Light](#light)
  - [AudioInput](#audioinput)
  - [AudioOutput](#audiooutput)
  - [AudioInputGroup](#audioinputgroup)
  - [AudioOutputGroup](#audiooutputgroup)
  - [AudioReporter](#audioreporter)
    
# Devices

Les "Devices" (appareils) sont des classes qui représentent des appareils physiques ou virtuels contrôlés par le système. Les classes sont instanciées au démarrage du système.

Chaque "Device" est identifié par un "id" unique, qui permet à n'importe quelle partie du système de trouver un device et de le contrôler directement. Chaque device expose des "functions".

## Voici les "functions" exposées pour chacun des type de devices:

### Caméra
Aucunes.

### ControlSystem
Aucunes.

### CameraPreset
- `void activate(skipSetVideoSource)`: Active le preset de caméra
  - `skipSetVideoSource` <`false`>: Quand `true`, ne modifie pas le "MainVideoSource"

### Display
- `void setDefaults(void)`: Active les paramètres par défaut définis dans la configuration comme l'alimentation, la source et le blanking
- `void setPower(string power, number delay, bool overrideDelay)`: Allume ou éteint l'affichage
  - `power`: 'on', 'off'
  - `delay`: délais (ms) avant la fermeture de l'affichage. Si non spécifié, le délais par défaut de la configuration sera utilisé
  - `overrideDelay`: Optionnel, `false` par défaut. Remplace le délais actuel si `true`.
- `void on(void)` / `void powerOn(void)`: Allume l'affichage
- `void off(number delay, overrideDelay=false)` / `void powerOff(number delay, overrideDelay=false)`: Éteint l'affichage
  - `delay`: délais (ms) avant la fermeture de l'affichage. Si non spécifié, le délais par défaut de la configuration sera utilisé
  - `overrideDelay`: Optionnel, `false` par défaut. Remplace le délais actuel si `true`.
- `string getPower(void)`: Retourne l'état d'alimentation actuel, 'on' ou 'off'
- `void setBlanking(boolean blanking)`: Activation / désactivation du blanking
  - `blanking`: true = activé, false = désactivé
- `boolean getBlanking(void)`: Retourne l'état de blanking actuel.
- `void setSource(string source)`: Défini la source à afficher
- `string getSource(void)`: Retourne la source actuelle.
- `number getUsageHours(void)`: Retourne le nombre d'heure d'utilisation.

#### Notes spécifiques: Blanking et `blankBeforePowerOff`
- `supportsBlanking`: si cette propriété de configuration est `false`, aucune commande de blanking n'est envoyée au driver, même si `blankBeforePowerOff` est configuré à `true`.
- `blankBeforePowerOff`: lorsque `true` **et** que `supportsBlanking === true`, le système enverra automatiquement `setBlanking(true)` avant l'extinction (`powerOff`) et `setBlanking(false)` au rallumage (`powerOn`).
- Sécurité de configuration: il n'est plus nécessaire de désactiver `blankBeforePowerOff` pour les écrans qui ne supportent pas le blanking; la propriété `supportsBlanking: false` suffit à bloquer tout envoi de commandes de blanking.

#### Notes spécifiques: Sony (DisplayDriver_serial_sonybpj)
- Répétition basée sur ACK: les commandes `power` et `blank`/`unblank` sont renvoyées périodiquement (toutes les `repeat` ms) jusqu'à ce que le projecteur réponde « ok ». À la première réponse « ok », les renvois s'arrêtent pour cet état demandé.
- Détection « ok » robuste: l'ACK est détecté même si la réponse contient des guillemets, des espaces ou des caractères de contrôle. Les logs affichent la réponse brute (`RX`).
- Bascule rapide non conflictuelle: en cas de changement d'état rapide (ex. `blank` → `unblank`), les anciennes commandes en file sont purgées et seul l'état le plus récent est relancé jusqu'à ACK, évitant les effets ping-pong.
- Liaisons TX uniquement: si la voie RX n'est pas câblée, l'ACK n'est jamais reçu et le driver continue d'envoyer périodiquement (comportement intentionnel). Si désiré, ajouter un backoff ou un maximum de tentatives.

### Screen
- `void setDefaults(void)`: Active la position par défaut spécifiée dans la configuration.
- `void setPosition(string position)`: Défini la position de la toile
  - `position`: 'up', 'down'
- `void up(void)`: Défini la position de la toile à 'up'
- `void down(void)`: Défini la position de la toile à 'down'

### Shade
- `void setDefaults(void)`: Active la position par défaut spécifiée dans la configuration.
- `void setPosition(string position)`: Défini la position de la toile
  - `position`: 'up', 'down'
- `void up(void)`: Défini la position de la toile à 'up'
- `void down(void)`: Défini la position de la toile à 'down'

### LightScene
- `void activate(void)`: Active la scène d'éclairage.
- `void activateUi(void)`: Active la scène d'éclairage et configure le status "AutoLights" à "OFF". Cette function doit être utilisée lorsque l'action provient d'un widget activé par l'utilisateur.

### Light
- `void setDefaults(void)`: Active les paramètres par défaut définis dans la configration comme l'état d'alimentation et le niveau de tamisage.
- `void on(void)`: Allume le dispositif d'éclairage
- `void off(void)`: Éteint le dispositif d'éclairage
- `void setPower(string power) / void power(string power)`: Défini l'état d'alimentation du dispotifif d'éclairage
  - `power`: 'on', 'off'
- `void dim(number level, boolean force=false)`: Défini le niveau de tamisage du dispositif d'éclairage
  - `level`: pourcentage de tamisage (0-100)
  - `force`: détermine si le tamisage est mis à jour même si la valeur actuelle est égale à la nouvelle valeur

### AudioInput
- `void setDefaults(void)`: Active les paramètres par défaut définis dans la configuration comme le mode et le gain.
- `void setGain(number gain, boolean ignoreLimits)`: Défini le gain de l'entrée
  - `gain`: (0-70)
  - `ignoreLimits`: ignore les limites de gain (low, high) spécifiés dans la configuration. Si cette valeur est "false" et que le gain spécifié est plus haut ou plus bas que les limites, le gain sera configuré à la limite
- `void setLevel(number gain, boolean ignoreLimits)`: Alias de setGain
- `number getGain(void)`: Retourne le gain actuel de l'entrée audio
- `number getLevel(void)`: Alias de getGain
- `void increaseGain(void)`: Augmente le gain de l'entrée d'un nombre de "db" spécifié dans la configuration par la propriété "gainStep".
- `void increaseLevel(void)`: Alias de increaseGain
- `void decreaseGain(void)`: Diminue le gain de l'entrée d'un nombre de "db" spécifié dans la configuration par la propriété "gainStep".
- `void decreaseLevel(void)`: Alias de decreaseGain
- `void setBoost(void)`: Configure le gain de l'entrée audio au niveau spécifié dans la configuration par la propriété "boost".
- `void reset(void)`: Remet les paramètres spécifiés dans la configuration.
- `void refresh(void)`: Réapplique les paramètres courant.

#### Drivers disponibles

##### AudioInputDriver_codecpro
Driver pour les entrées audio sur les codecs Pro (microphone, HDMI).

**Paramètres de configuration :**
```javascript
{
  id: 'mic_presenter',
  type: 'AUDIOINPUT',
  driver: AudioInputDriver_codecpro,
  input: 'microphone',  // 'microphone' ou 'hdmi'
  connector: 1,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `input`: Type d'entrée (`microphone` ou `hdmi`)
- `connector`: Numéro du connecteur

**Note :** Le type `ethernet` a été retiré en v1.2.0. Utiliser `AudioInputDriver_aes67` pour les entrées AES67.

##### AudioInputDriver_codeceq
Driver pour les entrées microphone sur les codecs EQ, Bar et Board.

**Paramètres de configuration :**
```javascript
{
  id: 'mic_eq_1',
  type: 'AUDIOINPUT',
  driver: AudioInputDriver_codeceq,
  connector: 1,
  gainLowLimit: 0,
  gainHighLimit: 70,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `connector`: Numéro du connecteur microphone
- Contrôle via `Audio.Input.Microphone[connector].Gain` et `Audio.Input.Microphone[connector].Mode`

**Notes :**
- Uniquement pour les connecteurs microphone (pas HDMI/Ethernet)
- Plage de gain recommandée : 0-70

##### AudioInputDriver_aes67
Driver pour les entrées audio AES67 (Ethernet audio).

**Paramètres de configuration :**
```javascript
{
  id: 'aes67_input_1',
  type: 'AUDIOINPUT',
  driver: AudioInputDriver_aes67,
  connector: 1,
  channel: 1,  // Canal 1-8
  gainLowLimit: 0,
  gainHighLimit: 24,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `connector`: Numéro du connecteur Ethernet
- `channel`: Numéro du canal (1-8)
- Contrôle du gain par canal

**Canaux supportés :**
- Canaux 1 à 8 disponibles selon la configuration AES67

##### AudioInputDriver_usb
Driver pour les interfaces audio USB.

**Paramètres de configuration :**
```javascript
{
  id: 'usb_audio_in',
  type: 'AUDIOINPUT',
  driver: AudioInputDriver_usb,
  connector: 1,
  gainLowLimit: 0,
  gainHighLimit: 24,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `connector`: Numéro de l'interface USB
- Support automatique de `Level` ou `Gain` selon l'appareil
- Plage de gain contrainte : 0-24 (plus restrictive que les microphones traditionnels)

**Notes :**
- Le driver tente d'abord `Audio.Input.USBInterface[connector].Level`
- Si non supporté, utilise `Audio.Input.USBInterface[connector].Gain`
- Les valeurs de gain sont automatiquement contraintes entre 0-24
- Gestion d'erreur silencieuse si l'interface USB n'est pas disponible

#### Notes spécifiques: USB (AudioInputDriver_usb)
- Support Gain/Level: les interfaces USB supportent soit `Level` soit `Gain`. Le driver essaie automatiquement `Level` en premier, puis `Gain` si `Level` n'est pas disponible.
- Plage de gain contrainte: les valeurs de gain sont automatiquement contraintes entre 0-24 pour les interfaces USB (plage valide plus petite que les microphones traditionnels).
- Gestion d'erreur silencieuse: si l'interface USB n'est pas disponible, les erreurs sont gérées silencieusement avec des messages de debug appropriés.

#### Notes spécifiques: EQ (AudioInputDriver_codeceq)
- Connecteurs Microphone uniquement: ce driver adresse `Audio.Input.Microphone[connector].Gain/Mode` des appareils EQ/Bar/Board; ne pas utiliser `input: 'microphone'` dans la configuration (la propriété est ignorée).
- Plage de gain 0-70: utiliser `gainLowLimit/gainHighLimit` dans cette plage. Les appels à `setMode('on'|'off')` basculent `Microphone[connector].Mode`.
- Différences vs `codecpro`: pas de support pour `hdmi`/`ethernet` dans ce driver; pour AES67, utiliser `AudioInputDriver_aes67` dédié.

### AudioOutput
- `void setDefaults(void)`: Active les paramètres par défaut définis dans la configuration comme le mode.
- `void setLevel(number level)`: Défini le niveau de sortie audio (non supporté pour les interfaces USB)
  - `level`: niveau de sortie
- `void setMode(string mode)`: Défini le mode de la sortie audio
  - `mode`: 'on', 'off'
- `void on(void)`: Active la sortie audio
- `void off(void)`: Désactive la sortie audio

#### Drivers disponibles

##### AudioOutputDriver_codecpro
Driver pour les sorties audio sur les codecs Pro (Line, HDMI).

**Paramètres de configuration :**
```javascript
{
  id: 'audio_out_line_1',
  type: 'AUDIOOUTPUT',
  driver: AudioOutputDriver_codecpro,
  output: 'line',  // 'line' ou 'hdmi'
  connector: 1,
  levelLowLimit: -24,
  levelHighLimit: 0,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `output`: Type de sortie (`line` ou `hdmi`)
- `connector`: Numéro du connecteur
- Contrôle du niveau de sortie

##### AudioOutputDriver_aes67
Driver pour les sorties audio AES67 (Ethernet audio).

**Paramètres de configuration :**
```javascript
{
  id: 'aes67_output_1',
  type: 'AUDIOOUTPUT',
  driver: AudioOutputDriver_aes67,
  connector: 1,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `connector`: Numéro du connecteur Ethernet
- Contrôle du mode uniquement (On/Off)

**Note :** Les sorties AES67 ne supportent pas le contrôle de niveau.

##### AudioOutputDriver_usb
Driver pour les interfaces audio USB en sortie.

**Paramètres de configuration :**
```javascript
{
  id: 'usb_audio_out',
  type: 'AUDIOOUTPUT',
  driver: AudioOutputDriver_usb,
  connector: 1,
  // ... autres paramètres
}
```

**Propriétés supportées :**
- `connector`: Numéro de l'interface USB
- Contrôle du mode uniquement (On/Off)

**Notes :**
- Les interfaces USB de sortie ne supportent pas le contrôle de niveau
- Gestion d'erreur silencieuse si l'interface USB n'est pas disponible

#### Notes spécifiques: USB (AudioOutputDriver_usb)
- Mode uniquement: les interfaces USB de sortie supportent seulement le contrôle de mode (On/Off), pas le contrôle de niveau.
- Gestion d'erreur silencieuse: si l'interface USB n'est pas disponible, les erreurs sont gérées silencieusement avec des messages de debug appropriés.

### AudioInputGroup
- `void connectToRemoteOutputs(void)`: Connecte le groupe d'entrée audio aux sorties audio des sites distants.
- `void disconnectFromRemoteOutputs(void)`: Déconnecte le groupe d'entrée audio aux sorties audio des sites distants.
- `void connectToLocalOutput(AudioOutputGroup audioOutputGroup)`: Connecte le groupe d'entrée audio à un groupe de sortie audio local
- `void disconnectFromLocalOutput(AudioOutputGroup audioOutputGroup)`: Déconnecte le groupe d'entrée audio à un groupe de sortie audio local

### AudioOutputGroup
- `void connectLocalInput(AudioInputGroup audioInputGroup)`: Connecte le groupe de sortie audio à un groupe d'entrée audio locale
- `void disconnectLocalInput(AudioInputGroup audioInputGroup)`: Déconnecte le groupe de sortie audio à un groupe d'entrée audio locale
- `void connectRemoteInputs(void)`: Connecte les entrées audio distantes au groupe de sortie audio local
- `void disconnectRemoteInputs(void)`: Déconnecte les entrées audio distantes au groupe de sortie audio local
- `void connectSpecificRemoteInputs(string[] remoteInputIds)`: Connecte uniquement les entrées distantes spécifiées au groupe de sortie audio local
- `void disconnectSpecificRemoteInputs(string[] remoteInputIds)`: Déconnecte uniquement les entrées distantes spécifiées du groupe de sortie audio local
- `void updateInputGain(AudioInputGroup audioInputGroup, AudioOutputGroup audioOutputGroup)`: Défini le gain dans le lien entre le groupe d'entrée local et le groupe de sortie local

## AudioReporter

### `void start(void)`
Démarre l'observation des entrées audio et démarre les rapports.

### `void stop(void)`
Arrête l'observation des entrées audio et stoppe les rapports.

### `void onReport(callback)`
Ajoute un callback pour les rapports. Chaque fois qu'un rapport est disponible, le rapport sera envoyé à tous les callbacks.

- `callback`: function(report), envoi du rapport.

## SoftwareDevice

Le type `SoftwareDevice` permet de créer des devices logiciels personnalisés qui ne correspondent pas aux types standards. Il est particulièrement utile pour intégrer des drivers personnalisés comme `USBSerialDriver`.

### Méthodes

- `void reset(void)`: Réinitialise le device logiciel (appelle le reset du driver si disponible)

### Driver: USBSerialDriver

`USBSerialDriver` est un driver générique pour la communication série USB. Il gère automatiquement la configuration du port série, la mise en file d'attente des commandes, et le pacing entre les envois.

#### Configuration

```javascript
{
  id: 'my_serial_device',
  type: 'SOFTWAREDEVICE',
  driver: USBSerialDriver,
  port: 1,                    // Port série (1-4)
  baudRate: 9600,             // Vitesse de communication (optionnel)
  parity: 'None',             // Parité: 'None', 'Even', 'Odd' (optionnel)
  terminator: '\\r\\n',       // Terminateur de réponse (défaut: '\\r\\n')
  pacing: 200,                // Délai entre les commandes en ms (défaut: 200)
  timeout: 200                // Timeout de réponse en ms (défaut: 200)
}
```

#### Propriétés de configuration

- `port` **(requis)**: Numéro du port série (1 à 4)
- `baudRate` (optionnel): Vitesse de communication (9600, 19200, 38400, 115200, etc.)
- `parity` (optionnel): Parité de communication
  - `'None'`: Aucune parité
  - `'Even'`: Parité paire
  - `'Odd'`: Parité impaire
- `terminator` (optionnel): Caractère(s) de terminaison pour les réponses
  - Défaut: `'\\r\\n'` (Carriage Return + Line Feed)
  - Peut être `null` ou `''` pour désactiver
- `pacing` (optionnel): Délai en millisecondes entre chaque commande (défaut: 200ms)
- `timeout` (optionnel): Délai d'attente maximal pour une réponse en millisecondes (défaut: 200ms)

#### Méthodes du driver

##### `Promise<response> send(string command)`
Envoie une commande série et retourne une promesse avec la réponse.

```javascript
const serialDevice = zapi.devices.getDevice('my_serial_device');
const serial = serialDevice.driver;

serial.send('QUERY?\\r\\n')
  .then(response => {
    console.log('Réponse:', response.Response);
  })
  .catch(error => {
    console.error('Erreur:', error);
  });
```

##### `Promise<response> sendRaw(string text)`
Alias de `send()`. Envoie une commande brute.

##### `void reset()`
Réinitialise le driver en vidant la file d'attente et en arrêtant les envois en cours.

```javascript
serial.reset();
```

#### Exemple complet d'utilisation

```javascript
// Configuration dans config.js
const serialConfig = {
  id: 'projector_serial',
  type: 'SOFTWAREDEVICE',
  driver: driversLibrary.USBSerialDriver,
  port: 1,
  baudRate: 9600,
  parity: 'None',
  terminator: '\\r\\n',
  pacing: 300,
  timeout: 500
};

// Utilisation dans un module ou scénario
const projectorSerial = zapi.devices.getDevice('projector_serial');
const driver = projectorSerial.driver;

// Envoyer une commande power on
driver.send('PWR ON\\r\\n')
  .then(response => {
    console.log('Projecteur allumé:', response.Response);
  })
  .catch(error => {
    console.error('Erreur d\'allumage:', error);
  });

// Interroger l'état
driver.send('PWR?\\r\\n')
  .then(response => {
    const status = response.Response.trim();
    console.log('État du projecteur:', status);
  });
```

#### Fonctionnalités avancées

**File d'attente automatique**: Les commandes sont automatiquement mises en file et exécutées séquentiellement avec le `pacing` défini.

**Gestion d'erreur**: Si le port série n'est pas disponible, le driver rejette les promesses avec `'SERIAL_NOT_CONFIGURED'`.

**Logs de debug**: Le driver affiche les logs TX (transmission) et RX (réception) pour faciliter le débogage.

**Protection contre les erreurs**: Les erreurs de parsing ou de communication sont gérées et loggées sans faire planter le système.

#### Notes importantes

- Le port série doit être entre 1 et 4 (limitation du codec)
- Si le `baudRate` ou la `parity` ne sont pas spécifiés, les valeurs par défaut du port série sont conservées
- Le driver configure automatiquement `SerialPort.Outbound.Mode` à `On`
- Les réponses vides sont indiquées comme `<empty>` dans les logs
- Le `terminator` doit correspondre au caractère de fin de ligne attendu par l'appareil connecté

