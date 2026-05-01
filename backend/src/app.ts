import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authrouter from './routes/auth.ts'
import { supabaseAdmin } from './lib/supabaseAdmin.ts'

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://mentivo.in', 'http://localhost:8081'], 
  credentials: true
}));


app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  // 1. IMMEDIATE LOG: Log as soon as the request hits the server
  console.log(`>>> [INCOMING] ${method} ${url} | IP: ${ip}`);

  // 2. FINISH LOG: Log the outcome once the system is done with it
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`<<< [OUTCOME] ${method} ${url} | Status: ${res.statusCode} | ${duration}ms`);
  });

  // 3. ERROR LOG: Log if the connection is closed abruptly without finishing
  res.on('close', () => {
    if (!res.writableEnded) {
      console.log(`!!! [ABORTED] ${method} ${url} | Connection closed prematurely`);
    }
  });

  next();
});

// Routes

app.get('/health', async (req,res) => {
  // console.log(req.body);
  return res.status(200).json({
    message: "Server is running",
  })
})

app.get('/api/health-check', async (req, res) => {
  try {
    // Just select the ID of one mentor to prove the DB is active
    const { data, error } = await supabaseAdmin
      .from('users') // Use any table name you actually have
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    res.status(200).send('System Status: Active');
  } catch (err) {
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
