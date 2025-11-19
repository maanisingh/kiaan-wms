# Railway WMS Deployment - Manual Steps Required

## Current Situation

**Project:** kind-generosity (ID: `46f5d603-e9ed-4ae8-8661-0823f403f071`)
**Service:** kiaan-wms (ID: `61400ea9-a3e7-4eb5-96fb-8311684350d2`)
**Environment:** production (ID: `0e9d968c-baaa-4eed-9b79-45200fde17a9`)

**Issue:** Railway is deploying old commits that don't have the Node.js 20 fix
**Root Cause:** Railway might be caching or using wrong branch/configuration

---

## ✅ Verified Information

### GitHub Repository Status
- **Repo:** https://github.com/maanisingh/kiaan-wms
- **Branch:** main
- **Latest Commit:** `2019317` - "Fix: Update Node.js version to 20 for Next.js 16 compatibility"
- **nixpacks.toml:** ✅ Contains `nodejs-20_x`
- **Structure:** Frontend files are in repository root (NOT in `/frontend` subdirectory)

### Railway Project Status
- **Project Name:** kind-generosity
- **Service Name:** kiaan-wms
- **Last Deployment:** Failed (Node.js 18 error)
- **Problem:** Deploying from unknown commit `30c5a0cd` instead of latest `2019317`

---

## 🚨 Manual Fix Required

Since API automation has permission issues, please follow these manual steps:

### Step 1: Verify GitHub Connection

1. Go to Railway Dashboard: https://railway.app/project/46f5d603-e9ed-4ae8-8661-0823f403f071
2. Click on "kiaan-wms" service
3. Click "Settings" tab
4. Under "Source" section, verify:
   - ✅ Repository: `maanisingh/kiaan-wms`
   - ✅ Branch: `main`
   - ❗ **Root Directory:** Should be EMPTY (not `/frontend`)

### Step 2: Check Service Configuration

In Settings, verify:

**Build Settings:**
- Build Command: (auto-detected) `npm install && npm run build`
- Start Command: (auto-detected) `npm start`

**Root Directory:**
- Should be **empty** or **not set**
- If it says `/frontend`, REMOVE it
- The repo already has files at root level

### Step 3: Force Redeploy

Option A - Via Settings:
1. Go to "Deployments" tab
2. Click "Deploy" button (top right)
3. Should trigger new deployment from latest commit

Option B - Via Latest Deployment:
1. Find the failed deployment in list
2. Click the three dots (•••)
3. Select "Redeploy"

Option C - Trigger via Git:
1. Make a trivial change in repo
2. Push to GitHub
3. Railway auto-deploys

### Step 4: Monitor Build Logs

When deployment starts, check build logs for:

**✅ Success Indicators:**
```
╔═════════════ Nixpacks v1.38.0 ════════════╗
║ setup      │ nodejs-20_x                  ║  ← MUST be 20, not 18
```

**✅ Successful Build:**
```
> next build
✓ Creating an optimized production build
✓ Compiled successfully
```

**❌ If Still Fails with Node.js 18:**
- Railway might be caching Dockerfile
- Try: Settings → Advanced → "Clear Build Cache"
- Then redeploy

---

## Alternative: Manual Commit Trigger

If Railway won't pick up latest commit, make a dummy commit:

```bash
cd /root/kiaan-wms/frontend

# Add a comment to trigger rebuild
echo "# Trigger Railway rebuild" >> WMS_RAILWAY_DEPLOYMENT.md

git add WMS_RAILWAY_DEPLOYMENT.md
git commit -m "chore: Trigger Railway rebuild"
git push origin main
```

Railway should auto-detect the push and deploy.

---

## Troubleshooting

### Issue: Railway Still Using Node.js 18

**Possible Causes:**
1. Railway caching old Dockerfile
2. Not connected to correct branch
3. Build cache not cleared

**Solutions:**
1. Settings → Advanced → "Clear Build Cache"
2. Settings → Source → Verify branch is `main`
3. Manually trigger redeploy
4. Disconnect and reconnect GitHub repo

### Issue: Can't Find Settings

Railway Dashboard Layout:
```
Left Sidebar:
- Overview
- Deployments  ← Check deployment history
- Variables
- Metrics
- Settings     ← Configuration is here
```

### Issue: Deployment Starts But Fails Immediately

Check:
1. Build logs for exact error
2. nixpacks.toml is in repo root
3. package.json has correct scripts

---

## Expected Success Result

Once deployment succeeds, you'll see:

**Build Logs:**
```
[setup] nodejs-20_x ✓
[install] npm ci ✓
[build] npm run build ✓
  ✓ Creating an optimized production build
  ✓ Compiled successfully
[start] npm start
  ✓ Ready on http://0.0.0.0:3000
```

**Deployment Status:** ✅ Active

**URL Provided:** `https://kiaan-wms-production-XXXX.up.railway.app`

---

## Quick Checklist

Before redeploying, verify:

- [ ] Repository: `maanisingh/kiaan-wms` ✅
- [ ] Branch: `main` ✅
- [ ] Root Directory: EMPTY (not `/frontend`) ❓
- [ ] Latest commit on GitHub: `2019317` ✅
- [ ] nixpacks.toml in repo: ✅ (with `nodejs-20_x`)
- [ ] Build cache cleared: ❓
- [ ] Auto-deploy enabled: ✅

---

## Current vs Desired State

**Current (Broken):**
```
Railway deploying: commit 30c5a0cd (unknown)
Using: Node.js 18.x
Result: Build fails
```

**Desired (Working):**
```
Railway deploying: commit 2019317 (latest)
Using: Node.js 20.x from nixpacks.toml
Result: Build succeeds → App live
```

---

## Contact Info

**Railway Dashboard:** https://railway.app/project/46f5d603-e9ed-4ae8-8661-0823f403f071/service/61400ea9-a3e7-4eb5-96fb-8311684350d2

**GitHub Repo:** https://github.com/maanisingh/kiaan-wms

**Latest Commit:** `2019317c247fd8f011816c6d22f704c6fbe10ab9`

---

## Summary

The code is correct and ready. Railway just needs to:
1. Deploy from the latest commit (`2019317`)
2. Use the nixpacks.toml with Node.js 20
3. Build will succeed and WMS will be live

**Action Required:** Manual redeploy via Railway dashboard with build cache cleared.
