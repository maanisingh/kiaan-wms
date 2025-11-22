# Kiaan WMS Backend - Railway Quick Start

**Current Status:** ✅ Frontend deployed | ❌ Backend not deployed

**Goal:** Get real data showing on https://frontend-production-c9100.up.railway.app/

---

## Option 1: Automated Script (Recommended)

```bash
cd /root/kiaan-wms/railway-deployment

# Login to Railway (opens browser)
railway login

# Run deployment script
./deploy_to_railway.sh
```

The script will guide you through each step interactively.

---

## Option 2: Manual via Railway Dashboard

### Step 1: Add PostgreSQL (2 minutes)

1. Go to https://railway.app/ → Your Project
2. Click **"New"** → **"Database"** → **"PostgreSQL"**
3. Name: `kiaan-wms-postgres`
4. Wait for "Active" status

### Step 2: Import Database (5 minutes)

```bash
# In Railway dashboard, get PostgreSQL connection details
# Or use Railway CLI:
railway connect postgresql

# In psql prompt, run:
\i /root/kiaan-wms/railway-deployment/full_database.sql
\q

# Verify (back in psql):
\dt                            # Should show 21 tables
SELECT COUNT(*) FROM "Product";    # Should show 32
\q
```

### Step 3: Add Hasura Service (3 minutes)

1. Click **"New"** → **"Empty Service"**
2. Name: `kiaan-wms-hasura`
3. **Settings** → **Deploy** → **Source**:
   - Type: **Docker Image**
   - Image: `hasura/graphql-engine:latest`
4. Click **"Deploy"**

### Step 4: Configure Hasura Variables (2 minutes)

In Hasura service → **Variables**, add:

```
HASURA_GRAPHQL_DATABASE_URL = ${{kiaan-wms-postgres.DATABASE_URL}}
HASURA_GRAPHQL_ADMIN_SECRET = kiaan_hasura_admin_secret_2024
HASURA_GRAPHQL_ENABLE_CONSOLE = true
HASURA_GRAPHQL_ENABLED_APIS = metadata,graphql,config
HASURA_GRAPHQL_CORS_DOMAIN = *
```

### Step 5: Generate Hasura Domain (1 minute)

1. Hasura service → **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy URL (e.g., `kiaan-wms-hasura.up.railway.app`)

### Step 6: Track Tables in Hasura (2 minutes)

1. Visit `https://[your-hasura-domain]/console`
2. Admin secret: `kiaan_hasura_admin_secret_2024`
3. **Data** tab → Click **"Track All"** (tracks 21 tables)
4. Click **"Track all relationships"** for each table

### Step 7: Update Frontend Variables (1 minute)

Frontend service → **Variables**, add:

```
NEXT_PUBLIC_GRAPHQL_URL = https://[your-hasura-domain]/v1/graphql
NEXT_PUBLIC_HASURA_ADMIN_SECRET = kiaan_hasura_admin_secret_2024
```

Railway auto-redeploys frontend (2-3 minutes).

### Step 8: Verify! (1 minute)

Visit these pages - they should show REAL data:

- https://frontend-production-c9100.up.railway.app/dashboard
- https://frontend-production-c9100.up.railway.app/products
- https://frontend-production-c9100.up.railway.app/inventory

✅ **Done!** Data is now loading from Railway!

---

## Testing Backend Connection

```bash
# Test Hasura GraphQL
curl -X POST https://[your-hasura-domain]/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product(limit: 5) { id name sku } }"}'

# Should return 5 products!

# Test frontend data loading
node /tmp/check_railway_data.js

# Should show: ✅ REAL DATA LOADING - Backend connected!
```

---

## What You Get

**Database Tables (21 total):**
- 32 Products
- 10,707 Inventory items
- 30 Sales Orders
- 5 Purchase Orders
- 15 Locations
- 10 Customers

**Working Pages (5 total):**
- Dashboard (KPIs + recent orders)
- Products (full CRUD)
- Inventory (stock levels + locations)
- Sales Orders (order management)
- Picking/Generate (FEFO/FIFO algorithms)

**GraphQL API:**
- Auto-generated from database
- Real-time subscriptions
- Role-based access control ready
- API explorer at `/console`

---

## Troubleshooting

**Frontend still shows "Loading..."**
→ Check frontend variables are set correctly
→ Verify Hasura is "Active" in Railway
→ Check Hasura logs for errors

**"relation does not exist" errors**
→ Re-import database: `railway connect postgresql` → `\i full_database.sql`
→ Track tables in Hasura console

**CORS errors in browser**
→ Add `HASURA_GRAPHQL_CORS_DOMAIN=*` to Hasura variables

---

**Total Time:** ~15-20 minutes
**Files Needed:** `full_database.sql` (already exported!)
**Cost:** Railway free tier covers this setup
