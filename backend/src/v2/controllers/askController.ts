import type { Request, Response } from 'express';
import prisma from '../config/db.ts';
import { sendAnswerAlert } from '../services/notifications.ts';


import { getCachedData, setCachedData } from '../utils/cache.ts';

// 1. Get Q&A configuration
export const getAskConfig = async (req: Request, res: Response) => {
  try {
    const cachedConfig = await getCachedData('ask:config');
    if (cachedConfig) {
      return res.json(cachedConfig);
    }

    let config = await prisma.askConfig.findUnique({
      where: { id: 'default' },
    });
    if (!config) {
      config = await prisma.askConfig.create({
        data: {
          id: 'default',
          maxQuestionsPerPeriod: 5,
          periodHours: 24,
          maxQuestionChars: null,
          maxAnswerChars: null,
        },
      });
    }
    
    await setCachedData('ask:config', config, 600); // 10 min TTL
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Post a question
export const createQuestion = async (req: Request, res: Response) => {
  const { text } = req.body;
  const studentId = (req as any).user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Question text is required' });
  }

  try {
    // Fetch User to get their coaching center and role details
    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can ask questions' });
    }

    // Fetch config
    let config = await prisma.askConfig.findUnique({
      where: { id: 'default' },
    });
    if (!config) {
      config = {
        id: 'default',
        maxQuestionsPerPeriod: 5,
        periodHours: 24,
        maxQuestionChars: null,
        maxAnswerChars: null,
      };
    }

    // Character count validation
    if (config.maxQuestionChars && text.length > config.maxQuestionChars) {
      return res.status(400).json({
        error: `Question exceeds the maximum character limit of ${config.maxQuestionChars} characters.`,
      });
    }

    // Rate limit validation (non-deleted questions in the period)
    const periodStart = new Date(Date.now() - config.periodHours * 60 * 60 * 1000);
    const questionsCount = await prisma.question.count({
      where: {
        studentId,
        isDeleted: false,
        createdAt: { gte: periodStart },
      },
    });

    if (questionsCount >= config.maxQuestionsPerPeriod) {
      return res.status(400).json({
        error: `You have reached the limit of ${config.maxQuestionsPerPeriod} questions per ${config.periodHours} hours.`,
      });
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        studentId,
        text,
        coachingCenterId: user.coachingCenterId,
      },
      include: {
        student: { select: { id: true, name: true, photo_url: true } },
      },
    });

    res.status(201).json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get questions (paginated, with coaching center prioritization)
export const getQuestions = async (req: Request, res: Response) => {
  const sort = req.query.sort as string | undefined;
  const search = req.query.search as string | undefined;
  const page = req.query.page as string | undefined;
  const limit = req.query.limit as string | undefined;
  const userId = (req as any).user.id;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Fetch user to get coachingCenterId (cached)
    const cachedUser = await getCachedData<any>(`user:profile:${userId}`);
    let userCoachingCenterId = cachedUser?.coachingCenterId;
    
    if (!cachedUser) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      userCoachingCenterId = user?.coachingCenterId;
      if (user) await setCachedData(`user:profile:${userId}`, user, 300);
    }

    const cacheKey = `ask:questions:cc:${userCoachingCenterId || 'global'}:sort:${sort}:search:${search}:page:${pageNum}:limit:${limitNum}`;
    const cachedQuestions = await getCachedData(cacheKey);
    if (cachedQuestions) {
      return res.json(cachedQuestions);
    }

    // Build filter
    const whereClause: any = {
      isDeleted: false,
    };

    if (search && (search as string).trim()) {
      whereClause.text = {
        contains: (search as string).trim(),
        mode: 'insensitive',
      };
    }

    if (sort === 'unanswered') {
      whereClause.answers = {
        none: { isDeleted: false },
      };
    }

    let questions: any[] = [];
    let totalCount = 0;

    // Sorting definition: sort popular by answer count, else by creation time
    const getOrderBy = (): any => {
      if (sort === 'popular') {
        return { answers: { _count: 'desc' } };
      }
      return { createdAt: 'desc' };
    };

    const includeBlock = {
      student: { select: { id: true, name: true, photo_url: true, grade: true } },
      answers: {
        where: { isDeleted: false },
        include: {
          mentor: {
            select: {
              id: true,
              name: true,
              photo_url: true,
              mentorProfile: { select: { iit_name: true, branch: true } },
            },
          },
        },
        orderBy: { upvotes: 'desc' as const },
      },
    };

    if (userCoachingCenterId) {
      // Prioritize same coaching center
      const matchingWhere = { ...whereClause, coachingCenterId: userCoachingCenterId };
      const nonMatchingWhere = { ...whereClause, NOT: { coachingCenterId: userCoachingCenterId } };

      const matchingCount = await prisma.question.count({ where: matchingWhere });
      const nonMatchingCount = await prisma.question.count({ where: nonMatchingWhere });
      totalCount = matchingCount + nonMatchingCount;

      if (skip < matchingCount) {
        // Page starts or lies entirely in matching coaching center questions
        const matchingQuestions = await prisma.question.findMany({
          where: matchingWhere,
          include: includeBlock,
          orderBy: getOrderBy(),
          take: limitNum,
          skip: skip,
        });
        questions.push(...matchingQuestions);

        if (questions.length < limitNum) {
          const remainingLimit = limitNum - questions.length;
          const nonMatchingQuestions = await prisma.question.findMany({
            where: nonMatchingWhere,
            include: includeBlock,
            orderBy: getOrderBy(),
            take: remainingLimit,
            skip: 0,
          });
          questions.push(...nonMatchingQuestions);
        }
      } else {
        // Page lies entirely in non-matching questions
        const nonMatchingSkip = skip - matchingCount;
        const nonMatchingQuestions = await prisma.question.findMany({
          where: nonMatchingWhere,
          include: includeBlock,
          orderBy: getOrderBy(),
          take: limitNum,
          skip: nonMatchingSkip,
        });
        questions.push(...nonMatchingQuestions);
      }
    } else {
      // Global questions listing
      totalCount = await prisma.question.count({ where: whereClause });
      questions = await prisma.question.findMany({
        where: whereClause,
        include: includeBlock,
        orderBy: getOrderBy(),
        take: limitNum,
        skip: skip,
      });
    }

    const responseData = {
      questions,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    };

    // Cache this specific feed query for 3 minutes (short TTL due to high mutability)
    await setCachedData(cacheKey, responseData, 180);
    res.json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Edit a question
