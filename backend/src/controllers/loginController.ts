import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.ts";
import prisma from "../config/db.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.ts";

export const signUpWithEmail = async (req: Request, res: Response) => {
  const { email, password, name, role, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if(!name) {
    return res.status(400).json({ error: "Please enter your name"});
  }

  // 2. Create user in our DB
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        name: name,
        phone: phone || null,
        role: role || "student",
        isEmailVerified: false,
        authProvider: "email",
      },
    });
  }
  else if(user.isEmailVerified===true) {
      return res.status(400).json({ error: "Please log in"});
  }

  // 3. Send OTP via Supabase
  const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (otpError)
    return res
      .status(400)
      .json({ error: "Failed to send verification OTP: " + otpError.message });

  return res.status(201).json({
    message: "Signup successful. Please verify your email with the OTP sent.",
    email: user.email,
    requiresVerification: true,
  });
};

export const loginWithEmail = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Pre-check the authProvider in our database
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && user.authProvider !== "email") {
    return res.status(400).json({
      error: `This account was created with ${user.authProvider}. Please sign in using that method.`,
    });
  }

  const { data: sbData, error: sbError } =
    await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

  if (sbError) return res.status(401).json({ error: sbError.message });
  if (!sbData.user)
    return res.status(401).json({ error: "Invalid credentials" });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: sbData.user.id },
    });
    
    if (!user)
      return res.status(404).json({ error: "User not found in our database" });
  }

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
        phone: user.phone,
        authProvider: user.authProvider,
      },
    });
};

export const handleNativeGoogle = async (req: Request, res: Response) => {
  const { idToken, role, mode, phone } = req.body;

  const { data: sbData, error: sbError } =
    await supabaseAdmin.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

  if (sbError) return res.status(401).json({ error: sbError.message });
  if (!sbData.user?.email)
    return res.status(400).json({ error: "Google account missing email" });

  let user = await prisma.user.findUnique({
    where: { email: sbData.user.email },
  });

  if (!user) {
    // If signup mode and no phone, return 202 to trigger frontend CompleteProfile
    if (mode === "sign-up") {
      user = await prisma.user.create({
        data: {
          id: sbData.user.id,
          email: sbData.user.email,
          name: sbData.user.user_metadata.full_name,
          role: role || "student",
          phone: null,
          isEmailVerified: true,
          authProvider: "google",
        },
      });

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
          phone: user.phone,
          authProvider: user.authProvider,
        },
      });
    }
  }
  else {
    if (user.authProvider !== "google") {
      return res.status(400).json({
        error: `This account was created with ${user.authProvider}. Please sign in using that method.`,
      });
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
        phone: user.phone,
        authProvider: user.authProvider,
      },
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, token } = req.body;

  try {
    let result;
    if (email) {
      result = await supabaseAdmin.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });
    } else {
      return res.status(400).json({ error: "Email is required" });
    }

    if (result.error)
      return res.status(401).json({ error: result.error.message });

    // Update verification status in our DB
    const user = await prisma.user.update({
      where: { email: email },
      data: {
        isEmailVerified: !!email,
      },
    });

    // Generate tokens to log the user in immediately after verification
    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    return res.json({
      message: "Successfully verified",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        authProvider: user.authProvider,
      },
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
      where: { token: oldToken },
    });

    if (!tokenInDb || tokenInDb.expiresAt < new Date()) {
      if (tokenInDb) {
        await prisma.refreshToken.delete({ where: { id: tokenInDb.id } });
      }
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    await prisma.refreshToken.delete({ where: { id: tokenInDb.id } });

    const newPayload = { userId: payload.userId, email: payload.email };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = await generateRefreshToken(newPayload);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return res.json({
      accessToken,
      refreshToken,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            authProvider: user.authProvider,
          }
        : {
            id: payload.userId,
            email: payload.email,
          },
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};
