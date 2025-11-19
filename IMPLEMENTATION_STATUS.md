# Kiaan WMS - Food Distribution Enhancement Implementation Status

## Project Overview
This document tracks the implementation of enhanced features for the Kiaan WMS platform, specifically tailored for food distribution business requirements.

**Date Started:** November 19, 2025
**Current Status:** Phase 1 Complete (Backend), Frontend Updates In Progress

---

## ✅ Phase 1: Database & Backend Foundation (COMPLETED)

### 1.1 PostgreSQL Database with Prisma ORM ✅
- **Database Created:** `kiaan_wms` on PostgreSQL (port 5439)
- **User:** `wms_user`
- **ORM:** Prisma 5.7.1
- **Schema File:** `/root/kiaan-wms/backend/prisma/schema.prisma`

### 1.2 Comprehensive Database Schema ✅
Created 20+ models including:

#### Core Entities
- ✅ User, Company, Warehouse (with MAIN/PREP types)
- ✅ Zone, Location

#### Product Management (Food-Specific)
- ✅ **Brand** model (formerly Categories)
- ✅ **Product** model with:
  - Product types: SIMPLE, VARIANT, BUNDLE
  - Food-specific fields: `isPerishable`, `requiresBatch`, `shelfLifeDays`
  - Dimensions and pricing
- ✅ **BundleItem** model for bundle composition (parent-child relationships)

#### Inventory with Best-Before Dates
- ✅ **Inventory** model with:
  - `bestBeforeDate` field for food expiry tracking
  - `lotNumber`, `batchNumber` for lot tracking
  - Available/Reserved quantity tracking
  - Status: AVAILABLE, RESERVED, QUARANTINE, DAMAGED, EXPIRED

#### Sales Orders with Wholesale Support
- ✅ **Customer** model with `customerType`: B2C / B2B
- ✅ **SalesOrder** model with:
  - `isWholesale` flag (critical feature)
  - `salesChannel` field (e.g., "Shopify-B2B", "Shopify-Retail")
  - `externalOrderId` for platform integration
- ✅ **SalesOrderItem** for order line items

#### Smart Picking System
- ✅ **PickList** model with:
  - `enforceSingleBBDate` flag for wholesale bundles
  - Pick list types: SINGLE, BATCH, WAVE, ZONE
- ✅ **PickItem** model with:
  - `selectedBBDate` field for enforced BB date
  - `lotNumber` tracking

#### Replenishment System
- ✅ **ReplenishmentConfig** model:
  - `minStockLevel`, `maxStockLevel`, `reorderPoint`
  - `autoCreateTasks` flag
- ✅ **ReplenishmentTask** model:
  - Task assignment and tracking
  - Priority levels

#### FBA Transfers
- ✅ **Transfer** model with types:
  - WAREHOUSE (standard)
  - FBA_PREP (Main → Prep)
  - FBA_SHIPMENT (Prep → Amazon)
- ✅ **TransferItem** with:
  - `isFBABundle` flag
  - `fbaSku` for Amazon-specific SKUs

#### Revenue Planner & Analytics
- ✅ **SalesChannel** model:
  - Channel types: AMAZON_FBA, SHOPIFY, EBAY, WHOLESALE
  - Fee structure: `referralFeePercent`, `fixedFee`, `fulfillmentFeePerUnit`
- ✅ **ChannelPrice** model:
  - Per-product, per-channel pricing
  - Cost breakdown: `productCost`, `laborCost`, `materialCost`, `shippingCost`
  - Calculated margins: `grossProfit`, `profitMargin`

### 1.3 Database Seeding ✅
**Seed Script:** `/root/kiaan-wms/backend/prisma/seed.js`

**Seeded Data:**
- ✅ 1 Company: Kiaan Food Distribution Ltd
- ✅ 3 Users:
  - admin@kiaan.com (ADMIN)
  - picker1@kiaan.com (PICKER)
  - picker2@kiaan.com (PICKER)
  - Password for all: `admin123`
- ✅ 2 Warehouses:
  - Main Distribution Center (type: MAIN)
  - FBA Prep Warehouse (type: PREP)
- ✅ 2 Zones, 20 Locations
- ✅ 10 Food Brands:
  - Nakd, Graze, KIND, Nature Valley, Clif Bar, RXBAR, LÄRABAR, Quest, GoMacro, Booja-Booja
