# Environment Variables Cheat Sheet

**Quick Reference:** Copy-paste these exact values into Railway

---

## 🎯 Hasura Service Variables

Add these 6 variables to your **Hasura service**:

### Variable 1
```
Name:  HASURA_GRAPHQL_DATABASE_URL
Value: ${{Postgres.DATABASE_URL}}
```
**Note:** If your PostgreSQL service has a different name, replace `Postgres` with that name

### Variable 2
```
Name:  HASURA_GRAPHQL_ADMIN_SECRET
Value: kiaan_hasura_admin_secret_2024
```

### Variable 3
```
Name:  HASURA_GRAPHQL_ENABLE_CONSOLE
Value: true
```

### Variable 4
```
Name:  HASURA_GRAPHQL_ENABLED_APIS
Value: metadata,graphql,config
```

### Variable 5
```
Name:  HASURA_GRAPHQL_DEV_MODE
Value: true
```

### Variable 6
```
Name:  HASURA_GRAPHQL_CORS_DOMAIN
Value: *
```

---

## 🎯 Frontend Service Variables

Add these 2 variables to your **Frontend service**:

### Variable 1
```
Name:  NEXT_PUBLIC_GRAPHQL_URL
Value: https://[YOUR-HASURA-DOMAIN]/v1/graphql
```
**IMPORTANT:** Replace `[YOUR-HASURA-DOMAIN]` with your actual Hasura domain from Railway.

**Example:**
```
https://kiaan-wms-hasura.up.railway.app/v1/graphql
```

### Variable 2
```
Name:  NEXT_PUBLIC_HASURA_ADMIN_SECRET
Value: kiaan_hasura_admin_secret_2024
```

---

## ✅ Visual Checklist

### Hasura Service:
- [ ] `HASURA_GRAPHQL_DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- [ ] `HASURA_GRAPHQL_ADMIN_SECRET` = `kiaan_hasura_admin_secret_2024`
- [ ] `HASURA_GRAPHQL_ENABLE_CONSOLE` = `true`
- [ ] `HASURA_GRAPHQL_ENABLED_APIS` = `metadata,graphql,config`
- [ ] `HASURA_GRAPHQL_DEV_MODE` = `true`
- [ ] `HASURA_GRAPHQL_CORS_DOMAIN` = `*`

### Frontend Service:
- [ ] `NEXT_PUBLIC_GRAPHQL_URL` = `https://[hasura-domain]/v1/graphql`
- [ ] `NEXT_PUBLIC_HASURA_ADMIN_SECRET` = `kiaan_hasura_admin_secret_2024`

---

## 🔍 Common Mistakes to Avoid

### ❌ Wrong:
```
HASURA_GRAPHQL_DATABASE_URL = localhost:5432
```
✅ **Correct:**
```
HASURA_GRAPHQL_DATABASE_URL = ${{Postgres.DATABASE_URL}}
```
The `${{...}}` syntax tells Railway to use the PostgreSQL service's URL.

---

### ❌ Wrong:
```
NEXT_PUBLIC_GRAPHQL_URL = localhost:8090/v1/graphql
```
✅ **Correct:**
```
NEXT_PUBLIC_GRAPHQL_URL = https://kiaan-wms-hasura.up.railway.app/v1/graphql
```
Use the PUBLIC Railway domain, not localhost!

---

### ❌ Wrong:
```
HASURA_GRAPHQL_ADMIN_SECRET = different_secret
NEXT_PUBLIC_HASURA_ADMIN_SECRET = another_secret
```
✅ **Correct:**
```
HASURA_GRAPHQL_ADMIN_SECRET = kiaan_hasura_admin_secret_2024
NEXT_PUBLIC_HASURA_ADMIN_SECRET = kiaan_hasura_admin_secret_2024
```
Both must be EXACTLY the same!

---

## 📝 How to Add Variables in Railway

1. Click on your service (Hasura or Frontend)
2. Click **"Variables"** tab at the top
3. Click **"+ New Variable"** button
4. Enter the **Name** (left field)
5. Enter the **Value** (right field)
6. Railway saves automatically
7. Repeat for all variables

---

## 🔄 After Adding Variables

Both services will auto-redeploy:
- Hasura: Takes 1-2 minutes
- Frontend: Takes 2-3 minutes

Wait for both to show **"Active"** status before testing.

---

**Pro Tip:** Copy this file to keep as reference during setup!
