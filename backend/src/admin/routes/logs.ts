import type { Response } from 'express';
import { Router } from 'express';
import axios from 'axios';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Log cleanup route
router.delete('/app/cleanup', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { retentionDays = '30' } = req.query;
  const days = parseInt(retentionDays as string, 10);
  
  if (isNaN(days) || days < 1) {
    return res.status(400).json({ error: 'Invalid retention days parameter' });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  try {
    const deleted = await prisma.logEntry.deleteMany({
      where: {
        createdAt: {
          lt: cutoff
        }
      }
    });

    res.json({ message: `Successfully cleaned up logs older than ${days} days`, count: deleted.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Log cleanup failed' });
  }
});

// GET /api/logs/app - Historical query
router.get('/app', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '50', level, source, method, endpoint, status, search, startDate, endDate, instanceId } = req.query;

  try {
    const take = parseInt(limit as string, 10);
    const skip = (parseInt(page as string, 10) - 1) * take;

    const where: any = {};

    if (level) where.level = level as string;
    if (source) where.source = source as string;
    if (instanceId) where.instanceId = instanceId as string;
    if (method) where.method = method as string;
    if (endpoint) where.endpoint = { contains: endpoint as string, mode: 'insensitive' };
    if (status) where.status = parseInt(status as string, 10);
    
    if (search) {
      where.OR = [
        { message: { contains: search as string, mode: 'insensitive' } },
        { ip: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [total, data] = await Promise.all([
      prisma.logEntry.count({ where }),
      prisma.logEntry.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      total,
      page: parseInt(page as string, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
      data
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch logs' });
  }
});

// GET /api/logs/app/stream - Real-time SSE logs
router.get('/app/stream', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  // Set headers for EventStream / Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'none');
  res.flushHeaders();

  // Send an initial handshake comment
  res.write(': ping\n\n');

  let lastCheckedTime = new Date();

  // Set up polling interval to check for new database log entries
  const interval = setInterval(async () => {
    try {
      const newLogs = await prisma.logEntry.findMany({
        where: {
          createdAt: {
            gt: lastCheckedTime
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      if (newLogs.length > 0) {
        lastCheckedTime = newLogs[newLogs.length - 1].createdAt;
        newLogs.forEach((log) => {
          res.write(`data: ${JSON.stringify(log)}\n\n`);
        });
      }
    } catch (error: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  }, 2000);

  // Clean up interval when client disconnects
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Helper: Build a map of serviceId -> { apiKey, ownerId } from environment variables
// Supports multiple Render accounts where each service has its own API key and owner ID
const getServiceConfigMap = (): Map<string, { apiKey: string; ownerId: string }> => {
  const map = new Map<string, { apiKey: string; ownerId: string }>();

  // Main backend: RENDER_MAIN_BACKEND_SERVICE_ID + RENDER_MAIN_BACKEND_API_KEY + RENDER_MAIN_BACKEND_OWNER_ID
  const mainId = process.env.RENDER_MAIN_BACKEND_SERVICE_ID;
  const mainKey = process.env.RENDER_MAIN_BACKEND_API_KEY;
  const mainOwner = process.env.RENDER_MAIN_BACKEND_OWNER_ID;
  if (mainId && mainKey && mainOwner) {
    map.set(mainId, { apiKey: mainKey, ownerId: mainOwner });
  }

  // Workers: RENDER_WORKER_SERVICES="Label:serviceId:apiKey:ownerId,Label2:serviceId2:apiKey2:ownerId2"
  const workersEnv = process.env.RENDER_WORKER_SERVICES || '';
  if (workersEnv) {
    workersEnv.split(',').map((entry) => entry.trim()).filter(Boolean).forEach((entry) => {
      const parts = entry.split(':');
      if (parts.length >= 4) {
        // Format: Label:serviceId:apiKey:ownerId
        const id = parts[1].trim();
        const key = parts[2].trim();
        const owner = parts[3].trim();
        map.set(id, { apiKey: key, ownerId: owner });
      }
    });
  }

  return map;
};

// GET /api/logs/render/services - List configured Render services
router.get('/render/services', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const services: { label: string; id: string; type: string }[] = [];

  const mainId = process.env.RENDER_MAIN_BACKEND_SERVICE_ID;
  if (mainId) {
    services.push({ label: 'Main Backend', id: mainId, type: 'main' });
  }

  const workersEnv = process.env.RENDER_WORKER_SERVICES || '';
  if (workersEnv) {
    workersEnv.split(',').map((entry) => entry.trim()).filter(Boolean).forEach((entry) => {
      const parts = entry.split(':');
      if (parts.length >= 4) {
        services.push({ label: parts[0].trim(), id: parts[1].trim(), type: 'worker' });
      }
    });
  }

  res.json({ services });
});

// GET /api/logs/render - Fetch logs from Render API by serviceId
// Uses the correct /v1/logs endpoint with ownerId (supports multi-account setups)
router.get('/render', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { serviceId } = req.query;

  if (!serviceId) {
    return res.status(400).json({ error: 'Missing serviceId query parameter.' });
  }

  const configMap = getServiceConfigMap();
  const config = configMap.get(serviceId as string);

  if (!config) {
    return res.status(400).json({ 
      error: `No configuration found for service ${serviceId}. Ensure RENDER_MAIN_BACKEND_API_KEY/OWNER_ID or RENDER_WORKER_SERVICES are set correctly.` 
    });
  }

  try {
    const renderResponse = await axios.get('https://api.render.com/v1/logs', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      },
      params: {
        ownerId: config.ownerId,
        resource: serviceId,
        limit: 100
      }
    });

    res.json(renderResponse.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const msg = error.response?.data?.message || error.message || 'Failed to fetch Render logs';
    res.status(status).json({ error: msg });
  }
});

export default router;

