# Manuel - Scénario Comodale Type 2

## Table des Matières
- [Vue d'ensemble](#vue-densemble)
- [Différences avec le Type 1](#différences-avec-le-type-1)
- [Groupes d'affichages](#groupes-daffichages)
- [Configuration](#configuration)
  - [Groupes d'affichages requis](#groupes-daffichages-requis)
  - [Groupes d'affichages optionnels](#groupes-daffichages-optionnels)
  - [Groupes de toiles](#groupes-de-toiles)
  - [Groupes d'éclairage](#groupes-déclairage)
  - [Groupes audio](#groupes-audio)
  - [Caméras et presets](#caméras-et-presets)
- [Modes de fonctionnement](#modes-de-fonctionnement)
- [Fonctionnalités avancées](#fonctionnalités-avancées)

## Vue d'ensemble

Le scénario **Comodale Type 2** (`sce_como_type2`) est une évolution du scénario Comodale Type 1, conçu pour des salles comodales plus complexes avec des besoins d'affichage étendus. Il offre un support natif pour :

- **Télésouffleurs** (Teleprompter) pour le présentateur
- **Affichages secondaires de présentation** pour une visualisation étendue
- **Modes d'affichage avancés** (jusqu'à 20 configurations différentes)
- **Gestion audio intelligente** avec routage basé sur les rôles (Presentation vs. autres)
- **Configuration granulaire** des comportements d'affichage

**Version:** 1.3.0-dev  
**ID du scénario:** `comotype2`  
**Fichier:** `sce_como_type2.js`

## Différences avec le Type 1

### Nouveaux groupes d'affichages

Le Type 2 introduit deux nouveaux groupes d'affichages absents du Type 1 :

| Groupe | Type 1 | Type 2 | Description |
|--------|--------|--------|-------------|
| `system.presentation.main` | ✓ | ✓ | Affichages principaux de présentation |
| `system.farend.main` | ✓ | ✓ | Affichages pour les participants distants |
| `system.byod.main` | ✓ | ✓ | Affichages BYOD (Bring Your Own Device) |
| `system.presentation.teleprompter` | ✗ | ✓ | **Nouveau:** Télésouffleur pour le présentateur |
| `system.presentation.secondary` | ✗ | ✓ | **Nouveau:** Affichages secondaires de présentation |

### Nouveaux groupes de toiles motorisées

| Groupe | Type 1 | Type 2 | Description |
|--------|--------|--------|-------------|
| `system.presentation.main` | ✓ | ✓ | Toiles principales de présentation |
| `system.farend.main` | ✓ | ✓ | Toiles pour les participants distants |
| `system.presentation.teleprompter` | ✗ | ✓ | **Nouveau:** Toiles pour télésouffleur |
| `system.presentation.secondary` | ✗ | ✓ | **Nouveau:** Toiles secondaires |

### Modes de fonctionnement étendus

Le Type 2 possède **12 modes distincts** (simplification par rapport aux 20 modes de l'ancienne version), permettant une gestion claire des configurations d'affichage selon :
- Présence de présentateur (local/distant)
- État de présentation (active/inactive)
- Mode "Clear Presentation Zone" (activé/désactivé)
- Activation du télésouffleur (`UseTeleprompter`)
- Activation des affichages secondaires (`UseSecondaryPresentationDisplays`)

La gestion des affichages permanents (`alwaysUse: true`) est désormais intégrée dynamiquement dans chaque mode plutôt que de multiplier les modes.

### Rôles des moniteurs étendus

Le Type 2 utilise des rôles de moniteur supplémentaires pour supporter les configurations avancées :

- `Single` : Un seul affichage actif
- `DualPresentationOnly` : Deux affichages en mode présentation uniquement
- `Triple` : Trois affichages actifs
- `TriplePresentationOnly` : Trois affichages en mode présentation uniquement

### Gestion audio intelligente

Les deux scénarios partagent la même logique de routage audio intelligent introduite en v1.2.0 :
- Détection et routage automatique des flux audio avec rôle `Presentation`
- Routage conditionnel des autres flux selon `PresenterLocation`
- Support de la méthode `connectSpecificRemoteInputs()` / `disconnectSpecificRemoteInputs()`

## Groupes d'affichages

### Affichages de présentation (`system.presentation.main`)

**Rôle :** Afficher le contenu de présentation (partage d'écran, contenu local) visible par le présentateur local.

**Modes d'affichage :** 
- `First`, `Second`, `PresentationOnly` selon la configuration

**Comportement :**
- S'allument lors du partage de présentation
- Peuvent rester allumés en permanence si configurés avec `alwaysUse: true`
- Supportent le blanking pour économie d'énergie si `supportsBlanking: true`
- Le routage vidéo via Video Matrix peut être désactivé avec `skipVideoMatrix: true`

### Affichages distants (`system.farend.main`)

**Rôle :** Afficher les participants distants lors d'un appel en visioconférence.

**Modes d'affichage :** 
- `First`, `Second` selon la configuration

**Comportement :**
- S'allument lors de la connexion d'un appel
- Affichent le flux vidéo distant via Video Matrix
- Peuvent afficher la source vidéo courante (`currentMainVideoSource`)

### Télésouffleurs (`system.presentation.teleprompter`)

**Rôle :** Afficher le contenu de présentation directement face au présentateur, servant de télésouffleur.

**Activation :** Contrôlé par le SystemStatus `UseTeleprompter`

**Modes d'affichage :**
- `First` : Quand le télésouffleur affiche le flux principal
- `PresentationOnly` : Quand le télésouffleur affiche uniquement la présentation

**Comportement :**
- S'allume uniquement si `UseTeleprompter == ON`
- Affiche le contenu de présentation lorsqu'une présentation est active
- Peut afficher le flux principal selon le mode
- S'éteint automatiquement si le télésouffleur est désactivé

**Configuration typique :**
```javascript
{
  id: 'teleprompter_1',
  type: 'DISPLAY',
  driver: DisplayDriver_serial_sonybpj,
  group: 'system.presentation.teleprompter',
  connector: 2,
  // ... autres paramètres
}
```

### Affichages secondaires (`system.presentation.secondary`)

**Rôle :** Fournir des affichages supplémentaires de présentation pour une meilleure visibilité dans la salle.

**Activation :** Contrôlé par le SystemStatus `UseSecondaryPresentationDisplays`

**Modes d'affichage :**
- `First` : Quand les affichages secondaires affichent le flux principal
- `PresentationOnly` : Quand les affichages secondaires affichent uniquement la présentation

**Comportement :**
- S'allument uniquement si `UseSecondaryPresentationDisplays == ON`
- Affichent le contenu de présentation lorsqu'une présentation est active
- S'éteignent automatiquement si les affichages secondaires sont désactivés

**Configuration typique :**
```javascript
{
  id: 'secondary_display_1',
  type: 'DISPLAY',
  driver: DisplayDriver_serial_epson,
  group: 'system.presentation.secondary',
  connector: 2,
  // ... autres paramètres
}
```

## Configuration

### Groupes d'affichages requis

Les groupes suivants sont **obligatoires** pour le fonctionnement du scénario :

```javascript
// Affichages principaux
displays.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.main');
displays.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.farend.main');
```

### Groupes d'affichages optionnels

Les groupes suivants sont **optionnels** mais recommandés pour exploiter toutes les fonctionnalités :

```javascript
// Affichages optionnels
displays.byod = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.byod.main');
displays.teleprompter = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.teleprompter');
displays.secondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.DISPLAY, 'system.presentation.secondary');
```

### Groupes de toiles

Les toiles motorisées supportent les mêmes groupes que les affichages :

```javascript
// Toiles requises
screens.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.main');
screens.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.farend.main');

// Toiles optionnelles
screens.teleprompter = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.teleprompter');
screens.secondary = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.SCREEN, 'system.presentation.secondary');
```

**Configuration d'une toile :**
```javascript
{
  id: 'screen_teleprompter',
  type: 'SCREEN',
  driver: ScreenDriver_gpio,
  group: 'system.presentation.teleprompter',
  alwaysUse: false,  // Si true, ne se rétracte jamais même en mode "Clear Zone"
  defaultPosition: 'up',
  // ... paramètres du driver
}
```

### Groupes d'éclairage

Trois scènes d'éclairage sont supportées :

```javascript
lightscenes.idle = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.idle');
lightscenes.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.presentation');
lightscenes.writing = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.LIGHTSCENE, 'system.lightscene.writing');
```

**Activation :**
- `idle` : Aucun appel, aucune présentation
- `presentation` : Présentation active OU présentateur distant
- `writing` : Mode "Clear Presentation Zone" activé

### Groupes audio

#### Groupes de sortie audio

```javascript
audiooutputgroups.presentation = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOOUTPUTGROUP, 'system.presentation.main');
audiooutputgroups.farend = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOOUTPUTGROUP, 'system.farend.main');
```

**Routage intelligent :**
- Les entrées distantes avec rôle `Presentation` → `system.presentation.main`
- Les autres entrées distantes → selon `PresenterLocation`
  - Si `PresenterLocation == LOCAL` → `system.farend.main`
  - Si `PresenterLocation == REMOTE` → `system.presentation.main`

#### Groupes d'entrée audio

```javascript
audioinputs.presentermics = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOINPUT, 'system.audio.presentermics');
audioinputs.audiencemics = zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.AUDIOINPUT, 'system.audio.audiencemics');
```

**Contrôles :**
- Activés/désactivés via SystemStatus `PresenterMics` et `AudienceMics`

### Caméras et presets

```javascript
// Caméras et presets pour le présentateur
zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERA, 'system.presentation.main');
zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERAPRESET, 'system.presentation.main');

// Caméras et presets pour l'audience
zapi.devices.getDevicesByTypeInGroup(DEVICETYPE.CAMERAPRESET, 'system.farend.main');
```

**Gestion automatique des caméras :**
- **PresenterTrack :** Activé si `UsePresenterTrack == ON` et présentateur local
- **AutoCamPresets :** Active automatiquement les presets appropriés selon `PresenterLocation`

## Modes de fonctionnement

Le scénario Type 2 possède 12 modes distincts, identifiés par `comotype2Mode`. Ces modes sont divisés en deux groupes : `CLEARZONE` (quand `ClearPresentationZone` est actif) et `NORMAL`.

### Facteurs déterminant le mode

1. **needClearZone :** État du SystemStatus `ClearPresentationZone`
2. **presentationActive :** Une présentation est en cours
3. **callConnected :** Un appel est en cours
4. **presenterLocation :** `LOCAL` ou `REMOTE`

### Liste des modes

#### Modes CLEARZONE (Zone de présentation dégagée)

Ces modes sont actifs quand `ClearPresentationZone` est sur `on`. Ils privilégient la visibilité de la zone de présentation (souvent le mur où l'on écrit).

- **CLEARZONE.1** : Aucun appel, pas de présentation.
- **CLEARZONE.2** : Aucun appel, présentation active.
- **CLEARZONE.3** : Appel connecté, pas de présentation, présentateur LOCAL.
- **CLEARZONE.4** : Appel connecté, présentation active (Présentateur LOCAL).
- **CLEARZONE.5** : Appel connecté, pas de présentation, présentateur REMOTE.
- **CLEARZONE.6** : Appel connecté, présentation active, présentateur REMOTE.

#### Modes NORMAL (Fonctionnement standard)

Ces modes sont actifs quand `ClearPresentationZone` est sur `off`.

- **NORMAL.1** : Aucun appel, pas de présentation.
- **NORMAL.2** : Aucun appel, présentation active.
- **NORMAL.3** : Appel connecté, pas de présentation (Présentateur LOCAL).
- **NORMAL.4** : Appel connecté, présentation active (Présentateur LOCAL).
- **NORMAL.5** : Appel connecté, pas de présentation, présentateur REMOTE.
- **NORMAL.6** : Appel connecté, présentation active, présentateur REMOTE.

### Comportement des affichages par mode

Chaque mode configure les groupes d'affichages (Présentation, Distant, Télésouffleur, Secondaire) de manière spécifique.
Les affichages configurés avec `alwaysUse: true` (Affichages permanents) restent allumés même si le mode prévoit de les éteindre (sauf cas spécifiques de blanking).

#### Exemple : Mode NORMAL.6 (Appel + Présentation + Présentateur Distant)
- **Affichages Distants :** Allumés (Affichent les participants)
- **Affichages Présentation :** Allumés (Affichent la présentation)
- **Télésouffleur :** Affiche la présentation uniquement (si activé)
- **Affichages Secondaires :** Allumés (si activés)

- **Video Matrix :** Appliquée pour router la source vidéo courante

#### Mode 17 : Présentation locale, pas de Clear Zone, SANS affichages permanents
- **Configuration :** `TriplePresentationOnly`
- **Affichages présentation :** `PresentationOnly`, allumés
- **Affichages distants :** `FIRST`, allumés
- **Télésouffleur :** `PresentationOnly` si activé
- **Affichages secondaires :** `PresentationOnly` si activés

#### Mode 20 : Présentateur distant + présentation, SANS affichages permanents
- **Configuration :** `Single`
- **Affichages présentation :** `FIRST`, allumés pour tout afficher
- **Affichages distants :** Éteints et blankés
- **Télésouffleur :** `PresentationOnly` si activé
- **Affichages secondaires :** `PresentationOnly` si activés

### Tableau récapitulatif des modes

| Mode | Permanent Displays | Clear Zone | Présentation | Présentateur distant | Moniteurs Config | Description |
|------|-------------------|------------|--------------|---------------------|------------------|-------------|
| 1 | Oui | Oui | Non | Non | `TriplePresentationOnly` | Veille avec affichages permanents |
| 2 | Oui | Oui | Oui | Non (Local) | `TriplePresentationOnly` | Présentation locale, zone dégagée |
| 3 | Oui | Oui | Oui | Non (Distant) | `TriplePresentationOnly` | Présentation distante, zone dégagée |
| 4 | Oui | Oui | Non | Oui | `Single` | Présentateur distant sans présentation |
| 5 | Oui | Oui | Oui | Oui | `Single` | Présentateur distant avec présentation |
| 6 | Oui | Non | Non | Non | `TriplePresentationOnly` | Veille sans zone dégagée |
| 7 | Oui | Non | Oui | Non (Local) | `TriplePresentationOnly` | Présentation locale normale |
| 8 | Oui | Non | Oui | Non (Distant) | `TriplePresentationOnly` | Présentation distante normale |
| 9 | Oui | Non | Non | Oui | `Single` | Appel distant sans présentation |
| 10 | Oui | Non | Oui | Oui | `DualPresentationOnly` | Appel avec présentation |
| 11 | Non | Oui | Non | Non | `TriplePresentationOnly` | Veille sans affichages permanents |
| 12 | Non | Oui | Oui | Non (Local) | `TriplePresentationOnly` | Présentation locale, télésouffleur |
| 13 | Non | Oui | Oui | Non (Distant) | `TriplePresentationOnly` | Présentation distante, télésouffleur |
| 14 | Non | Oui | Non | Oui | `Single` | Distant sans présentation |
| 15 | Non | Oui | Oui | Oui | `TriplePresentationOnly` | Distant avec présentation |
| 16 | Non | Non | Non | Non | `TriplePresentationOnly` | Veille totale |
| 17 | Non | Non | Oui | Non (Local) | `TriplePresentationOnly` | Présentation locale complète |
| 18 | Non | Non | Oui | Non (Distant) | `TriplePresentationOnly` | Présentation distante complète |
| 19 | Non | Non | Non | Oui | `Single` | Appel distant simple |
| 20 | Non | Non | Oui | Oui | `Single` | Appel distant avec présentation |

## Fonctionnalités avancées

### Anti-scintillement des rôles d'affichage (debounce)

Pour éviter les clignotements lors de changements rapides d'état, le scénario implémente un mécanisme de « debouncing » lors du réglage des rôles de moniteurs (`MonitorRole`).

- Activation via `sce_como_type2.enableStateEvaluationDebounce: true` dans la configuration.
- Peut également être configuré sous `system.enableStateEvaluationDebounce` (fallback).
- Par connecteur, la dernière demande de rôle est appliquée après un court délai, les demandes précédentes sont annulées.
- Réduit les appels xAPI redondants et les changements de rôle inutiles pendant les transitions rapides.

Effet pratique: lors de bascules de présentation/appel successives, les affichages conservent une transition fluide sans flicker.

### Détection automatique des rôles audio

Le scénario Type 2 utilise la fonctionnalité `zapi.audio.getRemoteInputsDetailed()` pour détecter les flux audio entrants et leurs rôles :

```javascript
const detailed = await zapi.audio.getRemoteInputsDetailed();
// Retourne : [{ id: '1', role: 'presentation', callId: 'xxx', streamId: 'yyy' }, ...]
```

Les flux avec `role === 'presentation'` sont automatiquement routés vers les haut-parleurs de présentation.

### Sonde de détection de présentation distante

Lorsqu'une présentation démarre ou qu'un appel se connecte, le scénario lance une sonde de détection (`_scheduleRemotePresentationProbe()`) qui :

1. Vérifie périodiquement (6 tentatives, 350ms d'intervalle) la présence de flux audio avec rôle `Presentation`
2. Route immédiatement ces flux vers les sorties appropriées
3. S'arrête dès qu'un flux de présentation est détecté

Cette sonde évite les délais de routage audio lors du démarrage de présentation.

### Override audio pour les flux de présentation

Lorsqu’un flux distant avec rôle `Presentation` est détecté, le scénario applique un override explicite:

- Connexion des entrées `Presentation` vers `audiooutputgroups.presentation`.
- Déconnexion des mêmes entrées de `audiooutputgroups.farend` pour éviter un double acheminement.
- Les autres entrées distantes continuent de suivre la logique par `PresenterLocation`.

Cela garantit que le son de la présentation distante est toujours dirigé vers le groupe de présentation, indépendamment d’autres états.

### Logique caméra unifiée avec BYOD

La gestion des caméras tient compte de l’état BYOD unifié (`byod`):

- Si le présentateur est local et que `UsePresenterTrack == on` et qu’un appel est connecté ou `byod == Active`, le flux principal vidéo est réglé sur la caméra de présentation et `PresenterTrack` passe en `Follow`.
- Sinon, `PresenterTrack` est désactivé et des presets sont activés selon `AutoCamPresets` et la localisation (`local`/`remote`).

Cette logique assure une expérience cohérente lors des sessions BYOD (HDMI Passthrough ou Webcam) et des appels.

### Correctif pour affichages de présentation lents

Certains affichages de présentation peuvent nécessiter un délai supplémentaire pour accepter un changement de rôle. Un correctif optionnel est disponible:

- Configurez `sce_como_type2.slowPresentationDisplaysDelay` (en millisecondes).
- Peut également être configuré sous `system.SlowPresentationDisplaysDelay` (fallback).
- Le scénario définit d'abord le rôle `PresentationOnly`, attend le délai configuré (ex: 10000 ms), puis applique le rôle `Second`.

Ce contournement améliore la fiabilité des bascules de rôle pour les affichages plus lents.

**Exemple de configuration :**
```javascript
sce_como_type2: {
  enableStateEvaluationDebounce: true,
  slowPresentationDisplaysDelay: 10000
}
```

### Configuration Video Matrix

Le Type 2 supporte plusieurs méthodes de routage vidéo :

**Méthode 1 : Reset Matrix**
```javascript
matrixReset(displays);  // Réinitialise les assignations
```

**Méthode 2 : Remote Main**
```javascript
matrixRemoteToDisplay(displays);  // Assigne le flux distant principal
```

**Méthode 3 : Current Main Video Source**
```javascript
matrixCurrentMainVideoToDisplay(displays);  // Assigne la source vidéo courante
```

**Méthode 4 : Blank (aucune source)**
```javascript
matrixBlankDisplay(displays);  // Supprime toute assignation
```

**Note :** Les affichages avec `skipVideoMatrix: true` ne reçoivent aucune commande Video Matrix.

### Contrôles SystemStatus

Le scénario Type 2 répond aux SystemStatus suivants :

| SystemStatus | Valeurs | Description |
|--------------|---------|-------------|
| `call` | `Idle`, `Connected` | État de l'appel |
| `presentation` | `NOPRESENTATION`, ... | État de présentation |
| `PresenterLocation` | `local`, `remote` | Localisation du présentateur |
| `byod` | `Active`, `Inactive` | État BYOD unifié |
| `ClearPresentationZone` | `on`, `off` | Active la zone de présentation dégagée |
| `AutoDisplays` | `on`, `off` | Active/désactive la gestion automatique des affichages |
| `AutoScreens` | `on`, `off` | Active/désactive la gestion automatique des toiles |
| `AutoLights` | `on`, `off` | Active/désactive la gestion automatique de l'éclairage |
| `UsePresenterTrack` | `on`, `off` | Active/désactive PresenterTrack |
| `AutoCamPresets` | `on`, `off` | Active/désactive les presets caméra automatiques |
| `UseTeleprompter` | `on`, `off` | Active/désactive le télésouffleur |
| `UseSecondaryPresentationDisplays` | `on`, `off` | Active/désactive les affichages secondaires |
| `PresenterMics` | `on`, `off` | Active/désactive les micros présentateur |
| `AudienceMics` | `on`, `off` | Active/désactive les micros audience |
| `comotype2Mode` | `1-20`, `-1` | Mode actuel du scénario |

### Position PIP par défaut

Le scénario Type 2 supporte la configuration `defaultPipPosition` dans la section `system` de la configuration. Cette option définit la position par défaut du PIP (Picture-in-Picture) lors de l'utilisation du layout "Overlay" (par exemple, lors d'une présentation avec un présentateur distant).

**Valeurs possibles :** `UpperLeft`, `UpperCenter`, `UpperRight`, `CenterLeft`, `CenterRight`, `LowerLeft`, `LowerRight`

**Valeur par défaut :** `UpperRight` (si non spécifié)

**Exemple de configuration :**
```javascript
system: {
  // ... autres paramètres ...
  defaultPipPosition: 'UpperLeft',
}
```

### Panel UI

Le scénario utilise le panel `comotype2_settings` qui doit être créé dans `UI/comotype2_settings.xml`.

**Exemple de structure :**
```xml
<Extensions>
  <Version>1.11</Version>
  <Panel>
    <PanelId>comotype2_settings</PanelId>
    <Type>Statusbar</Type>
    <!-- Widgets pour contrôler UseTeleprompter, UseSecondaryPresentationDisplays, etc. -->
  </Panel>
</Extensions>
```

### Exemple de configuration complète

Voir le fichier `scenarios/sce_como_type2.js` pour la référence complète. Un exemple de configuration dans `config.js` :

```javascript
import { Manifest as Comotype2Manifest, Scenario as Comotype2Scenario } from './scenarios/sce_como_type2';

export const config = {
  // ... configuration système ...
  
  devices: [
    // Affichages principaux de présentation
    {
      id: 'proj_presentation_1',
      type: 'DISPLAY',
      driver: DisplayDriver_serial_sonybpj,
      group: 'system.presentation.main',
      connector: 1,
      alwaysUse: true,  // Affichage permanent
      supportsBlanking: true,
      // ... autres paramètres
    },
    
    // Télésouffleur
    {
      id: 'proj_teleprompter',
      type: 'DISPLAY',
      driver: DisplayDriver_serial_epson,
      group: 'system.presentation.teleprompter',
      connector: 3,
      supportsBlanking: true,
      // ... autres paramètres
    },
    
    // Affichages secondaires
    {
      id: 'display_secondary_1',
      type: 'DISPLAY',
      driver: DisplayDriver_HDMI,
      group: 'system.presentation.secondary',
      connector: 4,
      // ... autres paramètres
    },
    
    // ... autres devices ...
  ],
  
  scenarios: [
    {
      manifest: Comotype2Manifest,
      scenario: Comotype2Scenario
    }
  ]
};
```

---

**Note finale :** Le scénario Comodale Type 2 est en production depuis la version 1.2.1. Des ajustements et améliorations peuvent être apportés selon les retours d'utilisation.
