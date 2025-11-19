# Railway Root Directory Fix - URGENT

## Problem Identified

Railway is deploying from the repository root (`/`) instead of the frontend subdirectory (`/frontend`).

**Evidence:**
- Railway is still using Node.js 18 (old nixpacks.toml)
- Our fix (Node.js 20) is in `/frontend/nixpacks.toml`
- Railway can't see it because it's looking in the wrong directory

## Solution: Set Root Directory in Railway

### Step-by-Step Fix

1. **Go to Railway Dashboard:**
   - https://railway.app/project/kind-generosity/service/kiaan-wms

2. **Click on Settings:**
   - In the left sidebar, click "Settings"

3. **Find "Root Directory":**
   - Scroll down to "Source" section
   - Look for "Root Directory" field

4. **Set Root Directory:**
   ```
   frontend
   ```
   (Just type `frontend` - no slashes)

5. **Save Settings:**
   - Railway will save automatically

6. **Trigger Redeploy:**
   - Go back to "Deployments" tab
   - Click "Deploy" button
   - Or click "Redeploy" on the latest deployment

## What This Does

### Before (Wrong)
```
Repository: maanisingh/kiaan-wms
Root: /
Files Railway sees:
  - /backend/
  - /frontend/
  - No package.json in root ❌
  - No nixpacks.toml in root ❌
```

### After (Correct)
```
Repository: maanisingh/kiaan-wms
Root: /frontend
Files Railway sees:
  - /frontend/package.json ✅
  - /frontend/nixpacks.toml ✅ (with nodejs-20_x)
  - /frontend/next.config.ts ✅
  - All Next.js app files ✅
```

## Expected Result

After setting root directory to `frontend`:

1. Railway will redeploy
2. Use files from `/frontend/` directory
3. Find `nixpacks.toml` with `nodejs-20_x`
4. Build with Node.js 20 ✅
5. Next.js 16 will compile successfully ✅
6. Deployment will succeed ✅

## Verification

After Railway redeploys, check build logs for:

```
╔═════════════ Nixpacks v1.38.0 ════════════╗
║ setup      │ nodejs-20_x                  ║  ← Should now be 20!
```

## Why This Happened

The GitHub repository structure:
```
maanisingh/kiaan-wms/
├── backend/         (has its own package.json)
├── frontend/        (Next.js app - what we want)
│   ├── package.json
│   ├── nixpacks.toml
│   └── next.config.ts
└── (no package.json in root)
```

Railway defaulted to root `/` but needs to use `/frontend` subdirectory.

## Alternative Solution (if you prefer)

If you don't want to set root directory, you can move files to repository root:

```bash
# NOT RECOMMENDED - but would work
cd /root/kiaan-wms/frontend
git mv * ..
git mv .* ..
# Then commit and push
```

**But setting Root Directory is cleaner!**

## Quick Reference

**Railway Project:** kind-generosity
**Service:** kiaan-wms
**Required Setting:** Root Directory = `frontend`
**Current Issue:** Railway deploying from `/` (wrong)
**After Fix:** Railway deploys from `/frontend` (correct)

---

## Summary

1. Go to Railway Settings
2. Set "Root Directory" to: `frontend`
3. Redeploy
4. Build will succeed with Node.js 20
5. WMS will be live! 🎉

**This is the missing piece!** The code is correct, just Railway is looking in the wrong place.
