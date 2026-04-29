import { Router } from 'express';
import { handleNativeGoogle, loginWithEmail, sendOtp, verifyOtp } from '../controllers/loginController.js'

const app = Router()

// backend/routes/auth.js
app.post('/login', loginWithEmail);

// Send OTP
app.post('/otp/send', sendOtp);

// Verify OTP
app.post('/otp/verify', verifyOtp);

// Google Sign-in
app.post('/google-native', handleNativeGoogle)

// router.post('/verify', async (req, res) => {
//     // Basic unauthenticated verify for test purposes without firebase key
//     const { phone, role, name, uid } = req.body;
//     try {
//         let user = await db.user.findUnique({
//             where: { phone }
//         });

//         if (!user) {
//             user = await db.user.create({
//                 data: {
//                     phone,
//                     role: role || 'STUDENT',
//                     name,
//                     firebase_uid: uid
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