- ✅ 16 Single Products (with flavors)
- ✅ 16 Bundle Products (12-packs)
- ✅ 48 Inventory Items with 3 different best-before dates per product
- ✅ 5 Sales Channels:
  - Amazon FBA UK
  - Shopify Retail
  - Shopify B2B
  - eBay UK
  - Direct Wholesale
- ✅ 25 Customers (20 B2C + 5 B2B)
- ✅ 30 Sales Orders (mix of B2C and B2B wholesale)
- ✅ 10 Replenishment Configs
- ✅ 50 Channel Price entries

### 1.4 Backend API with Prisma ✅
**New Server:** `/root/kiaan-wms/backend/server.js` (old backed up to `server-old.js`)

**API Endpoints Implemented:**

#### Authentication
- `POST /api/auth/login` - User login with JWT
- `GET /api/auth/me` - Get current user

#### Brands (formerly Categories)
- `GET /api/brands` - List all brands with product counts
- `POST /api/brands` - Create new brand
- `GET /api/categories` - Legacy endpoint (redirects to brands)

#### Products with Bundles
- `GET /api/products` - List products (filter by type, brandId, status)
- `GET /api/products/:id` - Get product details including:
  - Bundle composition (bundleItems)
  - Inventory with BB dates
  - Replenishment config
  - Channel prices
- `POST /api/products` - Create product (simple or bundle)
- `PUT /api/products/:id` - Update product and bundle items

#### Inventory with Best-Before Dates
- `GET /api/inventory` - List inventory (filter by warehouse, product, status)
  - Returns inventory sorted by BB date (FIFO)
  - Includes lot numbers and locations

#### Sales Orders with Wholesale Support
- `GET /api/sales-orders` - List orders (filter by status, isWholesale, salesChannel)
- `POST /api/sales-orders` - Create new order
- `PATCH /api/sales-orders/:id/wholesale` - Toggle wholesale flag

#### Warehouses
- `GET /api/warehouses` - List warehouses (includes type: MAIN/PREP)

#### Customers
- `GET /api/customers` - List customers with type (B2C/B2B)

#### Replenishment
- `GET /api/replenishment/tasks` - List replenishment tasks
- `GET /api/replenishment/config` - List replenishment configurations
- `POST /api/replenishment/config` - Create replenishment config

#### FBA Transfers
- `GET /api/transfers` - List transfers (filter by type, status)
- `POST /api/transfers` - Create transfer (warehouse/FBA_PREP/FBA_SHIPMENT)

#### Analytics & Revenue Planner
- `GET /api/channels` - List sales channels with fee structures
- `GET /api/analytics/channel-prices` - Get channel-specific pricing
- `POST /api/analytics/channel-prices` - Create channel price

#### System
- `GET /health` - Health check

**Server Configuration:**
- Port: 8010 (changed from 8000 to avoid conflict with Plane)
- Database: PostgreSQL via Prisma
- JWT Authentication
- CORS enabled for frontend

---

## 🔄 Phase 2: Bundle & Wholesale Features (IN PROGRESS)

### 2.1 Bundle Management UI ⏳
**Status:** Pending
**Location:** Will create `/root/kiaan-wms/frontend/app/products/bundles/page.tsx`

**Features to Implement:**
- [ ] Bundle creation wizard
  - Select parent product
  - Add child products with quantities
  - Set bundle pricing
- [ ] Bundle list view
- [ ] Edit bundle composition
- [ ] Visual bundle composition tree
- [ ] Bundle inventory calculation (based on child items)

### 2.2 Wholesale Order Flagging ⏳
**Status:** Pending
**Files to Update:**
- `/root/kiaan-wms/frontend/app/sales-orders/page.tsx`

**Features to Implement:**
- [ ] "Wholesale" badge on order cards
- [ ] Toggle switch to manually flag order as wholesale
- [ ] Auto-flag orders from "Shopify-B2B" channel
- [ ] Filter orders by wholesale status
- [ ] Bulk wholesale flag operation

### 2.3 Smart Picking for Wholesale Bundles ⏳
**Status:** Backend schema ready, UI pending

**Features to Implement:**
- [ ] Detect wholesale orders with bundles
- [ ] Enforce single best-before date selection
- [ ] Show available BB dates with quantities
- [ ] Prevent mixing BB dates for wholesale bundle picks
- [ ] Generate pick list with enforced BB date

