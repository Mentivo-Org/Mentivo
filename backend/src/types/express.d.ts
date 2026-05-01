import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // This will hold the Supabase UUID
        full_name: string;
      };
    }
  }
}