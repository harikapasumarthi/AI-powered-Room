import mongoose from 'mongoose';
import { DIFFICULTY_RULES } from '../config/difficulty.js';
import { createSession, touchSession } from '../services/sessions/sessionService.js';
import { generateMystery } from '../services/gemini/geminiService.js';
import {
  buildResult,
  findOwnedCase,
  persistGeneratedCase,
  serializeCase,
} from '../services/cases/caseService.js';
import { calculateScore } from '../services/scoring/scoreCase.js';
import { CaseSolution } from '../models/CaseSolution.js';
import { PlayerProgress } from '../models/PlayerProgress.js';
import { AppError } from '../utils/AppError.js';
import { toSafeContent } from '../services/cases/caseSerializer.js';

export async function createCase(request, response) {
  const requestData = request.validatedBody;
  const { data: generated, mode } = await generateMystery(requestData);
  const existingSession = Boolean(request.session);
  const session = request.session || (await createSession(response));
  request.session = session;
  if (existingSession) await touchSession(request, response);

  const data = await persistGeneratedCase({
    generated,
    requestData,
    generationMode: mode,
    sessionTokenHash: session.tokenHash,
  });
  response.status(201).json({ success: true, data });
}

export async function getCase(request, response) {
  const { caseDocument, progress } = await findOwnedCase(
    request.params.id,
    request.session.tokenHash,
  );
  response.json({ success: true, data: serializeCase(caseDocument, progress) });
}

export async function discoverEvidence(request, response) {
  const { caseDocument, progress } = await findOwnedCase(
    request.params.id,
    request.session.tokenHash,
  );
  if (caseDocument.status !== 'active' || progress.status !== 'active') {
    throw new AppError(409, 'CASE_ALREADY_COMPLETED', 'This investigation is already complete.');
  }
  if (!mongoose.isValidObjectId(request.params.clueId)) {
    throw new AppError(404, 'EVIDENCE_NOT_FOUND', 'This evidence could not be found.');
  }
  const evidence = caseDocument.evidence.id(request.params.clueId);
  if (!evidence) throw new AppError(404, 'EVIDENCE_NOT_FOUND', 'This evidence could not be found.');
  // Atomic add-to-set keeps duplicate or concurrent discovery from awarding twice.
  await PlayerProgress.updateOne(
    { _id: progress._id },
    { $addToSet: { discoveredEvidenceIds: evidence._id } },
  );
  const currentProgress = await PlayerProgress.findById(progress._id);
  const content = toSafeContent(evidence.content || {});
  response.json({
    success: true,
    data: {
      evidence: {
        evidenceId: String(evidence._id),
        title: evidence.title,
        category: evidence.type,
        teaser: evidence.teaser,
        content: { ...content, source: evidence.source, timestamp: evidence.timestamp },
      },
      progress: {
        discoveredEvidenceIds: currentProgress.discoveredEvidenceIds.map(String),
        hintsUsed: currentProgress.hintsUsed,
        hintsRemaining: DIFFICULTY_RULES[caseDocument.difficulty].hints - currentProgress.hintsUsed,
      },
    },
  });
}

export async function requestHint(request, response) {
  const { caseDocument, progress } = await findOwnedCase(
    request.params.id,
    request.session.tokenHash,
  );
  if (caseDocument.status !== 'active' || progress.status !== 'active') {
    throw new AppError(409, 'CASE_ALREADY_COMPLETED', 'Hints are unavailable after an accusation.');
  }
  const hintLimit = DIFFICULTY_RULES[caseDocument.difficulty].hints;
  const solution = await CaseSolution.findOne({ caseId: caseDocument._id }).select('hints');
  if (!solution) {
    throw new AppError(503, 'GEMINI_INVALID_OUTPUT', 'The next hint is unavailable.');
  }
  // Enforce the limit atomically so simultaneous requests cannot overdraw hints.
  const updatedProgress = await PlayerProgress.findOneAndUpdate(
    { _id: progress._id, status: 'active', hintsUsed: { $lt: hintLimit } },
    { $inc: { hintsUsed: 1 } },
    { new: true },
  );
  if (!updatedProgress) {
    throw new AppError(409, 'NO_HINTS_REMAINING', 'No hints remain for this case.');
  }
  const hint = solution.hints[updatedProgress.hintsUsed - 1];
  if (!hint) throw new AppError(503, 'GEMINI_INVALID_OUTPUT', 'The next hint is unavailable.');
  response.json({
    success: true,
    data: {
      hint,
      progress: { hintsUsed: updatedProgress.hintsUsed, hintsRemaining: hintLimit - updatedProgress.hintsUsed },
    },
  });
}

export async function accuseSuspect(request, response) {
  const { caseDocument, progress } = await findOwnedCase(
    request.params.id,
    request.session.tokenHash,
  );
  if (caseDocument.status !== 'active' || progress.status !== 'active') {
    throw new AppError(409, 'CASE_ALREADY_COMPLETED', 'This case has already received an accusation.');
  }
  if (!mongoose.isValidObjectId(request.validatedBody.suspectId)) {
    throw new AppError(404, 'SUSPECT_NOT_FOUND', 'Choose a suspect from this case.');
  }
  const suspect = caseDocument.suspects.id(request.validatedBody.suspectId);
  if (!suspect) throw new AppError(404, 'SUSPECT_NOT_FOUND', 'Choose a suspect from this case.');

  const solution = await CaseSolution.findOne({ caseId: caseDocument._id }).select('culpritId');
  if (!solution) throw new AppError(500, 'INTERNAL_SERVER_ERROR', 'The case result is unavailable.');
  const isCorrect = String(suspect._id) === String(solution.culpritId);
  const scoreBreakdown = calculateScore({
    difficulty: caseDocument.difficulty,
    isCorrect,
    discoveredEvidenceCount: progress.discoveredEvidenceIds.length,
    hintsUsed: progress.hintsUsed,
  });
  const submittedAt = new Date();
  const update = await PlayerProgress.updateOne(
    {
      _id: progress._id,
      status: 'active',
      'accusation.submittedAt': null,
    },
    {
      $set: {
        accusation: {
          suspectId: suspect._id,
          reasoning: request.validatedBody.reasoning,
          isCorrect,
          submittedAt,
        },
        score: scoreBreakdown.total,
        scoreBreakdown,
        status: 'completed',
      },
    },
  );
  if (update.modifiedCount !== 1) {
    throw new AppError(409, 'CASE_ALREADY_COMPLETED', 'This case has already received an accusation.');
  }
  progress.accusation = {
    suspectId: suspect._id,
    reasoning: request.validatedBody.reasoning,
    isCorrect,
    submittedAt,
  };
  progress.score = scoreBreakdown.total;
  progress.scoreBreakdown = scoreBreakdown;
  progress.status = 'completed';
  caseDocument.status = 'completed';
  caseDocument.completedAt = submittedAt;
  await caseDocument.save();

  response.json({ success: true, data: await buildResult(caseDocument, progress) });
}

export async function getResult(request, response) {
  const { caseDocument, progress } = await findOwnedCase(
    request.params.id,
    request.session.tokenHash,
  );
  response.json({ success: true, data: await buildResult(caseDocument, progress) });
}
