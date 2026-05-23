import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin, supabaseAnon } from "../lib/supabaseAdmin.ts";
import prisma from "../config/db.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.ts";
import { emailValidator } from "../utils/mailIdLoader.ts";

export const whoAmI = async (req:Request, res: Response) => {
  return res.status(200).json({
    user: req.user
  })
}

export const signUpWithEmail = async (req: Request, res: Response) => {
  const { email, password, name, role, phone } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  if (!name) return res.status(400).json({ error: "Please enter your name" });

  // Check if user already exists in your DB
  let user = await prisma.user.findUnique({ where: { email } });

  // Already verified → block
  if (user && user.isEmailVerified) {
    return res
      .status(400)
      .json({ error: "Account already exists. Please log in." });
  }

  // Exists in DB but unverified → just resend OTP, skip Supabase createUser
  if (user && !user.isEmailVerified) {
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError)
      return res.status(500).json({ error: "Failed to resend OTP" });
    return res.status(202).json({
      message: "Account pending verification. OTP resent to your email.",
      email,
      requiresVerification: true,
    });
  }

  // --- New user flow ---
  const { data: sbData, error: sbError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

  // Race condition: Supabase already has this user (e.g. DB write failed on a prior attempt)
  if (sbError) {
    if (sbError.message.toLowerCase().includes("already been registered")) {
      var temp;
      temp = await prisma.user.findUnique({
        where: { email },
      });
      if (!temp) {
        console.log("User not found for same email ID");
        temp = await prisma.user.findUnique({
          where: { phone },
        });
        if (temp) {
          return res.status(400).json({
            error: "User already exists with same phone number",
          });
        }
      } else {
        console.log(temp);
        return res.status(400).json({
          error: "User already exists with same email ID",
        });
      }
      const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otpError)
        return res.status(500).json({ error: "Failed to resend OTP" });
      return res.status(202).json({
        message: "Account pending verification. OTP resent to your email.",
        email,
        requiresVerification: true,
      });
    }
    return res.status(400).json({ error: sbError.message });
  }

  // Race condition: Supabase succeeded but Prisma fails → rollback Supabase user
  try {
    var temp;
    temp = await prisma.user.findUnique({
      where: { email },
    });
    if (!temp) {
      console.log("User not found for same email ID");
      temp = await prisma.user.findUnique({
        where: { phone },
      });
      if (temp) {
        return res.status(400).json({
          error: "User already exists with same phone number",
        });
      }
    } else {
      console.log(temp);
      return res.status(400).json({
        error: "User already exists with same email ID",
      });
    }
    user = await prisma.user.upsert({
      where: { email },
      update: {}, // Don't overwrite if somehow already exists
      create: {
        email,
        name,
        phone: phone || null,
        role: role || "student",
        isEmailVerified: false,
        authProvider: "email",
      },
    });
  } catch (dbError) {
    console.error(
      "Prisma user create failed, rolling back Supabase user:",
      dbError,
    );
    await supabaseAdmin.auth.admin.deleteUser(sbData.user.id);
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

  return res.status(202).json({
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

  const payload = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);

  return res.status(200).json({ accessToken, refreshToken, user });
};

export const handleNativeGoogle = async (req: Request, res: Response) => {
  const { idToken, role, mode } = req.body;

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
          },
        });
      } catch (dbError) {
        console.error("Prisma create failed for Google user:", dbError);
        return res
          .status(500)
          .json({ error: "Account creation failed. Please try again." });
      }

      const payload = {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      };
      const accessToken = generateAccessToken(payload);
      const refreshToken = await generateRefreshToken(payload);

      return res.status(202).json({ accessToken, refreshToken, user });
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

    const payload = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    return res.status(200).json({ accessToken, refreshToken, user });
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

    const payload = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    return res.status(200).json({
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

    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Error resending OTP", error: err });
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

    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
    };
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
        : { id: payload.userId, email: payload.email },
    });
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
};