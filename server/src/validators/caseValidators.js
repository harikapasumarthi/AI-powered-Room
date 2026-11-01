import { z } from 'zod';
import { EVIDENCE_TYPES, GENRES } from '../config/difficulty.js';

export const createCaseRequestSchema = z
  .object({
    premise: z.string().trim().min(20).max(500),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    genre: z.enum(GENRES).default('theft'),
    settingPreference: z.string().trim().max(160).optional().default(''),
  })
  .strict();

const safeText = (max = 2000) => z.string().trim().min(1).max(max);

export const generatedCaseSchema = z
  .object({
    title: safeText(120),
    briefing: safeText(1200),
    setting: safeText(160),
    suspects: z
      .array(
        z
          .object({
            id: z.string().regex(/^suspect_[1-9][0-9]*$/),
            name: safeText(80),
            role: safeText(100),
            publicBio: safeText(500),
            publicAlibi: safeText(500),
            publicMotive: safeText(500),
          })
          .strict(),
      )
      .min(3)
      .max(5),
    evidence: z
      .array(
        z
          .object({
            id: z.string().regex(/^evidence_[1-9][0-9]*$/),
            type: z.enum(EVIDENCE_TYPES),
            title: safeText(120),
            source: safeText(120),
            timestamp: safeText(80),
            teaser: safeText(240),
            content: z.record(z.string(), z.unknown()),
            confidence: z.enum(['direct', 'circumstantial', 'testimonial']),
            relatedSuspectIds: z.array(z.string().regex(/^suspect_[1-9][0-9]*$/)),
            isDecisive: z.boolean(),
          })
          .strict(),
      )
      .min(5)
      .max(9),
    timeline: z
      .array(
        z
          .object({
            time: safeText(80),
            event: safeText(500),
            sourceEvidenceIds: z.array(z.string().regex(/^evidence_[1-9][0-9]*$/)),
          })
          .strict(),
      )
      .min(3)
      .max(30),
    hints: z.array(safeText(500)).min(2).max(3),
    solution: z
      .object({
        culpritId: z.string().regex(/^suspect_[1-9][0-9]*$/),
        motive: safeText(1000),
        method: safeText(1000),
        explanation: safeText(3000),
        timelineReconstruction: z.array(safeText(500)).min(2).max(20),
        decisiveEvidenceIds: z.array(z.string().regex(/^evidence_[1-9][0-9]*$/)).min(2),
        redHerringExplanations: z.array(safeText(800)).min(1).max(10),
      })
      .strict(),
  })
  .strict();

export const accusationRequestSchema = z
  .object({
    suspectId: z.string().min(1).max(100),
    reasoning: z.string().trim().max(500).optional().default(''),
  })
  .strict();

export function validateGeneratedCase(raw, difficulty) {
  const parsed = generatedCaseSchema.parse(raw);
  const expected = { easy: [3, 5, 2], medium: [4, 7, 3], hard: [5, 9, 3] }[difficulty];

  if (
    parsed.suspects.length !== expected[0] ||
    parsed.evidence.length !== expected[1] ||
    parsed.hints.length !== expected[2]
  ) {
    throw new Error('Generated case counts do not match the selected difficulty.');
  }

  const suspects = new Set(parsed.suspects.map(({ id }) => id));
  const evidence = new Set(parsed.evidence.map(({ id }) => id));
  if (suspects.size !== parsed.suspects.length || evidence.size !== parsed.evidence.length) {
    throw new Error('Generated case contains duplicate IDs.');
  }
  if (!suspects.has(parsed.solution.culpritId)) {
    throw new Error('Generated culprit does not reference a suspect.');
  }
  if (parsed.evidence.filter((item) => item.isDecisive).length < 2) {
    throw new Error('Generated case must contain at least two decisive clues.');
  }
  if (parsed.solution.decisiveEvidenceIds.some((id) => !evidence.has(id))) {
    throw new Error('Solution references unknown decisive evidence.');
  }
  const markedDecisive = new Set(parsed.evidence.filter((item) => item.isDecisive).map((item) => item.id));
  if (parsed.solution.decisiveEvidenceIds.some((id) => !markedDecisive.has(id))) {
    throw new Error('Solution decisive clues must be marked as decisive evidence.');
  }
  if (
    parsed.evidence.some((item) => item.relatedSuspectIds.some((id) => !suspects.has(id))) ||
    parsed.timeline.some((event) => event.sourceEvidenceIds.some((id) => !evidence.has(id)))
  ) {
    throw new Error('Generated case contains an unknown cross-reference.');
  }

  return parsed;
}
