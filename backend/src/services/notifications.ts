import admin from '../config/firebase.ts';

export async function sendMentorOnlineAlert(studentFcmTokens: string[], mentorName: string) {
  if (!admin.apps.length || studentFcmTokens.length === 0) return;
  try {
    await admin.messaging().sendEachForMulticast({
      tokens: studentFcmTokens,
      notification: {
        title: `${mentorName} is available`,
        body:  'Tap to start a session now',
      },
      data: { type: 'mentor_online' },
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function sendLowBalanceAlert(fcmToken: string, balance: number) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Low wallet balance',
        body:  `You have ₹${balance} left — top up to keep calling`,
      },
      data: { type: 'low_balance' },
    });
  } catch(e) {}
}

export async function sendPostCallRatingPrompt(fcmToken: string, sessionId: string, mentorName: string) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'How was your session?',
        body:  `Rate your call with ${mentorName}`,
      },
      data: { type: 'rate_call', sessionId },
    });
  } catch(e) {}
}

export async function sendIncomingCallAlert(fcmToken: string, studentName: string, channelName: string) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Incoming Call',
        body: `${studentName} is calling you!`,
      },
      data: { type: 'incoming_call', channelName },
    });
  } catch(e) {}
}

export async function sendCallSignalingMessage(fcmToken: string, data: { callId: string, channelName: string, callerName: string }) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      data: { 
        type: 'incoming_call',
        ...data
      },
      android: {
        priority: 'high',
      },
    });
  } catch (error) {
    console.error('Failed to send call signaling message:', error);
  }
}
