import express from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";


export const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;
  
  // Use admin client to sign in the user
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ error: error.message });

  // Send the session/user data to your frontend
  res.json({ user: data.user, session: data.session });
};

export const sendOtp = async (req, res) => {
  const { phone } = req.body;
  const { error } = await supabaseAdmin.auth.signInWithOtp({ phone });
  res.json({ success: !error });
};

export const verifyOtp = async (req, res) => {
  const { phone, token } = req.body;
  const { data, error } = await supabaseAdmin.auth.verifyOtp({ phone, token, type: 'sms' });
  
  if (error) return res.status(400).json(error);
  res.json(data.session);
};

export const handleNativeGoogle = async (req, res) => {
  console.log(req.body);
    const idToken = req.body?.idToken;
  console.log(idToken);

  // Sign in to Supabase using the ID Token from the mobile app
  const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  console.log(data);

  if (error) return res.status(401).json({ error: error.message });

  // Now you have the user and session!
  res.json({
    access_token: data.session?.access_token,
    user: data.user
  });
};