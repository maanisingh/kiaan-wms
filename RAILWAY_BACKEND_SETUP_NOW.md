# 🚀 Deploy WMS Backend to Railway - RIGHT NOW!

**GitHub Commit:** ✅ DONE - Just pushed to `main` branch!
**Repository:** https://github.com/maanisingh/kiaan-wms
**Backend Path:** `backend/` (subdirectory in monorepo)

---

## ✅ Step 1: GitHub Push - COMPLETED!

Your backend code is now on GitHub:
- **Repository:** maanisingh/kiaan-wms
- **Branch:** main
- **Latest Commit:** "feat: Add backend deployment configuration and documentation"
- **Files Committed:**
  - Backend deployment instructions
  - Backend security (.gitignore)
  - Deployment helper script
  - All backend source code (server.js, 40+ API endpoints)

---

## 🎯 Step 2: Deploy to Railway (5 minutes)

### Option A: Railway UI (Recommended - Easiest)

#### 1. Go to Railway Dashboard
**URL:** https://railway.app/dashboard

#### 2. Create New Service
- Click **"New Project"**
- OR select existing project **"kiaan-wms-production"** (if it exists)
- Click **"New"** button
- Select **"GitHub Repo"**

#### 3. Select Your Repository
- Search for: **"kiaan-wms"**
- Select: **maanisingh/kiaan-wms**
- Click **"Add"** or **"Deploy"**

#### 4. Configure Root Directory (IMPORTANT!)
Since your backend is in a subdirectory:

- After service is created, click on the service
- Go to **"Settings"** tab
- Find **"Root Directory"** section
- Set root directory to: **`backend`**
- Click **"Save"**

#### 5. Add Environment Variables

Click **"Variables"** tab and add these:

```bash
# REQUIRED: Port (Railway provides PORT automatically, but we set default)
PORT=8010

# REQUIRED: Environment
NODE_ENV=production

# REQUIRED: JWT Secret (CHANGE THIS!)
JWT_SECRET=kiaan_wms_super_secure_jwt_secret_key_production_2024_CHANGE_ME

# REQUIRED: Database Connection
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OPTIONAL: CORS Origins (will be configured in code)
CORS_ORIGIN=https://frontend-production-c9100.up.railway.app,https://wms.alexandratechlab.com
```

**IMPORTANT:** If you don't have a PostgreSQL database in this Railway project:
- Click **"New"** → **"Database"** → **"Add PostgreSQL"**
- Railway will automatically create `DATABASE_URL` variable
- Link it to your backend service

#### 6. Deploy!

Railway will automatically:
1. Detect it's a Node.js project
2. Run `npm install`
3. Execute pre-deploy command: `npx prisma db push && node prisma/seed.js`
4. Start server: `node server.js`

**Watch the logs:**
- Click on **"Deployments"** tab
- Click on the active deployment
- Watch build logs in real-time

#### 7. Get Your Backend URL

After deployment succeeds:
- Go to **"Settings"** tab
- Click **"Generate Domain"** (if not auto-generated)
- Copy your backend URL: `https://backend-production-xxxx.up.railway.app`

---

### Option B: Railway CLI (Alternative - For Advanced Users)

```bash
# 1. Login to Railway
railway login

# 2. Navigate to backend directory
cd /root/kiaan-wms/backend

# 3. Link to Railway project
railway link
# Select: kiaan-wms-production

# 4. Set environment variables
railway variables set PORT=8010
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_secure_secret_here
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'

# 5. Deploy
railway up

# 6. Check logs
railway logs

# 7. Open in browser
railway open
```

---

## 🧪 Step 3: Test Your Backend (2 minutes)

Once deployed, test these endpoints:

### Test 1: Health Check
```bash
# Replace with your actual Railway URL
BACKEND_URL="https://backend-production-xxxx.up.railway.app"

# Test health endpoint
curl $BACKEND_URL/health

# Expected response:
# {"status":"ok","message":"WMS API is running","database":"PostgreSQL + Prisma"}
```

### Test 2: API Health
```bash
curl $BACKEND_URL/api/health

# Expected response:
# {"status":"ok","message":"WMS API is running","database":"PostgreSQL + Prisma"}
```

### Test 3: Authentication Endpoint
```bash
# This should return an error (expected - no credentials provided)
curl -X POST $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Expected response:
# {"error":"Invalid credentials"}
# This is GOOD! It means the endpoint is working!
```

### Test 4: Register New User
```bash
curl -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kiaan.com",
    "password": "Admin@123",
    "name": "Admin User",
    "role": "ADMIN"
  }'

# Expected response:
# {"token":"eyJhbGc...","user":{"id":"...","email":"admin@kiaan.com",...}}
```

### Test 5: Login with New User
```bash
curl -X POST $BACKEND_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kiaan.com",
    "password": "Admin@123"
  }'

# Expected response:
# {"token":"eyJhbGc...","user":{"id":"...","email":"admin@kiaan.com",...}}
```

### Test 6: Access Protected Endpoint
```bash
# Get token from login response above
TOKEN="your_jwt_token_here"

# Test dashboard stats
curl $BACKEND_URL/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"

# Expected: Dashboard statistics JSON
```

---

## 🔗 Step 4: Connect Frontend to Backend

Once backend is deployed and tested:

