# 🚀 Kiaan WMS - Complete Railway Deployment Guide

**Date:** November 24, 2025
**Status:** Ready for Deployment
**Current Issue:** Railway frontend showing wrong app (Zirak Books instead of Kiaan WMS)

---

## 📊 Current Situation Analysis

### What's Deployed on Railway:
- **URL:** https://frontend-production-32b8.up.railway.app/
- **Current App:** Zirak Books (Accounting Software) ❌
- **Expected App:** Kiaan WMS (Warehouse Management System) ✅
- **Issue:** Railway service is pointing to wrong repository/build

### What's Working Locally:
- ✅ Hasura GraphQL (Port 8090) - Real data
- ✅ Next.js Frontend (Port 3000) - 92 pages
- ✅ PostgreSQL Database (Port 5439) - 33 products, 48 inventory items
- ✅ All GraphQL queries working
- ✅ All relationships configured

---

## 🎯 Railway Deployment Strategy

You need to deploy **3 separate services** on Railway:

1. **PostgreSQL Database** (Railway Add-on)
2. **Hasura GraphQL Engine** (Docker deployment)
3. **Next.js Frontend** (from GitHub)

---

## 📋 Step-by-Step Deployment Guide

### STEP 1: Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Name it: `kiaan-wms-production`
4. Click **"Create"**

---

### STEP 2: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically:
   - Create a PostgreSQL instance
   - Generate a `DATABASE_URL` variable
   - Make it available to all services

3. **Copy the connection details:**
   - Click on the PostgreSQL service
   - Go to **"Variables"** tab
   - Copy `DATABASE_URL` (you'll need this for Hasura)

**Database URL Format:**
```
postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway
```

---

### STEP 3: Deploy Hasura GraphQL Engine

#### 3.1: Create Hasura Service

1. In your Railway project, click **"New"** → **"Empty Service"**
2. Name it: `hasura-graphql`
3. Click on the service

#### 3.2: Configure Hasura Deployment

1. Go to **"Settings"** tab
2. Under **"Service Settings"**:
   - **Source:** Docker Image
   - **Image:** `hasura/graphql-engine:latest`

#### 3.3: Add Environment Variables

Click **"Variables"** tab and add:

```bash
# Database Connection (use Railway's internal URL)
HASURA_GRAPHQL_DATABASE_URL=${{Postgres.DATABASE_URL}}

# Enable Console
HASURA_GRAPHQL_ENABLE_CONSOLE=true

# Admin Secret (CHANGE THIS!)
HASURA_GRAPHQL_ADMIN_SECRET=your_super_secure_admin_secret_2024

# Dev Mode (for initial setup)
HASURA_GRAPHQL_DEV_MODE=true

# Enable Logs
HASURA_GRAPHQL_ENABLED_LOG_TYPES=startup, http-log, webhook-log, websocket-log, query-log

# JWT Secret (for authentication - configure later)
# HASURA_GRAPHQL_JWT_SECRET={"type":"HS256", "key":"your_jwt_secret_key_min_32_characters"}

# Unauthorized Role (for public access if needed)
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=anonymous

# CORS Settings
HASURA_GRAPHQL_CORS_DOMAIN=*

# Enable Remote Schema Permissions
HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS=true

# Metadata Database (use same as main DB)
HASURA_GRAPHQL_METADATA_DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### 3.4: Deploy Hasura

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Once deployed, click **"Settings"** → **"Networking"** → **"Public Domain"**
4. Copy the Hasura URL (e.g., `https://hasura-graphql-production.up.railway.app`)

#### 3.5: Initialize Hasura Database

1. Open Hasura Console: `https://your-hasura-url.up.railway.app/console`
2. Enter your admin secret
3. Go to **"Data"** tab
4. Click **"Track All"** to expose all tables
5. Click **"Track All Foreign Keys"** to create relationships

**Expected Tables to Track:**
- Product
- Brand
- Inventory
- SalesOrder
- SalesOrderItem
- Customer
- Warehouse
- Zone
- Location
- User
- Company
- PickList, PickItem
- Transfer, TransferItem
- BundleItem
- SalesChannel, ChannelPrice
- ReplenishmentConfig, ReplenishmentTask
- Supplier
- AuditLog

#### 3.6: Load Initial Data

Option 1: **Import from Local Database**
```bash
# On your local machine, export data
pg_dump -h localhost -p 5439 -U wms_user -d kiaan_wms \
  --data-only --inserts \
  -t "Product" -t "Brand" -t "Inventory" -t "Customer" -t "SalesOrder" \
  > /tmp/wms_data.sql

# Import to Railway (get Railway DB connection from variables)
psql "postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:PORT/railway" \
  < /tmp/wms_data.sql
```

Option 2: **Use Seed Script**
```bash
# SSH into Railway backend service and run
npx prisma db push
node prisma/seed.js
```

---

### STEP 4: Deploy Backend API (Optional - if using custom logic)

1. In Railway project, click **"New"** → **"GitHub Repo"**
2. Connect: `https://github.com/maanisingh/kiaan-wms`
3. Name: `wms-backend-api`

#### 4.1: Configure Backend Service

**Settings:**
- **Root Directory:** `backend`
- **Build Command:** `npm install && npx prisma generate`
- **Start Command:** `node server.js`
- **Port:** 8010

#### 4.2: Backend Environment Variables

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server Config
PORT=8010
NODE_ENV=production

# JWT Secret (same as Hasura)
JWT_SECRET=your_jwt_secret_key_min_32_characters

# Hasura Admin Secret (for backend to call Hasura)
HASURA_ADMIN_SECRET=your_super_secure_admin_secret_2024

# Hasura Endpoint
HASURA_GRAPHQL_ENDPOINT=${{Hasura.RAILWAY_PUBLIC_DOMAIN}}/v1/graphql
```

---

### STEP 5: Deploy Frontend (The Main Issue to Fix)

#### 5.1: Create New Frontend Service

**IMPORTANT:** You need to either:
- Create a NEW service, OR
- Update the existing `frontend-production-32b8` service

**Option A: Create New Service (Recommended)**

1. Click **"New"** → **"GitHub Repo"**
2. Select: `maanisingh/kiaan-wms`
3. Name: `wms-frontend`

**Option B: Update Existing Service**

1. Click on existing `frontend-production-32b8` service
2. Go to **"Settings"** → **"Source"**
3. Update repository to: `maanisingh/kiaan-wms`
4. Update root directory (see below)

#### 5.2: Configure Frontend Build

**Settings:**
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Port:** 3000

#### 5.3: Frontend Environment Variables

```bash
# Hasura GraphQL Endpoint (CRITICAL!)
NEXT_PUBLIC_GRAPHQL_URL=${{Hasura.RAILWAY_PUBLIC_DOMAIN}}/v1/graphql

# Hasura Admin Secret
NEXT_PUBLIC_HASURA_ADMIN_SECRET=your_super_secure_admin_secret_2024

# Backend API URL (if using custom backend)
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}

