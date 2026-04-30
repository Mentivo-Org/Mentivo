import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authrouter from './routes/auth.ts'

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://mentivo.in', 'http://localhost:8081'], 
  credentials: true
}));


app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  // This runs AFTER the request is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    console.log(`${method} ${url} ${status} - ${duration}ms from ${ip}`);
  });

  next();
});

// Routes

app.get('/health', async (req,res) => {
  console.log(req.body);
  return res.status(200).json({
    message: "Server is running",
    body: req.body,
  })
})

app.use('/auth', async (req,res,next  ) => {
  console.log(req.body);
  authrouter(req,res,next);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mentivo API running on port ${PORT}`));
