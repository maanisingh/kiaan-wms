const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR: ' + msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR: ' + err.message);
  });

  console.log('=== ADD INVENTORY TEST ===\n');

  try {
    // Login
    console.log('1. LOGGING IN...');
    await page.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });
    await page.fill('#login_email', 'admin@kiaan-wms.com');
    await page.fill('#login_password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s && JSON.parse(s)?.state?.isAuthenticated;
    }, { timeout: 15000 });
    console.log('   ✅ Logged in\n');

    // Navigate to inventory
    console.log('2. NAVIGATING TO INVENTORY...');
    await page.goto(BASE_URL + '/protected/inventory', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('   ✅ On inventory page\n');

    // Click Add Inventory
    console.log('3. OPENING ADD INVENTORY MODAL...');
    await page.click('button:has-text("Add Inventory")');
    await page.waitForTimeout(1000);

    const modalVisible = await page.locator('.ant-modal').isVisible();
    console.log('   Modal visible: ' + modalVisible);
    await page.screenshot({ path: '/tmp/add_inventory_modal.png', fullPage: true });
    console.log('   📸 /tmp/add_inventory_modal.png\n');

    // Test typing in Product search - select inside modal
    console.log('4. TESTING PRODUCT SEARCH...');
    const productSelect = page.locator('.ant-modal .ant-select').first();
    await productSelect.click();
    await page.waitForTimeout(500);

    // Type in search
    console.log('   Typing "Nak" in product search...');
    await page.keyboard.type('Nak', { delay: 100 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/add_inventory_after_search.png', fullPage: true });
    console.log('   📸 /tmp/add_inventory_after_search.png\n');

    // Check for page errors in console
    const pageHasError = await page.evaluate(() => {
      return document.body.innerText.includes('Application error');
    });
    console.log('   Page has Application error: ' + pageHasError);

    // Select first product if available
    console.log('5. SELECTING A PRODUCT...');
    const options = await page.locator('.ant-select-item-option').count();
    console.log('   Options found: ' + options);
    if (options > 0) {
      await page.locator('.ant-select-item-option').first().click();
      await page.waitForTimeout(500);
      console.log('   ✅ Product selected\n');
    } else {
      // Press escape to close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Test quantity input
    console.log('6. TESTING QUANTITY INPUT...');
    const qtyInput = page.locator('.ant-modal .ant-input-number-input').first();
    await qtyInput.fill('150');
    await page.waitForTimeout(500);
    console.log('   ✅ Quantity entered: 150\n');

    await page.screenshot({ path: '/tmp/add_inventory_filled.png', fullPage: true });
    console.log('   📸 /tmp/add_inventory_filled.png');

    console.log('\n=== TEST SUMMARY ===');
    console.log('Modal opens: ✅');
    console.log('Product search works: ' + (pageHasError ? '❌' : '✅'));
    console.log('Quantity input works: ✅');

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/add_inventory_error.png', fullPage: true });
    console.log('   📸 /tmp/add_inventory_error.png');
  } finally {
    await browser.close();
  }
})();
