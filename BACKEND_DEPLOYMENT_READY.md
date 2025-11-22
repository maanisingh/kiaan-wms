# Backend Deployment Ready - Kiaan WMS

**Date:** November 22, 2025
**Status:** ✅ All files prepared and ready for Railway deployment

---

## Current Situation

### ✅ What's Working

**Frontend (Railway):**
- URL: https://frontend-production-c9100.up.railway.app/
- Status: Live and working
- Apollo Client: Fixed (v4 compatibility)
- Pages: 5 pages ready to load data
- Build: Successful

**Backend (Local):**
- Hasura: Running on localhost:8090
- PostgreSQL: Running on localhost:5439
- Database: 21 tables with real data
- GraphQL: Working perfectly locally

### ❌ What's Missing

**Backend (Railway):**
- PostgreSQL: NOT deployed
- Hasura: NOT deployed
- Result: Frontend shows empty pages (no data source)

---

## Why Pages Show "Loading" on Railway

The Railway frontend is trying to connect to:
```
http://localhost:8090/v1/graphql
```

But on Railway, there's no backend at this URL! We need to deploy:
1. PostgreSQL database to Railway
2. Hasura GraphQL engine to Railway
3. Update frontend env vars to point to Railway Hasura

---

## Files Prepared for Deployment

All files are in: `/root/kiaan-wms/railway-deployment/`

```
railway-deployment/
├── full_database.sql           (214KB) - Complete database dump ✅
├── schema.sql                  (94KB)  - Schema only
├── data.sql                    (176KB) - Data only
├── deploy_to_railway.sh               - Automated deployment script ✅
├── RAILWAY_DEPLOYMENT_GUIDE.md        - Detailed step-by-step guide ✅
└── QUICK_START.md                     - Quick reference (15 mins) ✅
```

---

## Deployment Options

### Option A: Automated Script (Easiest)

```bash
cd /root/kiaan-wms/railway-deployment
railway login              # Opens browser to authenticate
./deploy_to_railway.sh     # Guided deployment
```

**Time:** ~15 minutes (mostly waiting for Railway to provision services)

### Option B: Railway Dashboard (Visual)

Follow: `/root/kiaan-wms/railway-deployment/QUICK_START.md`

**Steps:**
1. Add PostgreSQL service (2 min)
2. Import database (5 min)
3. Add Hasura service (3 min)
4. Configure variables (2 min)
5. Track tables (2 min)
6. Update frontend vars (1 min)

**Time:** ~15 minutes total

---

## What Happens After Deployment

### Before (Current State):
```
User → Railway Frontend → ❌ localhost:8090 (doesn't exist)
                        → Shows: "Loading..." forever
```

### After Deployment:
```
User → Railway Frontend → ✅ Railway Hasura → ✅ Railway PostgreSQL
                        → Shows: Real data from 21 tables!
```

**Pages That Will Work:**
- Dashboard: 32 products, 15 low stock items, 8 pending orders
- Products: List of 32 products with brands, SKUs, prices
- Inventory: 10,707 inventory items with locations
- Sales Orders: 30 orders with customer details
- Picking: FEFO/FIFO pick list generation

---

## Database Statistics

**Tables:** 21 total

**Data Counts:**
- Products: 32
- Brands: 5
- Inventory Items: 10,707
- Sales Orders: 30
- Purchase Orders: 5
- Customers: 10
- Suppliers: 8
- Locations: 15
- Warehouses: 3

**Total Size:** 214KB (full_database.sql)

---

## Railway Services After Deployment

Your Railway project will have:

```
kiaan-wms/
├── frontend (existing)          - Next.js app
│   └── URL: frontend-production-c9100.up.railway.app
│
├── kiaan-wms-postgres (new)     - PostgreSQL database
│   ├── 21 tables
│   ├── Real data imported
│   └── Internal URL for Hasura
│
└── kiaan-wms-hasura (new)       - GraphQL API
    ├── URL: kiaan-wms-hasura.up.railway.app
    ├── GraphQL: /v1/graphql
    ├── Console: /console
    └── Connected to postgres
```

---

## Environment Variables Needed

### Hasura Service:
```env
HASURA_GRAPHQL_DATABASE_URL=${{kiaan-wms-postgres.DATABASE_URL}}
HASURA_GRAPHQL_ADMIN_SECRET=kiaan_hasura_admin_secret_2024
HASURA_GRAPHQL_ENABLE_CONSOLE=true
HASURA_GRAPHQL_ENABLED_APIS=metadata,graphql,config
HASURA_GRAPHQL_CORS_DOMAIN=*
```

### Frontend Service:
```env
NEXT_PUBLIC_GRAPHQL_URL=https://[hasura-domain]/v1/graphql
NEXT_PUBLIC_HASURA_ADMIN_SECRET=kiaan_hasura_admin_secret_2024
```

---

## Verification Commands

After deployment, run these to verify:

```bash
# 1. Test Hasura GraphQL endpoint
curl -X POST https://[your-hasura-domain]/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product(limit: 5) { id name sku } }"}'

# Should return 5 products!

# 2. Test frontend data loading
node /tmp/check_railway_data.js

# Should show: ✅ REAL DATA LOADING - Backend connected!

# 3. Manual browser test
# Visit: https://frontend-production-c9100.up.railway.app/dashboard
# Should show: Dashboard with real statistics and data
```

---

## Next Steps (Choose One)

### Quick Start (15 minutes):
```bash
railway login
cd /root/kiaan-wms/railway-deployment
./deploy_to_railway.sh
```

### Manual (follow guide):
Open: `/root/kiaan-wms/railway-deployment/QUICK_START.md`

### Detailed (comprehensive):
Open: `/root/kiaan-wms/railway-deployment/RAILWAY_DEPLOYMENT_GUIDE.md`

---

## Support Files

- **Deployment Script:** `deploy_to_railway.sh`
- **Database Dump:** `full_database.sql` (import this!)
- **Quick Guide:** `QUICK_START.md`
- **Full Guide:** `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Verification:** `/tmp/check_railway_data.js`
- **Backend Check:** `/tmp/check_railway_backend.sh`

---

## Expected Results

After successful deployment:

✅ Dashboard loads with real KPIs
✅ Products page shows 32 products
✅ Inventory page shows 10,707 items
✅ Orders page shows 30 orders
✅ GraphQL console accessible
✅ All queries return real data
✅ No more "Loading..." states
✅ Production-ready backend

---

**Status:** Ready to deploy!
**Estimated Time:** 15-20 minutes
**Difficulty:** Easy (guided steps)
**Cost:** Free (Railway free tier)

---

**Created by:** Claude Code
**Date:** November 22, 2025
**Purpose:** Deploy Hasura backend to Railway for real data loading
