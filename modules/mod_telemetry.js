// mod_telemetry.js
import xapi from 'xapi';
import { zapiv1 as zapi } from './zapi'; // Import zapi from your zapi.js file (adjust path if needed)
import { config as systemconfig } from './config'; // Import config as systemconfig from config.js
import { debug } from './debug'; // Import debug function from debug.js

export var Manifest = {
  fileName: 'mod_telemetry',
  id: 'telemetry',
  friendlyName: 'Telemetry Module',
  version: '1.0.0-beta',
  description: 'Collects and sends telemetry data to a broker.'
};

const presNoPresentation = 'NOPRESENTATION';
const presLocalPreview = 'LOCALPREVIEW';
const presLocalShare = 'LOCALSHARE';
const presRemote = 'REMOTE';
const presRemoteLocalPreview = 'REMOTELOCALPREVIEW';


class TelemetryBroker {
  constructor(telemetrySettings) {
    this.settings = telemetrySettings;
    zapi.telemetry.broker = this; // Populate the imported zapi object
  }
  sendTelemetry(data) {
    debug(1, `mod_telemetry: Sending telemetry: ${JSON.stringify(data)} to http://${this.settings.broker}/api/v1/${this.settings.token}/telemetry`);
    zapi.communication.httpClient.Post({ // Use zapi.communication.httpClient.Post
      AllowInsecureHTTPS: true,
      Header: [`Content-Type: application/json`],
      Timeout: 5, // Added Timeout as per example, adjust if needed
      Url: `http://${this.settings.broker}/api/v1/${this.settings.token}/telemetry`,
      Body: JSON.stringify(data) // Send data as JSON string in Body
    }).catch(e => {
      debug(3, "mod_telemetry: Error sending telemetry: " + e); // Updated to debug(3) for error and correct debug usage
    });
  }
}

class TelemetryManager {
  constructor(telemetrySettings, telemetryBroker) {
    this.settings = telemetrySettings;
    this.telemetryBroker = telemetryBroker;
    this.localComputersInputs = systemconfig.mod_telemetry_config?.localComputers || []; // Get localComputers inputs from config
    this.personnalComputersInputs = systemconfig.mod_telemetry_config?.personnalComputers || []; // Get personnalComputers inputs from config


    // Ensure zapi.telemetry exists before proceeding
    if (!zapi.telemetry) {
      zapi.telemetry = {}; // Initialize zapi.telemetry if it's undefined
    }

    zapi.telemetry.manager = this; // Populate the imported zapi object
    zapi.telemetry.send = (data) => { this.send(data); }; // Populate the imported zapi object

    // Ensure dailyReport and sessionReport exist, or initialize them
    zapi.telemetry.dailyReport = zapi.telemetry.dailyReport || {};
    zapi.telemetry.sessionReport = zapi.telemetry.sessionReport || {};

    this.dailyReport = zapi.telemetry.dailyReport; // Use the zapi.telemetry.dailyReport
    this.sessionReport = zapi.telemetry.sessionReport; // Use the zapi.telemetry.sessionReport

    // Initialize daily report flags and counters
    this.dailyReport.presentationLocal = false;
    this.dailyReport.presentationRemote = false;
    this.dailyReport.callCount = 0; // Initialize call count for daily report
    this.dailyReport.hdmiPassthroughCount = 0; // Initialize HDMI Passthrough count for daily report
    this.dailyReport.localComputerUsedCount = 0; // Initialize local computer count for daily report
    this.dailyReport.personnalComputerUsedCount = 0; // Initialize personnal computer count for daily report
    this.dailyReport.localComputerUsed = false;
    this.dailyReport.personnalComputerUsed = false;


    this.previousPresentationStatus = { // Initialize previous presentation status
      type: presNoPresentation,
      presentationLocal: false,
      presentationRemote: false,
      presentationSource: null // Add presentationSource to previous status
    };
    this.previousCallStatus = 'Idle'; // Initialize previous call status
    this.previousHdmiPassthroughStatus = 'Inactive'; // Initialize HDMI Passthrough status


    this.scheduleDailyReport();

    this.sessionCounter = 0;
    this.initSessionTracking();
    this.initVolumeTelemetry();
    this.initStatusTelemetry(); // Initialize status telemetry to handle presentation, call and hdmiPassthrough
    this.initRoomAnalyticsTelemetry();

    // Send telemetryClientVersion when module starts
    const moduleStartTelemetryData = {
      telemetryClientVersion: Manifest.version
    };
    this.send(moduleStartTelemetryData);
    debug(1, "mod_telemetry: Sending telemetryClientVersion on module start: " + JSON.stringify(moduleStartTelemetryData));
  }

