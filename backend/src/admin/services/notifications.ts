import admin from '../config/firebase.ts';

export async function sendPushNotification(tokens: string[], title: string, body: string, priority: 'high' | 'normal' = 'normal', data?: any) {
  if (!admin.apps.length || tokens.length === 0) return;
  
  try {
    const payloadData = { 
      ...(data || {}), 
      source: 'admin-dashboard' 
    };

    if (tokens.length === 1) {
      await admin.messaging().send({
        token: tokens[0],
        notification: { title, body },
        data: payloadData,
        android: { priority }
      });
    } else {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: payloadData,
        android: { priority }
      });
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}
