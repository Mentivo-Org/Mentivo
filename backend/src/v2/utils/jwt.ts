import jwt from 'jsonwebtoken';
import prisma from '../config/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_access_token_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret';

// Warn loudly at startup if secrets are using insecure defaults.
// If you see these warnings in Render logs, set the env vars immediately.
if (!process.env.JWT_SECRET) {
  console.error('[SECURITY] ⚠️  JWT_SECRET is NOT set in environment — using insecure default! Socket auth WILL fail for tokens issued with a different secret.');
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.error('[SECURITY] ⚠️  JWT_REFRESH_SECRET is NOT set in environment — using insecure default!');
}

export interface TokenPayload {
  userId: string;
  role: string;
  phone?: string | null;
  email?: string | null;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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

export const generateAuthTokens = async (user: { id: string; email?: string | null; phone?: string | null; role: string }) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);
  return { accessToken, refreshToken };
};
