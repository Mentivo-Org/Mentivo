import { Router } from "express";
import {
  handleNativeGoogle,
  loginWithEmail,
  requestLoginOtp,
  refreshUserToken,
  resendOtp,
  signUpWithEmail,
  verifyOtp,
  whoAmI,
  logout,
  updateUserProfile,
} from "../controllers/loginController.ts";
import { authenticateUser } from "../auth/authenticateUser.ts";
import { iitNameExporter } from "../controllers/iitNameController.ts";
import { forgotPassword, resetPassword, verifyForgotPasswordOtp } from "../controllers/forgotPassword.ts";
import { CompleteProfileMentor, CompleteProfileStudent, uploadFile } from "../controllers/completeProfile.ts";
import { removeFcmToken, syncFcmToken } from "../controllers/fcmController.ts";

const app = Router();

//whoami
app.get('/whoami', authenticateUser, whoAmI)

// backend/routes/auth.js
app.post("/signup", signUpWithEmail);
app.post("/login", loginWithEmail);
app.post("/login/request-otp", requestLoginOtp);
app.post("/logout", logout);

// FCM Tokens
app.post("/fcm-token", authenticateUser, syncFcmToken);
app.patch("/fcm-token", authenticateUser, removeFcmToken)

// OTP Verification
app.post("/otp/verify", verifyOtp);
app.post('/otp/resend', resendOtp)
// Google Sign-in
app.post("/google-native", handleNativeGoogle);

// Refresh token
app.post("/refresh", refreshUserToken);

//Get name of IIT
app.post("/get-iit", iitNameExporter);

//Complete-profile
app.post("/complete-profile/mentor", authenticateUser, uploadFile, CompleteProfileMentor);
app.post("/complete-profile/student", authenticateUser, CompleteProfileStudent);

//Profile Update
app.patch("/profile", authenticateUser, updateUserProfile);

//Forgot Password
app.post('/forgot-password', forgotPassword);
app.post('/verify-forgot-password', verifyForgotPasswordOtp);
app.post('/reset-password', resetPassword)

// App Settings
app.get('/config/settings', async (req, res) => {
  try {
    const prisma = (await import("../config/db.ts")).default;
    const settings = await prisma.appSetting.findMany();
    const configMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(configMap);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default app;
