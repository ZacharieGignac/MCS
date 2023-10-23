# Devices
Les "Devices" (appareils) sont des classes qui représentent des appareils physiques ou virtuels contrôlés par le système. Les classes sont instanciées au démarrage du système.

Chaque "Device" est identifié par un "id" unique, qui permet à n'importe quelle partie du système de trouver un device et de le contrôler directement. Chaque device expose des "functions".

Voici les "functions" exposées pour chacun des type de devices:


## Caméra
Aucunes.

## ControlSystem

## CameraPreset


## Display

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
