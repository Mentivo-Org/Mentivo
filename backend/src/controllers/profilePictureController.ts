import { supabaseAdmin } from "../lib/supabaseAdmin.ts";
import prisma from "../config/db.ts";
import multer from "multer";
import type { Request, Response } from "express";
import mime from 'mime-types';

const bucketName = process.env.SUPABASE_PROFILE_PICTURE_BUCKET_NAME || 'mentivo-profile-pictures';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB for profile pictures
  }
});

export const uploadProfilePicMiddleware = upload.single('profilePic');

export const uploadProfilePicture = async (req: Request, res: Response) => {
    const user = req.user;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "No profile picture uploaded" });
    }

    try {
        const fileExtension = mime.extension(file.mimetype) || 'jpg';
        const fileName = `${user?.id}-${Date.now()}.${fileExtension}`;
        var destinationPath;
        if(user?.role==='mentor') {
            destinationPath = `mentors/${fileName}`;
        }
        else {
            destinationPath = `students/${fileName}`;

        }

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(destinationPath, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return res.status(500).json({
                error: 'Upload Error',
                message: uploadError.message,
            });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(destinationPath);

        const updatedProfile = await prisma.user.update({
            where: { id: user?.id },
            data: { photo_url: urlData.publicUrl }
        });

        return res.status(200).json({
            message: 'Profile picture updated successfully',
            photo_url: urlData.publicUrl,
            profile: updatedProfile
        });
    } catch (err) {
        console.error('Profile Picture Upload Exception:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
