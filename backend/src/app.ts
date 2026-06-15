import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getVersions } from '../modules/version/version.controller.ts';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Initialize the sub-apps so they listen on their respective ports
import './v1/app.ts';
import './v2/app.ts';

const app = express();

// CORS configuration at root Gateway level
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'x-client-type', 'x-api-version']
}));

// Route for fetching min versions on startup
app.get('/api/config/version', getVersions);

// Proxy interceptor to route to sub-apps based on x-api-version header
app.use('/', (req, res, next) => {
  const apiVersion = req.headers['x-api-version'];
  
  // Resolve target dynamically based on the header
  const target = apiVersion === 'v2' 
    ? `http://127.0.0.1:${process.env.PORT_V2 || 4001}` 
    : `http://127.0.0.1:${process.env.PORT_V1 || 4000}`;

  createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
  })(req, res, next);
});

// Proxy for socket.io requests
app.use('/socket.io', (req, res, next) => {
  const apiVersion = req.headers['x-api-version'] || req.query.version;
  
  const target = apiVersion === 'v2' 
    ? `http://127.0.0.1:${process.env.PORT_V2 || 4001}` 
    : `http://127.0.0.1:${process.env.PORT_V1 || 4000}`;

  createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
  })(req, res, next);
});

// Global Error Handler for Gateway
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Proxy Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mentivo API Gateway Proxy running on port ${PORT}`);
});
