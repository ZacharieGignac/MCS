import xapi from 'xapi';

/*

Core Actions:
CHANGESCENARIO:name -> Change le scénario pour "name"
STANDBY -> met le système en veille, par conséquent charge le scénario par défaut pour la veille
PANELCLOSE -> ferme le panel actif
RESETDEVICES:device1;device2;device3 -> appelle la fonction reset() sur tous les devices id spécifiés


Default system status:
SS$PresenterLocation          literal <local / remote / unknown / both>
SS$PresenterTrackWarnings     literal <on / off>
SS$AutoDisplays               boolean <true, false>
SS$AutoScreens                boolean <true, false>
SS$AutoCamPresets             boolean <true, false>
presenterDetected             boolean <true, false>
call                          literal <Connected / Connecting / Dialling / Disconnecting / EarlyMedia / Idle / OnHold / Preserved / RemotePreserved / Ringing>
presentation                  structure
  type                        literal <NOPRESENTATION / LOCALPREVIEW / LOCALSHARE / REMOTE / REMOTELOCALPREVIEW>
hdmiPassthrough               literal <Active / Inactive>
currentScenario               literal


== Standard Mesages ==
Displays (assuming display is named "DISP")
POWER:DISP;ON
POWER:DISP;OFF
BLANK:DISP;ON
BLANK:DISP;OFF
SOURCE:DISP;HDMI1
SOURCE:DISP;HDMI2
LAMPREQ:DISP
LAMPRPL:DISP;1050

Screens (assuming screen is named "SCREEN")
POS:SCREEN;UP
POS:SCREEN;DOWN

Light Zone (assuming light zone is named "ZONE1")
PWR:ZONE1;ON
PWR:ZONE1;OFF
DIM:ZONE1;50




== DEVICES CONFIGUTATION ==
Control System:
    id                    literal (nom unique du device, pas d'espaces, pas de virgule, pas de point-virgule)
    type                  literal (valeurs supportées dans la structure DEVICETYPE)
    name                  literal (nom "friendly" lisible et identifiable par un utilisateur)
    device                class   (type "device")
    peripheralRequired    boolean (spécifie si le périphérique est nécessaire au fonctionnement du système. Sa présence est vérifiée au démarrage et à interval régulier)
    peripheralId          literal (numéro de série de l'appareil tel qu'indiqué dans status/peripherals)

Display
    id                          literal (nom unique du device, pas d'espaces, pas de virgule, pas de point-virgule)
    type                        literal (valeurs supportées dans la structure DEVICETYPE)
    name                        literal (nom "friendly", utilisé pour la communication avec un système de contrôle externe)
    device                      class   (type "device")
    driver                      class   (type "driver")
    connector                   number  (numéro du connecteur physique sur le codec)
    supportsPower               boolean (spécifie si le display supporte les commandes d'alimentation)
    supportsBlanking            boolean (spécifie si le display supporte les commandes de blanking)
    supportsSource              boolean (spécifie si le display supporte les commandes de changement de source)
    supportsUsageHours          boolean (spécifie si le display supporte les commandes de rapport de temps d'utilisation)
    defaultPower                boolean (état d'alimentation par défaut)
    blankBeforePowerOff         boolean (spécifie si le display se met automatiquement en blanking pendant le délais de mise hors tension. La valeur "supportsBlanking" doit être à "true", et la valeur "powerOffDelay" doit être > 0)
    powerOffDelay               number  (délais (ms) avant la fermeture du display. Le délais s'active lors d'une commande "off". Le délais peut être overridé lors de l'appel de la commande.)
    usageHoursRequestInterval   number  (interval (ms) de temps entre chaque demande de temps d'utilisation. La valeur "supportsUsageHours" doit être à "true")    






== system.roomType ==
classroom.basic.1
  Groupes
    presentation.main
      Affichages: Ces affichages font face à l'auditoire et servent principalement à afficher la présentation. Ils doivent êtres allumés ou éteins au besoin.
      Screens: La position de ces toiles doit être ajustée par rapport aux besoins d'affichage.
      Lights: Ces lumières éclairement naturellement la surface de projection. Elles doivent êtres éteintes ou tamisées par rapport aux besoins d'affichage.

    farend.main
      Affichages: Ces affichages font face au présentateur. L'affichage est normalement allumé lorsque le système est utilisé.
      Screens: La position de ces toiles doit être ajustée par rapport aux besoind d'affichage.
      Lights: Ces lumières éclairement naturellement la surface de projection. Elles doivent êtres éteintes ou tamisées par rapport aux besoins d'affichage.
  
  Scenes d'éclairage
    default
    presentation
    board
    dim
    emergency
    



meetingroom.basic.1





== Default display names ==
display.presentation.main ->
display.farend.main ->

== Default lights scenes ==
lightscene.idle ->
lightscene.presentation ->
lightscene.writeonboard ->
lightscene.emergency ->

 id: 'presentation.main',
      displays: ['display.presentation.1', 'display.presentation.2'],
      screens: ['screen.presentation.1', 'screen.presentation.2'],
      lights: ['light.screen.1', 'light.screen.1']









*/

