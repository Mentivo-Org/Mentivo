import type { Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.ts';

export interface AuthRequest extends Request {
  user?: { email: string };
}

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Check cookies (Web)
  if (req.cookies && req.cookies.admin_accessToken) {
    token = req.cookies.admin_accessToken;
  }

  // 2. Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token.' });
  }
};