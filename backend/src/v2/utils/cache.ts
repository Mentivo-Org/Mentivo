import redisClient from '../config/redis.ts';

/**
 * Get data from Redis cache
 * @param key The unique cache key
 * @returns Parsed JSON data or null if not found
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[Redis] Error fetching cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Set data in Redis cache
 * @param key The unique cache key
 * @param data The data to stringify and cache
 * @param ttlSeconds Time to live in seconds (default: 300s / 5 min)
 */
export const setCachedData = async (key: string, data: any, ttlSeconds: number = 300): Promise<void> => {
  try {
    const stringifiedData = JSON.stringify(data);
    await redisClient.set(key, stringifiedData, 'EX', ttlSeconds);
  } catch (error) {
    console.error(`[Redis] Error setting cache for key ${key}:`, error);
  }
};

/**
 * Invalidate specific cache key or keys matching a pattern
 * @param pattern The key or pattern to delete (e.g., 'user:profile:123')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    // If it's a direct key without wildcards, just delete it
    if (!pattern.includes('*')) {
      await redisClient.del(pattern);
      return;
    }

    // If it's a pattern, use SCAN (safe for production)
    let cursor = '0';
    do {
      const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
    
  } catch (error) {
    console.error(`[Redis] Error invalidating cache pattern ${pattern}:`, error);
  }
};
