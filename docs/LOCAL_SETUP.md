# Local Development Setup Guide

Follow this step-by-step guide to run IssuePilot locally on your machine.

---

## 1. Prerequisites

Ensure you have the following installed:
- **Node.js**: v20.0.0 or higher (`node -v`)
- **npm**: v10.0.0 or higher (`npm -v`)
- **MySQL**: v8.0 or compatible database server running locally (`mysql --version`)
- **Git**: v2.30 or higher

---

## 2. Clone and Setup Environment

```bash
# Clone the repository
git clone https://github.com/CyborgX-hash/Issue-pilot.git
cd Issue-pilot

# Install root, server, and client dependencies
npm install

# Create server .env
cp .env.example server/.env
```

---

## 3. Database Initialization

Ensure MySQL is running:
```bash
# Verify MySQL connection
mysqladmin ping -u root

# Create the development database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS issuepilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Generate Prisma Client and run migrations
cd server
npx prisma migrate dev --name init
cd ..
```

---

## 4. Configuring Credentials in `server/.env`

Update `server/.env` with your values:
- `DATABASE_URL`: `mysql://root:@localhost:3306/issuepilot` (adjust password if your MySQL user has one)
- `SESSION_SECRET`: Random 32+ character string
- `GITHUB_APP_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_PRIVATE_KEY`: Obtained from your GitHub App (see [GITHUB_APP_SETUP.md](./GITHUB_APP_SETUP.md))
- `AI_PROVIDER`: `groq` (or `local` for Ollama / vLLM)
- `AI_API_KEY`: API key for your hosted inference provider

*Note: Automated tests run with in-memory / mock providers and do not require live credentials to pass.*

---

## 5. Starting Development Servers

To run both backend (`http://localhost:4000`) and frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Alternatively, you can run them in separate terminals:
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

---

## 6. Running Tests

```bash
# Run all tests across workspaces
npm test

# Run backend tests only
npm run test:server

# Run frontend tests only
npm run test:client
```

---

## 7. Verifying Local Health

- Backend health endpoint: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- Frontend UI: [http://localhost:5173](http://localhost:5173)
