# Standby; sce_standby

Table des matières
- [Présentation](#standby-sce_standby)
- [Comportement à l’activation](#comportement-à-lactivation)
Ce scénario inclus dans le système est le scénario de standby par défaut.

## Comportement à l’activation

Voici ce qui est effectué lors de l'activation du scénario sce_standby:
- Arrêt de la présentation
- Remise du volume au niveau par défaut
- Reset de tous les appareils (devices)
- Reset de toutes les valeurs de `systemStatus`
- Appel de la scène d'éclairage `system.lightscene.standby`
- Activation du standby
