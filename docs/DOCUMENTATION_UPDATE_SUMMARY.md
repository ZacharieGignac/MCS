# Résumé des mises à jour de la documentation

Date : 3 décembre 2025

## Vue d'ensemble

Cette mise à jour documente les nouveautés introduites depuis la version 1.2.0, notamment le nouveau scénario **sce_como_type2** et les drivers audio ajoutés.

## Fichiers modifiés

### 1. README.md (racine)
**Modifications :**
- Ajout du scénario `sce_como_type2` dans les notes de version 1.2.1
- Référence au nouveau manuel `docs/Manual-ComoType2.md`

### 2. CHANGELOG.md
**Modifications :**
- Ajout d'une section [1.2.1] - En cours
- Documentation du scénario `sce_como_type2`
- Documentation des nouveaux drivers audio
- Référence au nouveau manuel

### 3. docs/README.md (Index de la documentation)
**Modifications :**
- Ajout de l'entrée "Scénario Comodale Type 2: [Manual-ComoType2](./Manual-ComoType2.md)"

### 4. docs/Manual-Devices.md
**Modifications :**
- Documentation complète des nouveaux drivers AudioInput :
  - `AudioInputDriver_codecpro` (déjà existant, documentation améliorée)
  - `AudioInputDriver_codeceq` (nouveau en v1.2.0)
  - `AudioInputDriver_aes67` (nouveau en v1.2.0)
  - `AudioInputDriver_usb` (nouveau en v1.2.0)
  
- Documentation complète des nouveaux drivers AudioOutput :
  - `AudioOutputDriver_codecpro` (déjà existant, documentation améliorée)
  - `AudioOutputDriver_aes67` (nouveau en v1.2.0)
  - `AudioOutputDriver_usb` (nouveau en v1.2.0)

- Notes spécifiques pour chaque driver avec exemples de configuration

### 5. docs/Manual-ComoType2.md (NOUVEAU)
**Contenu :**
- Vue d'ensemble du scénario Comodale Type 2
- Comparaison détaillée avec le Type 1
- Documentation des nouveaux groupes d'affichages :
  - `system.presentation.teleprompter` (télésouffleurs)
  - `system.presentation.secondary` (affichages secondaires)
- Guide de configuration complet
- Description des 20 modes de fonctionnement
- Fonctionnalités avancées :
  - Détection automatique des rôles audio
  - Sonde de détection de présentation distante
  - Configuration Video Matrix
  - Contrôles SystemStatus
- Exemples de configuration

## Nouveautés documentées

### Scénario sce_como_type2

#### Principaux ajouts vs Type 1

1. **Télésouffleurs** (`system.presentation.teleprompter`)
   - Affichages dédiés au présentateur
   - Activation via `UseTeleprompter` SystemStatus
   - Gestion automatique selon le mode de présentation

2. **Affichages secondaires** (`system.presentation.secondary`)
   - Affichages supplémentaires pour présentation étendue
   - Activation via `UseSecondaryPresentationDisplays` SystemStatus
   - Configuration flexible

3. **Modes étendus**
   - 20 modes distincts (vs 20 pour Type 1)
   - Configuration plus granulaire des affichages
   - Support de configurations complexes

4. **Rôles de moniteur avancés**
   - `Triple` et `TriplePresentationOnly` pour 3 affichages
   - Gestion plus fine du routage vidéo

### Nouveaux drivers audio (v1.2.0)

#### AudioInputDriver_codeceq
- Pour codecs EQ, Bar et Board
- Contrôle des connecteurs microphone
- Plage de gain : 0-70

#### AudioInputDriver_aes67
- Pour entrées audio Ethernet (AES67)
- Support de 8 canaux par connecteur
- Contrôle du gain par canal

#### AudioInputDriver_usb
- Pour interfaces audio USB
- Support automatique de Level ou Gain
- Plage contrainte : 0-24

#### AudioOutputDriver_aes67
- Pour sorties audio Ethernet (AES67)
- Mode On/Off uniquement (pas de contrôle de niveau)

#### AudioOutputDriver_usb
- Pour interfaces audio USB en sortie
- Mode On/Off uniquement (pas de contrôle de niveau)

## Guide d'utilisation pour les nouveaux utilisateurs

### Pour configurer un scénario Comodale Type 2 :

1. Lire `docs/Manual-ComoType2.md` en entier
2. Identifier les groupes d'affichages nécessaires
3. Configurer les devices dans `config.js` selon les exemples
4. Créer le panel UI `comotype2_settings.xml`
5. Tester les différents modes de fonctionnement

### Pour utiliser les nouveaux drivers audio :

1. Consulter `docs/Manual-Devices.md` section AudioInput/AudioOutput
2. Choisir le driver approprié selon le type de matériel
3. Configurer les paramètres selon les exemples fournis
4. Vérifier les plages de gain/niveau supportées

## Points clés à retenir

### Scénario Type 2 vs Type 1

| Aspect | Type 1 | Type 2 |
|--------|--------|--------|
| Groupes d'affichages | 3 | 5 |
| Modes de fonctionnement | 20 | 20 |
| Télésouffleurs | Non | Oui |
| Affichages secondaires | Non | Oui |
| Complexité | Moyenne | Élevée |

### Drivers audio

| Driver | Support Gain/Level | Plage | Particularités |
|--------|-------------------|-------|----------------|
| codecpro | Oui | 0-70 | Microphone, HDMI |
| codeceq | Oui | 0-70 | Microphone uniquement |
| aes67 (in) | Oui | Variable | Par canal, 8 canaux |
| usb (in) | Oui | 0-24 | Contrainte automatique |
| aes67 (out) | Non | - | Mode uniquement |
| usb (out) | Non | - | Mode uniquement |

## Prochaines étapes recommandées

1. Tester le scénario `sce_como_type2` dans un environnement de développement
2. Valider les configurations d'affichages avec télésouffleurs et affichages secondaires
3. Vérifier le fonctionnement des nouveaux drivers audio sur différents codecs
4. Recueillir les retours utilisateurs pour améliorer la documentation
5. Ajouter des exemples de configuration complète en annexe

## Contact et support

Pour toute question sur cette documentation ou les fonctionnalités décrites :
- Consulter les fichiers de documentation dans `docs/`
- Vérifier les exemples de configuration dans `scenarios/`
- Référencer le CHANGELOG.md pour l'historique des modifications
