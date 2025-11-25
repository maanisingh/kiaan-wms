const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console Error: ${msg.text()}`);
    }
  });

  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('/api/brands') && response.request().method() === 'DELETE') {
      let body = '';
      try { body = await response.text(); } catch (e) {}
      console.log(`DELETE ${response.url()}: ${response.status()}`);
      console.log(`   Response: ${body.substring(0, 200)}`);
    }
  });

  console.log('=== DELETE BRAND TEST ===\n');

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
    console.log('   Logged in!\n');

    // Navigate to brands page
    console.log('2. Navigating to Brands...');
    await page.goto(`${BASE_URL}/protected/products/brands`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/brands_page_before.png', fullPage: true });

    // Count brands before
    const brandsBefore = await page.locator('tbody tr').count();
    console.log(`   Brands in table: ${brandsBefore}`);

    // Look for delete button
    const deleteButtons = await page.locator('button:has-text("Delete")').count();
    console.log(`   Delete buttons found: ${deleteButtons}`);

    if (deleteButtons > 0) {
      console.log('\n3. Clicking first Delete button...');
      await page.locator('button:has-text("Delete")').first().click();
      await page.waitForTimeout(1000);

      // Check if modal appeared
      const modalVisible = await page.locator('.ant-modal-confirm').isVisible();
      console.log(`   Confirmation modal visible: ${modalVisible}`);

      if (modalVisible) {
        await page.screenshot({ path: '/tmp/delete_confirm_modal.png', fullPage: true });
        console.log('   Screenshot: /tmp/delete_confirm_modal.png');

        // Click the OK/Delete button in modal
        console.log('   Clicking confirm button...');
        await page.locator('.ant-modal-confirm .ant-btn-dangerous, .ant-modal-confirm-btns .ant-btn-primary').click();
        await page.waitForTimeout(3000);

        // Check for success/error message
        const successMsg = await page.locator('.ant-message-success').count();
        const errorMsg = await page.locator('.ant-message-error').count();

        if (successMsg > 0) {
          const text = await page.locator('.ant-message-success').textContent();
          console.log(`   SUCCESS: ${text}`);
        } else if (errorMsg > 0) {
          const text = await page.locator('.ant-message-error').textContent();
          console.log(`   ERROR: ${text}`);
        }

        // Count brands after
        const brandsAfter = await page.locator('tbody tr').count();
        console.log(`   Brands after delete: ${brandsAfter}`);

        if (brandsAfter < brandsBefore) {
          console.log('   RESULT: Brand was deleted!');
        } else {
          console.log('   RESULT: Brand count unchanged');
        }
      }
    } else {
      console.log('   No delete buttons found on page!');
    }

    await page.screenshot({ path: '/tmp/brands_page_after.png', fullPage: true });
    console.log('\n   Screenshot: /tmp/brands_page_after.png');

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/delete_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
