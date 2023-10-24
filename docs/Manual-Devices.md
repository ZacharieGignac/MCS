# Devices
Les "Devices" (appareils) sont des classes qui représentent des appareils physiques ou virtuels contrôlés par le système. Les classes sont instanciées au démarrage du système.

Chaque "Device" est identifié par un "id" unique, qui permet à n'importe quelle partie du système de trouver un device et de le contrôler directement. Chaque device expose des "functions".

Voici les "functions" exposées pour chacun des type de devices:


## Caméra
Aucunes.

## ControlSystem
Aucunes.

## CameraPreset
### void activate(void)
Active le preset de caméra

## Display
### void setDefaults(void)
Active les paramètres par défaut définis dans la configuration comme l'alimentation, la source et le blanking

### void setPower(power, delay)
Allume ou éteint l'affichage
* **power** : string, 'on', 'off'
* **delay** : number, délais (ms) avant la fermeture de l'affichage. Si non spécifié, le délais par défaut de la configuration sera utilisé
  
### void on(void) / void powerOn(void)
Allume l'affichage

### void off(delay) / void powerOff(delay)
Éteint l'affichage
* **delay** : number, délais (ms) avant la fermeture de l'affichage. Si non spécifié, le délais par défaut de la configuration sera utilisé

### string getPower(void)
Retourne l'état d'alimentation actuel, 'on' ou 'off'

### void setBlanking(blanking)
Activation / désactivation du blanking
* **blanking** : boolean, true = activé, false = désactivé

### boolean getBlanking(void)
Retourne l'état de blanking actuel.

### void setSource(source)
Défini la source à afficher
* **source** : string, source à afficher

### string getSource(void)
Retourne la source actuelle.

### number getUsageHours(void)
Retourne le nombre d'heure d'utilisation.

## Screen
### void setDefaults(void)
Active la position par défaut spécifiée dans la configuration.

### void setPosition(position)
Défini la position de la toile
* **position** : string, position 'up', 'down'

### void up(void)
Défini la position de la toile à 'up'

### void down(void)
Défini la position de la toile à 'down'

## Shade
### void setDefaults(void)
Active la position par défaut spécifiée dans la configuration.

### void setPosition(position)
Défini la position de la toile
* **position** : string, position 'up', 'down'

### void up(void)
Défini la position de la toile à 'up'

### void down(void)
Défini la position de la toile à 'down'

## LightScene
### void activate(void)
Active la scène d'éclairage.
### void activateUi(void)
Active la scène d'éclairage et configure le status "AutoLights" à "OFF". Cette function doit être utilisée lorsque l'action provient d'un widget activé par l'utilisateur.

## Light
### void setDefaults(void)
Active les paramètres par défaut définis dans la configration comme l'état d'alimentation et le niveau de tamisage.

### void on(void)
Allume le dispositif d'éclairage

### void off(void)
Éteint le dispositif d'éclairage

### void setPower(power) / void power(power)
Défini l'état d'alimentation du dispotifif d'éclairage
* **power** : string, alimentation 'on', 'off'

### void dim(level, force=false)
Défini le niveau de tamisage du dispositif d'éclairage
* **level** : number, pourcentage de tamisage (0-100)
* **force** : boolean, détermine si le tamisage est mis à jour même si la valeur actuelle est égale à la nouvelle valeur

## AudioInput
### void setDefaults(void)
Active les paramètres par défaut définis dans la configuration comme le mode et le gain.

### void setGain(gain, ignoreLimits)
* **gain** : number, gain de l'entrée (0-70)
* **ignoreLimits** : boolean, ignore les limites de gain (low, high) spécifiés dans la configuration. Si cette valeur est "false" et que le gain spécifié plus haut ou plus bas que les limites, le gain sera configuré à la limite

### void setLevel(gain, ignoreLimits)
Alias de setGain

### number getGain(void)
Retourne le gain actuel de l'entrée audio

### number getLevel(void)
Alias de getGain

### void increaseGain(void)
Augmente le gain de l'entrée d'un nombre de "db" spécifié dans la configuration par la propriété "gainStep".

### void increaseLevel(void)
Alias de increaseGain

### void decreaseGain(void)
Diminue le gain de l'entrée d'un nombre de "db" spécifié dans la configuration par la propriété "gainStep".

### void decreaseLevel(void)
Alias de decreaseGain

### void setBoost(void)
Configure le gain de l'entrée audio au niveau spécifié dans la configuration par la propriété "boost".


## AudioInputGroup
### void connectToRemoteOutputs(void)
Connecte le groupe d'entrée audio aux sorties audio des sites distants.

### void disconnectFromRemoteOutputs(void)
Déconnecte le groupe d'entrée audio aux sorties audio des sites distants.

### void connectToLocalOutput(audioOutputGroup)
Connecte le groupe d'entrée audio à un groupe de sortie audio local
* **audioOutputGroup** : AudioOutputGroup, groupe de sortie audio local

### void disconnectFromLocalOutput(audioOutputGroup)
Déconnecte le groupe d'entrée audio à un groupe de sortie audio local
* **audioOutputGroup** : AudioOutputGroup, groupe de sortie audio local

## AudioOutputGroup
### void connectLocalInput(audioInputGroup)
Connecte le groupe de sortie audio à un groupe d'entrée audio locale
* **audioInputGroup** : AudioInputGroup, groupe d'entrée audio locale

### void disconnectLocalInput(audioInputGroup)
Déconnecte le groupe de sortie audio à un groupe d'entrée audio locale
* **audioInputGroup** : AudioInputGroup, groupe d'entrée audio locale

### void connectRemoteInputs(void)
Connecte les entrées audio distantes au groupe de sortie audio local

### void disconnectRemoteInputs(void)
Déconnecte les entrées audio distantes au groupe de sortie audio local

### void updateInputGain(audioInputGroup, audioOutputGroup)
Défini le gain dans le lien entre le groupe d'entrée local et le groupe de sortie local
* **audioInputGroup** : AudioInputGroup, groupe d'entrée audio local
* **audioOutputGroup** : AudioOutputGroup, groupe de sortie audio local

## AudioReporter
### void start(void)
Démarre l'observation des entrées audio et démarre les rapports

### void stop(void)
Arrête l'observation des entrées audio et stop les rapports

### void onReport(callback)
Ajoute un callback pour les rapports. Chaque fois qu'un rapport est disponible, le rapport sera envoyé à tous les callbacks
* **callback** : function(rapport), envoi du rapport
