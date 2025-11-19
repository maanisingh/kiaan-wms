# Kiaan WMS - Quick Start Guide

## 🚀 What's Been Done

I've successfully implemented the **backend foundation** for all your requested features:

### ✅ Completed Backend Features

1. **PostgreSQL Database** with Prisma ORM
   - 20+ database models
   - Food industry-specific schema

2. **Brands Instead of Categories**
   - Database uses "Brand" model
   - API endpoints: `/api/brands`
   - 10 food brands seeded (Nakd, Graze, KIND, etc.)

3. **Bundle Support**
   - Products can be SIMPLE, VARIANT, or BUNDLE
   - Bundle composition tracked (e.g., 12-pack = 12x single items)
   - 16 bundles created (12-packs of various products)

4. **Best-Before Date Tracking**
   - Every inventory item has `bestBeforeDate`
   - Multiple lots with different BB dates per product
   - 48 inventory items seeded with 3 different BB dates each

5. **Wholesale Order Flagging**
   - Orders have `isWholesale` flag
   - Orders linked to sales channel (Shopify-B2B, Shopify-Retail, etc.)
   - API endpoint to toggle wholesale: `PATCH /api/sales-orders/:id/wholesale`
   - Auto-flagging ready (just needs frontend implementation)

6. **Replenishment System**
   - `ReplenishmentConfig` model with min/max/reorder points
   - `ReplenishmentTask` model for task assignment
   - API endpoints ready: `/api/replenishment/tasks` and `/api/replenishment/config`

7. **FBA Two-Stage Transfers**
   - Warehouse types: MAIN, PREP
   - Transfer types: WAREHOUSE, FBA_PREP, FBA_SHIPMENT
   - 2 warehouses created: Main + FBA Prep
   - API endpoint: `/api/transfers`

8. **Revenue Planner / Analytics**
   - `SalesChannel` model with fee structures
   - `ChannelPrice` model with cost breakdowns
   - 5 channels seeded: Amazon FBA, Shopify Retail, Shopify B2B, eBay, Wholesale
   - API endpoints: `/api/channels`, `/api/analytics/channel-prices`

## 📦 Seeded Data

Your database is pre-loaded with:
- ✅ 10 food brands
- ✅ 16 single products (various flavors per brand)
- ✅ 16 bundles (12-packs)
- ✅ 48 inventory items (with 3 different best-before dates each)
- ✅ 30 sales orders (mix of B2C and B2B wholesale)
- ✅ 25 customers (20 B2C + 5 B2B)
- ✅ 5 sales channels with fee structures
- ✅ 2 warehouses (Main + Prep)

## 🔑 Login

**URL:** http://localhost:8010 (backend API)
**Email:** admin@kiaan.com
**Password:** admin123

## 🛠️ Start the Backend

```bash
cd /root/kiaan-wms/backend
node server.js
```

Server runs on **port 8010** (changed from 8000 to avoid conflicts)

## 📋 What's Left (Frontend Work)

The backend is 100% ready. Now you need to update the **frontend** to:

### High Priority (Core Features)

1. **Update API URL**
   - Change frontend to point to port 8010 instead of 8000

2. **Rename "Categories" to "Brands"**
   - Update menu in `MainLayout.tsx`
   - Rename `/products/categories` → `/products/brands`
   - Update all UI text

3. **Bundle Management Page**
   - Create `/app/products/bundles/page.tsx`
   - Allow creating/editing bundles
   - Show bundle composition (which products, how many)

4. **Wholesale Order Toggle**
   - Add "Wholesale" badge to orders
   - Add toggle button to flag orders as wholesale
   - Show icon for wholesale orders in list view

5. **Best-Before Dates in Inventory**
   - Show BB date column in inventory table
   - Color-code expiring products (red <30 days, yellow <60 days)
   - Show BB dates in product details page

6. **Replenishment Menu**
   - Add "Replenishment" to main menu
   - Create `/app/replenishment/tasks/page.tsx`
   - Create `/app/replenishment/settings/page.tsx`

### Medium Priority

7. **FBA Shipment Builder**
   - Create `/app/fba-transfers/shipment-builder/page.tsx`
   - UI to create FBA bundles and pack into boxes

8. **Analytics Menu**
   - Add "Analytics & Revenue Planner" to main menu
   - Create channel-specific pages
   - Show pricing and margin calculations

## 🎯 Smart Picking Logic (For Later)

When implementing picking for wholesale orders:

**Current behavior:** Mix different best-before dates
```
12x Nakd Bars → Pick 5 from BB 05/03/2026 + 7 from BB 06/08/2026
```

**New behavior for wholesale:** Enforce single BB date
```
12x Nakd Bars → Pick all 12 from BB 06/08/2026
```

The database supports this via:
- `PickList.enforceSingleBBDate` flag
- `PickItem.selectedBBDate` field

## 📊 API Endpoints Reference

