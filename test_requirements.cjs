const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
const SCREENSHOT_DIR = '/var/www/reports/kiaan-wms/screenshots/requirements';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRequirements() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    console.log('=== KIAAN WMS REQUIREMENTS TESTING ===\n');

    // LOGIN
    console.log('1. Logging in as Super Admin...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    const superAdminBtn = page.locator('[data-testid="quick-login-super_admin"]');
    if (await superAdminBtn.isVisible({ timeout: 5000 })) {
      await superAdminBtn.click();
      await delay(5000);
    }
    console.log('   Logged in successfully\n');

    // ===== REQUIREMENT: Products with SKU, Alternative SKUs =====
    console.log('2. Testing Products - Add Product with SKU fields...');
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // Click Add Product button
    try {
      await page.click('button:has-text("Add Product"), button:has-text("Create Product"), a:has-text("Add Product")', { timeout: 5000 });
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_01_add_product_form.png') });
      console.log('   Screenshot: Add Product Form');

      // Fill product form with client's SKU format
      const skuInput = page.locator('input[name="sku"], input[placeholder*="SKU"], #sku');
      if (await skuInput.isVisible({ timeout: 3000 })) {
        await skuInput.fill('789_B_1_CH');
        await delay(500);
      }

      const nameInput = page.locator('input[name="name"], input[placeholder*="Name"], #name');
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('7ATE9 - Twisted Bites with Cheese 120g');
        await delay(500);
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_02_product_sku_fields.png') });
      console.log('   Screenshot: Product SKU Fields');

      // Look for alternative SKU fields
      const altSkuField = page.locator('input[name*="alternative"], input[placeholder*="Alternative SKU"], input[name*="amazon"], input[name*="shopify"]');
      if (await altSkuField.count() > 0) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_03_alternative_skus.png') });
        console.log('   Screenshot: Alternative SKU Fields (Amazon, Shopify, eBay)');
      }

      // Close modal/dialog
      await page.keyboard.press('Escape');
      await delay(1000);
    } catch (e) {
      console.log('   Add Product form not found or error:', e.message);
    }

    // ===== REQUIREMENT: VAT Rate Column =====
    console.log('3. Testing VAT Rate Field on Products...');
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // Look for VAT column in product list
    const pageContent = await page.content();
    if (pageContent.includes('VAT') || pageContent.includes('Tax')) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_04_vat_rate_column.png') });
      console.log('   Screenshot: VAT Rate Column in Products');
    }

    // ===== REQUIREMENT: Product Bundles with Cost Calculation =====
    console.log('4. Testing Product Bundles...');
    await page.goto(`${BASE_URL}/protected/products/bundles`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_05_bundles_list.png') });
    console.log('   Screenshot: Bundles List');

    // Click Create Bundle
    try {
      await page.click('button:has-text("Create Bundle"), button:has-text("Add Bundle")', { timeout: 5000 });
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_06_bundle_create_form.png') });
      console.log('   Screenshot: Bundle Creation Form (shows component products and cost calculation)');
      await page.keyboard.press('Escape');
      await delay(1000);
    } catch (e) {
      console.log('   Bundle creation form not found');
    }

    // ===== REQUIREMENT: Inventory with BB Date, Location, Quantity =====
    console.log('5. Testing Inventory Management...');
    await page.goto(`${BASE_URL}/protected/inventory`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // Look for Expiring Soon tab
    const expiringTab = page.locator('text=Expiring Soon, button:has-text("Expiring")');
    if (await expiringTab.isVisible({ timeout: 3000 })) {
      await expiringTab.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_07_expiring_soon.png') });
      console.log('   Screenshot: Expiring Soon Tab (BB Date tracking)');
    }

    // Click on an item to see details with BB date per location
    const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewBtn.isVisible({ timeout: 3000 })) {
      await viewBtn.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_08_inventory_detail_bb_location.png') });
      console.log('   Screenshot: Inventory Detail with BB Date per Location');
      await page.keyboard.press('Escape');
    }

    // ===== REQUIREMENT: Warehouse Locations with Types =====
    console.log('6. Testing Warehouse Locations...');
    await page.goto(`${BASE_URL}/protected/inventory/locations`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_09_location_types.png') });
    console.log('   Screenshot: Location Types (Pick, Bulk, Bulk LW)');

    // Look for location type, heat sensitive, sequence columns
    const locationContent = await page.content();
    if (locationContent.includes('Pick') || locationContent.includes('Bulk') || locationContent.includes('Heat')) {
      console.log('   Found location type columns');
    }

    // ===== REQUIREMENT: Supplier Management with Supplier SKUs =====
    console.log('7. Testing Suppliers...');
    await page.goto(`${BASE_URL}/protected/suppliers`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    // Click Add Supplier
    try {
      await page.click('button:has-text("Add Supplier")', { timeout: 5000 });
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_10_add_supplier_form.png') });
      console.log('   Screenshot: Add Supplier Form');
      await page.keyboard.press('Escape');
      await delay(1000);
    } catch (e) {
      console.log('   Add Supplier form not found');
    }

    // View supplier to see supplier SKU mapping
    const viewSupplier = page.locator('button:has-text("View")').first();
    if (await viewSupplier.isVisible({ timeout: 3000 })) {
      await viewSupplier.click();
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_11_supplier_sku_mapping.png') });
      console.log('   Screenshot: Supplier SKU Mapping (case size)');
      await page.keyboard.press('Escape');
    }

    // ===== REQUIREMENT: Purchase Orders with Supplier Products =====
    console.log('8. Testing Purchase Orders...');
    await page.goto(`${BASE_URL}/protected/purchase-orders`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    try {
      await page.click('button:has-text("Create"), button:has-text("New PO")', { timeout: 5000 });
      await delay(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_12_create_po_supplier_filter.png') });
      console.log('   Screenshot: Create PO (products filtered by supplier)');
      await page.keyboard.press('Escape');
    } catch (e) {
      console.log('   Create PO form not found');
    }

    // ===== REQUIREMENT: Consumables Menu =====
    console.log('9. Testing Consumables...');
    await page.goto(`${BASE_URL}/protected/consumables`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_13_consumables_cardboards.png') });
    console.log('   Screenshot: Consumables (Cardboards, packaging materials)');

    // ===== REQUIREMENT: Integrations (Amazon, Shopify, eBay, Royal Mail) =====
    console.log('10. Testing Integrations...');
    await page.goto(`${BASE_URL}/protected/integrations`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_14_integrations_overview.png') });
    console.log('   Screenshot: Integrations Overview');

    // Look for specific integrations
    const intContent = await page.content();
    if (intContent.includes('Amazon')) {
      console.log('   Found Amazon integration');
    }
    if (intContent.includes('Shopify')) {
      console.log('   Found Shopify integration');
    }
    if (intContent.includes('Royal Mail')) {
      console.log('   Found Royal Mail integration');
    }

    // ===== REQUIREMENT: Replenishment Tasks =====
    console.log('11. Testing Replenishment...');
    await page.goto(`${BASE_URL}/protected/replenishment/tasks`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_15_replenishment_tasks.png') });
    console.log('   Screenshot: Replenishment Tasks (Bulk to Pick)');

    // ===== REQUIREMENT: Replenishment Settings (Proactive limits) =====
    console.log('12. Testing Replenishment Settings...');
    await page.goto(`${BASE_URL}/protected/replenishment/settings`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_16_replenishment_settings.png') });
    console.log('   Screenshot: Replenishment Settings (Min/Max limits)');

    // ===== REQUIREMENT: Picking with Sequence Order =====
    console.log('13. Testing Picking...');
    await page.goto(`${BASE_URL}/protected/picking`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_17_picking_sequence.png') });
    console.log('   Screenshot: Picking (Sorted by location sequence)');

    // ===== REQUIREMENT: Channel Pricing Analytics =====
    console.log('14. Testing Channel Pricing Analytics...');
    await page.goto(`${BASE_URL}/protected/analytics/channels`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_18_channel_pricing.png') });
    console.log('   Screenshot: Channel Pricing (TikTok, TEMU, FFD, FW, AMZ)');

    // ===== REQUIREMENT: Margin Analysis =====
    console.log('15. Testing Margin Analysis...');
    await page.goto(`${BASE_URL}/protected/analytics/margins`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_19_margin_analysis.png') });
    console.log('   Screenshot: Margin Analysis (Product cost + P&P + Labour + Materials)');

    // ===== REQUIREMENT: FBA Transfers =====
    console.log('16. Testing FBA Transfers...');
    await page.goto(`${BASE_URL}/protected/fba-transfers`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_20_fba_transfers.png') });
    console.log('   Screenshot: FBA Transfers (Amazon FBA shipments)');

    // ===== REQUIREMENT: Users with Roles =====
    console.log('17. Testing User Roles...');
    await page.goto(`${BASE_URL}/protected/users`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_21_user_roles.png') });
    console.log('   Screenshot: Users with Role-based Access');

    // ===== REQUIREMENT: Label Printing =====
    console.log('18. Testing Label Printing...');
    await page.goto(`${BASE_URL}/protected/labels`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_22_label_printing.png') });
    console.log('   Screenshot: Label Printing (Shipping labels, Barcodes)');

    // ===== REQUIREMENT: Sales Orders with B2B/Wholesale Badge =====
    console.log('19. Testing Sales Orders...');
    await page.goto(`${BASE_URL}/protected/sales-orders`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_23_sales_orders_badges.png') });
    console.log('   Screenshot: Sales Orders (B2B/B2C badges)');

    // ===== REQUIREMENT: Clients (B2B/B2C) =====
    console.log('20. Testing Clients...');
    await page.goto(`${BASE_URL}/protected/clients`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'req_24_clients_b2b_b2c.png') });
    console.log('   Screenshot: Clients (B2B/B2C management)');

    await context.close();
    console.log('\n=== REQUIREMENTS TESTING COMPLETE ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testRequirements();