### Update Frontend Environment Variables

In your Railway **Frontend** service:
1. Go to **"Variables"** tab
2. Add or update:
   ```bash
   NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.up.railway.app
   NEXT_PUBLIC_GRAPHQL_URL=https://hasura-wms.alexandratechlab.com/v1/graphql
   ```
3. Frontend will automatically redeploy

### OR Update Frontend Code Locally

If you want to update and commit:

```bash
cd /root/kiaan-wms/frontend

# Update .env.production
echo "NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.up.railway.app" > .env.production
echo "NEXT_PUBLIC_GRAPHQL_URL=https://hasura-wms.alexandratechlab.com/v1/graphql" >> .env.production

# Commit and push
git add .env.production
git commit -m "Update frontend to use deployed backend API"
git push origin main
```

---

## 📋 Railway Configuration Checklist

Make sure these are configured in Railway:

### Backend Service Settings:
- [x] **Root Directory:** `backend`
- [x] **Start Command:** `node server.js` (from railway.json)
- [x] **Pre-Deploy Command:** `npx prisma db push --accept-data-loss && node prisma/seed.js`
- [x] **Health Check Path:** `/health`
- [x] **Builder:** Nixpacks (auto-detected)

### Environment Variables:
- [x] `PORT=8010`
- [x] `NODE_ENV=production`
- [x] `JWT_SECRET=<your_secure_secret>`
- [x] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- [x] `CORS_ORIGIN=<your_frontend_url>`

### Database:
- [x] PostgreSQL database added to project
- [x] DATABASE_URL automatically linked to backend service

---

## 🎯 Expected Results

After successful deployment:

### Your Services:

| Service | Status | URL | Purpose |
|---------|--------|-----|---------|
| **Backend API** | ✅ Deployed | https://backend-production-xxxx.up.railway.app | REST API (40+ endpoints) |
| **Frontend** | ✅ Deployed | https://frontend-production-c9100.up.railway.app | Next.js UI |
| **Hasura GraphQL** | ✅ Deployed | https://hasura-wms.alexandratechlab.com | GraphQL API |
| **PostgreSQL** | ✅ Running | Internal | Database |

### What Now Works:

✅ Real user authentication (login/register)
✅ JWT-based security
✅ Dashboard statistics from database
✅ Inventory management with FIFO/LIFO/FEFO
✅ Complete CRUD operations
✅ All 40+ REST API endpoints
✅ Business logic and algorithms
✅ Full WMS functionality

---

## 🚨 Common Issues & Solutions

### Issue 1: "Root directory not found"
**Solution:** Make sure Root Directory is set to `backend` in Settings

### Issue 2: "Module not found" errors
**Solution:** Railway should auto-install dependencies. Check build logs.

### Issue 3: "Database connection failed"
**Solution:**
- Ensure PostgreSQL database is added to project
- Verify `DATABASE_URL=${{Postgres.DATABASE_URL}}` is set
- Check database service is running

### Issue 4: "Port already in use"
**Solution:** Railway manages ports automatically. Don't hardcode port 8010 in server.js for production.

### Issue 5: CORS errors in browser
**Solution:** Update CORS origins in server.js to include your frontend URL

---

## 📊 Deployment Status Tracking

### Before Deployment:
- ❌ Backend not deployed
- ❌ 40+ API endpoints inaccessible
- ❌ Only demo authentication works
- ❌ No real user management

### After Deployment:
- ✅ Backend deployed and running
- ✅ All API endpoints accessible
- ✅ Real authentication working
- ✅ Full WMS functionality
- ✅ Production-ready!

---

## 🎉 Success Criteria

Your deployment is successful when ALL of these pass:

1. ✅ `/health` endpoint returns 200 OK
2. ✅ `/api/health` endpoint returns database info
3. ✅ Can register a new user via API
4. ✅ Can login and receive JWT token
5. ✅ Can access `/api/dashboard/stats` with token
6. ✅ Can access `/api/products` with token
7. ✅ Frontend can authenticate users
8. ✅ No CORS errors in browser console

---

## 🚀 Quick Start Commands

```bash
# Test health
curl https://YOUR-BACKEND-URL/health

# Create user
curl -X POST https://YOUR-BACKEND-URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"Admin@123","name":"Admin","role":"ADMIN"}'

# Login
curl -X POST https://YOUR-BACKEND-URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"Admin@123"}'

# Get products (with token)
curl https://YOUR-BACKEND-URL/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📞 Next Steps

1. **Deploy backend** using instructions above (5 minutes)
2. **Test endpoints** to verify deployment (2 minutes)
3. **Update frontend** with backend URL (1 minute)
4. **Test end-to-end** login flow (2 minutes)
5. **Celebrate!** 🎉

---

**Your backend code is on GitHub and ready to deploy!**

**GitHub:** ✅ Pushed to `main` branch
**Railway:** ⏳ Waiting for you to deploy
**Time Required:** ~10 minutes total

**GO TO:** https://railway.app/dashboard

**DO THIS NOW!** 🚀

---

**Questions? Check:**
- BACKEND_DEPLOYMENT_INSTRUCTIONS.md (detailed guide)
- CRITICAL_ISSUE_SUMMARY.md (problem overview)
- backend/server.js (your API code - 2,593 lines!)
