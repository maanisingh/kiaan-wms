const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';
  const API_URL = 'https://serene-adaptation-production-c6d3.up.railway.app';

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`CONSOLE ERROR: ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  // Capture API calls
  page.on('response', async response => {
    if (response.url().includes('/api/') || response.url().includes('/graphql')) {
      const method = response.request().method();
      const status = response.status();
      if (status >= 400) {
        let body = '';
        try { body = await response.text(); } catch (e) {}
        console.log(`API ERROR: ${method} ${response.url()}: ${status}`);
        console.log(`   ${body.substring(0, 300)}`);
      }
    }
  });

  console.log('=== INVENTORY PAGE COMPREHENSIVE TEST ===\n');

  try {
    // Login
    console.log('1. LOGGING IN...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#login_email', 'admin@kiaan-wms.com');
    await page.fill('#login_password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s && JSON.parse(s)?.state?.isAuthenticated;
    }, { timeout: 15000 });
    console.log('   ✅ Logged in\n');

    // Navigate to inventory
    console.log('2. NAVIGATING TO INVENTORY...');
    await page.goto(`${BASE_URL}/protected/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const inventoryUrl = page.url();
    console.log(`   URL: ${inventoryUrl}`);

    if (inventoryUrl.includes('login')) {
      console.log('   ❌ Redirected to login!');
      return;
    }

    await page.screenshot({ path: '/tmp/inventory_page.png', fullPage: true });
    console.log('   📸 /tmp/inventory_page.png\n');

    // Check page content
    console.log('3. CHECKING PAGE ELEMENTS...');

    // Check for loading/error states
    const hasSpinner = await page.locator('.ant-spin').isVisible().catch(() => false);
    const hasError = await page.locator('.ant-alert-error').isVisible().catch(() => false);
    const hasTable = await page.locator('.ant-table').isVisible().catch(() => false);

    console.log(`   Loading spinner: ${hasSpinner}`);
    console.log(`   Error alert: ${hasError}`);
    console.log(`   Table visible: ${hasTable}`);

    if (hasError) {
      const errorText = await page.locator('.ant-alert-error').textContent().catch(() => 'N/A');
      console.log(`   Error message: ${errorText}`);
    }

    // Check for data
    const rowCount = await page.locator('tbody tr').count();
    console.log(`   Table rows: ${rowCount}`);

    // Check for tabs
    const tabs = await page.locator('.ant-tabs-tab').allTextContents();
    console.log(`   Tabs: ${tabs.join(', ')}`);

    // Check buttons
    const addBtn = await page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').count();
    console.log(`   Add buttons: ${addBtn}`);

    const deleteBtn = await page.locator('button:has-text("Delete")').count();
    console.log(`   Delete buttons: ${deleteBtn}`);

    const editBtn = await page.locator('button:has-text("Edit")').count();
    console.log(`   Edit buttons: ${editBtn}\n`);

    // Test Add Inventory functionality
    console.log('4. TESTING ADD INVENTORY...');
    const addInventoryBtn = page.locator('button:has-text("Add Inventory"), button:has-text("Add New")').first();
    if (await addInventoryBtn.count() > 0) {
      console.log('   Found Add button, clicking...');
      await addInventoryBtn.click();
      await page.waitForTimeout(1500);

      // Check if modal/drawer opened
      const modalVisible = await page.locator('.ant-modal, .ant-drawer').isVisible().catch(() => false);
      console.log(`   Modal/Drawer opened: ${modalVisible}`);

      if (modalVisible) {
        await page.screenshot({ path: '/tmp/inventory_add_modal.png', fullPage: true });
        console.log('   📸 /tmp/inventory_add_modal.png');

        // Check form fields
        const formFields = await page.locator('.ant-form-item').count();
        console.log(`   Form fields: ${formFields}`);

        // Close modal
        await page.locator('.ant-modal-close, .ant-drawer-close').first().click().catch(() => {});
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ⚠️ No Add button found');
    }

    // Test Delete functionality
    console.log('\n5. TESTING DELETE FUNCTIONALITY...');
    if (deleteBtn > 0) {
      console.log('   Clicking first delete button...');
      await page.locator('button:has-text("Delete")').first().click();
      await page.waitForTimeout(1500);

      const confirmModal = await page.locator('.ant-modal-confirm').isVisible().catch(() => false);
      console.log(`   Confirmation modal appeared: ${confirmModal}`);

      if (confirmModal) {
        await page.screenshot({ path: '/tmp/inventory_delete_confirm.png', fullPage: true });
        console.log('   📸 /tmp/inventory_delete_confirm.png');
        // Cancel
        await page.locator('.ant-modal-confirm-btns button:first-child').click().catch(() => {});
      } else {
        console.log('   ❌ Delete modal did not appear!');
      }
    }

    // Test View/Edit functionality
    console.log('\n6. TESTING VIEW/EDIT...');
    const viewBtn = page.locator('button:has-text("View"), .anticon-eye').first();
    if (await viewBtn.count() > 0) {
      console.log('   Clicking view button...');
      await viewBtn.click();
      await page.waitForTimeout(1500);

      const drawerVisible = await page.locator('.ant-drawer').isVisible().catch(() => false);
      console.log(`   Drawer opened: ${drawerVisible}`);

      if (drawerVisible) {
        await page.screenshot({ path: '/tmp/inventory_view_drawer.png', fullPage: true });
        console.log('   📸 /tmp/inventory_view_drawer.png');
        await page.locator('.ant-drawer-close').click().catch(() => {});
      }
    }

    // Test Search
    console.log('\n7. TESTING SEARCH...');
    const searchInput = page.locator('input[placeholder*="Search"], .ant-input-search input').first();
    if (await searchInput.count() > 0) {
      console.log('   Found search input, typing...');
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      const rowsAfterSearch = await page.locator('tbody tr').count();
      console.log(`   Rows after search: ${rowsAfterSearch}`);
      await searchInput.clear();
    }

    // Test Tabs
    console.log('\n8. TESTING TABS...');
    const tabButtons = page.locator('.ant-tabs-tab');
    const tabCount = await tabButtons.count();
    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      const tabText = await tabButtons.nth(i).textContent();
      await tabButtons.nth(i).click();
      await page.waitForTimeout(1000);
      const rows = await page.locator('tbody tr').count();
      console.log(`   Tab "${tabText?.trim()}": ${rows} rows`);
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/inventory_final.png', fullPage: true });
    console.log('\n   📸 /tmp/inventory_final.png');

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Page loads: ${!inventoryUrl.includes('login') ? '✅' : '❌'}`);
    console.log(`Table visible: ${hasTable ? '✅' : '❌'}`);
    console.log(`Has data: ${rowCount > 0 ? '✅' : '⚠️ Empty'}`);
    console.log(`Delete modal works: Check screenshots`);

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/inventory_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
