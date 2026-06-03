import pkg from 'agora-token';
import jwt from 'jsonwebtoken';
const { RtcTokenBuilder, RtcRole } = pkg;

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';
const AGORA_SECRET_TOKEN_GENERATOR = process.env.AGORA_SECRET_TOKEN_GENERATOR;

export function generateChannelName(studentId: string, mentorId: string): string | null {
  if (!AGORA_SECRET_TOKEN_GENERATOR) {
    console.warn("AGORA_SECRET_TOKEN_GENERATOR is missing. Cannot generate expected channel name.");
    return null;
  }
  // Standardized channel name generation as defined in agoraTokenGenerator.ts
  return jwt.sign({ student_id: studentId, mentor_id: mentorId }, AGORA_SECRET_TOKEN_GENERATOR);
}

export function generateToken(channelName: string, uid: number | string, expirationSeconds: number = 3600): string {
  if (!APP_ID || !APP_CERTIFICATE) {
    console.warn("Agora App ID or Certificate is missing. Token generation will fail or produce invalid tokens.");
  }
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationSeconds;

  // Handle number or string uid
  let token = '';
  if (typeof uid === 'number') {
      token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs,
        privilegeExpiredTs 
      );
  } else {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs,
        privilegeExpiredTs
      );
  }

  return token;
}
