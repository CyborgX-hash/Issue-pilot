# GitHub App Setup Guide

This guide details how to register and configure a GitHub App for IssuePilot, both for local development and for production deployment.

---

## 1. Creating the GitHub App

1. Navigate to your GitHub account or organization settings:
   - Personal account: `https://github.com/settings/apps`
   - Organization: `https://github.com/organizations/<your-org>/settings/apps`
2. Click **New GitHub App**.
3. Fill in the primary details:
   - **GitHub App name**: `IssuePilot` (or a unique name like `IssuePilot-Dev-<username>`)
   - **Homepage URL**:
     - Local: `http://localhost:5173`
     - Production: `https://your-issuepilot-client.vercel.app`

---

## 2. Identifying URL Configurations

| Configuration Field | Local Development | Production |
| :--- | :--- | :--- |
| **Callback URL** | `http://localhost:4000/api/auth/github/callback` | `https://your-api.onrender.com/api/auth/github/callback` |
| **Setup URL (optional)** | `http://localhost:5173/install/callback` | `https://your-issuepilot-client.vercel.app/install/callback` |
| **Webhook URL** | `https://<your-ngrok-tunnel>.ngrok-free.app/api/webhooks/github` | `https://your-api.onrender.com/api/webhooks/github` |
| **Webhook Secret** | Any 32+ char secret (e.g. `openssl rand -hex 20`) | Secure secret matching `GITHUB_WEBHOOK_SECRET` |

---

## 3. Permissions Configuration

IssuePilot enforces the principle of least privilege. Configure the following permissions:

### Repository Permissions
- **Metadata**: `Read-only` (Mandatory for all GitHub Apps to inspect repository attributes)
- **Issues**: `Read and write` (Required to fetch issues, suggest labels, post clarification comments, and apply approved labels)

### User Permissions
- **Email addresses**: `Read-only` (Used to populate the user profile and identify maintainers)

---

## 4. Subscribed Webhook Events
Under **Subscribe to events**, select:
- **Installation** (tracks when the app is installed or uninstalled)
- **Installation target** (tracks repositories added or removed)
- **Issues** (tracks when an issue is opened, edited, labeled, or closed)
- **Issue comment** (tracks responses to clarification requests)

---

## 5. Where can this GitHub App be installed?
Select:
- **Any account** (allows you and other users to install it on private or public repositories)

---

## 6. Generating Secrets and Private Keys

After saving the App:
1. Note the **App ID** (e.g., `123456`) -> Set as `GITHUB_APP_ID`.
2. Note the **Client ID** (e.g., `Iv1.xxxxxxxx`) -> Set as `GITHUB_CLIENT_ID`.
3. Click **Generate a new client secret** -> Copy the secret -> Set as `GITHUB_CLIENT_SECRET`.
4. Under **Private keys**, click **Generate a private key**.
   - Download the `.pem` file.
   - For local development, copy the contents of the PEM file into your `.env`:
     ```env
     GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
     ```
   - *Never commit this private key to Git.*

---

## 7. Testing the Installation Flow

1. From the GitHub App settings page, click **Install App** in the left sidebar.
2. Select your test account or organization.
3. Choose **Only select repositories** and pick one test repository.
4. Click **Install**.
5. Once installed, GitHub will redirect to your configured Setup URL (`/install/callback`) with `installation_id`. IssuePilot links the installation to your account.
