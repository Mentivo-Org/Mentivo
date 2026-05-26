import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.ts';
import studentRoutes from './routes/students.ts';
import mentorRoutes from './routes/mentors.ts';
import emailRoutes from './routes/email.ts';
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

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/email', emailRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Admin Backend running on port ${PORT}`);
});

export default app;