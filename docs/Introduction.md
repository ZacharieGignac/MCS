# MCS (nom temporaire)
MCS est une collection de macros pour les systèmes Cisco Webex, constituant un système intégré, modulaire, flexible et simple à utiliser, destiné à être utilisé comme point central de contrôle dans une salle de cours ou de réunion. La logique de la salle ainsi que son interface utilisateur peuvent donc être centralisés sur un seul appareil qui utilise un langage de programmation connu et moderne.

## Aspects principaux
* Utilisation de seulement 1 macro active, laissant ainsi place à 9 autres macros activées
* Unifier la configuration de l'ensemble du système en un seul fichier
* Ajouter des fonctionnalités accessible à l'ensemble du système par un concept de **modules**
* Supporter plusieurs comportements **complètement distinct** sur le même système par un concept de **scénario** (par exmeple, "mode manuel" et "mode automatique"
* Virtualisation des appareils internes ou externes, rendant les particularités de chaque salle plus simple à prendre en charge par chaque scénario
* Groupement de différents type d'appareils dans des groupes nommés, dont plusieurs groupes standard
* Architecture de drivers d'appareil, qui permet d'étendre les fonctionnalités de base à d'autres appareils du même type mais qui ne partagent pas tous le même fonctionnement (protocole, connectique)
* Une grande collection d'appareils supportés directement dans la distribution (13) dont plusieurs supportant des drivers: Camera, LightScene, Light, AudioInputGroup, AudioOutputGroup, Display, CameraPreset, AudioInput, ControlSystem, Screen, SoftwareDevice, AudioReporter, Shade
* Une grande collection de drivers supportés directement dans la distribution (14) pour une variété d'appareils
* Un système de gestion et d'annonce de statut système global, avec événements, avec valeurs par défaut
* Mapping automatique des widgets pour chaque appareil, pour chaque statut système, actions
* Gestion du boot (warm, cold)
* Gestion du standby
* Gestion du debug
* Avertissements pour PresenterTrack
* Support pour plusieurs sorties audio dépendant du volume (extra)
* Analyse des entrées audio avec événements
* Interface utilisateur séparée du code
* Chaines de texte dans la configuration
* Système de mise-à-jour automatique via une page web ou github
* Gestion du "do not disturb"
* Panneau de contrôle administrateur
* Fonctionnalités de diagnostique de base et d'envoi de rapport système pour analyse
* 2 examples de modules, 3 examples de scénarios
* Un API simple et puissant
