import admin from '../config/firebase.ts';

export async function sendPushNotification(tokens: string[], title: string, body: string, priority: 'high' | 'normal' = 'normal', data?: any) {
  if (!admin.apps.length || tokens.length === 0) return;
  
  try {
    const payloadData = { 
      ...(data || {}), 
      source: 'admin-dashboard',
      priority
    };

    // Data-only payload: the client is the sole display owner. Including a
    // `notification` block would make the OS a second display owner and cause
    // duplicate notifications when the app changes foreground state mid-delivery.
    // `android.priority` must be 'high' regardless of the admin's chosen priority —
    // Android 8+ background limits refuse to start the RN headless task otherwise,
    // and nothing gets displayed. The admin's choice travels in data.priority and
    // selects the notification channel on the client.
    if (tokens.length === 1) {
      await admin.messaging().send({
        token: tokens[0],
        data: { ...payloadData, title, body },
        android: { priority: 'high' }
      });
    } else {
      await admin.messaging().sendEachForMulticast({
        tokens,
        data: { ...payloadData, title, body },
        android: { priority: 'high' }
      });
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}
