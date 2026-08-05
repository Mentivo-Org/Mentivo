import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter, AppState } from 'react-native';
import { storage } from '../services/storage';
import { joinChannel, leaveChannel, getAgoraEngine, setSpeakerphoneOn } from '../services/agora';
import api from '../services/api';
import { socketManager } from '../services/socketManager';
import { CallEndpoints } from '../constants/endpoint';
import { requestMicrophonePermission } from '../services/permissions';
import { chatSessionManager } from '../services/chat/chatSessionManager';
import notifee, { AndroidImportance, AndroidForegroundServiceType } from '@notifee/react-native';
import { navigate, resetToScreen } from '../services/navigation';
import { Routes } from '../constants/routes';

export type CallStatus = 'connecting' | 'calling' | 'ringing' | 'active' | 'ended';

interface StartCallParams {
  callId: string;
  channelName: string | undefined;
  callerName: string | undefined;
  role: 'caller' | 'callee';
  initialToken: string | undefined;
  mentorPhoto: string | undefined;
  chatSessionId?: string | null;
}

interface CallContextType {
  callId: string | null;
  channelName: string | null;
  callerName: string | null;
  role: 'caller' | 'callee' | null;
  initialToken: string | null;
  mentorPhoto: string | null;
  chatSessionId: string | null;
  partnerId: string | null;
  partnerName: string | null;
  callStatus: CallStatus | null;
  duration: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isMinimized: boolean;
  isConnected: boolean;
  startCallSession: (params: StartCallParams) => Promise<void>;
  endCallSession: (notifyBackend?: boolean, remoteStatus?: string) => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  setMinimized: (minimized: boolean) => void;
  setChatSessionId: (sessionId: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ONGOING_CALL_CHANNEL = 'ongoing_calls';

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callId, setCallId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [callerName, setCallerName] = useState<string | null>(null);
  const [role, setRole] = useState<'caller' | 'callee' | null>(null);
  const [initialToken, setInitialToken] = useState<string | null>(null);
  const [mentorPhoto, setMentorPhoto] = useState<string | null>(null);
  const [chatSessionId, setChatSessionIdState] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFreeCall, setIsFreeCall] = useState<boolean>(false);

  const callStatusRef = useRef<CallStatus | null>(null);
  const durationRef = useRef<number>(0);
  const isEndingCallRef = useRef(false);
  const isStartingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInFlightRef = useRef(false);
  const stateRef = useRef({ callId, role, callerName, mentorPhoto, isFreeCall });

  // Anchors the displayed duration to the server's `startedAt` rather than a local
  // Date.now() taken at Agora join. Without it the two parties disagree, the timer
  // resets to 0 on any rejoin, and the display drifts from the duration billing uses.
  const durationAnchorRef = useRef<{ serverElapsedSecs: number; syncedAtMs: number } | null>(null);
  // Set once the notification chronometer has been re-anchored to server time.
  const notificationResyncedRef = useRef(false);
  // The ongoing-call notification as displayed, so it can be re-issued in place
  // once the server start time is known.
  const ongoingNotificationRef = useRef<any>(null);

