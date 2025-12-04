# WMS Frontend - Gap Analysis

## Date: 2025-12-04
## Comparing: Excel Templates vs Current WMS Implementation

---

## ✅ ALREADY IMPLEMENTED (Do NOT Touch)

### 1. Core Entities ✅
- [x] Products (with BB dates, lot/batch tracking)
- [x] Suppliers (with detail pages)
- [x] Clients/Customers (with B2B/B2C types)
- [x] Warehouses, Zones, Locations
- [x] Inventory with Best-Before dates
- [x] Sales Orders
- [x] Bundles (BundleItem model exists)
- [x] Brands
- [x] Picking system
- [x] Transfers/FBA shipments
- [x] Stock adjustments
- [x] Inventory movements
- [x] Cycle counts
- [x] Replenishment

### 2. Database Schema ✅
- [x] Product.bestBeforeDate
- [x] Product.lotNumber
- [x] Product.batchNumber
- [x] Product.type (SIMPLE, VARIANT, BUNDLE)
- [x] Product.shelfLifeDays
- [x] Customer.customerType (B2B/B2C)
- [x] SalesOrder.isWholesale
- [x] SalesOrder.salesChannel
- [x] BundleItem (parent-child relationship)
- [x] Location (aisle, rack, shelf, bin)

---

## ❌ MISSING FEATURES (Need to Implement)

### 1. Alternative SKU System ❌
**Excel Sheet: "⬆️Alt_codes"**

**What's needed:**
- [ ] AlternativeSKU model (many-to-many with Product)
- [ ] Fields: channelType, channelSKU, isActive
- [ ] Support for:
  - Normal Amazon SKU (e.g., `OL_SEL_10_PR`)
  - Amazon BB rotation SKU (`OL_SEL_10_PR_BB`)
  - Amazon MFN SKU (`OL_SEL_10_PR_M`)
  - Shopify SKUs (FFD_, FW_ prefixes)
  - eBay, TikTok, Temu SKUs

**Frontend needed:**
- [ ] Alternative SKUs tab on Product detail page
- [ ] Table showing all channel SKUs
- [ ] Add/Edit/Delete alternative SKUs
- [ ] Bulk import from CSV

### 2. VAT Rates ❌
**Excel Sheet: "VAT_rates"**

**What's needed:**
- [ ] VATRate model with country-specific rates
- [ ] Product.vatCode field (e.g., "A_FOOD_GEN", "A_FOOD_CNDY")
- [ ] VATRate lookup table with 30+ codes
- [ ] Multi-country support (UK, EU countries, Switzerland)

**Frontend needed:**
- [ ] VAT Rates management page (`/protected/settings/vat-rates`)
- [ ] VAT code dropdown on Product edit
- [ ] VAT rate selector by country
- [ ] Import VAT rates from CSV

### 3. Consumables Module ❌
**Excel Sheet: "Consumables"**

**What's needed:**
- [ ] Consumable model (can extend Product or separate)
- [ ] Fields: cost_price_each, unit_per_pack, categories
- [ ] Stock tracking for packaging materials
- [ ] Used in marketplace price calculations

**Frontend needed:**
- [ ] `/protected/consumables` list page
- [ ] `/protected/consumables/[id]` detail page
- [ ] `/protected/consumables/new` create page
- [ ] Stock levels for cardboard boxes, tape, labels
- [ ] Link to products (which consumables used for which product)

### 4. Supplier-Product Association ❌
**Currently:** Products link to Suppliers via Company
**Excel:** Each product has specific supplier with supplier SKU

**What's needed:**
- [ ] SupplierProduct junction table
- [ ] Fields: supplierSKU, caseSize, leadTimeDays, minOrderQty
- [ ] One product can have multiple suppliers
- [ ] Preferred supplier flag

**Frontend needed:**
- [ ] Suppliers tab on Product detail
- [ ] Products tab on Supplier detail (already exists, enhance it)
- [ ] Supplier SKU field when creating PO
- [ ] Filter products by supplier when creating PO

### 5. Bundle Cost Calculation ❌
**Excel Sheet: "Bundle_Stock"**

**Currently:** BundleItem exists but no auto-calculation
**Needed:** Bundle cost = sum(child.costPrice × quantity)

**What's needed:**
- [ ] Auto-calculate bundle cost on bundle save
- [ ] Auto-calculate bundle price based on components
- [ ] Show bundle cost breakdown
- [ ] Update bundle cost when component costs change

