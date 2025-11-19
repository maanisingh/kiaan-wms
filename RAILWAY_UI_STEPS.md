# 🚀 Railway Deployment - UI Steps (Copy & Paste Ready)

**Project URL:** https://railway.com/project/c6b95811-8833-4a7e-9370-b171f0aeaa7e

---

## Step 1: Delete Current Failing Service

1. Go to your Railway project
2. Click on the failing **kiaan-wms** service
3. Go to **Settings** → Scroll to bottom → **Delete Service**
4. Confirm deletion

---

## Step 2: Add PostgreSQL Database

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Wait for provisioning (~30 seconds)
5. Click on the PostgreSQL service
6. Go to **"Variables"** tab
7. **Copy** the `DATABASE_URL` value (you'll need this!)

✅ Database ready!

---

## Step 3: Create Backend Service

### 3.1 Add Service
1. Click **"+ New"** button  
2. Select **"GitHub Repo"**
3. Choose: **maanisingh/kiaan-wms**
4. Railway will start creating service - **DON'T LET IT DEPLOY YET!**

### 3.2 Configure Service
1. Click on the new service (might be called "kiaan-wms")
2. Click **"Settings"**
3. Scroll to **"Service Name"** → Rename to: `backend`
4. Scroll to **"Root Directory"**
   - Click **"Configure"**
   - Enter: `backend`
   - Click **"Update"**
5. Scroll to **"Start Command"**
   - Click **"Configure"**
   - Enter: `node server.js`
   - Click **"Update"**

### 3.3 Add Environment Variables
1. Click **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these one by one:

```
Variable Name: DATABASE_URL
Value: <Paste the PostgreSQL DATABASE_URL you copied>
```

```
Variable Name: PORT
Value: 8010
```

```
Variable Name: NODE_ENV
Value: production
```

```
Variable Name: JWT_SECRET
Value: wms_production_secret_key_2024_very_secure
```

4. Click **"Deploy"** button (top right)

### 3.4 After Backend Deploys
1. Wait for deployment to succeed (~2-3 minutes)
2. Click **"View Logs"** to monitor
3. Once deployed, go to **"Deployments"** tab
4. Click on the successful deployment
5. Find **"Domains"** section
6. **Copy the backend URL** (e.g., `backend-production-xxxx.up.railway.app`)

### 3.5 Run Database Migrations
1. In backend service, click **"..."** menu (top right)
2. Select **"Terminal"** or **"Shell"**
3. Run these commands one by one:

```bash
npx prisma generate
```

```bash
npx prisma db push
```

```bash
node prisma/seed.js
```

4. You should see: "✅ Seeding complete!" message

### 3.6 Test Backend
Open in browser: `https://your-backend-url.up.railway.app/health`

Expected response:
```json
{
  "status": "ok",
  "message": "WMS API is running",
  "database": "PostgreSQL + Prisma"
}
```

✅ Backend ready!

---

## Step 4: Create Frontend Service

### 4.1 Add Service
1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Choose: **maanisingh/kiaan-wms** (same repo!)
4. **DON'T LET IT DEPLOY YET!**

### 4.2 Configure Service
1. Click on the new service
2. Click **"Settings"**
3. Rename service to: `frontend`
4. Scroll to **"Root Directory"**
   - Click **"Configure"**
   - Enter: `frontend`
   - Click **"Update"**

### 4.3 Add Environment Variables
1. Click **"Variables"** tab
2. Add these:

```
Variable Name: NEXT_PUBLIC_API_URL
Value: https://your-backend-url.up.railway.app/api
```

⚠️ **IMPORTANT:** Replace `your-backend-url.up.railway.app` with YOUR actual backend URL!

```
Variable Name: NODE_ENV
Value: production
```

3. Click **"Deploy"**

### 4.4 After Frontend Deploys
1. Wait for build to complete (~3-5 minutes)
2. Go to **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. Copy the frontend URL

✅ Frontend ready!

---

## Step 5: Test Everything

### Test 1: Frontend Access
Open: `https://your-frontend-url.up.railway.app`
- Should see login page ✓

### Test 2: Login
- Email: `admin@kiaan.com`
- Password: `admin123`
- Click "Login"
- Should redirect to dashboard ✓

### Test 3: Navigation
- Click **Products** → **Brands**
  - Should see 10 brands (Nakd, Graze, KIND, etc.) ✓
- Click **Products** → **Bundles**
  - Should see 16 bundles (12-packs) ✓
- Click **Replenishment** → **Tasks**
  - Should see replenishment tasks ✓
- Click **Analytics & Revenue** → **Channel Pricing**
  - Should see 50 channel prices ✓

---

## 🎯 Final Architecture

```
Railway Project: zooming-growth
├── PostgreSQL
│   └── DATABASE_URL provided
│
├── backend (Service)
│   ├── Root: /backend
│   ├── URL: https://backend-production-xxx.up.railway.app
│   └── Health: /health
│
└── frontend (Service)
    ├── Root: /frontend
    └── URL: https://frontend-production-xxx.up.railway.app
```

---

## 🚨 Troubleshooting

### Backend won't start
- Check **Variables** tab has all 4 variables
- Check **Root Directory** is set to `backend`
- Check **Start Command** is `node server.js`
- View **Deploy Logs** for errors

### Frontend shows API errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Must end with `/api`
- Example: `https://backend-xxx.up.railway.app/api`
- Redeploy frontend after changing

### Database connection failed
- Make sure PostgreSQL service is running
- Check DATABASE_URL is in backend variables
- Run migrations again: `npx prisma db push`

---

## ✅ Success Checklist

- [ ] PostgreSQL database created
- [ ] Backend service deployed successfully
- [ ] Backend health check returns 200
- [ ] Database migrations completed
- [ ] Seed data loaded (10 brands, 16 bundles, etc.)
- [ ] Frontend service deployed successfully
- [ ] Can access login page
- [ ] Can login with admin@kiaan.com
- [ ] Can see 10 brands
- [ ] Can see 16 bundles
- [ ] All navigation works

---

**GitHub Repo:** https://github.com/maanisingh/kiaan-wms  
**Railway Project:** https://railway.com/project/c6b95811-8833-4a7e-9370-b171f0aeaa7e

🎉 **You're all set!**
