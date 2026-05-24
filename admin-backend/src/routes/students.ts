import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';

const router = Router();

// Protect all routes
router.use(authenticateAdmin);

// List all students
router.get('/', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'student' },
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

// Delete student
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  await prisma.user.delete({
    where: { id },
  });

  res.json({ message: 'Student deleted successfully.' });
});

export default router;