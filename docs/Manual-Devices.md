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
Retourne l'état de blanking actuel

### void setSource(source)
Défini la source à afficher
* **source** : string, source à afficher

### string getSource(void)
Retourne la source actuelle

### number getUsageHours(void)
Retourne le nombre d'heure d'utilisation

## Screen

## Shade

## LightScene
### void activate(void)
Active la scène d'éclairage.
### void activateUi(void)
Active la scène d'éclairage et configure le status "AutoLights" à "OFF". Cette function doit être utilisée lorsque l'action provient d'un widget activé par l'utilisateur.

## Light

## AudioInput

## AudioInputGroup

## AudioOutputGroup

## AudioReporter
