const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
  
  console.log('=== KIAAN WMS CRUD TEST ===\n');
  
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[id*="email"], input[name*="email"]', 'admin@kiaan-wms.com');
    await page.fill('input[type="password"], input[id*="password"], input[name*="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/protected/**', { timeout: 15000 });
    console.log('   ✅ Login successful\n');
    
    // Step 2: Navigate to Products
    console.log('2. Navigating to Products...');
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('   ✅ On Products page\n');
    
    // Step 3: Click Add Product
    console.log('3. Creating new product...');
    await page.click('text=Add Product');
    await page.waitForURL('**/products/new**');
    await page.waitForTimeout(1000);
    
    // Fill the form
    const timestamp = Date.now();
    const testSKU = `TEST-PW-${timestamp}`;
    await page.fill('input[id*="name"], input[name="name"]', `Playwright Test Product ${timestamp}`);
    await page.fill('input[id*="sku"], input[name="sku"]', testSKU);
    await page.fill('input[id*="costPrice"], input[name="costPrice"]', '10');
    await page.fill('input[id*="sellingPrice"], input[name="sellingPrice"]', '20');
    
    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check for success or error
    const successMsg = await page.locator('text=successfully').count();
    const errorMsg = await page.locator('.ant-message-error').count();
    
    if (successMsg > 0) {
      console.log('   ✅ Product created successfully!\n');
    } else if (errorMsg > 0) {
      const errText = await page.locator('.ant-message-error').textContent();
      console.log(`   ❌ Error creating product: ${errText}\n`);
    } else {
      console.log('   ⚠️ Unclear result, checking page...\n');
    }
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/crud_test_result.png', fullPage: true });
    console.log('   📸 Screenshot saved to /tmp/crud_test_result.png\n');
    
    // Navigate back to products and verify
    await page.goto(`${BASE_URL}/protected/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const productExists = await page.locator(`text=${testSKU}`).count();
    if (productExists > 0) {
      console.log(`4. ✅ Product ${testSKU} found in list!\n`);
    } else {
      console.log(`4. ❌ Product ${testSKU} NOT found in list\n`);
    }
    
    console.log('=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/crud_test_error.png', fullPage: true });
    console.log('   📸 Error screenshot saved to /tmp/crud_test_error.png');
  } finally {
    await browser.close();
  }
})();
