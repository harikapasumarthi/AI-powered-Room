# AI Mystery Room — Product & Technical Specification
**File:** `spec_ai.md`  
**Purpose:** Single source of truth for Codex and all implementation decisions  
**Version:** 1.0  
**Stack:** MERN (MongoDB, Express, React, Node.js) + Gemini API  
**Status:** Build specification

---

## 1. Product Overview

### 1.1 Product concept
AI Mystery Room is an AI-powered, browser-based investigation game. A player provides a short fictional premise (for example, “A priceless painting disappears during a private museum event”). Gemini transforms that premise into a complete, logically consistent mystery containing a setting, suspects, timelines, evidence, witness statements, digital artefacts and a hidden solution.

The player enters an investigation room and examines evidence presented as realistic *fictional props*: chat screenshots, emails, photographs, CCTV stills/transcripts, access logs, receipts, audio-transcript excerpts and witness statements. The player connects evidence, records deductions, optionally requests hints, and finally accuses one suspect. The backend checks the accusation and reveals the culprit, motive, method, timeline and explanation.

**Core promise:** Every mystery is solvable from the evidence provided. The culprit is not chosen by guesswork; the player can build a case.

### 1.2 Problem and opportunity
Many AI story experiences are passive: users read generated text but have little meaningful interaction. AI Mystery Room makes the user an active investigator. Its differentiator is an evidence-first interface, consistent case logic, believable digital artefacts and a satisfying reveal.

### 1.3 Product goals
1. Generate a playable mystery from a user's own premise.
2. Make evidence exploration feel like opening a real case file.
3. Ensure clues support one defensible solution.
4. Keep the culprit and solution secret until accusation submission.
5. Provide fair difficulty, hints, scoring and replayability.
6. Work smoothly on desktop and mobile browsers.

### 1.4 Non-goals for the first release
- Real-world crime reporting or investigation.
- Real WhatsApp, email, CCTV, phone or social-media integrations.
- Live multiplayer, public leaderboards or user-generated public case sharing.
- Real face recognition, voice identification or surveillance.
- Uploading arbitrary user photos/audio for forensic analysis.
- AI-generated video/audio production pipelines. Use designed fictional evidence cards and still images first.

---

## 2. Target Users and Experience

### Target users
- Students and casual players who enjoy detective stories, puzzles and escape rooms.
- Friends who want a short collaborative discussion experience (each player can share a screen; multiplayer is not in MVP).
- Users who want to create a mystery from their own imaginative scenario.

### Desired experience
- Curious at the beginning.
- In control while exploring evidence.
- Challenged but never blocked by arbitrary or contradictory information.
- Rewarded for careful reasoning.
- Surprised by the reveal, while being able to understand exactly how the evidence proved it.

### Product principles
- **Fairness:** the decisive evidence must be available before accusation.
- **Consistency:** names, times, locations and facts cannot contradict the canonical case data.
- **Agency:** players choose which evidence to inspect and when to request a hint.
- **Transparency after solving:** explain every important deduction.
- **Fiction and safety:** all people, messages, images and recordings are fictional and clearly labelled as simulated.

---

## 3. Scope and Priorities

### P0 — Must-have MVP
1. Home page and create-case form.
2. Premise input, genre/theme and difficulty selection.
3. Gemini-generated case with suspects, timeline, clues, hints and private solution.
4. Investigation room with suspect profiles and evidence board.
5. Evidence detail view and discover/inspect action.
6. Hint requests with hint penalty.
7. Accusation form.
8. Backend scoring and results/reveal page.
9. Save and resume an active case.
10. Responsive UI, loading/error/empty states.
11. Basic automated tests and deployment.

### P1 — Differentiating features (add after P0 works)
- **Evidence Board enhancements:** pin clues and draw/record simple connections between them. MVP includes the unpinned evidence wall, filters, discovery, details and progress; pinning and connections are P1.
- **Detective Notebook:** player writes private notes and marks a suspect as a person of interest. Notes are not sent to Gemini and do not affect score.
- **Contradiction Detector:** player selects two evidence items and explains the conflict; backend checks against predefined contradiction relationships.
- **Case Twist:** one optional red-herring reveal, fairly resolved by another clue.
- **Evidence Confidence:** label evidence as direct, circumstantial or testimonial.
- **Case Replay:** generate a new case from the same premise with a different fictional setting/solution.
- **Detective Rank:** Rookie, Analyst, Investigator, Master Detective based on score and case difficulty.

### P2 — Future ideas, not required for MVP
- Generated audio ambience and voice-note playback.
- Short AI-generated CCTV-style clips.
- Timed investigation mode.
- Daily mystery.
- Multiplayer rooms and shared evidence boards.
- User-created case gallery with moderation.
- Printable case-file export.

**Build order:** finish and test P0 before starting P1/P2. Do not let optional features delay the complete playable loop.

---

## 4. User Flow

