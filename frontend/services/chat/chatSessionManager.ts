import { ChatEndpoints } from '../../constants/endpoint';
import api from '../api';

class ChatSessionManager {
  async listSessions() {
    try {
      const response = await api.get(ChatEndpoints.getSessions);
      return response.data;
    } catch (error) {
      console.error('listSessions error:', error);
      throw error;
    }
  }

  async createSession(mentorId: string) {
    try {
      const response = await api.post(ChatEndpoints.createSession, { mentorId });
      return response.data;
    } catch (error) {
      console.error('createSession error:', error);
      throw error;
    }
  }

  async getChatToken() {
    try {
      const response = await api.get(ChatEndpoints.getToken);
      return response.data;
    } catch (error) {
      console.error('getChatToken error:', error);
      throw error;
    }
  }

  async getMessages(sessionId: string, limit = 50, cursor?: string) {
    try {
      const response = await api.get(ChatEndpoints.getMessages(sessionId), {
        params: { limit, cursor },
      });
      return response.data;
    } catch (error) {
      console.error('getMessages error:', error);
      throw error;
    }
  }

  async sendMessage(sessionId: string, content: string) {
    try {
      const response = await api.post(ChatEndpoints.getMessages(sessionId), { content }); // It uses the same base path but POST
      return response.data;
    } catch (error) {
      console.error('sendMessage error:', error);
      throw error;
    }
  }

  async blockUser(sessionId: string) {
    try {
      const response = await api.post(`/chat/sessions/${sessionId}/block`);
      return response.data;
    } catch (error) {
      console.error('blockUser error:', error);
      throw error;
    }
  }

  async reportMessage(messageId: string) {
    try {
      const response = await api.post(`/chat/messages/${messageId}/report`);
      return response.data;
    } catch (error) {
      console.error('reportMessage error:', error);
      throw error;
    }
  }

  async markAsRead(sessionId: string) {
    try {
      const response = await api.patch(`/chat/sessions/${sessionId}/read`);
      return response.data;
    } catch (error) {
      console.error('markAsRead error:', error);
      throw error;
    }
  }

  async linkChatToCall(sessionId: string, callSessionId: string) {
    try {
      const response = await api.post(ChatEndpoints.linkCall(sessionId), { callSessionId });
      return response.data;
    } catch (error) {
      console.error('linkChatToCall error:', error);
      throw error;
    }
  }
}

export const chatSessionManager = new ChatSessionManager();
