# Agora voice calling integration plan
### Expo prebuild · React Native · Incoming call notifications

---

## Setup context

You are using `npx expo prebuild`, which generates the `android/` and `ios/` native folders. This means:

- You can manually edit `AndroidManifest.xml`, `Podfile`, `Info.plist`, `MainApplication.kt`, etc. directly — no config plugin required for every package.
- Config plugins in `app.json` still work and are useful where available, but they are not mandatory.
- Treat `android/` and `ios/` as committed, owned code. Avoid re-running `npx expo prebuild` unless you are upgrading the Expo SDK — re-running it will overwrite manual edits.
- Build and run with `npx expo run:android` or `npx expo run:ios`.

---

## Recommended packages

| Package | Role | Platform |
|---|---|---|
| `react-native-agora` | Agora RTC Engine — voice channels, audio config, participant events | Both |
| `react-native-callkeep` | CallKit (iOS) and ConnectionService (Android) — native lock-screen incoming call UI | Both |
| `react-native-voip-push-notification` | PushKit VoIP push registration — wakes app from killed state on iOS | iOS |
| `@react-native-firebase/app` | Firebase core | Both |
| `@react-native-firebase/messaging` | FCM push — handles background and killed app states | Both |
| `@notifee/react-native` | Rich Android heads-up notifications with Accept / Reject action buttons | Android |
| `react-native-incall-manager` | Audio routing (earpiece ↔ speaker), proximity sensor, ringtone playback | Both |

Install with:

```bash
npx expo install react-native-agora react-native-callkeep \
  react-native-voip-push-notification \
  @react-native-firebase/app @react-native-firebase/messaging \
  @notifee/react-native react-native-incall-manager
```

After installing, run `npx expo prebuild` once to regenerate native folders with the new packages linked, then commit the result.

---

## Phase 1 — Foundation setup

### Accounts and credentials

- **Agora.io** — create a project, copy the App ID. Enable token authentication for production (never expose your App Certificate client-side).
- **Firebase** — create a project. Register the Android app and download `google-services.json` to the project root. Register the iOS app and download `GoogleService-Info.plist` to `ios/`.
- **Apple Developer** — generate an **APNs VoIP Services Certificate** (separate from the regular push cert). This is required for PushKit VoIP push, which is mandatory for waking a killed iOS app on an incoming call.

### Android native setup

Place `google-services.json` at the project root and add the Google Services plugin to your Gradle files:

`android/build.gradle`:
```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.4.1'
  }
}
```

`android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### iOS native setup

Place `GoogleService-Info.plist` inside `ios/YourApp/` and add it to the Xcode project (drag into Xcode, check "Copy items if needed").

In `ios/Podfile`, make sure the minimum deployment target is 13.4 or higher:
```ruby
platform :ios, '13.4'
```

Run `cd ios && pod install` after any new native package is added.

---

## Phase 2 — Permissions

### Android — `android/app/src/main/AndroidManifest.xml`

Add inside `<manifest>`:

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

### iOS — `ios/YourApp/Info.plist`

Add the microphone usage description:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Needed for voice calls</string>
```

Add background modes:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>voip</string>
  <string>audio</string>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

### iOS — Xcode capabilities

In Xcode under **Signing & Capabilities**, add:
- **Background Modes** — check: Voice over IP, Audio, Fetch, Remote notifications
- **Push Notifications**

### Runtime permission request

Request microphone permission before any call attempt:

```ts
import { Audio } from 'expo-av';

const { status } = await Audio.requestPermissionsAsync();
if (status !== 'granted') {
  // show explanation UI
  return;
}
```

On Android also request FCM notification permission (Android 13+):

```ts
import messaging from '@react-native-firebase/messaging';
await messaging().requestPermission();
```

---

## Phase 3 — Agora voice engine

Initialize once at app startup — a React context or module-level singleton keeps one engine instance alive for the session.

```ts
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
} from 'react-native-agora';

let engine: IRtcEngine;

export function initAgoraEngine() {
  engine = createAgoraRtcEngine();
  engine.initialize({ appId: AGORA_APP_ID });
  engine.setChannelProfile(
    ChannelProfileType.ChannelProfileCommunication
  );
  engine.enableAudio();

  engine.addListener('onUserJoined', (connection, uid) => {
    console.log('Remote user joined:', uid);
  });

  engine.addListener('onUserOffline', (connection, uid) => {
    console.log('Remote user left:', uid);
    endCall();
  });


  engine.addListener('onError', (err, msg) => {
    console.error('Agora error:', err, msg);
  });
}

export async function joinChannel(token: string, channelName: string, uid: number) {
  engine.joinChannel(token, channelName, uid, {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    autoSubscribeAudio: true,
  });
}

export function leaveChannel() {
  engine.leaveChannel();
  engine.release();
}
```

