import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipFailedRequests: true,
    message: { success: false, error: { code: 'RATE_LIMITED', message } },
  });

export const caseGenerationLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Too many case generation requests. Please wait and try again.',
);
export const hintLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many hint requests. Please wait and try again.',
);
