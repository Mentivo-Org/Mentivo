import { Router } from 'express';
import { handleNativeGoogle, loginWithEmail, refreshUserToken, signUpWithEmail, verifyOtp } from '../controllers/loginController.ts'
import { authenticateUser } from '../auth/authenticateUser.ts';

const app = Router();

// backend/routes/auth.js
app.post('/signup', signUpWithEmail);
app.post('/login', loginWithEmail);

// OTP Verification
app.post('/otp/verify', verifyOtp);

// Google Sign-in
app.post('/google-native', handleNativeGoogle)

// Refresh token
app.post('/refresh', refreshUserToken)

// router.post('/verify', async (req, res) => {
//     // Basic unauthenticated verify for test purposes
//     const { email, role, name, uid } = req.body;
//     try {
//         let user = await db.user.findUnique({
//             where: { email }
//         });

//         if (!user) {
//             user = await db.user.create({
//                 data: {
//                     email,
//                     role: role || 'STUDENT',
//                     name,
//                     // firebase_uid: uid // Using Supabase UID now
//                 }
//             });
            
//             if (role === 'STUDENT' || !role) {
//                 await db.wallet.create({
//                     data: { userId: user.id, balance: 0 }
//                 });
//             } else if (role === 'MENTOR') {
//                 await db.mentorBalance.create({
//                     data: { mentorId: user.id }
//                 });
//                 await db.mentorProfile.create({
//                     data: { 
//                         mentorId: user.id,
//                         iit_name: "IIT TBD",
//                         isOnline: false
//                     }
//                 });
//             }
//         }
        
//         res.json({ success: true, user });
//     } catch (e) {
//         console.error(e);
//         res.status(500).json({ error: e.message });
//     }
// });

export default app;
