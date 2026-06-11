import agoraToken from 'agora-token'
const { ChatTokenBuilder } = agoraToken;
import { agoraChatConfig } from '../../config/agoraChat.ts';

const expirationInSeconds = 3600 * 24; // 24 hours

export function generateChatUserToken(userId: string): string {
  const token = ChatTokenBuilder.buildUserToken(
    agoraChatConfig.appId,
    agoraChatConfig.appCertificate,
    userId,
    expirationInSeconds
  );
  return token;
}

export function generateChatAppToken(): string {
  const token = ChatTokenBuilder.buildAppToken(
    agoraChatConfig.appId,
    agoraChatConfig.appCertificate,
    expirationInSeconds
  );
  return token;
}
