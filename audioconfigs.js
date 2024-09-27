import xapi from 'xapi';

export const config1 = {
  "connectorSetup": "Manual",
  "inputGroups": [
    {
      "id": "1",
      "name": "Microphone",
      "connectors": [
        "Microphone.1",
        "Microphone.2",
        "Microphone.3",
        "Microphone.4",
        "Microphone.5",
        "Microphone.6",
        "Microphone.7",
        "Microphone.8"
      ],
      "settings": {
        "agc": "On",
        "channels": "1",
        "direct": "Off",
        "mixerMode": "GainShared",
        "mute": "Off"
      }
    },
    {
      "id": "15",
      "name": "PC",
      "connectors": [
        "HDMI.1",
        "HDMI.2",
        "HDMI.3",
        "HDMI.4",
        "HDMI.5"
      ],
      "settings": {
        "agc": "Off",
        "channels": "2",
        "direct": "Off",
        "mixerMode": "Fixed",
        "mute": "Off"
      }
    },
    {
      "id": "19",
      "name": "Reinforcement",
      "connectors": [
        "Microphone.6",
        "Microphone.7",
        "Microphone.8",
        "Microphone.5"
      ],
      "settings": {
        "agc": "Off",
        "channels": "1",
        "direct": "On",
        "mixerMode": "Fixed",
        "mute": "Off"
      }
    }
  ],
  "outputGroups": [
    {
      "id": "9",
      "name": "AEC",
      "connectors": [
        "Line.6"
      ],
      "links": [
        {
          "Gain": "0",
          "id": "15"
        },
        {
          "Gain": "0",
          "id": "19"
        }
      ],
      "settings": {
        "autoconnectRemote": "On",
        "channels": "1",
        "loudspeaker": "On",
        "volumeControlled": "On"
      }
    },
    {
      "id": "16",
      "name": "Room",
      "connectors": [
        "Line.1",
        "Line.2"
      ],
      "links": [
        {
          "Gain": "0",
          "id": "15"
        },
        {
          "Gain": "-24",
          "id": "19"
        }
      ],
      "settings": {
        "autoconnectRemote": "Off",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "On"
      }
    },
    {
      "id": "18",
      "name": "USB",
      "connectors": [
        "HDMI.2"
      ],
      "links": [
        {
          "Gain": "0",
          "id": "1"
        }
      ],
      "settings": {
        "autoconnectRemote": "Off",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "On"
      }
    },
    {
      "id": "28",
      "name": "Monitor",
      "connectors": [
        "HDMI.3"
      ],
      "links": [],
      "settings": {
        "autoconnectRemote": "On",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "On"
      }
    },
    {
      "id": "38",
      "name": "RoomExtra",
      "connectors": [
        "Line.4",
        "Line.5"
      ],
      "links": [],
      "settings": {
        "autoconnectRemote": "On",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "Off"
      }
    },
    {
      "id": "88",
      "name": "RECORDING",
      "connectors": [
        "Line.3"
      ],
      "links": [
        {
          "Gain": "0",
          "id": "1"
        },
        {
          "Gain": "0",
          "id": "15"
        }
      ],
      "settings": {
        "autoconnectRemote": "On",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "Off"
      }
    }
  ],
  "inputs": [
    {
      "id": "ARC.1",
      "originalId": "1",
      "name": "ARC 1",
      "connectorType": "ARC",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "ARC.2",
      "originalId": "2",
      "name": "ARC 2",
      "connectorType": "ARC",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "ARC.3",
      "originalId": "3",
      "name": "ARC 3",
      "connectorType": "ARC",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "AirPlay.1",
      "originalId": "1",
      "name": "AirPlay 1",
      "connectorType": "AirPlay",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.1",
      "originalId": "1",
      "name": "Ethernet 1",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.2",
      "originalId": "2",
      "name": "Ethernet 2",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.3",
      "originalId": "3",
      "name": "Ethernet 3",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.4",
      "originalId": "4",
      "name": "Ethernet 4",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.5",
      "originalId": "5",
      "name": "Ethernet 5",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.6",
      "originalId": "6",
      "name": "Ethernet 6",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.7",
      "originalId": "7",
      "name": "Ethernet 7",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.8",
      "originalId": "8",
      "name": "Ethernet 8",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "HDMI.1",
      "originalId": "1",
      "name": "HDMI 1",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "Off",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.2",
      "originalId": "2",
      "name": "HDMI 2",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "Off",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.3",
      "originalId": "3",
      "name": "HDMI 3",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "On",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.4",
      "originalId": "4",
      "name": "HDMI 4",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "On",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.5",
      "originalId": "5",
      "name": "HDMI 5",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "On",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "Microphone.1",
      "originalId": "1",
      "name": "Microphone 1",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 50,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.2",
      "originalId": "2",
      "name": "Microphone 2",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 50,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.3",
      "originalId": "3",
      "name": "Microphone 3",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 50,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.4",
      "originalId": "4",
      "name": "Microphone 4",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 58,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.5",
      "originalId": "5",
      "name": "Microphone 5",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 58,
        "channel": "Mono",
        "phantomPower": "Off"
      },
      "inUse": true
    },
    {
      "id": "Microphone.6",
      "originalId": "6",
      "name": "Microphone 6",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 55,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.7",
      "originalId": "7",
      "name": "Microphone 7",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 60,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.8",
      "originalId": "8",
      "name": "Microphone 8",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 20,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "USBInterface.1",
      "originalId": "1",
      "name": "USBInterface 1",
      "connectorType": "USBInterface",
      "isMuted": false,
      "settings": {
        "echoControl": "On",
        "mode": "On",
        "level": 16
      },
      "inUse": false
    },
    {
      "id": "WebView.1",
      "originalId": "1",
      "name": "WebView 1",
      "connectorType": "WebView",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    }
  ],
  "outputs": [
    {
      "id": "ARC.1",
      "originalId": "1",
      "name": "ARC 1",
      "connectorType": "ARC",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.1",
      "originalId": "1",
      "name": "Ethernet 1",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.2",
      "originalId": "2",
      "name": "Ethernet 2",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.3",
      "originalId": "3",
      "name": "Ethernet 3",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.4",
      "originalId": "4",
      "name": "Ethernet 4",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "HDMI.1",
      "originalId": "1",
      "name": "HDMI 1",
      "connectorType": "HDMI",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "Fixed"
      },
      "inUse": false
    },
    {
      "id": "HDMI.2",
      "originalId": "2",
      "name": "HDMI 2",
      "connectorType": "HDMI",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "Fixed"
      },
      "inUse": true
    },
    {
      "id": "HDMI.3",
      "originalId": "3",
      "name": "HDMI 3",
      "connectorType": "HDMI",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "Fixed"
      },
      "inUse": true
    },
    {
      "id": "Line.1",
      "originalId": "1",
      "name": "Line 1",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Left",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.2",
      "originalId": "2",
      "name": "Line 2",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Right",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.3",
      "originalId": "3",
      "name": "Line 3",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Mono",
        "delayMs": 0,
        "delayMode": "Fixed",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.4",
      "originalId": "4",
      "name": "Line 4",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Right",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.5",
      "originalId": "5",
      "name": "Line 5",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Left",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.6",
      "originalId": "6",
      "name": "Line 6",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Right",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "USBInterface.1",
      "originalId": "1",
      "name": "USBInterface 1",
      "connectorType": "USBInterface",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    }
  ],
  "links": [
    {
      "inputGroupId": "15",
      "outputGroupId": "9",
      "gain": 0
    },
    {
      "inputGroupId": "19",
      "outputGroupId": "9",
      "gain": 0
    },
    {
      "inputGroupId": "15",
      "outputGroupId": "16",
      "gain": 0
    },
    {
      "inputGroupId": "19",
      "outputGroupId": "16",
      "gain": -24
    },
    {
      "inputGroupId": "1",
      "outputGroupId": "18",
      "gain": 0
    },
    {
      "inputGroupId": "1",
      "outputGroupId": "88",
      "gain": 0
    },
    {
      "inputGroupId": "15",
      "outputGroupId": "88",
      "gain": 0
    }
  ],
  "inactiveOutputIds": [
    "ARC.1",
    "Ethernet.1",
    "Ethernet.2",
    "Ethernet.3",
    "Ethernet.4",
    "HDMI.1",
    "USBInterface.1"
  ],
  "equalizers": [
    {
      "id": "1",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "2",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "3",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "4",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "5",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "6",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "HighPass",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 1
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "7",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "8",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    }
  ],
  "selection": {
    "type": "group",
    "groupId": "13"
  }
};

