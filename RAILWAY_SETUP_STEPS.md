# 🚀 Railway Setup - 3 Services Required

## Overview
You need to create **3 services** in Railway:
1. PostgreSQL Database
2. Backend API (Node.js)
3. Frontend (Next.js)

---

## 📋 Step-by-Step Setup

### **Service 1: PostgreSQL Database** (Do This First!)

1. Go to your Railway project: **zooming-growth**
2. Click **"New"** button
3. Select **"Database"** → **"PostgreSQL"**
4. Railway will create the database automatically
5. **Copy the DATABASE_URL** - you'll need it for backend

✅ Database is now ready!

---

### **Service 2: Backend API** (Do This Second!)

1. In the same project, click **"New"** button
2. Select **"GitHub Repo"**
3. Choose: **maanisingh/kiaan-wms**
4. Railway will create a service - **WAIT, don't deploy yet!**

#### Configure Backend Service:

1. Click on the newly created service
2. Go to **"Settings"** tab
3. Under **"Build"** section:
   - **Root Directory**: `backend`
   - **Start Command**: `node server.js`
   - Click **"Save"**

4. Go to **"Variables"** tab
5. Click **"+ New Variable"** and add these:

```
DATABASE_URL = <Paste the PostgreSQL URL from Database service>
PORT = 8010
NODE_ENV = production
JWT_SECRET = wms_production_secret_key_2024_very_secure
```

6. Click **"Deploy"** to trigger deployment

#### After Backend Deploys Successfully:

1. Go to backend service
2. Click **"..."** menu → **"Terminal"**
3. Run these commands:
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

4. Copy your backend URL (e.g., `https://backend-production-xxxx.up.railway.app`)

✅ Backend API is now running!

---

### **Service 3: Frontend** (Do This Last!)

1. In the same project, click **"New"** button again
2. Select **"GitHub Repo"**
3. Choose: **maanisingh/kiaan-wms** (same repo, different service!)
4. Railway will create another service - **WAIT, don't deploy yet!**

#### Configure Frontend Service:

1. Click on the newly created service
2. Go to **"Settings"** tab
3. Under **"Build"** section:
   - **Root Directory**: `frontend`
   - Railway will auto-detect Next.js
   - Click **"Save"**

4. Go to **"Variables"** tab
5. Click **"+ New Variable"** and add:

```
NEXT_PUBLIC_API_URL = https://your-backend-url.up.railway.app/api
NODE_ENV = production
```

⚠️ **Replace** `your-backend-url.up.railway.app` with your actual backend URL!

6. Click **"Deploy"**

✅ Frontend is now running!

---

## 🎯 Final Architecture

After setup, you'll have **3 services**:

```
zooming-growth (Railway Project)
├── postgres-database
│   └── Port: 5432
│   └── Provides: DATABASE_URL
│
├── kiaan-wms-backend
│   └── Root: /backend
│   └── URL: https://backend-production-xxxx.up.railway.app
│   └── Health: /health
│
└── kiaan-wms-frontend
    └── Root: /frontend
    └── URL: https://frontend-production-xxxx.up.railway.app
    └── Login: /auth/login
```

---

## ✅ Verification Checklist

### Database
- [ ] PostgreSQL service created
- [ ] DATABASE_URL available

### Backend
- [ ] Service created from GitHub
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] Deployment successful
- [ ] Migrations run (prisma db push)
- [ ] Seed data loaded
- [ ] Health check works: `curl https://backend-url/health`

### Frontend
- [ ] Service created from GitHub (same repo)
- [ ] Root directory set to `frontend`
- [ ] NEXT_PUBLIC_API_URL points to backend
- [ ] Deployment successful
- [ ] Can access: `https://frontend-url/auth/login`
- [ ] Can login with admin@kiaan.com / admin123

---

## 🧪 Test Your Deployment

### 1. Test Backend Health
```bash
curl https://your-backend-url.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "WMS API is running",
  "database": "PostgreSQL + Prisma"
}
```

### 2. Test Backend Login
```bash
curl -X POST https://your-backend-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"admin123"}'
```

Expected: JSON with token

### 3. Test Frontend
Open: `https://your-frontend-url.up.railway.app`
- Should see login page
- Login with: admin@kiaan.com / admin123
- Navigate to Products → Brands (should see 10 brands)
- Navigate to Products → Bundles (should see 16 bundles)

---

## 🚨 Common Issues

### "Cannot connect to database"
- Make sure DATABASE_URL is set in backend variables
- Check PostgreSQL service is running

### "API requests fail from frontend"
- Verify NEXT_PUBLIC_API_URL is correct
- Make sure it ends with `/api`
- Example: `https://backend-xxx.up.railway.app/api`

### "Build failed - package.json not found"
- Check Root Directory is set correctly
- Backend should be: `backend`
- Frontend should be: `frontend`

### "502 Bad Gateway"
- Backend might still be starting
- Check backend logs for errors
- Verify PORT is set to 8010 in backend

---

## 📝 Quick Reference

**GitHub Repo:** https://github.com/maanisingh/kiaan-wms

**Login Credentials:**
- Email: admin@kiaan.com
- Password: admin123

**Backend Root:** `backend`
**Frontend Root:** `frontend`

**Backend Start Command:** `node server.js`

---

## 🎉 You're Done!

After completing all steps, you'll have a fully functional WMS platform running on Railway with:
- ✅ Backend API with all features
- ✅ PostgreSQL database with seed data
- ✅ Frontend with all new pages
- ✅ 10 brands, 16 bundles, replenishment, analytics, and more!

