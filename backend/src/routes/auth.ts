import { Router } from 'express';
import { handlePhoneLogin, refreshUserToken } from '../controllers/loginController.ts';

const app = Router();

/**
 * POST /api/auth/phone-login
 * Main entry point for both Signup and Login.
 * Expects { idToken, name?, role?, email?, coachingCenterCode? }
 */
app.post('/phone-login', handlePhoneLogin);

/**
 * POST /api/auth/refresh
 * Refresh access and refresh tokens.
 * Expects { refreshToken }
 */
app.post('/refresh', refreshUserToken);

export default app;
