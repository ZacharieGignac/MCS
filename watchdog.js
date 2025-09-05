/* jshint esversion:8 */
import xapi from 'xapi';

const PING_TEXT = 'MCS_WD_PING';
const PONG_TEXT = 'MCS_WD_PONG';
const INITIAL_DELAY_MS = 60 * 1000; // 1 minute before first ping
const PING_INTERVAL_MS = 60 * 1000; // every minute
const MAX_MISSES = 3; // restart after 3 failed attempts
const PONG_WAIT_MS = 15 * 1000; // consider 15s adequate to receive PONG

let consecutiveMisses = 0;
let lastPongAt = 0;
let pongTimer;

function scheduleNextPing(delay) {
  setTimeout(sendPing, delay);
}

function sendPing() {
  try {
    xapi.Command.Message.Send({ Text: PING_TEXT });
  }
  catch (e) {
    // ignore
  }
  // set a pong wait window
  clearTimeout(pongTimer);
  pongTimer = setTimeout(handlePongTimeout, PONG_WAIT_MS);
  // schedule next ping
  scheduleNextPing(PING_INTERVAL_MS);
}

function handlePongTimeout() {
  const now = Date.now();
  // if we didn't get a pong since the last ping window
  if (now - lastPongAt > PONG_WAIT_MS - 1) {
    consecutiveMisses++;
    if (consecutiveMisses >= MAX_MISSES) {
      try {
        xapi.Command.Macros.Runtime.Restart();
      } catch (e) { }
      consecutiveMisses = 0; // reset after action
    }
  }
}

// Listen globally for PONG responses
xapi.Event.Message.Send.Text.on(text => {
  if (text === PONG_TEXT) {
    lastPongAt = Date.now();
    consecutiveMisses = 0;
  }
});

// Start after initial delay
scheduleNextPing(INITIAL_DELAY_MS);


