import type { Request, Response } from 'express';
import prisma from '../config/db.ts';


export const getReportedMessages = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { status: 'reported' },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
        chatSession: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveReportedMessage = async (req: Request, res: Response) => {
  const messageId = req.params.messageId as string;
  const { action } = req.body; // 'allow', 'block'
  try {
    const status = action === 'allow' ? 'sent' : 'blocked';
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { status }
    });
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getValidationRules = async (req: Request, res: Response) => {
  try {
    const rules = await prisma.chatValidationRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateValidationRule = async (req: Request, res: Response) => {
  const ruleId = req.params.ruleId as string;
  const { isActive, action, pattern, config } = req.body;
  try {
    const rule = await prisma.chatValidationRule.update({
      where: { id: ruleId },
      data: { isActive, action, pattern, config }
    });
    res.json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};