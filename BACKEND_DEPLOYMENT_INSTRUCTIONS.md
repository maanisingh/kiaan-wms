# 🚀 Kiaan WMS Backend - Railway Deployment Instructions

**Date:** November 24, 2025
**Status:** URGENT - Backend Not Deployed

---

## ❌ Current Problem

Your WMS backend has **40+ REST API endpoints** but is **NOT deployed** to Railway.

**Error:** "Application not found" (https://serene-adaptation-production.up.railway.app)

**Impact:**
- Authentication not working (can't create real users)
- Dashboard statistics not loading
- Inventory algorithms (FIFO/LIFO/FEFO) not accessible
- Frontend relies on demo data only

---

## ✅ Backend API Endpoints (Ready to Deploy)

Your `server.js` has **2,593 lines** with comprehensive APIs:

### Authentication (8 endpoints)
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password
- POST /api/auth/logout
- PUT /api/auth/profile

### Dashboard (4 endpoints)
- GET /api/dashboard/stats
- GET /api/dashboard/recent-orders
- GET /api/dashboard/low-stock
- GET /api/dashboard/activity

### Inventory Management (15+ endpoints)
- GET /api/inventory/adjustments
- POST /api/inventory/adjustments
- PATCH /api/inventory/adjustments/:id/approve
- GET /api/inventory/cycle-counts
- POST /api/inventory/cycle-counts
- GET /api/inventory/alerts
- GET /api/inventory/batches
- POST /api/inventory/batches
- POST /api/inventory/batches/allocate-fifo
- POST /api/inventory/batches/allocate-lifo
- POST /api/inventory/batches/allocate-fefo
- PATCH /api/inventory/batches/:id/status
- GET /api/inventory/movements
- POST /api/inventory/movements
- And more...

### Products & Catalog (8 endpoints)
- GET /api/brands
- POST /api/brands
- GET /api/categories
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- GET /api/inventory

### Sales Orders (1+ endpoints)
- GET /api/sales-orders

**Total: 40+ REST API endpoints** ready for deployment!

---

## 🎯 Deployment Method 1: Railway UI (Easiest)

### Step 1: Create GitHub Repository for Backend

```bash
# Navigate to backend directory
cd /root/kiaan-wms/backend

# Initialize git (if not done)
git init

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/kiaan-wms-backend.git

# Push code
git add .
git commit -m "Backend API ready for Railway deployment"
git push -u origin master
```

### Step 2: Deploy to Railway

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Login to your account

2. **Create New Service:**
   - Click **"New Project"** or use existing `kiaan-wms-production` project
   - Click **"New"** → **"GitHub Repo"**
   - Select `kiaan-wms-backend` repository
   - Railway will auto-detect Node.js and deploy

3. **Configure Environment Variables:**

   In Railway service **"Variables"** tab, add:

   ```bash
   # Required Variables
   PORT=8010
   NODE_ENV=production
   JWT_SECRET=wms_super_secure_jwt_secret_key_2024_production_CHANGE_THIS

   # Database Connection (use Railway PostgreSQL)
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # CORS Origins (update with your frontend URL)
   CORS_ORIGIN=https://frontend-production-c9100.up.railway.app,https://wms.alexandratechlab.com
   ```

4. **Deploy Settings:**

   Railway will use your `railway.json` configuration:
   ```json
   {
     "deploy": {
       "startCommand": "node server.js",
       "healthcheckPath": "/health",
       "preDeployCommand": "npx prisma db push --accept-data-loss && node prisma/seed.js"
     }
   }
   ```

5. **Generate Domain:**
   - Go to **"Settings"** tab
   - Click **"Generate Domain"**
   - Copy the URL (e.g., `backend-production-xxxx.up.railway.app`)

### Step 3: Update Frontend Configuration

Update frontend to use new backend URL:

```typescript
// frontend/.env.production
NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
NEXT_PUBLIC_GRAPHQL_URL=https://hasura-wms.alexandratechlab.com/v1/graphql
```

### Step 4: Verify Deployment

Test backend endpoints:

```bash
# Health check
curl https://backend-production-xxxx.up.railway.app/health

# Expected response:
# {"status":"ok","message":"WMS API is running","database":"PostgreSQL + Prisma"}

# Test API health
curl https://backend-production-xxxx.up.railway.app/api/health

# Test login endpoint (should fail without credentials)
curl -X POST https://backend-production-xxxx.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Expected: {"error":"Invalid credentials"}
```

---

## 🎯 Deployment Method 2: Railway CLI (Alternative)

### Prerequisites

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Link to Project:**
   ```bash
   cd /root/kiaan-wms/backend
   railway link
   # Select your project: kiaan-wms-production
   ```

### Deploy Backend

```bash
# Deploy backend
railway up

# Check logs
railway logs

# Open in browser
railway open
```

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS Origins

In `server.js`, ensure CORS includes your frontend:

```javascript
app.use(cors({
  origin: [
    'https://wms.alexandratechlab.com',
    'https://frontend-production-c9100.up.railway.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### 2. Update Frontend API URL

In frontend `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.up.railway.app
```

### 3. Seed Database

Railway will automatically run:
```bash
npx prisma db push --accept-data-loss && node prisma/seed.js
```

This creates:
- Demo users with proper authentication
- Sample products, inventory, orders
- Test data for all features

---

## 🧪 Testing After Deployment

### Test 1: Health Check
```bash
curl https://YOUR-BACKEND-URL/health
# Expected: {"status":"ok","message":"WMS API is running"}
```

### Test 2: API Health
```bash
curl https://YOUR-BACKEND-URL/api/health
# Expected: {"status":"ok","message":"WMS API is running","database":"PostgreSQL + Prisma"}
```

### Test 3: Authentication
```bash
# Create test user
curl -X POST https://YOUR-BACKEND-URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kiaan.com",
    "password": "Test@123",
    "name": "Test User",
    "role": "ADMIN"
  }'

# Login
curl -X POST https://YOUR-BACKEND-URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kiaan.com",
    "password": "Test@123"
  }'