**Example Logic:**
```
Order: 12x Nakd Cashew Cookie (Wholesale Bundle)
Available Inventory:
  - LOT-ABC123: BB 05/03/2026 (5 units)
  - LOT-XYZ789: BB 06/08/2026 (20 units)

Current System: Picks 5 from LOT-ABC123 + 7 from LOT-XYZ789
New System: Picks all 12 from LOT-XYZ789 (single BB date)
```

### 2.4 BB Date Display in Inventory ⏳
**Status:** Pending
**Files to Update:**
- `/root/kiaan-wms/frontend/app/inventory/page.tsx`
- `/root/kiaan-wms/frontend/app/products/[id]/page.tsx` (product details)

**Features to Implement:**
- [ ] BB date column in inventory table
- [ ] Color coding for expiry proximity (red <30 days, yellow <60 days)
- [ ] Group inventory by product → location → BB date
- [ ] BB date filter and search
- [ ] Expiry alert indicators

---

## 📦 Phase 3: Replenishment System (PENDING)

### 3.1 Replenishment Menu ⏳
**Status:** Backend ready, menu structure pending
**Files to Update:**
- `/root/kiaan-wms/frontend/components/layout/MainLayout.tsx`

**Menu Structure to Add:**
```
Replenishment
├─ Tasks (/replenishment/tasks)
└─ Settings (/replenishment/settings)
```

### 3.2 Replenishment Tasks Page ⏳
**File to Create:** `/root/kiaan-wms/frontend/app/replenishment/tasks/page.tsx`

**Features:**
- [ ] Task list with filters (pending, in progress, completed)
- [ ] Product name, current stock, target stock
- [ ] Assign tasks to warehouse staff
- [ ] Mark tasks as complete
- [ ] Priority indicators
- [ ] Auto-generated tasks when stock < reorder point

### 3.3 Replenishment Settings ⏳
**File to Create:** `/root/kiaan-wms/frontend/app/replenishment/settings/page.tsx`

**Features:**
- [ ] Product list with replen config
- [ ] Set min/max stock levels
- [ ] Set reorder point and quantity
- [ ] Toggle auto-create tasks
- [ ] Bulk update replen settings
- [ ] Import/export replen configs

### 3.4 Automated Alerts ⏳
**Features:**
- [ ] Real-time stock level monitoring
- [ ] Notification when product < reorder point
- [ ] Dashboard alert widget
- [ ] Email alerts (future)
- [ ] Task auto-creation

---

## 🚛 Phase 4: FBA Transfers & Shipment Builder (PENDING)

### 4.1 Two-Stage Transfer Workflow ⏳
**Status:** Database schema ready, UI pending

**Workflow:**
```
Stage 1: Main Warehouse → FBA Prep Warehouse
Stage 2: FBA Prep Warehouse → Amazon FBA Center
```

**Files to Update/Create:**
- `/root/kiaan-wms/frontend/app/fba-transfers/page.tsx` (update existing)
- `/root/kiaan-wms/frontend/app/transfers/page.tsx` (update existing)

**Features:**
- [ ] Select transfer type (Warehouse / FBA Prep / FBA Shipment)
- [ ] Two-step wizard for FBA prep
- [ ] Track prep warehouse inventory separately
- [ ] Prep checklist (labeling, poly bags, etc.)

### 4.2 FBA Shipment Builder ⏳
**File to Create:** `/root/kiaan-wms/frontend/app/fba-transfers/shipment-builder/page.tsx`

**Features:**
- [ ] Create FBA-specific bundle SKUs (e.g., 12-pack with FNSKU)
- [ ] Pack products into outer cases/boxes
- [ ] Box content planner:
  - Add products to boxes
  - Track box weight and dimensions
  - Generate box labels
- [ ] Shipment plan overview
- [ ] Export to Amazon Seller Central format
- [ ] Print FBA labels (box labels, product labels)

**Example UI:**
```
Shipment Builder for FBA-NYC-12345

Box 1 (40x30x20cm, 5.2kg)
├─ Nakd Cashew Cookie 12-pack x 3
├─ Graze Vanilla Bliss 12-pack x 2
└─ Generate Box Label

Box 2 (40x30x20cm, 4.8kg)
├─ KIND Dark Chocolate 12-pack x 4
└─ Generate Box Label

Total: 2 boxes, 10.0kg
```

