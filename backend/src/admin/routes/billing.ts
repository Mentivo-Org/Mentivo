import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import { getMentorActiveRateByProfile, getFreeCallDurationMins } from '../../v1/utils/pricing.ts';

const router = Router();
router.use(authenticateAdmin);

const MENTOR_SHARE = 0.70;

router.post('/audit', async (req, res) => {
  try {
    const { callId, userId } = req.body;
    let sessions = [];

    if (callId) {
      const session = await prisma.callSession.findUnique({
        where: { id: callId },
        include: {
          mentor: { include: { mentorProfile: true } },
          student: { include: { wallet: true } }
        }
      });
      if (session && session.status === 'settled') sessions = [session];
    } else if (userId) {
      sessions = await prisma.callSession.findMany({
        where: { 
          student_id: userId,
          status: 'settled'
        },
        include: {
          mentor: { include: { mentorProfile: true } },
          student: { include: { wallet: true } }
        }
      });
    } else {
      return res.status(400).json({ error: 'Provide callId or userId' });
    }

    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;
    
    const results = [];
    for (const session of sessions) {
      const { ratePerMin } = await getMentorActiveRateByProfile(session.mentor?.mentorProfile);
      const isFree = session.is_free;
      const durationSecs = session.durationSecs || 0;
      
      const billableSecs = isFree ? Math.max(0, durationSecs - freeSeconds) : durationSecs;
      const billableMins = Math.ceil(billableSecs / 60);
      const expectedTotalCharge = billableMins * ratePerMin;
      
      let expectedAmountCharged = 0;
      if (expectedTotalCharge > 0) {
        expectedAmountCharged = expectedTotalCharge;
      }
      
      const expectedMentorEarning = expectedAmountCharged * MENTOR_SHARE;
      const expectedPlatformFee = expectedAmountCharged - expectedMentorEarning;
      const expectedCoachingShare = session.student.coachingCenterId ? expectedAmountCharged * 0.05 : 0;
      
      const storedAmountCharged = Number(session.amountCharged || 0);
      const storedMentorEarning = Number(session.mentorEarning || 0);
      
      const deltaAmountCharged = expectedAmountCharged - storedAmountCharged;
      const deltaMentorEarning = expectedMentorEarning - storedMentorEarning;
      
      const delta = {
        studentDebit: deltaAmountCharged,
        mentorCredit: deltaMentorEarning,
        coachingCredit: session.student.coachingCenterId ? (expectedAmountCharged * 0.05) - (storedAmountCharged * 0.05) : 0
      };

      const hasMismatch = delta.studentDebit !== 0 || delta.mentorCredit !== 0 || delta.coachingCredit !== 0;
      
      results.push({
        sessionId: session.id,
        studentId: session.student_id,
        mentorId: session.mentor_id,
        durationSecs,
        settledAt: session.settledAt,
        stored: { 
          amountCharged: storedAmountCharged, 
          mentorEarning: storedMentorEarning, 
          platformFee: Number(session.platformFee || 0)
        },
        expected: { 
          amountCharged: expectedAmountCharged, 
          mentorEarning: expectedMentorEarning, 
          platformFee: expectedPlatformFee 
        },
        delta,
        hasMismatch
      });
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/correct', async (req, res) => {
  try {
    const { sessionId, applyDelta } = req.body;
    if (!applyDelta || !sessionId) {
      return res.status(400).json({ error: 'Missing sessionId or applyDelta true' });
    }

    const session = await prisma.callSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: { include: { mentorProfile: true } },
        student: { include: { wallet: true } }
      }
    });

    if (!session || session.status !== 'settled') {
      return res.status(400).json({ error: 'Session not found or not settled' });
    }

    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;
    const { ratePerMin } = await getMentorActiveRateByProfile(session.mentor?.mentorProfile);
    
    const isFree = session.is_free;
    const durationSecs = session.durationSecs || 0;
    const billableSecs = isFree ? Math.max(0, durationSecs - freeSeconds) : durationSecs;
    const billableMins = Math.ceil(billableSecs / 60);
    const expectedAmountCharged = billableMins * ratePerMin;
    const expectedMentorEarning = expectedAmountCharged * MENTOR_SHARE;
    const expectedPlatformFee = expectedAmountCharged - expectedMentorEarning;
    
    const storedAmountCharged = Number(session.amountCharged || 0);
    const storedMentorEarning = Number(session.mentorEarning || 0);
    
    const deltaAmountCharged = expectedAmountCharged - storedAmountCharged;
    const deltaMentorEarning = expectedMentorEarning - storedMentorEarning;
    const deltaCoachingCredit = session.student.coachingCenterId ? (expectedAmountCharged * 0.05) - (storedAmountCharged * 0.05) : 0;

    if (deltaAmountCharged === 0 && deltaMentorEarning === 0 && deltaCoachingCredit === 0) {
      return res.json({ success: true, message: 'No correction needed' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Adjust Student Wallet (decrement by deltaAmountCharged)
      if (deltaAmountCharged !== 0) {
        await tx.wallet.update({
          where: { userId: session.student_id },
          data: { balance: { decrement: deltaAmountCharged } }
        });
      }

      // 2. Adjust Mentor Balance
      if (deltaMentorEarning !== 0) {
        await tx.mentorBalance.update({
          where: { mentorId: session.mentor_id },
          data: {
            pendingPayout: { increment: deltaMentorEarning },
            totalEarned: { increment: deltaMentorEarning }
          }
        });
      }

      // 3. Adjust Coaching Center Balance
      if (deltaCoachingCredit !== 0 && session.student.coachingCenterId) {
        await tx.coachingCenterBalance.update({
          where: { centerId: session.student.coachingCenterId },
          data: {
            pendingPayout: { increment: deltaCoachingCredit },
            totalEarned: { increment: deltaCoachingCredit }
          }
        });
      }

      // 4. Update CallSession Record
      await tx.callSession.update({
        where: { id: sessionId },
        data: {
          amountCharged: expectedAmountCharged,
          mentorEarning: expectedMentorEarning,
          platformFee: expectedPlatformFee
        }
      });

      // 5. Audit Log
      await tx.logEntry.create({
        data: {
          level: 'INFO',
          source: 'admin',
          message: `Billing correction applied for call ${sessionId}`,
          metadata: {
            sessionId,
            deltaAmountCharged,
            deltaMentorEarning,
            deltaCoachingCredit
          }
        }
      });
    });

    res.json({ success: true, message: 'Correction applied successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper: compute audit result for a single session ───────────────────────
const round2 = (n: number) => Math.round(n * 100) / 100;

async function computeAuditResult(session: any, freeSeconds: number) {
  // Prefer the rate stored at settlement/creation time for historical accuracy.
  // Fall back to the mentor's current live rate only for legacy rows (pre-migration).
  const storedRate = session.ratePerMin ? Number(session.ratePerMin) : null;
  const { ratePerMin } = storedRate !== null && storedRate > 0
    ? { ratePerMin: storedRate }
    : await getMentorActiveRateByProfile(session.mentor?.mentorProfile);

  const isFree = session.is_free;
  const durationSecs = session.durationSecs || 0;

  const billableSecs = isFree ? Math.max(0, durationSecs - freeSeconds) : durationSecs;
  const billableMins = Math.ceil(billableSecs / 60);
  const expectedAmountCharged = round2(billableMins * ratePerMin);
  const expectedMentorEarning = round2(expectedAmountCharged * MENTOR_SHARE);
  const expectedPlatformFee = round2(expectedAmountCharged - expectedMentorEarning);

  const storedAmountCharged = round2(Number(session.amountCharged || 0));
  const storedMentorEarning = round2(Number(session.mentorEarning || 0));

  const delta = {
    studentDebit: round2(expectedAmountCharged - storedAmountCharged),
    mentorCredit: round2(expectedMentorEarning - storedMentorEarning),
    coachingCredit: session.student?.coachingCenterId
      ? round2((expectedAmountCharged * 0.05) - (storedAmountCharged * 0.05))
      : 0
  };

  const hasMismatch = delta.studentDebit !== 0 || delta.mentorCredit !== 0 || delta.coachingCredit !== 0;

  return {
    sessionId: session.id,
    studentId: session.student_id,
    mentorId: session.mentor_id,
    durationSecs,
    settledAt: session.settledAt,
    ratePerMin,
    stored: {
      amountCharged: storedAmountCharged,
      mentorEarning: storedMentorEarning,
      platformFee: round2(Number(session.platformFee || 0))
    },
    expected: {
      amountCharged: expectedAmountCharged,
      mentorEarning: expectedMentorEarning,
      platformFee: expectedPlatformFee
    },
    delta,
    hasMismatch,
    coachingCenterId: session.student?.coachingCenterId || null
  };
}

// ─── POST /audit-all ───────────────────────────────────────────────────────────
router.post('/audit-all', async (req, res) => {
  try {
    const limit = Math.min(Number(req.body.limit) || 500, 2000);
    const offset = Number(req.body.offset) || 0;

    const [total, sessions] = await Promise.all([
      prisma.callSession.count({ where: { status: 'settled' } }),
      prisma.callSession.findMany({
        where: { status: 'settled' },
        include: {
          mentor: { include: { mentorProfile: true } },
          student: { include: { wallet: true } }
        },
        orderBy: { settledAt: 'desc' },
        take: limit,
        skip: offset
      })
    ]);

    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;

    const results = await Promise.all(
      sessions.map((s) => computeAuditResult(s, freeSeconds))
    );

    const mismatches = results.filter((r) => r.hasMismatch);
    const summary = {
      totalScanned: results.length,
      totalSettled: total,
      mismatchCount: mismatches.length,
      totalDeltaStudentDebit: mismatches.reduce((a, r) => a + r.delta.studentDebit, 0),
      totalDeltaMentorCredit: mismatches.reduce((a, r) => a + r.delta.mentorCredit, 0),
      totalDeltaCoachingCredit: mismatches.reduce((a, r) => a + r.delta.coachingCredit, 0)
    };

    res.json({ summary, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /correct-all ────────────────────────────────────────────────────────
router.post('/correct-all', async (req, res) => {
  try {
    const { sessionIds } = req.body as { sessionIds: string[] };
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({ error: 'Provide a non-empty sessionIds array' });
    }

    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;

    let corrected = 0;
    let skipped = 0;
    const errors: { sessionId: string; error: string }[] = [];

    for (const sessionId of sessionIds) {
      try {
        const session = await prisma.callSession.findUnique({
          where: { id: sessionId },
          include: {
            mentor: { include: { mentorProfile: true } },
            student: { include: { wallet: true } }
          }
        });

        if (!session || session.status !== 'settled') {
          skipped++;
          continue;
        }

        const result = await computeAuditResult(session, freeSeconds);

        if (!result.hasMismatch) {
          skipped++;
          continue;
        }

        const { delta, expected, coachingCenterId } = result;

        await prisma.$transaction(async (tx) => {
          if (delta.studentDebit !== 0) {
            await tx.wallet.update({
              where: { userId: session.student_id },
              data: { balance: { decrement: delta.studentDebit } }
            });
          }
          if (delta.mentorCredit !== 0) {
            await tx.mentorBalance.update({
              where: { mentorId: session.mentor_id },
              data: {
                pendingPayout: { increment: delta.mentorCredit },
                totalEarned: { increment: delta.mentorCredit }
              }
            });
          }
          if (delta.coachingCredit !== 0 && coachingCenterId) {
            await tx.coachingCenterBalance.update({
              where: { centerId: coachingCenterId },
              data: {
                pendingPayout: { increment: delta.coachingCredit },
                totalEarned: { increment: delta.coachingCredit }
              }
            });
          }
          await tx.callSession.update({
            where: { id: sessionId },
            data: {
              amountCharged: expected.amountCharged,
              mentorEarning: expected.mentorEarning,
              platformFee: expected.platformFee
            }
          });
          await tx.logEntry.create({
            data: {
              level: 'INFO',
              source: 'admin',
              message: `[bulk] Billing correction applied for call ${sessionId}`,
              metadata: {
                sessionId,
                deltaAmountCharged: delta.studentDebit,
                deltaMentorEarning: delta.mentorCredit,
                deltaCoachingCredit: delta.coachingCredit
              }
            }
          });
        });

        corrected++;
      } catch (e: any) {
        errors.push({ sessionId, error: e.message });
      }
    }

    res.json({ corrected, skipped, errors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
