import { supabaseAdmin, supabaseAnon } from "../lib/supabaseAdmin.ts";
import prisma from "../config/db.ts";
import type { Request, Response } from "express";
export const forgotPassword = async (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Check user exists in your DB
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "No account found with this email" });

  if (user.authProvider !== "email") {
    return res.status(400).json({
      error: `This account uses ${user.authProvider} login. Password reset is not applicable.`,
    });
  }

  if(user.role!==role) {
    return res.status(401).json({
        error: `Please perform this action from ${user.role} page`
    })
  }

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) return res.status(400).json({ error: error.message });

  return res.status(200).json({ message: "OTP sent to your email", serverTime: Date.now() });
};

export const verifyForgotPasswordOtp = async (req: Request, res: Response) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: "Email and OTP are required" });

  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) return res.status(401).json({ error: error.message });

  // Return Supabase's access token — you'll use this to authenticate the password update
  return res.status(200).json({
    message: "OTP verified",
    accessToken: data.session?.access_token, // short-lived, only used for reset
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { newPassword, accessToken } = req.body;
  if (!newPassword || !accessToken) {
    return res.status(400).json({ error: "New password and token are required" });
  }

  // Use the supabase anon client with the user's access token to update password
  const { error } = await supabaseAnon.auth.updateUser(
    { password: newPassword },
    // Pass the token so supabase knows who's updating
  );

  // Since supabaseAnon doesn't have session context, use admin instead:
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !userData.user) return res.status(401).json({ error: "Invalid or expired token" });

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userData.user.id,
    { password: newPassword }
  );

  if (updateError) return res.status(400).json({ error: updateError.message });

  return res.status(200).json({ message: "Password updated successfully. Please log in." });
};