# Environment
NODE_ENV=production

# Next.js specific
NEXT_TELEMETRY_DISABLED=1
```

**Using Railway Reference Variables:**
Railway automatically exposes service URLs. Use the format:
- `${{ServiceName.RAILWAY_PUBLIC_DOMAIN}}` for HTTPS URLs
- `${{ServiceName.RAILWAY_PRIVATE_DOMAIN}}` for internal URLs

#### 5.4: Deploy Frontend

1. Click **"Deploy"**
2. Monitor build logs for errors
3. Build time: ~3-5 minutes
4. Once deployed, visit the public URL
5. **Verify:** You should see "Kiaan WMS" in the title, NOT "Zirak Books"

---

## 🔧 Environment Variables Reference

### Complete List of Required Variables

#### PostgreSQL (Auto-generated by Railway)
```bash
DATABASE_URL=postgresql://postgres:password@host:port/railway
PGHOST=containers-us-west-XXX.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=auto_generated
PGDATABASE=railway
```

#### Hasura GraphQL Engine
```bash
# Database
HASURA_GRAPHQL_DATABASE_URL=${{Postgres.DATABASE_URL}}
HASURA_GRAPHQL_METADATA_DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security
HASURA_GRAPHQL_ADMIN_SECRET=kiaan_hasura_secure_secret_2024_change_this

# JWT (configure when ready)
# HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"your_32_char_minimum_jwt_secret_key_12345"}

