import { describe, expect, it } from 'vitest';
import { DIFFICULTY_RULES } from '../../src/config/difficulty.js';
import { toPublicCase } from '../../src/services/cases/caseSerializer.js';
import { calculateScore } from '../../src/services/scoring/scoreCase.js';
import { createMockCase } from '../../src/services/gemini/mockGenerator.js';
import { validateGeneratedCase } from '../../src/validators/caseValidators.js';

describe('difficulty and generation rules', () => {
  it.each([
    ['easy', 3, 5, 2], ['medium', 4, 7, 3], ['hard', 5, 9, 3],
  ])('%s has its configured public counts', (difficulty, suspects, evidence, hints) => {
    const generated = createMockCase({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty });
    expect(generated.suspects).toHaveLength(suspects);
    expect(generated.evidence).toHaveLength(evidence);
    expect(generated.hints).toHaveLength(hints);
    expect(DIFFICULTY_RULES[difficulty].suspects).toBe(suspects);
  });

  it('rejects malformed generator output and cross reference errors', () => {
    const valid = createMockCase({ premise: 'A sealed archive loses a rare handwritten map overnight.', difficulty: 'medium' });
    expect(() => validateGeneratedCase({ ...valid, evidence: valid.evidence.slice(1) }, 'medium')).toThrow();
    const invalidReference = structuredClone(valid);
    invalidReference.solution.culpritId = 'suspect_99';
    expect(() => validateGeneratedCase(invalidReference, 'medium')).toThrow();
  });
});

describe('server scoring', () => {
  it('applies base points, evidence points and hint penalties', () => {
    expect(calculateScore({ difficulty: 'medium', isCorrect: true, discoveredEvidenceCount: 4, hintsUsed: 2 }))
      .toEqual({ basePoints: 150, evidencePoints: 20, hintPenalty: 20, total: 150 });
  });

  it('keeps incorrect scores at zero after penalties', () => {
    expect(calculateScore({ difficulty: 'hard', isCorrect: false, discoveredEvidenceCount: 1, hintsUsed: 3 }))
      .toEqual({ basePoints: 0, evidencePoints: 5, hintPenalty: 30, total: 0 });
  });
});

describe('public case serialization', () => {
  const id = (value) => ({ toString: () => value });
  const caseDocument = {
    _id: id('case'), title: 'A Quiet Archive', difficulty: 'easy', briefing: 'A map is missing.', setting: 'Archive', generationMode: 'mock',
    suspects: [{ _id: id('s1'), name: 'Ari', role: 'Archivist', publicBio: 'Bio', publicAlibi: 'Alibi', publicMotive: 'Motive', privateNote: 'hidden' }],
    evidence: [
      { _id: id('e1'), type: 'document', title: 'Torn register', teaser: 'A marked line.', source: 'Register', timestamp: '8 PM', content: { body: 'Private artifact detail', culpritId: 's1' }, confidence: 'direct', isDecisive: true, relatedSuspectIds: [id('s1')] },
      { _id: id('e2'), type: 'witness', title: 'Witness note', teaser: 'A short statement.', source: 'Interview', timestamp: '9 PM', content: { statement: 'Saw a light.' }, confidence: 'testimonial' },
    ],
    timeline: [{ time: '8 PM', event: 'A door opens.', sourceEvidenceIds: [id('e1')] }],
  };
  const progress = { discoveredEvidenceIds: [id('e1')], hintsUsed: 0 };

  it('reveals only safe evidence fields and discovered artifact content', () => {
    const dto = toPublicCase(caseDocument, progress);
    expect(dto.evidence[0]).toEqual({ evidenceId: 'e1', title: 'Torn register', category: 'document', teaser: 'A marked line.', content: { body: 'Private artifact detail', source: 'Register', timestamp: '8 PM' } });
    expect(dto.evidence[1]).toEqual({ evidenceId: 'e2', title: 'Witness note', category: 'witness', teaser: 'A short statement.' });
    expect(JSON.stringify(dto)).not.toMatch(/culpritId|isDecisive|relatedSuspectIds|privateNote/);
  });
});