All endpoints require JWT authentication (except login).

### Authentication
```
POST /api/auth/login
Body: {"email": "admin@kiaan.com", "password": "admin123"}
Returns: {"user": {...}, "token": "..."}

GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Brands (formerly Categories)
```
GET /api/brands
GET /api/categories (legacy, same as brands)
POST /api/brands
```

### Products
```
GET /api/products
GET /api/products?type=BUNDLE (filter for bundles only)
GET /api/products/:id (includes bundle items, inventory with BB dates)
POST /api/products (create product, can include bundleItems)
PUT /api/products/:id (update product and bundle composition)
```

### Inventory
```
GET /api/inventory
GET /api/inventory?productId=xxx
Returns inventory sorted by best-before date (FIFO)
```

### Orders
```
GET /api/sales-orders
GET /api/sales-orders?isWholesale=true (wholesale only)
GET /api/sales-orders?salesChannel=Shopify-B2B
POST /api/sales-orders
PATCH /api/sales-orders/:id/wholesale
Body: {"isWholesale": true}
```

### Replenishment
```
GET /api/replenishment/tasks
GET /api/replenishment/tasks?status=PENDING
GET /api/replenishment/config
POST /api/replenishment/config
```

### FBA Transfers
```
GET /api/transfers
GET /api/transfers?type=FBA_PREP
GET /api/transfers?type=FBA_SHIPMENT
POST /api/transfers
```

### Analytics
```
GET /api/channels (all sales channels)
GET /api/analytics/channel-prices
GET /api/analytics/channel-prices?channelId=xxx
GET /api/analytics/channel-prices?productId=xxx
POST /api/analytics/channel-prices
```

### Warehouses & Customers
```
GET /api/warehouses
GET /api/customers
GET /api/companies
```

## 🔍 Testing the API

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"admin123"}' | jq -r '.token')

# Get all brands
curl -H "Authorization: Bearer $TOKEN" http://localhost:8010/api/brands | jq .

# Get bundles only
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8010/api/products?type=BUNDLE" | jq .

# Get inventory with BB dates
curl -H "Authorization: Bearer $TOKEN" http://localhost:8010/api/inventory | jq .

# Get wholesale orders
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8010/api/sales-orders?isWholesale=true" | jq .

# Get replenishment tasks
curl -H "Authorization: Bearer $TOKEN" http://localhost:8010/api/replenishment/tasks | jq .

# Get sales channels
curl -H "Authorization: Bearer $TOKEN" http://localhost:8010/api/channels | jq .
```

## 📁 Important Files

### Backend
- Server: `/root/kiaan-wms/backend/server.js`
- Database schema: `/root/kiaan-wms/backend/prisma/schema.prisma`
- Seed data: `/root/kiaan-wms/backend/prisma/seed.js`
- Environment: `/root/kiaan-wms/backend/.env` (PORT=8010)

### Frontend (to update)
- Main layout: `/root/kiaan-wms/frontend/components/layout/MainLayout.tsx`
- Products: `/root/kiaan-wms/frontend/app/products/`
- Orders: `/root/kiaan-wms/frontend/app/sales-orders/`
- Inventory: `/root/kiaan-wms/frontend/app/inventory/`

## 🗄️ Database Access

**Using Prisma Studio (GUI):**
```bash
cd /root/kiaan-wms/backend
npx prisma studio
```
Opens on http://localhost:5555

**Using psql:**
```bash
PGPASSWORD=wms_secure_password_2024 psql -h localhost -p 5439 -U wms_user -d kiaan_wms
```

## 🐛 Troubleshooting

**Issue: Frontend can't connect to API**
- Check backend is running on port 8010
- Update frontend .env to use port 8010

**Issue: Database connection error**
- Check PostgreSQL container is running: `docker ps | grep postgres`
- Verify DATABASE_URL in `/root/kiaan-wms/backend/.env`

**Issue: "Can't see bundles in products"**
- Backend is ready, just need to update frontend UI
- Products with type "BUNDLE" exist in database
- Use API endpoint: `GET /api/products?type=BUNDLE`

## 🎨 Example: How to Show Bundles

In your products page, add a filter:

```typescript
// Fetch products
const products = await fetch('http://localhost:8010/api/products', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Filter bundles
const bundles = products.filter(p => p.type === 'BUNDLE');

// Show bundle composition
bundle.bundleItems.forEach(item => {
  console.log(`${item.quantity}x ${item.child.name}`);
});
```

## 📈 Next Development Session

When you continue, focus on:

1. Update frontend API URL (5 min)
2. Rename Categories → Brands (30 min)
3. Create bundle list view (2 hours)
4. Add wholesale toggle to orders (1 hour)
5. Show BB dates in inventory (1 hour)

Total: ~5 hours of frontend work to get core features visible

---

**Everything is ready on the backend!**
Just wire up the frontend and you'll have all your requested features working.
