# Comodal (Type 1): sce_comotype1
Ce scénario est destiné aux salles comodales tel qu'installées en 2021. C'est un remplacement direct du logiciel d'origine.

Les groupes nommés, même si ils ne contiennent aucun appareil, **DOIVENT** être présent dans la configuration.

Liste complète des groupes:
- `system.presentation.main`
- `system.farend.main`
- `system.byod.main`
- `system.lightscene.idle`
- `system.lightscene.presentation`
- `system.lightscene.writing`
- `system.audio.presentermics`
- `system.audio.audiencemics`

Voici la configuration de la salle et les appareils supportés

## Affichages
### Présentation (obligatoire)
Un ou plusieurs affichages faisant face à l'auditoire. Utilisé pour les présentations, ou pour afficher une composition d'image lorsque le présentateur est à distance.

Les affichages doivent faire parti groupe `system.presentation.main`.

### Sites distants (obligatoire)
Un ou plusieurs affichages faisant face à la zone de présentation. Utilisé pour l'image des sites distants, ou pour la présentation lorsque le système n'est pas appel.

### BYOD (optionnel)
Ce scénario n'intervient pas sur l'affichage utilisé pour le BYOD. Le comportement par défaut du codec est utilisé.

Il est quand même suggéré de placer l'affichage dans le groupe `system.byod.main`.

Les affichages doivent faire parti du groupe `system.farend.main`.

## Toiles motorisées (optionnel)
Une ou plusieures toiles motorisées pour les affichages de type "Présentation". Les toiles avec la propriété "alwaysUse" à "true" ne seront pas levées lorsque la zone d'écriture est dégagée.

Les toiles doivent faire parti du groupe `system.presentation.main`.

Les toiles motorisées ne sont PAS supportées pour les affichages de type "Sites distants".

## Scènes d'éclairage (optionnel)
Trois (3) scènes d'éclairage sont utilisés par ce scénario:
- `system.lightscene.idle` : Utilisé lorsqu'il n'y a ni présentation ni appels.
- `system.lightscene.presentation` : Utilisé lorsqu'une présentation est en cours (locale ou distante)
- `system.lightscene.writing` : Utilisé pour le mode "Écrire au tableau", maintenant appelé "Dégager la surface"

## Groupes de sortie audio (obligatoire)
### Présentation
Un ou plusieurs groupe de sortie audio pour le son de la présentation.

Doit faire parti du groupe `system.presentation.main`.

### Sites distants
Un ou plusieurs groupes de sortie audio pour le son des sites distants.

Doit faire parti du groupe `system.farend.main`.

## Entrées audio
### Microphones présentateur (optionnel)
Une ou plusieurs entrées audio (microphones) pour le présentateur.

Doit faire parti du groupe `system.audio.presentermics`.

### Microphones auditoire (optionnel)
Une ou plusieurs entrées audio (microphones) pour l'auditoire.

Doit faire parti du groupe `system.audio.audiencemics`.

## Contrôles, interface utilisateur
Ce scénario cachera tous les panels et boutons affichera son propre panneau de paramètres nommé "comotype1_settings", qui comporte les paramètres/contrôles suivants. Il est fortement recommandé de retirer/ajouter les contrôles selon le besoin et la configuration particulière du système. Il est aussi fortement recommandé d'avoir un bouton de fermeture de session, comme celui de base du système qui est généralement nommé `*ACTION$STANDBY`
- Général
  - Emplacement du présentateur <En présence, À distance>
  - Surface d'écriture <Permettre la présentation, Dégager la surface>
  - Câdrer la caméra automatiquement  <on, off>
  - Avertissement câdrage auto. <on, off>
- Microphone
  - Microphones auditoire en présence <on, off>
  - Microphone casque <muet, normal, fort, très fort> (adapter au besoin et à la configuration>
- Éclairage
  - Éclairage automatique <on, off>
  - Scènes d'éclairage [Normal], [Présentation], [Écriture]
  - Contrôles de zone d'éclairage
- Aide, informations de contact


