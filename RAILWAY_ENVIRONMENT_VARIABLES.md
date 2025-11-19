# Railway Environment Variables Configuration

## Backend Service Environment Variables

Set these in Railway → Backend Service → Variables tab:

### Required Variables

```bash
# Database Connection (Auto-provided by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Railway automatically provides PORT - DO NOT SET THIS
# The PORT variable is automatically assigned by Railway to avoid conflicts
# Backend code uses: process.env.PORT || 8010

# JWT Secret (IMPORTANT: Use a strong secret in production)
JWT_SECRET=kiaan_wms_production_jwt_secret_key_minimum_32_characters_required_2024

# Node Environment
NODE_ENV=production
```

### Optional Variables (with defaults)

```bash
# CORS Origins (if you need to restrict)
# By default, backend allows all origins in development
ALLOWED_ORIGINS=https://frontend-production-c9100.up.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Level
LOG_LEVEL=info
```

---

## Frontend Service Environment Variables

Set these in Railway → Frontend Service → Variables tab:

### Required Variables

```bash
# Backend API URL (CRITICAL - Frontend won't work without this)
NEXT_PUBLIC_API_URL=https://serene-adaptation-production-11be.up.railway.app

# Railway automatically provides PORT - DO NOT SET THIS
# Next.js will use Railway's assigned port automatically
```

### Optional Variables

```bash
# Next.js Configuration
NEXT_TELEMETRY_DISABLED=1

# Node Environment
NODE_ENV=production
```

---

## Port Configuration - How Railway Handles This

### ✅ Railway Automatically Assigns Ports

**DO NOT** set the `PORT` environment variable manually in Railway.

**How it works:**
1. Railway automatically assigns a unique port to each service
2. Railway sets the `PORT` environment variable automatically
3. Your code reads `process.env.PORT`
4. No port conflicts possible - each service gets its own port

### Backend Port Handling

**In `backend/server.js`:**
```javascript
const PORT = process.env.PORT || 8010;
app.listen(PORT, () => {
  console.log(`🚀 WMS API Server running on port ${PORT}`);
});
```

**How it works:**
- **Locally:** Uses port 8010 (from `|| 8010` fallback)
- **On Railway:** Uses Railway's assigned port (from `process.env.PORT`)
- **No conflicts:** Railway ensures each service has unique port

### Frontend Port Handling

**Next.js automatically:**
- Reads `process.env.PORT` from Railway
- Listens on Railway's assigned port
- No configuration needed

---

## Pre-Deploy Command Configuration

The backend uses a **pre-deploy command** to seed the database before starting.

**Configured in `backend/railway.json`:**
```json
{
  "deploy": {
    "startCommand": "node server.js",
    "preDeployCommand": "npx prisma db push --accept-data-loss && node prisma/seed.js"
  }
}
```

**What happens on each deployment:**

1. **Pre-Deploy Phase:**
   - `npx prisma db push` - Creates/updates database tables
   - `node prisma/seed.js` - Seeds database with food data (10 brands, 16 bundles, 48 inventory items)

2. **Deploy Phase:**
   - `node server.js` - Starts the API server

**Important Notes:**
- Pre-deploy runs BEFORE the server starts
- If pre-deploy fails, deployment is aborted
- Seed script is idempotent (safe to run multiple times)
- `--accept-data-loss` flag needed for schema changes

---

## Complete Setup Checklist

### Backend Service

- [x] **Service Created:** From GitHub repo `maanisingh/kiaan-wms`
- [x] **Root Directory:** Set to `backend`
- [x] **PostgreSQL:** Database service created and linked
- [x] **railway.json:** Contains preDeployCommand for seeding
- [ ] **Environment Variables:**
  - [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - [ ] `JWT_SECRET=<your-secret-key>`
  - [ ] `NODE_ENV=production`
- [ ] **Domain Generated:** Backend has public URL
- [ ] **Deployment:** Successful (check logs for "Seeding database...")

### Frontend Service

- [x] **Service Created:** From GitHub repo `maanisingh/kiaan-wms`
- [x] **Root Directory:** Set to `frontend`
- [x] **Environment Variables:**
  - [x] `NEXT_PUBLIC_API_URL=https://serene-adaptation-production-11be.up.railway.app` ✅ (You confirmed this is done)
  - [ ] `NODE_ENV=production` (optional)
- [ ] **Deployment:** Successful

---

## Verification Commands

### Test Backend is Running

```bash
curl https://serene-adaptation-production-11be.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "WMS API is running",
  "database": "PostgreSQL + Prisma"
}
```

### Test Backend Has Data (After Seeding)

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST https://serene-adaptation-production-11be.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"admin123"}' | jq -r '.token')

# 2. Test brands endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://serene-adaptation-production-11be.up.railway.app/api/brands | jq '.'
```

**Expected:** Array of 10 food brands

### Test Frontend Connection

1. Open browser DevTools (F12)
2. Go to: https://frontend-production-c9100.up.railway.app
3. Check Console tab
4. Look for API calls - should call `https://serene-adaptation-production-11be.up.railway.app/api/...`
5. NOT `http://localhost:8010/api/...`

---

## Troubleshooting

### Port Conflicts

**Symptom:** "Port already in use" error

**Solution:**
- Railway handles ports automatically
- Make sure you're NOT setting PORT variable manually
- Each service gets its own unique port from Railway

### Pre-Deploy Fails

**Symptom:** Deployment fails before server starts

**Check logs for:**
- Prisma migration errors
- Database connection errors
- Seed script errors

**Common fixes:**
- Ensure DATABASE_URL is set correctly
- Check PostgreSQL service is running
- Verify Prisma schema is valid

### Frontend Can't Connect to Backend

**Symptom:** "No data" or API errors in browser console

**Check:**
1. Is `NEXT_PUBLIC_API_URL` set in frontend variables?
2. Does it match backend URL exactly?
3. No trailing slash in URL
4. Frontend redeployed after setting variable?

### Database Empty After Deployment

**Symptom:** Login fails with "Invalid credentials"

**This means:** Seed script didn't run or failed

**Fix:**
1. Check deployment logs for "Seeding database..."
2. If missing, verify `preDeployCommand` in railway.json
3. Manually trigger redeploy

---

## Summary

### Key Points:

1. **Ports are automatic** - Railway assigns them, no conflicts possible
2. **Pre-deploy seeds database** - Runs before server starts
3. **Environment variables are critical** - Especially NEXT_PUBLIC_API_URL
4. **Database connection is automatic** - Use `${{Postgres.DATABASE_URL}}`

### After Proper Configuration:

✅ Backend serves on Railway's assigned port (no conflicts)
✅ Frontend connects to backend via NEXT_PUBLIC_API_URL
✅ Database seeded with food data on each deploy
✅ All 9 client features working with real data

**Time to configure:** ~5 minutes
**Result:** Production-ready deployment with zero port conflicts
