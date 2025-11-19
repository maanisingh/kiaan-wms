# Railway Deployment Guide for Kiaan WMS

## ✅ GitHub Repository
**URL:** https://github.com/maanisingh/kiaan-wms
**Status:** Pushed and ready ✓

---

## 🚀 Backend Deployment (Priority 1)

### Step 1: Create Backend Service on Railway

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose: `maanisingh/kiaan-wms`
5. Click "Add variables" and set:

```env
DATABASE_URL=<Railway PostgreSQL URL - will be auto-generated>
PORT=8010
NODE_ENV=production
JWT_SECRET=wms_production_secret_key_2024_very_secure
```

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will auto-create `DATABASE_URL` variable
4. Copy the PostgreSQL connection string

### Step 3: Configure Root Directory

**IMPORTANT:** Since backend code is in `/backend` subdirectory:

1. Go to service Settings
2. Under "Build" section
3. Set **Root Directory** to: `backend`
4. Set **Start Command** to: `node server.js`

### Step 4: Deploy & Run Migrations

After deployment completes:

1. Go to service shell/terminal
2. Run: `npx prisma generate`
3. Run: `npx prisma db push`
4. Run: `node prisma/seed.js`

Your backend API will be available at:
```
https://your-backend.up.railway.app
```

Test it:
```bash
curl https://your-backend.up.railway.app/health
```

---

## 🎨 Frontend Deployment (Priority 2)

### Step 1: Create Frontend Service

1. In same Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose: `maanisingh/kiaan-wms`
4. Click "Add variables" and set:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
NODE_ENV=production
```

### Step 2: Configure Root Directory

**IMPORTANT:** Since frontend code is in `/frontend` subdirectory:

1. Go to service Settings
2. Under "Build" section  
3. Set **Root Directory** to: `frontend`
4. Build will auto-detect Next.js

Your frontend will be available at:
```
https://your-frontend.up.railway.app
```

---

## 📋 Deployment Checklist

### Backend ✅
- [ ] PostgreSQL database created
- [ ] DATABASE_URL environment variable set
- [ ] Root directory set to `backend`
- [ ] Service deployed successfully
- [ ] Migrations run (`npx prisma db push`)
- [ ] Seed data loaded (`node prisma/seed.js`)
- [ ] Health check passes

### Frontend ✅
- [ ] NEXT_PUBLIC_API_URL points to backend
- [ ] Root directory set to `frontend`
- [ ] Build successful
- [ ] Can access login page
- [ ] Can login with credentials

---

## 🔑 Login Credentials

After seeding the database:

```
Email: admin@kiaan.com
Password: admin123
```

**Note:** Update these in production!

---

## 🧪 Testing After Deployment

### 1. Backend Health Check
```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "WMS API is running",
  "database": "PostgreSQL + Prisma"
}
```

### 2. Login Test
```bash
curl -X POST https://your-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"admin123"}'
```

### 3. Test Frontend
Visit: `https://your-frontend.up.railway.app/auth/login`

### 4. Test All Features
- Products → Brands (10 brands)
- Products → Bundles (16 bundles)
- Replenishment → Tasks
- Replenishment → Settings
- Analytics & Revenue → Channel Pricing
- Analytics & Revenue → Price Optimizer
- Analytics & Revenue → Margin Analysis

---

## 📊 Database Information

**Seeded Data:**
- 10 Food Brands (Nakd, Graze, KIND, etc.)
- 32 Products (16 single + 16 bundles)
- 48 Inventory Items with Best-Before dates
- 5 Sales Channels
- 30 Sales Orders (B2C + B2B)
- 10 Replenishment Configurations
- 50 Channel Prices

---

## 🔧 Troubleshooting

### Build Fails
- Check root directory is set correctly
- Verify package.json exists in root directory

### Database Connection Issues
- Ensure DATABASE_URL is set
- Check PostgreSQL service is running

### API 404 Errors
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is deployed and healthy

### Prisma Issues
After deployment, run in Railway shell:
```bash
npx prisma generate
npx prisma db push
node prisma/seed.js
```

---

## 🎉 Success Criteria

✅ Backend API returns 200 on `/health`  
✅ Can login with admin@kiaan.com  
✅ Can view 10 brands  
✅ Can view 16 bundles  
✅ Can see replenishment tasks  
✅ Can view channel pricing analytics

---

## 📝 Custom Domain (Optional)

If you want to add custom domains:

**Backend API:**
```
api.kiaan-wms.com → Railway backend service
```

**Frontend:**
```
app.kiaan-wms.com → Railway frontend service
```

Update NEXT_PUBLIC_API_URL to use custom domain.

---

## 🔐 Production Security

Before going live, update:

1. JWT_SECRET (use strong random string)
2. Admin password in database
3. Add rate limiting
4. Enable CORS properly
5. Add proper error logging (Sentry/Datadog)

---

**Repository:** https://github.com/maanisingh/kiaan-wms  
**Status:** Ready for deployment ✅
