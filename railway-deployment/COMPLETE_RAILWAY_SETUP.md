# Complete Railway Setup Guide - Kiaan WMS Backend

**Duration:** 15-20 minutes
**Difficulty:** Easy (just follow the steps)
**Goal:** Deploy backend to make frontend show real data

---

## 🎯 Overview

You'll create 2 new services in Railway:
1. **PostgreSQL Database** - Stores your data (21 tables)
2. **Hasura GraphQL Engine** - Provides API for frontend

Then connect them to your existing frontend.

---

## 📋 STEP 1: Add PostgreSQL Database

### 1.1 Go to Railway Dashboard

1. Open browser and visit: **https://railway.app/**
2. Click **"Login"** (top right)
3. Login with your account
4. You should see your project with the frontend service

### 1.2 Add PostgreSQL Service

```
In your Railway project dashboard:

┌─────────────────────────────────────────┐
│  📦 Your Project Name                   │
│                                         │
│  Services:                              │
│  • frontend-production-c9100 (Active)   │ ← Your existing frontend
│                                         │
│  [+ New] button (click this)            │ ← Click here
└─────────────────────────────────────────┘
```

1. Click the **"+ New"** button
2. In the popup, select **"Database"**
3. Click **"Add PostgreSQL"**
4. Railway will create and provision the database (1-2 minutes)

### 1.3 Wait for PostgreSQL to Activate

```
You'll see:
┌──────────────────────────┐
│  🐘 Postgres             │
│  Status: Provisioning... │  ← Wait for this
└──────────────────────────┘

Changes to:
┌──────────────────────────┐
│  🐘 Postgres             │
│  Status: ✅ Active       │  ← Ready!
└──────────────────────────┘
```

✅ PostgreSQL is now ready!

---

## 📋 STEP 2: Import Your Database

### 2.1 Get Database Connection Info

1. Click on the **PostgreSQL service** (the one you just created)
2. Go to the **"Connect"** tab
3. You'll see connection details like:

```
Database Credentials:
━━━━━━━━━━━━━━━━━━━━━━━
PGHOST:     viaduct.proxy.rlwy.net
PGPORT:     12345
PGUSER:     postgres
PGPASSWORD: some-random-password-here
PGDATABASE: railway
━━━━━━━━━━━━━━━━━━━━━━━
```

**IMPORTANT:** Keep this tab open - you'll need these details!

### 2.2 Import Database via Terminal

Open your terminal and run:

**Option A: Using Railway CLI (Easiest)**
```bash
# If you have Railway CLI installed
cd /root/kiaan-wms/railway-deployment

# Connect to PostgreSQL
railway connect postgresql

# You'll see a psql prompt like: railway=>
# Now paste this command:
\i /root/kiaan-wms/railway-deployment/full_database.sql

# Wait for import (30 seconds - 1 minute)
# You'll see lots of CREATE TABLE and INSERT statements

# When done, verify:
\dt

# Should show 21 tables:
# Brand, Product, Inventory, SalesOrder, etc.

# Exit:
\q
```

**Option B: Using psql Directly**
```bash
# Use the credentials from Railway dashboard
PGPASSWORD='<your-password-from-railway>' psql \
  -h <PGHOST-from-railway> \
  -p <PGPORT-from-railway> \
  -U <PGUSER-from-railway> \
  -d <PGDATABASE-from-railway> \
  < /root/kiaan-wms/railway-deployment/full_database.sql
```

### 2.3 Verify Data Import

```bash
# Connect again
railway connect postgresql

# Or with psql:
PGPASSWORD='<password>' psql -h <host> -p <port> -U <user> -d <database>

# Check tables exist:
\dt

# Should see 21 tables

# Check data counts:
SELECT COUNT(*) FROM "Product";
# Should return: 32

SELECT COUNT(*) FROM "Inventory";
# Should return: 10707

SELECT COUNT(*) FROM "SalesOrder";
# Should return: 30

# Exit:
\q
```

✅ Database imported successfully!

---

## 📋 STEP 3: Create Hasura Service

### 3.1 Add Empty Service

```
Back in Railway dashboard:

┌─────────────────────────────────────────┐
│  📦 Your Project Name                   │
│                                         │
│  Services:                              │
│  • frontend-production-c9100 (Active)   │
│  • Postgres (Active)                    │ ← Just added
│                                         │
│  [+ New] button (click again)           │ ← Click here
└─────────────────────────────────────────┘
```

1. Click **"+ New"** button
2. Select **"Empty Service"**
3. Name it: **`kiaan-wms-hasura`** (or any name you like)
4. Click **"Create"**