**Frontend needed:**
- [ ] Bundle cost breakdown table
- [ ] "Recalculate Cost" button
- [ ] Show margin calculation

### 6. Location Types & Heat Sensitivity ❌
**Requirements:**
- Pick locations (active picking face)
- Bulk locations (main storage)
- Bulk LW (light weight, max 200kg)
- Heat sensitive flag on locations
- Heat sensitive flag on products

**What's needed:**
- [ ] Location.locationType (PICK, BULK, BULK_LW)
- [ ] Location.isHeatSensitive (boolean)
- [ ] Location.maxWeight (for LW locations)
- [ ] Product.isHeatSensitive (boolean)
- [ ] Validation: don't put heat-sensitive products in heat-sensitive locations

**Frontend needed:**
- [ ] Location type dropdown when creating/editing location
- [ ] Heat sensitive checkbox on Location form
- [ ] Heat sensitive checkbox on Product form
- [ ] Warning when assigning heat-sensitive product to wrong location

### 7. Intelligent Picking with Sequence ❌
**Requirements:**
- Only pick from PICK locations
- Auto-generate replenishment task if PICK stock low
- Sequence number on locations for optimized pick path
- Pick orders in sequence to minimize travel

**What's needed:**
- [ ] Location.pickSequence (integer for pick path)
- [ ] Picking algorithm:
  - Filter PICK locations only
  - Check stock levels
  - Create replen task if needed
  - Sort pick items by sequence number
- [ ] PickItem.sequenceNumber (already exists!)

**Frontend needed:**
- [ ] Pick sequence field on Location form
- [ ] Pick path visualization
- [ ] Replenishment alerts when pick stock < threshold
- [ ] Auto-create replen tasks

### 8. Marketplace Integrations ❌
**Excel Sheets:** TikTok, TEMU, AMZ, AMZ_EU, FFD, FW, Shopify

**What's needed:**
- [ ] MarketplaceIntegration model
- [ ] Fields: platform, credentials, isActive, syncFrequency
- [ ] Platforms: Shopify, eBay, TikTok, Temu, Amazon MFN, Amazon FBA
- [ ] Order sync (pull orders from marketplaces)
- [ ] Stock sync (push stock levels to marketplaces)
- [ ] Daily FBA inventory reports

**Frontend needed:**
- [ ] `/protected/integrations/marketplaces` page
- [ ] Connect/disconnect buttons for each platform
- [ ] Sync status indicators
- [ ] Manual sync trigger
- [ ] Sync logs

### 9. Shipping Courier Integrations ❌
**Requirements:**
1. Amazon Buy Shipping (Seller Fulfilled Prime)
2. Royal Mail Click & Drop API
3. ParcelForce (Click & Drop API from Jan 2026)
4. DPD UK

**What's needed:**
- [ ] ShippingCarrier model
- [ ] API credentials per carrier
- [ ] Label generation
- [ ] Tracking number retrieval
- [ ] Rate shopping (compare carrier prices)

**Frontend needed:**
- [ ] `/protected/settings/carriers` page (might exist, check)
- [ ] Carrier credentials form
- [ ] Test connection button
- [ ] Print shipping labels
- [ ] Bulk label generation

---

## 📊 PRIORITY MATRIX

### Phase 1 - Critical Missing Features (Week 1)
1. **Alternative SKU System** - Highest priority for Amazon operations
2. **Supplier-Product Association** - Needed for PO generation
3. **Consumables Module** - Required for cost calculations

### Phase 2 - Important Enhancements (Week 2)
4. **VAT Rates** - Needed for EU compliance
5. **Bundle Cost Calculation** - Critical for pricing
6. **Location Types & Heat Sensitivity** - Warehouse safety

### Phase 3 - Operational Improvements (Week 3)
7. **Intelligent Picking** - Efficiency gains
8. **Marketplace Integrations** - Order automation
9. **Shipping Carriers** - Label automation

---

## 🚀 IMPLEMENTATION CHECKLIST

- [ ] 1. Update Prisma schema with missing models
- [ ] 2. Run migration
- [ ] 3. Create seed data
- [ ] 4. Build backend API endpoints
- [ ] 5. Create frontend pages/components
- [ ] 6. Test end-to-end workflows
- [ ] 7. Deploy to production

---

## 📝 NOTES

- DO NOT modify existing working features
- Keep backward compatibility
- Use existing UI patterns (Ant Design)
- Follow current folder structure
- Reuse existing components where possible
