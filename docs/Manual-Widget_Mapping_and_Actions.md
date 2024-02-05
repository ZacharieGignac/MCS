# Table des Matières
- [Intéraction avec les widgets](#intéraction-avec-les-widgets)
- [Nomenclature](#nomenclature)
  - [Les préfixes](#les-préfixes)
- [Widget Mapping](#widget-mapping)
  - [Devices](#devices)
    - [Display](#display)
    - [Screen](#screen)
    - [Shade](#shade)
    - [Light](#light)
    - [LightScene](#lightscene)
    - [AudioInput](#audioinput)
- [Status système (systemStatus)](#status-système-systemstatus)
- [Action et Actions](#action-et-actions)
  - [Actions système](#actions-système)
  - [Exemples](#exemples)
    
# Intéraction avec les widgets
Il est préférable et fortement recommandé d'utiliser les mécanismes du système pour définir la valeur d'un widget ou pour écouter les événements d'un widget. Ces fonctions sont décrites dans la documentation de l'API.

# Nomenclature
Le système a quelques nomenclatures spéciales pour les widgets, et un mécanisme pour contourner une limitation dans la version actuelle quand plusieurs widgets ont le même "id"; les préfixes. 

Une autre nomenclature indique au système de relier le widget à un statut système (systemStatus). 

Le système possède aussi une nomenclature spéciale pour les actions, un mécanisme qui permet de connecter des widgets à des fonctions du système, ou d'un scénario.

## Les préfixes
Les widgets peuvent comporter un préfixe sans altérer leur nom fondamental. Un caractère de démarcation est utilisé entre le préfixe et le nom réel du widget: "|". 

En date d'aujourd'hui (24 octobre 2023), il est préférable de ne pas avoir plusieurs widgets avec le même id.

Par exemple, les widgets suivants sont équivalents pour le système, lorsqu'on utilise ses fonctionnalités pour définir la valeur d'un widget, ou lorsqu'on utilise un mapping:
* monWidget
* systeme|monWidget
* scenario1|monWidget
* préfixe|monWidget

###


# Widget Mapping
## Devices
Certain devices incluent des mapping de widgets automatique. Il est important de bien nommer les widgets pour le lier automatiquement au device à contrôler. Dans les examples ci-dessous, "id" représente l'identification unique de l'appareil.

### Display
* **Allumer l'affichage** (bouton): id:POWERON
* **Éteindre l'affichage** :(bouton) id:POWEROFF
* **Toggle l'affichage et affiche son statut** (toggle): id:POWER

### Screen
* **Monter la toile** (bouton): id:UP
* **Descendre la toile** (bouton): id:DOWN

### Shade
* **Monter la toile de fenêtre** (bouton): id:UP
* **Descendre la toile de fenêter** (bouton): id:DOWN

### Light
* **Allumer l'éclairage** (bouton): id:POWERON
* **Éteindre l'éclairage** (bouton): id:POWEROFF
* **Toggle l'éclairage et affiche son statut** (toggle): id:POWER
* **Défini le niveau de luminosité** (slider): id:LEVEL

### LightScene
* **Activer la scène d'éclairage** (bouton): id:ACTIVATE

### AudioInput
* **Définir le mode (on, off) et l'afficher** (toggle): id:MODE
* **Définir le niveau (gain) et l'afficher** (slider): id:LEVEL
* **Définir le niveau (gain) et l'afficher** (button group): id:LEVELGROUP

# Status système (systemStatus)
Il est possible de connecter automatiquement une valeur de la structure globale "systemStatus" à un widget.

Tous les widgets possédant le préfixe "SS$" seront automatiquement connectés de façon bidirectionnelle avec les valeurs de systemStatus.

Évidemment, les valeurs de systemStatus doivent être compatibles avec le widget. On ne peut assigner la valeur "boeuf" à un widget de type "toggle". 

Les valeurs bool de systemStatus sont automatiquement converties en valeurs 'on' et 'off'. Pour convertir automatiquement les valeurs 'on' et 'off' du widget en bool vers systemStatus, il est nécessaire d'ajuster le préfixe à "SS?".

En d'autres mots, si une valeur de systemStatus est de type boolean, il est OBLIGATOIRE d'utiliser le préfixe "SS?" au lieu de "SS$" pour activer l'auto-mapping d'un widget.

Exemples:
* **SS$PresenterLocation** (button group avec 2 boutons: 'local', 'remote'): Affiche et défini l'emplacement du présentateur
* **SS$AudienceMics** (toggle): Affiche et défini l'emplacement du présentateur
* **SS$Version** (texte): Affiche la version actuelle du système
* **SS?PresenterDetected** (toggle): Affiche si le présentateur est détecté, même si la valeur de systemStatus est de type "bool". Cette valeur est automatiquement convertie

# Action et Actions
Le système possède un mécanisme de mapping d'action, c'est à dire le déclanchement d'actions (function) à partir d'une identifiation de widget.

Plusieurs actions de base sont disponibles et il est possible d'en ajouter d'autres à partir de l'API.

Pour signifier au système que le widget doit déclancher une action, le "id" du widget doit être préfixé de "ACTION$" si seulement une action doit être appelée et de "ACTIONS$" si plusieurs actions doivent être appelées.

Le système supporte aussi les préfixes comme décrit au début de ce document, donc un widget préfixé "test|ACTION$" est valide.

## Actions système
* **SETTINGSLOCK** : Vérouille les paramètres système
* **SETTINGSUNLOCK** : Dévérouille les paramètres systèmes
* **PANELOPEN:panelId,pageId** : Ouvre le panel, et accessoirement affiche la page demandée
* **PANELCLOSE** : Ferme le panel présentement affiché
* **STANDBY** : Met le système en veille
* **RESETDEVICES** : Appelle la fonction "reset()" de tous les devices
* **SENDSYSTEMREPORT** : Envoi le rapport du système
* **VIEWSYSTEMDIAGNOSTICS** : Affiche les messages de diagnostic du système
* **ACTIVATECAMPRESET:presetName** : Active un preset de caméra
* **LIGHTSCENE:id** : Active une scène d'éclairage
* **ENABLESCENARIO:id** : Active un scénario
* **ENABLESCENARIOASK** : Affiche une boite de dialogue demandant d'entrer un "id" de scénario et l'active
* **PRESETSLOCK** : Vérouille les presets de caméra
* **PRESETSUNLOCK** : Dévérouille les presets de caméra

## Exemples
Activer le preset de caméra nommé "Tableau"

```ACTION$ACTIVATECAMPRESET:Tableau```

Appeler la scène d'éclairage "normal"

```ACTION$LIGHTSCENE:normal```

Appeler la scène d'éclairage "normal" et fermer le panel en cours

```ACTIONS$LIGHTSCENE:normal&PANELCLOSE```

Activer le preset de caméra nommé "Tableau" et ouvrir le panneau "Controle" à page "Camera"

```ACTIONS$ACTIVATECAMPRESET:Tableau&PANELOPEN:Controle,Camera```
