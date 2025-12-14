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
    await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(4000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png') });
    console.log('   Saved: 01_landing_page.png');

    // 2. Login Page
    console.log('2. Capturing Login Page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_page.png') });
    console.log('   Saved: 02_login_page.png');

    // 3. Quick Admin Login - Click Super Admin button
    console.log('3. Logging in as Super Admin...');
    try {
      // Look for Super Admin quick login button by test id
      const superAdminBtn = page.locator('[data-testid="quick-login-super_admin"]');
      if (await superAdminBtn.isVisible({ timeout: 5000 })) {
        await superAdminBtn.click();
        console.log('   Clicked Super Admin button');
      } else {
        // Try clicking by text
        await page.click('button:has-text("Super Admin")', { timeout: 5000 });
        console.log('   Clicked Super Admin by text');
      }
      await delay(5000);
    } catch (e) {
      console.log('   Quick login button not found, trying manual login...');
      try {
        await page.fill('[data-testid="email-input"]', 'admin@kiaan-wms.com');
        await page.fill('[data-testid="password-input"]', 'Admin@123');
        await page.click('[data-testid="login-submit-button"]');
        await delay(5000);
      } catch (e2) {
        console.log('   Manual login with testid failed, trying generic selectors...');
        await page.fill('input[type="email"]', 'admin@kiaan-wms.com');
        await page.fill('input[type="password"]', 'Admin@123');
        await page.click('button[type="submit"]');
        await delay(5000);
      }
    }

    console.log('   Current URL:', page.url());

    // Define all pages to capture
    const pages = [
      { name: '03_dashboard', url: '/protected/dashboard', title: 'Dashboard' },
      { name: '04_products_list', url: '/protected/products', title: 'Products List' },
      { name: '05_product_bundles', url: '/protected/products/bundles', title: 'Product Bundles' },
      { name: '06_product_brands', url: '/protected/products/brands', title: 'Product Brands' },
      { name: '07_inventory', url: '/protected/inventory', title: 'Inventory' },
      { name: '08_inventory_locations', url: '/protected/inventory/locations', title: 'Inventory Locations' },
      { name: '09_suppliers', url: '/protected/suppliers', title: 'Suppliers' },
      { name: '10_clients', url: '/protected/clients', title: 'Clients' },
      { name: '11_sales_orders', url: '/protected/sales-orders', title: 'Sales Orders' },
      { name: '12_purchase_orders', url: '/protected/purchase-orders', title: 'Purchase Orders' },
      { name: '13_warehouses', url: '/protected/warehouses', title: 'Warehouses' },
      { name: '14_picking', url: '/protected/picking', title: 'Picking' },
      { name: '15_packing', url: '/protected/packing', title: 'Packing' },
      { name: '16_replenishment_tasks', url: '/protected/replenishment/tasks', title: 'Replenishment Tasks' },
      { name: '17_replenishment_settings', url: '/protected/replenishment/settings', title: 'Replenishment Settings' },
      { name: '18_fba_transfers', url: '/protected/fba-transfers', title: 'FBA Transfers' },
      { name: '19_transfers', url: '/protected/transfers', title: 'Transfers' },
      { name: '20_goods_receiving', url: '/protected/goods-receiving', title: 'Goods Receiving' },
      { name: '21_returns', url: '/protected/returns', title: 'Returns' },
      { name: '22_shipments', url: '/protected/shipments', title: 'Shipments' },
      { name: '23_analytics_channels', url: '/protected/analytics/channels', title: 'Analytics - Channels' },
      { name: '24_analytics_optimizer', url: '/protected/analytics/optimizer', title: 'Analytics - Optimizer' },
      { name: '25_analytics_margins', url: '/protected/analytics/margins', title: 'Analytics - Margins' },
      { name: '26_integrations', url: '/protected/integrations', title: 'Integrations' },
      { name: '27_labels', url: '/protected/labels', title: 'Labels' },
      { name: '28_reports', url: '/protected/reports', title: 'Reports' },
      { name: '29_users', url: '/protected/users', title: 'Users' },
      { name: '30_settings', url: '/protected/settings', title: 'Settings' },
      { name: '31_consumables', url: '/protected/consumables', title: 'Consumables' },
    ];

    let count = 4;
    for (const p of pages) {
      console.log(`${count}. Capturing ${p.title}...`);
      try {
        await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await delay(3000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}.png`) });
        console.log(`   Saved: ${p.name}.png`);
      } catch (e) {
        console.log(`   Failed to capture ${p.title}: ${e.message}`);
        // Take screenshot of whatever is visible
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}_error.png`) });
      }
      count++;
    }

    await context.close();
    console.log('\n=== Screenshot capture complete! ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
