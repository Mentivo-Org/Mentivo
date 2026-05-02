import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/db.ts';
import { verifyAccessToken } from '../utils/jwt.ts';

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify our custom JWT
    const decoded = verifyAccessToken(token);

    // 2. Fetch the user from our Prisma DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach the user to the request object for use in controllers
    // We attach our database user object, not the supabase one
    req.user = user as any; 
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
