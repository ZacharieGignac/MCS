# Événements 
## Événements système inclus
- `system_preinit` : Le sytème fait sa pré-initialisation
- `system_init` : Le système fait son initialisation
- `system_configvalid` : La configuration est valide
- `system_configinvalid` : La configuration est invalide
- `system_corestarted` : Core démarré
- `system_coreinit` : Core initialisé
- `system_modules_init` : Le modules manager est activé et les modules sont chargés
- `system_devices_init` : Le device manager est activé et les devices sont chargés
- `system_scenarios_init` : Le scenario manager est activé et les scénarios sont chargés
- `system_forcestandby` : Le système force le standby (sur horaire)
- `system_peripheralscheck` : Le système effectue une vérification des périphériques
- `system_peripheralsmissing` : Certain périphériques sont manquants
  - `devices[]` : Liste des périphériques manquants
- `system_peripheralsok` : Tous les périphériques sont présents
- `system_volumeoverlimit` : Le volume système est au dessus de la limite
- `system_volumeunderlimit` : Le volume système est en-dessous de la limite
- `system_standby` : Le système vient de tomber en standby
- `system_wakeup` : Le système vient de se réveiller
- `system_storage_init`: Le stockage fait son initialisation
- `system_storage_init_done`: Le stockage a complété son initialisation
- `system_storage_error_corrupted`: Le fichier de stockage est corrompu
- `system_storage_reset`: Le stockage a été remis à zéro par la fonction `resetStorage()`
- `system_storage_file_modified` `name`: Le fichier 'name' a été modifié
- `system_storage_file_deleted` `name`: Le fichier 'name' a été supprimé

# Utilisation du système d'événement
Il est possible d'utiliser facilement les événements dans les modules ou les scénarios. Les événement peuvent servir à partager des données entre plusieurs parties de code qui sont autrement indépendantes.

Les événements sont bâtis sur un principe d'émméteur / récepteur.

## Émission d'un événement
On utilise la fonction `zapi.system.events.emit` pour émettre un événement. Cette fonction plusieurs:
- `event` : Nom de l'événement, chaine texte
- `arguments` : Nombre illimité d'arguments, de n'importe quel type

### Exemples
```JS
zapi.system.events.emit(`my_event_without_args`);
zapi.system.events.emit(`my_event_with_one_arg`,true);
zapi.system.events.emit(`my_event_with_many_args`,true, 'ok!', { Meuh:'Moo!'});
```

## Réception d'un événement
On utilise la fonction `zapi.system.events.on` pour recevoir un événement. Il n'y a pas de "catch-all" pour recevoir tous les événements, on doit connaitre le nom de l'événement à recevoir.

```JS
let myEvent = zapi.system.events.on('my_event_with_one_arg', arg => {
  console.log(arg);
});
```

## Arrêter la réception d'un événement
On utilise la fonction `zapi.system.events.off` pour arrêter la réception d'un événement. Le nom de l'événement ET le callback sont des arguments obligatoires, et c'est pour celà que dans l'exemple précédent l'événement est référencé par la variable `myEvent`.

```JS
zapi.system.events.off('my_event_with_one_arg', myEvent);
```