# Expected: {"token":"eyJhbGc...","user":{...}}
```

### Test 4: Protected Endpoints
```bash
# Get token from login response
TOKEN="your_jwt_token_here"

# Test dashboard stats
curl https://YOUR-BACKEND-URL/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"

# Test products
curl https://YOUR-BACKEND-URL/api/products \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Deployment Checklist

- [ ] Create GitHub repository for backend
- [ ] Push backend code to GitHub
- [ ] Create Railway service from GitHub repo
- [ ] Configure environment variables (PORT, JWT_SECRET, DATABASE_URL)
- [ ] Wait for deployment to complete
- [ ] Generate Railway domain
- [ ] Test /health endpoint
- [ ] Test /api/health endpoint
- [ ] Test authentication endpoints
- [ ] Update frontend API URL
- [ ] Redeploy frontend with new backend URL
- [ ] Test end-to-end login flow
- [ ] Verify all API endpoints work
- [ ] Update documentation with new URLs

---

## 🚨 Common Issues & Solutions

### Issue 1: "Application not found"
**Cause:** Service not deployed or deleted
**Solution:** Deploy backend using steps above

### Issue 2: Database connection error
**Cause:** DATABASE_URL not configured
**Solution:** Add `DATABASE_URL=${{Postgres.DATABASE_URL}}` in Railway variables

### Issue 3: CORS errors
**Cause:** Frontend URL not in CORS origins
**Solution:** Update CORS origins in server.js and redeploy

### Issue 4: 401 Unauthorized errors
**Cause:** JWT_SECRET mismatch or expired tokens
**Solution:** Use same JWT_SECRET in backend and ensure tokens are fresh

### Issue 5: Prisma errors
**Cause:** Database schema not pushed
**Solution:** Railway runs `prisma db push` automatically. Check logs.

---

## 🎯 Expected Result

After deployment:

1. **Backend URL:** https://backend-production-xxxx.up.railway.app
2. **Health Check:** ✅ Returns {"status":"ok"}
3. **API Endpoints:** ✅ All 40+ endpoints accessible
4. **Authentication:** ✅ Login/register working
5. **Frontend Integration:** ✅ Frontend can call backend APIs
6. **Database:** ✅ Connected to Railway PostgreSQL
7. **CORS:** ✅ Configured for frontend domain

---

## 📞 Quick Commands Reference

```bash
# Test health
curl https://YOUR-BACKEND-URL/health

# Test API
curl https://YOUR-BACKEND-URL/api/health

# Login (replace with actual credentials)
curl -X POST https://YOUR-BACKEND-URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"Admin@123"}'

# Get products (requires token)
curl https://YOUR-BACKEND-URL/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get dashboard stats (requires token)
curl https://YOUR-BACKEND-URL/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎉 Success Criteria

Your backend deployment is successful when:

✅ Health endpoint returns 200 OK
✅ Can register new user
✅ Can login and get JWT token
✅ Can access protected endpoints with token
✅ Dashboard stats return real data
✅ Inventory endpoints work
✅ Frontend can authenticate users
✅ No CORS errors
✅ Database operations work

---

**Next Action:** Deploy backend to Railway using Method 1 (UI) or Method 2 (CLI)

**Priority:** 🚨 CRITICAL - Without backend, authentication and business logic don't work!

**Estimated Time:** 15-20 minutes

---

**Deployment Date:** [To be filled after deployment]
**Backend URL:** [To be filled after deployment]
**Status:** ⏳ PENDING DEPLOYMENT
