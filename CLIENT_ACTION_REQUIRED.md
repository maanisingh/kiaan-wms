# ⚠️ ACTION REQUIRED: Deploy Backend to Show Food Data

## Current Situation

✅ **Frontend is LIVE:** https://frontend-production-c9100.up.railway.app/
✅ **All 9 features implemented** and pages working
✅ **Backend code ready** with all food data (Nakd, Graze, KIND, etc.)
❌ **Backend NOT deployed to Railway** - that's why you see "No data"

## What You Need to Do

Follow these simple steps to make the food data appear on the Railway frontend:

---

## Step 1: Create Backend Service (2 minutes)

1. Open Railway project: https://railway.com/project/c6b95811-8833-4a7e-9370-b171f0aeaa7e

2. Click **"+ New"** button (top right)

3. Select **"GitHub Repo"**

4. Choose: **maanisingh/kiaan-wms**

5. Railway will create a new service automatically

---

## Step 2: Configure Backend Service (3 minutes)

1. Click on the newly created service (should be named "kiaan-wms" or similar)

2. Go to **Settings** tab

3. Scroll to **Source** section:
   - **Root Directory:** `backend` ← IMPORTANT!
   - **Branch:** `main`

4. Scroll to **Build** section:
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm run deploy`

5. Click **Save** (if needed)

---

## Step 3: Add PostgreSQL Database (1 minute)

1. In your Railway project (same page), click **"+ New"** again

2. Select **"Database"** → **"PostgreSQL"**

3. Done! PostgreSQL will be created automatically

---

## Step 4: Set Environment Variables (2 minutes)

1. Go back to your **backend service** (the one you created in Step 1)

2. Click **"Variables"** tab

3. Add these 4 variables (click "+ New Variable" for each):

   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   ```
   (This auto-references the PostgreSQL you just created)

   ```
   PORT = 8010
   ```

   ```
   JWT_SECRET = kiaan_wms_super_secret_jwt_key_production_2024_min_32_characters
   ```

   ```
   NODE_ENV = production
   ```

4. Click **"Deploy"** or wait for auto-deploy

---

## Step 5: Get Backend URL (1 minute)

1. In your **backend service**, go to **Settings** tab

2. Scroll to **Networking** section

3. Click **"Generate Domain"** button

4. Copy the generated URL (looks like: `https://backend-production-abc123.up.railway.app`)

---

## Step 6: Connect Frontend to Backend (2 minutes)

1. Go to your **frontend service** in Railway

2. Click **"Variables"** tab

3. Add new variable:
   ```
   NEXT_PUBLIC_API_URL = <paste-backend-url-here>
   ```
   Example: `NEXT_PUBLIC_API_URL = https://backend-production-abc123.up.railway.app`

4. Save (frontend will automatically redeploy)

---

## Step 7: Wait & Test (3-5 minutes)

1. **Wait for deployments:**
   - Backend: ~3-4 minutes (installing packages, running migrations, seeding data)
   - Frontend: ~2-3 minutes (rebuilding with backend URL)

2. **Test the deployment:**
   - Visit: https://frontend-production-c9100.up.railway.app/auth/login
   - Click **"Admin User"** quick login button
   - You should be logged in automatically

3. **Verify food data is visible:**
   - Click **Products → Bundles** in sidebar
   - You should see: **16 food bundles** (Graze Apple Crunch, KIND Dark Chocolate, Nakd Cocoa Delight, etc.)

   - Click **Products → Brands** in sidebar
   - You should see: **10 food brands** (Nakd, Graze, KIND, Clif Bar, LÄRABAR, etc.)

   - Click **Inventory** in sidebar
   - You should see: **48 inventory items** with best-before dates and lot numbers

---

## What Food Data Will Appear

### Brands (10 total)
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

### Bundles (16 total - all 12-packs)
- Graze Vanilla Bliss - 12 Pack
- Graze Choc Orange - 12 Pack
- Graze Coconut Dream - 12 Pack
- Graze Apple Crunch - 12 Pack
- KIND Dark Chocolate - 12 Pack
- KIND Almond & Coconut - 12 Pack
- KIND Peanut Butter - 12 Pack
- KIND Maple Glazed - 12 Pack
- Nakd Cocoa Delight - 12 Pack
- Nakd Cashew Cookie - 12 Pack
- Nakd Berry Blast - 12 Pack
- Nakd Salted Caramel - 12 Pack
- Clif Bar Chocolate Chip - 12 Pack
- Clif Bar Peanut Butter - 12 Pack
- LÄRABAR Apple Pie - 12 Pack
- LÄRABAR Cashew Cookie - 12 Pack

### Inventory Items (48 total)
Each item has:
- Product name (e.g., "Graze Apple Crunch")
- Location (e.g., "A-01-01")
- Quantity (e.g., 120 units)
- **Best-Before Date** (e.g., "18/01/2026") ← CLIENT'S REQUIREMENT
- **Lot Number** (e.g., "LOT-GN53NM") ← For tracking
- Stock level indicators (🟢 Good / 🟡 Warning / 🔴 Expiring)

---

## Troubleshooting

### If backend deployment fails:
1. Check **"Deployments"** tab in backend service
2. Click on latest deployment → **"View Logs"**
3. Look for errors (usually DATABASE_URL or Prisma issues)

### If you still see "No data" after all steps:
1. Verify backend is running: Visit `<backend-url>/health` in browser
   - Should show: `{"status":"ok","message":"WMS API is running"}`
2. Check frontend has correct `NEXT_PUBLIC_API_URL` variable
3. Check browser console (F12) for API connection errors
4. Wait a few more minutes - initial seed can take 3-5 minutes

### If database is empty:
1. Go to backend service → **"Deployments"** tab
2. Click latest deployment → **"View Logs"**
3. Search for "Seeding" in logs
4. If not found, manually trigger seed:
   - Go to backend service → **"Settings"** → **"Deploy"**
   - Click **"Redeploy"**

---

## Summary

**Time Required:** ~10-15 minutes total
**Steps:** 7 simple steps
**Result:** All food data (brands, bundles, inventory with BB dates) will be visible on Railway frontend

**Current Frontend (No Data):**
https://frontend-production-c9100.up.railway.app/

**After Backend Deployment (With Food Data):**
Same URL, but now showing:
- ✅ 10 food brands
- ✅ 16 food bundles (12-packs)
- ✅ 48 inventory items with best-before dates
- ✅ All analytics and pricing data
- ✅ Full replenishment system

---

**All code is ready and committed to GitHub. Just need to deploy backend service in Railway to make the food data visible!** 🍫🥜🍎
