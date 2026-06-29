import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import pg from 'pg';
import crypto from 'crypto';

const app = express();

// Parse database details
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
let dbPool = null;
if (dbUrl) {
    dbPool = new pg.Pool({
        connectionString: dbUrl,
        max: 3, // Prevent connection limit exhaustion (EMAXCONNSESSION)
    });
    console.log('Database logging enabled in Load Balancer');
} else {
    console.warn('Database credentials missing. DB logging is disabled.');
}

// Parse target URLs from environment
// e.g. MAIN_INSTANCE_URL=https://mentivo-main.onrender.com
// e.g. WORKER_URLS=https://mentivo-worker1.onrender.com,https://mentivo-worker2.onrender.com
const mainInstance = process.env.MAIN_INSTANCE_URL || 'http://127.0.0.1:3000';
const workersEnv = process.env.WORKER_URLS || '';
const workers = workersEnv ? workersEnv.split(',').map(url => url.trim()) : [];

// All available nodes for user traffic
const userNodes = [mainInstance, ...workers];

console.log(`Main Instance (Admin+User): ${mainInstance}`);
console.log(`Worker Nodes (User only): ${workers.length}`);

// Simple Round Robin index
let currentWorkerIndex = 0;
const getNextNode = () => {
    const node = userNodes[currentWorkerIndex];
    currentWorkerIndex = (currentWorkerIndex + 1) % userNodes.length;
    return node;
};

// Admin Proxy (Strictly routes to the main instance)
const adminProxy = createProxyMiddleware({
    target: mainInstance,
    changeOrigin: true,
    ws: false,
    logLevel: 'error',
});

// User/Socket Proxy (Round robin across all instances)
let lastRoutedNode = '';
const userProxy = createProxyMiddleware({
    target: mainInstance, // default target, but we override it in router
    changeOrigin: true,
    ws: true, // Enable WebSockets
    router: (req) => {
        const node = getNextNode();
        lastRoutedNode = node;
        return node;
    },
    logLevel: 'error',
});

// Centralized Request/Response logging middleware
app.use((req, res, next) => {
    // Avoid logging internal SSE streams and standard health checks to avoid noise
    if (req.path.startsWith('/api/logs/app/stream') || req.path === '/health') {
        return next();
    }

    const start = Date.now();
    const { method, url } = req;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

    // Capture response chunks
    let responseBody = '';
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, ...args) {
        if (chunk && typeof chunk !== 'string') {
            responseBody += chunk.toString('utf8');
        } else if (typeof chunk === 'string') {
            responseBody += chunk;
        }
        return originalWrite.apply(res, [chunk, ...args]);
    };

    res.end = function (chunk, ...args) {
        if (chunk && typeof chunk !== 'string') {
            responseBody += chunk.toString('utf8');
        } else if (typeof chunk === 'string') {
            responseBody += chunk;
        }
        return originalEnd.apply(res, [chunk, ...args]);
    };

    res.on('finish', async () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        const endpoint = url.split('?')[0];
        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // Parse response to ensure it's not a huge binary blob
        let parsedResponse = null;
        try {
            parsedResponse = JSON.parse(responseBody);
        } catch {
            // Not JSON, truncate if too long
            parsedResponse = responseBody.length > 1000 ? responseBody.substring(0, 1000) + '... [truncated]' : responseBody;
        }

        // Exact requested log format: time, info/warn, method, endpoint, status, time, response
        // console.log(`[${timeStr}] [${level}] ${method} ${endpoint} ${res.statusCode} ${duration}ms ${JSON.stringify(parsedResponse)}`);

        if (dbPool) {
            try {
                // Determine destination worker node
                let routedTo = 'main-instance';
                if (!req.path.startsWith('/api/admin')) {
                    routedTo = lastRoutedNode || 'unknown';
                }

                const id = crypto.randomUUID();

                await dbPool.query(
                    `INSERT INTO "log_entries" (id, level, message, source, "instanceId", method, endpoint, status, duration, ip, metadata, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
                    [
                        id,
                        level,
                        `${method} ${url} responded with status ${res.statusCode}`,
                        routedTo,
                        process.env.RENDER_INSTANCE_ID || 'load-balancer-local',
                        method,
                        endpoint,
                        res.statusCode,
                        duration,
                        ip,
                        JSON.stringify({
                            userAgent: req.headers['user-agent'],
                            query: req.query,
                            routedToInstance: routedTo,
                            response: parsedResponse
                        })
                    ]
                );
            } catch (err) {
                console.error('[LB-DB-LOG-ERROR] Failed to save log entry to DB:', err);
            }
        }
    });

    next();
});

// Middleware to conditionally route
app.use((req, res, next) => {
    if (req.path.startsWith('/api/admin')) {
        return adminProxy(req, res, next);
    }
    return userProxy(req, res, next);
});

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

// Handle WebSocket Upgrades
server.on('upgrade', (req, socket, head) => {
    // We proxy WS to a user node
    // @ts-ignore
    userProxy.upgrade(req, socket, head);
});

server.listen(PORT, () => {
    console.log(`Multi-account Load Balancer running on port ${PORT}`);
});

