import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'admin_access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'admin_refresh_secret';

export const generateAccessToken = (email: string) => {
  return jwt.sign({ email }, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
};

export const generateRefreshToken = (email: string) => {
  return jwt.sign({ email }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as { email: string };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { email: string };
};