import { useEffect } from "react";
import { AppState, DeviceEventEmitter, Linking } from "react-native";
import { storage } from "../services/storage";
import notifee, { EventType, AndroidImportance } from "@notifee/react-native";
import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import { navigate, getActiveChatSessionId } from "../services/navigation";
import { socketManager } from "../services/socketManager";
import api from "../services/api";
import { CallEndpoints } from "../constants/endpoint";
import { Routes } from "../constants/routes";

const INCOMING_CALL_CHANNEL = "incoming_calls_v2";
const ONGOING_CALL_CHANNEL = "ongoing_calls";
const QUIET_CHANNEL = "messages_quiet";

/**
 * Wires up all push/notification/call-routing sources (Notifee foreground events,
 * FCM foreground messages, cold-start notification, AppState warm-start resume,
 * and the socket "incoming call" fallback) and routes them to the navigator.
 * Only active once the user is signed in.
 */
export function useNotificationRouter(isSignedIn: boolean) {
  useEffect(() => {
    if (!isSignedIn) return;

    // 1. Create notifee channels
    const createChannels = async () => {
      await notifee.createChannel({
        id: INCOMING_CALL_CHANNEL,
        name: "Incoming Calls",
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [300, 100, 300, 100, 300],
        sound: "custom_ringtone",
      });

      await notifee.createChannel({
        id: ONGOING_CALL_CHANNEL,
        name: "Ongoing Calls",
        importance: AndroidImportance.LOW,
        vibration: false,
      });
    };
    createChannels();

    // 2. Foreground notification press
    const unsubscribeForeground = notifee.onForegroundEvent(
      async ({ type, detail }) => {
        if (type === EventType.PRESS) {
          const data = detail.notification?.data || {};
          const {
            callId,
            channelName,
            callerName,
            callerPhoto,
            type: notificationType,
            sessionId,
            senderId,
            senderName,
            questionId,
          } = data;
          if (callId) {
            if (data.screen === "InCall") {
              navigate(Routes.inCall, {
                callId,
                channelName,
                callerName,
                role: data.role,
                initialToken: data.initialToken,
                mentorPhoto: callerPhoto,
              });
            } else {
              navigate(Routes.incomingCall, {
                callId,
                channelName,
                callerName,
                callerPhoto,
              });
            }
          } else if (notificationType === "chat" || sessionId) {
            navigate(Routes.chatPage, {
              partnerId: senderId,
              partnerName: senderName,
              sessionId: sessionId,
            });
          } else if (notificationType === "question_answered" || questionId) {
            navigate(Routes.questionDetail, { questionId: questionId });
          } else if (data.source === "admin-dashboard") {
            const { actionType, actionTarget } = data;
            if (actionType === "EXTERNAL_URL" && actionTarget) {
              Linking.openURL(actionTarget as string).catch(err => console.error("Failed to open URL:", err));
            } else if (actionType === "IN_APP" && actionTarget) {
              navigate(actionTarget as any);
            }
          }
        } else if (type === EventType.ACTION_PRESS) {
          const data = detail.notification?.data || {};
          const { callId, channelName, callerName, callerPhoto } = data;
          const pressActionId = detail.pressAction?.id;

          if (pressActionId === "accept") {
            console.log("[Foreground Event] User clicked Accept");
            if (detail.notification?.id) {
              try {
                await notifee.cancelNotification(detail.notification.id);
              } catch (e) {
                console.error(e);
              }
            }
            navigate(Routes.inCall, {
              callId,
              channelName,
              callerName,
              role: "callee",
              initialToken: data.initialToken,
              mentorPhoto: callerPhoto,
            });
          } else if (pressActionId === "reject") {
            console.log("[Foreground Event] User clicked Reject");
            if (detail.notification?.id) {
              try {
                await notifee.cancelNotification(detail.notification.id);
              } catch (e) {
                console.error(e);
              }
            }
            try {
              await api.post(CallEndpoints.reject(callId as string));
            } catch (e) {
              console.error(e);
            }
          } else if (pressActionId === "end_call") {
            console.log("[Foreground Event] User clicked End Call");
            if (detail.notification?.id) {
              try {
                await notifee.cancelNotification(detail.notification.id);
              } catch (e) {
                console.error(e);
              }
            }
            DeviceEventEmitter.emit("end_active_call");
          }
        }
      },
    );

    // Foreground FCM handler: show a notifee heads-up notification when a chat
    // message arrives while the app is open (FCM suppresses its own UI in foreground).
    const messaging = getMessaging();
    const unsubscribeFcmForeground = onMessage(
      messaging,
      async (remoteMessage) => {
        console.log(remoteMessage);
        if (remoteMessage.data?.type === "chat") {
          const { sessionId, senderId, senderName, title, body } =
            remoteMessage.data as any;
          // Don't show a notification if the user is already viewing this chat
          if (getActiveChatSessionId() === sessionId) return;
          await notifee.displayNotification({
            id: `chat_${sessionId}_${Date.now()}`,
            title: title || senderName || "New Message",
            body: body || "You have a new message",
            data: { type: "chat", sessionId, senderId, senderName },
            android: {
              channelId: "messages",
              importance: AndroidImportance.HIGH,
              smallIcon: "notification_icon",
              color: "#0077CB",
              pressAction: { id: "default", launchActivity: "default" },
              asForegroundService: false,
            },
          });
        } else if (remoteMessage.data?.type === "question_answered") {
          const { questionId, title, body } = remoteMessage.data as any;
          await notifee.displayNotification({
            id: `qa_${questionId}_${Date.now()}`,
            title: title || "New Answer! 💡",
            body: body || "Someone answered your question.",
            data: { type: "question_answered", questionId },
            android: {
              channelId: "messages",
              importance: AndroidImportance.HIGH,
              smallIcon: "notification_icon",
              color: "#0077CB",
              pressAction: { id: "default", launchActivity: "default" },
              asForegroundService: false,
            },
          });
        } else if (remoteMessage.data?.type === "incoming_call_v2") {
          const { callId, channelName, callerName, callerPhoto } = remoteMessage.data as any;
          navigate(Routes.incomingCall, { callId, channelName, callerName, callerPhoto });
        } else if (remoteMessage.data?.source === "admin-dashboard") {
          // Mirrors index.js: skip if the OS already owns the display.
          if (remoteMessage.notification) return;
          const { title, body, priority, actionType, actionTarget } = remoteMessage.data as any;
          await notifee.displayNotification({
            id: `admin-dash_${remoteMessage.messageId || Date.now()}`,
            title: title || "Admin Notification",
            body: body || "Notification",
            data: {source: "admin-dashboard", actionType, actionTarget},
            android: {
              channelId: priority === "high" ? "messages" : QUIET_CHANNEL,
              smallIcon: "notification_icon",
              color: "#0077CB",
              pressAction: {id: "default", launchActivity: "default" }
            }
          })
        } else if (remoteMessage.data?.type === "call_status_changed") {
          const { callId, status } = remoteMessage.data as any;
          if (status === 'rejected' || status === 'missed' || status === 'completed' || status === 'cancelled') {
            await notifee.cancelNotification(callId);
          }
          DeviceEventEmitter.emit("call_status_changed_fcm", { callId, status });
        } else if (remoteMessage.data?.type === "call_cancelled") {
          const { callId } = remoteMessage.data as any;
          await notifee.cancelNotification(callId);
          DeviceEventEmitter.emit("call_status_changed_fcm", { callId, status: 'cancelled' });
        }
      },
    );

    // 3. Cold start - app opened from killed state
    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();

      // NOTE: getInitialNotification() returns { notification, pressAction } at
      // the TOP level — pressAction is NOT nested inside notification. Verify
      // this on a real device with the console.log below if routing misbehaves.
      console.log(
        "[checkInitialNotification] raw result:",
        JSON.stringify(initialNotification, null, 2),
      );

      const data = initialNotification?.notification?.data || {};
      // pressAction lives at the top level of the result, NOT inside notification.data
      const pressActionId: string | undefined =
        (initialNotification as any)?.pressAction?.id;

      const {
        callId,
        channelName,
        callerName,
        callerPhoto,
        type: notificationType,
        sessionId,
        senderId,
        senderName,
        questionId,
      } = data;

      if (callId) {
        if (pressActionId === "accept") {
          // User tapped the Accept action button from killed state.
          // Skip IncomingCall and go straight to InCall.
          console.log("[checkInitialNotification] Accept action → navigating to InCall");
          navigate(Routes.inCall, {
            callId,
            channelName,
            callerName,
            role: "callee",
            mentorPhoto: callerPhoto,
          });
        } else if (pressActionId === "reject") {
          // User tapped Reject from killed state.
          // onBackgroundEvent will have already called the reject API and
          // cancelled the notification in most cases, but the app was still
          // launched (launchActivity is absent on reject, so this branch is
          // unlikely — kept as a safety net).
          console.log("[checkInitialNotification] Reject action → no navigation");
          // Do NOT navigate anywhere.
        } else {
          // pressActionId === 'default' (body tap) OR undefined (edge case).
          // Navigate to IncomingCall so the user can accept/reject from the screen.
          console.log(
            "[checkInitialNotification] Default/body tap (pressActionId=%s) → navigating to IncomingCall",
            pressActionId,
          );
          navigate(Routes.incomingCall, {
            callId,
            channelName,
            callerName,
            callerPhoto,
          });
        }
      } else if (notificationType === "chat" || sessionId) {
        navigate(Routes.chatPage, {
          partnerId: senderId,
          partnerName: senderName,
          sessionId: sessionId,
        });
      } else if (data.source === "admin-dashboard") {
        const { actionType, actionTarget } = data;
        if (actionType === "EXTERNAL_URL" && actionTarget) {
          Linking.openURL(actionTarget as string).catch(err => console.error("Failed to open URL:", err));
        } else if (actionType === "IN_APP" && actionTarget) {
          navigate(actionTarget as any);
        }
      } else if (notificationType === "question_answered" || questionId) {
        navigate(Routes.questionDetail, { questionId: questionId });
      }

      // AsyncStorage pendingCallData is still needed for the warm-start /
      // backgrounded-but-not-killed case (AppState 'active' listener below).
      // When the app is backgrounded (not killed), onBackgroundEvent fires and
      // writes pendingCallData. The app then resumes and handleAppStateChange
      // picks it up. getInitialNotification() returns null in that scenario, so
      // we still need this roundtrip for that path.
      // Do NOT check pendingCallData here in addition to getInitialNotification —
      // both can fire on a cold-start 'accept', causing a double-navigate to
      // InCall. The onBackgroundEvent for 'accept' writes pendingCallData only
      // when the app is in the background/killed; on cold-start, getInitialNotification
      // already handles it, so we skip the AsyncStorage check here.
    };
    checkInitialNotification();

    // 3.5 AppState change handler for warm start calls
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === "active") {
        const pendingCallData = await storage.getItem("pendingCallData");
        if (pendingCallData) {
          await storage.removeItem("pendingCallData");
          const { callId, channelName, callerName, callerPhoto } =
            JSON.parse(pendingCallData);
          console.log("[AppState] Resuming with pending call:", callId);
          navigate(Routes.inCall, {
            callId,
            channelName,
            callerName,
            role: "callee",
            mentorPhoto: callerPhoto,
          });
          return;
        }

        const displayed = await notifee.getDisplayedNotifications();
        const callNotif = displayed.find(n => n.notification.data?.type === 'incoming_call_v2' || !!n.notification.data?.callId);

        if (callNotif && callNotif.notification.data?.callId) {
          console.log("[AppState] Found active call notification, opening IncomingCall screen");
          const { callId, channelName, callerName, callerPhoto } = callNotif.notification.data as any;
          navigate(Routes.incomingCall, {
            callId,
            channelName,
            callerName,
            callerPhoto,
          });
        }
      }
    };
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    // 4. Socket handler - wait for connection
    const setupSocketHandler = async () => {
      const waitForSocket = () =>
        new Promise<void>((resolve) => {
          if (socketManager.isConnected()) return resolve();
          let attempts = 0;
          const check = setInterval(() => {
            attempts++;
            if (socketManager.isConnected() || attempts > 25) {
              clearInterval(check);
              resolve();
            }
          }, 200);
        });

      await waitForSocket();

      const socketHandler = (data: any) => {
        if (AppState.currentState === "active") {
          const { callId, channelName, callerName, callerPhoto } = data;
          console.log("[Socket] Incoming call received in foreground:", callId);
          navigate(Routes.incomingCall, {
            callId,
            channelName,
            callerName,
            callerPhoto,
          });
        } else {
          console.log("[Socket] App background - FCM will handle");
        }
      };

      // Global handler to cancel notification when call ends (for foreground app with notification in shade)
      const globalStatusHandler = (data: any) => {
        if (
          data.status === "completed" ||
          data.status === "rejected" ||
          data.status === "missed"
        ) {
          console.log(
            "[Socket] Global: Call ended, cancelling notification:",
            data.callId,
          );
          notifee
            .cancelNotification(data.callId)
            .catch((err) =>
              console.error("Failed to cancel notification:", err),
            );
        }
      };

      socketManager.on("incoming_call_v2", socketHandler);
      socketManager.on("call_status_changed", globalStatusHandler);
      return () => {
        socketManager.off("incoming_call_v2", socketHandler);
        socketManager.off("call_status_changed", globalStatusHandler);
      };
    };

    let socketCleanup: (() => void) | undefined;
    setupSocketHandler().then((cleanup) => {
      socketCleanup = cleanup;
    });

    return () => {
      unsubscribeForeground();
      unsubscribeFcmForeground();
      appStateSubscription.remove();
      if (socketCleanup) socketCleanup();
    };
  }, [isSignedIn]);
}
