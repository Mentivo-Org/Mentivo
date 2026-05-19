import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authrouter from './routes/auth.ts';
import coachingRouter from './routes/coaching.ts';
import mentorRouter from './routes/mentors.ts';
import callsRouter from './routes/calls.ts';
import walletRouter from './routes/wallet.ts';
import webhookRouter from './routes/webhooks.ts';
import prisma from './config/db.ts';
import { startJobs } from './jobs/index.ts';

const app = express();

// Move CORS to the top
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Normalize origin by removing trailing slash if present
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    const allowedOrigins = [
      'https://mentivo.in',
      'https://www.mentivo.in',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

    if (
      allowedOrigins.includes(normalizedOrigin) || 
      normalizedOrigin.endsWith('.mentivo.in') || 
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin attempting to connect: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

app.use(express.json());
app.set('trust proxy', 1);

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return forwarded[0].trim();
  }
  return req.ip || 'unknown';
}

app.use((req, res, next) => {
  const start = Date.now();
  const { method, url } = req;
  const ip = getClientIp(req);

  console.log(`>>> ${method} ${url} | IP: ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`<<< ${method} ${url} | Status: ${res.statusCode} | ${duration}ms`);
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      console.log(`!!! ${method} ${url} | Connection closed prematurely`);
    }
  });

  next();
});

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

app.use('/api/auth', authrouter);
app.use('/api/coaching', coachingRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/calls', callsRouter);
app.use('/api/wallet', walletRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Mentivo API running on port ${PORT}`);
  try {
    await startJobs();
    console.log('Background jobs started successfully');
  } catch (err) {
    console.error('Failed to start background jobs:', err);
  }
});
