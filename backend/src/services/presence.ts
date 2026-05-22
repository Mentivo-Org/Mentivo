import redis from '../config/redis.ts';
import prisma from '../config/db.ts';

const ONLINE_TTL = 60; // 60 seconds

export async function setAvailable(mentorId: string, fcmToken?: string) {
  // Update Redis with a TTL
  const payload = { state: 'available', fcmToken, updatedAt: new Date().toISOString() };
  await redis.setex(`presence:${mentorId}`, ONLINE_TTL, JSON.stringify(payload));
  
  // Optionally sync with DB for persistence (if needed for querying)
  await prisma.mentorProfile.update({
    where: { mentorId },
    data: { isOnline: true, lastOnlineAt: new Date() }
  });
}

export async function lockToBusy(mentorId: string) {
  const payload = { state: 'busy', updatedAt: new Date().toISOString() };
  await redis.setex(`presence:${mentorId}`, ONLINE_TTL, JSON.stringify(payload));
}

export async function setOffline(mentorId: string) {
  await redis.del(`presence:${mentorId}`);
  await prisma.mentorProfile.update({
    where: { mentorId },
    data: { isOnline: false }
  });
}

export async function getPresenceState(mentorId: string): Promise<'available' | 'busy' | 'offline'> {
  const data = await redis.get(`presence:${mentorId}`);
  if (!data) return 'offline';
  try {
    const parsed = JSON.parse(data);
    return parsed.state as 'available' | 'busy';
  } catch {
    return 'offline';
  }
}

export async function getAvailableMentors(): Promise<string[]> {
  const keys = await redis.keys('presence:*');
  if (keys.length === 0) return [];

  const values = await redis.mget(...keys);
  const availableMentors: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const data = values[i];
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.state === 'available') {
          availableMentors.push(keys[i].replace('presence:', ''));
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return availableMentors;
}
