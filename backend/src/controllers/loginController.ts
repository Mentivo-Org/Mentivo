import type { Request, Response } from "express";
import admin from "../config/firebase.ts";
import prisma from "../config/db.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.ts";

export const handlePhoneLogin = async (req: Request, res: Response) => {
  const { idToken, name, role, email, coachingCenterCode } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID token is required" });
  }

  try {
    // 1. Verify the ID token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) {
      return res.status(400).json({ error: "No phone number found in token. Ensure you used Phone Auth." });
    }

    // 2. Find or Create User strictly by Phone
    let user = await prisma.user.findUnique({
      where: { phone },
      include: {
        wallet: true,
        mentorProfile: true,
      }
    });

    if (!user) {
      // New User - Registration required
      if (!name || !role) {
        return res.status(400).json({ 
          error: "Name and role are required for new users", 
          requiresRegistration: true,
          phone 
        });
      }

      // Optional: Find coaching center if code provided
      let coachingCenterId = null;
      if (coachingCenterCode) {
        const center = await prisma.coachingCenter.findUnique({ where: { code: coachingCenterCode } });
        if (center) coachingCenterId = center.id;
      }

      // Create User with atomic transaction to ensure related entities are created
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            phone,
            name,
            role: role as "student" | "mentor",
            email: email || null,
            isPhoneVerified: true,
            authProvider: "phone",
            coachingCenterId,
          },
          include: {
            wallet: true,
            mentorProfile: true,
          }
        });

        // Initialize role-specific data
        if (role === "student") {
          await tx.wallet.create({
            data: { userId: newUser.id, balance: 0 }
          });
        } else if (role === "mentor") {
          await tx.mentorBalance.create({
            data: { mentorId: newUser.id }
          });
          await tx.mentorProfile.create({
            data: { 
              mentorId: newUser.id,
              iit_name: "TBD", // To be filled by mentor later
              isOnline: false
            }
          });
        }

        return newUser;
      });
    }

    // 3. Issue Tokens
    const payload = { userId: user.id, phone: user.phone, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        email: user.email,
        authProvider: user.authProvider,
      },
    });

  } catch (error: any) {
    console.error("Phone auth error:", error);
    return res.status(401).json({ error: "Invalid or expired Firebase token" });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const { refreshToken: oldToken } = req.body;

  if (!oldToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const payload = verifyRefreshToken(oldToken);
    const tokenInDb = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!tokenInDb || tokenInDb.expiresAt < new Date()) {
      // Security: If token not in DB but valid, might be a reuse/theft attempt
      if (!tokenInDb) {
        console.warn(`Potential refresh token reuse detected for user ${payload.userId}`);
        await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
      } else {
        await prisma.refreshToken.delete({ where: { id: tokenInDb.id } });
      }
      return res.status(401).json({ error: "Session expired. Please login again." });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: tokenInDb.id } });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: "User no longer exists" });

    const newPayload = { userId: user.id, phone: user.phone, email: user.email };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = await generateRefreshToken(newPayload);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
