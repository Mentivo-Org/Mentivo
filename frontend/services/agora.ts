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
  
  console.log('[Agora] Enabling audio and configuring options...');
  rtcEngine.enableAudio();
  rtcEngine.enableLocalAudio(true);
  
  const options = {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    autoSubscribeAudio: true,
  };
  
  console.log('[Agora] Joining channel with options:', options);

  if (typeof uid === 'number') {
    return rtcEngine.joinChannel(token, channelName, uid, options);
  } else {
    return rtcEngine.joinChannelWithUserAccount(token, channelName, uid, options);
  }
};

export const leaveChannel = () => {
  if (engine) {
    engine.leaveChannel();
  }
};

const releaseAgoraEngine = () => {
  if (engine) {
    engine.release();
    engine = null;
  }
};

export const setSpeakerphoneOn = (isOn: boolean) => {
  if (engine) {
    console.log(`[Agora] Setting speakerphone to: ${isOn}`);
    engine.setEnableSpeakerphone(isOn);
  }
};
