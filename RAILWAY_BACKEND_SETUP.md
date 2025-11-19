# Railway Backend Deployment Instructions

## Quick Setup Steps

### 1. Create Backend Service

1. Go to: https://railway.com/project/c6b95811-8833-4a7e-9370-b171f0aeaa7e
2. Click **"+ New"** button
3. Select **"GitHub Repo"**
4. Choose repository: **maanisingh/kiaan-wms**
5. Railway will create the service

### 2. Configure Backend Service

1. Click on the newly created service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`

### 3. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. PostgreSQL will be created automatically
4. Copy the **DATABASE_URL** from the PostgreSQL service

### 4. Set Environment Variables

In the backend service, go to **Variables** tab and add:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=8010
JWT_SECRET=kiaan_wms_super_secret_jwt_key_production_2024_min_32_characters
NODE_ENV=production
```

**Note:** `${{Postgres.DATABASE_URL}}` will auto-reference your PostgreSQL database

### 5. Add Build/Deploy Commands

In backend service **Settings** → **Deploy**:

**Build Command:**
```bash
npm install && npx prisma generate
```

**Start Command:**
```bash
node server.js
```

**IMPORTANT - Add Custom Start Script:**

Since we need to run migrations and seed data on first deploy, update `package.json` to include:

```json
{
  "scripts": {
    "start": "node server.js",
    "deploy": "npx prisma db push && node prisma/seed.js && node server.js"
  }
}
```

Then set **Start Command** to: `npm run deploy`

### 6. Deploy

1. Railway will auto-deploy
2. Wait 3-5 minutes for:
   - Dependencies to install
   - Database to be created
   - Migrations to run (creates all tables)
   - Seed script to run (adds food data)
   - Server to start

### 7. Get Backend URL

1. In backend service, go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://backend-production-abc123.up.railway.app`)

### 8. Connect Frontend to Backend

1. Go to **frontend service** in Railway
2. Go to **Variables** tab
3. Add new variable:
   ```
   NEXT_PUBLIC_API_URL=<your-backend-url>
   ```
   Example: `NEXT_PUBLIC_API_URL=https://backend-production-abc123.up.railway.app`
4. Save (frontend will auto-redeploy)

### 9. Test

After frontend redeploys (2-3 minutes):

1. Visit: https://frontend-production-c9100.up.railway.app/auth/login
2. Click "Admin User" quick login
3. Navigate to **Products → Bundles**
   - You should see: 16 food bundles (Graze, KIND, Nakd, etc.)
4. Navigate to **Products → Brands**
   - You should see: 10 food brands
5. Navigate to **Inventory**
   - You should see: Inventory items with best-before dates

---

## What This Deploys

### Food Data That Will Appear:

**10 Food Brands:**
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

**16 Food Bundles (12-packs):**
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

**48 Inventory Items:**
- Each with best-before dates
- Each with lot numbers
- 3 different BB dates per product (60, 180, 300 days from now)

---

## Troubleshooting

### If Backend Fails to Deploy:

1. Check **Logs** in Railway backend service
2. Common issues:
   - DATABASE_URL not set correctly
   - Prisma migration failed
   - Seed script error

### If Frontend Shows "No Data":

1. Check backend is running (visit backend-url/health)
2. Check NEXT_PUBLIC_API_URL is set correctly in frontend
3. Check browser console for CORS errors

### If Database is Empty:

1. Go to backend service **Settings** → **Deploy**
2. Add **Release Command**: `npx prisma db push && node prisma/seed.js`
3. Redeploy

---

**After completing these steps, the client will see all food data on the Railway frontend link!** 🍫
