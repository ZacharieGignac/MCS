# MCS - Modular Control System

**Version:** 1.3.0-dev  
**License:** MIT

> Un système de contrôle modulaire et extensible pour les équipements de visioconférence Cisco Webex, conçu pour orchestrer des environnements collaboratifs complexes.

---

## 📋 Vue d'ensemble

MCS (Modular Control System) est une plateforme de contrôle avancée fonctionnant comme macro sur les codecs Webex. Il offre une architecture modulaire permettant de créer des expériences utilisateur personnalisées et d'automatiser la gestion d'équipements audiovisuels.

### Principales caractéristiques

- **Architecture modulaire** : Système à plugins permettant l'ajout de fonctionnalités personnalisées sans modifier le core
- **Gestion multi-périphériques** : Contrôle unifié des écrans, projecteurs, éclairages, volets, audio et caméras
- **Scénarios intelligents** : Workflows automatisés adaptés aux différents modes d'utilisation (visioconférence, présentation, BYOD)
- **Interface utilisateur dynamique** : Génération automatique d'interfaces Touch10/Navigator basée sur la configuration
- **API extensible** : Framework `zapi` offrant des abstractions de haut niveau pour le développement

---

## 🏗️ Architecture

### Composants principaux

```
MCS/
├── core.js              # Moteur principal du système
├── config.js            # Configuration des devices et scénarios
├── devices.js           # Gestion des périphériques
├── scenarios.js         # Gestionnaire de scénarios
├── modules.js           # Système de modules (plugins)
├── communication.js     # Communication inter-système
├── watchdog.js          # Surveillance et auto-récupération
├── devicesLibrary.js    # Bibliothèque de drivers
├── driversLibrary.js    # Implémentations des drivers
└── docs/                # Documentation complète
```

### Concepts clés

#### Devices (Périphériques)

Les **devices** représentent les équipements physiques ou logiques que MCS contrôle. Chaque device possède un type, un ID unique et un driver.

**Types supportés :**
- `DISPLAY` / `SCREEN` : Écrans, projecteurs, volets
- `LIGHTSCENE` / `LIGHT` : Scènes d'éclairage et lumières individuelles
- `AUDIOINPUT` / `AUDIOOUTPUT` : Entrées et sorties audio (micro, haut-parleurs)
- `AUDIOINPUTGROUP` / `AUDIOOUTPUTGROUP` : Groupes audio pour routage intelligent
- `CAMERA` / `CAMERAPRESET` : Caméras et positions prédéfinies
- `SOFTWAREDEVICE` : Périphériques logiciels personnalisés

#### Drivers

Les **drivers** implémentent la logique de contrôle spécifique à chaque type d'équipement :
- Drivers série : Sony, Epson, Panasonic (projecteurs)
- Drivers réseau : iTach Flex (relais IP), AES67 (audio réseau)
- Drivers USB : Audio USB, communication série USB
- Drivers xAPI : CEC, caméras Cisco, audio codec

#### Scénarios

Les **scénarios** définissent le comportement du système selon le contexte d'utilisation. Un scénario orchestre :
- L'interface utilisateur (panneaux, widgets)
- Les modes opérationnels (présentation, visioconférence, standby)
- Le routage audio/vidéo
- L'activation automatique des équipements

**Scénarios inclus :**
- `sce_como_type1` / `sce_como_type2` : Systèmes Comodale (salles de visioconférence avancées)
- `sce_standby` : Gestion de mise en veille intelligente
- `sce_firealarm` : Intégration alarme incendie
- `sce_example` : Modèle de démarrage

#### Modules

Les **modules** ajoutent des fonctionnalités optionnelles au système :
- `mod_autogrid` : Bascule automatique en mode grille lors des appels
- `mod_cafeine` : Optimise l'allumage des écrans (blanking au lieu d'extinction)
- `mod_regisseur` : Contrôle caméra automatique basé sur les événements
- `mod_telemetry` : Collecte de données de télémétrie
- `mod_psacamcontrols` : Contrôles caméra personnalisés

#### SystemStatus

Le **SystemStatus** est un système de variables globales permettant la communication entre composants :
- `Occupancy` : Occupation de la salle
- `PresenterDetected` : Détection du présentateur
- `PresenterLocation` : Localisation (local/remote)
- `byod` : État BYOD (Bring Your Own Device)
- Variables personnalisées pour workflows spécifiques

---

## 🚀 Démarrage rapide

### Prérequis

- Codec Webex avec RoomOS (Room Kit, Board, Desk, etc.)
- Accès administrateur au codec
- Connaissances en JavaScript ES6+

### Installation

1. **Copier la configuration exemple :**
   ```bash
   cp config.js.example config.js
   ```

2. **Éditer `config.js`** selon votre environnement :
   - Définir vos devices (écrans, audio, caméras)
   - Configurer le scénario souhaité
   - Activer les modules nécessaires

3. **Déployer sur le codec :**
   - Via l'interface web : Intégrations > Macro Editor
   - Téléverser tous les fichiers `.js`
   - Activer la macro `core`

4. **Déployer le watchdog (recommandé) :**
   - Téléverser `watchdog.js` comme macro séparée
   - L'activer pour surveiller le core

### Configuration minimale

```javascript
// config.js - Exemple minimal
const CONFIG = {
  devices: [
    {
      id: 'main_display',
      type: 'DISPLAY',
      driver: driversLibrary.DisplayDriver_CEC,
      name: 'Écran principal'
    }
  ],
  
  scenario: scenarios.standby,
  
  modules: []
};
```

