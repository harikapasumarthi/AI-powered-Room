import { validateGeneratedCase } from '../../validators/caseValidators.js';

const suspectBank = [
  ['suspect_1', 'Mara Vale', 'Gallery curator', 'She has curated the gallery for six years and knows its procedures.', 'She says she remained in the main hall after 8:00 PM.', 'A dispute over the gallery catalogue could damage her reputation.'],
  ['suspect_2', 'Theo Mercer', 'Restoration specialist', 'He maintains display cases and has temporary access to the service corridor.', 'He says he was in the main hall with the guests throughout the closing hour.', 'A private debt makes the missing artwork unusually valuable to him.'],
  ['suspect_3', 'Iris Chen', 'Collector', 'She has loaned several works to the gallery and attended the opening.', 'She says she left through the front entrance before the doors were locked.', 'A rival collection has recently outbid her.'],
  ['suspect_4', 'Jonah Reed', 'Event coordinator', 'He arranged the guest list and closing schedule.', 'He says he was checking the front lobby at 8:15 PM.', 'A failed event could cost him his contract.'],
  ['suspect_5', 'Leena Shah', 'Security supervisor', 'She oversees the access system and camera logs.', 'She says she was at the control desk during the alarm reset.', 'She has complained about unpaid overtime.'],
];

const evidenceBank = [
  { id: 'evidence_1', type: 'access_log', title: 'Service Door Entry', source: 'Gallery access system', timestamp: '8:12 PM', teaser: 'A temporary access card was used near the service corridor.', content: { observation: 'Card T-04 opened the service door at 8:12 PM. Card T-04 was assigned to Theo Mercer.' }, confidence: 'direct', relatedSuspectIds: ['suspect_2'], isDecisive: true },
  { id: 'evidence_2', type: 'email', title: 'A Repair Request', source: 'Fictional email printout', timestamp: '7:41 PM', teaser: 'A last-minute repair was requested before the gallery closed.', content: { subject: 'Display latch adjustment', body: 'Theo asks Jonah to leave the service corridor clear for a quick latch check.' }, confidence: 'circumstantial', relatedSuspectIds: ['suspect_2', 'suspect_4'], isDecisive: true },
  { id: 'evidence_3', type: 'witness', title: 'The Quiet Corridor', source: 'Interview with event staff', timestamp: '8:18 PM', teaser: 'A staff member recalls hearing a case latch after closing.', content: { statement: 'I heard a soft metal click from the service corridor, then saw someone carrying a folded cloth toward the loading area.' }, confidence: 'testimonial', relatedSuspectIds: ['suspect_2'], isDecisive: false },
  { id: 'evidence_4', type: 'cctv', title: 'Loading Area Still', source: 'Loading bay camera transcript', timestamp: '8:23 PM', teaser: 'A blurred figure appears briefly beside the loading bay.', content: { observation: 'The figure carries a narrow protective wrap matching the gallery restoration supply.' }, confidence: 'circumstantial', relatedSuspectIds: ['suspect_2'], isDecisive: false },
  { id: 'evidence_5', type: 'document', title: 'Inventory Check', source: 'Closing inventory sheet', timestamp: '8:30 PM', teaser: 'One line on the closing count was corrected by hand.', content: { entry: 'The miniature was marked present at 8:05 PM, then crossed out in a different pen after the staff check.' }, confidence: 'direct', relatedSuspectIds: ['suspect_1', 'suspect_2'], isDecisive: false },
  { id: 'evidence_6', type: 'chat', title: 'A Collector’s Message', source: 'Fictional event message transcript', timestamp: '7:55 PM', teaser: 'A guest asks whether the miniature is still available to view.', content: { messages: [{ sender: 'Iris', time: '7:55 PM', text: 'I am heading to the front entrance now; please confirm the display is still there.' }] }, confidence: 'testimonial', relatedSuspectIds: ['suspect_3'], isDecisive: false },
  { id: 'evidence_7', type: 'access_log', title: 'Front Exit Record', source: 'Front entrance counter', timestamp: '8:02 PM', teaser: 'The public exit counter recorded a departure before the corridor entry.', content: { observation: 'One guest exit was recorded at 8:02 PM; the service door entry occurred ten minutes later.' }, confidence: 'direct', relatedSuspectIds: ['suspect_3', 'suspect_2'], isDecisive: false },
  { id: 'evidence_8', type: 'document', title: 'Restoration Supply Slip', source: 'Workshop supply register', timestamp: '6:50 PM', teaser: 'Protective wrapping was signed out before the event began.', content: { item: 'One narrow padded wrap was signed out by Theo Mercer and not returned on the evening inventory.' }, confidence: 'direct', relatedSuspectIds: ['suspect_2'], isDecisive: false },
  { id: 'evidence_9', type: 'witness', title: 'The Hallway Alibi', source: 'Interview with a gallery guest', timestamp: '8:10 PM', teaser: 'A guest remembers who was at the main hall table.', content: { statement: 'Theo was not at the table when he said he was. I saw his jacket on the chair, but not him.' }, confidence: 'testimonial', relatedSuspectIds: ['suspect_2', 'suspect_1'], isDecisive: false },
];

