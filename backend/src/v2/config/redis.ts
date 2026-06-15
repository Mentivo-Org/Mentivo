import { Redis } from 'ioredis';

let redis: any;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    family: 0, // This tells ioredis to auto-detect IPv4/IPv6, highly recommended for Upstash
  });
  redis.on('error', (err) => console.error('Redis error:', err));
} else {
  console.warn('REDIS_URL not provided. Falling back to an in-memory mock Redis (Not for production).');
  const mockCache = new Map<string, string>();
  redis = {
    setex: async (key: string, seconds: number, value: string) => {
      mockCache.set(key, value);
      setTimeout(() => mockCache.delete(key), seconds * 1000);
    },
    del: async (key: string) => mockCache.delete(key),
    get: async (key: string) => mockCache.get(key) || null,
    keys: async (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return Array.from(mockCache.keys()).filter(k => k.startsWith(prefix));
    },
    mget: async (...keys: string[]) => {
      return keys.map(k => mockCache.get(k) || null);
    },
    incr: async (key: string) => {
      const current = mockCache.get(key);
      const next = current ? parseInt(current, 10) + 1 : 1;
      mockCache.set(key, next.toString());
      return next;
    },
    expire: async (key: string, seconds: number) => {
      if (!mockCache.has(key)) return 0;
      setTimeout(() => mockCache.delete(key), seconds * 1000);
      return 1;
    },
    ttl: async (key: string) => {
      if (!mockCache.has(key)) return -2;
      return 60; // Mock ttl, just return a positive number
    }
  };
}

export default redis;
