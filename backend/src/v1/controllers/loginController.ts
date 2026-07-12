import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin, supabaseAnon } from "../lib/supabaseAdmin.ts";
import prisma from "../config/db.ts";
import {
  verifyRefreshToken,
  generateAuthTokens,
} from "../utils/jwt.ts";
import { emailValidator } from "../utils/mailIdLoader.ts";
import { processReferralBonus } from "../services/referralService.ts";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const sendAuthResponse = (res: Response, req: Request, statusCode: number, data: any) => {
  const isMobile = req.headers['x-client-type'] === 'mobile';
  const { accessToken, refreshToken, user, message, requiresVerification } = data;

  if (isMobile) {
    // Mobile: Return tokens in body
    return res.status(statusCode).json({ accessToken, refreshToken, user, message, requiresVerification });
  } else {
    // Web: Set httpOnly cookies
    if (accessToken) res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 mins
    if (refreshToken) res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
    
    // Return user info and other flags, but NO tokens in body
    return res.status(statusCode).json({ user, message, requiresVerification });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const whoAmI = async (req:Request, res: Response) => {
  if (req.user?.role === 'mentor') {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { mentorProfile: true }
    });
    if (user?.mentorProfile && user.mentorProfile.verificationStatus !== 'VERIFIED') {
      user.mentorProfile.mentorlevel = null;
    }
    return res.status(200).json({ user });
  }
  return res.status(200).json({
    user: req.user
  })
}

const checkEmailAndPhoneConflict = async (email: string, phone?: string) => {
  const userByEmail = await prisma.user.findUnique({ where: { email } });
  if (userByEmail) {
    return { conflict: "email", user: userByEmail };
  }
  if (phone) {
    const userByPhone = await prisma.user.findUnique({ where: { phone } });
    if (userByPhone) {
      return { conflict: "phone", user: userByPhone };
    }
  }
  return { conflict: null, user: null };
};

const resendVerificationOtp = async (res: Response, req: Request, email: string) => {
  const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (otpError) {
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
  return sendAuthResponse(res, req, 202, {
    message: "Account pending verification. OTP resent to your email.",
    email,
    requiresVerification: true,
  });
};

const handleSignUpConflict = async (res: Response, email: string, phone?: string) => {
  const { conflict } = await checkEmailAndPhoneConflict(email, phone);
  if (conflict === "phone") {
    return res.status(400).json({ error: "User already exists with same phone number" });
  }
  if (conflict === "email") {
    return res.status(400).json({ error: "User already exists with same email ID" });
  }
  return null;
};

const upsertPrismaUser = async (
  email: string,
  name: string,
  phone: string | undefined,
  role: string | undefined,
  sbUserId: string,
  referredByReferralCode?: string
) => {
  try {
    let coachingCenterId: string | null = null;
    let validReferralCode: string | null = null;

    if (referredByReferralCode) {
      const partner = await prisma.user.findFirst({
        where: {
          referralCode: referredByReferralCode,
          role: {
            in: ["coaching_partner", "telegram_partner", "other_partner"]
          }
        }
      });
      if (partner) {
        validReferralCode = partner.referralCode;
        if (partner.role === "coaching_partner" && partner.coachingCenterId) {
          coachingCenterId = partner.coachingCenterId;
        }
      }
    }

    return await prisma.user.upsert({
      where: { email },
      update: {}, // Don't overwrite if somehow already exists
      create: {
        email,
        name,
        phone: phone || null,
        role: (role as any) || "student",
        isEmailVerified: false,
        authProvider: "email",
        referredByReferralCode: validReferralCode,
        coachingCenterId: coachingCenterId,
      },
    });
  } catch (dbError) {
    console.error(
      "Prisma user create failed, rolling back Supabase user:",
      dbError,
    );
    await supabaseAdmin.auth.admin.deleteUser(sbUserId);
    throw dbError;
  }
};

export const signUpWithEmail = async (req: Request, res: Response) => {
  const { email, password, name, role, phone, referredByReferralCode } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  if (!name) return res.status(400).json({ error: "Please enter your name" });

  // Check if user already exists in DB
  const user = await prisma.user.findUnique({ where: { email } });

  // Already verified → block
  if (user && user.isEmailVerified) {
    return res
      .status(400)
      .json({ error: "Account already exists. Please log in." });
  }

  // Exists in DB but unverified → just resend OTP, skip Supabase createUser
  if (user && !user.isEmailVerified) {
    return resendVerificationOtp(res, req, email);
  }

  // --- New user flow ---
  const { data: sbData, error: sbError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

  // Race condition: Supabase already has this user
  if (sbError) {
    if (sbError.message.toLowerCase().includes("already been registered")) {
      const conflictRes = await handleSignUpConflict(res, email, phone);
      if (conflictRes) return conflictRes;

      return resendVerificationOtp(res, req, email);
    }
    return res.status(400).json({ error: sbError.message });
  }

  // Race condition check before Prisma creation
  const conflictRes = await handleSignUpConflict(res, email, phone);
  if (conflictRes) {
    await supabaseAdmin.auth.admin.deleteUser(sbData.user.id);
    return conflictRes;
  }

  try {
    await upsertPrismaUser(email, name, phone, role, sbData.user.id, referredByReferralCode);
  } catch (dbError) {
    return res.status(500).json({ error: "Signup failed. Please try again." });
  }

  // Send OTP for email verification
  const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (otpError)
    return res
      .status(400)
      .json({ error: "Failed to send OTP: " + otpError.message });

  return sendAuthResponse(res, req, 202, {
    message: "Signup successful. Please verify your email with the OTP sent.",
    email,
    requiresVerification: true,
  });
};

export const loginWithEmail = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  // console.log("User in DB", user);

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

  // console.log(sbData);

  if (sbError) return res.status(401).json({ error: sbError.message });
  if (!sbData.user)
    return res.status(401).json({ error: "Invalid credentials" });

  if (!user) {
    user = await prisma.user.findUnique({ where: { id: sbData.user.id } });
    if (!user)
      return res.status(404).json({ error: "User not found in our database" });
  }

  // Race condition reconciliation: Supabase is verified but our DB isn't → sync it
  if (!user.isEmailVerified && sbData.user.email_confirmed_at) {
    user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    });
  }

  const { accessToken, refreshToken } = await generateAuthTokens(user);

  return sendAuthResponse(res, req, 200, { accessToken, refreshToken, user });
};

