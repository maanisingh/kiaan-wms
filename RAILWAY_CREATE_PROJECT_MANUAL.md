# Railway - Create New Project (Manual Steps Required)

**Date:** November 18, 2025
**Status:** Old project deleted ✅
**Issue:** API cannot get workspaceId (permission limitation)

---

## ✅ What We Accomplished

1. **Deleted old project** (`kind-generosity`) via API
2. **Verified GitHub repo** ready with Node.js 20 fix
3. **Token working** for most operations except workspace queries

---

## ❌ API Limitation Discovered

The Railway API token (`8182acce-0e52-4221-92e7-600c5b729dd8`) cannot:
- Query workspaces
- Get personal workspace ID
- Create projects without explicit workspaceId

**Root Cause:** This is a Railway API security design - workspace queries require higher permissions or must be done via dashboard.

---

## 🚀 Manual Steps (5 Minutes)

### Step 1: Create New Project

1. Go to: https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: **`maanisingh/kiaan-wms`**
5. Select branch: **`main`**

### Step 2: Configure Service

Railway will auto-detect it's a Next.js project and configure:
- ✅ Build Command: `npm install && npm run build`
- ✅ Start Command: `npm start`

**IMPORTANT:** Add environment variable:
- Name: `NIXPACKS_NODE_VERSION`
- Value: `20`

### Step 3: Deploy

Click **"Deploy"** and wait 3-5 minutes.

Railway will:
1. Clone from GitHub
2. Use Node.js 20 (from env var + nixpacks.toml)
3. Build Next.js 16
4. Deploy and provide URL

---

## ⚙️ Environment Variables to Set

In Railway Dashboard → Variables tab:

```
NIXPACKS_NODE_VERSION=20
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=Kiaan WMS
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_TELEMETRY_DISABLED=1
```

---

## 📋 Expected Build Output

```
╔═════════════ Nixpacks v1.38.0 ════════════╗
║ setup      │ nodejs-20_x                  ║  ← Node 20!
║───────────────────────────────────────────║
║ install    │ npm ci                       ║
║───────────────────────────────────────────║
║ build      │ npm install && npm run build ║
║───────────────────────────────────────────║
║ start      │ npm start                    ║
╚═══════════════════════════════════════════╝

> next build
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (50/50)
✓ Finalizing page optimization

> next start
✓ Ready on http://0.0.0.0:3000
```

---

## 🎯 Result

You'll get a URL like:
```
https://kiaan-wms-production-XXXX.up.railway.app
```

---

## 📱 Quick Access Links

**GitHub Repo:**
https://github.com/maanisingh/kiaan-wms

**Railway Dashboard:**
https://railway.app/dashboard

**Latest Commit:**
`2019317` - "Fix: Update Node.js version to 20 for Next.js 16 compatibility"

---

## ✅ Pre-Deploy Checklist

- [ ] Old project deleted (done via API ✅)
- [ ] GitHub repo has nixpacks.toml with nodejs-20_x ✅
- [ ] Create new project in Railway dashboard
- [ ] Set NIXPACKS_NODE_VERSION=20 variable
- [ ] Deploy from main branch
- [ ] Wait for build to complete
- [ ] Test deployment URL

---

## 🔧 Troubleshooting

### If Build Still Uses Node.js 18:
1. Check Variables tab has `NIXPACKS_NODE_VERSION=20`
2. Settings → Advanced → Clear Build Cache
3. Redeploy

### If Can't Find Repository:
1. Settings → Source → Connect GitHub
2. Grant Railway access to repositories
3. Select maanisingh/kiaan-wms

---

## Why Manual Steps Are Needed

**Railway API Security:**
- Creating projects requires `workspaceId`
- Querying workspaces requires special permissions
- Personal tokens can't access workspace data
- **Solution:** Use dashboard for project creation

**Once project exists**, we can use API for:
- ✅ Deployments
- ✅ Environment variables
- ✅ Service management
- ✅ Monitoring

---

## Summary

1. ✅ Old project deleted successfully
2. ⏳ Create new project via dashboard (5 min manual task)
3. ⏳ Set NIXPACKS_NODE_VERSION=20
4. ⏳ Deploy and get URL

**The code is ready. Just needs manual project creation in Railway dashboard.**
