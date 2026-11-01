import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { attachOptionalSession, revokeSession } from '../services/sessions/sessionService.js';

const router = Router();

router.delete(
  '/',
  requireDatabase,
  attachOptionalSession,
  asyncHandler(async (request, response) => {
    await revokeSession(request, response);
    response.json({ success: true, data: { sessionEnded: true } });
  }),
);

export default router;
