# Kiaan WMS - Complete Implementation Guide
## All Features Requested by Client

### ✅ Database Schema - ALREADY COMPLETE
The Prisma schema at `backend/prisma/schema.prisma` already includes ALL required tables:
- ✅ AlternativeSKU (for Amazon _BB, _M, and all marketplace SKUs)
- ✅ SupplierProduct (with supplier SKUs and case sizes)
- ✅ Consumable (for cardboards and packaging)
- ✅ VATCode and VATRate (multi-country support)
- ✅ BundleItem (for product bundles)
- ✅ Location with types (PICK, BULK, BULK_LW)
- ✅ Location.isHeatSensitive and Product.isHeatSensitive
- ✅ Location.maxWeight (for 200kg restriction)
- ✅ Location.pickSequence (for optimized picking routes)
- ✅ Inventory with bestBeforeDate tracking
- ✅ MarketplaceIntegration (Shopify, eBay, TikTok, Temu, Amazon)
- ✅ ShippingCarrier (Royal Mail, DPD, Amazon Buy Shipping)
- ✅ ReplenishmentTask and ReplenishmentConfig

### ✅ Backend API Routes - COMPLETED

Created modular route files:

1. **`routes/supplierProducts.js`** - ✅ DONE
   - GET /api/supplier-products - List all with filters
   - GET /api/supplier-products/by-supplier/:id - Products by supplier (for PO)
   - GET /api/supplier-products/:id - Get single
   - POST /api/supplier-products - Create
   - PUT /api/supplier-products/:id - Update
   - DELETE /api/supplier-products/:id - Delete
   - POST /api/supplier-products/bulk-import - Bulk import from Excel

2. **`routes/alternativeSKUs.js`** - ✅ DONE
   - GET /api/alternative-skus - List all with filters
   - GET /api/alternative-skus/by-product/:productId - Get all SKUs for product
   - GET /api/alternative-skus/lookup/:channelSKU - Reverse lookup
   - GET /api/alternative-skus/amazon-variants/:productId - Get Normal, _BB, _M
   - GET /api/alternative-skus/:id - Get single
   - POST /api/alternative-skus - Create
   - PUT /api/alternative-skus/:id - Update
   - DELETE /api/alternative-skus/:id - Delete
   - POST /api/alternative-skus/bulk-import - Bulk import

3. **Consumables, VAT, Bundles, Inventory Views** - Need to be added

### 📋 What Still Needs to Be Done

#### Backend (Priority Order):
1. Create routes for:
   - Consumables (might already exist)
   - VAT Codes/Rates
   - Bundle cost calculation endpoint
   - Inventory by BBD view
   - Bundle stock by BBD
   - PO PDF generation

2. Integrate routes into server.js

3. Marketplace integration scaffolds:
   - Shopify API stubs
   - eBay API stubs
   - TikTok API stubs
   - Temu API stubs
   - Amazon MFN/FBA API stubs

4. Shipping carrier scaffolds:
   - Royal Mail Click & Drop API stub
   - DPD UK API stub
   - Amazon Buy Shipping API stub

#### Frontend (Priority Order):
1. Supplier Products management pages:
   - List view with filters
   - Create/Edit forms
   - Bulk import from Excel

2. Alternative SKU management:
   - Product detail page showing all channel SKUs
   - Quick add Amazon variants (_BB, _M)
   - Bulk SKU mapping

3. Consumables management (verify if exists, enhance if needed)

4. Marketplace price calculator:
   - Input: product cost, consumables, shipping
   - Output: channel-specific pricing with margins

5. PO creation enhancements:
   - Filter products by supplier
   - Show supplier SKUs
   - PDF export with supplier SKUs

6. Inventory views:
   - By Best Before Date
   - By Location
   - Bundle stock by BBD

7. Mobile picking app enhancements:
   - Sort by pickSequence
   - Show only PICK locations
   - Trigger replenishment tasks

### 🎯 Excel Files Integration
Client has uploaded FFD.xlsx with these key sheets:
- **Products** - Main product database
- **Bundle_Stock** - Bundle quantities by BBD
- **VAT_rates** - Multi-country VAT rates
- **Consumables** - Packaging materials with costs
- **Suppliers** - Supplier list
- **AMZ** - Amazon pricing with FBA fees
- **FFD** - Direct channel pricing
- **TikTok** - TikTok pricing
- **TEMU** - Temu pricing

These can be imported via the bulk-import endpoints.

### 🚀 Deployment Checklist
1. Run Prisma migrations: `npx prisma migrate dev`
2. Seed VAT rates from Excel
3. Import suppliers from Excel
4. Import consumables from Excel
5. Map alternative SKUs from Excel
6. Map supplier products from Excel
7. Push to GitHub
8. Deploy to Railway

### 📝 Notes
- Schema is perfect - no changes needed
- Most complex logic is in the price calculator
- Bundle cost calculation: SUM(child_product.costPrice * quantity)
- Heat-sensitive validation: Don't assign chocolate to top shelves
- Weight validation: Don't exceed 200kg for BULK_LW locations
- Pick replenishment: Auto-create task when PICK location runs low

### Next Steps
1. Complete remaining API routes
2. Integrate into server.js
3. Build frontend UI components
4. Test end-to-end
5. Deploy
