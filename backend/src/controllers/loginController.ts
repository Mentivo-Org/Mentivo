import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.ts";
import prisma from '../config/db.ts'


export const loginWithEmail = async (req:Request, res:Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // 1. Ask Supabase to verify credentials
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  // 2. Handle errors (e.g., wrong password or user doesn't exist)
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // 3. Return the tokens to the app
  // Your frontend stores these to use in the Axios interceptor
  res.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email,
    }
  });
};

export const sendOtp = async (phone: string) => {
  console.log("Trying to send OTP");
  console.log(typeof phone, "is the type of", phone);
  const { data, error } = await supabaseAdmin.auth.signInWithOtp({ phone });
  console.log(data);
  console.error({ success: !error });
};

export const verifyOtp = async (req:Request, res:Response) => {
  try {
    const { phone, token } = req.body;
    
    const userName = req.user?.user_metadata?.full_name;
    console.log("User Name is ", userName);
    if(!userName) return res.status(401).json({error: "Please login first"});
  
    const { error } = await supabaseAdmin.auth.verifyOtp({ phone, token, type: 'sms' });
    if(error) return res.status(401).json({error: "Invalid OTP"})
  
    const userRow = await prisma.user.findUnique({
      where: {phone: phone, name: userName}
    });
  
    if(!userRow) return res.status(404).json({error: "User not found"});
  
    const updatedUser = await prisma.user.update({
      where: {id: userRow.id},
      data: {
        isPhoneVerified: true
      }
    });

    return res.status(201).json({
      message: "Phone number successfully verified",
      user: updatedUser,
    })
  }
  catch (e) {
    console.error("Error in verifying OTP: ",e)
    return res.status(400).json(e);
  }
};

export const handleNativeGoogle = async (req:Request, res:Response) => {
  const idToken = req.body?.idToken;
  const mode = req.body?.mode;
  const phone = req.body?.phone;
  const role = req.body?.role;

  // Sign in to Supabase using the ID Token from the mobile app
  const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  console.log(data);  

  if (error) return res.status(401).json({ error: error.message });

  const user = await prisma.user.findUnique({
    where: {email: data.user.email}
  });

  if(mode=="sign-in") {
    if(!user) {
      return res.status(400).json({
        message: "You need to sign up first"
      })
    }
    else {
      
    }
  }
  else {
    if(user) {
      return res.status(401).json({
        message: "This account already exists. Please login"
      })
    }
    if(!phone) {
      return res.status(202).json({
        email: data.user?.email,
        name: data.user?.user_metadata.full_name
      })
    }
    await prisma.user.create({
      data: {
        email: data.user.email,
        name: data.user.user_metadata.full_name,
        phone: phone,
        role
      }
    });

    //send otp

    sendOtp(phone);

    return res.status(200).json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user: data.user
    });
  }


  // Now you have the user and session!
  return res.status(200).json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user: data.user
  });
};


export const refreshUserToken = async (req:Request, res:Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  // Swap the refresh token for a new session
  const { data, error } = await supabaseAdmin.auth.refreshSession({ 
    refresh_token: refreshToken 
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // Send back the new pair
  res.json({
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    user: data.user
  });
};