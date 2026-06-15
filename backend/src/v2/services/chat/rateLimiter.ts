import redis from '../../config/redis.ts';

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfter: number;
}

class ChatRateLimiter {
  private readonly WINDOW_SIZE_SEC = 60;
  private readonly MAX_MESSAGES_PER_MINUTE = parseInt(process.env.CHAT_RATE_LIMIT_PER_MINUTE || '30');

  async checkRateLimit(userId: string): Promise<RateLimitResult> {
    const key = `chat_rate_limit:${userId}`;
    
    // Using a simple fixed window counter for now
    const count = await (redis as any).incr(key);
    
    if (count === 1) {
      await (redis as any).expire(key, this.WINDOW_SIZE_SEC);
    }

    const ttl = await (redis as any).ttl(key);
    
    if (count > this.MAX_MESSAGES_PER_MINUTE) {
      return {
        allowed: false,
        count,
        limit: this.MAX_MESSAGES_PER_MINUTE,
        retryAfter: ttl > 0 ? ttl : 0
      };
    }

    return {
      allowed: true,
      count,
      limit: this.MAX_MESSAGES_PER_MINUTE,
      retryAfter: 0
    };
  }
}

export const chatRateLimiter = new ChatRateLimiter();
