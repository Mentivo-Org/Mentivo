import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.ts';
import studentRoutes from './routes/students.ts';
import mentorRoutes from './routes/mentors.ts';
import emailRoutes from './routes/email.ts';
import notificationRoutes from './routes/notifications.ts';
import moderationRoutes from './routes/moderation.ts';
import profileDeletionRoutes from './routes/profile-deletion.ts';
import partnerRoutes from './routes/partners.ts';
import configRoutes from './routes/config.ts';
import logRoutes from './routes/logs.ts';
import databaseRoutes from './routes/database.ts';
import voucherRoutes from './routes/vouchers.ts';
import billingRoutes from './routes/billing.ts';
import prisma from './config/db.ts';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const allowedOrigins = [
      'https://admin.mentivo.in',
      'https://www.admin.mentivo.in',
      'http://localhost:5001',
      'http://127.0.0.1:5001'
    ];

    if (allowedOrigins.includes(normalizedOrigin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-type']
}));
app.use(morgan('dev'));
app.use(express.json());
app.set('trust proxy', 1);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all API routes
app.use('/api', globalLimiter);

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return (forwarded as string[])[0].trim();
  }
  return req.ip || 'unknown';
}

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Prove the DB is active using Prisma
    await prisma.user.findFirst({
      select: { id: true }
    });
    
    res.status(200).send('System Status: Active');
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).send('System Status: Paused');
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/profile-deletion', profileDeletionRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/config', configRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/billing', billingRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT_ADMIN || 5001;
app.listen(PORT, () => {
  console.log(`Admin Backend running on port ${PORT}`);
});

export default app;