import xapi from 'xapi';

/*
Core status:

SS$PresenterLocation
SS$PresenterTrackWarnings

Core Actions:
CHANGESCENARIO:name
ENDSESSION




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


Default system status:
SS$PresenterLocation
SS$PresenterTrackWarnings
SS$MainPresentationDisplayUnavailable
SS$SecondaryPresentationDisplayUnavailable
SS$MainFarendDisplayUnavailable
SS$SecondaryFarendDisplayUnavailable




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