export const config2 = {
  "connectorSetup": "Manual",
  "inputGroups": [
    {
      "id": "1",
      "name": "Microphone",
      "connectors": [
        "Microphone.1",
        "Microphone.2",
        "Microphone.3",
        "Microphone.4",
        "Microphone.5",
        "Microphone.6",
        "Microphone.7",
        "Microphone.8"
      ],
      "settings": {
        "agc": "On",
        "channels": "1",
        "direct": "Off",
        "mixerMode": "GainShared",
        "mute": "Off"
      }
    },
    {
      "id": "15",
      "name": "PC",
      "connectors": [
        "HDMI.1",
        "HDMI.2",
        "HDMI.3",
        "HDMI.4",
        "HDMI.5"
      ],
      "settings": {
        "agc": "Off",
        "channels": "2",
        "direct": "Off",
        "mixerMode": "Fixed",
        "mute": "Off"
      }
    },
    {
      "id": "19",
      "name": "Reinforcement",
      "connectors": [
        "Microphone.6",
        "Microphone.7",
        "Microphone.8",
        "Microphone.5"
      ],
      "settings": {
        "agc": "Off",
        "channels": "1",
        "direct": "On",
        "mixerMode": "Fixed",
        "mute": "Off"
      }
    }
  ],
  "outputGroups": [
    {
      "id": "16",
      "name": "AnotherName",
      "connectors": [
        "Line.1",
        "Line.2"
      ],
      "links": [],
      "settings": {
        "autoconnectRemote": "Off",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "On"
      }
    },
    {
      "id": "18",
      "name": "USB",
      "connectors": [
        "HDMI.2"
      ],
      "links": [
        {
          "Gain": "0",
          "id": "1"
        }
      ],
      "settings": {
        "autoconnectRemote": "Off",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "On"
      }
    },
    {
      "id": "88",
      "name": "RECORDING",
      "connectors": [
        "Line.3"
      ],
      "links": [],
      "settings": {
        "autoconnectRemote": "On",
        "channels": "1",
        "loudspeaker": "Off",
        "volumeControlled": "Off"
      }
    }
  ],
  "inputs": [
    {
      "id": "ARC.1",
      "originalId": "1",
      "name": "ARC 1",
      "connectorType": "ARC",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "ARC.2",
      "originalId": "2",
      "name": "ARC 2",
      "connectorType": "ARC",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "ARC.3",
      "originalId": "3",
      "name": "ARC 3",
      "connectorType": "ARC",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "AirPlay.1",
      "originalId": "1",
      "name": "AirPlay 1",
      "connectorType": "AirPlay",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.1",
      "originalId": "1",
      "name": "Ethernet 1",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.2",
      "originalId": "2",
      "name": "Ethernet 2",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.3",
      "originalId": "3",
      "name": "Ethernet 3",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.4",
      "originalId": "4",
      "name": "Ethernet 4",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.5",
      "originalId": "5",
      "name": "Ethernet 5",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.6",
      "originalId": "6",
      "name": "Ethernet 6",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.7",
      "originalId": "7",
      "name": "Ethernet 7",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.8",
      "originalId": "8",
      "name": "Ethernet 8",
      "connectorType": "Ethernet",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "equalizer": "Off"
      },
      "inUse": false
    },
    {
      "id": "HDMI.1",
      "originalId": "1",
      "name": "HDMI 1",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "Off",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.2",
      "originalId": "2",
      "name": "HDMI 2",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "Off",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.3",
      "originalId": "3",
      "name": "HDMI 3",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "On",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.4",
      "originalId": "4",
      "name": "HDMI 4",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "On",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "HDMI.5",
      "originalId": "5",
      "name": "HDMI 5",
      "connectorType": "HDMI",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "muteOnInactiveVideo": "On",
        "level": -5
      },
      "inUse": true
    },
    {
      "id": "Microphone.1",
      "originalId": "1",
      "name": "Microphone 1",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 50,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.2",
      "originalId": "2",
      "name": "Microphone 2",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 50,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.3",
      "originalId": "3",
      "name": "Microphone 3",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 50,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.4",
      "originalId": "4",
      "name": "Microphone 4",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 58,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.5",
      "originalId": "5",
      "name": "Microphone 5",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 58,
        "channel": "Mono",
        "phantomPower": "Off"
      },
      "inUse": true
    },
    {
      "id": "Microphone.6",
      "originalId": "6",
      "name": "Microphone 6",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 55,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.7",
      "originalId": "7",
      "name": "Microphone 7",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 60,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "Microphone.8",
      "originalId": "8",
      "name": "Microphone 8",
      "connectorType": "Microphone",
      "isMuted": false,
      "settings": {
        "mode": "On",
        "echoControl": "On",
        "noiseReduction": "On",
        "muteOnInactiveVideo": "Off",
        "videoInputSource": "1",
        "equalizer": "Off",
        "level": 20,
        "channel": "Mono",
        "phantomPower": "On"
      },
      "inUse": true
    },
    {
      "id": "USBInterface.1",
      "originalId": "1",
      "name": "USBInterface 1",
      "connectorType": "USBInterface",
      "isMuted": false,
      "settings": {
        "echoControl": "On",
        "mode": "On",
        "level": 16
      },
      "inUse": false
    },
    {
      "id": "WebView.1",
      "originalId": "1",
      "name": "WebView 1",
      "connectorType": "WebView",
      "isMuted": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    }
  ],
  "outputs": [
    {
      "id": "ARC.1",
      "originalId": "1",
      "name": "ARC 1",
      "connectorType": "ARC",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.1",
      "originalId": "1",
      "name": "Ethernet 1",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.2",
      "originalId": "2",
      "name": "Ethernet 2",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.3",
      "originalId": "3",
      "name": "Ethernet 3",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "Ethernet.4",
      "originalId": "4",
      "name": "Ethernet 4",
      "connectorType": "Ethernet",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    },
    {
      "id": "HDMI.1",
      "originalId": "1",
      "name": "HDMI 1",
      "connectorType": "HDMI",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "Fixed"
      },
      "inUse": false
    },
    {
      "id": "HDMI.2",
      "originalId": "2",
      "name": "HDMI 2",
      "connectorType": "HDMI",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "Fixed"
      },
      "inUse": true
    },
    {
      "id": "HDMI.3",
      "originalId": "3",
      "name": "HDMI 3",
      "connectorType": "HDMI",
      "isMuted": true,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "delayMs": 0,
        "delayMode": "Fixed"
      },
      "inUse": false
    },
    {
      "id": "Line.1",
      "originalId": "1",
      "name": "Line 1",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Left",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.2",
      "originalId": "2",
      "name": "Line 2",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Right",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.3",
      "originalId": "3",
      "name": "Line 3",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Mono",
        "delayMs": 0,
        "delayMode": "Fixed",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": true
    },
    {
      "id": "Line.4",
      "originalId": "4",
      "name": "Line 4",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Right",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": false
    },
    {
      "id": "Line.5",
      "originalId": "5",
      "name": "Line 5",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Left",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": false
    },
    {
      "id": "Line.6",
      "originalId": "6",
      "name": "Line 6",
      "connectorType": "Line",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On",
        "channel": "Right",
        "delayMs": 0,
        "delayMode": "RelativeToHDMI",
        "equalizer": "Off",
        "level": -4
      },
      "inUse": false
    },
    {
      "id": "USBInterface.1",
      "originalId": "1",
      "name": "USBInterface 1",
      "connectorType": "USBInterface",
      "isMuted": false,
      "hasDelayedMeasurement": false,
      "settings": {
        "mode": "On"
      },
      "inUse": false
    }
  ],
  "links": [
    {
      "inputGroupId": "1",
      "outputGroupId": "18",
      "gain": 0
    },
    {
      "inputGroupId": "1",
      "outputGroupId": "16",
      "gain": 0
    },
    {
      "inputGroupId": "1",
      "outputGroupId": "88",
      "gain": 0
    }
  ],
  "inactiveOutputIds": [
    "ARC.1",
    "Ethernet.1",
    "Ethernet.2",
    "Ethernet.3",
    "Ethernet.4",
    "HDMI.1",
    "HDMI.3",
    "Line.4",
    "Line.5",
    "Line.6",
    "USBInterface.1"
  ],
  "equalizers": [
    {
      "id": "1",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "2",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "3",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "4",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "5",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "6",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "HighPass",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 1
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "7",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    },
    {
      "id": "8",
      "sections": [
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 100,
          "gain": 0,
          "id": "1",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 200,
          "gain": 0,
          "id": "2",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 500,
          "gain": 0,
          "id": "3",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 1000,
          "gain": 0,
          "id": "4",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 2000,
          "gain": 0,
          "id": "5",
          "q": 0.707
        },
        {
          "enabled": true,
          "filterType": "Peaking",
          "frequency": 5000,
          "gain": 0,
          "id": "6",
          "q": 0.707
        }
      ]
    }
  ],
  "selection": null
};