1. User opens Home and sees the premise of the game and a “Create a Case” call to action.
2. User enters a short scenario/premise (20–500 characters).
3. User selects difficulty: Easy, Medium or Hard.
4. User optionally selects a genre: Murder Mystery (fictional, non-graphic), Theft, Disappearance, Cyber Mystery, Art Heist or Secret/Blackmail. Default: Theft.
5. User chooses a setting preference or leaves it as “Surprise me”.
6. Frontend sends the request to `POST /api/cases` using credentialed HTTPS requests.
7. Backend validates input, calls Gemini, validates the structured response, runs consistency checks, and stores public case data separately from its private solution.
8. User enters the Investigation Room and sees the case briefing, location, suspects, public timeline and evidence categories.
9. Before discovery, each evidence card exposes only its title, category and teaser. Opening an item calls the discovery endpoint; only then does the backend return full content and record discovery.
10. User reviews suspect profiles and timeline and requests hints as needed. Notebook notes and evidence pinning are P1 and are not part of the initial release.
11. User opens the accusation screen, chooses one suspect and optionally enters a short reasoning statement.
12. Backend checks the suspect ID, calculates score and marks the case complete. A completed case cannot be accused again.
13. Results reveal the correct culprit, motive, method, private timeline reconstruction, decisive clues, red herrings and score breakdown.
14. User can start a new case. Replay is a future P1 enhancement and is not part of the initial release.

### Navigation
Home → Create Case → Generating → Investigation Room → Accusation → Results → New Case.

If a user refreshes or returns within the retention period, an active case can be retrieved using its case ID and valid HttpOnly session cookie. Never send private solution data or undiscovered evidence content to the client.

---

## 5. Difficulty Rules

| Difficulty | Suspects | Evidence items | Hints | Correct accusation base points |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

### Difficulty design
- **Easy:** clear timeline, more direct evidence, fewer plausible alternatives.
- **Medium:** a mixture of direct and circumstantial evidence, one credible red herring.
- **Hard:** more layered motive/opportunity, multiple misleading leads, but still one evidence-supported solution.

Hints are a maximum, not a requirement. Progressive levels are: (1) general direction; (2) a specific clue or connection; (3) a strong investigative direction without naming the culprit. Easy uses levels 1–2; Medium and Hard use levels 1–3. Do not make Hard unfair by withholding essential evidence.

### Scoring
- Correct accusation: base points from the table.
- Each discovered evidence item: +5 points.
- Each hint used: −10 points.
- Incorrect accusation: 0 base accusation points; discovered-evidence points may remain, minus hint penalties.
- Final score: `max(0, correctBasePoints + (discoveredEvidenceCount * 5) - (hintsUsed * 10))` for a correct accusation.
- For an incorrect accusation: `max(0, (discoveredEvidenceCount * 5) - (hintsUsed * 10))`.
- A case can be accused only once. Backend computes score; never trust a score sent by the frontend.
- Store `basePoints` (difficulty base for a correct accusation, otherwise 0), `evidencePoints` (`discoveredEvidenceCount * 5`), `hintPenalty` (`hintsUsed * 10`, stored as a positive deduction), and `total` (`max(0, basePoints + evidencePoints - hintPenalty)`) so the results page can explain it.

---

## 6. Core Gameplay and Creative Evidence

### 6.1 Evidence types
Use a common evidence schema with a type-specific presentation:
- `chat`: fictional messaging conversation, sender names, timestamps and message bubbles.
- `email`: fictional sender, recipient, subject, date and body.
- `photo`: generated/stock-style fictional scene image or designed illustration with caption and metadata.
- `cctv`: fictional CCTV still image or text transcript, camera location, timestamp and visible observations.
- `document`: receipt, note, report, ticket, contract or handwritten-note transcription.
- `access_log`: door/keycard/device access events.
- `witness`: witness statement and interview notes.
- `audio_transcript`: fictional voice-note/call transcript; do not imply real audio analysis.
- `timeline_event`: event with time, place and source.

For the MVP, all evidence must remain understandable without actual video/audio generation. Use text, styled UI mockups and optional generated images. If image generation is not integrated, render a labelled placeholder/illustration rather than blocking case generation.

### 6.2 Evidence quality
Each case must contain:
- At least two clues that materially support the correct culprit.
- At least one clue that challenges or rules out a plausible alternative.
- A complete timeline with no impossible travel/time sequence.
- A clear explanation of why red herrings are misleading.
- No evidence that requires knowledge not supplied in the case.
- Evidence timestamps, names and locations consistent across all artefacts.

### 6.3 Signature feature: The Evidence Wall
A visual wall showing evidence cards. MVP implementation:
- Filter by evidence category.
- Mark evidence as discovered.
- Open evidence details in a modal/drawer.
- Show discovered count and progress.
- P1: pin/unpin evidence and connect two pinned cards with a labelled relationship.

### 6.4 Signature feature: Detective Notebook
A P1 private per-case notes area. Notes are player-authored, stored in the player progress record, never sent to Gemini, and do not affect the official score.

