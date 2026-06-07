import type { Request, Response } from "express";
import prisma from "../config/db.ts";

export const syncFcmToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check existing tokens for this user
    const existingTokens = await prisma.fCMToken.findMany({
      where: { 
        OR: [
          { userId: userId},
          {token: token}
        ]
      },
    });

    const matchingToken = existingTokens.find((t) => t.token === token);

    if (matchingToken) {
      // If one matches -> delete all of the rest
      if (existingTokens.length > 1) {
        await prisma.fCMToken.deleteMany({
          where: {
            userId,
            token: { not: token },
          },
        });
      }
      return res.status(200).json({ message: "FCM token already up to date" });
    }

    // No match found
    // First, ensure the new token isn't associated with any other user/session
    await prisma.fCMToken.deleteMany({
      where: { token }
    });

    if (existingTokens.length > 1) {
      // Multiple entries -> delete all and make a new one
      await prisma.fCMToken.deleteMany({
        where: { userId },
      });
      await prisma.fCMToken.create({
        data: { token, userId },
      });
      return res.status(201).json({ message: "Cleared duplicates and created new FCM token" });
    } else if (existingTokens.length === 1) {
      // Only one entry which doesn't match -> update it
      await prisma.fCMToken.update({
        where: { token: existingTokens[0].token },
        data: { token, updatedAt: new Date() },
      });
      return res.status(201).json({ message: "Updated existing FCM token" });
    } else {
      // No existing tokens -> create new
      await prisma.fCMToken.create({
        data: { token, userId },
      });
      return res.status(201).json({ message: "Created new FCM token" });
    }
  } catch (error) {
    console.error("Error syncing FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