> **Token authentication** — for production, call your backend to get a temporary Agora token before joining any channel. Never ship your App Certificate in the app bundle.

### Audio routing

Use `react-native-incall-manager` to manage the audio session:

```ts
import InCallManager from 'react-native-incall-manager';

// When call connects
InCallManager.start({ media: 'audio' });

// Toggle speaker
InCallManager.setSpeakerphoneOn(true);

// On call end
InCallManager.stop();
```

---

## Phase 4 — Signaling layer

Agora handles audio transport but not call setup. You need a signaling layer to exchange the channel name and call state between the two parties. Firebase Realtime Database is the best fit since you already have it for FCM.

### Data structure

```
/calls/{callId}
  callerId:    string
  calleeId:    string
  callerName:  string
  channelName: string   ← UUID generated by the caller
  status:      'calling' | 'connected' | 'ended' | 'rejected' | 'missed'
  createdAt:   number   ← Unix ms
```

### Caller flow

```ts
import database from '@react-native-firebase/database';
import uuid from 'react-native-uuid';

async function initiateCall(calleeId: string, callerName: string) {
  const callId = uuid.v4() as string;
  const channelName = uuid.v4() as string;

  await database().ref(`/calls/${callId}`).set({
    callerId: currentUserId,
    calleeId,
    callerName,
    channelName,
    status: 'calling',
    createdAt: Date.now(),
  });

  // Trigger push notification via your backend
  await api.sendCallNotification({ calleeId, callId, channelName, callerName });

  // Listen for callee response
  database().ref(`/calls/${callId}`).on('value', snap => {
    const status = snap.val()?.status;
    if (status === 'connected') startCallTimer();
    if (status === 'rejected' || status === 'missed') dismissCallerUI();
  });

  // Auto-timeout after 60 seconds
  setTimeout(async () => {
    const snap = await database().ref(`/calls/${callId}/status`).once('value');
    if (snap.val() === 'calling') {
      database().ref(`/calls/${callId}`).update({ status: 'missed' });
    }
  }, 60000);
}
```

### Callee flow

```ts
function listenToCallStatus(callId: string) {
  database().ref(`/calls/${callId}`).on('value', snap => {
    const status = snap.val()?.status;
    // Caller cancelled before callee answered
    if (status === 'ended' || status === 'missed') {
      dismissIncomingCallUI();
      CallKeep.endCall(currentCallUUID);
    }
  });
}
```

---

## Phase 5 — Android push notifications (FCM + Notifee)

### Backend

Your backend sends a high-priority FCM **data message** (not a notification message) to the callee's FCM token, including the call metadata:

```json
{
  "message": {
    "token": "<callee_fcm_token>",
    "data": {
      "type": "incoming_call",
      "callId": "...",
      "channelName": "...",
      "callerName": "..."
    },
    "android": {
      "priority": "high"
    }
  }
}
```

### Create a Notifee channel (run once on app start)

```ts
import notifee, { AndroidImportance } from '@notifee/react-native';

await notifee.createChannel({
  id: 'calls',
  name: 'Incoming calls',
  importance: AndroidImportance.HIGH,
  vibration: true,
});
```

### Background message handler — `index.js` (outside the React tree)

```ts
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage.data?.type !== 'incoming_call') return;

  const { callId, callerName } = remoteMessage.data;

  await notifee.displayNotification({
    title: `Incoming call from ${callerName}`,
    body: 'Tap to open',
    data: { callId },
    android: {
      channelId: 'calls',
      importance: AndroidImportance.HIGH,
      fullScreenAction: { id: 'default' },
      actions: [
        {
          title: 'Accept',
          pressAction: { id: 'accept', launchActivity: 'default' },
        },
        {
          title: 'Reject',
          pressAction: { id: 'reject' },
        },
      ],
    },
  });
});
```

### Handle action button presses — also in `index.js`

```ts
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { EventType } = require('@notifee/react-native');
  const callId = detail.notification?.data?.callId;

  if (type === EventType.ACTION_PRESS) {
    if (detail.pressAction?.id === 'accept') {
      // Store intent; app will navigate on open
      await AsyncStorage.setItem('pendingCallId', callId);
    }
    if (detail.pressAction?.id === 'reject') {
      await database().ref(`/calls/${callId}`).update({ status: 'rejected' });
      await notifee.cancelNotification(detail.notification.id);
    }
  }
});
```