### 6.5 Signature feature: Ask for a Nudge
Hints should guide reasoning rather than reveal the answer. Easy cases use the first two levels; Medium and Hard use all three:
1. Broad direction: which part of the timeline or evidence deserves another look.
2. More specific: point toward a relevant evidence item or contradiction.
3. Strong nudge: explain the deduction to make, without naming the culprit.
Hints are predefined by Gemini during case generation and stored in the private CaseSolution collection. Return only the next hint requested.

---

## 7. UI / Page Specifications

### 7.1 Home (`/`)
Purpose: explain the experience and start a case.
- Brand: AI Mystery Room.
- Hero line: “Every clue tells a story. Can you find the truth?”
- Short explanation of how it works.
- Primary CTA: Create a Mystery.
- Small feature preview: evidence wall, suspects, hints and final reveal.
- Responsive navigation and footer.
- Do not show a fake live leaderboard or fake user statistics.

### 7.2 Create Case (`/create`)
- Premise textarea (20–500 characters), character counter and example prompts.
- Genre selector.
- Difficulty selector with suspect/evidence/hint counts.
- Setting preference (optional).
- Generate button.
- Validation for empty/too-short/too-long premise.
- Loading state with rotating status text such as “Building the timeline…” (do not claim a step completed unless it has).
- Retry option for generation failure.

Example premise: “During a private gallery opening, a rare miniature sculpture disappears. The gallery was locked, and four guests claim they never left the main hall.”

### 7.3 Investigation Room (`/case/:caseId`)
- Case title, case ID, difficulty and short briefing.
- Progress indicator: evidence discovered / total.
- Tabs/sections: Overview, Suspects, Evidence Wall, Timeline. Notebook is P1.
- Suspect cards: name, role, public bio, public alibi and public motive. Do not expose hidden truth or internal suspicion scores.
- Undiscovered evidence cards show only category, title, teaser and discovered status. Discovered evidence detail shows those fields plus full content, including source and timestamp where present.
- Evidence detail drawer/modal. Discovery must complete through the backend before full content is rendered.
- Hint button showing hints remaining.
- Accuse button, with a confirmation step.
- Loading, not-found, expired-case and API-error states.

### 7.4 Accusation (`/case/:caseId/accuse`)
- List only public suspect profiles.
- Select exactly one suspect.
- Optional reasoning textarea (max 500 characters).
- Clear warning: submitting ends the investigation.
- Confirmation modal.
- Disable repeat submissions while request is processing.

### 7.5 Results (`/case/:caseId/result`)
- Verdict: Correct / Case Unsolved.
- Player's selected suspect.
- Correct culprit.
- Motive, method and full solution explanation.
- Timeline reconstruction.
- Decisive evidence list with explanation of how each clue supports the solution.
- Explanation of red herrings.
- Score and itemised score breakdown.
- Play Again / Return Home.

### 7.6 Shared UI states
- Loading skeletons for case generation and case retrieval.
- Empty state if no evidence is available.
- Friendly error messages with retry action.
- Network/offline message.
- Accessible labels, keyboard focus, sufficient contrast and responsive layouts.
- Mobile-first layout; evidence cards should remain readable on narrow screens.

### Visual direction
Use a modern “digital detective case file” style rather than a generic chatbot:
- Dark navy/charcoal background with warm paper surfaces or restrained accent colours.
- Case-file typography, evidence stamps, subtle grid/paper textures and clear status labels.
- Use icons and typography to distinguish evidence types.
- Keep motion subtle and respect reduced-motion settings.
- Do not sacrifice readability for cinematic styling.
- Avoid gore, graphic crime imagery and realistic depictions of real people.

---

## 8. Technology Architecture

### Frontend
- React + Vite.
- React Router for navigation.
- Axios or Fetch for API calls.
- Tailwind CSS with reusable components and consistent styling.
- Component-based structure.
- Client-side form validation for usability; repeat all validation on server.
- Do not store Gemini API keys or private solution data in frontend code.

### Backend
- Node.js + Express.
- MongoDB + Mongoose.
- Gemini via the official `@google/genai` SDK.
- Zod for validating requests and Gemini output.
- dotenv for environment variables.
- Central error-handling middleware.
- Separate routes, controllers, services, models and validators.

### High-level architecture
React UI → Express REST API → Case service → Gemini service → Zod validation/consistency checks → MongoDB.  
The browser receives only public case data until an accusation is submitted. The backend retrieves the private solution to evaluate the accusation and return the result.

### Suggested folder structure
```text
ai-mystery-room/
  client/
    src/
      api/
      components/
      pages/
      hooks/
      context/
      utils/
      styles/
      App.jsx
      main.jsx
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      validators/
      utils/
      app.js
      server.js
    .env.example
  spec_ai.md
  README.md
```

---

## 9. Backend API Contract

