import type { Request, Response } from 'express';
import prisma from '../config/db.ts';
import axios from 'axios';
// We'll use local token generation logic or assume a service exists
import agoraToken from 'agora-token'
const { ChatTokenBuilder } = agoraToken;

const getAgoraHeaders = async () => {
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  const token = ChatTokenBuilder.buildAppToken(appId, appCertificate, 3600);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const getAgoraBaseUrl = () => {
  const restUrl = process.env.AGORA_CHAT_REST_URL || 'https://a41.chat.agora.io';
  const orgName = process.env.AGORA_CHAT_ORG_NAME!;
  const appName = process.env.AGORA_CHAT_APP_NAME!;
  return `${restUrl}/${orgName}/${appName}`;
};

export const getFlaggedMessages = async (req: Request, res: Response) => {
// ... rest of file
  const { limit = 50, offset = 0 } = req.query;
  
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { status: 'blocked' },
        { 
          validationResult: {
            path: ['isValid'],
            equals: false
          }
        }
      ]
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      chatSession: {
        include: {
          student: { select: { name: true } },
          mentor: { select: { name: true } }
        }
      }
    },
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: 'desc' }
  });

  res.json(messages);
};

export const getModerationStats = async (req: Request, res: Response) => {
  const totalMessages = await prisma.chatMessage.count();
  const blockedMessages = await prisma.chatMessage.count({ where: { status: 'blocked' } });
  
  // Group by rule type if possible (might need a more complex query or post-processing)
  const messages = await prisma.chatMessage.findMany({
    where: { status: 'blocked' },
    select: { validationResult: true }
  });

  const ruleStats: Record<string, number> = {};
  messages.forEach(msg => {
    const result = msg.validationResult as any;
    result?.violations?.forEach((v: any) => {
      ruleStats[v.ruleType] = (ruleStats[v.ruleType] || 0) + 1;
    });
  });

  res.json({
    totalMessages,
    blockedMessages,
    ruleStats,
    blockRate: totalMessages > 0 ? (blockedMessages / totalMessages) * 100 : 0
  });
};

export const getValidationRules = async (req: Request, res: Response) => {
  const rules = await prisma.chatValidationRule.findMany();
  res.json(rules);
};

export const createValidationRule = async (req: Request, res: Response) => {
  const { name, ruleType, pattern, config, action, isActive } = req.body;
  
  const rule = await prisma.chatValidationRule.create({
    data: { name, ruleType, pattern, config, action, isActive }
  });
  
  res.json(rule);
};

export const updateValidationRule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  
  const rule = await prisma.chatValidationRule.update({
    where: { id },
    data
  });
  
  res.json(rule);
};

export const getAgoraSensitiveWords = async (req: Request, res: Response) => {
  try {
    const headers = await getAgoraHeaders();
    const response = await axios.get(`${getAgoraBaseUrl()}/moderation/sensitive_words`, { headers });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

export const addAgoraSensitiveWords = async (req: Request, res: Response) => {
  try {
    const { words } = req.body;
    const headers = await getAgoraHeaders();
    const response = await axios.post(`${getAgoraBaseUrl()}/moderation/sensitive_words`, { words }, { headers });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
};