# Console & Features
HASURA_GRAPHQL_ENABLE_CONSOLE=true
HASURA_GRAPHQL_DEV_MODE=true
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=anonymous
HASURA_GRAPHQL_CORS_DOMAIN=*
HASURA_GRAPHQL_ENABLE_REMOTE_SCHEMA_PERMISSIONS=true

# Logging
HASURA_GRAPHQL_ENABLED_LOG_TYPES=startup, http-log, webhook-log, websocket-log, query-log
```

#### Backend API (Optional)
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=8010
NODE_ENV=production
JWT_SECRET=same_as_jwt_key_in_hasura_config
HASURA_ADMIN_SECRET=same_as_hasura_admin_secret
HASURA_GRAPHQL_ENDPOINT=https://${{Hasura.RAILWAY_PUBLIC_DOMAIN}}/v1/graphql
```

#### Frontend (Next.js)
```bash
# CRITICAL: Points frontend to Hasura
NEXT_PUBLIC_GRAPHQL_URL=https://${{Hasura.RAILWAY_PUBLIC_DOMAIN}}/v1/graphql

# Hasura access
NEXT_PUBLIC_HASURA_ADMIN_SECRET=same_as_hasura_admin_secret

# Backend API (if used)
NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

---

## ✅ Verification Steps

### After Deployment, Verify Each Service:

#### 1. PostgreSQL Database
```bash
# Test connection (use Railway's database URL)
psql "postgresql://postgres:PASSWORD@host:port/railway" -c "SELECT COUNT(*) FROM \"Product\";"
```
**Expected:** Should return count of products

#### 2. Hasura GraphQL
Visit: `https://your-hasura-url.railway.app/console`

**Test Query:**
```graphql
query {
  Product(limit: 5) {
    id
    name
    sku
    brand {
      name
    }
  }
}
```
**Expected:** Returns real product data

#### 3. Frontend
Visit: `https://your-frontend-url.railway.app/`

**Checks:**
- ✅ Title shows: "Kiaan WMS - Warehouse Management System" (NOT "Zirak Books")
- ✅ Homepage loads without errors
- ✅ Can navigate to `/auth/login`
- ✅ Can navigate to `/(protected)/products`
- ✅ Products page shows real data from GraphQL

---

## 🚨 Common Issues & Solutions

### Issue 1: Frontend Shows "Zirak Books"
**Problem:** Railway service pointing to wrong repository/directory

**Solution:**
1. Go to Railway service settings
2. Check **"Source"** → Should be `maanisingh/kiaan-wms`
3. Check **"Root Directory"** → Should be `frontend`
4. Redeploy the service

### Issue 2: "GraphQL Error: Field not found"
**Problem:** Tables not tracked in Hasura

**Solution:**
1. Open Hasura Console
2. Go to **Data** tab
3. Click **"Track All"** and **"Track All Foreign Keys"**
4. Refresh frontend

### Issue 3: "Connection Refused" or CORS Error
**Problem:** Frontend can't reach Hasura

**Solution:**
1. Check `NEXT_PUBLIC_GRAPHQL_URL` includes `https://` and `/v1/graphql`
2. Verify Hasura has `HASURA_GRAPHQL_CORS_DOMAIN=*`
3. Check Hasura service is running (green status)

### Issue 4: "Authentication Failed"
**Problem:** Admin secret mismatch

**Solution:**
1. Ensure frontend `NEXT_PUBLIC_HASURA_ADMIN_SECRET` matches Hasura `HASURA_GRAPHQL_ADMIN_SECRET`
2. Both should be exactly the same string
3. Redeploy both services if changed

### Issue 5: Build Fails with "Module not found"
**Problem:** Missing dependencies or wrong directory

**Solution:**
1. Check **Root Directory** is set to `frontend`
2. Verify `package.json` exists in `frontend/` directory
3. Check build logs for specific missing module
4. May need to clear Railway cache and rebuild

---

## 📊 Deployment Checklist

Use this checklist to ensure everything is configured:

### PostgreSQL Database
- [ ] PostgreSQL service created
- [ ] DATABASE_URL generated
- [ ] Can connect from local machine (for data import)

### Hasura GraphQL
- [ ] Hasura service created with Docker image
- [ ] All environment variables added
- [ ] Service deployed successfully (green status)
- [ ] Hasura Console accessible
- [ ] Admin secret working
- [ ] All tables tracked (23 WMS tables)
- [ ] All relationships created
- [ ] Test query returns data