All routes are prefixed with `/api`. Use JSON and credentialed requests. The browser sends the HttpOnly session cookie automatically when configured with credentials; JavaScript never reads the token. Return consistent error objects:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a premise between 20 and 500 characters."
  }
}
```

### 9.1 `POST /api/cases`
Generate a new mystery.

Request:
```json
{
  "premise": "A rare sculpture disappears during a gallery opening.",
  "difficulty": "medium",
  "genre": "art_heist",
  "settingPreference": "an old city art gallery"
}
```
Response (public data only):
```json
{
  "success": true,
  "data": {
    "caseId": "CASE_ID",
    "title": "The Silent Gallery",
    "difficulty": "medium",
    "briefing": "A sculpture vanished during a private event...",
    "setting": "Old city art gallery",
    "suspects": [],
    "evidence": [
      { "evidenceId": "EVIDENCE_ID", "title": "A Late Entry", "category": "access_log", "teaser": "A partial entry appears after closing." }
    ],
    "timeline": [
      { "time": "8:15 PM", "event": "The gallery doors close.", "sourceEvidenceIds": ["EVIDENCE_ID"] }
    ],
    "progress": {
      "discoveredEvidenceIds": [],
      "hintsUsed": 0,
      "hintsRemaining": 3
    }
  }
}
```
For each evidence item in this response, return exactly `evidenceId`, `title`, `category` (the evidence type), and `teaser`. Do not include source, timestamp, content, confidence, related suspect IDs, decisive flags or private explanations until the item is discovered; sensitive internal fields remain excluded even after discovery. Never include `solution`, `culpritId`, private motives, private timeline details or hint content. The `timeline` array contains only player-visible events and source references and must not reveal the solution.

### 9.2 `GET /api/cases/:id`
Retrieve active case public data and player progress. Return the same evidence shapes as case creation: undiscovered items contain only `evidenceId`, `title`, `category`, and `teaser`; discovered items additionally contain `content`. Never return internal evidence properties or private solution data.

### 9.3 `POST /api/cases/:id/clues/:clueId/discover`
Mark one valid evidence item as discovered.
- Verify case exists and is active.
- Verify clue belongs to case.
- Idempotent: discovering the same item twice must not award extra points.
- If newly discovered, return `{ "success": true, "data": { "evidence": { "evidenceId": "...", "title": "...", "category": "...", "teaser": "...", "content": {} }, "progress": { "discoveredEvidenceIds": ["..."], "hintsUsed": 0, "hintsRemaining": 3 } }`.
- If already discovered, return the same full discovered-evidence shape without awarding duplicate points. Never return source, timestamp, confidence, related suspect IDs, decisive flags or solution explanations from this endpoint.

### 9.4 `POST /api/cases/:id/hints`
Request the next available hint.
- Reject if no hints remain or case is completed.
- Increment hints used exactly once per successful request.
- Return only the next hint.
- Prevent duplicate requests from charging twice where practical (use an idempotency key or request token).

### 9.5 `POST /api/cases/:id/accuse`
Request:
```json
{
  "suspectId": "SUSPECT_ID",
  "reasoning": "The access log conflicts with the suspect's statement."
}
```
Backend:
- Verify case is active.
- Verify suspect belongs to the case.
- Accept one accusation only.
- Compare suspect ID with private culprit ID.
- Calculate score from server-side progress.
- Persist accusation, verdict, score and completion time.
- Return result payload after the case is completed.

### 9.6 `GET /api/cases/:id/result`
- Only available after accusation.
- Return culprit, verdict, solution, explanation, timeline reconstruction and score breakdown.
- Before completion, return `CASE_NOT_COMPLETED` without leaking solution data.

### 9.7 P1 `PATCH /api/cases/:id/notes`
P1 only: save player-authored private notes. Validate length and store in PlayerProgress; notes are never sent to Gemini and do not affect score. Notebook is excluded from the initial release.

### 9.8 P1 `PATCH /api/cases/:id/pins/:clueId`
P1 only: pin or unpin a discovered evidence item in PlayerProgress after validating ownership and clue membership. Pinning does not affect score. The MVP has no pinning endpoint or UI.

### 9.9 `DELETE /api/session`
Revoke the current server-side PlayerSession and clear its cookie using the same path, SameSite and Secure settings. Return success even if no valid session exists, without revealing token validity.

### Evidence response DTOs
Undiscovered evidence has exactly this public shape: `{ "evidenceId": "...", "title": "...", "category": "...", "teaser": "..." }`.
Discovered evidence has exactly this public shape: `{ "evidenceId": "...", "title": "...", "category": "...", "teaser": "...", "content": {} }`.
The backend must construct these DTOs explicitly. `source` and `timestamp` may appear inside full `content` only after discovery. Never expose internal properties such as `isDecisive`, `relatedSuspectIds`, private clue explanations, hints, culprit identifiers or CaseSolution fields through case or discovery endpoints.

### HTTP status codes
- `200`: successful retrieval/action.
- `201`: case created.
- `400`: invalid request.
- `404`: case/evidence/suspect not found.
- `410`: case expired but not yet removed by cleanup (`CASE_EXPIRED`).
- `409`: case already completed or action conflicts with state.
- `429`: rate limit reached.
- `500`: unexpected server error.
- `503`: Gemini/provider temporarily unavailable.

---

## 10. MongoDB Data Model

Use Mongoose schemas with timestamps. Use generated ObjectIds for IDs unless a stable string ID is required for nested content.

### 10.1 Case document
The `Case` collection contains only canonical, player-visible case data plus lifecycle metadata. It must never contain private solution data, private hints, decisive flags, hidden clue explanations or confidential relationships. Suggested fields:
```js
{
  title: String,
  premise: String,
  genre: String,
  difficulty: "easy" | "medium" | "hard",
  setting: String,
  briefing: String,

  suspects: [{
    _id: ObjectId,
    name: String,
    role: String,
    publicBio: String,
    publicAlibi: String,
    publicMotive: String
  }],

  evidence: [{
    _id: ObjectId,
    type: String,
    title: String,
    teaser: String,
    content: Mixed,
    source: String,
    timestamp: String,
    confidence: "direct" | "circumstantial" | "testimonial"
  }],

  // Player-visible events only; solution-revealing events stay private.
  timeline: [{
    time: String,
    event: String,
    sourceEvidenceIds: [ObjectId]
  }],

  status: "active" | "completed",
  createdAt: Date,
  completedAt: Date,
  lastActivityAt: Date,
  expiresAt: Date
}
```
The player-visible timeline is a safe subset. The complete timeline and all answer-bearing relationships belong only in CaseSolution.

### 10.2 CaseSolution document
This mandatory separate collection stores answer-bearing material and is backend-only:
```js
{
  caseId: { type: ObjectId, unique: true, required: true },
  culpritId: ObjectId,
  motive: String,
  method: String,
  explanation: String,
  completeTimeline: [{ time: String, event: String, sourceEvidenceIds: [ObjectId] }],
  timelineReconstruction: [String],
  decisiveEvidenceIds: [ObjectId],
  privateClueExplanations: [{ evidenceId: ObjectId, explanation: String }],
  redHerringExplanations: [String],
  hints: [String],
  relatedSuspectIdsByEvidence: [{ evidenceId: ObjectId, suspectIds: [ObjectId] }],
  createdAt: Date,
  updatedAt: Date
}
```
Store all hint content and answer-bearing clue explanations here. The result service may read CaseSolution only after an accusation is recorded; accusation evaluation may read only the culprit ID needed for comparison. Delete this document when its Case expires.

### 10.3 PlayerProgress document
```js
{
  caseId: ObjectId,
  sessionTokenHash: String,
  discoveredEvidenceIds: [ObjectId],
  pinnedEvidenceIds: [ObjectId], // P1 only
  hintsUsed: Number,
  notes: String, // P1 only
  accusation: {
    suspectId: ObjectId,
    reasoning: String,
    isCorrect: Boolean,
    submittedAt: Date
  },
  score: Number,
  scoreBreakdown: {
    basePoints: Number,
    evidencePoints: Number,
    hintPenalty: Number,
    total: Number
  },
  status: "active" | "completed",
  createdAt: Date,
  updatedAt: Date,
  lastActivityAt: Date,
  expiresAt: Date
}
```

### 10.4 PlayerSession document
Maintain a server-side session record so sessions can expire and be revoked:
```js
{
  sessionTokenHash: String, // unique
  lastActivityAt: Date,
  expiresAt: Date,
  revokedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```
Every protected request validates its cookie token against an unrevoked, unexpired PlayerSession. Case creation establishes a session if needed, sets the cookie in `Set-Cookie`, and stores only the token hash. `DELETE /api/session` marks the record revoked and clears the cookie. Do not delete PlayerProgress when a session ends; it remains subject to case retention and cannot be accessed without a valid owner session. A new unrelated session does not inherit old cases.

### Session / access strategy
Use a cryptographically random token in an `HttpOnly` cookie named `amr_session`; never return it in JSON or store it in browser local storage. Set `Secure` in production and `SameSite=Lax` when frontend/backend use same-site HTTPS hostnames. If cross-site deployment is unavoidable, use `SameSite=None; Secure` and strict CORS allowlisting. Set `Path=/api`, omit `Domain` for a host-only cookie, and use `Max-Age=2592000` (30 days). Refresh cookie expiration on valid activity. Frontend requests include credentials; Express CORS uses the exact `CLIENT_URL`, `credentials: true`, and never a wildcard origin. Validate ownership on every case read/write route; case IDs are not authorization.

Update PlayerSession `lastActivityAt` and `expiresAt` on every successful authenticated player request. Also update the case and its PlayerProgress `lastActivityAt` and `expiresAt` for case retrieval, evidence discovery, hint request, accusation, and P1 note/pin actions. Do not count health checks or failed/unauthorized requests. Sessions and cases expire after 30 days without valid activity. `DELETE /api/session` revokes the current session and clears the cookie using identical path/SameSite/Secure settings.

### Indexes and retention cleanup
- Case: `{ createdAt: -1 }`, `{ status: 1 }`, `{ expiresAt: 1 }`.
- CaseSolution: unique `{ caseId: 1 }`.
- PlayerProgress: unique `{ caseId: 1, sessionTokenHash: 1 }`.
- PlayerSession: unique `{ sessionTokenHash: 1 }`, `{ expiresAt: 1 }`.
- A scheduled backend cleanup job runs at least hourly. It finds Cases with `expiresAt` at or before now and deletes each Case, its CaseSolution, and all PlayerProgress records referencing it; it also prunes expired or revoked PlayerSession records. Deletion is idempotent and retryable. Before cleanup, expired cases return `410 CASE_EXPIRED`; after cleanup they return `404 CASE_NOT_FOUND`. Do not use separate TTL indexes on related records because that can leave orphans. Initialize Case `lastActivityAt` at creation; extend it on valid activity as above. Configure retention duration and cleanup interval through backend settings.

---

## 11. Gemini AI Behaviour

### 11.1 Responsibilities
Gemini generates:
- Case title and briefing.
- Suspects and their public profiles.
- Evidence items and realistic fictional artefact content.
- Timeline.
- Hints.
- Private solution and explanation.
- Relationships between evidence and suspects.

Gemini does **not** calculate the final score, decide whether a submitted suspect ID is valid, or directly update the database. Those are deterministic backend responsibilities.

### 11.2 Generation prompt requirements
The backend prompt must instruct Gemini:
1. Treat the user premise as fictional creative writing.
2. Generate exactly the suspect/evidence/hint counts required by the difficulty table.
3. Create one and only one culprit.
4. Make the solution logically provable using evidence shown to the player.
5. Ensure at least two decisive clues support the culprit.
6. Include at least one clue that weakens a plausible alternative.
7. Ensure all timestamps, names, places, roles and alibis remain consistent.
8. Do not rely on hidden facts, stereotypes or outside knowledge.
9. Include plausible red herrings that are fairly resolved.
10. Write concise, engaging and age-appropriate content. Avoid graphic violence and explicit content.
11. Return JSON matching the required schema only; no Markdown fences or extra commentary.
12. Treat all messages/documents as fictional props; do not imitate a real person's private account or claim real-world authenticity.

### 11.3 Required structured output
Use a Zod schema that matches the following conceptual structure:
```json
{
  "title": "string",
  "briefing": "string",
  "setting": "string",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "string",
      "role": "string",
      "publicBio": "string",
      "publicAlibi": "string",
      "publicMotive": "string"
    }
  ],
  "evidence": [
    {
      "id": "evidence_1",
      "type": "chat|email|photo|cctv|document|access_log|witness|audio_transcript|timeline_event",
      "title": "string",
      "source": "string",
      "timestamp": "string",
      "teaser": "string",
      "content": {},
      "confidence": "direct|circumstantial|testimonial",
      "relatedSuspectIds": ["suspect_1"],
      "isDecisive": false
    }
  ],
  "timeline": [
    {
      "time": "string",
      "event": "string",
      "sourceEvidenceIds": ["evidence_1"]
    }
  ],
  "hints": ["string"],
  "solution": {
    "culpritId": "suspect_1",
    "motive": "string",
    "method": "string",
    "explanation": "string",
    "timelineReconstruction": ["string"],
    "decisiveEvidenceIds": ["evidence_1"],
    "redHerringExplanations": ["string"]
  }
}
```
The backend must validate exact counts, enum values, required fields, ID references, maximum lengths and solution references. Convert generated string IDs to database ObjectIds or maintain stable string IDs consistently.

### 11.4 Consistency validation
Before saving:
- Every `relatedSuspectId` references an existing suspect.
- Every timeline evidence ID references existing evidence.
- Every decisive evidence ID references existing evidence.
- `culpritId` references an existing suspect.
- There are at least two decisive evidence items.
- Evidence and hint counts match difficulty.
- Names and timestamps do not conflict.
- The explanation is supported by decisive evidence.
- No public field contains the culprit answer or private solution text.

If validation fails, ask Gemini for one repair attempt using the validation errors. If it still fails, return a friendly generation error; do not save a broken case. Add a maximum generation retry count to control cost and latency.

### 11.5 Public/private separation
Use the separate collections defined in Section 10 and explicit serializers such as `toPublicCase(caseDoc, progress)`; never return raw Mongoose documents. Split Gemini output before persistence: keep only safe fields in Case and route the solution, complete timeline, private clue explanations, hints, decisive IDs and suspect relationships to CaseSolution. Test that active-case responses contain none of those private fields or undiscovered evidence content.

---

## 12. Security, Privacy and Abuse Prevention

- Keep `GEMINI_API_KEY`, `MONGODB_URI` and session secrets on the backend only.
- Commit `.env.example`, never `.env`.
- Validate and sanitize all user input.
- Limit premise length and request body size.
- Rate-limit case generation and hint requests.
- Add request timeouts and handle Gemini quota/provider errors.
- Do not render AI text as raw HTML; escape/sanitize output.
- Do not allow user premise text to override system instructions or schema rules.
- Do not expose raw stack traces or database errors to clients.
- Use CORS allowlist based on the exact `CLIENT_URL`, with `credentials: true`; never use wildcard origins with credentials. Frontend requests include credentials. Cookie details are defined in Section 10.
- Use HTTPS in production.
- Avoid collecting personal information. Anonymous session is sufficient for MVP.
- Clearly label all evidence and media as fictional AI-generated/simulated content.
- Do not create realistic evidence targeting real people or depicting actual private conversations.
- Add a content filter/guardrail for requests involving real individuals, doxxing, sexual content involving minors, graphic violence or instructions for wrongdoing. Redirect to fictional, non-graphic mystery premises.
- Enforce the 30-day inactivity retention and linked-record cleanup policy in Section 10.

---

## 13. Environment Variables

Backend `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace_with_a_long_random_secret
SESSION_MAX_AGE_DAYS=30
CASE_RETENTION_DAYS=30
CLEANUP_INTERVAL_MINUTES=60
GEMINI_TIMEOUT_MS=30000
```

Frontend `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
Never place the Gemini key in a `VITE_` variable. Confirm current Gemini model availability and SDK usage during implementation; do not hardcode an obsolete model name.