---

## Phase 6 — iOS VoIP push (PushKit)

VoIP push is mandatory on iOS for call apps. It wakes the app from any state (including killed) and is exempt from the throttling that applies to regular APNs.

### Register for VoIP push

```ts
import VoipPushNotification from 'react-native-voip-push-notification';
import CallKeep from 'react-native-callkeep';
import uuid from 'react-native-uuid';

export function setupVoipPush() {
  VoipPushNotification.addEventListener('register', token => {
    // Save token to your backend so it can send VoIP pushes to this device
    api.saveVoipToken(currentUserId, token);
  });

  VoipPushNotification.addEventListener('notification', async notif => {
    // CRITICAL: call CallKeep.displayIncomingCall synchronously here.
    // Do NOT await anything before this call — iOS will terminate the
    // app if you fail to report the call promptly.
    const callUUID = uuid.v4() as string;
    const { callerName, callerNumber, callId, channelName } = notif;

    CallKeep.displayIncomingCall(callUUID, callerNumber, callerName, 'generic');

    // Store mapping so later events can look up callId from callUUID
    storeCallMapping(callUUID, { callId, channelName });

    // NOW safe to do async work
    listenToCallStatus(callId);
  });

  VoipPushNotification.registerVoipToken();
}
```

### Backend sends VoIP push

Your backend uses the **APNs VoIP certificate** (not the regular push cert) and sets `apns-push-type: voip` and `apns-topic: <bundleId>.voip`:

```
POST https://api.development.push.apple.com/3/device/<voip-token>

Headers:
  apns-topic: com.yourapp.voip
  apns-push-type: voip
  apns-priority: 10

Body:
{
  "aps": {},
  "callId": "...",
  "channelName": "...",
  "callerName": "...",
  "callerNumber": "+1234567890"
}
```

---

## Phase 7 — CallKeep (native call UI)

### Setup — call once on app startup

```ts
import CallKeep from 'react-native-callkeep';
import { PermissionsAndroid } from 'react-native';

CallKeep.setup({
  ios: {
    appName: 'YourApp',
    supportsVideo: false,
  },
  android: {
    alertTitle: 'Phone account permissions',
    alertDescription: 'Allow YourApp to manage calls',
    cancelButton: 'Cancel',
    okButton: 'Allow',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
    selfManaged: false,
  },
});
```

### Event handlers

```ts
CallKeep.addEventListener('answerCall', ({ callUUID }) => {
  const { callId, channelName } = getCallMapping(callUUID);
  listenToCallStatus(callId);
  joinAgoraChannel(channelName);
  navigation.navigate('InCall', { callId, callUUID });
  database().ref(`/calls/${callId}`).update({ status: 'connected' });
});

CallKeep.addEventListener('endCall', ({ callUUID }) => {
  const { callId } = getCallMapping(callUUID);
  leaveChannel();
  InCallManager.stop();
  database().ref(`/calls/${callId}`).update({ status: 'ended' });
});

// iOS only — Agora audio must start after CallKit activates the audio session
CallKeep.addEventListener('didActivateAudioSession', () => {
  InCallManager.start({ media: 'audio' });
});
```

> **Always call `CallKeep.endCall(uuid)`** when a call ends from any source — signaling update, timeout, or the user tapping end in-app. Omitting this leaves iOS displaying a phantom "call in progress" badge in the status bar.

---

## Phase 8 — Deep link to full-screen call UI

When the user taps the notification body (not an action button), the app should open and navigate to your incoming call screen. Handle all three app states:

### Foreground

```ts
import notifee, { EventType } from '@notifee/react-native';

notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    const callId = detail.notification?.data?.callId;
    navigation.navigate('IncomingCall', { callId });
  }
});
```

### Background and killed — read on app open

```ts
// In your root navigator, inside useEffect
useEffect(() => {
  // Notifee — handles background tap and killed-state tap
  notifee.getInitialNotification().then(n => {
    if (n?.notification?.data?.callId) {
      navigation.navigate('IncomingCall', {
        callId: n.notification.data.callId,
      });
    }
  });

  // FCM — backup for killed state
  messaging().getInitialNotification().then(msg => {
    if (msg?.data?.callId) {
      navigation.navigate('IncomingCall', { callId: msg.data.callId });
    }
  });

  // Pending accepted call from notification action button
  AsyncStorage.getItem('pendingCallId').then(callId => {
    if (callId) {
      AsyncStorage.removeItem('pendingCallId');
      // User already accepted — go straight to in-call screen
      navigation.navigate('InCall', { callId });
    }
  });
}, []);
```

