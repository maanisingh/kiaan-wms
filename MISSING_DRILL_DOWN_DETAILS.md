# Missing Drill-Down Details - Client Requirements

## Current Status

The WMS has **list pages** for all features, but **detail/drill-down pages** need enhancements to show:
1. **Best-Before Dates** (expiry tracking)
2. **Replenishment Settings** (min/max levels)
3. **B2B/B2C Badges** (order type)
4. **Channel Badges** (Amazon FBA, Shopify, eBay, etc.)
5. **Bundle Components** with expiry alignment

---

## 1. Bundle Detail Page ✅ CREATED

**Location:** `/root/kiaan-wms/frontend/app/products/bundles/[id]/page.tsx`

**Features Implemented:**
- ✅ Shows bundle components with quantities (e.g., "12x Nakd Bars")
- ✅ Component cost breakdown
- ✅ Total bundle cost calculation
- ✅ Gross margin and profit per bundle
- ✅ Channel pricing table (Amazon FBA, Shopify, Direct Wholesale)
- ✅ Bundle inventory with **earliest best-before date**
- ✅ Multi-channel pricing with fees

**Still Needs:**
- ⏳ B2B/B2C badge for wholesale orders
- ⏳ Replenishment settings (min/max stock levels)

---

## 2. Inventory Detail Page ❌ NEEDS CREATION

**Should Be At:** `/root/kiaan-wms/frontend/app/inventory/[id]/page.tsx`

**Must Show:**
- ❌ **Best-Before Date** prominently displayed
- ❌ **Lot Number** and **Batch Number**
- ❌ **Location details** (warehouse, zone, bin)
- ❌ **Quantity breakdown** (available, reserved, damaged)
- ❌ **Expiry alert** (e.g., "Expires in 45 days")
- ❌ **FEFO status** (First Expiry, First Out indicator)
- ❌ **Related orders** using this inventory
- ❌ **Replenishment trigger** (below min level?)

**Client Requirement:**
> "see Best before date in the details where I can see the locations"

---

## 3. Product Detail Page ⚠️ NEEDS ENHANCEMENT

**Location:** `/root/kiaan-wms/frontend/app/products/[id]/page.tsx`

**Currently Shows:**
- ✅ Basic product info (SKU, name, category, type)
- ✅ Pricing (cost, price)
- ✅ Dimensions and weight
- ✅ Status tag

**Needs to Add:**
- ❌ **Replenishment Settings Section:**
  - Min Stock Level
  - Max Stock Level
  - Reorder Point
  - Reorder Quantity
  - Lead Time
- ❌ **Channel Badges:**
  - Amazon FBA (tag)
  - Shopify (tag)
  - eBay (tag)
  - Direct Wholesale (tag)
- ❌ **Best-Before Date Requirements:**
  - Shelf life (days)
  - Requires expiry tracking (yes/no)
  - FEFO enabled (yes/no)

---

## 4. Sales Order Detail Page ⚠️ NEEDS ENHANCEMENT

**Location:** `/root/kiaan-wms/frontend/app/sales-orders/[id]/page.tsx`

**Currently Shows:**
- ✅ Order details
- ✅ Customer info
- ✅ Line items

**Needs to Add:**
- ❌ **B2B/B2C Badge** (prominent at top)
  - B2B = Wholesale orders (requires single BB date for bundles)
  - B2C = Retail orders (can mix BB dates)
- ❌ **Channel Badge:**
  - Amazon FBA UK (orange badge)
  - Shopify Retail (green badge)
  - eBay UK (blue badge)
  - Direct Wholesale (purple badge)
- ❌ **FEFO Picking Alert:**
  - "This is a wholesale order - all items in bundles must have same best-before date"
- ❌ **Picked Items with BB Dates:**
  - Show which BB date was used for each bundle

**Client Requirement:**
> "flag orders with Wholesale Badge"
> "bundle won't mix Best before dates for wholesale orders"

---

## 5. FBA Transfer Detail Page ⚠️ NEEDS ENHANCEMENT

**Location:** `/root/kiaan-wms/frontend/app/fba-transfers/[id]/page.tsx`

**Currently Shows:**
- ✅ Shipment ID, destination, tracking
- ✅ Items in transfer
- ✅ Timeline/tracking events

**Needs to Add:**
- ❌ **Best-Before Date for Each Item:**
  - Column in items table showing BB date
  - Alert if items are near expiry
- ❌ **Bundle Breakdown:**
  - If transferring bundles, show components
  - Show BB date alignment status
