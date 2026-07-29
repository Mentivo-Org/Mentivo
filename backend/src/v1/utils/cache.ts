import redisClient from '../config/redis.ts';

export async function getCachedAppSettings(): Promise<Record<string, string>> {
  const cached = await redisClient.get('app_settings_cache');
  if (cached) return JSON.parse(cached);
  
  // We cannot import prisma at the top level to avoid circular dependencies if any,
  // but it's safe to require it here, or import it at the top if it's safe.
  const { default: prisma } = await import('../config/db.ts');
  const settings = await prisma.appSetting.findMany();
  const map = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
  await redisClient.set('app_settings_cache', JSON.stringify(map), 'EX', 60); // 60s TTL
  return map;
}