### Android `USE_FULL_SCREEN_INTENT` note

Android 14+ shows a separate permission prompt for `USE_FULL_SCREEN_INTENT`. Add a step in your onboarding flow that opens the system settings for this permission:

```ts
import { Linking } from 'react-native';
Linking.openSettings(); // opens app settings where user can grant it
```

---

## Phase 9 — Wire up your call screen

Your screen receives `callId` and optionally `callUUID` as route params.

```ts
function IncomingCallScreen({ route }) {
  const { callId } = route.params;
  const [call, setCall] = useState(null);
  const callUUIDRef = useRef(null);

  useEffect(() => {
    // Load call data
    database().ref(`/calls/${callId}`).once('value').then(snap => {
      setCall(snap.val());
    });

    // Listen for caller cancellation while ringing
    const ref = database().ref(`/calls/${callId}`);
    ref.on('value', snap => {
      const status = snap.val()?.status;
      if (status === 'ended' || status === 'missed') {
        InCallManager.stopRingback();
        CallKeep.endCall(callUUIDRef.current);
        navigation.goBack();
      }
    });

    InCallManager.startRingtone('_BUNDLE_');
    return () => {
      ref.off();
      InCallManager.stopRingtone();
    };
  }, [callId]);

  async function handleAccept() {
    InCallManager.stopRingtone();
    const token = await api.getAgoraToken(call.channelName);
    await joinChannel(token, call.channelName, currentUserId);
    await database().ref(`/calls/${callId}`).update({ status: 'connected' });
    if (callUUIDRef.current) {
      CallKeep.answerIncomingCall(callUUIDRef.current);
    }
    navigation.replace('InCall', { callId });
  }

  async function handleReject() {
    InCallManager.stopRingtone();
    await database().ref(`/calls/${callId}`).update({ status: 'rejected' });
    if (callUUIDRef.current) {
      CallKeep.rejectCall(callUUIDRef.current);
    }
    navigation.goBack();
  }

  // ... your existing UI with accept and reject buttons
}
```

### In-call controls

```ts
// Mute / unmute
engine.muteLocalAudioStream(isMuted);

// Speaker toggle
InCallManager.setSpeakerphoneOn(isSpeakerOn);

// End call
async function handleEndCall() {
  leaveChannel();
  InCallManager.stop();
  await database().ref(`/calls/${callId}`).update({ status: 'ended' });
  if (callUUID) CallKeep.endCall(callUUID);
  navigation.goBack();
}
```

---

## Complete call flow

```
User A taps Call
  └─ writes /calls/{id} status: "calling"
  └─ calls backend → backend sends push

Push arrives on User B's device
  ├─ Android: FCM data message → Notifee heads-up notification
  │     └─ Accept button  → AsyncStorage + navigate to InCall
  │     └─ Reject button  → update status "rejected"
  │     └─ Tap body       → app opens → navigate to IncomingCall screen
  └─ iOS: VoIP push (PushKit) → CallKeep.displayIncomingCall()
        └─ Native call screen (even on lock screen)
              └─ Accept → answerCall event → join Agora + navigate
              └─ Decline → endCall event → update status "rejected"

Both in call
  └─ Agora RTC handles audio
  └─ Firebase status: "connected"
  └─ Either party ends → leaveChannel() + CallKeep.endCall()
                       + status "ended" → both UIs dismiss
```

---

## Key gotchas

| Issue | Fix |
|---|---|
| iOS kills app after VoIP push | Call `CallKeep.displayIncomingCall()` synchronously — no `await` before it |
| Phantom "call in progress" on iOS status bar | Always call `CallKeep.endCall(uuid)` for every call end path |
| Audio doesn't work on iOS | Start Agora audio inside `didActivateAudioSession`, not before |
| Android 14 full-screen notification blocked | Add `USE_FULL_SCREEN_INTENT` permission and guide user to grant it in settings |
| Re-running `npx expo prebuild` wipes manual edits | Treat `android/` and `ios/` as committed code; only re-prebuild on SDK upgrades |
| Notification arrives but app not waking on Android | Use a **data message** (not notification message) from FCM with `priority: high` |
| Agora token errors in production | Never hardcode App Certificate; fetch tokens from your backend endpoint |