  initStatusTelemetry() {
    zapi.system.onStatusChange(eventData => { // Subscribe to system status changes, get eventData
      if (!eventData || !eventData.status) { // Check if status data is missing
        return; // Exit if status data is missing
      }

      if (eventData.status.presentation) {
        this.handlePresentationStatusEvent(eventData.status.presentation);
      }

      if (eventData.status.call) {
        this.handleCallStatusEvent(eventData.status.call);
      }

      if (eventData.status.hdmiPassthrough) {
        this.handleHdmiPassthroughStatusEvent(eventData.status.hdmiPassthrough);
      }
    });
  }


  handlePresentationStatusEvent(presentationStatus) {
    const presentationType = presentationStatus.type || presNoPresentation; // Default to NOPRESENTATION if type is missing
    let newPresentationLocal = false;
    let newPresentationRemote = false;
    let presentationSource = presentationStatus.source || null; // CORRECTED LINE: use lowercase 'source'

    let isLocalComputer = false;
    let isPersonnalComputer = false;

    if (presentationSource) {
      isLocalComputer = this.localComputersInputs.includes(parseInt(presentationSource));
      isPersonnalComputer = this.personnalComputersInputs.includes(parseInt(presentationSource));
    }


    if (presentationType === presLocalPreview || presentationType === presLocalShare || presentationType === presRemoteLocalPreview) {
      newPresentationLocal = true;
      this.dailyReport.presentationLocal = true; // Set daily report flag for local presentation
    }

    if (presentationType === presRemote || presentationType === presRemoteLocalPreview) {
      newPresentationRemote = true;
      this.dailyReport.presentationRemote = true; // Set daily report flag for remote presentation
    }

    if (isLocalComputer) {
      this.dailyReport.localComputerUsed = true;
      this.dailyReport.localComputerUsedCount++;
    }

    if (isPersonnalComputer) {
      this.dailyReport.personnalComputerUsed = true;
      this.dailyReport.personnalComputerUsedCount++;
    }


    const currentPresentationStatus = {
      type: presentationType,
      presentationLocal: newPresentationLocal,
      presentationRemote: newPresentationRemote,
      source: presentationSource,
      isLocalComputer: isLocalComputer,
      isPersonnalComputer: isPersonnalComputer
    };


    if (this.hasPresentationStatusChanged(currentPresentationStatus)) {
      this.handlePresentationStatusChange(currentPresentationStatus);
    }
  }

  hasPresentationStatusChanged(currentStatus) {
    return (
      currentStatus.type !== this.previousPresentationStatus.type ||
      currentStatus.presentationLocal !== this.previousPresentationStatus.presentationLocal ||
      currentStatus.presentationRemote !== this.previousPresentationStatus.presentationRemote ||
      currentStatus.source !== this.previousPresentationStatus.source // Include source in change detection
    );
  }

  handlePresentationStatusChange(currentStatus) {
    debug(1, "mod_telemetry: Presentation status changed via system status: " + JSON.stringify(currentStatus));

    // Send telemetry IMMEDIATELY on status change
    let telemetryData = {};
    if (currentStatus.source) {
      telemetryData.presentationSource = currentStatus.source;
    }
    telemetryData.presentationLocal = currentStatus.presentationLocal;
    telemetryData.presentationRemote = currentStatus.presentationRemote;
    this.send(telemetryData);
    debug(1, "mod_telemetry: Immediate Presentation Telemetry Sent: " + JSON.stringify(telemetryData));

    // Update session report presentation flags if presentation becomes active during the session
    if (currentStatus.presentationLocal) {
      zapi.telemetry.sessionReport.sessionReport.sessionPresentationLocal = true;
    }
    if (currentStatus.presentationRemote) {
      zapi.telemetry.sessionReport.sessionReport.sessionPresentationRemote = true;
    }
    if (currentStatus.isLocalComputer) {
      zapi.telemetry.sessionReport.sessionReport.sessionLocalComputerUsed = true;
    }
    if (currentStatus.isPersonnalComputer) {
      zapi.telemetry.sessionReport.sessionReport.sessionPersonnalComputerUsed = true;
    }

    this.previousPresentationStatus = currentStatus; // Update previous status
  }