### 4.3 Box Content Planning ⏳
**Features:**
- [ ] Drag-and-drop products into boxes
- [ ] Auto-calculate box weight
- [ ] Weight/dimension validation
- [ ] Box template library (standard FBA box sizes)
- [ ] Print all box labels
- [ ] Packing slip generation

---

## 💰 Phase 5: Revenue Planner & Analytics (PENDING)

### 5.1 Analytics Menu Structure ⏳
**File to Update:** `/root/kiaan-wms/frontend/components/layout/MainLayout.tsx`

**Menu Structure:**
```
Analytics & Revenue Planner
├─ Amazon FBA (/analytics/amazon-fba)
├─ Shopify (/analytics/shopify)
├─ eBay (/analytics/ebay)
├─ Wholesale (/analytics/wholesale)
└─ Price Optimizer (/analytics/price-optimizer)
```

### 5.2 Cost Calculation Engine ⏳
**Backend:** ✅ Already implemented in `ChannelPrice` model

**Frontend Files to Create:**
- `/root/kiaan-wms/frontend/app/analytics/[channel]/page.tsx`

**Features:**
- [ ] Product pricing calculator
- [ ] Cost breakdown display:
  - Product cost
  - Labor cost (picking + packing)
  - Materials cost (packaging)
  - Marketplace fees
  - Shipping cost
- [ ] Gross profit calculation
- [ ] Profit margin percentage
- [ ] Break-even analysis
- [ ] Recommended selling price

### 5.3 Channel Fee Configurations ⏳
**File to Create:** `/root/kiaan-wms/frontend/app/settings/channels/page.tsx`

**Features:**
- [ ] List all sales channels
- [ ] Edit channel fee structure:
  - Referral fee percentage
  - Fixed fees
  - Fulfillment fees
  - Storage fees
- [ ] Add custom marketplace
- [ ] Channel activation toggle
- [ ] Fee calculator preview

### 5.4 Price Optimization Reports ⏳
**File to Create:** `/root/kiaan-wms/frontend/app/analytics/price-optimizer/page.tsx`

**Features:**
- [ ] Product profitability ranking
- [ ] Channel comparison matrix (which channel is most profitable per product)
- [ ] Suggested price adjustments
- [ ] Competitor pricing comparison (manual input)
- [ ] Export price list for each channel
- [ ] Bulk price update

**Example Report:**
```
Product: Nakd Cashew Cookie 12-pack

Channel          Sell Price  Total Cost  Profit  Margin  Recommendation
-----------------------------------------------------------------------------
Amazon FBA       £15.00      £11.25      £3.75   25.0%   ✅ Optimal
Shopify Retail   £14.50      £10.85      £3.65   25.2%   ✅ Optimal
Shopify B2B      £12.00      £10.50      £1.50   12.5%   ⚠️ Increase to £13.50
eBay             £14.00      £11.50      £2.50   17.9%   ✅ Good
Direct Wholesale £10.50      £9.75       £0.75   7.1%    ❌ Below 10% target
```

---

## 🎨 Phase 6: Frontend Updates (CURRENT FOCUS)

### 6.1 Rename "Categories" to "Brands" ⏳
**Files to Update:**

#### Navigation Menu
- [ ] `/root/kiaan-wms/frontend/components/layout/MainLayout.tsx`
  - Change "Categories" to "Brands" in menu
  - Update route from `/products/categories` to `/products/brands`

#### Pages
- [ ] `/root/kiaan-wms/frontend/app/products/categories/page.tsx`
  - Rename folder to `/products/brands/`
  - Update page title and breadcrumbs
  - Update all text references

#### Components
- [ ] Search/filter dropdowns showing "Category" → "Brand"
- [ ] Product form fields
- [ ] Table headers

#### API Calls
- [ ] Update frontend to call `/api/brands` instead of `/api/categories`
- [ ] Update API base URL to `http://localhost:8010`

### 6.2 Update Frontend API Configuration ⏳
**File to Update:** `/root/kiaan-wms/frontend/.env.local` (or .env.production)

**Change:**
```env
# OLD
NEXT_PUBLIC_API_URL=http://localhost:8000

# NEW
NEXT_PUBLIC_API_URL=http://localhost:8010
```

