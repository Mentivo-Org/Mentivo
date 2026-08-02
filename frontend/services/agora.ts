import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
} from 'react-native-agora';
import InCallManager from 'react-native-incall-manager';
import { AGORA_APP_ID } from '../constants/endpoint';

let engine: IRtcEngine | null = null;

const initAgoraEngine = () => {
  if (engine) return engine;

  engine = createAgoraRtcEngine();
  engine.initialize({ appId: AGORA_APP_ID });
  engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
  engine.enableAudio();

  return engine;
};

export const getAgoraEngine = () => {
  if (!engine) {
    return initAgoraEngine();
  }
  return engine;
};

export const joinChannel = async (token: string, channelName: string, uid: number | string) => {
  const rtcEngine = getAgoraEngine();
  
  // Start InCallManager for audio session management
  InCallManager.start({ media: 'audio' });
  
  const options = {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    autoSubscribeAudio: true,
  };

  if (typeof uid === 'number') {
    return rtcEngine.joinChannel(token, channelName, uid, options);
  } else {
    return rtcEngine.joinChannelWithUserAccount(token, channelName, uid, options);
  }
};

export const leaveChannel = () => {
  if (engine) {
    engine.removeAllListeners();
    engine.leaveChannel();
    InCallManager.stop();
  }
};

const releaseAgoraEngine = () => {
  if (engine) {
    engine.release();
    engine = null;
  }
};

export const setSpeakerphoneOn = (isOn: boolean) => {
  InCallManager.setSpeakerphoneOn(isOn);
};
