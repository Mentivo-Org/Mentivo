import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform, DeviceEventEmitter } from 'react-native';
import api from './services/api';
import { MentorEndpoints } from './constants/endpoint';

import App from './App';
import crashlytics from '@react-native-firebase/crashlytics';

// Enable Crashlytics in development
crashlytics().setCrashlyticsCollectionEnabled(true);

// Set up global error handler for uncaught JS exceptions
const defaultErrorHandler = global.ErrorUtils.getGlobalHandler();
global.ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  defaultErrorHandler(error, isFatal);
});

// Create Notifee channels
async function setupNotifee() {
  await notifee.createChannel({
    id: 'incoming_calls_v2',
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'custom_ringtone',
  });
  await notifee.createChannel({
    id: 'ongoing_calls',
    name: 'Ongoing Calls',
    importance: AndroidImportance.LOW,
    vibration: false,
    sound: 'default',
  });
  await notifee.createChannel({
    id: 'messages',
    name: 'Chat Messages',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

setupNotifee().catch(e => console.error('[Notifee Setup Error]', e));

// Background FCM Message Handler
try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('--- [FCM MESSAGE RECEIVED (BACKGROUND)] ---');
    console.log('Message ID:', remoteMessage.messageId);
    console.log('Payload:', JSON.stringify(remoteMessage, null, 2));

  if (remoteMessage.data?.source === 'admin-dashboard') {
    console.log('>>> DETECTED: Push notification from Admin Dashboard');
    
    // If a notification payload exists, the OS handles displaying it in the system tray.
    // We only need to display it manually if it's a data-only message.
    if (!remoteMessage.notification) {
      const { title, body, priority, actionType, actionTarget } = remoteMessage.data;
      
      await notifee.displayNotification({
        id: `admin-dash_${Date.now()}`,
        title: title || 'Admin Notification',
        body: body || 'Notification',
        data: { source: 'admin-dashboard', actionType, actionTarget },
        android: {
          channelId: 'messages',
          importance: priority === 'high' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      });
    }
  }

  if (remoteMessage.data?.type === 'ping') {
    console.log('>>> DETECTED: Ping message from server. Sending pong.');
    try {
      await api.post(MentorEndpoints.pong);
    } catch (e) {
      console.error('Failed to send pong to server:', e);
    }
    // We don't need to display a notification for this
    return;
  }

  if (remoteMessage.data?.type === 'marked_offline') {
    // The server has marked the mentor offline, we can show a notification if not already handled by 'marked_offline' payload title/body
    // The backend actually sends a 'notification' payload with this, so the OS handles it automatically if the app is killed/backgrounded
    console.log('>>> DETECTED: marked_offline message');
  }

  if (remoteMessage.data?.type === 'chat') {
    const { sessionId, senderId, senderName, title, body } = remoteMessage.data;

    await notifee.displayNotification({
      id: sessionId,
      title: title || senderName || 'New Message',
      body: body || 'You have a new message',
      data: { type: 'chat', sessionId, senderId, senderName },
      android: {
        channelId: 'messages',
        importance: AndroidImportance.HIGH,
        priority: 'high',
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    });
  }

  if (remoteMessage.data?.type === 'incoming_call_v2') {
    const { callId, channelName, callerName, callerPhoto } = remoteMessage.data;

    try {
      await setupNotifee();
      await notifee.displayNotification({
        id: callId, // Use callId as notification ID to allow easy cancellation
        title: `Incoming call from ${callerName}`,
        body: 'Tap to answer',
        data: { type: 'incoming_call_v2', callId, channelName, callerName, callerPhoto },
        android: {
          channelId: 'incoming_calls_v2',
          importance: AndroidImportance.HIGH,
          priority: 'high',
          category: 'call',
          autoCancel: false,
          loopSound: true,
          sound: 'custom_ringtone', 
          showWhenLocked: true,
          turnScreenOn: true,
          pressAction: {
            id: 'default',
            launchActivity: 'default'
          },
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
    } catch (error) {
      console.error('[Notifee Display Error]', error);
    }
  }

  if (remoteMessage.data?.type === 'call_cancelled') {
    const { callId } = remoteMessage.data;
    await notifee.cancelNotification(callId);
    try {
      await AsyncStorage.removeItem('pendingCallData');
    } catch (e) {
      console.error('Failed to remove pending call data:', e);
    }
  }

  if (remoteMessage.data?.type === 'call_status_changed') {
    const { callId, status } = remoteMessage.data;
    if (status === 'rejected' || status === 'missed' || status === 'completed' || status === 'cancelled') {
      await notifee.cancelNotification(callId);
      try {
        await AsyncStorage.removeItem('pendingCallData');
      } catch (e) {
        console.error('Failed to remove pending call data:', e);
      }
    }
  }
  });
} catch (e) {
  console.error('[FCM Background Handler Setup Error]', e);
}

// Background Notification Event Handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.ACTION_PRESS) {
    if (pressAction.id === 'accept') {
      console.log('User accepted call from background');
      const { callId, channelName, callerName, callerPhoto } = notification.data;
      await AsyncStorage.setItem('pendingCallData', JSON.stringify({ callId, channelName, callerName, callerPhoto }));
      // App will be launched by launchActivity: 'default'
    } else if (pressAction.id === 'reject') {
      console.log('User rejected call from background');
      const callId = notification.data.callId;
      try {
        await api.post(`/calls/${callId}/reject`);
      } catch (error) {
        console.error('Failed to reject call in background:', error);
      }
      await notifee.cancelNotification(notification.id);
    } else if (pressAction.id === 'end_call') {
      console.log('User ended call from background');
      const callId = notification.data.callId;
      try {
        await api.post(`/calls/${callId}/end`);
      } catch (error) {
        console.error('Failed to end call in background:', error);
      }
      await notifee.cancelNotification(notification.id);
      DeviceEventEmitter.emit('end_active_call');
    }
  }
});

// Register Notifee Foreground Service
notifee.registerForegroundService((notification) => {
  return new Promise((resolve) => {
    console.log('[Notifee Foreground Service] Service registered and active');
    const stopSub = DeviceEventEmitter.addListener('stop_foreground_service', () => {
      console.log('[Notifee Foreground Service] Stopping service');
      stopSub.remove();
      resolve();
    });
  });
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
