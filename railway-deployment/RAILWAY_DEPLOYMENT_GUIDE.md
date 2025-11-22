# Railway Backend Deployment Guide - Kiaan WMS

**Date:** November 22, 2025
**Frontend URL:** https://frontend-production-c9100.up.railway.app/
**Status:** Backend deployment in progress

---

## Overview

This guide deploys the complete Kiaan WMS backend infrastructure to Railway:
- PostgreSQL Database (with 21 tables + real data)
- Hasura GraphQL Engine (auto-generates APIs)
- Frontend environment configuration

---

## Step 1: Deploy PostgreSQL Database

### 1.1 Create PostgreSQL Service

**Via Railway Dashboard:**
1. Go to your Railway project
2. Click "New" → "Database" → "PostgreSQL"
3. Name it: `kiaan-wms-postgres`
4. Wait for provisioning (1-2 minutes)

**Via Railway CLI:**
```bash
railway add --database postgresql
```

### 1.2 Get Database Connection Details

After provisioning, Railway provides:
- `DATABASE_URL` (connection string)
- `PGHOST` (hostname)
- `PGPORT` (port, usually 5432)
- `PGUSER` (username)
- `PGPASSWORD` (password)
- `PGDATABASE` (database name)

**Note these down - you'll need them!**

### 1.3 Import Database Schema and Data

**Option A: Import via psql (Recommended)**

```bash
# Get the DATABASE_URL from Railway dashboard
# It looks like: postgresql://user:pass@host:port/database

# Import the complete database dump
PGPASSWORD='<railway_password>' psql -h <railway_host> -p <railway_port> -U <railway_user> -d <railway_database> < full_database.sql
```

**Option B: Import via Railway CLI**

```bash
# Connect to Railway PostgreSQL
railway connect postgresql

# Then in the psql prompt:
\i /root/kiaan-wms/railway-deployment/full_database.sql
```

### 1.4 Verify Import

```bash
# Connect to database
PGPASSWORD='<railway_password>' psql -h <railway_host> -p <railway_port> -U <railway_user> -d <railway_database>

# Check tables
\dt

# Verify data counts
SELECT COUNT(*) FROM "Product";
SELECT COUNT(*) FROM "Inventory";
SELECT COUNT(*) FROM "SalesOrder";
```

**Expected Results:**
- 21 tables total
- 32 Products
- 10,707 Inventory items
- 30 Sales Orders

---

## Step 2: Deploy Hasura GraphQL Engine

### 2.1 Create Hasura Service

**Via Railway Dashboard:**
1. In your project, click "New" → "Empty Service"
2. Name it: `kiaan-wms-hasura`
3. Go to "Settings" → "Service Variables"

### 2.2 Configure Environment Variables

Add these variables in Railway dashboard:

```env
# Database Connection (use Railway PostgreSQL URL)
HASURA_GRAPHQL_DATABASE_URL=${{kiaan-wms-postgres.DATABASE_URL}}

# Admin Secret (IMPORTANT: Keep this secure!)
HASURA_GRAPHQL_ADMIN_SECRET=kiaan_hasura_admin_secret_2024

# Enable Console (for development/debugging)
HASURA_GRAPHQL_ENABLE_CONSOLE=true

# Enable Metadata API
HASURA_GRAPHQL_ENABLED_APIS=metadata,graphql,config

# Logging
HASURA_GRAPHQL_DEV_MODE=true
HASURA_GRAPHQL_ENABLE_LOGGING=true

# CORS (allow frontend to connect)
HASURA_GRAPHQL_CORS_DOMAIN=*
```

### 2.3 Deploy Hasura Docker Image

**Via Railway Dashboard:**
1. Go to Hasura service → "Settings"
2. Under "Deploy", set:
   - **Source:** Docker Image
   - **Image:** `hasura/graphql-engine:latest`
3. Click "Deploy"

**Via Railway CLI:**
```bash
# From hasura directory
cd /root/kiaan-wms/hasura
railway up
```

### 2.4 Get Hasura URL

After deployment (2-3 minutes):
1. Go to Hasura service → "Settings"
2. Click "Generate Domain" to get public URL
3. Note the URL (e.g., `kiaan-wms-hasura.up.railway.app`)

**Your Hasura GraphQL endpoint will be:**
```
https://<hasura-domain>/v1/graphql
```

### 2.5 Track Tables in Hasura

**Option A: Via Hasura Console (Recommended)**

1. Visit: `https://<hasura-domain>/console`
2. Enter admin secret: `kiaan_hasura_admin_secret_2024`
3. Go to "Data" tab
4. Click "Track All" for all 21 tables
5. Set up relationships (Hasura auto-suggests most)

**Option B: Via Metadata Import**

If you have existing Hasura metadata from local setup:
```bash
# Export local metadata first
cd /root/kiaan-wms/hasura
hasura metadata export

# Then apply to Railway Hasura
hasura metadata apply --endpoint https://<hasura-domain> --admin-secret kiaan_hasura_admin_secret_2024
```

---

## Step 3: Update Frontend Configuration

### 3.1 Update Railway Frontend Environment Variables

