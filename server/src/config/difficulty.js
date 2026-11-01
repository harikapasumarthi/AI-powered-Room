export const DIFFICULTY_RULES = Object.freeze({
  easy: { suspects: 3, evidence: 5, hints: 2, basePoints: 100 },
  medium: { suspects: 4, evidence: 7, hints: 3, basePoints: 150 },
  hard: { suspects: 5, evidence: 9, hints: 3, basePoints: 200 },
});

export const GENRES = Object.freeze([
  'murder_mystery',
  'theft',
  'disappearance',
  'cyber_mystery',
  'art_heist',
  'secret_blackmail',
]);

export const EVIDENCE_TYPES = Object.freeze([
  'chat',
  'email',
  'photo',
  'cctv',
  'document',
  'access_log',
  'witness',
  'audio_transcript',
  'timeline_event',
]);

export const CASE_RETENTION_MS = (days) => days * 24 * 60 * 60 * 1000;
