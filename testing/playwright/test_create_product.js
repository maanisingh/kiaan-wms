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
      try {
        body = await response.text();
      } catch (e) {}
      console.log(`← ${response.status()} ${response.url()}`);
      console.log(`   ${body.substring(0, 500)}`);
    }
  });

  console.log('=== PRODUCT CREATE TEST ===\n');

  try {
    // Login first
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@kiaan-wms.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('   ✅ Logged in, URL:', page.url(), '\n');

    // Go to add product
    console.log('2. Navigating to Add Product...');
    await page.goto(`${BASE_URL}/protected/products/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('   URL:', page.url(), '\n');

    // Fill form using Ant Design form item IDs
    console.log('3. Filling form...');
    const timestamp = Date.now();

    // Find all inputs
    const inputs = await page.$$eval('input', els => els.map(el => ({
      id: el.id,
      name: el.name,
      placeholder: el.placeholder,
      type: el.type
    })));
    console.log('   Found inputs:', JSON.stringify(inputs.slice(0, 10), null, 2));

    // Fill name field
    await page.locator('input').first().click();
    await page.keyboard.type(`Test Product ${timestamp}`);

    // Tab to SKU
    await page.keyboard.press('Tab');
    await page.keyboard.type(`SKU-${timestamp}`);

    // Take screenshot of filled form
    await page.screenshot({ path: '/tmp/form_filled.png', fullPage: true });
    console.log('   Form partially filled\n');

    // Scroll down and fill prices
    await page.evaluate(() => window.scrollTo(0, 500));

    // Find and fill cost price (look for input near "Cost Price" label)
    const costPriceInput = await page.locator('input[id*="cost"], .ant-input-number-input').nth(0);
    if (await costPriceInput.count() > 0) {
      await costPriceInput.click();
      await costPriceInput.fill('10');
    }

    // Find and fill selling price
    const sellingPriceInput = await page.locator('input[id*="selling"], .ant-input-number-input').nth(1);
    if (await sellingPriceInput.count() > 0) {
      await sellingPriceInput.click();
      await sellingPriceInput.fill('20');
    }

    await page.screenshot({ path: '/tmp/form_prices.png', fullPage: true });
    console.log('   Prices filled\n');

    // Submit
    console.log('4. Submitting form...');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Check results
    await page.screenshot({ path: '/tmp/after_submit.png', fullPage: true });
    console.log('\n   Current URL:', page.url());

    // Check for messages
    const pageContent = await page.content();
    if (pageContent.includes('successfully')) {
      console.log('   ✅ SUCCESS message found!');
    }
    if (pageContent.includes('error') || pageContent.includes('Error')) {
      console.log('   ⚠️ Error might have occurred');
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots: /tmp/form_filled.png, /tmp/form_prices.png, /tmp/after_submit.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/test_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
