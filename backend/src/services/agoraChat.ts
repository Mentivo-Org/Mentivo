import axios from 'axios';
import { agoraChatBaseUrl } from '../config/agoraChat.ts';
import { generateChatAppToken } from './chat/tokenGenerator.ts';

class AgoraChatRestService {
  private async getHeaders() {
    const token = await generateChatAppToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async registerUser(userId: string, nickname: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${agoraChatBaseUrl}/users`,
        {
          username: userId,
          password: userId, // Simplification for internal use
          nickname: nickname,
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.error === 'duplicate_unique_property_exists') {
        // User is already registered on Agora, which is expected on subsequent logins/reloads
        throw error;
      }
      console.error('Agora registerUser error:', errorData || error.message);
      throw error;
    }
  }

  async sendMessage(from: string, to: string, content: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${agoraChatBaseUrl}/messages/users`,
        {
          from: from,
          to: [to],
          type: 'txt',
          body: {
            msg: content,
          },
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Agora sendMessage error:', error.response?.data || error.message);
      throw error;
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${agoraChatBaseUrl}/users/${userId}/status`,
        { headers }
      );
      return response.data?.data?.[userId] === 'online';
    } catch (error: any) {
      console.error('Agora isUserOnline error:', error.response?.data || error.message);
      return false;
    }
  }

  async fetchHistoryMessages(chatSessionId: string, timestamp?: number) {
    // Agora Chat doesn't have a direct "fetch by session ID" REST API easily.
    // Usually, we store history in our DB.
    // But Agora allows downloading message logs via REST.
    // For now, we rely on our DB for history.
    return [];
  }
}

export const agoraChatRestService = new AgoraChatRestService();
