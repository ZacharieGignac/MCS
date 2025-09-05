## Bug: Presentation status misclassifies local share as preview

### Summary
- When a local presentation is actively being sent, the system reports `LOCALPREVIEW` instead of `LOCALSHARE`.
- Root cause: a boolean flag `localPresentationSending` is initialized to false and never set to true.

### Affected area
- File: `systemstatus.js`
- Function: `presentation.getStatus()`
- Output: `zapi.system._systemStatus.presentation.type`

### Root cause analysis
- The logic initializes three flags based on `xapi.Status.Conference.Presentation`:
  - `localPresentation` (derived from `pres.LocalInstance`)
  - `remotePresentation` (derived from `pres.Mode == 'Receiving'`)
  - `localPresentationSending` (initialized but never updated)

Because `localPresentationSending` never becomes true, the branch classifying a local session as `LOCALSHARE` is unreachable. All local sessions without remote receiving are categorized as `LOCALPREVIEW`.

### Reproduction steps
1. Ensure no active calls or presentations.
2. Start a local presentation in preview mode → `presentation.type` becomes `LOCALPREVIEW` (expected).
3. Switch to sending the presentation (e.g., share to room/far end) → `presentation.type` remains `LOCALPREVIEW` (incorrect). Expected `LOCALSHARE`.

### Technical details
Relevant current logic (abridged):
```javascript
var localPresentation = false;
var remotePresentation = false;
var localPresentationSending = false;

if (pres.LocalInstance != undefined) {
  localPresentation = true;
} else {
  localPresentation = false;
}

if (pres.Mode == 'Receiving') {
  remotePresentation = true;
}

if (localPresentation && !remotePresentation) {
  if (localPresentationSending) {
    status.type = PRES_LOCALSHARE;
  } else {
    status.type = PRES_LOCALPREVIEW;
  }
}
```

`localPresentationSending` is never set to true.

### Proposed fix
- Determine when the local presentation is being sent using `pres.Mode`:
  - When `pres.Mode == 'Sending'`, set `localPresentationSending = true`.
- Also simplify the redundant local presence check.

Minimal change:
```diff
 var localPresentation = false;
 var remotePresentation = false;
 var localPresentationSending = false;

-if (pres.LocalInstance != undefined) {
-  if (pres.LocalInstance != undefined) {
-    localPresentation = true;
-  } else {
-    localPresentation = false;
-  }
-} else {
-  localPresentation = false;
-}
+localPresentation = (pres.LocalInstance != undefined);
+if (pres.Mode == 'Sending') {
+  localPresentationSending = true;
+}

 if (pres.Mode == 'Receiving') {
   remotePresentation = true;
 }
```

### Why this is correct
- On Cisco xAPI, `Conference.Presentation Mode` reflects whether the device is `Sending` or `Receiving` a presentation. Using this value to detect active sending is reliable.
- `LocalInstance` denotes local session presence (preview or sending). Combining both signals properly differentiates `LOCALPREVIEW` vs `LOCALSHARE`.

### Test plan
- Stubbed/unit-style checks by mocking `pres`:
  - No local, not receiving → `NOPRESENTATION`.
  - Local present, `Mode` neither `Sending` nor `Receiving` → `LOCALPREVIEW` with `source`.
  - Local present, `Mode == 'Sending'` → `LOCALSHARE` with `source`.
  - No local, `Mode == 'Receiving'` → `REMOTE`.
  - Local present, `Mode == 'Receiving'` → `REMOTELOCALPREVIEW` with `source`.

- Integration checks on device:
  1) Start local preview → observe `LOCALPREVIEW`.
  2) Start sending → observe transition to `LOCALSHARE`.
  3) While sending is off, receive remote → `REMOTE`.
  4) Local preview while receiving remote → `REMOTELOCALPREVIEW`.
  5) Stop all → `NOPRESENTATION`.

### Impact of the bug
- Telemetry and analytics undercount actual local shares and overcount previews.
- Any automations keyed on `LOCALSHARE` will not trigger (e.g., switching displays, light scenes, recording policies).
- Operator dashboards and logs show misleading state during active local sharing.

### Risks / Side effects
- Low risk. The change is read-only classification logic.
- Ensure string comparison for `Mode` matches exact firmware output (case sensitive). If needed, add normalization.

### Rollback
- If issues are observed, revert the change to return to prior behavior (incorrect classification but stable).

### Status
- Documented. No code change included in this commit. Implement the minimal diff above in `systemstatus.js` to apply the fix.