  handleCallStatusEvent(callStatus) {
    const currentCallStatus = callStatus || 'Idle'; // Default to 'Idle' if status is missing, use callStatus directly
    let callActive = false;

    if (currentCallStatus === 'Connected') {
      callActive = true;
      zapi.telemetry.sessionReport.sessionReport.sessionCallUsed = true;
      this.dailyReport.callCount++; // Increment daily call count
    } else {
      callActive = false;
    }


    if (currentCallStatus !== this.previousCallStatus) {
      debug(1, "mod_telemetry: Call status changed via system status: " + currentCallStatus);

      // Send immediate call status telemetry as boolean
      this.send({ callStatus: callActive });
      debug(1, "mod_telemetry: Immediate Call Status Telemetry Sent: " + JSON.stringify({ callStatus: callActive }));


      this.previousCallStatus = currentCallStatus; // Update previous call status
    }
  }


  handleHdmiPassthroughStatusEvent(hdmiPassthroughStatus) {
    const currentHdmiPassthroughStatus = hdmiPassthroughStatus.Mode || 'Inactive'; // Default to 'Inactive' if status is missing

    if (currentHdmiPassthroughStatus !== this.previousHdmiPassthroughStatus) {
      debug(1, "mod_telemetry: HDMI Passthrough status changed via system status: " + currentHdmiPassthroughStatus);

      // Send immediate HDMI Passthrough status telemetry
      this.send({ hdmiPassthroughStatus: currentHdmiPassthroughStatus });
      debug(1, "mod_telemetry: Immediate HDMI Passthrough Status Telemetry Sent: " + JSON.stringify({ hdmiPassthroughStatus: currentHdmiPassthroughStatus }));

      // Update session report if HDMI Passthrough becomes active during the session
      if (currentHdmiPassthroughStatus === 'Active') {
        zapi.telemetry.sessionReport.sessionReport.sessionHdmiPassthroughUsed = true;
        this.dailyReport.hdmiPassthroughCount++; // Increment daily HDMI Passthrough count
      }

      this.previousHdmiPassthroughStatus = currentHdmiPassthroughStatus; // Update previous HDMI Passthrough status
    }
  }


  initSessionTracking() {
    zapi.telemetry.sessionReport = zapi.telemetry.sessionReport || {}; // Ensure sessionReport exists
    zapi.telemetry.sessionReport.sessionReport = this.initializeSessionReport();
    debug(1, "mod_telemetry: Session tracking initialized.");

    xapi.Status.Standby.on(standby => {
      if (standby.State == 'Off') {
        this.handleStandbyOff();
      } else if (standby.State == 'Standby') {
        this.handleStandbyOn();
      }
    });
  }

  initializeSessionReport() {
    return {
      startTime: null,
      endTime: null,
      duration: 0,
      minVolume: 100,
      maxVolume: 0,
      averageVolume: 0,
      volumeChanges: 0,
      lastVolume: null,
      lastVolumeTimestamp: null,
      sessionPresentationLocal: false,
      sessionPresentationRemote: false,
      sessionCallUsed: false, // Add sessionCallUsed to session report
      sessionHdmiPassthroughUsed: false, // Add sessionHdmiPassthroughUsed to session report
      sessionLocalComputerUsed: false, // Add sessionLocalComputerUsed to session report
      sessionPersonnalComputerUsed: false // Add sessionPersonnalComputerUsed to session report
    };
  }

