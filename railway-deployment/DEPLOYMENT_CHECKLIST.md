# Railway Deployment Checklist

**Print this and check off items as you complete them!**

---

## Before You Start

- [ ] Railway account created and logged in
- [ ] Browser open to https://railway.app/
- [ ] Terminal ready with Railway CLI installed
- [ ] Located deployment files at `/root/kiaan-wms/railway-deployment/`

---

## STEP 1: PostgreSQL Database

- [ ] Clicked "+ New" in Railway dashboard
- [ ] Selected "Database" → "Add PostgreSQL"
- [ ] Waited for PostgreSQL status to show "Active" (green)
- [ ] Clicked on PostgreSQL service
- [ ] Noted down connection details from "Connect" tab

---

## STEP 2: Import Database

- [ ] Ran `cd /root/kiaan-wms/railway-deployment`
- [ ] Ran `railway connect postgresql`
- [ ] Ran `\i /root/kiaan-wms/railway-deployment/full_database.sql`
- [ ] Waited for import to complete (~1 minute)
- [ ] Verified with `\dt` - saw 21 tables
- [ ] Verified with `SELECT COUNT(*) FROM "Product";` - got 32
- [ ] Verified with `SELECT COUNT(*) FROM "Inventory";` - got 10707
- [ ] Exited with `\q`

---

## STEP 3: Hasura Service

- [ ] Clicked "+ New" → "Empty Service"
- [ ] Named it: `kiaan-wms-hasura`
- [ ] Clicked "Settings" tab
- [ ] Scrolled to "Source" section
- [ ] Selected "Docker Image" from dropdown
- [ ] Entered image: `hasura/graphql-engine:latest`
- [ ] Clicked "Deploy"
- [ ] Waited for status to show "Active"

---

## STEP 4: Hasura Environment Variables

- [ ] Clicked on Hasura service
- [ ] Clicked "Variables" tab
- [ ] Added Variable 1:
  - Name: `HASURA_GRAPHQL_DATABASE_URL`
  - Value: `${{Postgres.DATABASE_URL}}`
- [ ] Added Variable 2:
  - Name: `HASURA_GRAPHQL_ADMIN_SECRET`
  - Value: `kiaan_hasura_admin_secret_2024`
- [ ] Added Variable 3:
  - Name: `HASURA_GRAPHQL_ENABLE_CONSOLE`
  - Value: `true`
- [ ] Added Variable 4:
  - Name: `HASURA_GRAPHQL_ENABLED_APIS`
  - Value: `metadata,graphql,config`
- [ ] Added Variable 5:
  - Name: `HASURA_GRAPHQL_DEV_MODE`
  - Value: `true`
- [ ] Added Variable 6:
  - Name: `HASURA_GRAPHQL_CORS_DOMAIN`
  - Value: `*`
- [ ] Waited for Hasura to redeploy (1-2 min)
- [ ] Verified status is "Active"

---

## STEP 5: Hasura Domain

- [ ] In Hasura service, clicked "Settings"
- [ ] Scrolled to "Networking" section
- [ ] Clicked "Generate Domain"
- [ ] Copied domain (e.g., `kiaan-wms-hasura.up.railway.app`)
- [ ] Wrote down domain: __________________________________

---

## STEP 6: Track Tables in Hasura

- [ ] Opened new browser tab
- [ ] Visited `https://[my-hasura-domain]/console`
- [ ] Entered admin secret: `kiaan_hasura_admin_secret_2024`
- [ ] Clicked "Data" tab
- [ ] Clicked "Track All" button
- [ ] Saw all 21 tables move to "Tracked Tables"
- [ ] Clicked on "Product" table
- [ ] Clicked "Relationships" tab
- [ ] Clicked "Track All" for relationships
- [ ] Repeated for main tables (SalesOrder, Inventory, Customer)
- [ ] Clicked "API" or "GraphiQL" tab
- [ ] Tested query:
  ```graphql
  query TestData {
    Product(limit: 5) {
      id
      name
      sku
    }
  }
  ```
- [ ] Saw 5 products returned successfully

---

## STEP 7: Frontend Variables

