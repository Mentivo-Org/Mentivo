import admin from '../config/firebase.ts';

async function sendMentorOnlineAlert(studentFcmTokens: string[], mentorName: string) {
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

async function sendLowBalanceAlert(fcmToken: string, balance: number) {
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

async function sendPostCallRatingPrompt(fcmToken: string, sessionId: string, mentorName: string) {
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

async function sendIncomingCallAlert(fcmToken: string, studentName: string, channelName: string) {
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

export async function sendMentorPromotionAlert(fcmToken: string, level: string) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Level Up! 🚀',
        body: `Congratulations! You have been promoted to ${level} Mentor.`,
      },
      data: { type: 'promotion', level },
    });
  } catch (e) {}
}

export async function sendCallSignalingMessage(fcmToken: string, data: { callId: string, channelName: string, callerName: string }) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      data: { 
        type: 'incoming_call',
        callId: data.callId,
        channelName: data.channelName,
        callerName: data.callerName,
      },
      android: {
        priority: 'high',
        ttl: 60 * 1000,
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            priority: 10,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to send call signaling message:', error);
  }
}

export async function sendCallCancelledMessage(fcmToken: string, callId: string) {
  if (!admin.apps.length || !fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      data: { 
        type: 'call_cancelled',
        callId,
      },
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            'content-available': 1,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to send call cancelled message:', error);
  }
}

export async function sendChatPushNotification(fcmTokens: string[], data: { sessionId: string, senderId: string, senderName: string, message: string }) {
  if (!admin.apps.length || fcmTokens.length === 0) return;
  try {
    await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      // 'notification' payload triggers system tray on background/killed state.
      // 'data' payload is available to both foreground and background JS handlers.
      notification: {
        title: data.senderName,
        body: data.message,
      },
      data: {
        type: 'chat',
        sessionId: data.sessionId,
        senderId: data.senderId,
        senderName: data.senderName,
        // Include title/body in data so the notifee background handler can display it
        title: data.senderName,
        body: data.message,
      },
      android: {
        priority: 'high',
      },
    });
  } catch (error) {
    console.error('Failed to send multicast chat push notification:', error);
  }
}

export async function sendAnswerAlert(studentId: string, mentorName: string, questionId: string) {
  // Create database notification first
  try {
    const prisma = (await import('../config/db.ts')).default;
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'New Answer! 💡',
        body: `${mentorName} answered your question. Tap to view.`,
      },
    });

    const tokens = await prisma.fCMToken.findMany({
      where: { userId: studentId },
    });
    const fcmTokens = tokens.map((t) => t.token);

    if (admin.apps.length && fcmTokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title: 'New Answer! 💡',
          body: `${mentorName} answered your question. Tap to view.`,
        },
        data: {
          type: 'question_answered',
          questionId,
        },
        android: {
          priority: 'high',
        },
      });
    }
  } catch (error) {
    console.error('Failed to send answer push notification:', error);
  }
}

