const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
const SCREENSHOT_DIR = '/var/www/reports/kiaan-wms/screenshots';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureMissing() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    // Login first
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);

    const superAdminBtn = page.locator('[data-testid="quick-login-super_admin"]');
    if (await superAdminBtn.isVisible({ timeout: 5000 })) {
      await superAdminBtn.click();
      await delay(5000);
    }

    // Capture missing pages
    console.log('Capturing Product Bundles...');
    await page.goto(`${BASE_URL}/protected/products/bundles`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(4000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_product_bundles.png') });
    console.log('   Saved: 05_product_bundles.png');

    console.log('Capturing Replenishment Settings...');
    await page.goto(`${BASE_URL}/protected/replenishment/settings`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(4000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_replenishment_settings.png') });
    console.log('   Saved: 17_replenishment_settings.png');

    await context.close();
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureMissing();
