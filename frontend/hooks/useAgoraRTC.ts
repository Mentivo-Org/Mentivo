import { useRef, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { joinChannel, leaveChannel, getAgoraEngine, setSpeakerphoneOn } from '../services/agora';
import api from '../services/api';
import { socketManager } from '../services/socketManager';
import { CallEndpoints } from '../constants/endpoint';
import { requestMicrophonePermission } from '../services/permissions';
import { chatSessionManager } from '../services/chat/chatSessionManager';
import notifee from '@notifee/react-native';

export type CallStatus = 'calling' | 'ringing' | 'active';

interface UseAgoraRTCOptions {
  callId: string;
  channelName: string | undefined;
  role: 'caller' | 'callee';
  initialToken: string | undefined;
  callerName: string | undefined;
  mentorPhoto: string | undefined;
  initialChatSessionId: string | undefined;
  onCallEnded: (finalStatus: string, remoteStatus?: string) => void;
  onPartnerResolved: (partnerId: string, partnerName: string) => void;
  onChatSessionResolved: (sessionId: string) => void;
  onNavigateHome: () => void;
  onShowAlert?: (title: string, message: string, onClose?: () => void) => void;
}

export function useAgoraRTC({
  callId,
  channelName: initialChannelName,
  role,
  initialToken,
  callerName,
  mentorPhoto,
  initialChatSessionId,
  onCallEnded,
  onPartnerResolved,
  onChatSessionResolved,
  onNavigateHome,
  onShowAlert,
}: UseAgoraRTCOptions) {
  const [callStatus, setCallStatus] = useState<CallStatus>(role === 'caller' ? 'calling' : 'active');
  const [duration, setDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const callStatusRef = useRef<CallStatus>(callStatus);
  const isEndingCallRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  // Keep a ref to the current handleEndCall to avoid stale closures in Agora listeners
  const handleEndCallRef = useRef<((notifyBackend?: boolean, remoteStatus?: string) => void) | undefined>(undefined);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // ----- Timer helpers -----
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ----- Heartbeat helpers -----
  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(async () => {
      try {
        await api.patch(CallEndpoints.heartbeat(callId));
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 10000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  // ----- Notifee call-start notification -----
  const notifyCallStart = async () => {
    try {
      await api.post(CallEndpoints.start(callId));
      startHeartbeat();
    } catch (error) {
      console.error('Failed to notify call start:', error);
    }
  };

  // ----- Agora event listeners -----
  const registerAgoraListeners = (engine: any, activeChatSessionId: string | null, statusResData: any, token: string | undefined, channelName: string | undefined) => {
    engine.addListener('onJoinChannelSuccess', async (_connection: any, _elapsed: number) => {
      console.log('[Agora] Joined channel successfully');
      setIsConnected(true);

      const sessionToLink = activeChatSessionId || statusResData?.chatSessionId;
      if (sessionToLink) {
        try {
          await chatSessionManager.linkChatToCall(sessionToLink, callId);
          console.log('[InCall] Linked chat session to call session');
        } catch (e) {
          console.error('Failed to link chat to call:', e);
        }
      }

      try {
        await notifee.displayNotification({
          title: 'Call in Progress',
          body: `Connected with ${callerName || 'Mentorship Session'}`,
          android: {
            channelId: 'ongoing_calls',
            ongoing: true,
            onlyAlertOnce: true,
            pressAction: { id: 'default', launchActivity: 'default' },
            actions: [
              {
                title: 'End Call',
                pressAction: {
                  id: 'end_call',
                },
              },
            ],
            showChronometer: true,
            timestamp: Date.now(),
          },
          data: { 
            callId, 
            channelName, 
            callerName, 
            role, 
            initialToken: token, 
            mentorPhoto, 
            screen: 'InCall' 
          },
        });
      } catch (e) {
        console.error('Failed to show ongoing call notification:', e);
      }

      if (role === 'callee') {
        setCallStatus('active');
        startTimer();
        notifyCallStart();
      }
    });

    engine.addListener('onUserJoined', (_connection: any, _remoteUid: any, _elapsed: number) => {
      console.log('[Agora] Remote user joined');
      setCallStatus('active');
      if (!timerRef.current) startTimer();
    });

    engine.addListener('onUserOffline', (_connection: any, _remoteUid: any, _reason: any) => {
      console.log('[Agora] Remote user went offline');
      handleEndCallRef.current?.(true);
    });

    engine.addListener('onError', (err: any, msg: string) => {
      console.error('[Agora] Error:', err, msg);
      onShowAlert?.('Call Error', 'An error occurred during the call.');
      handleEndCallRef.current?.(true);
    });
  };

  // ----- Socket status handler -----
  useEffect(() => {
    const statusHandler = (data: any) => {
      if (data.callId !== callId) return;

      if (['completed', 'rejected', 'missed'].includes(data.status)) {
        console.log(`[Socket] Call ${data.status} remotely`);
        notifee.cancelNotification(callId).catch(err =>
          console.error('Failed to cancel notification:', err)
        );
        handleEndCallRef.current?.(false, data.status);
      } else if (data.status === 'ringing' && callStatusRef.current === 'calling') {
        console.log('[Socket] Mentor phone is ringing');
        setCallStatus('ringing');
      } else if (data.status === 'active' && callStatusRef.current !== 'active') {
        console.log('[Socket] Call is now active');
        setCallStatus('active');
        if (!timerRef.current) startTimer();
      }
    };

    socketManager.on('call_status_changed', statusHandler);

    // ----- Main call setup -----
    const startCall = async () => {
      try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          onShowAlert?.('Permission Denied', 'Microphone access is required for voice calls. Please enable it in your device settings.');
          handleEndCallRef.current?.(true);
          return;
        }

        // Verify the call is still in a valid state
        let statusRes;
        try {
          statusRes = await api.get(CallEndpoints.status(callId));
          if (isEndingCallRef.current) return;

          const currentCallStatus = statusRes.data.status;
          if (!['calling', 'ringing', 'active'].includes(currentCallStatus)) {
            onShowAlert?.('Call Ended', 'This call is no longer active.', onNavigateHome);
            return;
          }
        } catch (e) {
          if (isEndingCallRef.current) return;
          console.error('Failed to verify call status:', e);
          onShowAlert?.('Error', 'Could not verify call status.', onNavigateHome);
          return;
        }

        // Resolve partner identity and chatSessionId from status response
        const { chatSessionId: fetchedChatSessionId, student, mentor } = statusRes.data;
        if (fetchedChatSessionId) {
          onChatSessionResolved(fetchedChatSessionId);
        }
        if (role === 'caller' && mentor) {
          onPartnerResolved(mentor.id, mentor.name);
        } else if (role === 'callee' && student) {
          onPartnerResolved(student.id, student.name);
        }

        // Fetch token for callee if not provided
        let token = initialToken;
        let channelName = initialChannelName;
        if (role === 'callee' && !token) {
          const tokenRes = await api.get(CallEndpoints.token(callId));
          if (isEndingCallRef.current) return;
          token = tokenRes.data.token;
          channelName = tokenRes.data.channelName;
        }

        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        if (isEndingCallRef.current) return;
        const uid = user?.id || Math.floor(Math.random() * 10000).toString();

        const engine = getAgoraEngine();
        const activeChatSessionId = initialChatSessionId || statusRes.data?.chatSessionId;
        registerAgoraListeners(engine, activeChatSessionId, statusRes.data, token, channelName);

        await joinChannel(token, channelName, uid);
      } catch (error) {
        if (isEndingCallRef.current) return;
        console.error('Failed to start call:', error);
        onShowAlert?.('Error', 'Failed to join the call.', onNavigateHome);
      }
    };

    startCall();

    return () => {
      stopTimer();
      stopHeartbeat();
      leaveChannel();
      socketManager.off('call_status_changed', statusHandler);
    };
  }, [callId]);

  // ----- End call logic -----
  const handleEndCall = async (notifyBackend = true, remoteStatus?: string) => {
    if (isEndingCallRef.current) {
      console.log('[handleEndCall] Already in progress, ignoring duplicate call');
      return;
    }
    isEndingCallRef.current = true;

    stopTimer();
    stopHeartbeat();
    leaveChannel();

    try {
      await notifee.cancelNotification(callId);
    } catch (e) {
      console.error('Failed to cancel ongoing notification:', e);
    }

    const currentStatus = callStatusRef.current;
    const wasConnected = currentStatus === 'active' || duration > 0 || remoteStatus === 'completed';
    let finalStatus = wasConnected ? 'completed' : 'cancelled';

    console.log(`[handleEndCall] notifyBackend=${notifyBackend}, role=${role}, currentStatus=${currentStatus}, duration=${duration}, wasConnected=${wasConnected}, remoteStatus=${remoteStatus}, finalStatus=${finalStatus}`);

    if (notifyBackend) {
      try {
        const response = await api.post(CallEndpoints.end(callId));
        if (response.data?.status === 'completed') finalStatus = 'completed';
      } catch (error: any) {
        console.log('[handleEndCall] Backend /end notification handled:', error.response?.status || error.message);
      }
    }

    onCallEnded(finalStatus, remoteStatus);
  };

  // Keep the ref in sync so Agora listeners always call the latest closure
  useEffect(() => {
    handleEndCallRef.current = handleEndCall;
  });

  // Listen for End Call action events from notifications
  useEffect(() => {
    const endCallSub = DeviceEventEmitter.addListener('end_active_call', () => {
      console.log('[DeviceEventEmitter] Received end_active_call event from notification');
      handleEndCallRef.current?.(true);
    });
    return () => {
      endCallSub.remove();
    };
  }, []);

  // ----- Audio controls -----
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

  return {
    callStatus,
    duration,
    isConnected,
    isMuted,
    isSpeakerOn,
    handleEndCall,
    toggleMute,
    toggleSpeaker,
  };
}
