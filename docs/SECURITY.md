# Security & Compliance Model

Security is fundamental to IssuePilot. Because IssuePilot connects to GitHub repositories and processes issue contents through AI, multiple security boundaries are strictly enforced.

---

## 1. Zero Direct AI Write Authority

The AI engine operates exclusively in an advisory capacity:
- The AI service can ONLY generate structured recommendations (`IssueAnalysis`).
- Under no circumstances can the AI service directly trigger GitHub write APIs (labeling, commenting, or closing).
- All proposed mutations are stored as pending `TriageAction` records requiring explicit, authenticated user approval.

---

## 2. Authentication & Authorization Boundaries

### Separation of Identity and Permissions
- GitHub user authentication (OAuth) establishes the maintainer's identity.
- GitHub App installation grants IssuePilot permission to access specific repositories.
- Possession of an `installation_id` or `repository_id` is never sufficient to execute an action.
- Every API endpoint that accesses repository data or executes approvals independently queries GitHub or verified database memberships to ensure the active user has `admin` or `write` permissions on that specific repository.

### Insecure Direct Object Reference (IDOR) Mitigation
- All repository, issue, and action IDs are verified against the user's authorized repository scope before data is retrieved or modified.

---

## 3. GitHub Credential Protection

- **Private Key Storage**: The GitHub App private key is stored exclusively on the server in secure environment variables. It is never exposed via API endpoints, client builds, or log outputs.
- **Short-Lived Installation Access Tokens**: IssuePilot generates short-lived installation access tokens (expiring in 1 hour) on-demand using GitHub App JWT authentication. Tokens are discarded after their operational scope and never transmitted to the frontend.
- **Client Secrets**: OAuth client secret is restricted strictly to backend-to-backend token exchange.

---

## 4. Prompt Injection Defense

Issue titles, bodies, and author comments are untrusted user input:
- Issue contents are quarantined inside clear XML/JSON structure delimiters before being passed to LLM prompts.
- Explicit system instructions enforce that instructions contained within the user issue cannot override system rules, leak secrets, or impersonate maintainers.
- AI outputs are rigorously parsed and validated using Zod against tight schemas (e.g., categories must match a strict enum; labels suggested must already exist in the repository's known label list).

---

## 5. Webhook Security

- Incoming webhooks from GitHub are verified using HMAC-SHA256 signatures (`X-Hub-Signature-256`) against the raw request body.
- Webhook payloads with invalid or missing signatures are rejected with HTTP 401.
- Delivery IDs (`X-GitHub-Delivery`) are recorded to guarantee idempotent processing and reject duplicate event deliveries.

---

## 6. Logging and Redaction

- Sensitive tokens, credentials, cookie headers, and authorization headers are scrubbed before logging.
- Structured logs output timestamp, log level, request ID, and contextual identifiers without PII or sensitive keys.
