import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import api from './services/api';

import App from './App';

// Create Notifee channel for calls
async function setupNotifee() {
  await notifee.createChannel({
    id: 'calls',
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

setupNotifee();

// Background FCM Message Handler
const messaging = getMessaging();
setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  console.log('--- [FCM MESSAGE RECEIVED (BACKGROUND)] ---');
  console.log('Message ID:', remoteMessage.messageId);
  console.log('Payload:', JSON.stringify(remoteMessage, null, 2));

  if (remoteMessage.data?.source === 'admin-dashboard') {
    console.log('>>> DETECTED: Push notification from Admin Dashboard');
  }
  
  if (remoteMessage.data?.type === 'incoming_call') {
    const { callId, channelName, callerName } = remoteMessage.data;

    await notifee.displayNotification({
      title: `Incoming call from ${callerName}`,
      body: 'Tap to answer',
      data: { callId, channelName, callerName },
      android: {
        channelId: 'calls',
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Accept',
            pressAction: {
              id: 'accept',
              launchActivity: 'default',
            },
          },
          {
            title: 'Reject',
            pressAction: {
              id: 'reject',
            },
          },
        ],
      },
    });
  }
});

// Background Notification Event Handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.ACTION_PRESS) {
    if (pressAction.id === 'accept') {
      console.log('User accepted call from background');
      const { callId, channelName, callerName } = notification.data;
      await AsyncStorage.setItem('pendingCallData', JSON.stringify({ callId, channelName, callerName }));
      // App will be launched by launchActivity: 'default'
    } else if (pressAction.id === 'reject') {
      console.log('User rejected call from background');
      const callId = notification.data.callId;
      try {
        await api.post(`/api/calls/${callId}/reject`);
      } catch (error) {
        console.error('Failed to reject call in background:', error);
      }
      await notifee.cancelNotification(notification.id);
    }
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