  handleStandbyOff() {
    zapi.telemetry.send({ inUse: true });
    this.sessionCounter++;
    debug(1, "mod_telemetry: New session started (Standby Off). Session count: " + this.sessionCounter);
    xapi.Status.Audio.Volume.get().then(initialVolume => {
      zapi.telemetry.sessionReport.sessionReport.startTime = Date.now();
      zapi.telemetry.sessionReport.sessionReport = {
        ...this.initializeSessionReport(), // Keep most default values
        startTime: zapi.telemetry.sessionReport.sessionReport.startTime, // Retain startTime
        minVolume: initialVolume,
        maxVolume: initialVolume,
        lastVolume: initialVolume,
        lastVolumeTimestamp: Date.now()
      };
      debug(1, "mod_telemetry: Session start time set to: " + zapi.telemetry.sessionReport.sessionReport.startTime);
      debug(1, "mod_telemetry: Session tracking initialized with initial volume: " + initialVolume);
    }).catch(error => {
        debug(3, "mod_telemetry: ERROR getting initial volume: " + error); // Log any errors
    });
  }


  handleStandbyOn() {
    zapi.telemetry.send({ inUse: false });
    debug(1, "mod_telemetry: Session ending (Standby On). Finalizing and sending session report.");
    zapi.telemetry.sessionReport.sessionReport.endTime = Date.now();
    this.finalizeSessionReport();
    this.calculateSessionDuration();
    this.formatSessionTime();
    this.sendSessionTelemetry();
  }

  calculateSessionDuration() {
    const report = zapi.telemetry.sessionReport.sessionReport;
    if (!report.startTime || !report.endTime) {
        debug(3, "mod_telemetry: Invalid session times - start: " + report.startTime + ", end: " + report.endTime);
        report.duration = -1;  // Set to -1 for invalid times
        return;
    }
    
    let durationMs = report.endTime - report.startTime;
    if (durationMs < 0) {
        debug(3, "mod_telemetry: Negative duration detected");
        report.duration = -1;  // Set to -1 for negative duration
        return;
    }
    
    // Convert to minutes and round up to nearest minute
    // This ensures even short sessions (1-59 seconds) are counted as 1 minute
    let durationMinutes = Math.ceil(durationMs / 60000);
    
    // Cap at 24 hours (1440 minutes) to prevent unreasonable values
    report.duration = Math.min(1440, Math.max(1, durationMinutes));
    
    debug(1, `mod_telemetry: Session duration calculated: ${report.duration} minutes (${durationMs}ms)`);
  }

  formatSessionTime() {
    zapi.telemetry.sessionReport.sessionReport.startTimeLocal = new Date(zapi.telemetry.sessionReport.sessionReport.startTime).toLocaleString();
    zapi.telemetry.sessionReport.sessionReport.endTimeLocal = new Date(zapi.telemetry.sessionReport.sessionReport.endTime).toLocaleString();
  }

  sendSessionTelemetry() {
    const flatSessionReport = this.flattenSessionReport();
    const nestedSessionReport = { sessionReport: zapi.telemetry.sessionReport.sessionReport }; // Create nested object

    // Combine flat and nested reports into a single object
    const combinedSessionReport = {
      ...flatSessionReport, // Spread the flattened properties
      ...nestedSessionReport // Spread the nested object (sessionReport will be a property)
    };

    zapi.telemetry.send(combinedSessionReport); // Send the combined session report
    debug(1, "mod_telemetry: Session report sent (combined). " + JSON.stringify(combinedSessionReport));
    // Remove the separate sends for flat and nested reports
    // zapi.telemetry.send(flatSessionReport);
    // debug(1, "mod_telemetry: Session report sent (flat).", flatSessionReport);
    // zapi.telemetry.send(nestedSessionReport);
    // debug(1, "mod_telemetry: Session report sent (nested).", nestedSessionReport);
  }


  flattenSessionReport() {
    const flatSessionReport = {};
    for (const key in zapi.telemetry.sessionReport.sessionReport) {
      if (zapi.telemetry.sessionReport.sessionReport.hasOwnProperty(key)) {
        let flatKey = key;
        if (key.startsWith('session')) {
          flatKey = key; // Use the key directly if it already starts with 'session'
        } else {
          flatKey = `session${key.charAt(0).toUpperCase() + key.slice(1)}`; // Apply prefix and capitalize otherwise
        }
        flatSessionReport[flatKey] = zapi.telemetry.sessionReport.sessionReport[key];
      }
    }
    return flatSessionReport;
  }