---

## 14. Error Handling

Use stable error codes:
- `VALIDATION_ERROR`
- `CASE_NOT_FOUND`
- `EVIDENCE_NOT_FOUND`
- `SUSPECT_NOT_FOUND`
- `CASE_ALREADY_COMPLETED`
- `CASE_NOT_COMPLETED`
- `CASE_EXPIRED`
- `NO_HINTS_REMAINING`
- `UNAUTHORIZED_CASE_ACCESS`
- `GEMINI_GENERATION_FAILED`
- `GEMINI_INVALID_OUTPUT`
- `RATE_LIMITED`
- `INTERNAL_SERVER_ERROR`

Frontend messages should be human-friendly and offer a safe next action. Never display private prompts, API keys, raw provider errors or stack traces.

---

## 15. Testing Plan

### Backend unit tests
- Request validation for premise, genre and difficulty.
- Difficulty count configuration.
- Zod validation of valid and invalid Gemini output.
- Cross-reference and consistency validation.
- Score calculation for all difficulties.
- Hint penalty and minimum score of zero.
- Duplicate evidence discovery does not award duplicate points.
- Culprit and solution never appear in active-case serializer.

### Backend integration tests
- Generate case (mock Gemini response).
- Retrieve active case.
- Discover evidence.
- Request hints until exhausted.
- Reject invalid evidence/suspect IDs.
- Correct accusation and result.
- Incorrect accusation and result.
- Reject second accusation.
- Reject result request before accusation.
- Reject another session's attempt to access a case.
- Verify cookie authentication, session termination, activity timestamp refresh and expired-case behavior.
- Verify undiscovered evidence exposes only title/category/teaser and discovery adds content only.
- Verify cleanup removes expired Case, CaseSolution and PlayerProgress records together.