**Via Railway Dashboard:**
1. Go to your frontend service
2. Navigate to "Variables" tab
3. Add/Update these variables:

```env
# Hasura GraphQL Endpoint (use your Hasura Railway URL)
NEXT_PUBLIC_GRAPHQL_URL=https://<hasura-domain>/v1/graphql

# Admin Secret (must match Hasura config)
NEXT_PUBLIC_HASURA_ADMIN_SECRET=kiaan_hasura_admin_secret_2024
```

### 3.2 Redeploy Frontend

After adding variables:
1. Railway will auto-redeploy frontend
2. Wait 2-3 minutes for build
3. Frontend will now connect to Railway Hasura

**Via Railway CLI:**
```bash
cd /root/kiaan-wms/frontend
railway up
```

---

## Step 4: Verification & Testing

### 4.1 Test Hasura Connection

**Via Browser:**
```
Visit: https://<hasura-domain>/v1/graphql
```

Should return: `{"errors":[{"message":"missing x-hasura-admin-secret header"}]}`
This is correct! It means Hasura is running.

**Via curl:**
```bash
curl -X POST https://<hasura-domain>/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product { id name sku } }"}'
```

Should return 32 products!

### 4.2 Test Frontend Data Loading

**Visit these pages on Railway frontend:**

1. **Dashboard:** https://frontend-production-c9100.up.railway.app/dashboard
   - Should show: Total Products, Low Stock Items, Pending Orders stats
   - Should display: Recent orders table with real data

2. **Products:** https://frontend-production-c9100.up.railway.app/products
   - Should show: 32 products from database
   - Should display: Brand filters, SKU, prices, stock levels

3. **Inventory:** https://frontend-production-c9100.up.railway.app/inventory
   - Should show: 10,707 inventory items
   - Should display: Locations, quantities, expiry dates

4. **Orders:** https://frontend-production-c9100.up.railway.app/sales-orders
   - Should show: 30 sales orders
   - Should display: Order numbers, customers, statuses

### 4.3 Test Data via Puppeteer

Run the automated test:
```bash
node /tmp/check_railway_data.js
```

**Expected Output:**
```
✅ REAL DATA LOADING - Backend connected!
Dashboard Stats Found: ['32', '15', '8']
```

---

## Troubleshooting

### Issue: Frontend shows "Loading..." forever

**Cause:** Frontend can't connect to Hasura
**Fix:**
1. Check `NEXT_PUBLIC_GRAPHQL_URL` is set correctly
2. Verify Hasura service is running (check Railway logs)
3. Check Hasura admin secret matches in both services

### Issue: "relation does not exist" errors

**Cause:** Database not imported correctly
**Fix:**
1. Verify all tables imported: `\dt` in psql
2. Re-import if needed: `psql < full_database.sql`
3. Track tables in Hasura console

### Issue: CORS errors in browser console

**Cause:** Hasura CORS not configured
**Fix:**
Add to Hasura environment variables:
```env
HASURA_GRAPHQL_CORS_DOMAIN=*
```

### Issue: Authentication errors

**Cause:** Admin secret mismatch
**Fix:**
Ensure `HASURA_GRAPHQL_ADMIN_SECRET` in Hasura matches `NEXT_PUBLIC_HASURA_ADMIN_SECRET` in frontend

---

## Railway CLI Quick Reference

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Check services
railway status

# View logs
railway logs

# Connect to PostgreSQL
railway connect postgresql

# Deploy
railway up
```

---

## Files in This Directory

- `schema.sql` (94KB) - Database schema only
- `data.sql` (176KB) - Data only (with FK warnings)
- `full_database.sql` (214KB) - Complete dump (RECOMMENDED)

---

## Database Statistics

**Tables:** 21 total
- Brand, Product, Inventory
- Customer, Supplier, VendorCustomer
- Warehouse, Location, Zone
- SalesOrder, SalesOrderItem
- PurchaseOrder, PurchaseOrderItem
- InventoryMovement, StockAdjustment
- User, Role, Permission
- Directus tables (CMS/admin)

**Data Counts:**
- Products: 32
- Inventory Items: 10,707
- Sales Orders: 30
- Purchase Orders: 5
- Locations: 15
- Customers: 10

---

## Next Steps After Deployment

1. **Setup Metabase Analytics** (already configured locally):
   - Deploy Metabase to Railway
   - Connect to Railway PostgreSQL
   - Import saved dashboards

2. **Enable Hasura Metadata Automation:**
   - Export local metadata
   - Version control in Git
   - Auto-apply on deployment

3. **Add Production Security:**
   - Generate strong admin secret
   - Enable JWT authentication
   - Configure role-based access control
   - Set up API rate limiting

4. **Monitoring & Logging:**
   - Enable Railway metrics
   - Set up error tracking (Sentry)
   - Configure uptime monitoring

5. **CI/CD Pipeline:**
   - Auto-deploy on git push
   - Run tests before deployment
   - Database migration automation

---

**Created:** November 22, 2025
**Status:** Ready for deployment
**Estimated Time:** 15-20 minutes total
