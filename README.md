# IssuePilot

> **Less time triaging. More time building.**

IssuePilot is a production-minded, AI-powered GitHub issue management platform designed for open-source maintainers and engineering teams. It connects directly with GitHub via a dedicated GitHub App, categorizes incoming issues using open-weight AI (Gemma), detects potential duplicate issues through semantic similarity, and identifies missing bug report information.

Crucially, **IssuePilot enforces human-in-the-loop oversight**: AI recommendations are staged in an approval queue where maintainers can inspect, edit, approve, or reject changes before any action is committed to GitHub.

---

## Features

- **GitHub App Integration**: Clean authorization and granular installation flow scoping permissions only to selected repositories.
- **Automated Issue Synchronization**: Fetches and caches issues and labels, filtering out pull requests cleanly.
- **Open-Weight AI Triage**:
  - Classifies issues into `BUG`, `FEATURE_REQUEST`, `ENHANCEMENT`, `DOCUMENTATION`, `QUESTION`, or `OTHER`.
  - Recommends issue priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) grounded in factual evidence.
  - Suggests labels that **already exist** in the repository.
  - Identifies missing details (reproduction steps, versions, logs, environment).
  - Drafts respectful clarification comments for incomplete bug reports.
- **Semantic Duplicate Detection**:
  - Open embedding vectors compare new issues against existing repository issues.
  - Returns ranked duplicate candidates with similarity scores and deep links.
- **Human Approval Workflow**:
  - Proposed triage actions remain `PENDING` until explicitly approved.
  - Maintainers can edit proposed labels or comments prior to application.
  - Idempotent execution prevents race conditions or duplicate comment submissions.
- **Security & Privacy by Design**:
  - Zero direct AI write permissions.
  - Short-lived installation access tokens.
  - Untrusted issue body prompt injection defense.
  - HMAC-SHA256 signature verification for all GitHub webhooks.
- **Minimal Developer-Tool UI**:
  - Restrained, typography-driven, information-dense interface inspired by Linear and GitHub.
  - Zero AI hype, no fake metrics, no gratuitous animations.

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Lucide React icons.
- **Backend**: Node.js (ES Modules), Express.js, Zod, Octokit.
- **Database**: MySQL with Prisma ORM (relational constraints, foreign keys, migrations).
- **AI Engine**: Open-weight instruction model (Gemma) with provider-agnostic interface (Groq / Ollama / local compatible), open embeddings for similarity.
- **Testing**: Vitest, Supertest, automated mock suite.
- **Deployments**: Vercel (Frontend), Render (Backend & Webhooks), Managed MySQL.

---

## Repository Structure

```text
Issue-pilot/
├── client/                     # Vite + React frontend application
├── server/                     # Express REST API, Prisma ORM, AI engine
├── docs/                       # Architecture, GitHub App, security, deployment, and testing docs
├── .env.example                # Canonical environment template
├── README.md
└── package.json                # Monorepo workspaces configuration
```

---

## Quickstart & Local Setup

### 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- MySQL running locally (or remote MySQL connection)

### 2. Install Dependencies
```bash
git clone https://github.com/CyborgX-hash/Issue-pilot.git
cd Issue-pilot
npm install
```

### 3. Configure Environment
Copy `.env.example` to `server/.env` and update required parameters:
```bash
cp .env.example server/.env
```
See [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) for full instructions and [docs/GITHUB_APP_SETUP.md](docs/GITHUB_APP_SETUP.md) for creating your GitHub App.

### 4. Database Setup & Migrations
```bash
cd server
npx prisma migrate dev --name init
cd ..
```

### 5. Run Development Servers
```bash
# Starts backend on :4000 and frontend on :5173
npm run dev
```

---

## Running Automated Tests

```bash
# Run all tests across backend and frontend
npm test

# Run backend integration tests
npm run test:server
```

---

## Documentation Index

- [Architecture & Data Flows](docs/ARCHITECTURE.md)
- [GitHub App Setup Guide](docs/GITHUB_APP_SETUP.md)
- [Local Development Setup](docs/LOCAL_SETUP.md)
- [Production Deployment (Vercel & Render)](docs/DEPLOYMENT.md)
- [Security & Prompt Injection Policy](docs/SECURITY.md)
- [Testing Strategy & Verification](docs/TESTING.md)

---

## Current Status & Roadmap

- [x] Monorepo architecture & documentation
- [ ] Prisma schema, MySQL database connection, and health endpoint (Milestone 2)
- [ ] GitHub App authentication, installation handshake, and session management (Milestone 3)
- [ ] Repository selection and issue synchronization (Milestone 4)
- [ ] Open-weight Gemma AI triage and strict Zod validation (Milestone 5)
- [ ] Semantic duplicate detection and embeddings (Milestone 6)
- [ ] React dashboard, issue explorer, and detail views (Milestone 7)
- [ ] Approval queue and authenticated GitHub write operations (Milestone 8)
- [ ] Webhook processing and sync improvements (Milestone 9)
- [ ] Security hardening, automated testing suite, and deployment readiness (Milestone 10)