**Also update CORS in backend if needed.**

---

## 🚀 Deployment

### Backend Deployment to Railway ⏳
**Status:** Pending

**Steps:**
1. [ ] Update Railway environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `PORT` - 8010
   - `JWT_SECRET`
2. [ ] Deploy new Prisma-based backend
3. [ ] Run migrations: `npx prisma db push`
4. [ ] Run seed script: `node prisma/seed.js`
5. [ ] Test deployed API endpoints
6. [ ] Update frontend `NEXT_PUBLIC_API_URL` to Railway backend URL

### Frontend Deployment ⏳
**Status:** Pending

**Steps:**
1. [ ] Update frontend to use production API URL
2. [ ] Build: `npm run build`
3. [ ] Deploy to Railway/Vercel
4. [ ] Test production deployment

---

## 📊 Key Features Summary

### ✅ Completed (Backend)
- PostgreSQL database with comprehensive schema
- Prisma ORM integration
- Brand-based product organization (food industry focus)
- Bundle product support with composition tracking
- Inventory with best-before date tracking (critical for food)
- Wholesale order flagging (B2B vs B2C)
- Multi-warehouse support (Main + Prep)
- Replenishment configuration and task system
- FBA transfer types (Prep + Shipment)
- Sales channel management with fee structures
- Channel-specific pricing and margin calculations
- Full REST API with JWT authentication
- Comprehensive seed data (10 brands, 32 products, 48 inventory items)

### ⏳ In Progress
- Frontend API configuration update
- Categories → Brands UI rename

### 📋 Pending (High Priority)
1. Bundle Management UI
2. Wholesale order flagging toggle
3. Smart picking with single BB date enforcement
4. BB date display in inventory views
5. Replenishment menu and task pages
6. FBA Shipment Builder
7. Revenue planner analytics pages

---

## 🔑 Login Credentials

**Email:** admin@kiaan.com
**Password:** admin123

**Additional Users:**
- picker1@kiaan.com / admin123
- picker2@kiaan.com / admin123

---

## 📁 Key File Locations

### Backend
- **Main Server:** `/root/kiaan-wms/backend/server.js`
- **Prisma Schema:** `/root/kiaan-wms/backend/prisma/schema.prisma`
- **Seed Script:** `/root/kiaan-wms/backend/prisma/seed.js`
- **Prisma Client:** `/root/kiaan-wms/backend/lib/prisma.js`
- **Old Server (backup):** `/root/kiaan-wms/backend/server-old.js`
- **Environment:** `/root/kiaan-wms/backend/.env`

### Frontend
- **Main Layout:** `/root/kiaan-wms/frontend/components/layout/MainLayout.tsx`
- **Products Page:** `/root/kiaan-wms/frontend/app/products/page.tsx`
- **Inventory Page:** `/root/kiaan-wms/frontend/app/inventory/page.tsx`
- **Orders Page:** `/root/kiaan-wms/frontend/app/sales-orders/page.tsx`
- **FBA Transfers:** `/root/kiaan-wms/frontend/app/fba-transfers/page.tsx`
- **Type Definitions:** `/root/kiaan-wms/frontend/types/index.ts`

### Database
- **Host:** localhost:5439
- **Database:** kiaan_wms
- **User:** wms_user
- **Password:** wms_secure_password_2024

---

## 🎯 Next Steps (Recommended Order)

1. **Update Frontend API URL** (port 8000 → 8010)
2. **Rename Categories to Brands** in UI
3. **Add Bundle Management UI**
4. **Implement Wholesale Toggle** on orders page
5. **Create Replenishment Menu** and pages
6. **Build FBA Shipment Builder**
7. **Create Analytics/Revenue Planner** pages
8. **Deploy to Railway**
9. **User Acceptance Testing** with real data

---

## 🐛 Known Issues

1. Server port conflict (resolved by changing to 8010)
2. Frontend still pointing to port 8000 (needs update)
3. Old Categories naming still in frontend (needs rename to Brands)

---

## 📞 Support

For questions or issues, refer to:
- Backend API: `GET /health` endpoint for status
- Database: Use Prisma Studio (`npx prisma studio`) to inspect data
- Logs: Check `/tmp/wms-server.log` for backend errors

---

**Last Updated:** November 19, 2025