- [ ] Clicked on Frontend service (`frontend-production-c9100`)
- [ ] Clicked "Variables" tab
- [ ] Added Variable 1:
  - Name: `NEXT_PUBLIC_GRAPHQL_URL`
  - Value: `https://[MY-HASURA-DOMAIN]/v1/graphql`
  - (Used domain from Step 5)
- [ ] Added Variable 2:
  - Name: `NEXT_PUBLIC_HASURA_ADMIN_SECRET`
  - Value: `kiaan_hasura_admin_secret_2024`
- [ ] Waited for frontend to redeploy (2-3 min)
- [ ] Verified frontend status is "Active"

---

## STEP 8: Verification

### Test Hasura API (Terminal)

- [ ] Ran curl command:
  ```bash
  curl -X POST https://[MY-HASURA-DOMAIN]/v1/graphql \
    -H 'Content-Type: application/json' \
    -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
    -d '{"query":"{ Product(limit: 5) { id name sku } }"}'
  ```
- [ ] Got response with 5 products

### Test Frontend Pages (Browser)

- [ ] Visited: `https://frontend-production-c9100.up.railway.app/dashboard`
  - [ ] Saw "Total Products: 32"
  - [ ] Saw "Low Stock Items: 15"
  - [ ] Saw "Pending Orders: 8"
  - [ ] Saw recent orders table with data

- [ ] Visited: `https://frontend-production-c9100.up.railway.app/products`
  - [ ] Saw list of 32 products
  - [ ] Saw SKU, name, price for each
  - [ ] Saw brand filters working

- [ ] Visited: `https://frontend-production-c9100.up.railway.app/inventory`
  - [ ] Saw 10,707 inventory items
  - [ ] Saw locations and quantities

- [ ] Visited: `https://frontend-production-c9100.up.railway.app/sales-orders`
  - [ ] Saw 30 sales orders
  - [ ] Saw customer names and totals

### Automated Test

- [ ] Ran: `node /tmp/check_railway_data.js`
- [ ] Saw output: `✅ REAL DATA LOADING - Backend connected!`

---

## 🎉 Final Checks

- [ ] All 3 Railway services show "Active" status:
  - [ ] frontend-production-c9100
  - [ ] kiaan-wms-hasura
  - [ ] Postgres

- [ ] No pages stuck on "Loading..."
- [ ] No console errors in browser (F12 → Console)
- [ ] GraphQL queries work in Hasura console
- [ ] All frontend pages display real data

---

## ✅ Deployment Complete!

**Congratulations!** Your Kiaan WMS backend is now live on Railway!

**Your Infrastructure:**
- Frontend: https://frontend-production-c9100.up.railway.app/
- Hasura API: https://[your-domain]/v1/graphql
- Hasura Console: https://[your-domain]/console
- PostgreSQL: 21 tables with production data

---

## 📸 Optional: Take Screenshots

For documentation, take screenshots of:
- [ ] Railway dashboard showing all 3 active services
- [ ] Hasura console showing tracked tables
- [ ] Frontend dashboard with real data
- [ ] Products page with 32 products
- [ ] Inventory page with 10,707 items

---

## 🔐 Important Information to Save

**Admin Secret:**
```
kiaan_hasura_admin_secret_2024
```

**Hasura Domain:**
```
[Write yours here: _________________________________]
```

**Hasura GraphQL Endpoint:**
```
https://[your-domain]/v1/graphql
```

**Hasura Console:**
```
https://[your-domain]/console
```

---

**Deployment Date:** __________________
**Completed By:** ____________________
**Total Time Taken:** ________________

---

## 🎯 What's Next?

Now that your backend is deployed, you can:

- [ ] Build and deploy remaining 70+ pages
- [ ] Set up Metabase analytics on Railway
- [ ] Configure role-based access control in Hasura
- [ ] Add automated backups for PostgreSQL
- [ ] Set up monitoring and alerts
- [ ] Add custom domain for frontend
- [ ] Enable HTTPS for all services (Railway does this automatically)
- [ ] Configure CI/CD for automatic deployments

---

**Guide Version:** 1.0
**Last Updated:** November 22, 2025
