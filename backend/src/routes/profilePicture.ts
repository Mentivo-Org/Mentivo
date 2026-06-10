import { authenticateUser } from "../auth/authenticateUser.ts";
import { uploadProfilePicMiddleware, uploadProfilePicture } from "../controllers/profilePictureController.ts";
import { Router } from "express";
const app = Router();

// POST /api/mentors/me/profile-picture
app.post('/', authenticateUser, uploadProfilePicMiddleware, uploadProfilePicture);

export default app;