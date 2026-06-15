import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { rateLimit } from 'express-rate-limit';
import authrouter from './routes/auth.ts';
import coachingRouter from './routes/coaching.ts';
import mentorRouter from './routes/mentors.ts';
import callsRouter from './routes/calls.ts';
import walletRouter from './routes/wallet.ts';
import chatRouter from './routes/chat.ts';
import agoraRouter from './routes/agora.ts'
import profilePictureRouter from './routes/profilePicture.ts'
import webhookRouter from './routes/webhooks.ts';
import chatModerationRouter from './routes/chatModeration.ts';
import askRouter from './routes/ask.ts';
import partnersRouter from './routes/partners.ts';
import configRouter from './routes/config.ts';
import prisma from './config/db.ts';
import { startJobs } from './jobs/index.ts';
import { initSocket } from './config/socket.ts';
import { ensureStorageBuckets } from './lib/supabaseAdmin.ts';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

app.use(cookieParser());

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
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'x-client-type']
}));

app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

app.use(express.json());
app.set('trust proxy', 1);

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to authentication routes only
app.use('/api/auth', authLimiter);

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

// Socket.io connectivity probe — call this from browser/curl to confirm
// socket.io HTTP polling is reachable before diagnosing WS upgrade issues.
// e.g. curl https://api.mentivo.in/api/socket-health
app.get('/api/socket-health', (req, res) => {
  res.json({
    status: 'ok',
    socketIoPath: '/socket.io/',
    transports: ['websocket', 'polling'],
    testUrl: `${req.protocol}://${req.get('host')}/socket.io/?EIO=4&transport=polling`,
    message: 'If this endpoint returns 200, HTTP is reachable. To test socket.io directly, open testUrl in your browser — you should see a socket.io handshake response, NOT a 404 or connection error.',
  });
});
//Handle authentication
app.use('/api/auth', authrouter);
//Handle coaching
app.use('/api/coaching', coachingRouter);
//Handle mentor functionality
app.use('/api/mentors', mentorRouter);
app.use('/api/calls', callsRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chat-moderation', chatModerationRouter);
app.use('/api/profile-picture',profilePictureRouter);
app.use('/api/ask', askRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/config', configRouter);

//Handle agora token generation
app.use('/api/agora/token', agoraRouter);

app.get('/api/debug-storage', async (req, res) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const keyPayload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

  // Try a minimal upload
  const testBuffer = Buffer.from('hello');
  const { error: uploadError } = await supabaseAdmin.storage
    .from(supabaseBucketName || 'mentor-docs')
    .upload('test/ping.txt', testBuffer, { upsert: true });

  res.json({
    keyRole: keyPayload.role,
    keyRef: keyPayload.ref,
    urlRef: process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0],
    bucketNameEnvVar: process.env.SUPABASE_ID_CARD_BUCKET_NAME,
    existingBuckets: buckets?.map(b => b.name),
    listError: error?.message,
    uploadError: uploadError?.message,
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT_V2 || 4001;
httpServer.listen(PORT, async () => {
  console.log(`Mentivo V2 API running on port ${PORT}`);
  try {
    await ensureStorageBuckets();
  } catch (err) {
    console.error('Failed to ensure storage buckets:', err);
  }
  try {
    await startJobs();
    console.log('Background jobs started successfully in V2');
  } catch (err) {
    console.error('Failed to start background jobs:', err);
  }
});