- ❌ **Shipment Builder** (Phase 2):
  - Build outer cases from bundles
  - Assign case labels
  - Generate FBA shipment plan

**Client Requirement:**
> "pick from main warehouse, transfer to prepare warehouse"
> "shipment developer page"

---

## 6. Replenishment Task Detail Page ❌ NEEDS CREATION

**Should Be At:** `/root/kiaan-wms/frontend/app/replenishment/tasks/[id]/page.tsx`

**Must Show:**
- ❌ **Task details:**
  - Product name, SKU
  - From location (bulk storage)
  - To location (pick face)
  - Quantity to replenish
  - Priority (high/medium/low)
- ❌ **Current stock levels:**
  - Current quantity at pick face
  - Min level threshold
  - Max level threshold
- ❌ **Best-Before Date handling:**
  - Ensure FEFO (pick oldest expiry first)
  - Show BB dates available in bulk storage
- ❌ **Task actions:**
  - Start task
  - Complete task
  - Cancel task

---

## 7. Brand Detail Page ❌ NEEDS CREATION

**Should Be At:** `/root/kiaan-wms/frontend/app/products/brands/[id]/page.tsx`

**Must Show:**
- ❌ **Brand information:**
  - Brand name, code
  - Description
  - Logo/image
- ❌ **Products in this brand:**
  - Table of all products
  - SKU, name, type (single/bundle)
  - Stock levels
  - Best-before dates (for food products)
- ❌ **Brand-level analytics:**
  - Total products
  - Total stock value
  - Average margin
  - Sales by channel
- ❌ **Replenishment status:**
  - Products needing replenishment
  - Products near expiry

---

## Implementation Priority

### Phase 1 (Immediate - Client Requirements):

1. **Inventory Detail Page with BB Dates** ⭐⭐⭐
   - Client specifically requested: "see Best before date in the details"
   - Create `/app/inventory/[id]/page.tsx`
   - Show BB date, lot number, batch, location, expiry alerts

2. **B2B/B2C Badges on Orders** ⭐⭐⭐
   - Client specifically requested: "flag orders with Wholesale Badge"
   - Add prominent badge to sales order detail page
   - Color: Purple for B2B, Blue for B2C

3. **Channel Badges Everywhere** ⭐⭐⭐
   - Add to all order and product pages
   - Amazon FBA (orange), Shopify (green), eBay (blue), Wholesale (purple)

4. **Replenishment Settings in Product Details** ⭐⭐
   - Client requested: "set proactive replen limits"
   - Add section to product detail page showing min/max/reorder

### Phase 2 (Enhancement):

5. **Replenishment Task Detail Page**
6. **Brand Detail Page**
7. **Enhanced FBA Transfer with Shipment Builder**

---

## Example: What Client Sees Now vs. What They Should See

### Current: Bundle List Page
```
Product Bundles Page
--------------------
SKU: NAKD-12PK    | Name: Nakd Cashew Cookie 12-Pack | Status: Active
[No drill-down information visible]
```

### After Enhancement: Bundle Detail Page
```
Nakd Cashew Cookie 12-Pack (NAKD-12PK)
---------------------------------------
🏷️ B2B Wholesale Product | 🛒 Amazon FBA UK | 🏪 Shopify

Bundle Components:
  12x Nakd Cashew Cookie Bar (35g) @ £0.85 = £10.20

Pricing by Channel:
  📦 Amazon FBA UK: £18.99 (Fees: £4.75, Net: £3.24)
  🛍️  Shopify Retail: £16.99 (Fees: £0.79, Net: £5.20)
  🏢 Direct Wholesale: £14.99 (Fees: £0.00, Net: £4.00)

Inventory:
  Location: A-BULK-01 | Qty: 35 bundles | BB Date: 15/08/2026 ⚠️ 270 days
  Location: FBA-PREP-05 | Qty: 120 bundles | BB Date: 08/06/2026 ⚠️ 201 days

Replenishment:
  Min Level: 50 bundles | Max Level: 200 bundles
  Current: 155 bundles ✅ OK
```

---

## Next Steps

1. Create inventory detail page with BB dates ✅
2. Add B2B/B2C badges to order pages ✅
3. Add channel badges to all relevant pages ✅
4. Add replenishment settings to product details ✅
5. Create brand detail page
6. Create replenishment task detail page
7. Enhance FBA transfer page

**Estimated Time:** 2-3 hours for Phase 1 (immediate client requirements)
