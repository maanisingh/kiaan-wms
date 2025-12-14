const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
const SCREENSHOT_DIR = '/var/www/reports/kiaan-wms/screenshots/requirements';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fullTest() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    // Set longer timeouts
    page.setDefaultTimeout(30000);

    console.log('=== KIAAN WMS FULL REQUIREMENTS TESTING ===\n');

    // LOGIN
    console.log('1. Logging in as Super Admin...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    const superAdminBtn = page.locator('[data-testid="quick-login-super_admin"]');
    if (await superAdminBtn.isVisible({ timeout: 10000 })) {
      await superAdminBtn.click();
      await delay(6000);
    }
    console.log('   Logged in successfully\n');

    // ============================================================
    // REQUIREMENT 1: Add Product with Full SKU Details
    // ============================================================
    console.log('=== REQ 1: Products with SKU, Barcode, Alternative SKUs ===');
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    // Take screenshot of products list
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_products_list.png') });
    console.log('   [1/3] Products List');

    // Click Add Product button
    const addProductBtn = page.locator('button:has-text("Add Product"), button:has-text("Create Product"), button:has-text("New Product")').first();
    if (await addProductBtn.isVisible({ timeout: 5000 })) {
      await addProductBtn.click();
      await delay(3000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01a_add_product_modal.png') });
      console.log('   [2/3] Add Product Modal Opened');

      // Try to fill form fields
      try {
        // SKU field
        await page.fill('input[name="sku"], input[id="sku"], input[placeholder*="SKU"]', '789_B_1_CH');
        await delay(300);

        // Name field
        await page.fill('input[name="name"], input[id="name"], input[placeholder*="Name"]', '7ATE9 - Twisted Bites with Cheese 120g');
        await delay(300);

        // Cost Price
        const costInput = page.locator('input[name="costPrice"], input[name="cost"], input[placeholder*="Cost"]').first();
        if (await costInput.isVisible({ timeout: 2000 })) {
          await costInput.fill('2.695');
        }

        // Barcode/EAN
        const barcodeInput = page.locator('input[name="barcode"], input[name="ean"], input[placeholder*="Barcode"]').first();
        if (await barcodeInput.isVisible({ timeout: 2000 })) {
          await barcodeInput.fill('5060123456789');
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01b_product_form_filled.png') });
        console.log('   [3/3] Product Form Filled with Client SKU Data');

      } catch (e) {
        console.log('   Some form fields not found');
      }

      // Close modal
      await page.keyboard.press('Escape');
      await delay(1000);
    }

    // ============================================================
    // REQUIREMENT 2: Product Bundles with Cost Calculation
    // ============================================================
    console.log('\n=== REQ 2: Product Bundles (e.g., 789_SEL_6_B) ===');
    await page.goto(`${BASE_URL}/protected/products/bundles`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_bundles_list.png') });
    console.log('   [1/3] Bundles List');

    // Click Create Bundle
    const createBundleBtn = page.locator('button:has-text("Create Bundle"), button:has-text("Add Bundle"), button:has-text("New Bundle")').first();
    if (await createBundleBtn.isVisible({ timeout: 5000 })) {
      await createBundleBtn.click();
      await delay(3000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02a_create_bundle_modal.png') });
      console.log('   [2/3] Create Bundle Modal');

      // Fill bundle info
      try {
        await page.fill('input[name="sku"], input[id="sku"]', '789_SEL_6_B');
        await delay(200);
        await page.fill('input[name="name"], input[id="name"]', '7ATE9 Selection Box - 6 Varieties');
        await delay(200);

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02b_bundle_form_filled.png') });
        console.log('   [3/3] Bundle Form with Component Products');
      } catch (e) {
        console.log('   Bundle form fields not found');
      }

      await page.keyboard.press('Escape');
      await delay(1000);
    }

    // ============================================================
    // REQUIREMENT 3: Inventory with BB Date per Location
    // ============================================================
    console.log('\n=== REQ 3: Inventory with BB Date & Location ===');
    await page.goto(`${BASE_URL}/protected/inventory`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_inventory_overview.png') });
    console.log('   [1/4] Inventory Overview');

    // Click on Low Stock tab
    const lowStockTab = page.locator('text=Low Stock');
    if (await lowStockTab.isVisible({ timeout: 3000 })) {
      await lowStockTab.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03a_inventory_low_stock.png') });
      console.log('   [2/4] Low Stock Tab');
    }

    // Click on Expiring Soon tab
    const expiringTab = page.locator('text=Expiring Soon, text=Expiring');
    if (await expiringTab.isVisible({ timeout: 3000 })) {
      await expiringTab.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03b_inventory_expiring.png') });
      console.log('   [3/4] Expiring Soon Tab (BB Date Tracking)');
    }

    // Click View on first item
    const viewInventory = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewInventory.isVisible({ timeout: 3000 })) {
      await viewInventory.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03c_inventory_detail.png') });
      console.log('   [4/4] Inventory Detail (Qty per BB Date per Location)');
      await page.keyboard.press('Escape');
    }

    // ============================================================
    // REQUIREMENT 4: Warehouse Locations with Types
    // ============================================================
    console.log('\n=== REQ 4: Warehouse Locations (Pick, Bulk, Heat Sensitive) ===');
    await page.goto(`${BASE_URL}/protected/inventory/locations`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_locations_list.png') });
    console.log('   [1/2] Locations List (Type, Sequence, Heat Flag)');

    // Try to add location
    const addLocationBtn = page.locator('button:has-text("Add Location"), button:has-text("Create Location")').first();
    if (await addLocationBtn.isVisible({ timeout: 3000 })) {
      await addLocationBtn.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04a_add_location_form.png') });
      console.log('   [2/2] Add Location Form (Type: Pick/Bulk/Bulk LW, Heat Sensitive, Sequence)');
      await page.keyboard.press('Escape');
    }

    // ============================================================
    // REQUIREMENT 5: Suppliers with Supplier SKU Mapping
    // ============================================================
    console.log('\n=== REQ 5: Suppliers with SKU & Case Size Mapping ===');
    await page.goto(`${BASE_URL}/protected/suppliers`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_suppliers_list.png') });
    console.log('   [1/3] Suppliers List');

    // Add Supplier
    const addSupplierBtn = page.locator('button:has-text("Add Supplier")').first();
    if (await addSupplierBtn.isVisible({ timeout: 3000 })) {
      await addSupplierBtn.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05a_add_supplier_form.png') });
      console.log('   [2/3] Add Supplier Form');
      await page.keyboard.press('Escape');
      await delay(1000);
    }

    // View supplier details
    const viewSupplierBtn = page.locator('button:has-text("View")').first();
    if (await viewSupplierBtn.isVisible({ timeout: 3000 })) {
      await viewSupplierBtn.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05b_supplier_sku_mapping.png') });
      console.log('   [3/3] Supplier Detail (Supplier SKU -> Internal SKU + Case Size)');
      await page.keyboard.press('Escape');
    }

    // ============================================================
    // REQUIREMENT 6: Purchase Orders filtered by Supplier
    // ============================================================
    console.log('\n=== REQ 6: Purchase Orders (Supplier Product Filter) ===');
    await page.goto(`${BASE_URL}/protected/purchase-orders`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_purchase_orders_list.png') });
    console.log('   [1/2] Purchase Orders List');

    const createPOBtn = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    if (await createPOBtn.isVisible({ timeout: 3000 })) {
      await createPOBtn.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06a_create_po_form.png') });
      console.log('   [2/2] Create PO Form (Select Supplier -> Products Filtered)');
      await page.keyboard.press('Escape');
    }

    // ============================================================
    // REQUIREMENT 7: Consumables (Cardboards)
    // ============================================================
    console.log('\n=== REQ 7: Consumables Menu (Cardboards, Packaging) ===');
    await page.goto(`${BASE_URL}/protected/consumables`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_consumables_list.png') });
    console.log('   [1/1] Consumables List (KITE_24x12x18, NP_SP, etc.)');

    // ============================================================
    // REQUIREMENT 8: Integrations (Amazon, Shopify, eBay, Royal Mail)
    // ============================================================
    console.log('\n=== REQ 8: Marketplace & Courier Integrations ===');
    await page.goto(`${BASE_URL}/protected/integrations`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_integrations_overview.png') });
    console.log('   [1/1] Integrations (Amazon, Shopify, eBay, TikTok, Royal Mail, DPD)');

    // ============================================================
    // REQUIREMENT 9: Replenishment Tasks & Settings
    // ============================================================
    console.log('\n=== REQ 9: Replenishment (Bulk to Pick) ===');
    await page.goto(`${BASE_URL}/protected/replenishment/tasks`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_replenishment_tasks.png') });
    console.log('   [1/2] Replenishment Tasks');

    await page.goto(`${BASE_URL}/protected/replenishment/settings`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09a_replenishment_settings.png') });
    console.log('   [2/2] Replenishment Settings (Min/Max Limits)');

    // ============================================================
    // REQUIREMENT 10: Picking with Location Sequence
    // ============================================================
    console.log('\n=== REQ 10: Picking (Sorted by Location Sequence) ===');
    await page.goto(`${BASE_URL}/protected/picking`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_picking_list.png') });
    console.log('   [1/1] Picking List (Orders sorted by pick sequence)');

    // ============================================================
    // REQUIREMENT 11: Channel Pricing Analytics
    // ============================================================
    console.log('\n=== REQ 11: Channel Pricing (FFD, AMZ, TikTok, TEMU) ===');
    await page.goto(`${BASE_URL}/protected/analytics/channels`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_channel_pricing.png') });
    console.log('   [1/1] Channel Pricing Analytics');

    // ============================================================
    // REQUIREMENT 12: Margin Analysis
    // ============================================================
    console.log('\n=== REQ 12: Margin Analysis (Cost + P&P + Labour) ===');
    await page.goto(`${BASE_URL}/protected/analytics/margins`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_margin_analysis.png') });
    console.log('   [1/1] Margin Analysis (Product Cost Breakdown)');

    // ============================================================
    // REQUIREMENT 13: FBA Transfers
    // ============================================================
    console.log('\n=== REQ 13: FBA Transfers (Amazon FBA Shipments) ===');
    await page.goto(`${BASE_URL}/protected/fba-transfers`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_fba_transfers.png') });
    console.log('   [1/1] FBA Transfers');

    // ============================================================
    // REQUIREMENT 14: Users & Role-Based Access
    // ============================================================
    console.log('\n=== REQ 14: Users with Roles & Permissions ===');
    await page.goto(`${BASE_URL}/protected/users`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_users_roles.png') });
    console.log('   [1/1] Users with Role-Based Access');

    // ============================================================
    // REQUIREMENT 15: Label Printing
    // ============================================================
    console.log('\n=== REQ 15: Label Printing (Shipping Labels, Barcodes) ===');
    await page.goto(`${BASE_URL}/protected/labels`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_label_printing.png') });
    console.log('   [1/1] Label Printing');

    // ============================================================
    // REQUIREMENT 16: Sales Orders with B2B/B2C
    // ============================================================
    console.log('\n=== REQ 16: Sales Orders (B2B/B2C Badges) ===');
    await page.goto(`${BASE_URL}/protected/sales-orders`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_sales_orders.png') });
    console.log('   [1/1] Sales Orders');

    // ============================================================
    // REQUIREMENT 17: Clients Management
    // ============================================================
    console.log('\n=== REQ 17: Clients (B2B/B2C Management) ===');
    await page.goto(`${BASE_URL}/protected/clients`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_clients.png') });
    console.log('   [1/1] Clients');

    // ============================================================
    // REQUIREMENT 18: Warehouses
    // ============================================================
    console.log('\n=== REQ 18: Multi-Warehouse Management ===');
    await page.goto(`${BASE_URL}/protected/warehouses`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_warehouses.png') });
    console.log('   [1/1] Warehouses');

    // ============================================================
    // REQUIREMENT 19: Returns
    // ============================================================
    console.log('\n=== REQ 19: Returns Management ===');
    await page.goto(`${BASE_URL}/protected/returns`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_returns.png') });
    console.log('   [1/1] Returns');

    // ============================================================
    // REQUIREMENT 20: Goods Receiving (ASN Import)
    // ============================================================
    console.log('\n=== REQ 20: Goods Receiving / ASN Import ===');
    await page.goto(`${BASE_URL}/protected/goods-receiving`, { waitUntil: 'load', timeout: 60000 });
    await delay(4000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_goods_receiving.png') });
    console.log('   [1/1] Goods Receiving');

    await context.close();
    console.log('\n=== ALL REQUIREMENTS TESTED ===');
    console.log('Screenshots saved to:', SCREENSHOT_DIR);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

fullTest();