### 3.2 Configure Docker Image

```
In the Hasura service you just created:

1. Click "Settings" (left sidebar)
2. Scroll to "Source" section
3. Click the "Source" dropdown
4. Select "Docker Image"
5. In the image field, enter:
   hasura/graphql-engine:latest
6. Click "Deploy" button
```

You'll see:
```
┌──────────────────────────┐
│  Hasura                  │
│  Status: Deploying...    │
└──────────────────────────┘
```

Wait for it to finish (2-3 minutes).

---

## 📋 STEP 4: Configure Hasura Environment Variables

### 4.1 Go to Variables Tab

```
In Hasura service:
1. Click "Variables" tab (top)
2. You'll see a section to add variables
```

### 4.2 Add Each Variable

Click **"+ New Variable"** for each of these:

#### Variable 1: Database Connection
```
Variable Name:  HASURA_GRAPHQL_DATABASE_URL
Value:          ${{Postgres.DATABASE_URL}}
```
**Note:** Replace `Postgres` with your actual PostgreSQL service name if different

#### Variable 2: Admin Secret
```
Variable Name:  HASURA_GRAPHQL_ADMIN_SECRET
Value:          kiaan_hasura_admin_secret_2024
```

#### Variable 3: Enable Console
```
Variable Name:  HASURA_GRAPHQL_ENABLE_CONSOLE
Value:          true
```

#### Variable 4: Enabled APIs
```
Variable Name:  HASURA_GRAPHQL_ENABLED_APIS
Value:          metadata,graphql,config
```

#### Variable 5: Dev Mode
```
Variable Name:  HASURA_GRAPHQL_DEV_MODE
Value:          true
```

#### Variable 6: CORS Domain
```
Variable Name:  HASURA_GRAPHQL_CORS_DOMAIN
Value:          *
```

### 4.3 Your Variables Should Look Like:

```
┌─────────────────────────────────────────────────────────────┐
│  Environment Variables                                      │
├─────────────────────────────────────────────────────────────┤
│  HASURA_GRAPHQL_DATABASE_URL                                │
│  ${{Postgres.DATABASE_URL}}                                 │
├─────────────────────────────────────────────────────────────┤
│  HASURA_GRAPHQL_ADMIN_SECRET                                │
│  kiaan_hasura_admin_secret_2024                             │
├─────────────────────────────────────────────────────────────┤
│  HASURA_GRAPHQL_ENABLE_CONSOLE                              │
│  true                                                       │
├─────────────────────────────────────────────────────────────┤
│  HASURA_GRAPHQL_ENABLED_APIS                                │
│  metadata,graphql,config                                    │
├─────────────────────────────────────────────────────────────┤
│  HASURA_GRAPHQL_DEV_MODE                                    │
│  true                                                       │
├─────────────────────────────────────────────────────────────┤
│  HASURA_GRAPHQL_CORS_DOMAIN                                 │
│  *                                                          │
└─────────────────────────────────────────────────────────────┘
```

After adding variables, Hasura will auto-redeploy (1-2 minutes).

✅ Hasura configured!

---

## 📋 STEP 5: Generate Hasura Public Domain

### 5.1 Enable Public Access

```
In Hasura service:

1. Click "Settings" tab
2. Scroll to "Networking" section
3. Click "Generate Domain" button
```

### 5.2 Copy the Domain

```
You'll see something like:

┌─────────────────────────────────────────┐
│  Public Networking                      │
├─────────────────────────────────────────┤
│  Domain:                                │
│  kiaan-wms-hasura.up.railway.app        │ ← Copy this!
│                                         │
│  [Remove Domain]                        │
└─────────────────────────────────────────┘
```

**IMPORTANT:** Copy this domain! You need it for the next steps.

Example domain: `kiaan-wms-hasura.up.railway.app`

✅ Hasura is now publicly accessible!

---

## 📋 STEP 6: Track Tables in Hasura Console

### 6.1 Open Hasura Console

1. Open a new browser tab
2. Visit: **`https://[your-hasura-domain]/console`**
   - Replace `[your-hasura-domain]` with the domain from Step 5
   - Example: `https://kiaan-wms-hasura.up.railway.app/console`

### 6.2 Login to Console

```
You'll see a login screen:

┌────────────────────────────────────┐
│  Hasura Console                    │
│                                    │
│  Enter admin secret:               │
│  [____________________________]    │
│                                    │
│  [Enter] button                    │
└────────────────────────────────────┘
```

