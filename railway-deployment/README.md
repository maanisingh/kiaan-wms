# Kiaan WMS - Railway Backend Deployment Package

**Version:** 1.0
**Created:** November 22, 2025
**Status:** Ready for deployment

---

## 🎯 Purpose

Deploy PostgreSQL database and Hasura GraphQL Engine to Railway so your frontend at **https://frontend-production-c9100.up.railway.app/** displays real data instead of showing "Loading..." states.

---

## 📦 What's In This Package

### ⭐ Primary Guides (Pick One)

**For detailed step-by-step instructions:**
- `COMPLETE_RAILWAY_SETUP.md` - Full guide with visuals and explanations

**For quick checklist format:**
- `DEPLOYMENT_CHECKLIST.md` - Printable checklist to check off as you go

### 📚 Supporting Documentation

- `ENVIRONMENT_VARIABLES_CHEATSHEET.md` - All env vars with copy-paste values
- `DEPLOY_NOW.md` - Condensed quick reference
- `QUICK_START.md` - Fast-track 8 steps
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Comprehensive docs
- `ARCHITECTURE_DIAGRAM.txt` - Visual data flow diagrams

### 💾 Database Files

- `full_database.sql` (214KB) - **Use this!** Complete DB dump
- `schema.sql` (94KB) - Schema only (alternative)
- `data.sql` (176KB) - Data only (has FK warnings, don't use)

### 🔧 Scripts

- `deploy_to_railway.sh` - Automated deployment (requires Railway CLI login)

---

## 🚀 Getting Started

### Option 1: Detailed Guide (Recommended)

```bash
# Read the full setup guide
cat COMPLETE_RAILWAY_SETUP.md

# Then follow the 8 steps in Railway dashboard
```

### Option 2: Checklist Format

```bash
# View the checklist
cat DEPLOYMENT_CHECKLIST.md

# Print it and check off items as you complete them
```

### Option 3: Automated Script

```bash
# Login to Railway first (opens browser)
railway login

# Run the automated script
./deploy_to_railway.sh
```

---

## ⏱️ Time Required

- **Total Time:** 15-20 minutes
- **Active Time:** ~10 minutes (rest is waiting for Railway)

**Breakdown:**
1. Add PostgreSQL: 2 min
2. Import database: 5 min
3. Create Hasura: 3 min
4. Configure variables: 2 min
5. Generate domain: 1 min
6. Track tables: 2 min
7. Update frontend: 1 min
8. Verify: 1 min

---

## 🎯 What You'll Deploy

### Services on Railway:

1. **PostgreSQL Database**
   - 21 tables
   - 32 products
   - 10,707 inventory items
   - 30 sales orders
   - Source: `full_database.sql`

2. **Hasura GraphQL Engine**
   - Docker: `hasura/graphql-engine:latest`
   - Auto-generates GraphQL API from database
   - Admin console included
   - Real-time subscriptions ready

3. **Updated Frontend**
   - Connect to Railway Hasura
   - Display real data from PostgreSQL

---

## 📋 The 8 Steps

1. **Add PostgreSQL** to Railway project
2. **Import** `full_database.sql` into PostgreSQL
3. **Create Hasura** service (Docker image)
4. **Configure** 6 Hasura environment variables
5. **Generate** public domain for Hasura
6. **Track** all 21 tables in Hasura console
7. **Update** 2 frontend environment variables
8. **Verify** pages load real data

---

## 🔑 Key Information

### Admin Secret
```
kiaan_hasura_admin_secret_2024
```
Use this everywhere - Hasura and Frontend must match!

### Database File
```
/root/kiaan-wms/railway-deployment/full_database.sql
```

### Hasura Docker Image
```
hasura/graphql-engine:latest
```

### Frontend URL
```
https://frontend-production-c9100.up.railway.app/
```

---

## ✅ Success Criteria

After deployment, you should see:

**Dashboard Page:**
- Total Products: 32
- Low Stock Items: 15
- Pending Orders: 8
- Recent orders table with real data

**Products Page:**
- List of 32 products
- SKU, name, price for each
- Brand filters working

**Inventory Page:**
- 10,707 inventory items
- Locations and zones
- Quantities and expiry dates

**Orders Page:**
- 30 sales orders
- Customer names and details
- Order totals and statuses

---

## 🐛 Troubleshooting

### Pages still show "Loading..."

**Check:**
1. Frontend variables are correct
2. Hasura service is "Active"
3. Frontend has redeployed

**Fix:**
- Redeploy frontend manually

### "relation does not exist" errors

**Check:**
- Tables tracked in Hasura

**Fix:**
- Hasura console → Data → Track All

### CORS errors

**Check:**
- Hasura has `HASURA_GRAPHQL_CORS_DOMAIN=*`

**Fix:**
- Add the variable, wait for redeploy

### Authentication errors

**Check:**
- Both secrets match exactly:
  - `HASURA_GRAPHQL_ADMIN_SECRET`
  - `NEXT_PUBLIC_HASURA_ADMIN_SECRET`

---

## 📚 Documentation Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `COMPLETE_RAILWAY_SETUP.md` | Full guide | First time setup |
| `DEPLOYMENT_CHECKLIST.md` | Checklist | Prefer checklist format |
| `ENVIRONMENT_VARIABLES_CHEATSHEET.md` | Env vars | During setup |
| `DEPLOY_NOW.md` | Quick reference | Quick lookup |
| `QUICK_START.md` | Fast track | Experienced users |
| `RAILWAY_DEPLOYMENT_GUIDE.md` | Comprehensive | Deep dive |
| `ARCHITECTURE_DIAGRAM.txt` | Visuals | Understanding flow |

---

## 🎉 After Deployment

Once deployed, your infrastructure will be:

```
User
 ↓
Frontend (Railway) → Hasura (Railway) → PostgreSQL (Railway)
                      ↓
                   Real Data (21 tables)
```

**Next steps:**
- Build remaining 70+ pages
- Deploy Metabase for analytics
- Set up automated backups
- Configure RBAC in Hasura
- Add monitoring/alerts

---

## 📞 Need Help?

1. **Check deployment logs** in Railway dashboard
2. **Verify database connection** with `railway connect postgresql`
3. **Test GraphQL directly** with curl command in guides
4. **Review troubleshooting** section in `COMPLETE_RAILWAY_SETUP.md`

---

## 📖 Quick Commands

**View main guide:**
```bash
cat COMPLETE_RAILWAY_SETUP.md
```

**View checklist:**
```bash
cat DEPLOYMENT_CHECKLIST.md
```

**View environment variables:**
```bash
cat ENVIRONMENT_VARIABLES_CHEATSHEET.md
```

**Connect to PostgreSQL:**
```bash
railway connect postgresql
```

**Test Hasura API:**
```bash
curl -X POST https://[your-domain]/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product(limit: 5) { id name sku } }"}'
```

**Automated verification:**
```bash
node /tmp/check_railway_data.js
```

---

## 🎯 Start Now!

1. Open Railway: **https://railway.app/**
2. Read guide: `COMPLETE_RAILWAY_SETUP.md`
3. Follow 8 steps
4. Enjoy real data on your frontend!

---

**Good luck! 🚀**

*Your frontend at https://frontend-production-c9100.up.railway.app/ is waiting for its backend!*
