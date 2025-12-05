# Form Fixes Needed - Missing Fields Mapping

## ✅ Already Fixed

### Product Forms (NEW & EDIT)
**Files:**
- `frontend/app/protected/products/new/page.tsx` ✅
- `frontend/app/protected/products/[id]/edit/page.tsx` ✅

**Fixed Fields:**
- ✅ Primary Supplier selection (`primarySupplierId`)
- ✅ VAT Rate (`vatRate`)
- ✅ VAT Code (`vatCode`)
- ✅ Carton Sizes (`cartonSizes`)
- ✅ Shelf Life Days (`shelfLifeDays`)
- ✅ Heat Sensitive (`isHeatSensitive`)
- ✅ Perishable (`isPerishable`)
- ✅ Requires Batch Tracking (`requiresBatch`)
- ✅ All Marketplace SKUs (ffdSku, wsSku, amzSku, amzSkuBb, amzSkuM, amzSkuEu, onBuySku, ffdSaleSku)

**Status:** ✅ COMPLETE - All new fields added to both create and edit forms, properly mapped to backend

---

## ❌ Still Need Fixing

### 1. Location Forms
**File:** `frontend/app/protected/warehouses/locations/page.tsx`

**Missing Fields:**
- ❌ `locationType` (enum: PICK, BULK, BULK_LW)
- ❌ `isHeatSensitive` (boolean - whether location is hot/temperature sensitive)
- ❌ `maxWeight` (number - max weight limit in kg, especially for BULK_LW)
- ❌ `pickSequence` (number - sequence for optimized picking routes)
- ❌ `zone` relationship (zone assignment)

**Current Form Structure:**
- Uses GraphQL mutations (CREATE_LOCATION, UPDATE_LOCATION)
- Has fields: name, warehouseId, aisle, rack, shelf, bin
- Needs new fields added to:
  1. Form fields (Form.Item components)
  2. GraphQL mutation variables in `handleSubmit`
  3. Form.setFieldsValue in `handleEdit`

**Implementation Notes:**
```typescript
// Need to add these to the form:
<Form.Item label="Location Type" name="locationType">
  <Select>
    <Option value="PICK">PICK - Active Picking</Option>
    <Option value="BULK">BULK - Bulk Storage</Option>
    <Option value="BULK_LW">BULK_LW - Bulk Light Weight (max 200kg)</Option>
  </Select>
</Form.Item>

<Form.Item label="Pick Sequence" name="pickSequence">
  <InputNumber min={1} placeholder="Sequence number for picking" />
</Form.Item>

<Form.Item label="Max Weight (kg)" name="maxWeight">
  <InputNumber min={0} step={0.1} placeholder="e.g., 200" />
</Form.Item>

<Form.Item label="Heat Sensitive Location" name="isHeatSensitive" valuePropName="checked">
  <Select>
    <Option value={false}>No</Option>
    <Option value={true}>Yes - Hot Location</Option>
  </Select>
</Form.Item>
```

---

### 2. Warehouse Forms (if exists)
**File to Check:** Look for `frontend/app/protected/warehouses/new/page.tsx` or similar

**Potential Missing Fields:**
- Warehouse-level settings that might be needed
- Zone assignments

---

### 3. Supplier Forms
**File to Check:** `frontend/app/protected/suppliers/*/page.tsx`

**Check if these are captured:**
- Payment terms
- Lead times
- Contact information
- All fields from Prisma Supplier model

---

### 4. Sales Order / Purchase Order Forms
**Files to Check:**
- `frontend/app/protected/purchase-orders/new/page.tsx`
- `frontend/app/protected/sales-orders/new/page.tsx`

**Potential Issues:**
- PO forms should be able to filter products by supplier
- PO forms should show supplier SKUs and case sizes
- Orders should support marketplace channel selection

---

### 5. Goods Receiving Forms
**File:** `frontend/app/protected/goods-receiving/*/page.tsx`

