# Deploy Backend NOW - Manual Steps

**Time Required:** 15 minutes
**Current Status:** Frontend live, backend needs deployment

---

## Step 1: Add PostgreSQL Database (2 minutes)

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/
   - Login to your account
   - Open your Kiaan WMS project

2. **Add PostgreSQL:**
   - Click **"+ New"** button
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Wait for it to provision (shows green "Active")

---

## Step 2: Import Database (5 minutes)

**Get Database Connection Details:**
1. Click on the PostgreSQL service
2. Go to **"Connect"** tab
3. Copy the connection command (or individual credentials)

**Import the Database:**

**Option A: Using Railway Connect (Easiest)**
```bash
# In your terminal where you have Railway CLI
railway link  # Select your project
railway connect postgresql

# In the psql prompt that opens:
\i /root/kiaan-wms/railway-deployment/full_database.sql
\q
```

**Option B: Using psql Directly**
```bash
# Get these from Railway dashboard:
# PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

PGPASSWORD='<your-password>' psql \
  -h <your-host> \
  -p <your-port> \
  -U <your-user> \
  -d <your-database> \
  < /root/kiaan-wms/railway-deployment/full_database.sql
```

**Verify Import:**
```bash
# Back in psql:
\dt                            # Should show 21 tables
SELECT COUNT(*) FROM "Product";    # Should show 32
SELECT COUNT(*) FROM "Inventory";  # Should show 10707
\q
```

---

## Step 3: Add Hasura Service (3 minutes)

1. **Create Service:**
   - Click **"+ New"** → **"Empty Service"**
   - Name it: `kiaan-wms-hasura`

2. **Configure Docker Image:**
   - Click on the service
   - Go to **"Settings"**
   - Scroll to **"Source"** section
   - Click **"Source"** dropdown
   - Select **"Docker Image"**
   - In the image field, enter: `hasura/graphql-engine:latest`
   - Click **"Deploy"**

---

## Step 4: Configure Hasura Variables (2 minutes)

1. **Go to Hasura service → "Variables" tab**

2. **Add these variables** (click "+ New Variable" for each):

```
HASURA_GRAPHQL_DATABASE_URL
Value: ${{Postgres.DATABASE_URL}}
(Replace "Postgres" with your actual PostgreSQL service name)

HASURA_GRAPHQL_ADMIN_SECRET
Value: kiaan_hasura_admin_secret_2024

HASURA_GRAPHQL_ENABLE_CONSOLE
Value: true

HASURA_GRAPHQL_ENABLED_APIS
Value: metadata,graphql,config

HASURA_GRAPHQL_DEV_MODE
Value: true

HASURA_GRAPHQL_CORS_DOMAIN
Value: *
```

3. **Wait for auto-redeploy** (1-2 minutes)

---

## Step 5: Generate Hasura Domain (1 minute)

1. **In Hasura service:**
   - Go to **"Settings"**
   - Scroll to **"Networking"**
   - Click **"Generate Domain"**
   - Copy the generated URL (e.g., `kiaan-wms-hasura.up.railway.app`)

2. **Save this URL** - you'll need it!

---

## Step 6: Track Tables in Hasura (2 minutes)

1. **Open Hasura Console:**
   - Visit: `https://[your-hasura-domain]/console`
   - When prompted, enter admin secret: `kiaan_hasura_admin_secret_2024`

2. **Track All Tables:**
   - Click **"Data"** tab (top menu)
   - You'll see all 21 tables on the left
   - Click **"Track All"** button
   - Click **"Track all"** for relationships (Hasura suggests them)

3. **Verify:**
   - Click on "Product" table
   - Click "Browse Rows" - should see 32 products!

---

## Step 7: Update Frontend Variables (1 minute)

1. **Go to Frontend service → "Variables" tab**

2. **Add/Update these variables:**

```
NEXT_PUBLIC_GRAPHQL_URL
Value: https://[your-hasura-domain]/v1/graphql

NEXT_PUBLIC_HASURA_ADMIN_SECRET
Value: kiaan_hasura_admin_secret_2024
```

3. **Railway auto-redeploys** (2-3 minutes)

---

## Step 8: Verify It Works! (1 minute)

### Test Hasura Directly:

```bash
# Replace [your-hasura-domain] with your actual domain
curl -X POST https://[your-hasura-domain]/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product(limit: 5) { id name sku } }"}'
```

Should return 5 products!

### Test Frontend Pages:

Visit these URLs - they should show REAL DATA:

1. **Dashboard:**
   https://frontend-production-c9100.up.railway.app/dashboard
   - Should show: Total products, low stock, pending orders

2. **Products:**
   https://frontend-production-c9100.up.railway.app/products
   - Should show: List of 32 products

3. **Inventory:**
   https://frontend-production-c9100.up.railway.app/inventory
   - Should show: 10,707 inventory items

4. **Orders:**
   https://frontend-production-c9100.up.railway.app/sales-orders
   - Should show: 30 sales orders

### Automated Test:

```bash
node /tmp/check_railway_data.js
```

Should output: `✅ REAL DATA LOADING - Backend connected!`

---

## ✅ Success Checklist

- [ ] PostgreSQL service shows "Active" in Railway
- [ ] Database has 21 tables (verified with `\dt`)
- [ ] Hasura service shows "Active" in Railway
- [ ] Hasura console accessible at `https://[domain]/console`
- [ ] All 21 tables tracked in Hasura
- [ ] Frontend variables updated with Hasura URL
- [ ] Frontend redeployed automatically
- [ ] Dashboard page shows real stats
- [ ] Products page shows 32 products
- [ ] No "Loading..." states stuck

---

## Troubleshooting

### Frontend still shows "Loading..."

**Check:**
1. Hasura service is "Active" (green)
2. Frontend variables are correct (check spelling!)
3. Frontend has redeployed (check deployment logs)

**Fix:**
- Manually redeploy frontend: Click "Deploy" → "Redeploy"

### "relation does not exist" error

**Check:**
- Tables imported: Connect to PostgreSQL and run `\dt`

**Fix:**
- Re-import: `\i /root/kiaan-wms/railway-deployment/full_database.sql`
- Track tables in Hasura console

### CORS errors in browser console

**Check:**
- Hasura has `HASURA_GRAPHQL_CORS_DOMAIN=*` variable

**Fix:**
- Add the variable to Hasura service
- Wait for redeploy

### Authentication errors

**Check:**
- Admin secrets match:
  - Hasura: `HASURA_GRAPHQL_ADMIN_SECRET`
  - Frontend: `NEXT_PUBLIC_HASURA_ADMIN_SECRET`
  - Both should be: `kiaan_hasura_admin_secret_2024`

---

## Quick Reference

**Database File:** `/root/kiaan-wms/railway-deployment/full_database.sql`

**Hasura Image:** `hasura/graphql-engine:latest`

**Admin Secret:** `kiaan_hasura_admin_secret_2024`

**Frontend URL:** `https://frontend-production-c9100.up.railway.app/`

**Pages to Test:**
- `/dashboard`
- `/products`
- `/inventory`
- `/sales-orders`

---

**Total Time:** ~15 minutes
**Difficulty:** Easy
**Result:** Production backend with real data!

---

Good luck! 🚀