export const handleNativeGoogle = async (req: Request, res: Response) => {
  const { idToken, role, mode, referredByReferralCode } = req.body;

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
    if (mode === "sign-up") {
      // Race condition: Supabase succeeded but Prisma fails → no rollback needed for Google
      // (Supabase user is already real; they can retry and hit the `user exists` branch)
      try {
        user = await prisma.user.create({
          data: {
            id: sbData.user.id,
            email: sbData.user.email,
            name: sbData.user.user_metadata.full_name,
            role: "student",
            phone: null,
            isEmailVerified: true,
            authProvider: "google",
            referredByReferralCode: referredByReferralCode || null,
          },
        });
      } catch (dbError) {
        console.error("Prisma create failed for Google user:", dbError);
        return res
          .status(500)
          .json({ error: "Account creation failed. Please try again." });
      }

      const { accessToken, refreshToken } = await generateAuthTokens(user);

      return sendAuthResponse(res, req, 202, { accessToken, refreshToken, user });
    }

    // mode is "sign-in" but user doesn't exist in DB
    return res
      .status(404)
      .json({ error: "No account found. Please sign up first." });
  } else {
    if (user.authProvider !== "google") {
      return res.status(400).json({
        error: `This account was created with ${user.authProvider}. Please sign in using that method.`,
      });
    }

    const { accessToken, refreshToken } = await generateAuthTokens(user);

    return sendAuthResponse(res, req, 200, { accessToken, refreshToken, user });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, token, name, role, phone } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const result = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (result.error)
      return res.status(401).json({ error: result.error.message });

    // Race condition: Supabase verified but Prisma update fails
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            phone,
            role,
            name,
            isEmailVerified: true,
          },
        });
      } else {
        user = await prisma.user.update({
          where: { email },
          data: { isEmailVerified: true },
        });
      }
    } catch (dbError) {
      // Supabase is verified but DB is not — log for manual resolution
      console.error(
        "CRITICAL: Supabase verified but DB update failed for",
        email,
        dbError,
      );
      return res.status(500).json({
        error:
          "Verification succeeded but account setup failed. Please contact support.",
      });
    }

    const { accessToken, refreshToken } = await generateAuthTokens(user);

    return sendAuthResponse(res, req, 200, {
      message: "Successfully verified",
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: "Verification failed" });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: "OTP resent successfully", serverTime: Date.now() });
  } catch (err) {
    return res.status(500).json({ message: "Error resending OTP", error: err });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  let oldToken = req.body.refreshToken;

  // Web clients might have it in cookies
  if (!oldToken && req.cookies && req.cookies.refreshToken) {
    oldToken = req.cookies.refreshToken;
  }

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

    const { accessToken, refreshToken } = await generateAuthTokens({
      id: payload.userId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return sendAuthResponse(res, req, 200, {
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
        : { id: payload.userId, email: payload.email },
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { name, phone, grade } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        grade: grade !== undefined ? grade : undefined,
        profile_completed: true, // Assuming this sets profile to completed
      },
    });

    if (updatedUser.referredByReferralCode) {
      // Process referral bonus asynchronously
      processReferralBonus(updatedUser.id, updatedUser.referredByReferralCode).catch((err) => {
        console.error("Failed to process referral bonus in background:", err);
      });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Error updating user profile:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};