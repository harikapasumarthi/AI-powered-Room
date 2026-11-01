# AI Mystery Room

AI Mystery Room is a fictional, evidence-led investigation game. Players create a premise, inspect evidence, compare suspect statements, request limited hints, make one accusation, and receive a scored solution reveal. Product and API requirements are defined in [spec_ai.md](./spec_ai.md).

## Features

- Easy, Medium, and Hard mysteries with specification-defined suspect, evidence, hint, and scoring counts.
- Gemini-generated cases validated with Zod and one repair attempt for invalid output.
- Explicit development mock mode when Gemini credentials are unavailable.
- Anonymous HttpOnly sessions; public cases and private solutions use separate collections.
- Evidence discovery, progressive hints, accusation, deterministic scoring, and result explanations.
- 30-day inactivity expiration and linked-record cleanup.
- Responsive React investigation room with evidence, suspects, timeline, and results views.

## Technology

- Client: React, Vite, React Router, Axios, Tailwind CSS.
- Server: Node.js, Express, MongoDB, Mongoose, Zod, Helmet, CORS, express-rate-limit.
- AI: official `@google/genai` SDK.
- Tests: Vitest and Supertest.

## Project layout

```text
client/                 React application and client tests
  src/App.jsx            Pages and investigation flow
  src/styles/            Responsive detective case-file design
server/                 Express API and server tests
  src/models/            Case, private solution, progress, and session models
  src/services/          Gemini, sessions, case handling, scoring, retention
spec_ai.md               Canonical specification
```

## Prerequisites

- Node.js 22.12 or newer and npm (required by the pinned Vite/Vitest toolchain).
- MongoDB locally or a reachable MongoDB deployment.
- A Gemini API key for live generation. Mock mode can be used for local development without Gemini.

## Install

From the repository root:

```powershell
cd server
npm install
cd ../client
npm install
```

Lockfiles are checked in for reproducible installs. `npm ci` can replace `npm install` on a clean checkout.

## Configuration

Copy the examples to local environment files:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Edit `server/.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port, normally `5000` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `MONGODB_URI` | Local or hosted MongoDB connection string |
| `GEMINI_API_KEY` | Server-only key from Google AI Studio; leave blank for mock mode |
| `GEMINI_MODEL` | Supported Gemini model identifier (example: `gemini-3.8-flash`) |
| `GEMINI_MOCK_MODE` | Set `true` only for local development; mock cases are labelled in API data |
| `CLIENT_URL` | Exact frontend origin, normally `http://localhost:5173` |
| `COOKIE_SAME_SITE` | `lax` for same-site hosting; set to `none` only for cross-site HTTPS hosting |
| `SESSION_SECRET` | Set a long random secret for stable sessions; production requires 32+ characters |
| `SESSION_MAX_AGE_DAYS` | Session lifetime, default 30 |
| `CASE_RETENTION_DAYS` | Case inactivity retention, default 30 |
| `CLEANUP_INTERVAL_MINUTES` | Retention cleanup interval, default 60 |
| `GEMINI_TIMEOUT_MS` | Provider timeout, default 30000 |

Set `GEMINI_MOCK_MODE=true` and run a local MongoDB for a credential-free playable demo. For live AI, set `GEMINI_MOCK_MODE=false` and provide both the API key and model. The browser environment must contain only `VITE_API_BASE_URL=http://localhost:5000/api`; never put server secrets in a `VITE_` variable.

## Run locally

Start MongoDB first. In separate terminals:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

Open <http://localhost:5173>. API health is available at <http://localhost:5000/api/health>; `/api/ready` reports whether MongoDB is connected.

The API can start in development without MongoDB so the health endpoint remains available, but gameplay endpoints return a database-unavailable response until MongoDB connects.

## Tests and production build

```powershell
cd server
npm test
```

```powershell
cd client
npm test
npm run build
```

Backend tests cover difficulty counts, generated-case validation, public/private serialization, score calculation, and the health route. Full gameplay integration tests require a configured MongoDB instance.

## Deployment preparation

- Set `NODE_ENV=production`, a 32+ character `SESSION_SECRET`, MongoDB URI, Gemini key/model, and exact `CLIENT_URL` in the hosting environment.
- Set the frontend `VITE_API_BASE_URL` to the deployed `/api` endpoint and rebuild the client.
- Serve both apps over HTTPS. The session cookie is HttpOnly, host-only, Secure in production, SameSite=Lax, and scoped to `/api`.
- Configure an allowed deployment origin; credentialed CORS does not permit wildcards.
- Verify `/api/health`, `/api/ready`, case creation, refresh/resume, accusation, and result privacy on the deployed site.
- Do not commit `.env` files or real credentials.

## Troubleshooting

- **Database unavailable:** verify MongoDB is running and `MONGODB_URI` is correct/reachable.
- **Gemini not configured:** enable development mock mode or set the backend API key and model.
- **Browser CORS error:** make `CLIENT_URL` exactly match the frontend origin, including scheme and port.
- **Case session unavailable after deployment:** keep the API host stable and use HTTPS; sessions intentionally cannot be resumed from another browser or anonymous session.
- **Generation failed:** inspect the server log for the provider error category, verify Gemini quota/model access, and retry. Internal provider details are not returned to the browser.

## Scope note

Notebook notes, evidence pinning, connections, and replay are P1 or future work in the specification and are not part of the initial playable release.
