import redis from '../config/redis.ts';
import prisma from '../config/db.ts';

export async function setAvailable(mentorId: string, fcmToken?: string) {
  // Update Redis persistently (no TTL)
  const payload = { state: 'available', fcmToken, updatedAt: new Date().toISOString() };
  await redis.set(`presence:${mentorId}`, JSON.stringify(payload));
  
  // Sync with DB for persistence
  await prisma.mentorProfile.update({
    where: { mentorId },
    data: { isOnline: true, lastOnlineAt: new Date() }
  });
}

export async function lockToBusy(mentorId: string) {
  const payload = { state: 'busy', updatedAt: new Date().toISOString() };
  await redis.set(`presence:${mentorId}`, JSON.stringify(payload));
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
  if (!data) {
    // Fallback to DB
    const profile = await prisma.mentorProfile.findUnique({
      where: { mentorId },
      select: { isOnline: true }
    });
    if (profile?.isOnline) {
      await setAvailable(mentorId);
      return 'available';
    }
    return 'offline';
  }
  try {
    const parsed = JSON.parse(data);
    return parsed.state as 'available' | 'busy';
  } catch {
    return 'offline';
  }
}

export async function getAvailableMentors(): Promise<string[]> {
  let keys = await redis.keys('presence:*');
  
  if (keys.length === 0) {
    // Fallback: Fetch all online mentors from DB and hydrate Redis
    const onlineMentors = await prisma.mentorProfile.findMany({
      where: { isOnline: true },
      select: { mentorId: true }
    });

    if (onlineMentors.length > 0) {
      for (const mentor of onlineMentors) {
        await setAvailable(mentor.mentorId);
      }
      return onlineMentors.map(m => m.mentorId);
    }
    return [];
  }

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