  finalizeSessionReport() {
    const sessionReportData = zapi.telemetry.sessionReport.sessionReport;
    let averageVolume = 0;
    if (sessionReportData.volumeChanges > 0) {
      averageVolume = sessionReportData.lastVolume !== null ? sessionReportData.lastVolume : 0;
    } else {
      averageVolume = sessionReportData.minVolume;
    }
    sessionReportData.averageVolume = Math.round(averageVolume);
    delete sessionReportData.lastVolume;
    delete sessionReportData.lastVolumeTimestamp;
  }

  initVolumeTelemetry() {
    xapi.Status.Audio.Volume.get()
      .then(vol => {
        debug(1, "mod_telemetry: Initial volume reading: " + vol);
        this.updateSessionVolumeMetrics(vol);
      })
      .catch(e => {
        debug(3, "mod_telemetry: Error getting initial volume: " + e); // Updated to debug(3) for error and correct debug usage
      });

    xapi.Status.Audio.Volume.on(vol => {
      zapi.telemetry.send({ volume: vol }); // Immediate volume telemetry
      this.updateSessionVolumeMetrics(vol);
      debug(1, "mod_telemetry: Volume changed to: " + vol);
    });
  }

  updateSessionVolumeMetrics(vol) {
    const sessionReportData = zapi.telemetry.sessionReport.sessionReport;
    if (!sessionReportData) return;

    sessionReportData.volumeChanges++;
    sessionReportData.minVolume = Math.min(sessionReportData.minVolume, vol);
    sessionReportData.maxVolume = Math.max(sessionReportData.maxVolume, vol);
    sessionReportData.lastVolume = vol;
    sessionReportData.lastVolumeTimestamp = Date.now();
  }

  initRoomAnalyticsTelemetry() {
    debug(1, "mod_telemetry: Room Analytics Telemetry Initializing...");
    setInterval(() => {
      this.fetchAndSendRoomAnalytics();
    }, 5 * 60 * 1000);
    this.fetchAndSendRoomAnalytics();
  }

  fetchAndSendRoomAnalytics() {
    xapi.Status.Peripherals.get()
      .then(peripherals => {
        if (!peripherals || !peripherals.ConnectedDevice) {
          debug(1, "mod_telemetry: No peripherals data found.");
          return; // Early return if no peripherals or ConnectedDevice
        }
        this.processPeripheralsData(peripherals.ConnectedDevice);
      })
      .catch(e => {
        debug(3, "mod_telemetry: Error fetching room analytics data: " + e); // Updated to debug(3) for error and correct debug usage
      });
  }


  processPeripheralsData(connectedDevices) {
    let telemetryData = {};
    let foundAnalytics = false;

    for (const p of connectedDevices) {
      if (p.RoomAnalytics) {
        foundAnalytics = true;
        debug(1, "mod_telemetry: Room Analytics data found on peripheral: " + (p.Name || p.ProductId));
        telemetryData.airQualityIndex = p.RoomAnalytics.AirQuality?.Index;
        telemetryData.ambientTemperature = p.RoomAnalytics.AmbientTemperature;
        telemetryData.relativeHumidity = p.RoomAnalytics.RelativeHumidity;
        break; // Exit loop after finding first device with analytics
      }
    }

    if (foundAnalytics) {
      this.send(telemetryData); // Immediate room analytics telemetry
      debug(1, "mod_telemetry: Room Analytics Telemetry Sent (Flat): " + JSON.stringify(telemetryData));
    } else {
      debug(1, "mod_telemetry: No Room Analytics data found on connected peripherals.");
    }
  }


  send(data) {
    this.telemetryBroker.sendTelemetry(data);
  }