### Frontend tests / manual QA
- Form validation and difficulty selection.
- Loading and retry states.
- Evidence filters, teaser-only undiscovered view and discovered detail view.
- Hint counter updates.
- Accusation confirmation.
- Results and score breakdown.
- Mobile and desktop layouts.
- Refresh/resume an active case with its valid cookie.
- P1 only: notebook notes and evidence pinning.

### End-to-end acceptance scenario
1. Create a Medium mystery from a custom premise.
2. Verify exactly 4 suspects, 7 evidence items and 3 hints.
3. Inspect evidence and discover at least two items.
4. Request a hint and verify the count decreases.
5. Refresh the browser with its valid session cookie and confirm progress persists.
6. Accuse a suspect.
7. Verify the backend returns the verdict and correct solution only after accusation.
8. Verify score equals the documented formula.
9. Start another case and confirm the new case is independent. Replay is outside this acceptance scenario.

---

## 16. Acceptance Criteria

The MVP is complete only when:
- [ ] A user can create a mystery from their own premise.
- [ ] Easy, Medium and Hard generate the exact configured counts.
- [ ] Gemini output is schema-validated before saving.
- [ ] Every mystery has one logically supported culprit.
- [ ] Public case APIs never expose the culprit or private solution before accusation.
- [ ] Suspects, evidence and timeline display correctly.
- [ ] Evidence can be discovered and duplicate discovery gives no extra points.
- [ ] Hints are limited and penalties are recorded server-side.
- [ ] A player can submit one accusation only.
- [ ] Backend calculates the correct score and minimum score is zero.
- [ ] Results explain the culprit, motive, method and decisive clues.
- [ ] Active case progress survives refresh.
- [ ] Undiscovered evidence exposes only title, category and teaser; discovery returns full content without internal fields.
- [ ] Case and CaseSolution are separate, and private data is never returned before accusation.
- [ ] Sessions use the specified HttpOnly cookie behavior and ownership checks.
- [ ] Cases expire after 30 days of inactivity and cleanup removes related records.
- [ ] Errors and Gemini failures are handled gracefully.
- [ ] The application is responsive and usable on mobile and desktop.
- [ ] Production deployment works end-to-end.
- [ ] README explains setup, environment variables, scripts and deployment.