export const updateQuestion = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { text } = req.body;
  const userId = (req as any).user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Question text is required' });
  }

  try {
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.studentId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this question' });
    }

    // Validate config character limits if config is defined
    const config = await prisma.askConfig.findUnique({
      where: { id: 'default' },
    });
    if (config?.maxQuestionChars && text.length > config.maxQuestionChars) {
      return res.status(400).json({
        error: `Question exceeds the maximum character limit of ${config.maxQuestionChars} characters.`,
      });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: { text },
      include: {
        student: { select: { id: true, name: true, photo_url: true } },
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Soft-delete a question
export const deleteQuestion = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = (req as any).user.id;

  try {
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.studentId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this question' });
    }

    await prisma.question.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ success: true, message: 'Question deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Post an answer to a question (Mentor only, once per question)
export const createAnswer = async (req: Request, res: Response) => {
  const questionId = req.params.id as string;
  const { text } = req.body;
  const mentorId = (req as any).user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Answer text is required' });
  }

  try {
    // Verify user role
    const user = await prisma.user.findUnique({
      where: { id: mentorId },
    });

    if (user?.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can answer questions' });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Validate mentor answer character limit
    const config = await prisma.askConfig.findUnique({
      where: { id: 'default' },
    });
    if (config?.maxAnswerChars && text.length > config.maxAnswerChars) {
      return res.status(400).json({
        error: `Answer exceeds the maximum character limit of ${config.maxAnswerChars} characters.`,
      });
    }

    // Check if mentor already answered this question (including deleted ones, or update it)
    const existingAnswer = await prisma.answer.findFirst({
      where: { questionId, mentorId },
    });

    if (existingAnswer) {
      if (!existingAnswer.isDeleted) {
        return res.status(400).json({ error: 'You have already answered this question.' });
      } else {
        // If it was soft-deleted, we can reactivate it with new text
        const reactivated = await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: { text, isDeleted: false, upvotes: 0, downvotes: 0 },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                photo_url: true,
                mentorProfile: { select: { iit_name: true, branch: true } },
              },
            },
          },
        });

        // Trigger notification
        await sendAnswerAlert(question.studentId, user.name || 'A Mentor', questionId);

        return res.json(reactivated);
      }
    }

    // Create answer
    const answer = await prisma.answer.create({
      data: {
        questionId,
        mentorId,
        text,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            photo_url: true,
            mentorProfile: { select: { iit_name: true, branch: true } },
          },
        },
      },
    });

    // Send notifications to the student
    await sendAnswerAlert(question.studentId, user.name || 'A Mentor', questionId);

    res.status(201).json(answer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Vote on an answer (Upvote/Downvote)
export const voteAnswer = async (req: Request, res: Response) => {
  const answerId = req.params.id as string;
  const { voteType } = req.body; // 'UP' | 'DOWN'
  const userId = (req as any).user.id;

  if (!['UP', 'DOWN'].includes(voteType)) {
    return res.status(400).json({ error: 'Invalid voteType. Must be UP or DOWN.' });
  }

  try {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!answer || answer.isDeleted) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const existingVote = await prisma.answerVote.findUnique({
      where: {
        answerId_userId: { answerId, userId },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off vote (remove it)
        await prisma.answerVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Update vote type
        await prisma.answerVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      // Create new vote
      await prisma.answerVote.create({
        data: {
          answerId,
          userId,
          voteType,
        },
      });
    }

    // Recalculate upvotes and downvotes
    const upvotesCount = await prisma.answerVote.count({
      where: { answerId, voteType: 'UP' },
    });
    const downvotesCount = await prisma.answerVote.count({
      where: { answerId, voteType: 'DOWN' },
    });

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        upvotes: upvotesCount,
        downvotes: downvotesCount,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            photo_url: true,
            mentorProfile: { select: { iit_name: true, branch: true } },
          },
        },
      },
    });

    res.json(updatedAnswer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Get question detail (single question with all its answers)
export const getQuestionDetail = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, photo_url: true, grade: true } },
        answers: {
          where: { isDeleted: false },
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                photo_url: true,
                mentorProfile: { select: { iit_name: true, branch: true } },
              },
            },
          },
          orderBy: { upvotes: 'desc' },
        },
      },
    });

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
