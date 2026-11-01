import { DIFFICULTY_RULES } from '../../config/difficulty.js';

export function calculateScore({ difficulty, isCorrect, discoveredEvidenceCount, hintsUsed }) {
  const basePoints = isCorrect ? DIFFICULTY_RULES[difficulty].basePoints : 0;
  const evidencePoints = discoveredEvidenceCount * 5;
  const hintPenalty = hintsUsed * 10;
  const total = Math.max(0, basePoints + evidencePoints - hintPenalty);

  return {
    basePoints,
    evidencePoints,
    hintPenalty,
    total,
  };
}
