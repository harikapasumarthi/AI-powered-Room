import { createHmac, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { PlayerSession } from '../../models/PlayerSession.js';
import { AppError } from '../../utils/AppError.js';

const COOKIE_NAME = 'amr_session';
const cookieMaxAge = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
    path: '/api',
    maxAge: cookieMaxAge,
  };
}

function readCookie(header = '') {
  const entry = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)) : '';
}

export function hashSessionToken(token) {
  return createHmac('sha256', env.SESSION_SECRET).update(token).digest('hex');
}

export async function attachOptionalSession(request, _response, next) {
  try {
    let token = '';
    try {
      token = readCookie(request.headers.cookie);
    } catch {
      return next();
    }
    if (!token || token.length > 256) return next();
    const tokenHash = hashSessionToken(token);
    const session = await PlayerSession.findOne({
      sessionTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (session) request.session = { document: session, tokenHash };
    next();
  } catch (error) {
    next(error);
  }
}

export async function createSession(response) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cookieMaxAge);
  const session = await PlayerSession.create({
    sessionTokenHash: tokenHash,
    lastActivityAt: now,
    expiresAt,
  });
  response.cookie(COOKIE_NAME, token, cookieOptions());
  return { document: session, tokenHash };
}

export async function touchSession(request, response) {
  if (!request.session) {
    throw new AppError(401, 'UNAUTHORIZED_CASE_ACCESS', 'Start or resume this case using its valid session.');
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cookieMaxAge);
  const result = await PlayerSession.updateOne(
    { _id: request.session.document._id, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { lastActivityAt: now, expiresAt } },
  );
  if (result.matchedCount === 0) {
    request.session = null;
    throw new AppError(401, 'UNAUTHORIZED_CASE_ACCESS', 'This session has expired. Please create a new case.');
  }
  request.session.document.lastActivityAt = now;
  request.session.document.expiresAt = expiresAt;
  const token = readCookie(request.headers.cookie);
  response.cookie(COOKIE_NAME, token, cookieOptions());
}

export async function requireSession(request, response, next) {
  try {
    await touchSession(request, response);
    next();
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(request, response) {
  if (request.session) {
    await PlayerSession.updateOne(
      { _id: request.session.document._id },
      { $set: { revokedAt: new Date() } },
    );
  }
  response.clearCookie(COOKIE_NAME, cookieOptions());
}
