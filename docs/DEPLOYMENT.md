# Deployment Guide

IssuePilot is designed for modern cloud architectures:
- **Frontend**: Vercel
- **Backend API & Webhooks**: Render (Web Service)
- **Database**: Managed MySQL (e.g., PlanetScale, AWS RDS, Aiven, or Render Managed MySQL)

---

## 1. Database Deployment

1. Provision a MySQL 8.0 instance on your preferred cloud provider.
2. Obtain the connection string (with SSL parameters if required):
   `mysql://user:password@host:port/database?sslaccept=strict`
3. Execute migrations in CI/CD or locally targeting the production database:
   ```bash
   npx prisma migrate deploy
   ```

---

## 2. Backend Deployment on Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your repository: `https://github.com/CyborgX-hash/Issue-pilot`.
3. Configure settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node src/server.js`
4. Set Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default or customized)
   - `DATABASE_URL`: Your managed MySQL connection string
   - `SESSION_SECRET`: Cryptographically random 32+ character string
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `BACKEND_URL`: `https://your-service.onrender.com`
   - `GITHUB_APP_ID`: Production App ID
   - `GITHUB_CLIENT_ID`: Production Client ID
   - `GITHUB_CLIENT_SECRET`: Production Client Secret
   - `GITHUB_PRIVATE_KEY`: RSA Private Key PEM
   - `GITHUB_WEBHOOK_SECRET`: Secure Webhook Secret
   - `AI_PROVIDER`: `groq` (or chosen provider)
   - `AI_MODEL`: `gemma2-9b-it`
   - `AI_API_KEY`: API Key
   - `AI_BASE_URL`: Provider Base URL
5. Render provides an automatic HTTPS URL (e.g. `https://issuepilot-api.onrender.com`).

---

## 3. Frontend Deployment on Vercel

1. Import the repository in [Vercel](https://vercel.com).
2. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure Environment Variables:
   - `VITE_BACKEND_URL`: `https://your-service.onrender.com`
4. Deploy. Vercel provisions a production domain with automatic SSL and edge caching.

---

## 4. GitHub App URL Updating

Once production URLs are live:
1. Update GitHub App settings:
   - **Homepage URL**: `https://your-frontend.vercel.app`
   - **User Authorization Callback URL**: `https://your-service.onrender.com/api/auth/github/callback`
   - **Setup URL**: `https://your-frontend.vercel.app/install/callback`
   - **Webhook URL**: `https://your-service.onrender.com/api/webhooks/github`
2. Test webhooks using GitHub's **Recent Deliveries** tab.
