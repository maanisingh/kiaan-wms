const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture API DELETE calls
  page.on('response', async response => {
    if (response.url().includes('/api/brands') && response.request().method() === 'DELETE') {
      console.log(`DELETE API Response: ${response.status()}`);
      try {
        const body = await response.text();
        console.log(`   Body: ${body}`);
      } catch (e) {}
    }
  });

  console.log('=== DELETE TEST WITH EVENT DISPATCH ===\n');

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

    // Navigate to brands
    console.log('2. Navigating to Brands...');
    await page.goto(`${BASE_URL}/protected/products/brands`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const brandCount = await page.locator('tbody tr').count();
    console.log(`   Brands: ${brandCount}`);

    // Find and click delete button using JS dispatch
    console.log('\n3. Dispatching click event on Delete button...');

    const result = await page.evaluate(() => {
      // Find all delete buttons
      const buttons = document.querySelectorAll('button');
      const deleteBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Delete'));

      if (deleteBtn) {
        console.log('Found delete button:', deleteBtn.textContent);

        // Try to dispatch native click
        deleteBtn.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));

        return {
          found: true,
          text: deleteBtn.textContent,
          className: deleteBtn.className
        };
      }
      return { found: false };
    });

    console.log(`   Result: ${JSON.stringify(result)}`);
    await page.waitForTimeout(2000);

    // Check for modal
    const modalVisible = await page.locator('.ant-modal-confirm, .ant-modal').isVisible().catch(() => false);
    console.log(`   Modal visible after dispatch: ${modalVisible}`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/delete_event_result.png', fullPage: true });

    // If modal appeared, click confirm
    if (modalVisible) {
      console.log('   Modal appeared! Clicking confirm...');
      await page.locator('.ant-btn-dangerous:visible').click();
      await page.waitForTimeout(2000);
    }

    // Try clicking with Playwright on a different element type
    console.log('\n4. Trying to click row action...');

    // Look for any clickable delete elements in the Actions cell
    const actionsCells = await page.locator('td').filter({ hasText: 'Delete' }).count();
    console.log(`   Found ${actionsCells} cells with Delete text`);

    if (actionsCells > 0) {
      const deleteInCell = page.locator('td').filter({ hasText: 'Delete' }).first().locator('button, a, span').filter({ hasText: 'Delete' });
      const deleteCount = await deleteInCell.count();
      console.log(`   Delete elements in first cell: ${deleteCount}`);

      if (deleteCount > 0) {
        await deleteInCell.first().click({ force: true, timeout: 5000 });
        await page.waitForTimeout(2000);

        const modalNow = await page.locator('.ant-modal').isVisible().catch(() => false);
        console.log(`   Modal after force click: ${modalNow}`);
      }
    }

    await page.screenshot({ path: '/tmp/delete_final.png', fullPage: true });
    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/delete_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
