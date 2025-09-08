/* jshint esversion:8 */
import xapi from 'xapi';

const PING_TEXT = 'MCS_WD_PING';
const PONG_TEXT = 'MCS_WD_PONG';
const BOOT_PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes during boot
const NORMAL_PING_INTERVAL_MS = 60 * 1000; // 1 minute after first PONG
const INITIAL_DELAY_MS = BOOT_PING_INTERVAL_MS; // start with boot interval
const MAX_MISSES = 3; // restart after 3 failed attempts
const PONG_WAIT_MS = 15 * 1000; // consider 15s adequate to receive PONG

let consecutiveMisses = 0;
let lastPongAt = 0;
let pongTimer;
let nextPingTimer;
let firstPongReceived = false;
let currentPingIntervalMs = BOOT_PING_INTERVAL_MS;

function scheduleNextPing(delay) {
  clearTimeout(nextPingTimer);
  console.warn(`[Watchdog] Scheduling next PING in ${Math.round(delay/1000)}s (interval=${Math.round(currentPingIntervalMs/1000)}s)`);
  nextPingTimer = setTimeout(sendPing, delay);
}

function sendPing() {
  try {
    console.warn(`[Watchdog] Sending PING: ${PING_TEXT}`);
    xapi.Command.Message.Send({ Text: PING_TEXT });
  }
  catch (e) {
    console.error(`[Watchdog] Error sending PING: ${e}`);
  }
  // set a pong wait window
  clearTimeout(pongTimer);
  pongTimer = setTimeout(handlePongTimeout, PONG_WAIT_MS);
  // schedule next ping using current interval
  scheduleNextPing(currentPingIntervalMs);
}

function handlePongTimeout() {
  const now = Date.now();
  // if we didn't get a pong since the last ping window
  if (now - lastPongAt > PONG_WAIT_MS - 1) {
    consecutiveMisses++;
    console.warn(`[Watchdog] PONG timeout (>${PONG_WAIT_MS}ms). Consecutive misses=${consecutiveMisses}/${MAX_MISSES}`);
    if (consecutiveMisses >= MAX_MISSES) {
      try {
        console.error(`[Watchdog] Max misses reached, restarting Macro Runtime...`);
        xapi.Command.Macros.Runtime.Restart();
      } catch (e) { }
      consecutiveMisses = 0; // reset after action
    }
  }
}

// Listen globally for PONG responses
xapi.Event.Message.Send.Text.on(text => {
  if (text === PONG_TEXT) {
    console.warn(`[Watchdog] Received PONG: ${PONG_TEXT}`);
    lastPongAt = Date.now();
    consecutiveMisses = 0;
    if (!firstPongReceived) {
      firstPongReceived = true;
      currentPingIntervalMs = NORMAL_PING_INTERVAL_MS;
      console.warn(`[Watchdog] First PONG received. Switching interval to ${Math.round(currentPingIntervalMs/1000)}s`);
      // switch to faster cadence immediately
      scheduleNextPing(currentPingIntervalMs);
    }
  }
});

// Start after initial delay
console.warn(`[Watchdog] Starting with boot interval. First PING in ${Math.round(INITIAL_DELAY_MS/1000)}s`);
scheduleNextPing(INITIAL_DELAY_MS);


