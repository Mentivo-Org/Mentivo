import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authrouter from './routes/auth.ts';
import { supabaseAdmin } from './lib/supabaseAdmin.ts';
import prisma from './config/db.ts';

const app = express();

// Move CORS to the top
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://mentivo.in',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// app.get('/health', async (req,res) => {
//   // console.log(req.body);
//   return res.status(200).json({
//     message: "Server is running",
//   })
// })

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mentivo API running on port ${PORT}`));
