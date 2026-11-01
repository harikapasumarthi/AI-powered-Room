const HIDDEN_CONTENT_KEYS = new Set([
  'solution',
  'privateSolution',
  'culpritId',
  'isDecisive',
  'relatedSuspectIds',
  'privateClueExplanations',
  'redHerringExplanations',
  'hints',
  'hiddenExplanation',
  'culprit',
  'culpritName',
  'answer',
  'motive',
  'method',
  'explanation',
  'decisiveEvidenceIds',
  'relatedSuspects',
]);

export function toSafeContent(value) {
  if (Array.isArray(value)) return value.map(toSafeContent);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => {
        const normalized = key.replace(/[^a-z]/gi, '').toLowerCase();
        return !HIDDEN_CONTENT_KEYS.has(key) &&
          !['solution', 'privatesolution', 'culpritid', 'culprit', 'culpritname', 'answer', 'motive', 'method', 'explanation', 'isdecisive', 'relatedsuspectids', 'relatedsuspects', 'privateclueexplanations', 'redherringexplanations', 'hints', 'hiddenexplanation', 'decisiveevidenceids'].includes(normalized);
      })
      .map(([key, child]) => [key, toSafeContent(child)]),
  );
}

function evidenceDto(evidence, discoveredIds) {
  const evidenceId = String(evidence._id);
  const base = {
    evidenceId,
    title: evidence.title,
    category: evidence.type,
    teaser: evidence.teaser,
  };

  if (!discoveredIds.has(evidenceId)) return base;
  return {
    ...base,
    content: toSafeContent({
      ...(evidence.content || {}),
      source: evidence.source,
      timestamp: evidence.timestamp,
    }),
  };
}

export function toPublicCase(caseDocument, progress, generationMode = 'live') {
  const discoveredIds = new Set(progress.discoveredEvidenceIds.map(String));
  const rules = { easy: 2, medium: 3, hard: 3 };

  return {
    caseId: String(caseDocument._id),
    title: caseDocument.title,
    difficulty: caseDocument.difficulty,
    briefing: caseDocument.briefing,
    setting: caseDocument.setting,
    suspects: caseDocument.suspects.map((suspect) => ({
      suspectId: String(suspect._id),
      name: suspect.name,
      role: suspect.role,
      publicBio: suspect.publicBio,
      publicAlibi: suspect.publicAlibi,
      publicMotive: suspect.publicMotive,
    })),
    evidence: caseDocument.evidence.map((item) => evidenceDto(item, discoveredIds)),
    timeline: caseDocument.timeline.map((event) => ({
      time: event.time,
      event: event.event,
      sourceEvidenceIds: event.sourceEvidenceIds.map(String),
    })),
    progress: {
      discoveredEvidenceIds: [...discoveredIds],
      hintsUsed: progress.hintsUsed,
      hintsRemaining: Math.max(0, rules[caseDocument.difficulty] - progress.hintsUsed),
    },
    generationMode,
  };
}

export function toResult(caseDocument, solution, progress) {
  const decisive = new Set(solution.decisiveEvidenceIds.map(String));
  const explanations = new Map(
    solution.privateClueExplanations.map((item) => [String(item.evidenceId), item.explanation]),
  );
  const decisiveEvidence = caseDocument.evidence
    .filter((item) => decisive.has(String(item._id)))
    .map((item) => ({
      evidenceId: String(item._id),
      title: item.title,
      content: toSafeContent({
        ...(item.content || {}),
        source: item.source,
        timestamp: item.timestamp,
      }),
      explanation: explanations.get(String(item._id)) || 'This clue supports the solution.',
    }));
  const culprit = caseDocument.suspects.find(
    (suspect) => String(suspect._id) === String(solution.culpritId),
  );

  return {
    caseId: String(caseDocument._id),
    verdict: progress.accusation.isCorrect ? 'correct' : 'unsolved',
    selectedSuspectId: String(progress.accusation.suspectId),
    selectedSuspectName:
      caseDocument.suspects.find(
        (suspect) => String(suspect._id) === String(progress.accusation.suspectId),
      )?.name || 'Unknown suspect',
    culprit: { suspectId: String(culprit._id), name: culprit.name },
    motive: solution.motive,
    method: solution.method,
    explanation: solution.explanation,
    timelineReconstruction: solution.timelineReconstruction,
    decisiveEvidence,
    redHerringExplanations: solution.redHerringExplanations,
    score: progress.score,
    scoreBreakdown: progress.scoreBreakdown,
  };
}