  // Sync refs to avoid stale closures in event listeners
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    stateRef.current = { callId, role, callerName, mentorPhoto, isFreeCall };
  }, [callId, role, callerName, mentorPhoto, isFreeCall]);

  // ----- Timer helpers -----
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      const anchor = durationAnchorRef.current;
      if (anchor) {
        setDuration(
          anchor.serverElapsedSecs + Math.floor((Date.now() - anchor.syncedAtMs) / 1000)
        );
      } else {
        // No server anchor yet (slow network, or /start hasn't landed). Keep the
        // old local behaviour so the timer still moves; the first sync corrects it.
        setDuration(prev => prev + 1);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const setDurationAnchor = (serverElapsedSecs: number) => {
    durationAnchorRef.current = { serverElapsedSecs, syncedAtMs: Date.now() };
    setDuration(serverElapsedSecs);
  };

  /**
   * Re-issues the ongoing-call notification with its chronometer anchored to the
   * server elapsed time. Same notification id + `onlyAlertOnce` means this updates
   * in place silently rather than alerting again. Only worth doing once — the
   * chronometer runs off the OS clock from there.
   */
  const refreshOngoingNotificationTimestamp = async (activeCallId: string, elapsedSecs: number) => {
    const payload = ongoingNotificationRef.current;
    if (!payload || payload.id !== activeCallId || notificationResyncedRef.current) return;
    notificationResyncedRef.current = true;
    try {
      await notifee.displayNotification({
        ...payload,
        android: {
          ...payload.android,
          timestamp: Date.now() - elapsedSecs * 1000,
        },
      });
    } catch (e) {
      console.error('Failed to re-anchor ongoing call notification:', e);
    }
  };

  /**
   * Pulls the authoritative call start time from the server and re-anchors the
   * timer. `startedAt` is written by the callee's POST /start, so the caller only
   * gets a real value once the call has flipped to active.
   */
  const syncDurationFromServer = async (activeCallId: string) => {
    try {
      const res = await api.get(CallEndpoints.status(activeCallId));
      const { startedAt, serverNow } = res.data || {};
      if (!startedAt) return;
      const startedMs = new Date(startedAt).getTime();
      const nowMs = serverNow ? new Date(serverNow).getTime() : Date.now();
      const elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
      setDurationAnchor(elapsed);
      refreshOngoingNotificationTimestamp(activeCallId, elapsed);
    } catch (e) {
      console.error('[Timer] Failed to sync duration from server:', e);
    }
  };

  // ----- Heartbeat helpers -----
  const startHeartbeat = (activeCallId: string) => {
    if (heartbeatRef.current) return;
    heartbeatRef.current = setInterval(async () => {
      if (heartbeatInFlightRef.current) {
        console.log('[Heartbeat] Previous heartbeat still in flight, skipping this tick');
        return;
      }
      heartbeatInFlightRef.current = true;
      try {
        const res = await api.patch(CallEndpoints.heartbeat(activeCallId));
        // The heartbeat is the continuous corrector: the 3s status poll stops once
        // the call goes active, so this is the only ongoing source of server time.
        const elapsedSecs = res.data?.elapsedSecs;
        if (typeof elapsedSecs === 'number') {
          setDurationAnchor(elapsedSecs);
          refreshOngoingNotificationTimestamp(activeCallId, elapsedSecs);
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
      } finally {
        heartbeatInFlightRef.current = false;
      }
    }, 10000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    heartbeatInFlightRef.current = false;
  };

  const notifyCallStart = async (activeCallId: string) => {
    try {
      await api.post(CallEndpoints.start(activeCallId));
      // This request is what writes `startedAt` server-side, so the anchor is
      // available immediately after it.
      await syncDurationFromServer(activeCallId);
      startHeartbeat(activeCallId);
    } catch (error) {
      console.error('Failed to notify call start:', error);
    }
  };

  const setChatSessionId = (sessionId: string) => {
    setChatSessionIdState(sessionId);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    getAgoraEngine().muteLocalAudioStream(nextMute);
    setIsMuted(nextMute);
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !isSpeakerOn;
    setSpeakerphoneOn(nextSpeaker);
    setIsSpeakerOn(nextSpeaker);
  };

  const setMinimized = (minimized: boolean) => {
    setIsMinimized(minimized);
  };

  // ----- Agora event listeners -----
  const registerAgoraListeners = (engine: any, activeCallId: string, currentRole: 'caller' | 'callee', currentChannelName: string, currentToken: string, currentCallerName: string, currentMentorPhoto: string | null, resolvedChatSessionId: string | null) => {
    engine.removeAllListeners();
    
    engine.addListener('onJoinChannelSuccess', async (_connection: any, _elapsed: number) => {
      console.log('[Agora Context] Joined channel successfully');
      setIsConnected(true);

      if (resolvedChatSessionId) {
        try {
          await chatSessionManager.linkChatToCall(resolvedChatSessionId, activeCallId);
          console.log('[Agora Context] Linked chat session to call session');
        } catch (e) {
          console.error('Failed to link chat to call:', e);
        }
      }

      const anchoredElapsed = durationAnchorRef.current?.serverElapsedSecs ?? 0;
      const ongoingNotification = {
        id: activeCallId,
        title: 'Call in Progress',
        body: `Connected with ${currentCallerName || 'Mentorship Session'}`,
        android: {
          channelId: ONGOING_CALL_CHANNEL,
          smallIcon: 'notification_icon',
          color: '#0077CB',
          ongoing: true,
          asForegroundService: true,
          foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE],
          onlyAlertOnce: true,
          pressAction: { id: 'default', launchActivity: 'default' },
          actions: [
            {
              title: 'End Call',
              pressAction: {
                id: 'end_call',
                // Bring the app forward so the user lands on their post-call
                // screen (RatingScreen for the caller, Home otherwise) instead of
                // the call silently ending behind a backgrounded app.
                launchActivity: 'default',
              },
            },
          ],
          showChronometer: true,
          // Counts from the true call start when we already know it; corrected in
          // place by refreshOngoingNotificationTimestamp once the server responds.
          timestamp: Date.now() - anchoredElapsed * 1000,
        },
        data: {
          callId: String(activeCallId || ''),
          channelName: String(currentChannelName || ''),
          callerName: String(currentCallerName || ''),
          role: String(currentRole || ''),
          initialToken: String(currentToken || ''),
          mentorPhoto: String(currentMentorPhoto || ''),
          screen: 'InCall'
        },
      };
      ongoingNotificationRef.current = ongoingNotification;

      try {
        await notifee.displayNotification(ongoingNotification as any);
      } catch (e) {
        console.error('Failed to show ongoing call notification:', e);
      }

      if (currentRole === 'callee') {
        setCallStatus('active');
        startTimer();
        notifyCallStart(activeCallId);
      }
    });

    engine.addListener('onUserJoined', (_connection: any, _remoteUid: any, _elapsed: number) => {
      console.log('[Agora Context] Remote user joined');
      setCallStatus('active');
      startTimer();
      syncDurationFromServer(activeCallId);
    });

    engine.addListener('onUserOffline', (_connection: any, _remoteUid: any, _reason: any) => {
      console.log('[Agora Context] Remote user went offline');
      endCallSession(true);
    });

    engine.addListener('onError', (err: any, msg: string) => {
      console.error('[Agora Context] Error:', err, msg);
      endCallSession(true);
    });
  };

  const startCallSession = async (params: StartCallParams) => {
    const { callId: newCallId, channelName: paramChannelName, callerName: paramCallerName, role: newRole, initialToken: paramToken, mentorPhoto: paramPhoto, chatSessionId: paramChatSessionId } = params;
    
    // Reset flags
    isEndingCallRef.current = false;
    
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    
    setCallId(newCallId);
    setRole(newRole);
    setCallerName(paramCallerName || null);
    setMentorPhoto(paramPhoto || null);
    setChatSessionIdState(paramChatSessionId || null);
    setDuration(0);
    durationAnchorRef.current = null;
    notificationResyncedRef.current = false;
    ongoingNotificationRef.current = null;
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsMinimized(false);
    
    const initialStatus = newRole === 'caller' ? 'calling' : 'active';
    setCallStatus(initialStatus);

    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.warn('Microphone permission denied');
        await endCallSession(true);
        return;
      }

      // Verify call status via backend
      let statusRes;
      try {
        statusRes = await api.get(CallEndpoints.status(newCallId));
        if (isEndingCallRef.current) return;

        const currentCallStatus = statusRes.data.status;
        setIsFreeCall(!!statusRes.data.is_free);
        // Rejoining a call that is already running (app relaunched mid-call, or a
        // reconnect): seed the anchor so the timer resumes at the true elapsed
        // time instead of restarting from 0.
        if (statusRes.data.startedAt) {
          const startedMs = new Date(statusRes.data.startedAt).getTime();
          const nowMs = statusRes.data.serverNow
            ? new Date(statusRes.data.serverNow).getTime()
            : Date.now();
          setDurationAnchor(Math.max(0, Math.floor((nowMs - startedMs) / 1000)));
        }
        if (!['calling', 'ringing', 'active'].includes(currentCallStatus)) {
          console.warn('Call is no longer active in status check');
          await endCallSession(false);
          return;
        }
      } catch (e) {
        if (isEndingCallRef.current) return;
        console.error('Failed to verify call status:', e);
        await endCallSession(false);
        return;
      }

      const { chatSessionId: fetchedChatSessionId, student, mentor } = statusRes.data;
      const resolvedChatSessionId = fetchedChatSessionId || paramChatSessionId || null;
      if (resolvedChatSessionId) {
        setChatSessionIdState(resolvedChatSessionId);
      }
      
      let pId = null;
      let pName = null;
      if (newRole === 'caller' && mentor) {
        pId = mentor.id;
        pName = mentor.name;
      } else if (newRole === 'callee' && student) {
        pId = student.id;
        pName = student.name;
      }
      setPartnerId(pId);
      setPartnerName(pName);

      let token = paramToken;
      let chanName = paramChannelName;
      if (newRole === 'callee' && !token) {
        const tokenRes = await api.get(CallEndpoints.token(newCallId));
        if (isEndingCallRef.current) return;
        token = tokenRes.data.token;
        chanName = tokenRes.data.channelName;
      }

      if (!token || !chanName) {
        console.error('Missing token or channel name');
        await endCallSession(true);
        return;
      }

      setInitialToken(token);
      setChannelName(chanName);

      const userJson = await storage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      if (isEndingCallRef.current) return;
      const uid = user?.id || Math.floor(Math.random() * 10000).toString();

      const engine = getAgoraEngine();
      registerAgoraListeners(engine, newCallId, newRole, chanName, token, paramCallerName || 'Mentorship Session', paramPhoto || null, resolvedChatSessionId);
      
      await joinChannel(token, chanName, uid);
    } catch (error) {
      if (isEndingCallRef.current) return;
      console.error('Failed to start call in Context:', error);
      await endCallSession(true);
    } finally {
      isStartingRef.current = false;
    }
  };

  const endCallSession = async (notifyBackend = true, remoteStatus?: string) => {
    if (isEndingCallRef.current) return;
    isEndingCallRef.current = true;

    stopTimer();
    stopHeartbeat();
    leaveChannel();
    DeviceEventEmitter.emit('stop_foreground_service');

    const activeCallId = stateRef.current.callId;
    const activeRole = stateRef.current.role;
    const activeCallerName = stateRef.current.callerName;
    const activePhoto = stateRef.current.mentorPhoto;

    if (activeCallId) {
      try {
        await notifee.cancelNotification(activeCallId);
      } catch (e) {
        console.error('Failed to cancel ongoing notification:', e);
      }
    }

    // A press recorded just before teardown would otherwise route the user into a
    // dead call on the next resume.
    try {
      await storage.multiRemove(['pendingCallData', 'pendingCallNavigation']);
    } catch (e) {
      console.error('Failed to clear pending call markers:', e);
    }

    const currentStatus = callStatusRef.current;
    const currentDuration = durationRef.current;
    const wasConnected = currentStatus === 'active' || currentDuration > 0 || remoteStatus === 'completed';
    let finalStatus = wasConnected ? 'completed' : 'cancelled';

    console.log(`[endCallSession] notifyBackend=${notifyBackend}, role=${activeRole}, status=${currentStatus}, duration=${currentDuration}, wasConnected=${wasConnected}, remoteStatus=${remoteStatus}, finalStatus=${finalStatus}`);

    if (notifyBackend && activeCallId) {
      try {
        const response = await api.post(CallEndpoints.end(activeCallId));
        if (response.data?.status === 'completed') finalStatus = 'completed';
      } catch (error: any) {
        console.log('[endCallSession] Backend /end notification handled:', error.response?.status || error.message);
      }
    }

    // Reset Context State
    setCallId(null);
    setChannelName(null);
    setCallerName(null);
    setRole(null);
    setInitialToken(null);
    setMentorPhoto(null);
    setChatSessionIdState(null);
    setPartnerId(null);
    setPartnerName(null);
    setCallStatus(null);
    setDuration(0);
    durationAnchorRef.current = null;
    notificationResyncedRef.current = false;
    ongoingNotificationRef.current = null;
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsMinimized(false);
    setIsConnected(false);
    setIsFreeCall(false);

    // Navigate accordingly
    if (activeCallId) {
      if (activeRole === 'caller' && finalStatus === 'completed') {
        resetToScreen(Routes.ratingScreen, {
          callId: activeCallId,
          mentorName: activeCallerName || 'Mentor',
          mentorPhoto: activePhoto || undefined,
        });
      } else {
        if (activeRole === 'caller' && remoteStatus === 'missed' && stateRef.current.isFreeCall) {
          resetToScreen(Routes.main, {
            screen: Routes.home,
            params: { showMissedFreeCallAlert: true }
          });
        } else if (activeRole === 'caller' && remoteStatus === 'rejected') {
          resetToScreen(Routes.main, {
            screen: Routes.home,
            params: { showCallRejectedAlert: true }
          });
        } else {
          resetToScreen(Routes.main, { screen: Routes.home });
        }
      }
    }
  };

  // Socket and FCM listeners for call changes
  useEffect(() => {
    const statusHandler = (data: any) => {
      const activeCallId = stateRef.current.callId;
      if (!activeCallId || data.callId !== activeCallId) return;

      if (['completed', 'rejected', 'missed', 'cancelled'].includes(data.status)) {
        console.log(`[Socket/FCM Context] Call ${data.status} remotely`);
        notifee.cancelNotification(activeCallId).catch(err =>
          console.error('Failed to cancel notification:', err)
        );
        endCallSession(false, data.status);
      } else if (data.status === 'ringing' && callStatusRef.current === 'calling') {
        console.log('[Socket/FCM Context] Mentor phone is ringing');
        setCallStatus('ringing');
      } else if (data.status === 'active') {
        if (callStatusRef.current !== 'active') {
          console.log('[Socket/FCM Context] Call is now active');
          setCallStatus('active');
          startTimer();
        }
        // The caller often sees Agora's onUserJoined before the callee's POST /start
        // has written startedAt, so that earlier sync came back empty. This event is
        // emitted by /start itself, so retry here whenever we're still unanchored.
        if (!durationAnchorRef.current) {
          syncDurationFromServer(activeCallId);
        }
      }
    };

    socketManager.on('call_status_changed', statusHandler);
    const fcmSub = DeviceEventEmitter.addListener('call_status_changed_fcm', statusHandler);

    return () => {
      socketManager.off('call_status_changed', statusHandler);
      fcmSub.remove();
    };
  }, [callId]);

  // AppState listener for Foreground Service Health Check
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && stateRef.current.callId) {
        console.log('[AppState Context] App returned to foreground during call');
        const displayed = await notifee.getDisplayedNotifications();
        const notificationExists = displayed.some(n => n.id === stateRef.current.callId);
        if (!notificationExists) {
          console.warn('[AppState Context] Foreground service notification missing! Service might have been killed by Android OS.');
        } else {
          console.log('[AppState Context] Foreground service is still active.');
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Polling mechanism for pre-active states
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const activeCallId = callId;
    
    if (activeCallId && (callStatus === 'calling' || callStatus === 'ringing')) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(CallEndpoints.status(activeCallId));
          const currentStatus = res.data.status;
          
          if (['completed', 'rejected', 'missed', 'cancelled'].includes(currentStatus)) {
            console.log(`[Polling Context] Call ${currentStatus} remotely`);
            endCallSession(false, currentStatus);
          } else if (currentStatus === 'ringing' && callStatusRef.current === 'calling') {
            console.log('[Polling Context] Mentor phone is ringing');
            setCallStatus('ringing');
          } else if (currentStatus === 'active' && callStatusRef.current !== 'active') {
             console.log('[Polling Context] Call is now active');
             setCallStatus('active');
             startTimer();
             // This poll response already carries the anchor — reuse it directly.
             if (res.data?.startedAt) {
               const startedMs = new Date(res.data.startedAt).getTime();
               const nowMs = res.data.serverNow ? new Date(res.data.serverNow).getTime() : Date.now();
               const elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
               setDurationAnchor(elapsed);
               refreshOngoingNotificationTimestamp(activeCallId, elapsed);
             }
          }
        } catch (e) {
          console.error('[Polling Context] Failed to fetch call status:', e);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callId, callStatus]);

  // Listener for End Call action events from notifications
  useEffect(() => {
    const endCallSub = DeviceEventEmitter.addListener('end_active_call', () => {
      console.log('[DeviceEventEmitter Context] Received end_active_call event from notification');
      endCallSession(true);
    });
    return () => {
      endCallSub.remove();
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        callId,
        channelName,
        callerName,
        role,
        initialToken,
        mentorPhoto,
        chatSessionId,
        partnerId,
        partnerName,
        callStatus,
        duration,
        isMuted,
        isSpeakerOn,
        isMinimized,
        isConnected,
        startCallSession,
        endCallSession,
        toggleMute,
        toggleSpeaker,
        setMinimized,
        setChatSessionId,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};
