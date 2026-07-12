import admin from '../config/firebase.ts';

export async function sendPushNotification(tokens: string[], title: string, body: string, priority: 'high' | 'normal' = 'normal', data?: any) {
  if (!admin.apps.length || tokens.length === 0) return;
  
  try {
    const payloadData = { 
      ...(data || {}), 
      source: 'admin-dashboard',
      priority
    };

    if (tokens.length === 1) {
      await admin.messaging().send({
        token: tokens[0],
        data: { ...payloadData, title, body },
        android: { priority }
      });
    } else {
      await admin.messaging().sendEachForMulticast({
        tokens,
        data: { ...payloadData, title, body },
        android: { priority }
      });
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}
