import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  family: 0, // This tells ioredis to auto-detect IPv4/IPv6, highly recommended for Upstash
});

export default redis;
