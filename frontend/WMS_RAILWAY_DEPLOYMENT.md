# Kiaan WMS Railway Deployment Guide

**Project:** Kiaan WMS Frontend
**Framework:** Next.js 16
**GitHub Repo:** https://github.com/maanisingh/kiaan-wms
**Date:** November 18, 2025

---

## Current Local Access

**NIP.IO URL:** http://91.98.157.75.nip.io:3011
**Status:** ✅ Running locally on port 3011

---

## Railway Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Login to Railway:**
   - Go to https://railway.app
   - Login with account: maanindersinghsidhu@gmail.com

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `maanisingh/kiaan-wms`
   - Branch: `main`

3. **Configure Build Settings:**
   - Railway will auto-detect it's a Next.js project
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `/frontend` (IMPORTANT: Set this!)

4. **Environment Variables:**
   Add these in Railway dashboard > Variables:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_NAME=Kiaan WMS
   NEXT_PUBLIC_APP_VERSION=1.0.0
   NEXT_TELEMETRY_DISABLED=1
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 3-5 minutes for build
   - Railway will provide a URL like: `kiaan-wms.railway.app`

### Option 2: Deploy via Railway CLI (Manual)

```bash
# Navigate to frontend
cd /root/kiaan-wms/frontend

# Login to Railway (requires browser)
railway login

# Initialize project
railway init

# Link to existing project or create new one
# Select: "Create new project"
# Name: "kiaan-wms-frontend"

# Deploy
railway up

# Get the URL
railway status
```

---

## Post-Deployment

### Get Railway URL

After deployment completes, Railway will provide a URL:
```
https://kiaan-wms-production-XXXX.up.railway.app
```

### Update Local Environment

To use Railway backend (when available), update `/root/kiaan-wms/frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://kiaan-wms-production-XXXX.up.railway.app/api
```

### Verify Deployment

1. **Check if site is live:**
   ```bash
   curl -I https://[your-railway-url]
   ```

2. **Test in browser:**
   - Open the Railway URL
   - Should see Kiaan WMS landing page
   - Check dashboard loads
   - Test login flow

---

## Current Architecture

### Local Setup (Current)
```
Frontend: http://91.98.157.75.nip.io:3011
    ↓
Mock Data (Built-in to frontend)
    - No backend required
    - Uses @faker-js/faker for demo data
```

### Railway Setup (After Deployment)
```
Frontend: https://kiaan-wms-production-XXXX.up.railway.app
    ↓
Mock Data (Built-in to frontend)
    - Same functionality as local
    - Accessible from anywhere
    - Better performance (Railway CDN)
```

---

## Configuration Files

### ✅ Already Created:
- `railway.json` - Railway configuration
- `nixpacks.toml` - Build configuration
- `package.json` - Has proper build scripts
- `.gitignore` - Excludes node_modules, .next, etc.

### ✅ Ready to Deploy:
- All code pushed to GitHub
- No environment secrets required
- Frontend is standalone (no backend dependencies)

---

## Features

The WMS frontend includes:
- **7 Role-Based Dashboards:**
  - Administrator
  - Warehouse Manager
  - Inventory Manager
  - Order Fulfillment Specialist
  - Receiving Clerk
  - Picker/Packer
  - Quality Control Inspector

- **Core Modules:**
  - Inventory Management
  - Order Processing
  - Warehouse Operations
  - Shipping & Receiving
  - Reporting & Analytics
  - User Management

- **Technology Stack:**
  - Next.js 16 (React 19)
  - Ant Design UI Components
  - Chart.js for analytics
  - Mock API with Faker.js
  - Fully responsive design

---

## Estimated Costs

### Railway Pricing:
- **Hobby Plan:** $5/month
  - 500 hours of runtime
  - $0.000231/min after
  - Perfect for this app

- **Usage Estimate:**
  - Next.js app: ~$3-5/month
  - Very lightweight (static after build)

---

## Troubleshooting

### Build Fails
**Issue:** Railway can't find package.json
**Fix:** Set Root Directory to `/frontend` in Railway settings

### 404 on Routes
**Issue:** Next.js dynamic routes not working
**Fix:** Already configured in `next.config.ts`

### Environment Variables Not Working
**Issue:** NEXT_PUBLIC_ vars not available
**Fix:** They need to be set during build time in Railway dashboard

---

## Manual Deployment (If CLI Fails)

1. **Create Railway Account:**
   - Email: maanindersinghsidhu@gmail.com
   - Password: [Your Password]

2. **Import from GitHub:**
   - Railway Dashboard → New Project
   - Connect GitHub
   - Select: maanisingh/kiaan-wms
   - **Important:** Set root directory to `frontend`

3. **Wait for Build:**
   - Auto-detects Next.js
   - Builds and deploys automatically
   - Check logs for any errors

4. **Get URL:**
   - Railway provides: `xxx.up.railway.app`
   - Can add custom domain later

---

## Next Steps After Deployment

### 1. Custom Domain (Optional)
If you want: `wms.alexandratechlab.com`
```
1. Railway Dashboard → Settings → Domains
2. Add domain: wms.alexandratechlab.com
3. Add CNAME in DNS:
   wms.alexandratechlab.com → [railway-url]
```

### 2. Backend Integration (Future)
When backend is ready:
```
1. Deploy backend to Railway
2. Get backend URL
3. Update frontend .env:
   NEXT_PUBLIC_API_URL=[backend-url]/api
4. Redeploy frontend
```

---

## Current Status

- ✅ Code ready for deployment
- ✅ Git repository synced
- ✅ Railway config files created
- ✅ Frontend works standalone (no backend needed)
- ⏳ Awaiting manual deployment via Railway dashboard

**Railway Project URL:** Will be created during deployment
**Expected Deployment Time:** 5-10 minutes
**Final URL:** TBD (Railway will assign)

---

## Quick Reference

### Repository
```bash
cd /root/kiaan-wms/frontend
git remote -v
# origin  https://github.com/maanisingh/kiaan-wms.git
```

### Local URLs
- **Frontend:** http://91.98.157.75.nip.io:3011
- **PM2 Process:** `wms-frontend`
- **Directory:** `/var/www/wms`

### Railway URLs (After Deployment)
- **Frontend:** https://[project-name].up.railway.app
- **Dashboard:** https://railway.app/project/[project-id]

---

**Status:** Ready for Railway deployment via web dashboard
**Prepared By:** Claude Code
**Date:** November 18, 2025
