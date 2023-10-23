# MCS (nom temporaire)
MCS est une collection de macros pour les systèmes Cisco Webex, constituant un système intégré, modulaire, flexible et simple à utiliser, destiné à être utilisé comme point central de contrôle dans une salle de cours ou de réunion. La logique de la salle ainsi que son interface utilisateur peuvent donc être centralisés sur un seul appareil qui utilise un langage de programmation connu et moderne.

## Aspects principaux
* Utilisation de seulement **1 macro active**, laissant ainsi place à 9 macros libres
* Unifier la configuration de l'ensemble du système en un seul fichier
* Ajouter des fonctionnalités accessible à l'ensemble du système par un concept de **modules**
* Supporter plusieurs comportements **complètement distinct** sur le même système par un concept de **scénario** (par exemple, "mode manuel" et "mode automatique"
* **Virtualisation** des appareils internes ou externes, rendant les particularités de chaque salle plus simple à prendre en charge par chaque scénario
* **Groupement** de différents type d'appareils dans des groupes nommés, dont plusieurs groupes standard
* Architecture de **drivers** d'appareil, qui permet d'étendre les fonctionnalités de base à d'autres appareils du même type mais qui ne partagent pas tous le même fonctionnement (protocole, connectique)
* Une grande collection d'appareils supportés directement dans la distribution (13) dont plusieurs supportant des drivers: Camera, LightScene, Light, AudioInputGroup, AudioOutputGroup, Display, CameraPreset, AudioInput, ControlSystem, Screen, SoftwareDevice, AudioReporter, Shade
* Une grande collection de drivers supportés directement dans la distribution (14) pour une variété d'appareils
* Un système de gestion et d'annonce de **statut système global**, avec événements, avec valeurs par défaut
* **Mapping automatique des widgets** pour chaque appareil, pour chaque statut système, actions
* Gestion du boot (warm, cold)
* Gestion du standby
* Gestion du debug
* Avertissements pour PresenterTrack
* Support pour plusieurs sorties audio dépendant du volume (extra)
* Analyse des entrées audio avec événements
* Interface utilisateur séparée du code
* Chaines de texte dans la configuration
* Système de **mise-à-jour automatique** via une page web ou github
* Gestion du "do not disturb"
* Panneau de contrôle **administrateur**
* Fonctionnalités de diagnostique de base et d'envoi de rapport système pour analyse
* 2 examples de modules, 3 examples de scénarios
* **Un API simple et puissant**

## Configuration
Le fichier de configuration unique se nomme "config.js". Il contient les paramètres du système, des modules, des scénarios, des statuts, des appareils et des groupes.
Chaque section est expliquée ci-dessous.

### Importation des scénarios
```JS
/*****************************/
//Import scenarios here with syntax: import * as SCE_Name from './SCE_Name';
import * as sce_standby from './sce_standby';
import * as sce_como_type1 from './sce_como_type1';
import * as sce_firealarm from './sce_firealarm';
//Add scenarios to config.scenarios below.
/****************************/
```
Dans cette section sont importés les scénarios. Les scénarios sont toujours importés avec un wildcard (*) et le nom des fichiers sont toujours préfixés de "sce_".

### Importation des modules
```JS
/****************************/
//Import modules below
import * as mod_autosauce from './mod_autosauce';
import * as mod_hidcameraman from './mod_hidcameraman';
/****************************/
```
Dans cette section sont importés les modules. Les modules sont toujours importés avec un wildcard (*) et le nom des fichiers sont toujours préfixés de "mod_".

### Importation des appareils (devices) et des drivers
```JS
/****************************/
//Import drivers or drivers libraries below
import * as devicesLibrary from './devicesLibrary';
import * as driversLibrary from './driversLibrary';
/****************************/
```
Dans cette section sont importés les devices et les drivers. Il n'y a pas de nommenclature standard pour ces fichiers.

### Définition du produit
```JS
export const PRODUCT = 'PrepOS (dev)';
export const VERSION = '0.0.1';
```
Définition du nom de produit et de la version. Il n'est pas recommandé de modifier ces variables.

### Configuration, section "system"
```JS
  system: {
    coldBootWait: 120,                            // Temps (secondes) qui détermine un "cold boot"
    debugLevel: DEBUGLEVEL.MEDIUM,                // Niveau de débug (LOW, MEDIUM, HIGH)
    debugInternalMessages: false,                 // <true, false> Affichage des messages "xapi.Event.Messages"
    messagesPacing: 500,                          // Temps (ms) entre les messages de type "xpi.Command.Message"
    initDelay: 1000,                              // Temps (ms) avant l'initialisation du système
    newSessionDelay: 5000,                        // Temps (ms) pour l'ouverture d'une nouvelle session. Une progressbar s'affiche.
    forceStandby: true,                           // <true, false> Forcer un standby à une heure précise, peu importe si un appel ou une présentation sont actifs
    forceStandbyTime: '04:00',                    // Heure à laquelle le standby sera forcé
    requiredPeripheralsCheckInterval: 30000,      // Temps (ms) entre les vérifications des périphériques identifiés comme "requiredPeripheral"
    usePresenterTrack: true,                      // <true, false> Défini si PresenterTrack est utilisé. Une autre valeur identique se trouve dans systemStatus
    forcePresenterTrackActivation: false,         // <true, false> Est-ce que l'activation du PresenterTrack est forcée par le système, peu importe si le scénario actif le supporte ou pas
    presenterTrackConnector: 3,                   // Numéro du connecteur d'entrée sur lequel est connecté la caméra utilisée par le PresenterTrack
    settingsMenu: 'Locked',                       // <Locked, Unlocked> Détermine si le panneau de paramètre est vérouillé
    disableAutoLightsWhenWidgetInteraction: true, // <true, false> Détermine si le contrôle automatique de l'éclairage est automatiquement désactivé lorsqu'un widget de Light ou LightScene est touché par l'utilisateur
    systemReportApiKey: 'key',                    // Clé d'api de "paste.ee" utilisé pour l'envoi de rapport système
    onStandby: {
      setDND: false,                              // <true, false> Détermine si le mode "ne pas déranger" est activé lors du standby
      clearCallHistory: false,                    // <true, false> Détermine si l'historique d'appel est supprimé lors du standby
      enableScenario: 'standby'                   // Scénario à activer lors du standby. Le système est livré avec un scénario conseillé nommé "standby", fichier "sce_standby"
    },
    onWakeup: {
      enableScenario: 'comotype1'                 // Scénario à activer lors de la sortie du standby (wakeup).
    }
  }
```

### Configuration, section "audio"
```JS
  audio: {
    extra: {
      enabled: true,                                // <true, false> Détermine si le système gère le volume comme étant "extra", c-a-d plus fort que le volume recommandé
      outputGroup: 'system.audio.extra.output',     // Groupe contenant les devices de type "AudioOutputGroup" à utiliser si une autre sortie audio supplémentaire doit être activée au-dessu d'un certain niveau
      inputGroup: 'system.audio.extra.inputs',      // Groupe contenant les devices de type "AudioInputGroup" à connecter au outputGroup si une sortie audio supplémentaire doit être activée au-dessus d'un certain niveau
      setGainZero: ['system.audio.presentermics'],  // Groupe contenant les devices de type "AudioInput" dont le gain sera mit à "0" si choisi par l'utilisateur (recommandé pour les appareils contrôlables par l'utilisateur)
      setStatusOff: ['AudienceMics'],               // Groupe contenant les devices de type "AudioInput" dont le le mode sera mit à "off" si choisi par l'utilsateur (recommandé pour les appareils non-contrôlables par l'utilisateur)
      overVolume: 75                                // Détermine la limite entre le volume normal et le volume élevé, en pourcentage
    }
  }
```
