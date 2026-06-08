# Agora voice calling integration plan
### Expo prebuild · React Native · Incoming call notifications · Android Only

---

## Setup context

This implementation is focused exclusively on **Android**. iOS support is deferred to a later release.

### Why no CallKeep

We are using Notifee for Android notifications. Notifee's `fullScreenAction` + action buttons provide a robust heads-up and full-screen incoming call UI with Accept and Reject actions, making CallKeep unnecessary and potentially conflicting with our custom UI.

### Signaling: Socket.io + FCM

We use **Socket.io** as our primary real-time signaling layer. This ensures instant delivery of events like "ringing", "call accepted", or "caller cancelled". FCM (Firebase Cloud Messaging) is used as a fallback to wake up the device and show a notification if the app is killed or in the background.

---

## Recommended packages

### App (React Native)

| Package | Role |
|---|---|
| `react-native-agora` | Agora RTC Engine — voice channels, audio config, participant events |
| `@react-native-firebase/app` | Firebase core |
| `@react-native-firebase/messaging` | FCM push — wakes Android in background/killed state |
| `@notifee/react-native` | Rich Android heads-up notifications with Accept / Reject action buttons |
| `react-native-incall-manager` | Audio routing, proximity sensor, ringtone playback |
| `socket.io-client` | Real-time signaling — incoming call events, call state sync |

### Backend (Node.js)

```bash
npm install socket.io
```

---

## Phase 1 — Foundation setup (Completed)

### Accounts and credentials

- **Agora.io** — App ID and Token authentication enabled.
- **Firebase** — `google-services.json` configured for Android.

---

## Phase 2 — Permissions (Android Only)

### `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

---

## Phase 3 — Database: CallSession model

```prisma
enum CallStatus {
  pending     // session booked
  calling     // caller initiated, ringing
  active      // both parties joined
  completed   // finished normally
  rejected    // callee declined
  missed      // no answer before 60s timeout
}
```

---

## Phase 4 — Socket.io Implementation

### Backend Setup (`backend/src/config/socket.ts`)
Initialize Socket.io and handle authentication via JWT. Users join rooms named after their `userId`.

### Frontend Setup (`frontend/services/socketManager.ts`)
Singleton manager to handle connections, disconnections, and event listeners.

---

## Phase 5 — Call Flow Logic

1.  **Initiation (`POST /calls/initiate`):**
    - Create session (status: `calling`).
    - Emit `incoming_call` socket event to callee.
    - Send FCM data message to callee.
    - **Start 60s timer.** If no answer, mark as `missed`.
2.  **Ringing:** Callee's app shows `IncomingCallScreen`.
3.  **Accept:** 
    - Callee joins Agora channel.
    - Update session (status: `active`).
    - Emit `call_status_changed` to caller.
4.  **End/Reject:** 
    - Leave Agora channel.
    - Update session status.
    - Emit `call_status_changed` to the other party.

---

## Key Rules

1.  **Android Only:** Do not implement or debug iOS-specific VoIP features in this release.
2.  **Server-Side Tokens:** Agora tokens and channel names must ALWAYS be generated/fetched from the backend.
3.  **Socket First:** Always prefer Socket.io events for UI updates. Use FCM only for waking the device.
