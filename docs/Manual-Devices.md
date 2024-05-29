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
- `void updateInputGain(AudioInputGroup audioInputGroup, AudioOutputGroup audioOutputGroup)`: Défini le gain dans le lien entre le groupe d'entrée local et le groupe de sortie local
## AudioReporter

### `void start(void)`
Démarre l'observation des entrées audio et démarre les rapports.

### `void stop(void)`
Arrête l'observation des entrées audio et stoppe les rapports.

### `void onReport(callback)`
Ajoute un callback pour les rapports. Chaque fois qu'un rapport est disponible, le rapport sera envoyé à tous les callbacks.

- `callback`: function(report), envoi du rapport.
