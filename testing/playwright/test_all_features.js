const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
  const API_URL = 'https://serene-adaptation-production-c6d3.up.railway.app';

  // Capture API errors
  page.on('response', async response => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      let body = '';
      try { body = await response.text(); } catch (e) {}
      console.log(`   ❌ API Error: ${response.status()} ${response.url()}`);
      console.log(`      ${body.substring(0, 200)}`);
    }
  });

  console.log('=== KIAAN WMS FEATURE TEST ===\n');

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#login_email', 'admin@kiaan-wms.com');
    await page.fill('#login_password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s && JSON.parse(s)?.state?.isAuthenticated;
    }, { timeout: 15000 });
    console.log('   ✅ Logged in\n');

    // Test Delete
    console.log('2. Testing DELETE...');
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if delete button exists
    const deleteButtons = await page.locator('button:has-text("Delete"), .ant-btn-dangerous').count();
    console.log(`   Found ${deleteButtons} delete buttons`);

    // Check Actions column
    const actionsColumn = await page.locator('th:has-text("Actions")').count();
    console.log(`   Actions column: ${actionsColumn > 0 ? 'YES' : 'NO'}`);

    await page.screenshot({ path: '/tmp/products_list.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/products_list.png\n');

    // Test Import page
    console.log('3. Testing IMPORT page...');
    await page.goto(`${BASE_URL}/protected/products/import`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const importUrl = page.url();
    console.log(`   URL: ${importUrl}`);
    if (importUrl.includes('login')) {
      console.log('   ❌ Redirected to login');
    } else if (importUrl.includes('import')) {
      console.log('   ✅ Import page loaded');
    }
    await page.screenshot({ path: '/tmp/import_page.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/import_page.png\n');

    // Test Bundles page
    console.log('4. Testing BUNDLES page...');
    await page.goto(`${BASE_URL}/protected/products/bundles`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const bundlesUrl = page.url();
    console.log(`   URL: ${bundlesUrl}`);
    await page.screenshot({ path: '/tmp/bundles_page.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/bundles_page.png\n');

    // Test Label Printing page
    console.log('5. Testing LABEL PRINTING...');
    await page.goto(`${BASE_URL}/protected/label-printing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const labelUrl = page.url();
    console.log(`   URL: ${labelUrl}`);
    await page.screenshot({ path: '/tmp/label_page.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/label_page.png\n');

    // Test API endpoints directly
    console.log('6. Testing API endpoints...');
    const token = await page.evaluate(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s ? JSON.parse(s)?.state?.token : null;
    });

    if (token) {
      // Test bundles endpoint
      const bundlesResponse = await page.evaluate(async (data) => {
        const res = await fetch(`${data.apiUrl}/api/products?type=BUNDLE`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        return { status: res.status, ok: res.ok };
      }, { apiUrl: API_URL, token });
      console.log(`   GET /api/products?type=BUNDLE: ${bundlesResponse.status}`);

      // Test barcode endpoint
      const barcodeResponse = await page.evaluate(async (data) => {
        const res = await fetch(`${data.apiUrl}/api/barcode/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: 'TEST-123', type: 'CODE128' })
        });
        return { status: res.status, ok: res.ok };
      }, { apiUrl: API_URL, token });
      console.log(`   POST /api/barcode/generate: ${barcodeResponse.status}`);
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/test_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
