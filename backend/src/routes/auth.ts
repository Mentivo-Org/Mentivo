import { Router } from "express";
import {
  CompleteProfileMentor,
  CompleteProfileStudent,
  handleNativeGoogle,
  loginWithEmail,
  refreshUserToken,
  resendOtp,
  signUpWithEmail,
  verifyOtp,
  whoAmI,
} from "../controllers/loginController.ts";
import { authenticateUser } from "../auth/authenticateUser.ts";
import { iitNameExporter } from "../controllers/iitNameController.ts";

const app = Router();

//whoami
app.get('/whoami', authenticateUser, whoAmI)

// backend/routes/auth.js
app.post("/signup", signUpWithEmail);
app.post("/login", loginWithEmail);

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
app.post("/complete-profile/mentor", authenticateUser, CompleteProfileMentor);
app.post("/complete-profile/student", authenticateUser, CompleteProfileStudent);

export default app;
