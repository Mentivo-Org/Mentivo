import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

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
