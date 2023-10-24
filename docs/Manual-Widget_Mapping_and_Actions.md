# Intéraction avec les widgets
Il est préférable et fortement recommandé d'utiliser les mécanismes du système pour définir la valeur d'un widget ou pour écouter les événements d'un widget. Ces fonctions sont décrites dans la documentation de l'API.

# Nomenclature
Le système a quelques nomenclatures spéciales pour les widgets, et un mécanisme pour contourner une limitation dans la version actuelle quand plusieurs widgets ont le même "id", les préfixes. 

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
* **Définir le mode (on, off) et l'afficher (toggle): id:MODE
* **Définir le niveau (gain) et l'afficher (slider): id:LEVEL
* **Définir le niveau (gain) et l'afficher (button group): id:LEVELGROUP