### Backend API (if using)
- [ ] Backend service created
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] Build command includes Prisma generate
- [ ] Service deployed successfully
- [ ] Health endpoint returns 200

### Frontend
- [ ] Frontend service created
- [ ] **Repository:** `maanisingh/kiaan-wms` ✅
- [ ] **Root Directory:** `frontend` ✅
- [ ] All environment variables added
- [ ] `NEXT_PUBLIC_GRAPHQL_URL` points to Hasura
- [ ] Build completes without errors
- [ ] Service deployed successfully
- [ ] Public URL shows "Kiaan WMS" (NOT "Zirak Books")
- [ ] Login page accessible
- [ ] Products page shows real data

---

## 🎯 Expected Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RAILWAY PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │  PostgreSQL  │◄─────┤    Hasura    │◄─────┤ Frontend │ │
│  │   Database   │      │   GraphQL    │      │ Next.js  │ │
│  │              │      │   Engine     │      │          │ │
│  │  Port: 5432  │      │ Port: 8080   │      │Port: 3000│ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                      │                    │       │
│         │                      │                    │       │
│    DATABASE_URL        GRAPHQL_ENDPOINT    PUBLIC_DOMAIN   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │                      │                    │
         │                      │                    │
         ▼                      ▼                    ▼
   Internal URL          https://hasura-    https://wms-
   (private)             production.up...   production.up...
                                                    │
                                                    ▼
                                            👤 END USER
```

---

## 📝 Quick Reference Commands

### View Railway Logs
```bash
railway logs --service wms-frontend
railway logs --service hasura-graphql
railway logs --service wms-backend
```

### Redeploy Service
```bash
railway up --service wms-frontend
```

### List All Services
```bash
railway status
```

### Connect to Database
```bash
# Get database URL from Railway dashboard
railway connect database
```

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ **PostgreSQL Database**
   - Contains all 23 WMS tables
   - Has real data (products, inventory, orders)

2. ✅ **Hasura GraphQL**
   - Console accessible at public URL
   - All tables tracked
   - Test query returns real data
   - Relationships working

3. ✅ **Frontend**
   - Shows "Kiaan WMS" in browser title
   - Homepage displays correctly
   - Login page accessible
   - Products page shows real data from Hasura
   - All 92 pages accessible

4. ✅ **Integration**
   - Frontend can query Hasura
   - GraphQL queries return real database data
   - No CORS errors
   - No authentication errors

---

## 📞 Support & Resources

### Railway Documentation
- **Projects:** https://docs.railway.app/develop/projects
- **Environment Variables:** https://docs.railway.app/develop/variables
- **Deploy from GitHub:** https://docs.railway.app/deploy/deployments
- **PostgreSQL:** https://docs.railway.app/databases/postgresql

### Hasura Documentation
- **GraphQL Engine:** https://hasura.io/docs/latest/index/
- **Deployment:** https://hasura.io/docs/latest/deployment/deployment-guides/
- **Environment Variables:** https://hasura.io/docs/latest/deployment/graphql-engine-flags/

### Next.js Documentation
- **Deployment:** https://nextjs.org/docs/deployment
- **Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables

---

## 📋 Next Steps After Deployment

Once everything is deployed:

1. **Test All Features**
   - Create a product
   - Create a sales order
   - Update inventory
   - Test picking workflow

2. **Configure Authentication**
   - Set up JWT in Hasura
   - Update frontend to use JWT tokens
   - Test login flow

3. **Load Production Data**
   - Import real products
   - Import real customers
   - Set up warehouses

4. **Performance Optimization**
   - Enable Hasura query caching
   - Optimize database queries
   - Add database indexes

5. **Security Hardening**
   - Change admin secrets
   - Restrict CORS to your domain
   - Enable HTTPS only
   - Set up rate limiting

---

**Report Generated:** November 24, 2025
**Last Updated:** Just now
**Status:** Ready for Railway Deployment

---

## 🚀 Ready to Deploy?

Follow the steps above in order. If you get stuck:
1. Check the common issues section
2. Review Railway logs
3. Verify all environment variables are set correctly

**Estimated Total Deployment Time:** 1-2 hours

Good luck! 🎉
