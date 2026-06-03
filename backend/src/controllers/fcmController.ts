import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import prisma from "../config/db.ts";


export const addFcmToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Upsert the token to handle potential duplicates or re-assignments
    const fcmToken = await prisma.fCMToken.upsert({
      where: { token },
      update: { userId, updatedAt: new Date() },
      create: { token, userId },
    });

    return res.status(200).json({ message: "FCM token added successfully", fcmToken });
  } catch (error) {
    console.error("Error adding FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateFcmToken = async (req: Request, res: Response): Promise<any> => {
  try {
    const { oldToken, newToken } = req.body;
    const userId = req.user?.id;

    if (!oldToken || !newToken) {
      return res.status(400).json({ error: "oldToken and newToken are required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Try to update the token
    const existingToken = await prisma.fCMToken.findUnique({
      where: { token: oldToken }
    });

    if (existingToken) {
      if (existingToken.userId !== userId) {
        // If the token belongs to someone else, we just delete it and create a new one for this user
        await prisma.fCMToken.delete({ where: { token: oldToken } });
        await prisma.fCMToken.upsert({
          where: { token: newToken },
          update: { userId, updatedAt: new Date() },
          create: { token: newToken, userId }
        });
      } else {
        // Token belongs to user, update it
        // However, Prisma doesn't let us update the primary unique key easily if the new key already exists.
        // It's safer to upsert the new token and delete the old one.
        await prisma.fCMToken.delete({ where: { token: oldToken } });
        await prisma.fCMToken.upsert({
          where: { token: newToken },
          update: { userId, updatedAt: new Date() },
          create: { token: newToken, userId }
        });
      }
    } else {
      // Old token not found, just add the new one
      await prisma.fCMToken.upsert({
        where: { token: newToken },
        update: { userId, updatedAt: new Date() },
        create: { token: newToken, userId }
      });
    }

    return res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
