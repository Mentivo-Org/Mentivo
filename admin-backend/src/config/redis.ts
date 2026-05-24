import { Redis } from 'ioredis';

let redis: any;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    family: 0,
  });
  redis.on('error', (err: any) => console.error('Redis error:', err));
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
    exists: async (key: string) => mockCache.has(key) ? 1 : 0,
  };
}

export default redis;