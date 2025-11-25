const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture API calls
  page.on('request', request => {
    if (request.url().includes('/api/product')) {
      console.log(`→ ${request.method()} ${request.url()}`);
      if (request.method() === 'POST') {
        console.log(`   Body: ${request.postData()}`);
      }
    }
  });
  page.on('response', async response => {
    if (response.url().includes('/api/product')) {
      let body = '';
      try { body = await response.text(); } catch (e) {}
      console.log(`← ${response.status()} ${response.url()}`);
      console.log(`   ${body.substring(0, 500)}`);
    }
  });

  console.log('=== PRODUCT CREATE TEST ===\n');

  try {
    // Login first
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#login_email', 'admin@kiaan-wms.com');
    await page.fill('#login_password', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect
    await page.waitForFunction(() => {
      const storage = localStorage.getItem('wms-auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        return parsed?.state?.isAuthenticated === true;
      }
      return false;
    }, { timeout: 15000 });

    console.log('   ✅ Auth state set in localStorage\n');

    // Now navigate to add product page
    console.log('2. Navigating to Add Product...');
    await page.goto(`${BASE_URL}/protected/products/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('   URL:', currentUrl);

    if (currentUrl.includes('login')) {
      console.log('   ⚠️ Redirected to login - checking auth state...');
      const authState = await page.evaluate(() => localStorage.getItem('wms-auth-storage'));
      console.log('   Auth storage:', authState ? 'EXISTS' : 'MISSING');

      // Retry navigation
      await page.goto(`${BASE_URL}/protected/products/new`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      console.log('   Retried URL:', page.url());
    }

    await page.screenshot({ path: '/tmp/products_new_page.png', fullPage: true });

    // Check if we're on the right page
    const pageTitle = await page.title();
    const h1Text = await page.locator('h1').first().textContent().catch(() => 'N/A');
    console.log('   Page title:', pageTitle);
    console.log('   H1:', h1Text, '\n');

    if (!currentUrl.includes('products/new')) {
      console.log('   ❌ Not on products/new page, stopping test');
      return;
    }

    // Fill form
    console.log('3. Filling form...');
    const timestamp = Date.now();

    // Use form item names based on Ant Design form
    await page.fill('input#basic_name, input[id="name"]', `Test Product ${timestamp}`);
    await page.fill('input#basic_sku, input[id="sku"]', `SKU-${timestamp}`);

    // Cost and selling price - Ant Design InputNumber
    const costInputs = page.locator('.ant-input-number-input');
    const inputCount = await costInputs.count();
    console.log('   Found', inputCount, 'number inputs');

    if (inputCount >= 2) {
      await costInputs.nth(0).fill('10');
      await costInputs.nth(1).fill('20');
    }

    await page.screenshot({ path: '/tmp/form_filled_final.png', fullPage: true });
    console.log('   Form filled\n');

    // Submit
    console.log('4. Clicking Create Product...');
    await page.click('button:has-text("Create Product")');
    await page.waitForTimeout(5000);

    // Check results
    const finalUrl = page.url();
    console.log('   Final URL:', finalUrl);

    await page.screenshot({ path: '/tmp/after_create.png', fullPage: true });

    // Check for success message
    const successCount = await page.locator('.ant-message-success').count();
    const errorCount = await page.locator('.ant-message-error').count();

    if (successCount > 0) {
      console.log('   ✅ SUCCESS! Product created!');
    } else if (errorCount > 0) {
      const errorText = await page.locator('.ant-message-error').textContent();
      console.log('   ❌ ERROR:', errorText);
    } else if (finalUrl.includes('/protected/products') && !finalUrl.includes('/new')) {
      console.log('   ✅ Redirected to products list - likely success!');
    } else {
      console.log('   ⚠️ Unclear result');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/test_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
