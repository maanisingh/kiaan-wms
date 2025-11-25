const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture API requests and responses
  const apiLogs = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiLogs.push({ type: 'REQUEST', method: request.method(), url: request.url() });
    }
  });
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      let body = '';
      try {
        body = await response.text();
        if (body.length > 500) body = body.substring(0, 500) + '...';
      } catch (e) {}
      apiLogs.push({
        type: 'RESPONSE',
        status: response.status(),
        url: response.url(),
        body: body
      });
    }
  });

  console.log('=== KIAAN WMS CRUD DEBUG TEST ===\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[id*="email"], input[name*="email"]', 'admin@kiaan-wms.com');
    await page.fill('input[type="password"], input[id*="password"], input[name*="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/protected/**', { timeout: 15000 });
    console.log('   ✅ Login successful\n');

    // Check localStorage for token
    const token = await page.evaluate(() => {
      const storage = localStorage.getItem('wms-auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        return parsed?.state?.token || null;
      }
      return null;
    });

    if (token) {
      console.log('   Token found in localStorage');
      // Decode JWT payload
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('   JWT Payload:', JSON.stringify(payload, null, 2));
      console.log('   Has companyId:', !!payload.companyId);
    } else {
      console.log('   ⚠️ No token found in localStorage');
    }
    console.log('');

    // Step 2: Navigate to Products
    console.log('2. Navigating to Add Product page...');
    await page.goto(`${BASE_URL}/protected/products/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('   ✅ On Add Product page\n');

    // Step 3: Fill and submit
    console.log('3. Filling form and submitting...');
    const timestamp = Date.now();
    const testSKU = `DBG-${timestamp}`;

    await page.fill('input[id="name"], #basic_name, input[name="name"]', `Debug Test ${timestamp}`);
    await page.waitForTimeout(200);
    await page.fill('input[id="sku"], #basic_sku, input[name="sku"]', testSKU);
    await page.waitForTimeout(200);

    // Try multiple selectors for price fields
    const costInput = await page.$('input[id="costPrice"], input[id="basic_costPrice"], #costPrice input');
    if (costInput) {
      await costInput.fill('10');
    }
    await page.waitForTimeout(200);

    const priceInput = await page.$('input[id="sellingPrice"], input[id="basic_sellingPrice"], #sellingPrice input');
    if (priceInput) {
      await priceInput.fill('20');
    }
    await page.waitForTimeout(200);

    console.log('   Form filled');
    await page.screenshot({ path: '/tmp/before_submit.png', fullPage: true });

    // Clear previous API logs before submit
    apiLogs.length = 0;

    // Click submit
    await page.click('button[type="submit"]');
    console.log('   Submit clicked, waiting for response...');

    await page.waitForTimeout(5000);

    // Show API logs
    console.log('\n=== API CALLS MADE ===');
    for (const log of apiLogs) {
      if (log.type === 'REQUEST') {
        console.log(`  → ${log.method} ${log.url}`);
      } else {
        console.log(`  ← ${log.status} ${log.url}`);
        if (log.body) console.log(`    Body: ${log.body}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/after_submit.png', fullPage: true });
    console.log('\n📸 Screenshots saved to /tmp/before_submit.png and /tmp/after_submit.png');

    // Check current URL
    console.log('\nCurrent URL:', page.url());

    // Check for any visible messages
    const messages = await page.$$eval('.ant-message-notice, .ant-message-error, .ant-message-success', els =>
      els.map(el => el.textContent)
    );
    if (messages.length > 0) {
      console.log('Messages on page:', messages);
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/crud_debug_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
