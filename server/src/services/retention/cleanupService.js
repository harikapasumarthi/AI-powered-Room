import { env } from '../../config/env.js';
import { Case } from '../../models/Case.js';
import { CaseSolution } from '../../models/CaseSolution.js';
import { PlayerProgress } from '../../models/PlayerProgress.js';
import { PlayerSession } from '../../models/PlayerSession.js';

export async function cleanupExpiredRecords(now = new Date()) {
  const expiredCases = await Case.find({ expiresAt: { $lte: now } }).select('_id').lean();
  for (const { _id: caseId } of expiredCases) {
    await PlayerProgress.deleteMany({ caseId });
    await CaseSolution.deleteOne({ caseId });
    await Case.deleteOne({ _id: caseId, expiresAt: { $lte: now } });
  }
  await PlayerSession.deleteMany({ $or: [{ expiresAt: { $lte: now } }, { revokedAt: { $ne: null } }] });
  return { expiredCases: expiredCases.length };
}

export function startRetentionCleanup() {
  const interval = env.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
  const timer = setInterval(() => {
    cleanupExpiredRecords().catch((error) => {
      process.stderr.write(`Retention cleanup failed: ${error.message}\n`);
    });
  }, interval);
  timer.unref();
  return timer;
}
