import { Router } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import * as callController from '../controllers/callController.ts';

const router = Router();

// POST /api/calls/initiate
router.post('/initiate', authenticateUser, callController.initiateCall);

// POST /api/calls/free-matchmaking
router.post('/free-matchmaking', authenticateUser, callController.freeMatchmaking);

// POST /api/calls/schedule
router.post('/schedule', authenticateUser, callController.scheduleCall);

// GET /api/calls/mentor/:mentorId/schedule
router.get('/mentor/:mentorId/schedule', callController.getMentorSchedule);

// GET /api/calls/mentor/sessions
router.get('/mentor/sessions', authenticateUser, callController.getMentorSessions);

// GET /api/calls/student/sessions
router.get('/student/sessions', authenticateUser, callController.getStudentSessions);

// GET /api/calls/student/schedule
router.get('/student/schedule', authenticateUser, callController.getStudentSchedule);

// GET /api/calls/student/upcoming
router.get('/student/upcoming', authenticateUser, callController.getStudentUpcoming);

// POST /api/calls/:id/start
router.post('/:id/start', authenticateUser, callController.startCall);

// POST /api/calls/:id/ringing
router.post('/:id/ringing', authenticateUser, callController.setCallRinging);

// PATCH /api/calls/:id/heartbeat
router.patch('/:id/heartbeat', authenticateUser, callController.sendHeartbeat);

// POST /api/calls/:id/end
router.post('/:id/end', authenticateUser, callController.endCall);

// POST /api/calls/:id/reject
router.post('/:id/reject', authenticateUser, callController.rejectCall);

// GET /api/calls/:id/token
router.get('/:id/token', authenticateUser, callController.getAgoraToken);

// GET /api/calls/:id/status
router.get('/:id/status', authenticateUser, callController.getCallStatus);

// POST /api/calls/:id/rate
router.post('/:id/rate', authenticateUser, callController.rateCall);

export default router;
