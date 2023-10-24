# ZAPI
Le système utilise son propre API nommé "zapi". L'api est accessible via l'importation du module "zapi.js".

Plusieurs version de l'API peuvent être présente dans ce module, et sont toujours nommés "zapiv<version>", par exemple: zapiv1, zapiv2, zapiv3.

L'utilisation de zapi est possible dans un module qui a été chargé par le système, en tant que scénario ou module.

Il est très simple d'importer et d'utiliser zapi dans un scénario ou un module. Zapi doit être importé en utilisant la nommenclature d'importation ES6, c'est à dire "import".

Voici comment importer la version 1 de zapi à un module ou un scénario:
```JS
import { zapiv1 as zapi } from './zapi';
```

L'api est maintenat accessible via l'objet "zapi".

Même si cette fonctionnalité doit être utilisée avec grande prudence, il est possible d'overrider n'importe quelle fonction ou objet de zapi, ainsi permettre à des modules de modifier le comportement de l'api. Il est important de ne pas modifier les arguments des appels de functions au risque de causer une erreur irrécupérable.

# Description de l'API version 1
## devices

## scenarios

## modules

## system

## performance

## audio

## ui