---

## 17. Build Plan for Codex

Codex must work incrementally. Do not generate the entire application in one step.

### Milestone 1 — Foundation
- Read this entire `spec_ai.md`.
- Create client/server folders and install dependencies.
- Configure Vite, Express, MongoDB connection and environment examples.
- Add health endpoint and basic Home/Create Case pages.
- Confirm both apps run locally.

### Milestone 2 — Case generation
- Implement Gemini service, prompt, Zod schema and consistency validator.
- Add difficulty configuration.
- Add case and private-solution persistence.
- Implement `POST /api/cases`.
- Test with mocked Gemini output before using live API.

### Milestone 3 — Investigation
- Implement public case serializer and `GET /api/cases/:id`.
- Build suspect cards, evidence wall, evidence details and timeline.
- Implement discovery and player progress.
- Verify private solution is not returned.

### Milestone 4 — Hints and accusation
- Implement hint endpoint and limits.
- Implement accusation endpoint and server-side scoring.
- Add completed-case result endpoint.
- Test correct/incorrect accusation and repeated requests.

### Milestone 5 — UI polish
- Build Results page, responsive layouts and loading/error states.
- Apply visual design system.
- Add accessibility and empty states.
- After P0 is complete, implement P1 notebook and evidence pinning only in approved P1 scope.

