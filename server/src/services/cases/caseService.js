import mongoose from 'mongoose';
import { CASE_RETENTION_MS } from '../../config/difficulty.js';
import { env } from '../../config/env.js';
import { Case } from '../../models/Case.js';
import { CaseSolution } from '../../models/CaseSolution.js';
import { PlayerProgress } from '../../models/PlayerProgress.js';
import { AppError } from '../../utils/AppError.js';
import { toPublicCase, toResult } from './caseSerializer.js';

export async function persistGeneratedCase({ generated, requestData, generationMode, sessionTokenHash }) {
  const suspectIds = new Map(
    generated.suspects.map((suspect) => [suspect.id, new mongoose.Types.ObjectId()]),
  );
  const evidenceIds = new Map(
    generated.evidence.map((evidence) => [evidence.id, new mongoose.Types.ObjectId()]),
  );
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CASE_RETENTION_MS(env.CASE_RETENTION_DAYS));
  const caseId = new mongoose.Types.ObjectId();

  const caseDocument = new Case({
    _id: caseId,
    title: generated.title,
    premise: requestData.premise,
    genre: requestData.genre,
    difficulty: requestData.difficulty,
    setting: generated.setting,
    briefing: generated.briefing,
    generationMode,
    suspects: generated.suspects.map(({ id, ...suspect }) => ({ _id: suspectIds.get(id), ...suspect })),
    evidence: generated.evidence.map(({ id, relatedSuspectIds: _relatedSuspectIds, isDecisive: _isDecisive, ...evidence }) => ({
      _id: evidenceIds.get(id),
      ...evidence,
    })),
    timeline: generated.timeline.map((event) => ({
      ...event,
      sourceEvidenceIds: event.sourceEvidenceIds.map((id) => evidenceIds.get(id)),
    })),
    status: 'active',
    lastActivityAt: now,
    expiresAt,
  });

  const solution = generated.solution;
  const solutionDocument = new CaseSolution({
    caseId,
    culpritId: suspectIds.get(solution.culpritId),
    motive: solution.motive,
    method: solution.method,
    explanation: solution.explanation,
    completeTimeline: generated.timeline.map((event) => ({
      ...event,
      sourceEvidenceIds: event.sourceEvidenceIds.map((id) => evidenceIds.get(id)),
    })),
    timelineReconstruction: solution.timelineReconstruction,
    decisiveEvidenceIds: solution.decisiveEvidenceIds.map((id) => evidenceIds.get(id)),
    privateClueExplanations: solution.decisiveEvidenceIds.map((id) => ({
      evidenceId: evidenceIds.get(id),
      explanation: solution.explanation,
    })),
    redHerringExplanations: solution.redHerringExplanations,
    hints: generated.hints,
    relatedSuspectIdsByEvidence: generated.evidence.map((item) => ({
      evidenceId: evidenceIds.get(item.id),
      suspectIds: item.relatedSuspectIds.map((id) => suspectIds.get(id)),
    })),
  });
  const progressDocument = new PlayerProgress({
    caseId,
    sessionTokenHash,
    discoveredEvidenceIds: [],
    pinnedEvidenceIds: [],
    hintsUsed: 0,
    lastActivityAt: now,
    expiresAt,
  });

  try {
    await caseDocument.save();
    await solutionDocument.save();
    await progressDocument.save();
  } catch (error) {
    await Promise.allSettled([
      Case.deleteOne({ _id: caseId }),
      CaseSolution.deleteOne({ caseId }),
      PlayerProgress.deleteOne({ caseId, sessionTokenHash }),
    ]);
    throw error;
  }

  return toPublicCase(caseDocument, progressDocument, generationMode);
}

export async function findOwnedCase(caseId, sessionTokenHash) {
  if (!mongoose.isValidObjectId(caseId)) {
    throw new AppError(404, 'CASE_NOT_FOUND', 'This case could not be found.');
  }
  const caseDocument = await Case.findById(caseId);
  if (!caseDocument) throw new AppError(404, 'CASE_NOT_FOUND', 'This case could not be found.');
  if (caseDocument.expiresAt <= new Date()) {
    throw new AppError(410, 'CASE_EXPIRED', 'This case has expired after 30 days without activity.');
  }
  const progress = await PlayerProgress.findOne({ caseId, sessionTokenHash });
  if (!progress) {
    throw new AppError(403, 'UNAUTHORIZED_CASE_ACCESS', 'This session does not own this case.');
  }
  await touchCaseActivity(caseDocument, progress);
  return { caseDocument, progress };
}

export async function touchCaseActivity(caseDocument, progress) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CASE_RETENTION_MS(env.CASE_RETENTION_DAYS));
  caseDocument.lastActivityAt = now;
  caseDocument.expiresAt = expiresAt;
  progress.lastActivityAt = now;
  progress.expiresAt = expiresAt;
  await Promise.all([caseDocument.save(), progress.save()]);
}

export function serializeCase(caseDocument, progress) {
  return toPublicCase(caseDocument, progress, caseDocument.generationMode);
}

export async function buildResult(caseDocument, progress) {
  if (progress.status !== 'completed' || !progress.accusation?.submittedAt) {
    throw new AppError(409, 'CASE_NOT_COMPLETED', 'Submit an accusation before viewing the solution.');
  }
  const solution = await CaseSolution.findOne({ caseId: caseDocument._id });
  if (!solution) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'The case result is unavailable.');
  return toResult(caseDocument, solution, progress);
}
