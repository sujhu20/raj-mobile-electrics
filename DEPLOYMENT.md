# Raj Mobile & Electrics — Coolify Deployment Guide

## Prerequisites

- A VPS (Ubuntu 22.04 recommended) with at least **2GB RAM / 2 vCPU**
- SSH access to the VPS
- Your GitHub repository with this code pushed

---

## Step 1 — Install Coolify on Your VPS

SSH into your VPS:

```bash
ssh root@YOUR_VPS_IP
```

Run the Coolify installer:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Once done, access Coolify at: `http://YOUR_VPS_IP:8000`

Create your admin account on first visit.

---

## Step 2 — Generate Secrets

On your local machine (or the VPS), generate secure secrets:

```bash
# JWT secrets (run once each)
openssl rand -hex 64   # paste into JWT_ACCESS_SECRET
openssl rand -hex 64   # paste into JWT_REFRESH_SECRET

# Postgres password
openssl rand -hex 32   # paste into POSTGRES_PASSWORD
```

---

## Step 3 — Connect GitHub to Coolify

1. In Coolify → **Sources** → Add **GitHub**
2. Follow the OAuth flow to connect your GitHub account
3. Coolify can now auto-deploy on every `git push`

---

## Step 4 — Create the Stack (Docker Compose)

1. Coolify → **Projects** → **New Project** → name it `raj-mobile`
2. **New Resource** → **Docker Compose**
3. Select your GitHub repo, branch `main`
4. Coolify will detect `docker-compose.yml` at the root

---

## Step 5 — Set Environment Variables

In Coolify's **Environment Variables** panel, add **all** of the following:

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://YOUR_VPS_IP

DATABASE_URL=postgresql://rajmobile:YOUR_POSTGRES_PASSWORD@postgres:5432/rajmobile
POSTGRES_DB=rajmobile
POSTGRES_USER=rajmobile
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD

REDIS_URL=redis://:YOUR_REDIS_PASSWORD@redis:6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

JWT_ACCESS_SECRET=YOUR_GENERATED_SECRET
JWT_REFRESH_SECRET=YOUR_OTHER_GENERATED_SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

APP_NAME=Raj Mobile & Electrics
DEFAULT_CURRENCY=NPR
TAX_RATE=13
DELIVERY_FEE=100
FREE_DELIVERY_THRESHOLD=5000

ADMIN_EMAIL=admin@rajmobileandelectrics.com
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD

VITE_API_URL=http://YOUR_VPS_IP:5000/api
```

---

## Step 6 — Deploy

Click **Deploy** in Coolify. It will:
1. Pull your GitHub repo
2. Build backend Docker image (TypeScript compiled → node)
3. Build frontend Docker image (Vite build → nginx)
4. Start PostgreSQL and wait for health
5. Start Redis and wait for health
6. Run `prisma migrate deploy` automatically
7. Start backend API on port 5000
8. Start frontend nginx on port 80

First deploy takes 3-5 minutes for image builds.

---

## Step 7 — Verify

```bash
# Backend health
curl http://YOUR_VPS_IP:5000/api/health

# Frontend
curl http://YOUR_VPS_IP
```

---

## Step 8 — Seed Admin Account (First Deploy Only)

```bash
docker exec -it rajmobile-backend sh
npx prisma db seed
```

---

## Port Reference

| Service   | Port | Accessible |
|-----------|------|------------|
| Frontend  | 80   | Public     |
| Backend   | 5000 | Public     |
| Coolify   | 8000 | Public     |
| PostgreSQL | 5432 | Internal  |
| Redis     | 6379 | Internal   |

---

## Adding a Domain Later (Optional)

1. Point DNS A record to your VPS IP
2. In Coolify, assign domain to the frontend service
3. Coolify + Traefik auto-provisions Let's Encrypt SSL
4. Update env vars: `FRONTEND_URL=https://yourdomain.com` and `VITE_API_URL=https://yourdomain.com/api`
5. Redeploy

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Backend exits on start | `docker logs rajmobile-backend` — check for missing env vars |
| Database connection error | Verify POSTGRES_PASSWORD matches in DATABASE_URL |
| Frontend blank page | Check VITE_API_URL points to correct IP:port |
| CORS error in browser | FRONTEND_URL must match exactly what you see in browser address bar |