**Check if these are captured when receiving:**
- Best Before Date input
- Lot/Batch Number input
- Location assignment (with type selection)
- Quantity validation against case sizes

---

## 🔧 Priority Fixes

### HIGH PRIORITY
1. **Location Forms** - Critical for location management and inventory placement
   - Add locationType, isHeatSensitive, pickSequence, maxWeight

### MEDIUM PRIORITY
2. **Purchase Order Forms** - Important for supplier integration
   - Add supplier filter for products
   - Show supplier SKUs and case sizes

3. **Goods Receiving** - Important for inventory tracking
   - Ensure BBD and lot number are captured

### LOW PRIORITY
4. **Warehouse/Zone Forms** - Less critical, can be added later
5. **Supplier Detail Forms** - Most fields likely already there

---

## 📝 Implementation Steps

### For Location Forms (GraphQL-based):

1. **Update Form Fields:**
   - Add new Form.Item components for locationType, pickSequence, maxWeight, isHeatSensitive
   - Use appropriate input types (Select for enum, InputNumber for numbers)

2. **Update CREATE mutation:**
```typescript
await createLocation({
  variables: {
    object: {
      // ... existing fields
      locationType: values.locationType || 'PICK',
      pickSequence: values.pickSequence || null,
      maxWeight: values.maxWeight || null,
      isHeatSensitive: values.isHeatSensitive || false,
    },
  },
});
```

3. **Update UPDATE mutation:**
```typescript
await updateLocation({
  variables: {
    id: selectedLocation.id,
    set: {
      // ... existing fields
      locationType: values.locationType,
      pickSequence: values.pickSequence,
      maxWeight: values.maxWeight,
      isHeatSensitive: values.isHeatSensitive,
    },
  },
});
```

4. **Update setFieldsValue:**
```typescript
form.setFieldsValue({
  // ... existing fields
  locationType: record.locationType || 'PICK',
  pickSequence: record.pickSequence,
  maxWeight: record.maxWeight,
  isHeatSensitive: record.isHeatSensitive || false,
});
```

5. **Update Table Columns** (to display new fields):
```typescript
{
  title: 'Type',
  dataIndex: 'locationType',
  key: 'locationType',
  render: (type: string) => (
    <Tag color={type === 'PICK' ? 'green' : type === 'BULK' ? 'blue' : 'orange'}>
      {type || 'PICK'}
    </Tag>
  ),
},
{
  title: 'Pick Seq',
  dataIndex: 'pickSequence',
  key: 'pickSequence',
  render: (seq: number) => seq || '-',
},
```

---

## 🚀 Next Steps

1. ✅ Commit Product form fixes (already done)
2. ❌ Fix Location forms
3. ❌ Review and fix PO/SO forms
4. ❌ Review Goods Receiving forms
5. ❌ Test all form submissions
6. ❌ Update validation rules where needed
7. ❌ Deploy and test in production

---

## 💡 Testing Checklist

After fixing forms, test:
- [ ] Create new product with all fields
- [ ] Edit existing product - all fields visible and editable
- [ ] Create location with type, pick sequence, heat sensitive
- [ ] Edit location - new fields work
- [ ] Create PO with supplier filter
- [ ] Receive goods with BBD and lot number
- [ ] Verify all data saves to database correctly
- [ ] Check API responses include new fields

---

## 📊 Impact Assessment

**High Impact Changes:**
- Product forms: HIGH - Core functionality, used frequently
- Location forms: HIGH - Critical for warehouse operations
- PO forms: MEDIUM - Important for procurement
- Goods receiving: MEDIUM - Important for inventory accuracy

**Time Estimate:**
- Location forms: ~30 minutes
- PO/SO review and fixes: ~1 hour
- Testing: ~30 minutes
- Total: ~2 hours

---

**Last Updated:** 2025-12-05
**Status:** Product forms complete, Location forms pending
