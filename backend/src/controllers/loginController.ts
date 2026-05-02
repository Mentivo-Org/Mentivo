import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.ts";
import prisma from '../config/db.ts';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.ts';

export const signUpWithEmail = async (req: Request, res: Response) => {
  const { email, password, name, role, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // 1. Sign up in Supabase
  const { data: sbData, error: sbError } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: role || 'student'
      }
    }
  });

  if (sbError) return res.status(400).json({ error: sbError.message });
  if (!sbData.user) return res.status(400).json({ error: "Supabase user creation failed" });

  // 2. Create user in our DB
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: sbData.user.id,
        email: email,
        name: name,
        phone: phone || null,
        role: role || 'student',
        isEmailVerified: false 
      }
    });
  }

  // 3. Generate tokens
  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  return res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  });
};

export const loginWithEmail = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data: sbData, error: sbError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (sbError) return res.status(401).json({ error: sbError.message });
  if (!sbData.user) return res.status(401).json({ error: "Invalid credentials" });

  const user = await prisma.user.findUnique({
    where: { id: sbData.user.id }
  });

  if (!user) return res.status(404).json({ error: "User not found in our database" });

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  });
};

export const handleNativeGoogle = async (req: Request, res: Response) => {
  const { idToken, role, phone, mode } = req.body;

  const { data: sbData, error: sbError } = await supabaseAdmin.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (sbError) return res.status(401).json({ error: sbError.message });
  if (!sbData.user?.email) return res.status(400).json({ error: "Google account missing email" });

  let user = await prisma.user.findUnique({
    where: { email: sbData.user.email }
  });

  if (!user) {
    // If signup mode and no phone, return 202 to trigger frontend CompleteProfile
    if (mode === 'sign-up' && !phone) {
       return res.status(202).json({
         email: sbData.user.email,
         name: sbData.user.user_metadata.full_name
       });
    }

    user = await prisma.user.create({
      data: {
        id: sbData.user.id,
        email: sbData.user.email,
        name: sbData.user.user_metadata.full_name,
        role: role || 'student',
        phone: phone || null,
        isEmailVerified: true 
      }
    });
  } else {
    if (phone && !user.phone) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: { phone }
        });
    }
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  return res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, phone, token, type } = req.body;

  try {
    let result;
    if (phone) {
      result = await supabaseAdmin.auth.verifyOtp({ phone, token, type: type || 'sms' });
    } else if (email) {
      result = await supabaseAdmin.auth.verifyOtp({ email, token, type: type || 'signup' });
    } else {
      return res.status(400).json({ error: "Email or Phone is required" });
    }

    if (result.error) return res.status(401).json({ error: result.error.message });

    // Update verification status in our DB
    const user = await prisma.user.update({
      where: { id: result.data.user?.id },
      data: {
        isEmailVerified: !!email,
        isPhoneVerified: !!phone
      }
    });

    return res.json({
      message: "Successfully verified",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: "Verification failed" });
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
      where: { token: oldToken }
    });

    if (!tokenInDb || tokenInDb.expiresAt < new Date()) {
      if (tokenInDb) {
        await prisma.refreshToken.delete({ where: { id: tokenInDb.id } });
      }
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    await prisma.refreshToken.delete({ where: { id: tokenInDb.id } });

    const newPayload = { userId: payload.userId, email: payload.email };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = await generateRefreshToken(newPayload);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    return res.json({
      accessToken,
      refreshToken,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      } : {
        id: payload.userId,
        email: payload.email,
      }
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
