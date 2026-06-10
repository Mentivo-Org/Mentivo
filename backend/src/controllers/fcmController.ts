import type { Request, Response } from "express";
import prisma from "../config/db.ts";

export const syncFcmToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!token) return res.status(400).json({ error: "FCM token is required" });
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await prisma.$transaction(async (tx) => {
      // Step 1: Detach this token from any other user (device switched accounts)
      await tx.fCMToken.deleteMany({
        where: { token, userId: { not: userId } },
      });

      // Step 2: Upsert — update if this user already has this token, else create
      await tx.fCMToken.upsert({
        where: { token },
        update: { updatedAt: new Date() },
        create: { token, userId },
      });

      // Step 3: Enforce one token per user — delete all older tokens for this user
      const allUserTokens = await tx.fCMToken.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      if (allUserTokens.length > 1) {
        const oldTokenIds = allUserTokens.slice(1).map((t) => t.id);
        await tx.fCMToken.deleteMany({
          where: { id: { in: oldTokenIds } },
        });
      }
    });

    return res.status(200).json({ message: "FCM token synced" });
  } catch (error) {
    console.error("Error syncing FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Call this on logout
export const removeFcmToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await prisma.fCMToken.deleteMany({
      where: { token, userId },
    });

    return res.status(200).json({ message: "FCM token removed" });
  } catch (error) {
    console.error("Error removing FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};