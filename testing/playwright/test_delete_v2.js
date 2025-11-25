const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture all API calls
  page.on('response', async response => {
    if (response.url().includes('/api/brands')) {
      let body = '';
      try { body = await response.text(); } catch (e) {}
      console.log(`${response.request().method()} ${response.url()}: ${response.status()}`);
      if (response.status() >= 400) {
        console.log(`   Error: ${body.substring(0, 300)}`);
      }
    }
  });

  console.log('=== DELETE BRAND TEST V2 ===\n');

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

    // Count brands
    const brandRows = await page.locator('tbody tr').count();
    console.log(`   Brands in table: ${brandRows}`);

    // Find delete buttons more specifically - they have danger class and DeleteOutlined icon
    const deleteButtons = page.locator('button.ant-btn-dangerous, button:has(.anticon-delete)');
    const deleteCount = await deleteButtons.count();
    console.log(`   Delete buttons found: ${deleteCount}`);

    // Also look for text-based delete buttons
    const textDeleteButtons = page.locator('button:has-text("Delete")');
    const textDeleteCount = await textDeleteButtons.count();
    console.log(`   Text Delete buttons: ${textDeleteCount}`);

    // Take screenshot before
    await page.screenshot({ path: '/tmp/brands_before_delete.png', fullPage: true });

    if (textDeleteCount > 0) {
      console.log('\n3. Clicking Delete button...');

      // Get the first delete button
      const firstDelete = textDeleteButtons.first();

      // Check if button is visible and enabled
      const isVisible = await firstDelete.isVisible();
      const isEnabled = await firstDelete.isEnabled();
      console.log(`   Button visible: ${isVisible}, enabled: ${isEnabled}`);

      // Click it
      await firstDelete.click();
      console.log('   Clicked!');

      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/after_delete_click.png', fullPage: true });

      // Check for any modal
      const anyModal = await page.locator('.ant-modal').isVisible().catch(() => false);
      const confirmModal = await page.locator('.ant-modal-confirm').isVisible().catch(() => false);
      console.log(`   Any modal visible: ${anyModal}`);
      console.log(`   Confirm modal visible: ${confirmModal}`);

      if (anyModal || confirmModal) {
        console.log('   Taking modal screenshot...');
        await page.screenshot({ path: '/tmp/delete_modal.png', fullPage: true });

        // Look for the confirm button
        const confirmBtns = await page.locator('.ant-modal .ant-btn-dangerous, .ant-modal-confirm-btns button').allTextContents();
        console.log('   Modal buttons:', confirmBtns);

        // Click OK/Delete button
        const okBtn = page.locator('.ant-modal-confirm-btns .ant-btn-primary, .ant-btn-dangerous:has-text("Delete"), .ant-btn-dangerous:has-text("OK")');
        if (await okBtn.count() > 0) {
          console.log('   Clicking confirm button...');
          await okBtn.first().click();
          await page.waitForTimeout(3000);
        }
      } else {
        console.log('   NO MODAL APPEARED!');

        // Check page for any error
        const pageContent = await page.content();
        if (pageContent.includes('error') || pageContent.includes('Error')) {
          console.log('   Page might have an error');
        }
      }

      // Check for success/error messages
      await page.waitForTimeout(1000);
      const messages = await page.locator('.ant-message-notice').allTextContents();
      console.log('   Messages:', messages);

      // Final count
      const finalCount = await page.locator('tbody tr').count();
      console.log(`\n   Final brand count: ${finalCount}`);
      console.log(`   Change: ${brandRows - finalCount}`);
    }

    await page.screenshot({ path: '/tmp/brands_final.png', fullPage: true });
    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/delete_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
