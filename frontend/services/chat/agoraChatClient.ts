import { ChatClient, ChatOptions } from 'react-native-agora-chat';
import { AGORA_CHAT_APP_KEY } from '../../constants/endpoint';

class AgoraChatService {
  private static instance: AgoraChatService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AgoraChatService {
    if (!AgoraChatService.instance) {
      AgoraChatService.instance = new AgoraChatService();
    }
    return AgoraChatService.instance;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await ChatClient.getInstance().init(
        new ChatOptions({
          appKey: AGORA_CHAT_APP_KEY.includes('#') ? AGORA_CHAT_APP_KEY : '',
          autoLogin: false,
          debugModel: true,
        })
      );
      this.isInitialized = true;
      console.log('Agora Chat SDK Initialized');
    } catch (e) {
      console.error('Agora Chat Init Error:', e);
    }
  }

  async login(userId: string, token: string) {
    if (!userId || !token) {
      console.warn('Agora Chat login skipped: userId or token missing');
      return;
    }

    if (!this.isInitialized) {
      await this.init();
    }
    
    try {
      await ChatClient.getInstance().loginWithAgoraToken(userId, token);
      console.log('Agora Chat Login Success');
    } catch (e: any) {
      const isAlreadyLoggedIn = 
        (e && e.code === 200) || 
        (e && typeof e.description === 'string' && e.description.toLowerCase().includes('already logged in')) ||
        (e && typeof e.message === 'string' && e.message.toLowerCase().includes('already logged in')) ||
        (typeof e === 'string' && e.toLowerCase().includes('already logged in'));

      if (isAlreadyLoggedIn) {
        console.log('[Agora Chat] Previous session detected (already logged in). Logging out first...');
        try {
          await ChatClient.getInstance().logout();
          console.log('[Agora Chat] Logged out previous session. Retrying login...');
          await ChatClient.getInstance().loginWithAgoraToken(userId, token);
          console.log('[Agora Chat] Agora Chat Login Success after retry');
          return;
        } catch (retryError) {
          console.error('[Agora Chat] Retry login failed:', retryError);
          throw retryError;
        }
      }

      console.error('Agora Chat Login Error:', e);
      throw e;
    }
  }

  async logout() {
    try {
      await ChatClient.getInstance().logout();
      console.log('Agora Chat Logout Success');
    } catch (e) {
      console.error('Agora Chat Logout Error:', e);
    }
  }

  addMessageListener(listener: any) {
    if (this.isInitialized) {
      ChatClient.getInstance().chatManager.addMessageListener(listener);
    } else {
      console.warn('Agora Chat not initialized, listener not added');
    }
  }

  removeMessageListener(listener: any) {
    if (this.isInitialized) {
      ChatClient.getInstance().chatManager.removeMessageListener(listener);
    }
  }
}

export const agoraChatService = AgoraChatService.getInstance();
