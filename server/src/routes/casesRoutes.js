import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { caseGenerationLimiter, hintLimiter } from '../middleware/rateLimits.js';
import { validateBody } from '../middleware/validate.js';
import { attachOptionalSession, requireSession } from '../services/sessions/sessionService.js';
import { createCaseRequestSchema, accusationRequestSchema } from '../validators/caseValidators.js';
import {
  accuseSuspect,
  createCase,
  discoverEvidence,
  getCase,
  getResult,
  requestHint,
} from '../controllers/casesController.js';

const router = Router();

router.post(
  '/',
  requireDatabase,
  caseGenerationLimiter,
  attachOptionalSession,
  validateBody(createCaseRequestSchema),
  asyncHandler(createCase),
);
router.get('/:id', requireDatabase, attachOptionalSession, requireSession, asyncHandler(getCase));
router.post(
  '/:id/clues/:clueId/discover',
  requireDatabase,
  attachOptionalSession,
  requireSession,
  asyncHandler(discoverEvidence),
);
router.post(
  '/:id/hints',
  requireDatabase,
  hintLimiter,
  attachOptionalSession,
  requireSession,
  asyncHandler(requestHint),
);
router.post(
  '/:id/accuse',
  requireDatabase,
  attachOptionalSession,
  requireSession,
  validateBody(accusationRequestSchema),
  asyncHandler(accuseSuspect),
);
router.get('/:id/result', requireDatabase, attachOptionalSession, requireSession, asyncHandler(getResult));

export default router;
