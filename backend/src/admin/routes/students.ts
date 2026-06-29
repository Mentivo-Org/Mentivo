import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import admin from '../config/firebase.ts';

const router = Router();

// Protect all routes
router.use(authenticateAdmin);

// List all students
router.get('/', async (req, res) => {
  const { search } = req.query;
  
  const where: any = { role: 'student' };
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const students = await prisma.user.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
  res.json(students);
});

// Update student details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, grade } = req.body;

  const updatedStudent = await prisma.user.update({
    where: { id },
    data: { name, email, phone, grade },
  });

  res.json(updatedStudent);
});

// Delete student — removes from both Prisma DB and Firebase Auth
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Fetch the user's email before deleting so we can look up Firebase UID
  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });

  // 1. Delete from Firebase Auth (non-fatal if user doesn't exist there)
  if (user?.email) {
    try {
      const firebaseUser = await admin.auth().getUserByEmail(user.email);
      await admin.auth().deleteUser(firebaseUser.uid);
      console.log(`[Admin] Deleted Firebase Auth user: ${user.email}`);
    } catch (authErr: any) {
      // auth/user-not-found is fine — just means they signed up via a method
      // that didn't create a Firebase Auth entry (e.g. email/password via backend only)
      if (authErr.code !== 'auth/user-not-found') {
        console.error(`[Admin] Failed to delete Firebase Auth for ${user.email}:`, authErr.message);
      }
    }
  }

  // 2. Delete from database
  await prisma.user.delete({ where: { id } });

  res.json({ message: 'Student deleted successfully.' });
});

export default router;