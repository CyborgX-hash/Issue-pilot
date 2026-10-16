# Testing Strategy & Verification Plan

IssuePilot implements a multi-layered testing strategy ensuring all authorization, business logic, AI validation, and webhook security work accurately under both automated and manual verification.

---

## 1. Automated Testing Architecture

The automated test suite uses **Vitest** and **Supertest**. It does not require live GitHub credentials or paid AI tokens to execute.

### Test Categories
1. **API & Route Tests**:
   - Health check endpoint verification
   - Authentication state & session protection
   - Unauthorized access rejection (401 / 403)
2. **Repository & Authorization Tests**:
   - Access control across different repository owners
   - IDOR prevention on issue and triage action endpoints
3. **Issue Synchronization**:
   - Pull request exclusion (verifies PRs are never treated as issues)
   - Pagination and upsert logic
4. **AI Output Validation**:
   - Zod schema validation on structured AI output
   - Malformed/hallucinated JSON handling and fallback
   - Unknown label filtering (suggested labels must match existing repository labels)
5. **Semantic Duplicate Detection**:
   - Cosine similarity computation
   - Exclusion of target issue from candidate list
   - Similarity threshold ranking
6. **Approval Workflow & Idempotency**:
   - Transitioning `PENDING` -> `APPROVED` -> `APPLIED`
   - Rejection behavior (`REJECTED`)
   - Double-approval / duplicate execution protection
7. **Webhook Security**:
   - HMAC-SHA256 signature verification
   - Rejection of tampered payloads
   - Delivery ID deduplication

---

## 2. Running Automated Tests

```bash
# Run complete test suite
npm test

# Run backend tests only
cd server && npm test

# Run tests with coverage
cd server && npm run test:coverage
```

---

## 3. Manual End-to-End Verification Procedure

When live GitHub App credentials are configured:

1. **GitHub Login**:
   - Navigate to `http://localhost:5173`.
   - Click **Connect GitHub**.
   - Verify redirect to GitHub authorization, consent screen, and return to IssuePilot with an active session.

2. **App Installation**:
   - Click **Install IssuePilot GitHub App**.
   - Select a designated test repository with issues.
   - Verify callback redirect and listing of the repository in the IssuePilot dashboard.

3. **Issue Synchronization**:
   - Open repository in IssuePilot.
   - Click **Synchronize Issues**.
   - Confirm open issues are fetched without pull requests.

4. **Issue Analysis**:
   - Select an issue and click **Analyze Issue**.
   - Verify AI classification (Category, Priority, Missing Info, Suggested Labels).
   - Check duplicate candidate detection list.

5. **Approval Queue Execution**:
   - Inspect proposed actions in the Review Queue.
   - Click **Approve & Apply** on a label recommendation.
   - Open GitHub in a browser and verify the label has been applied to the live issue.
   - Confirm IssuePilot updates the action status to `APPLIED` with the GitHub response timestamp.