Enter: **`kiaan_hasura_admin_secret_2024`**

Click **"Enter"**

### 6.3 Track All Tables

```
You're now in Hasura Console:

Top Menu: [GraphiQL] [Data] [Actions] [Remote Schemas] [Events] [Settings]
                      ↑ Click "Data"
```

1. Click **"Data"** in the top menu
2. You'll see the left sidebar with all your database tables:

```
┌─────────────────────────────┐
│  public                     │
├─────────────────────────────┤
│  Untracked Tables           │
│  • Brand                    │
│  • Customer                 │
│  • Inventory                │
│  • InventoryMovement        │
│  • Location                 │
│  • Permission               │
│  • Product                  │
│  • PurchaseOrder            │
│  • PurchaseOrderItem        │
│  • Role                     │
│  • SalesOrder               │
│  • SalesOrderItem           │
│  • StockAdjustment          │
│  • Supplier                 │
│  • User                     │
│  • VendorCustomer           │
│  • Warehouse                │
│  • Zone                     │
│  ... and more               │
│                             │
│  [Track All] button         │ ← Click this!
└─────────────────────────────┘
```

3. Click **"Track All"** button
4. All tables will move to "Tracked Tables" section

### 6.4 Track Relationships

For each table:
1. Click on the table name (e.g., "Product")
2. Go to **"Relationships"** tab
3. Hasura will suggest relationships
4. Click **"Track All"** for suggested relationships

Do this for main tables:
- Product
- Inventory
- SalesOrder
- SalesOrderItem
- Customer
- Supplier

### 6.5 Verify GraphQL API

1. Click **"API"** or **"GraphiQL"** tab (top menu)
2. In the left panel, paste this query:

```graphql
query TestData {
  Product(limit: 5) {
    id
    name
    sku
    sellingPrice
  }
}
```

3. Click the **Play** button (▶)
4. You should see 5 products returned!

```json
{
  "data": {
    "Product": [
      {
        "id": "...",
        "name": "Product 1",
        "sku": "SKU001",
        "sellingPrice": 100
      },
      ...
    ]
  }
}
```

✅ Hasura is working and serving data!

---

## 📋 STEP 7: Update Frontend Variables

### 7.1 Go to Frontend Service

```
Back in Railway dashboard:

1. Click on your "frontend-production-c9100" service
2. Click "Variables" tab
```

### 7.2 Add Hasura URL Variables

Click **"+ New Variable"** for each:

#### Variable 1: GraphQL Endpoint
```
Variable Name:  NEXT_PUBLIC_GRAPHQL_URL
Value:          https://[your-hasura-domain]/v1/graphql
```
Replace `[your-hasura-domain]` with your actual domain from Step 5.

**Example:**
```
NEXT_PUBLIC_GRAPHQL_URL
https://kiaan-wms-hasura.up.railway.app/v1/graphql
```

#### Variable 2: Admin Secret
```
Variable Name:  NEXT_PUBLIC_HASURA_ADMIN_SECRET
Value:          kiaan_hasura_admin_secret_2024
```

### 7.3 Your Frontend Variables Should Look Like:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Environment Variables                                              │
├─────────────────────────────────────────────────────────────────────┤
│  NEXT_PUBLIC_GRAPHQL_URL                                            │
│  https://kiaan-wms-hasura.up.railway.app/v1/graphql                 │
├─────────────────────────────────────────────────────────────────────┤
│  NEXT_PUBLIC_HASURA_ADMIN_SECRET                                    │
│  kiaan_hasura_admin_secret_2024                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.4 Wait for Redeploy

After adding variables:
```
┌──────────────────────────────────┐
│  frontend-production-c9100       │
│  Status: Deploying...            │
└──────────────────────────────────┘
```

This takes 2-3 minutes. Wait for:
```
┌──────────────────────────────────┐
│  frontend-production-c9100       │
│  Status: ✅ Active               │
└──────────────────────────────────┘
```

✅ Frontend connected to Hasura!

---

## 📋 STEP 8: Verify Everything Works!

### 8.1 Test Hasura API Directly

Open terminal and run:

```bash
# Replace [your-hasura-domain] with your actual domain
curl -X POST https://[your-hasura-domain]/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product(limit: 5) { id name sku } }"}'
```

**Expected Result:**
```json
{
  "data": {
    "Product": [
      {"id": "...", "name": "Product 1", "sku": "SKU001"},
      {"id": "...", "name": "Product 2", "sku": "SKU002"},
      ...
    ]
  }
}
```

✅ API working!

### 8.2 Test Frontend Pages

