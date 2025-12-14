const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
const SCREENSHOT_DIR = '/var/www/reports/kiaan-wms/screenshots';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    console.log('=== Kiaan WMS Screenshot Capture ===\n');

    // 1. Landing Page
    console.log('1. Capturing Landing Page...');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png') });
    console.log('   Saved: 01_landing_page.png');

    // 2. Login Page
    console.log('2. Capturing Login Page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_page.png') });
    console.log('   Saved: 02_login_page.png');

    // 3. Quick Admin Login
    console.log('3. Logging in as Admin...');
    try {
      // Look for Admin User quick login button
      await page.click('button:has-text("Admin User")', { timeout: 5000 });
      await delay(5000);
      console.log('   Logged in successfully');
    } catch (e) {
      console.log('   Quick login not found, trying manual login...');
      await page.fill('input[type="email"]', 'admin@kiaan.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await delay(5000);
    }

    // 4. Dashboard
    console.log('4. Capturing Dashboard...');
    await page.goto(`${BASE_URL}/protected/dashboard`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_dashboard.png') });
    console.log('   Saved: 03_dashboard.png');

    // 5. Products List
    console.log('5. Capturing Products List...');
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_products_list.png') });
    console.log('   Saved: 04_products_list.png');

    // 6. Product Bundles
    console.log('6. Capturing Product Bundles...');
    await page.goto(`${BASE_URL}/protected/products/bundles`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_product_bundles.png') });
    console.log('   Saved: 05_product_bundles.png');

    // 7. Product Brands
    console.log('7. Capturing Product Brands...');
    await page.goto(`${BASE_URL}/protected/products/brands`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_product_brands.png') });
    console.log('   Saved: 06_product_brands.png');

    // 8. Inventory
    console.log('8. Capturing Inventory...');
    await page.goto(`${BASE_URL}/protected/inventory`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_inventory.png') });
    console.log('   Saved: 07_inventory.png');

    // 9. Inventory Detail (BB Date, Lot, Batch)
    console.log('9. Capturing Inventory Detail...');
    await page.goto(`${BASE_URL}/protected/inventory/stock`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_inventory_stock.png') });
    console.log('   Saved: 08_inventory_stock.png');

    // 10. Suppliers
    console.log('10. Capturing Suppliers...');
    await page.goto(`${BASE_URL}/protected/suppliers`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_suppliers.png') });
    console.log('   Saved: 09_suppliers.png');

    // 11. Clients
    console.log('11. Capturing Clients...');
    await page.goto(`${BASE_URL}/protected/clients`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_clients.png') });
    console.log('   Saved: 10_clients.png');

    // 12. Sales Orders
    console.log('12. Capturing Sales Orders...');
    await page.goto(`${BASE_URL}/protected/sales-orders`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_sales_orders.png') });
    console.log('   Saved: 11_sales_orders.png');

    // 13. Purchase Orders
    console.log('13. Capturing Purchase Orders...');
    await page.goto(`${BASE_URL}/protected/purchase-orders`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_purchase_orders.png') });
    console.log('   Saved: 12_purchase_orders.png');

    // 14. Warehouses
    console.log('14. Capturing Warehouses...');
    await page.goto(`${BASE_URL}/protected/warehouses`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_warehouses.png') });
    console.log('   Saved: 13_warehouses.png');

    // 15. Picking
    console.log('15. Capturing Picking...');
    await page.goto(`${BASE_URL}/protected/picking`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_picking.png') });
    console.log('   Saved: 14_picking.png');

    // 16. Packing
    console.log('16. Capturing Packing...');
    await page.goto(`${BASE_URL}/protected/packing`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_packing.png') });
    console.log('   Saved: 15_packing.png');

    // 17. Replenishment Tasks
    console.log('17. Capturing Replenishment Tasks...');
    await page.goto(`${BASE_URL}/protected/replenishment/tasks`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_replenishment_tasks.png') });
    console.log('   Saved: 16_replenishment_tasks.png');

    // 18. Replenishment Settings
    console.log('18. Capturing Replenishment Settings...');
    await page.goto(`${BASE_URL}/protected/replenishment/settings`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_replenishment_settings.png') });
    console.log('   Saved: 17_replenishment_settings.png');

    // 19. FBA Transfers
    console.log('19. Capturing FBA Transfers...');
    await page.goto(`${BASE_URL}/protected/fba-transfers`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_fba_transfers.png') });
    console.log('   Saved: 18_fba_transfers.png');

    // 20. Transfers
    console.log('20. Capturing Transfers...');
    await page.goto(`${BASE_URL}/protected/transfers`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_transfers.png') });
    console.log('   Saved: 19_transfers.png');

    // 21. Goods Receiving
    console.log('21. Capturing Goods Receiving...');
    await page.goto(`${BASE_URL}/protected/goods-receiving`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_goods_receiving.png') });
    console.log('   Saved: 20_goods_receiving.png');

    // 22. Returns
    console.log('22. Capturing Returns...');
    await page.goto(`${BASE_URL}/protected/returns`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_returns.png') });
    console.log('   Saved: 21_returns.png');

    // 23. Shipments
    console.log('23. Capturing Shipments...');
    await page.goto(`${BASE_URL}/protected/shipments`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_shipments.png') });
    console.log('   Saved: 22_shipments.png');

    // 24. Analytics - Channels
    console.log('24. Capturing Analytics - Channels...');
    await page.goto(`${BASE_URL}/protected/analytics/channels`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_analytics_channels.png') });
    console.log('   Saved: 23_analytics_channels.png');

    // 25. Analytics - Optimizer
    console.log('25. Capturing Analytics - Optimizer...');
    await page.goto(`${BASE_URL}/protected/analytics/optimizer`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24_analytics_optimizer.png') });
    console.log('   Saved: 24_analytics_optimizer.png');

    // 26. Analytics - Margins
    console.log('26. Capturing Analytics - Margins...');
    await page.goto(`${BASE_URL}/protected/analytics/margins`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25_analytics_margins.png') });
    console.log('   Saved: 25_analytics_margins.png');

    // 27. Integrations
    console.log('27. Capturing Integrations...');
    await page.goto(`${BASE_URL}/protected/integrations`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26_integrations.png') });
    console.log('   Saved: 26_integrations.png');

    // 28. Labels / Printing
    console.log('28. Capturing Labels...');
    await page.goto(`${BASE_URL}/protected/labels`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27_labels.png') });
    console.log('   Saved: 27_labels.png');

    // 29. Reports
    console.log('29. Capturing Reports...');
    await page.goto(`${BASE_URL}/protected/reports`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28_reports.png') });
    console.log('   Saved: 28_reports.png');

    // 30. Users
    console.log('30. Capturing Users...');
    await page.goto(`${BASE_URL}/protected/users`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '29_users.png') });
    console.log('   Saved: 29_users.png');

    // 31. Settings
    console.log('31. Capturing Settings...');
    await page.goto(`${BASE_URL}/protected/settings`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30_settings.png') });
    console.log('   Saved: 30_settings.png');

    // 32. Consumables
    console.log('32. Capturing Consumables...');
    await page.goto(`${BASE_URL}/protected/consumables`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31_consumables.png') });
    console.log('   Saved: 31_consumables.png');

    await context.close();
    console.log('\n=== All screenshots captured successfully! ===');
    console.log(`Total: 31 screenshots saved to ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
