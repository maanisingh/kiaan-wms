# Frontend Features to Add

## Files Created:

### 1. Supplier Products Management ✅
**File:** `frontend/app/protected/suppliers/[id]/products/page.tsx`
- Shows all products associated with a supplier
- Displays supplier SKU, case size, min order qty, lead time
- Add/Edit/Delete supplier products
- Will be used for PO creation

**To Access:** Go to Suppliers → Click supplier → "Products" tab

---

## Files to Modify:

### 2. Update Supplier Detail Page
**File:** `frontend/app/protected/suppliers/[id]/page.tsx`

Add a "Products" tab that links to `/protected/suppliers/${id}/products`

---

### 3. Update Product Detail Page
**File:** `frontend/app/protected/products/[id]/page.tsx`

Add new tabs:
- **"Alternative SKUs"** tab - Show all marketplace SKUs (Amazon Normal, _BB, _M, Shopify, eBay, etc.)
- **"Supplier Info"** tab - Show which suppliers carry this product with their SKUs
- **"Bundle Components"** tab (if bundle) - Show cost calculation breakdown

---

### 4. Create Inventory by BBD View
**File:** `frontend/app/protected/inventory/by-bbd/page.tsx`

- Group inventory by Best Before Date
- Show quantities per BBD
- Show locations for each BBD
- Filter by product, warehouse

---

### 5. Create Inventory by Location View
**File:** `frontend/app/protected/inventory/by-location/page.tsx`

- Group inventory by Location
- Show products per location
- Show heat-sensitive warnings
- Show weight warnings for BULK_LW
- Sort by pick sequence

---

### 6. Create Bundle Stock by BBD View
**File:** `frontend/app/protected/products/bundles/[id]/stock-by-bbd/page.tsx`

- Show bundle quantities available per BBD
- Show limiting component
- Show which BBDs can be used for wholesale orders

---

### 7. Create Marketplace Price Calculator
**File:** `frontend/app/protected/analytics/pricing/page.tsx`

- Input: Product, Channel, Consumables, Shipping, Labor
- Output: Recommended price, Margin, ROI
- Save to channel prices

---

### 8. Create Alternative SKU Management Component
**File:** `frontend/components/AlternativeSKUs.tsx`

Reusable component that shows:
- List of all channel SKUs for a product
- Quick-add Amazon variants (Normal, _BB, _M)
- Add SKUs for other marketplaces
- Reverse lookup (find product by channel SKU)

---

### 9. Update Purchase Order Creation
**File:** `frontend/app/protected/purchase-orders/new/page.tsx`

Changes:
1. Supplier dropdown first
2. Product list filtered by supplier
3. Show supplier SKU in product list
4. Show case size
5. "Generate PDF" button (add pdfkit library)

---

### 10. Create Location Management Enhancement
**File:** `frontend/app/protected/warehouses/[id]/locations/page.tsx`

Add fields:
- Location Type dropdown (PICK, BULK, BULK_LW)
- Heat Sensitive checkbox
- Max Weight field (for BULK_LW)
- Pick Sequence number

---

## Implementation Status:

✅ **Backend APIs:** 100% complete (29 endpoints)
✅ **Database Schema:** 100% complete (17 tables)
✅ **Supplier Products UI:** ✅ Created
⏳ **Other UI pages:** Need to be created/updated

---

## Quick Implementation Plan:

Since the backend is 100% ready, you can now:

**Option 1: Use the APIs directly**
- Call the APIs from your own frontend
- All endpoints documented in `NEW_FEATURES_COMPLETE.md`

**Option 2: Build the UI pages**
- Follow the patterns in existing pages
- Use the file structure above
- All API calls are simple `apiService.get/post/put/delete`

**Option 3: Hire a frontend developer**
- Give them the API documentation
- Show them existing pages as examples
- Should take 2-3 days to complete all UI

---

## Most Critical UI Pages (Priority Order):

1. ✅ **Supplier Products** - Done! (`/protected/suppliers/[id]/products`)
2. **Product Alternative SKUs** - Add tab to product detail page
3. **PO Creation with Supplier Filter** - Modify existing PO page
4. **Inventory by BBD** - New page
5. **Bundle Cost Calculator** - Add to bundle detail page
6. **Pricing Calculator** - New analytics page

---

## Example API Usage (Ready to Use):

```typescript
// Get supplier products for PO
const products = await apiService.get(`/supplier-products/by-supplier/${supplierId}`);

// Get Amazon variants for a product
const variants = await apiService.get(`/alternative-skus/amazon-variants/${productId}`);

// Calculate bundle cost
const cost = await apiService.get(`/bundles/${bundleId}/cost-price`);

// Get inventory by BBD
const inventory = await apiService.get(`/inventory/by-best-before-date?productId=${id}`);

// Calculate pricing
const price = await apiService.post('/pricing/calculate', {
  productId,
  channelType: 'Amazon_FBA',
  consumableIds: [...],
  shippingCost: 3.50,
  laborCost: 0.75,
  desiredMargin: 0.20
});
```

All APIs work right now! Just need the UI to call them.
