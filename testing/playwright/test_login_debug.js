const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture all requests
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('login')) {
      console.log(`→ ${request.method()} ${request.url()}`);
    }
  });
  page.on('response', async response => {
    if (response.url().includes('/api/') || response.url().includes('login')) {
      let body = '';
      try {
        body = await response.text();
        if (body.length > 200) body = body.substring(0, 200) + '...';
      } catch (e) {}
      console.log(`← ${response.status()} ${response.url()}`);
      if (body && !body.startsWith('<!DOCTYPE')) console.log(`   ${body}`);
    }
  });

  console.log('=== LOGIN DEBUG TEST ===\n');

  try {
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/tmp/login_page.png', fullPage: true });
    console.log('   Screenshot saved to /tmp/login_page.png\n');

    console.log('2. Finding form fields...');
    const emailInput = await page.$('input[type="email"], input[id*="email"], input[name*="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"]');
    const submitBtn = await page.$('button[type="submit"]');

    console.log('   Email input found:', !!emailInput);
    console.log('   Password input found:', !!passwordInput);
    console.log('   Submit button found:', !!submitBtn);

    if (!emailInput || !passwordInput) {
      console.log('\n   Page HTML (first 1000 chars):');
      const html = await page.content();
      console.log(html.substring(0, 1000));
      return;
    }

    console.log('\n3. Filling credentials...');
    await emailInput.fill('admin@kiaan-wms.com');
    await passwordInput.fill('Admin@123');
    await page.screenshot({ path: '/tmp/login_filled.png', fullPage: true });

    console.log('\n4. Clicking submit...');
    await submitBtn.click();

    console.log('\n5. Waiting for response...');
    await page.waitForTimeout(5000);

    console.log('\n6. Current URL:', page.url());
    await page.screenshot({ path: '/tmp/login_after.png', fullPage: true });

    // Check localStorage
    const storage = await page.evaluate(() => {
      return {
        authStorage: localStorage.getItem('wms-auth-storage'),
        token: localStorage.getItem('wms_auth_token')
      };
    });
    console.log('\n7. LocalStorage check:');
    console.log('   wms-auth-storage:', storage.authStorage ? 'EXISTS' : 'NOT FOUND');
    console.log('   wms_auth_token:', storage.token ? 'EXISTS' : 'NOT FOUND');

    if (storage.authStorage) {
      const parsed = JSON.parse(storage.authStorage);
      console.log('   Auth state:', JSON.stringify(parsed.state, null, 2).substring(0, 500));
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/login_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
