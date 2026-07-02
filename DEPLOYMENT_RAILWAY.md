# Raj Mobile & Electrics — Railway & Vercel Deployment Guide

## Prerequisites

- A [Railway](https://railway.app) account.
- A [Vercel](https://vercel.com) account.
- Your project pushed to a GitHub repository.

---

## 1. Database & Backend Deployment (Railway)

1. Log in to [Railway](https://railway.app).
2. Click **New Project** → **Provision PostgreSQL** (to create an internal Railway Postgres instance).
3. Once the database is provisioned, click **New** → **GitHub Repo** → select your repository.
4. Go to the new service settings in Railway:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Go to the **Variables** tab and click **Raw Editor**. Paste the following environment variables (replace placeholders with actual keys):

```ini
PORT=5000
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (Generate secure keys)
JWT_ACCESS_SECRET=your-random-jwt-access-secret-32-chars-min
JWT_REFRESH_SECRET=your-random-jwt-refresh-secret-32-chars-min
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary Credentials (For product images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (Update this after deploying to Vercel)
FRONTEND_URL=https://your-vercel-app-name.vercel.app

# App configuration
APP_NAME=Raj Mobile & Electrics
DEFAULT_CURRENCY=NPR
TAX_RATE=13
DELIVERY_FEE=100
FREE_DELIVERY_THRESHOLD=5000

# Admin Seed Account (Run first time only)
ADMIN_EMAIL=admin@rajmobileandelectrics.com
ADMIN_PASSWORD=your-super-strong-admin-password
```

6. Click **Save**. Railway will automatically trigger a build, run database migrations (`npx prisma migrate deploy`), and deploy the service.
7. Go to **Settings** → **Public Networking** → click **Generate Domain** to get your public API URL (e.g., `https://rajmobile-production.up.railway.app`).

---

## 2. Frontend Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project** → select your GitHub repository.
3. In the project setup:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Railway API URL with the `/api` path (e.g., `https://rajmobile-production.up.railway.app/api`).
5. Click **Deploy**. Vercel will compile and host the static app.
6. Copy the Vercel URL (e.g. `https://rajmobile.vercel.app`) and update the `FRONTEND_URL` environment variable on your Railway service dashboard.

---

## 3. Seed Initial Admin Account
1. Open your Railway dashboard.
2. Click on the `backend` service → click **Shell** or **Terminal** tab (or connect via Railway CLI using `railway connect`).
3. Run the prisma seed command to create the initial admin user with the credentials set in your env:
```bash
npx prisma db seed
```
4. Log in at `https://your-vercel-app.vercel.app/login` with your admin email and password.