Visit these URLs in your browser:

#### Dashboard Page
```
https://frontend-production-c9100.up.railway.app/dashboard
```

**Should show:**
- Total Products: 32
- Low Stock Items: 15
- Pending Orders: 8
- Recent Orders table with real data

#### Products Page
```
https://frontend-production-c9100.up.railway.app/products
```

**Should show:**
- List of 32 products
- SKU, name, price for each
- Brand filters working
- Stock levels

#### Inventory Page
```
https://frontend-production-c9100.up.railway.app/inventory
```

**Should show:**
- 10,707 inventory items
- Locations and zones
- Quantities
- Expiry dates

#### Sales Orders Page
```
https://frontend-production-c9100.up.railway.app/sales-orders
```

**Should show:**
- 30 sales orders
- Customer names
- Order totals
- Status (pending, completed, etc.)

### 8.3 Automated Test

Run this in terminal:

```bash
node /tmp/check_railway_data.js
```

**Expected Output:**
```
=== Testing Railway Deployment ===

URL: https://frontend-production-c9100.up.railway.app/dashboard

Loading Indicators: { spinners: 0, loadingText: false }

Dashboard Stats Found: [ '32', '15', '8' ]

Errors Found: None

Screenshot saved to: /tmp/railway_dashboard.png

=== CONCLUSION ===
✅ REAL DATA LOADING - Backend connected!
```

---

## ✅ Success Checklist

Go through this checklist:

- [ ] PostgreSQL service is **Active** in Railway
- [ ] Database has **21 tables** (verified with `\dt`)
- [ ] Product count is **32** (verified with SELECT)
- [ ] Hasura service is **Active** in Railway
- [ ] Hasura console is accessible at `https://[domain]/console`
- [ ] All **21 tables** are tracked in Hasura
- [ ] Frontend variables are **set correctly**
- [ ] Frontend has **redeployed** (shows Active)
- [ ] Dashboard shows **real statistics** (32, 15, 8)
- [ ] Products page shows **32 products**
- [ ] Inventory page shows **10,707 items**
- [ ] Orders page shows **30 orders**
- [ ] No "Loading..." states stuck on pages

---

## 🎉 DEPLOYMENT COMPLETE!

Your Railway infrastructure now looks like this:

```
┌─────────────────────────────────────────────┐
│  Your Railway Project                       │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ frontend-production-c9100 (Active)      │
│     → https://frontend-production-c9100.    │
│       up.railway.app                        │
│                                             │
│  ✅ kiaan-wms-hasura (Active)               │
│     → https://kiaan-wms-hasura.             │
│       up.railway.app                        │
│                                             │
│  ✅ Postgres (Active)                       │
│     → Internal database (21 tables)         │
│                                             │
└─────────────────────────────────────────────┘
```

**Data Flow:**
```
User → Frontend (Railway) → Hasura (Railway) → PostgreSQL (Railway)
                             ↓
                    Returns real data from 21 tables!
```

---

## 🔍 Troubleshooting

### Problem: Pages still show "Loading..."

**Check:**
1. Frontend variables are set correctly (no typos!)
2. Hasura domain is correct in `NEXT_PUBLIC_GRAPHQL_URL`
3. Frontend has redeployed (check deployment logs)

**Fix:**
- Go to frontend service → Click "Deploy" → "Redeploy"

### Problem: "relation Product does not exist"

**Check:**
- Tables are tracked in Hasura console

**Fix:**
- Open Hasura console
- Click "Data" → "Track All"

### Problem: CORS errors in browser console

**Check:**
- Hasura has `HASURA_GRAPHQL_CORS_DOMAIN=*` variable

**Fix:**
- Add the variable to Hasura service
- Wait for redeploy

### Problem: Authentication errors

**Check:**
- Both secrets match:
  - Hasura: `HASURA_GRAPHQL_ADMIN_SECRET`
  - Frontend: `NEXT_PUBLIC_HASURA_ADMIN_SECRET`
  - Both should be: `kiaan_hasura_admin_secret_2024`

---

## 📞 Need Help?

If you get stuck:

1. Check Railway deployment logs:
   - Click service → "Deployments" → Latest deployment → "View Logs"

2. Check Hasura logs:
   - Hasura service → "Deployments" → "View Logs"

3. Verify database connection:
   - `railway connect postgresql` → `\dt` → Should show 21 tables

4. Test GraphQL directly:
   - Use the curl command from Step 8.1

---

**Total Time:** ~15-20 minutes
**Difficulty:** Easy
**Result:** Production backend with real data! 🚀
