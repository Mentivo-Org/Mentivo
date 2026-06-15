# Calling, Notifications, and Screen Wake Behavior Report

This report analyzes how the Mentivo app handles real-time VoIP calls, push notifications, and screen-wake behaviors across different Android/iOS system states (**Foreground**, **Suspended/Background**, and **Killed/Closed**).

---

## 1. Core Architecture Overview

Mentivo relies on a dual-path communication system to guarantee call delivery:
1. **Socket.io (WebSocket)**: Used for instant, low-latency signaling when the app is active in the **Foreground**.
2. **Firebase Cloud Messaging (FCM) & Notifee**: Used for high-priority signaling when the app is **Suspended (Background)** or **Killed (Closed)**.
3. **InCallManager & Notifee Native Integrations**: Handles physical hardware controls such as playing ringtones, managing the device's screen power (wake lock), and showing overlays over the lock screen.

---

## 2. Comprehensive State Matrix

| Feature / Behavior | Foreground State | Suspended (Background) State | Killed (Closed) State |
| :--- | :--- | :--- | :--- |
| **Signaling Channel** | **Socket.io (WebSocket)** (`incoming_call` event) | **FCM Push Notification** (`incoming_call` payload) | **FCM Push Notification** (`incoming_call` payload) |
| **Visual Alert type** | Direct Screen Navigation (`IncomingCallScreen`) | High-Priority Heads-up Notification or Full-Screen Overlay | High-Priority Heads-up Notification or Full-Screen Overlay |
| **Vibration & Sound** | Managed locally via `InCallManager.startRingtone()` | Managed by OS via Notifee channel (`loopSound: true`) | Managed by OS via Notifee channel (`loopSound: true`) |
| **Screen Wake Behavior** | Screen kept awake via `InCallManager.setKeepScreenOn(true)` | Screen is turned on via Notifee (`turnScreenOn: true`) | Screen is turned on via Notifee (`turnScreenOn: true`) |
| **Lock Screen Display** | App is active (not locked) | Renders overlay via Notifee (`showWhenLocked: true`) | Renders overlay via Notifee (`showWhenLocked: true`) |
| **Accept Action Flow** | Direct transition to `InCallScreen` (Agora VoIP join) | Saves `pendingCallData` to Storage $\rightarrow$ Launches App $\rightarrow$ Navigates to `InCall` | Saves `pendingCallData` to Storage $\rightarrow$ Cold starts App $\rightarrow$ Navigates to `InCall` |
| **Reject Action Flow** | Emits `/calls/:id/reject` REST call $\rightarrow$ Go back | Background event triggers REST post $\rightarrow$ Cancels notification | Background event triggers REST post $\rightarrow$ Cancels notification |

---

## 3. Detailed Technical Analysis

### A. Foreground State Behavior
* **Signaling**: The socket client maintains an active connection. When a call invite is received, the listener inside [RootNavigator.tsx](file:///c:/Projects/Mentivo/frontend/screens/RootNavigator.tsx#L466-L474) intercepts the socket event. 
* **User Experience**: Because the user is actively inside the app, it bypasses the system notification tray completely. The app executes a direct navigation transition to the `IncomingCall` screen.
* **Audio & Power Controls**:
  - `InCallManager.setKeepScreenOn(true)` is activated to override device display sleep timeouts during the ring duration.
  - `InCallManager.startRingtone('_BUNDLE_')` plays the local audio track.

### B. Suspended (Background) State Behavior
* **Signaling**: When backgrounded, socket connections are typically suspended by the operating system. Real-time invite delivery shifts entirely to high-priority FCM data messages.
* **Notification Management**:
  - Handled in [index.js](file:///c:/Projects/Mentivo/frontend/index.js#L39-L120) by `setBackgroundMessageHandler()`. This executes inside a background Headless JS task.
  - It creates a Notifee system call notification with `ongoing: true` (non-dismissible) and `asForegroundService: true`.
* **Screen Wake & Overlays**:
  - **Screen Off**: If the screen is off/locked, `turnScreenOn: true` wakes the device display, and `showWhenLocked: true` displays the UI.
  - **Full-Screen Intent**: `fullScreenAction: { id: 'default', launchActivity: 'default' }` forces the device to open the incoming call overlay directly over the lock screen (matching native dialer behavior).
  - **Foreground Service**: Declaring `asForegroundService: true` prevents Android from killing the background service during the call ring duration.

### C. Killed (Closed) State Behavior
* **Signaling**: The app process is fully closed. Android wakes up a lightweight background JavaScript instance when an FCM push is received.
* **Handling Cold Starts**:
  - If a user clicks the **Accept** action button while the app is killed:
    1. Notifee's `onBackgroundEvent` captures the event, records `pendingCallData` in `AsyncStorage`, and requests the system to launch the main application package.
    2. The application undergoes a **Cold Start**.
    3. During initialization, `checkInitialNotification` in [RootNavigator.tsx](file:///c:/Projects/Mentivo/frontend/screens/RootNavigator.tsx#L408-L434) is executed.
    4. It fetches `pendingCallData` from `AsyncStorage`, cancels/clears it, and redirects the student/mentor directly to the active Agora VoIP call screen (`InCall`), skipping the intermediate landing page and login screens.

---

## 4. Key Security & Wake Lock Permissions Used
The app utilizes specific native Android permission tags in [AndroidManifest.xml](file:///c:/Projects/Mentivo/frontend/android/app/src/main/AndroidManifest.xml) to execute these behaviors:
- `SYSTEM_ALERT_WINDOW`: Required to draw overlay windows on top of other running apps.
- `USE_FULL_SCREEN_INTENT`: Allows high-priority notifications to open in full screen when the screen is locked/off.
- `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_PHONE_CALL`: Needed to run VoIP call handlers in background states on Android 14+.

---

## 5. Potential Failures & Recommendations

1. **System Alert Window Permission (Android)**:
   - *Issue*: Some Android devices block overlays unless the user explicitly grants the "Draw over other apps" permission.
   - *Recommendation*: Introduce a one-time permission prompt during onboarding for Android users to guide them to enable this setting.
2. **Deep Sleep / Doze Mode**:
   - *Issue*: Aggressive battery optimizations (e.g., Samsung Device Care) can delay FCM messages.
   - *Recommendation*: Ensure you explain to users how to disable battery optimization for the Mentivo app to guarantee instant call invites.
