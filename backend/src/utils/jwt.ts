import jwt from 'jsonwebtoken';
import prisma from '../config/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_access_token_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret';

export interface TokenPayload {
  userId: string;
  role: string;
  phone?: string | null;
  email?: string | null;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const generateRefreshToken = async (payload: TokenPayload): Promise<string> => {
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '60d' });
  
  // Store the refresh token in the database
  await prisma.refreshToken.create({
    data: {
      token,
      userId: payload.userId,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  });

  return token;
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};