  scheduleDailyReport() {
    const dailyReportTime = this.settings.dailyReportTime;
    const [hours, minutes] = dailyReportTime.split(':').map(Number);

    const scheduledHours = hours;
    const finalMinutes = minutes;

    const now = new Date();
    let scheduledTime = new Date();
    scheduledTime.setHours(scheduledHours, finalMinutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeDiff = scheduledTime.getTime() - now.getTime();

    debug(1, "mod_telemetry: Daily report scheduled for: " + scheduledTime.toLocaleTimeString() + ", precisely at " + dailyReportTime);

    const lastCallTimeDiff = timeDiff - (5 * 60 * 1000);
    if (lastCallTimeDiff > 0) {
      setTimeout(() => {
        debug(1, "mod_telemetry: LAST CALL: Daily telemetry report will be sent in 5 minutes.");
      }, lastCallTimeDiff);
    } else {
      debug(1, "mod_telemetry: LAST CALL time is in the past or very near, 'LAST CALL' message might not be shown.");
    }

    setTimeout(() => {
      this.sendDailyReport();
      this.scheduleDailyReport();
    }, timeDiff);
  }

  sendDailyReport() {
    debug(1, "mod_telemetry: Sending daily telemetry report...");
    const dailyData = this.dailyReport;
    dailyData.sessionCount = this.sessionCounter;

    const flatDailyData = this.flattenDailyData(dailyData);
    const nestedDailyData = { dailyReport: dailyData }; // Create nested object


    if (Object.keys(flatDailyData).length > 0) {
      this.sendTelemetryReports(flatDailyData, nestedDailyData);
      this.resetDailyReportData();
    } else {
      debug(1, "mod_telemetry: No daily telemetry data to send.");
    }
  }

  flattenDailyData(dailyData) {
    const flatDailyData = {}; // Create flat daily data object
    for (const key in dailyData) {
      if (dailyData.hasOwnProperty(key)) {
        flatDailyData[`dailyreport${key.charAt(0).toUpperCase() + key.slice(1)}`] = dailyData[key]; // Prefix keys with "dailyreport" and make CamelCase
      }
    }
    return flatDailyData;
  }

  sendTelemetryReports(flatDailyData, nestedDailyData) {
    // Send FLAT daily report data
    this.send(flatDailyData);
    debug(1, "mod_telemetry: Daily telemetry report sent (flat, prefixed). " + JSON.stringify(flatDailyData)); // Debug log updated to indicate prefix
    // Send NESTED daily report data (inside dailyReport object)
    this.send(nestedDailyData);
    debug(1, "mod_telemetry: Daily telemetry report sent (nested). " + JSON.stringify(nestedDailyData));
  }

  resetDailyReportData() {
    this.dailyReport.presentationLocal = false;
    this.dailyReport.presentationRemote = false;
    this.dailyReport.callCount = 0; // Reset call count for next day
    this.dailyReport.hdmiPassthroughCount = 0; // Reset HDMI Passthrough count for next day
    this.dailyReport.localComputerUsedCount = 0; // Reset local computer count for next day
    this.dailyReport.personnalComputerUsedCount = 0; // Reset personnal computer count for next day
    this.dailyReport.localComputerUsed = false;
    this.dailyReport.personnalComputerUsed = false;
    this.sessionCounter = 0;
    debug(1, "mod_telemetry: Daily telemetry report sent successfully (flat and nested) and data cleared. Session count reset, presentation flags, call count and HDMI Passthrough count reset, local and personnal computer flags and counts reset.");
  }
}


export class Module {
  constructor() {
    this.telemetrySettings = {
      dailyReportTime: systemconfig.mod_telemetry_config?.dailyReportTime || '23:55', // Get from config or default 23:55, using camelCase
      broker: '10.12.50.179:8080', // Broker is still hardcoded as before
      token: systemconfig.mod_telemetry_config?.token // Get token from config, no default, using camelCase
    };
    // removed moduleLoaded from daily report
    debug(1, 'mod_telemetry: Telemetry Module constructor');
  }

  start() {
    const telemetryBroker = new TelemetryBroker(this.telemetrySettings); // Create Broker
    new TelemetryManager(this.telemetrySettings, telemetryBroker); // Create Manager, populating zapi.telemetry
    debug(1, 'mod_telemetry: Telemetry Module started');
  }

  stop() {
    debug(1, 'mod_telemetry: Telemetry Module stopped');
  }
}