### Milestone 6 — QA and deployment
- Run unit, integration and manual end-to-end tests.
- Fix all acceptance-criteria failures.
- Deploy backend, configure MongoDB Atlas and environment variables.
- Deploy frontend and configure production API/CORS.
- Test a complete mystery on the live URL.

### Rules for Codex
1. Treat `spec_ai.md` as the source of truth. If code and spec disagree, follow the spec and explain any proposed spec change before implementing it.
2. Before each milestone, list the files to create/change and the plan.
3. Implement only the current milestone; do not jump ahead.
4. Use clear, beginner-readable code and meaningful names.
5. Keep Gemini calls in backend services only.
6. Never send private solution fields to frontend before accusation.
7. Validate all external input and all Gemini output.
8. Do not invent dependencies or API methods; verify official SDK documentation when needed.
9. Add tests for critical logic, especially privacy and scoring.
10. After each milestone, report what changed, commands to run, tests performed and known issues.
11. Do not silently remove or weaken an acceptance criterion.
12. If a requirement is ambiguous, ask a concise clarification rather than making a major architectural assumption.

---

## 18. Suggested Dependencies

### Client
- `react`, `react-dom`
- `react-router-dom`
- `axios`
- Styling: Tailwind CSS.

### Server
- `express`
- `cors`
- `dotenv`
- `mongoose`
- `@google/genai`
- `zod`
- `express-rate-limit`
- `helmet`
- Development: `nodemon`
- Testing: `vitest` for frontend/backend unit tests and `supertest` for Express API integration tests.

Do not install every optional package automatically. Keep the dependency list minimal.

---

## 19. Deployment Deliverables

- GitHub repository with client, server, `spec_ai.md`, README and `.env.example` files.
- Live frontend URL.
- Live backend health endpoint.
- MongoDB Atlas database configured with least-privilege credentials.
- Environment variables configured in hosting dashboards.
- No API keys or secrets in Git history.
- A tested demo case that can be generated and solved on the production website.

---

## 20. Final Product Definition

AI Mystery Room succeeds when a first-time user can enter an original premise, receive a coherent fictional case, inspect convincing simulated evidence, reason through the suspects, use optional hints, make one accusation and receive a satisfying evidence-backed reveal — all on the deployed website.

**The experience should feel like opening a detective's digital case file, not chatting with a generic AI.**
## 21. Finalized Technical Decisions

This section records the selected choices. Detailed contracts are defined in Sections 9-18; those sections are the implementation reference.

- Store answer-bearing data in the mandatory CaseSolution collection separate from public Case. Never expose solution information before accusation.
- Evidence is discovery-gated: undiscovered items contain only evidence ID, title, category and teaser; discovered items add full content. Never expose internal evidence properties.
- Easy receives hint levels 1-2; Medium and Hard receive levels 1-3.
- Use anonymous sessions in host-only HttpOnly cookies, credentialed requests, exact-origin CORS and 30-day inactivity expiration. Activity refresh and secure termination follow Section 10.
- Retain cases for 30 days after last valid player activity. A configurable hourly cleanup job removes expired Case, CaseSolution and PlayerProgress records. Expired cases return 410 until cleanup, then 404.
- Validate Gemini output with Zod, allow one repair attempt, use a configurable timeout initially set to 30 seconds, handle provider failures safely, and never persist invalid cases.
- Accusations store selected suspect ID, optional reasoning (maximum 500 characters), correctness, submission timestamp, score and the Section 5 score breakdown. Backend validates and scores; results are returned only after accusation.
- Case Replay remains a future P1 feature and is excluded from the initial-release flow and acceptance criteria.
- Use Vitest for frontend/backend unit tests, Supertest for API integration tests and Tailwind CSS for styling.
- Keep the hosting provider undecided until the deployment milestone. Keep frontend/backend environment configuration separate and never commit secrets.
- Preserve the MERN stack, Gemini integration and all non-conflicting project requirements. Do not implement future features before their approved scope. spec_ai.md is the canonical specification filename.
