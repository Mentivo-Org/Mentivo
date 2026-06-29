import prisma from "../../config/db.ts";
import type { Prisma } from "@prisma/client";
// const { Prisma } = prismaClient;
class ChatMessageService {
  async create(data: {
    agoraMsgId: string;
    chatSessionId: string;
    senderId: string;
    content: string;
    msgType?: string;
    status?: string;
    validationResult?: any;
  }) {
    return await prisma.chatMessage.create({
      data: {
        agoraMsgId: data.agoraMsgId,
        chatSessionId: data.chatSessionId,
        senderId: data.senderId,
        content: data.content,
        msgType: data.msgType || 'text',
        status: data.status || 'sent',
        validationResult: data.validationResult as Prisma.InputJsonValue,
        validatedAt: new Date(),
      },
    });
  }

  async getSessionMessages(chatSessionId: string, limit = 50, cursor?: string) {
    return await prisma.chatMessage.findMany({
      where: { chatSessionId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(agoraMsgId: string, status: string) {
    return await prisma.chatMessage.update({
      where: { agoraMsgId },
      data: { status },
    });
  }

  async markSessionAsRead(chatSessionId: string, userId: string) {
    return await prisma.chatMessage.updateMany({
      where: {
        chatSessionId,
        senderId: { not: userId },
        status: { in: ['sent', 'delivered'] }
      },
      data: { status: 'read' },
    });
  }

  async reportMessage(messageId: string) {
    // Assuming messageId is the db id or agoraMsgId. Let's use id.
    return await prisma.chatMessage.update({
      where: { id: messageId },
      data: { status: 'reported' } // using reported status or just update validationResult
    }).catch(async () => {
      return await prisma.chatMessage.update({
        where: { agoraMsgId: messageId },
        data: { status: 'reported' }
      });
    });
  }
}

export const chatMessageService = new ChatMessageService();