export function createMockCase({ premise, difficulty }) {
  const counts = { easy: [3, 5, 2], medium: [4, 7, 3], hard: [5, 9, 3] }[difficulty];
  const suspects = suspectBank.slice(0, counts[0]).map(([id, name, role, publicBio, publicAlibi, publicMotive]) => ({
    id, name, role, publicBio, publicAlibi, publicMotive,
  }));
  const visibleSuspectIds = new Set(suspects.map(({ id }) => id));
  const evidence = evidenceBank
    .map((item) => ({
      ...item,
      relatedSuspectIds: item.relatedSuspectIds.filter((id) => visibleSuspectIds.has(id)),
    }))
    // Keep both proof clues in every difficulty preset, including Easy.
    .sort((a, b) => Number(b.isDecisive) - Number(a.isDecisive))
    .slice(0, counts[1]);

  const generated = {
    title: 'The Case of the Quiet Gallery',
    briefing: `During a private gallery opening, a miniature disappears. ${premise}`.slice(0, 1200),
    setting: 'A fictional city gallery during a private evening event',
    suspects,
    evidence,
    timeline: [
      { time: '7:41 PM', event: 'A service corridor repair is requested.', sourceEvidenceIds: ['evidence_2'] },
      { time: '8:02 PM', event: 'A guest leaves through the front entrance.', sourceEvidenceIds: ['evidence_7'] },
      { time: '8:12 PM', event: 'A temporary card opens the service door.', sourceEvidenceIds: ['evidence_1'] },
      { time: '8:23 PM', event: 'A figure appears near the loading area.', sourceEvidenceIds: ['evidence_4'] },
      { time: '8:30 PM', event: 'The closing inventory is corrected.', sourceEvidenceIds: ['evidence_5'] },
    ].filter((event) => event.sourceEvidenceIds.every((id) => evidence.some((item) => item.id === id))),
    hints: [
      'Compare the time on the service entry with the guests’ public alibis.',
      'The repair request and the temporary access card describe the same corridor.',
      'Ask who could access both the display latch and the service route during the gap.',
    ].slice(0, counts[2]),
    solution: {
      culpritId: 'suspect_2',
      motive: 'Theo’s private debt gave him a reason to take the miniature for resale.',
      method: 'He used a routine repair request to reach the display, wrapped the miniature in restoration padding, and left by the service route.',
      explanation: 'The access record places Theo’s assigned card at the service door after his stated alibi begins. The repair request gave him a plausible reason to approach the latch, and the missing wrap connects the display to the loading route. The guest exit record weakens Iris’s apparent opportunity because she left before that access event.',
      timelineReconstruction: [
        'Theo requested a latch adjustment shortly before closing.',
        'He left the main hall despite claiming to remain there.',
        'His card opened the service door and he used the padded restoration wrap.',
        'He carried the wrapped miniature toward the loading area.',
      ],
      decisiveEvidenceIds: ['evidence_1', 'evidence_2'],
      redHerringExplanations: ['Iris’s message sounds suspicious, but the exit counter places her departure before the service-door entry.'],
    },
  };

  return validateGeneratedCase(generated, difficulty);
}
