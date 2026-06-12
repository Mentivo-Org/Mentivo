import { supabaseAdmin } from "../lib/supabaseAdmin.ts";
import prisma from "../config/db.ts";
import multer from "multer";
import type { Request, Response } from "express";
import mime from 'mime-types'

const supabaseBucketName = process.env.SUPABASE_ID_CARD_BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  }
});

export const uploadFile = upload.single('idCard');

export const CompleteProfileMentor = async (req: Request, res: Response) => {
    const user=req.user;
    const {college, year, branch, expertise } = req.body;
    const file=req.file;
    if(!file) {
        return res.status(400).json({
            error: "No ID card uploaded"
        })
    }
    console.log(req.body);
    try {
      const fileExtension = mime.extension(file.mimetype);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const destinationPath = `uploads/${fileName}`;

      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(supabaseBucketName || 'Mentivo ID-Card')
        .upload(destinationPath, file.buffer, {
          contentType: file.mimetype, // Preserves proper file rendering types
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({
          error: 'Upload Error',
          message: uploadError.message,
        });
      }

      // 5. Construct the asset's Public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(supabaseBucketName || 'Mentivo ID-Card')
        .getPublicUrl(destinationPath);

      const updateUser = await prisma.user.update({
        where: {id: user?.id},
        data: {
            profile_completed: true,
            mentorProfile: {
                create: {
                    iit_name: college,
                    branch,
                    year: Number(year),
                    expertise,
                    id_doc_url: urlData.publicUrl
                }
            }
        }
      });

      return res.status(201).json({
        message: 'Profile completed successfully. Verification pending',
        user: updateUser
      });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            error: err
        })
    }
};

export const CompleteProfileStudent = async (req: Request, res: Response) => {
  const { name, email, phone, grade } = req.body;
  const user = req.user;

  if (name !== user?.name || email !== user?.email) {
    return res
      .status(401)
      .json({ error: "Please use valid account to send the request" });
  }

  try {
    if (user?.profile_completed === true) {
      return res.status(404).json({ error: "Profile already completed" });
    }

    const prismaUser = await prisma.user.update({
      where: { id: user?.id, profile_completed: false },
      data: { phone, grade, profile_completed: true },
    });

    return res
      .status(201)
      .json({ message: "Account successfully updated", user: prismaUser });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};