---

## 📚 Documentation

La documentation complète est disponible dans le dossier [`docs/`](./docs/):

### Guides utilisateur
- **[Index de la documentation](./docs/README.md)** - Point d'entrée principal
- **[Configuration](./docs/Manual-Configuration.md)** - Guide de configuration
- **[Devices](./docs/Manual-Devices.md)** - Types de périphériques et drivers
- **[Scénarios](./docs/Manual-Scenarios.md)** - Création de scénarios
- **[Modules](./docs/Manual-Modules.md)** - Développement de modules
- **[Événements](./docs/Manual-Events.md)** - Système d'événements
- **[Interface utilisateur](./docs/Manual-Widget_Mapping_and_Actions.md)** - Mapping des widgets

### Guides spécifiques
- **[Scénario ComoType1](./docs/Manual-ComoType1.md)** - Système Comodale Type 1
- **[Scénario ComoType2](./docs/Manual-ComoType2.md)** - Système Comodale Type 2 (avancé)
- **[Mode Standby](./docs/Manual-Standby.md)** - Gestion de la mise en veille

### Référence technique
- **[API v1](./docs/APIv1.md)** - Documentation de l'API zapi
- **[CHANGELOG](./CHANGELOG.md)** - Historique des versions

---

## 🔧 Fonctionnalités avancées

### Mises à jour OTA (Over-The-Air)

MCS intègre un système de mise à jour depuis l'interface Touch10/Navigator :
- Sélection du système et de la version depuis GitHub
- Pagination et navigation intuitive
- Confirmation avant installation
- Déploiement via `Provisioning.Service.Fetch`

**Utilisation :** Appuyer sur le bouton `system_update` dans l'interface.

### Watchdog automatique

Le watchdog surveille la santé du core et redémarre automatiquement en cas de non-réponse :
- Ping/Pong via messages XAPI internes
- Timeout de 15 secondes
- Redémarrage après 3 échecs consécutifs
- Journalisation complète des incidents

### Routage audio intelligent

Le système gère automatiquement le routage audio selon le contexte :
- Détection des entrées distantes par rôle (Presentation vs. autres)
- Routage dynamique selon `PresenterLocation`
- Support des groupes audio pour configurations complexes
- Contrôle fin du gain par canal (AES67, USB)

### Intégration Webex Control Hub

MCS rapporte sa version dans Control Hub en créant un périphérique virtuel nommé "MCS" avec la version actuelle, facilitant l'inventaire et le suivi des déploiements.

---

## 🛠️ Développement

### Structure du zapi

Le framework `zapi` (v1) expose les API suivantes :

```javascript
zapi.devices      // Gestion des devices
zapi.scenarios    // Contrôle des scénarios
zapi.modules      // Gestion des modules
zapi.audio        // API audio avancée
zapi.systemStatus // Variables globales
zapi.ui           // Contrôle de l'interface
zapi.communication // Communication inter-système
zapi.telemetry    // Collecte de télémétrie
```

### Créer un module personnalisé

```javascript
// modules/mod_example.js
const zapi = require('zapi').v1;

module.exports = {
  id: 'my_module',
  name: 'Mon Module',
  version: '1.0.0',
  
  init: function() {
    zapi.systemStatus.onChange('Occupancy', (value) => {
      console.log('Occupation changée:', value);
    });
  },
  
  deinit: function() {
    // Nettoyage
  }
};
```

### Créer un driver personnalisé

```javascript
// driversLibrary.js
class MyCustomDriver {
  constructor(device, config) {
    this.device = device;
    this.config = config;
  }
  
  powerOn() {
    // Logique d'allumage
  }
  
  powerOff() {
    // Logique d'extinction
  }
}
```

---

## 📊 Cas d'usage

### Salle de visioconférence Comodale

Configuration multi-écrans avec gestion intelligente de l'affichage :
- Écrans de présentation (local + distant)
- Télésouffleur pour le présentateur
- Affichages secondaires
- Routage audio contextuel
- Modes d'affichage dynamiques (20 modes)

### Salle de classe hybride

Intégration BYOD avec gestion automatique :
- Détection HDMI Passthrough ou Webcam
- Bascule automatique des sources
- Contrôle d'éclairage selon le mode
- Enregistrement et diffusion

### Salle de conseil

Contrôle total de l'environnement :
- Gestion des volets motorisés
- Scènes d'éclairage prédéfinies
- Projecteurs et écrans multiples
- Presets caméra pour différentes configurations

---

## 🔐 Sécurité et bonnes pratiques

- **Ne jamais commettre `config.js`** : Utilisez `config.js.example` comme modèle
- **Valider les configurations** : Vérifier les IDs, ports série et adresses IP
- **Tester les drivers** : Valider chaque driver avant déploiement en production
- **Monitoring** : Activer le watchdog pour la surveillance continue
- **Logs** : Consulter les logs macro pour le débogage
- **Sauvegardes** : Exporter régulièrement les configurations

---

## 📝 Changelog

Consultez [CHANGELOG.md](./CHANGELOG.md) pour l'historique complet des versions.

**Version actuelle :** 1.3.0-dev (en développement)

---

## 📧 Support

Pour obtenir de l'aide :
1. Consultez la documentation dans `docs/`
2. Vérifiez les logs de la macro dans l'interface du codec
3. Consultez le CHANGELOG pour les problèmes connus
4. Contactez l'équipe de support technique

---

**Développé avec ❤️ pour les environnements collaboratifs Cisco Webex**
