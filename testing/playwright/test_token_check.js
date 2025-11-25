const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture the Authorization header
  page.on('request', request => {
    if (request.url().includes('/api/products') && request.method() === 'POST') {
      const headers = request.headers();
      console.log('\n=== REQUEST HEADERS ===');
      console.log('Authorization:', headers['authorization']);

      if (headers['authorization']) {
        const token = headers['authorization'].replace('Bearer ', '');
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('\n=== JWT PAYLOAD ===');
        console.log(JSON.stringify(payload, null, 2));
        console.log('\nHas companyId:', !!payload.companyId);
      }
    }
  });

  try {
    // Login
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#login_email', 'admin@kiaan-wms.com');
    await page.fill('#login_password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s && JSON.parse(s)?.state?.isAuthenticated;
    }, { timeout: 15000 });
    console.log('Logged in!\n');

    // Check token in localStorage
    const authData = await page.evaluate(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s ? JSON.parse(s) : null;
    });

    if (authData?.state?.token) {
      const token = authData.state.token;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('=== TOKEN IN LOCALSTORAGE ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('\nHas companyId:', !!payload.companyId);
    }

    // Now make a create request
    console.log('\n\nNavigating to products/new...');
    await page.goto(`${BASE_URL}/protected/products/new`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill minimal form
    await page.fill('input#basic_name, input[id="name"]', 'Token Test');
    await page.fill('input#basic_sku, input[id="sku"]', 'TKN-TEST-' + Date.now());

    const costInputs = page.locator('.ant-input-number-input');
    await costInputs.nth(0).fill('5');
    await costInputs.nth(1).fill('10');

    console.log('\nSubmitting...');
    await page.click('button:has-text("Create Product")');
    await page.waitForTimeout(3000);

    console.log('\n=== DONE ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
