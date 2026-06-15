import prisma from "../../config/db.ts";

class ChatSessionService {
  async getOrCreateSession(studentId: string, mentorId: string, agoraConvId: string) {
    // Verify student is actually a student and mentor is actually a mentor
    const [student, mentor] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId } }),
      prisma.user.findUnique({ where: { id: mentorId } }),
    ]);

    if (!student || student.role !== 'student') {
      throw new Error('Only students can initiate a chat session');
    }

    if (!mentor || mentor.role !== 'mentor') {
      throw new Error('Chat sessions must be initiated with a mentor');
    }

    return await prisma.chatSession.upsert({
      where: {
        studentId_mentorId: {
          studentId,
          mentorId,
        },
      },
      update: {},
      create: {
        studentId,
        mentorId,
        agoraConvId,
      },
    });
  }

  async findByParticipants(user1: string, user2: string) {
    return await prisma.chatSession.findFirst({
      where: {
        OR: [
          { studentId: user1, mentorId: user2 },
          { studentId: user2, mentorId: user1 },
        ],
      },
    });
  }

  async getById(id: string) {
    return await prisma.chatSession.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, photo_url: true, grade: true } },
        mentor: { select: { id: true, name: true, photo_url: true } },
      },
    });
  }

  async getUserSessions(userId: string) {
    const sessions = await prisma.chatSession.findMany({
      where: {
        OR: [
          { studentId: userId },
          { mentorId: userId },
        ],
      },
      include: {
        student: { select: { id: true, name: true, photo_url: true, grade: true } },
        mentor: { select: { id: true, name: true, photo_url: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Attach accurate per-user unread count: messages sent by the OTHER person
    // that the current user has not yet read.
    const withUnread = await Promise.all(
      sessions.map(async (session) => {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            chatSessionId: session.id,
            senderId: { not: userId },
            status: { in: ['sent', 'delivered'] },
          },
        });
        return { ...session, messageCount: unreadCount };
      })
    );

    return withUnread;
  }

  async updateLastMessage(id: string, senderId: string) {
    // Just update the timestamp; unread count is now computed live in getUserSessions.
    return await prisma.chatSession.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
  }

  async updateStatus(id: string, status: string) {
    return await prisma.chatSession.update({
      where: { id },
      data: { status },
    });
  }

  async linkToCall(chatSessionId: string, callSessionId: string) {
    return await prisma.chatSession.update({
      where: { id: chatSessionId },
      data: {
        callSessionId,
        isInCallChat: true,
      },
    });
  }
}

export const chatSessionService = new ChatSessionService();
