const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  let hasPageError = false;

  page.on('pageerror', err => {
    console.log('PAGE ERROR: ' + err.message);
    hasPageError = true;
  });

  console.log('=== ADD INVENTORY SEARCH TEST ===\n');

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
    await page.waitForTimeout(3000);
    console.log('   ✅ On inventory page\n');

    // Click Add Inventory
    console.log('3. OPENING ADD INVENTORY MODAL...');
    const addBtn = page.locator('button:has-text("Add Inventory")');
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(1500);

    const modalVisible = await page.locator('.ant-modal').isVisible();
    console.log('   Modal visible: ' + modalVisible);

    if (!modalVisible) {
      throw new Error('Modal did not open');
    }

    await page.screenshot({ path: '/tmp/test_search_modal.png', fullPage: true });
    console.log('   📸 /tmp/test_search_modal.png\n');

    // Click on Product select inside modal
    console.log('4. CLICKING PRODUCT SELECT...');
    const productSelect = page.locator('.ant-modal .ant-select').first();
    await productSelect.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Dropdown opened\n');

    // Type in search
    console.log('5. TYPING IN SEARCH...');
    hasPageError = false;
    await page.keyboard.type('Nakd', { delay: 150 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: '/tmp/test_search_typed.png', fullPage: true });
    console.log('   📸 /tmp/test_search_typed.png');

    // Check for options
    const options = await page.locator('.ant-select-item-option').count();
    console.log('   Options visible: ' + options);

    // Check if page crashed
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasCrash = pageText.includes('Application error');
    console.log('   Page crashed: ' + hasCrash);
    console.log('   JS Error occurred: ' + hasPageError);

    console.log('\n=== RESULT ===');
    if (!hasCrash && !hasPageError) {
      console.log('✅ SUCCESS - Search works without crashing!');
    } else {
      console.log('❌ FAILED - Page crashed when typing');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/test_search_error.png', fullPage: true });
    console.log('   📸 /tmp/test_search_error.png');
  } finally {
    await browser.close();
  }
})();
