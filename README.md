# 🛍️ Raj Mobile & Electrics — Mobile & Electronics E-Commerce Platform

A production-ready Amazon-style e-commerce platform for electronics, gadgets, and accessories. Built with React, TypeScript, Node.js, Express, PostgreSQL, and Prisma.

## 🏗 Architecture

```
frontend/          → React + TypeScript + Vite + TailwindCSS v4
backend/           → Node.js + Express + TypeScript
prisma/            → PostgreSQL ORM (schema + migrations + seed)
docker-compose.yml → Local PostgreSQL + Redis
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for local DB)
- Git

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Start Database

```bash
# From project root
docker compose up -d
```

### 3. Setup Backend

```bash
cd backend

# Copy env file (already created with dev defaults)
# Edit .env if needed

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed
```

### 4. Start Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Prisma Studio: `npx prisma studio`

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rajmobileandelectrics.com | Admin@123 |
| Customer | customer@test.com | Customer@123 |

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, Redux Toolkit |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Cache | Redis |
| Auth | JWT (Access + Refresh tokens), Google OAuth |
| Payments | Stripe, eSewa, Khalti, COD |
| Storage | Cloudinary |
| Email | Resend |

## 🗂 Product Categories

| Category | Products |
|----------|----------|
| Smartphones | Samsung, Apple, Xiaomi, OnePlus, etc. |
| Tablets | iPad, Galaxy Tab, etc. |
| Smart Watches | Apple Watch, Galaxy Watch, Amazfit, Garmin |
| Earbuds | AirPods, Galaxy Buds, Sony WF-1000XM5 |
| Headphones | Over-ear and on-ear headphones |
| Chargers | Wall chargers, car chargers, cables |
| Power Banks | Anker, Baseus, Xiaomi, Samsung, Ugreen |
| Cases & Covers | Phone cases, screen protectors |
| Cameras | Sony, Canon, Nikon, GoPro, DJI |
| Camera Accessories | Lenses, tripods, memory cards |
| Speakers | JBL, Bose, Bluetooth speakers |
| Gaming Accessories | Controllers, gaming headsets |
| Laptop Accessories | Stands, hubs, keyboards, mice |
| Other Electronics | Miscellaneous gadgets |

## 🔌 API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Register, Login, Refresh, Logout, Google OAuth |
| Users | `/api/users` | Profile, Addresses, Admin user management |
| Products | `/api/products` | CRUD, Featured, Latest, Search |
| Categories | `/api/categories` | CRUD with hierarchy |
| Cart | `/api/cart` | Add/Update/Remove items, Apply coupon |
| Wishlist | `/api/wishlist` | Add/Remove/Move to cart |
| Orders | `/api/orders` | Checkout, Track, Cancel, Admin status updates |
| Payments | `/api/payments` | Stripe, eSewa, Khalti integration |
| Reviews | `/api/reviews` | Submit, Approve, Admin moderation |
| Coupons | `/api/coupons` | Validate, Admin CRUD |
| Banners | `/api/banners` | Public list, Admin CRUD with images |
| Analytics | `/api/admin/analytics` | Dashboard, Revenue, Top products |
| Search | `/api/search` | Full-text search, Suggestions |

## 🚀 Deployment

### 1. Database → Neon PostgreSQL
1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy the connection string (with pooled connection support if available).
3. The schema will be automatically migrated during the Backend deployment stage.

### 2. Backend → Render
1. Sign up on [Render.com](https://render.com) and link your GitHub repository.
2. Click **New** → **Web Service**.
3. Select your repository and configure the service:
   - **Name**: `rajmobile-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. In the **Environment Variables** section, add the required values (see `.env.example`).
5. Click **Deploy Web Service**.

### 3. Frontend → Vercel
1. Sign up on [Vercel.com](https://vercel.com) and link your GitHub repository.
2. Click **Add New** → **Project**.
3. Select your repository and configure the settings:
   - **Framework Preset**: `Vite` (Vercel automatically detects this)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In the **Environment Variables** section, add:
   - `VITE_API_URL`: Your Render backend API endpoint (e.g., `https://rajmobile-backend.onrender.com/api`).
5. Click **Deploy**.


## 📋 Features

### Customer
- ✅ Register / Login with JWT
- ✅ Browse & Search products across all categories
- ✅ Filter by category, brand, price, availability
- ✅ Product detail with image gallery & specifications
- ✅ Add to cart / wishlist
- ✅ Multi-step checkout
- ✅ Multiple payment gateways (Stripe, eSewa, Khalti, COD)
- ✅ Order tracking with timeline
- ✅ Profile & address management
- ✅ Review purchased products

### Admin
- ✅ Dashboard with KPI stats
- ✅ Product CRUD with image upload & specifications editor
- ✅ Category management (14 categories)
- ✅ Order management with status updates
- ✅ User management with role control
- ✅ Review moderation (approve/delete)
- ✅ Coupon management
- ✅ Banner management
- ✅ Analytics with charts

### Security
- ✅ Helmet security headers
- ✅ CORS configured
- ✅ Rate limiting (tiered)
- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT with refresh token rotation
- ✅ Input validation (Zod)
- ✅ Role-based access control

## License

MIT
