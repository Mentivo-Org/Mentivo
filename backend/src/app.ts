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

// Initialize Static Proxy Instances Once
const v1Target = `http://127.0.0.1:${process.env.PORT_V1 || 4000}`;
const v2Target = `http://127.0.0.1:${process.env.PORT_V2 || 4001}`;

const v1Proxy = createProxyMiddleware({
  target: v1Target,
  changeOrigin: true,
  ws: true,
});

const v2Proxy = createProxyMiddleware({
  target: v2Target,
  changeOrigin: true,
  ws: true,
});

// Unified Proxy Router for both standard HTTP requests and initial polling requests
app.use((req, res, next) => {
  // Skip gateway's own routes so they don't get proxied
  if (req.path.startsWith('/api/config/version')) {
    return next();
  }

  const apiVersion = req.headers['x-api-version'] || req.query.version;
  
  if (apiVersion === 'v2') {
    v2Proxy(req, res, next);
  } else {
    v1Proxy(req, res, next);
  }
});

// Global Error Handler for Gateway
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Proxy Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Mentivo API Gateway Proxy running on port ${PORT}`);
});

// Correctly proxy WebSocket upgrade requests without leaking listeners
server.on('upgrade', (req, socket, head) => {
  let apiVersion = req.headers['x-api-version'];
  if (!apiVersion) {
    // Attempt to extract from query parameters for WebSocket handshakes
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    apiVersion = url.searchParams.get('version') || undefined;
  }

  if (apiVersion === 'v2') {
    // @ts-ignore
    v2Proxy.upgrade(req, socket, head);
  } else {
    // @ts-ignore
    v1Proxy.upgrade(req, socket, head);
  }
});
