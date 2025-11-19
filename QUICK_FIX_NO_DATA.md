# 🔧 Quick Fix: "No Data" Issue on Railway Frontend

## Problem

The Railway frontend shows "No data" because it can't connect to the backend API.

## Root Cause

The frontend code defaults to `http://localhost:8010/api` when `NEXT_PUBLIC_API_URL` environment variable is not set.

**Location:** `/frontend/lib/constants.ts:5`
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010/api';
```

## Solution (2 minutes)

### Step 1: Get Backend URL

1. Go to Railway: https://railway.com/project/c6b95811-8833-4a7e-9370-b171f0aeaa7e
2. Click on your **backend service**
3. Go to **Settings** → **Networking**
4. Copy the domain URL (e.g., `backend-production-abc123.up.railway.app`)

**OR** if backend doesn't have a domain yet:
- Click **"Generate Domain"** button
- Copy the generated URL

### Step 2: Set Frontend Environment Variable

1. Go to your **frontend service** in Railway
2. Click **"Variables"** tab
3. Look for `NEXT_PUBLIC_API_URL`

**If it exists but is wrong:**
- Click to edit
- Set value to: `https://<your-backend-url>`
- Example: `https://backend-production-abc123.up.railway.app`
- Save

**If it doesn't exist:**
- Click **"+ New Variable"**
- Name: `NEXT_PUBLIC_API_URL`
- Value: `https://<your-backend-url>`
- Example: `https://backend-production-abc123.up.railway.app`
- Save

### Step 3: Wait for Redeploy

- Frontend will automatically redeploy (2-3 minutes)
- Wait for deployment to complete

### Step 4: Test

1. Visit: https://frontend-production-c9100.up.railway.app/auth/login
2. Click "Admin User" to login
3. Go to **Products → Bundles**
4. You should see 16 food bundles!

---

## Verification Checklist

### ✅ Backend is Running

Test backend health endpoint in browser:
```
https://<your-backend-url>/health
```

**Should return:**
```json
{
  "status": "ok",
  "message": "WMS API is running",
  "database": "PostgreSQL + Prisma"
}
```

### ✅ Backend Has Food Data

Test brands endpoint:
```
https://<your-backend-url>/api/brands
```

**Note:** This will return "No token provided" error, which is GOOD - it means the backend is running and responding!

### ✅ Frontend is Connected

1. Open https://frontend-production-c9100.up.railway.app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Reload page
5. Check for API calls - should be calling your backend URL, not localhost

---

## Common Issues

### Issue 1: Backend Returns 404

**Symptom:** Backend URL shows "Not Found" or 404 error

**Fix:**
- Backend might not be deployed correctly
- Check backend service **"Deployments"** tab
- Look for failed deployments
- Check **"Logs"** for errors

### Issue 2: CORS Errors in Browser Console

**Symptom:** Browser shows "CORS policy" errors

**Fix:**
- Backend needs to allow frontend origin
- Check backend `server.js` has CORS configured:
```javascript
app.use(cors({
  origin: ['https://frontend-production-c9100.up.railway.app'],
  credentials: true
}));
```

### Issue 3: Still Shows "No Data" After Fix

**Symptom:** Frontend connected but still shows "No data"

**Possible causes:**

**A) Database is empty:**
1. Go to backend service → **Settings** → **Deploy**
2. Add environment variable if missing:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
3. Redeploy backend
4. Check logs for "Seeding database..." message

**B) Database seed failed:**
1. Go to backend service → **Deployments** → Latest deployment
2. Click **"View Logs"**
3. Search for "Error" or "seed"
4. If seed failed, manually run:
   - In backend service settings, update Start Command to:
     ```
     npm run deploy
     ```
   - This runs: `npx prisma db push && node prisma/seed.js && node server.js`

**C) Frontend cached old API URL:**
1. Hard refresh frontend: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Try incognito/private browsing window

---

## Expected Results After Fix

### Bundles Page
You should see **16 food bundles:**
- Graze Vanilla Bliss - 12 Pack
- Graze Choc Orange - 12 Pack
- KIND Dark Chocolate - 12 Pack
- Nakd Cocoa Delight - 12 Pack
- LÄRABAR Apple Pie - 12 Pack
- ...and 11 more

### Brands Page
You should see **10 food brands:**
- Nakd
- Graze
- KIND
- Clif Bar
- LÄRABAR
- Nature Valley
- RXBAR
- GoMacro
- Booja-Booja
- Deliciously Ella

### Inventory Page
You should see **48 inventory items** with:
- Product names (e.g., "Graze Apple Crunch")
- Locations (e.g., "A-01-01")
- Quantities (e.g., "120 units")
- **Best-Before Dates** (e.g., "18/01/2026") ← KEY FEATURE
- **Lot Numbers** (e.g., "LOT-GN53NM")

---

## Quick Debug Commands

If you need to debug, you can use these Railway CLI commands (if installed):

```bash
# Check backend logs
railway logs --service backend

# Check frontend environment variables
railway variables --service frontend

# Check backend environment variables
railway variables --service backend
```

---

## Summary

**Most Common Fix:**

The frontend needs to know where the backend is!

1. **Get backend URL** from Railway backend service → Settings → Networking
2. **Set NEXT_PUBLIC_API_URL** in frontend service → Variables
3. **Wait for redeploy** (2-3 minutes)
4. **Test!** Visit bundles page and see food data

**Time to fix:** 2-5 minutes
**Result:** All food data visible (brands, bundles, inventory with BB dates)

---

**If backend is already set up but you still see "No data", it's 99% likely the NEXT_PUBLIC_API_URL environment variable issue!** 🎯
