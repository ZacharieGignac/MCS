# Scénarios
Les scénarios sont des parties de code qui seront exécutés dans le même processus que le système.

Ces scénarios définissent et prennent en charge, un à la fois, le comportement complet du système. Les scénarios sont gérés par un "Scenario Manager" qui s'occupe de changer de scénarios et indiquer à un scénario qu'il doit être activé ou non.

Techniquement, les scénarios sont toujours executés en parallèle. Ceci permet à un scénario de s'auto-activer en demandant au "Scénario Manager". Il est toutefois fortement recommandé de ne pas intéragir avec le système quand le scénario n'est pas activé.

Voici un exemple de scénario simple. Il ne modifie que quelques éléments du comportement de base du codec; Il ne permet pas de monter le volume à plus de 70%. De plus, il empêche les appels à Zoom et à Microsoft Teams, et il cache tous les icônes des autres scénarios et place un icône sur l'écran d'accueil.

