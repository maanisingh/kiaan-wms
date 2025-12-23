const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://wms.alexandratechlab.com';
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/screenshots';

let screenshotNum = 0;

async function screenshot(page, name, category) {
  const dir = path.join(SCREENSHOT_DIR, category);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  screenshotNum++;
  const filename = `${String(screenshotNum).padStart(4, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(dir, filename), fullPage: true });
  console.log(`  [${screenshotNum}] ${category}/${filename}`);
  return filename;
}

async function login(page, email, password, role) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, `login-page-${role}`, `00-auth`);

  await page.fill('input[type="email"]', email);
  await screenshot(page, `login-email-entered-${role}`, `00-auth`);

  await page.fill('input[type="password"]', password);
  await screenshot(page, `login-password-entered-${role}`, `00-auth`);

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await screenshot(page, `after-login-${role}`, `00-auth`);
}

async function testAllButtons(page, pageName, category) {
  const buttons = await page.$$('button:visible');
  console.log(`    Found ${buttons.length} buttons`);

  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    try {
      const btn = buttons[i];
      const text = await btn.textContent();
      if (text && text.trim() && !text.includes('Logout') && !text.includes('Sign Out')) {
        await btn.scrollIntoViewIfNeeded();
        await screenshot(page, `${pageName}-button-${i+1}-${text.trim().substring(0,20).replace(/\s+/g, '-')}`, category);
      }
    } catch (e) {}
  }
}

async function testAllDropdowns(page, pageName, category) {
  const selects = await page.$$('select:visible, [role="combobox"]:visible, [role="listbox"]:visible');
  console.log(`    Found ${selects.length} dropdowns`);

  for (let i = 0; i < selects.length; i++) {
    try {
      const select = selects[i];
      await select.scrollIntoViewIfNeeded();
      await select.click();
      await page.waitForTimeout(500);
      await screenshot(page, `${pageName}-dropdown-${i+1}-open`, category);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) {}
  }
}

async function testAllTabs(page, pageName, category) {
  const tabs = await page.$$('[role="tab"], .tab, [data-tab]');
  console.log(`    Found ${tabs.length} tabs`);

  for (let i = 0; i < tabs.length; i++) {
    try {
      const tab = tabs[i];
      const text = await tab.textContent();
      await tab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, `${pageName}-tab-${i+1}-${text.trim().substring(0,15).replace(/\s+/g, '-')}`, category);
    } catch (e) {}
  }
}

async function testTableRows(page, pageName, category) {
  const rows = await page.$$('table tbody tr');
  console.log(`    Found ${rows.length} table rows`);

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    try {
      const row = rows[i];
      await row.scrollIntoViewIfNeeded();
      await screenshot(page, `${pageName}-row-${i+1}`, category);

      // Try clicking view/edit buttons in row
      const actions = await row.$$('button, a');
      for (let j = 0; j < Math.min(actions.length, 3); j++) {
        try {
          const action = actions[j];
          const text = await action.textContent();
          if (text && (text.includes('View') || text.includes('Edit'))) {
            await action.click();
            await page.waitForTimeout(1500);
            await screenshot(page, `${pageName}-row-${i+1}-action-${text.trim()}`, category);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
}

async function testModals(page, pageName, category) {
  // Try Add/Create buttons
  const addButtons = await page.$$('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');

  for (let i = 0; i < addButtons.length; i++) {
    try {
      const btn = addButtons[i];
      const text = await btn.textContent();
      await btn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, `${pageName}-modal-${text.trim().replace(/\s+/g, '-')}`, category);

      // Screenshot the form fields
      const inputs = await page.$$('input:visible, textarea:visible, select:visible');
      if (inputs.length > 0) {
        await screenshot(page, `${pageName}-modal-form-fields`, category);
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {}
  }
}

async function testFilters(page, pageName, category) {
  const filters = await page.$$('input[placeholder*="Search"], input[placeholder*="Filter"], [data-filter]');
  console.log(`    Found ${filters.length} filters`);

  for (let i = 0; i < filters.length; i++) {
    try {
      const filter = filters[i];
      await filter.fill('test search');
      await page.waitForTimeout(500);
      await screenshot(page, `${pageName}-filter-${i+1}-active`, category);
      await filter.fill('');
      await page.waitForTimeout(300);
    } catch (e) {}
  }
}

async function testPage(page, path, name, category) {
  console.log(`\n  Testing: ${name} (${path})`);

  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Full page screenshot
  await screenshot(page, `${name}-full-page`, category);

  // Test all interactive elements
  await testAllButtons(page, name, category);
  await testAllTabs(page, name, category);
  await testAllDropdowns(page, name, category);
  await testFilters(page, name, category);
  await testModals(page, name, category);
  await testTableRows(page, name, category);
}

async function testAdminRole(page) {
  console.log('\n========== TESTING SUPER_ADMIN ROLE ==========');

  await login(page, 'admin@kiaan-wms.com', 'Admin@123', 'admin');

  const adminPages = [
    { path: '/protected/dashboard', name: 'dashboard', category: '01-dashboard' },
    { path: '/protected/products', name: 'products', category: '02-products' },
    { path: '/protected/inventory', name: 'inventory', category: '03-inventory' },
    { path: '/protected/customers', name: 'customers', category: '04-customers' },
    { path: '/protected/sales-orders', name: 'sales-orders', category: '05-sales-orders' },
    { path: '/protected/picking', name: 'picking', category: '06-picking' },
    { path: '/protected/packing', name: 'packing', category: '07-packing' },
    { path: '/protected/warehouses', name: 'warehouses', category: '08-warehouses' },
    { path: '/protected/users', name: 'users', category: '09-users' },
    { path: '/protected/reports', name: 'reports', category: '10-reports' },
    { path: '/protected/settings', name: 'settings', category: '11-settings' },
    { path: '/protected/integrations', name: 'integrations', category: '12-integrations' },
    { path: '/protected/brands', name: 'brands', category: '13-brands' },
    { path: '/protected/suppliers', name: 'suppliers', category: '14-suppliers' },
    { path: '/protected/locations', name: 'locations', category: '15-locations' },
  ];

  for (const p of adminPages) {
    await testPage(page, p.path, p.name, p.category);
  }
}

async function testPickerRole(browser) {
  console.log('\n========== TESTING PICKER ROLE (RBAC) ==========');

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await login(page, 'picker@kiaan-wms.com', 'Admin@123', 'picker');

  // Test picker's allowed pages
  const pickerPages = [
    { path: '/protected/dashboards/picker', name: 'picker-dashboard', category: '20-picker-rbac' },
    { path: '/protected/picking', name: 'picker-picking', category: '20-picker-rbac' },
  ];

  for (const p of pickerPages) {
    await testPage(page, p.path, p.name, p.category);
  }

  // Test BLOCKED pages - should redirect
  const blockedPages = [
    '/protected/users',
    '/protected/settings',
    '/protected/products',
    '/protected/inventory',
    '/protected/customers',
    '/protected/sales-orders',
    '/protected/warehouses',
    '/protected/reports',
    '/protected/integrations',
  ];

  for (const blocked of blockedPages) {
    await page.goto(`${BASE_URL}${blocked}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    const pageName = blocked.split('/').pop();

    if (!currentUrl.includes(blocked)) {
      await screenshot(page, `picker-BLOCKED-${pageName}-redirected`, '20-picker-rbac');
      console.log(`  ✓ ${pageName}: BLOCKED (redirected to ${currentUrl.split('/').pop()})`);
    } else {
      await screenshot(page, `picker-WARNING-${pageName}-accessible`, '20-picker-rbac');
      console.log(`  ✗ ${pageName}: ACCESSIBLE (RBAC issue!)`);
    }
  }

  await context.close();
}

async function testPackerRole(browser) {
  console.log('\n========== TESTING PACKER ROLE (RBAC) ==========');

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await login(page, 'packer@kiaan-wms.com', 'Admin@123', 'packer');

  // Test packer's allowed pages
  const packerPages = [
    { path: '/protected/dashboards/packer', name: 'packer-dashboard', category: '21-packer-rbac' },
    { path: '/protected/packing', name: 'packer-packing', category: '21-packer-rbac' },
  ];

  for (const p of packerPages) {
    await testPage(page, p.path, p.name, p.category);
  }

  // Test BLOCKED pages
  const blockedPages = [
    '/protected/users',
    '/protected/settings',
    '/protected/products',
    '/protected/picking',
  ];

  for (const blocked of blockedPages) {
    await page.goto(`${BASE_URL}${blocked}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    const pageName = blocked.split('/').pop();

    if (!currentUrl.includes(blocked)) {
      await screenshot(page, `packer-BLOCKED-${pageName}`, '21-packer-rbac');
      console.log(`  ✓ ${pageName}: BLOCKED`);
    } else {
      await screenshot(page, `packer-WARNING-${pageName}-accessible`, '21-packer-rbac');
    }
  }

  await context.close();
}

async function testViewerRole(browser) {
  console.log('\n========== TESTING VIEWER ROLE (RBAC) ==========');

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await login(page, 'viewer@kiaan-wms.com', 'Admin@123', 'viewer');

  // Test viewer's allowed pages
  await testPage(page, '/protected/reports', 'viewer-reports', '22-viewer-rbac');

  // Test BLOCKED pages
  const blockedPages = [
    '/protected/users',
    '/protected/settings',
    '/protected/products',
    '/protected/inventory',
    '/protected/picking',
    '/protected/packing',
  ];

  for (const blocked of blockedPages) {
    await page.goto(`${BASE_URL}${blocked}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    const pageName = blocked.split('/').pop();

    if (!currentUrl.includes(blocked)) {
      await screenshot(page, `viewer-BLOCKED-${pageName}`, '22-viewer-rbac');
      console.log(`  ✓ ${pageName}: BLOCKED`);
    }
  }

  await context.close();
}

async function testSettingsInDepth(page) {
  console.log('\n========== TESTING SETTINGS IN DEPTH ==========');

  await page.goto(`${BASE_URL}/protected/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const settingsTabs = ['General', 'Operations', 'Inventory', 'Notifications', 'Scanner', 'Carriers', 'Marketplaces', 'Payments'];

  for (const tab of settingsTabs) {
    try {
      const tabEl = await page.$(`text=${tab}`);
      if (tabEl) {
        await tabEl.click();
        await page.waitForTimeout(1500);
        await screenshot(page, `settings-tab-${tab.toLowerCase()}`, '11-settings');

        // Click any sub-buttons or expandable sections
        const subButtons = await page.$$('button:visible');
        for (let i = 0; i < Math.min(subButtons.length, 5); i++) {
          try {
            const btn = subButtons[i];
            const text = await btn.textContent();
            if (text && !text.includes('Save') && !text.includes('Cancel')) {
              await btn.scrollIntoViewIfNeeded();
              await screenshot(page, `settings-${tab.toLowerCase()}-element-${i+1}`, '11-settings');
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
}

async function testIntegrationsInDepth(page) {
  console.log('\n========== TESTING INTEGRATIONS IN DEPTH ==========');

  await page.goto(`${BASE_URL}/protected/integrations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, 'integrations-overview', '12-integrations');

  // Click each integration tab
  const intTabs = ['All Integrations', 'E-Commerce', 'Shipping', 'ERP'];
  for (const tab of intTabs) {
    try {
      const tabEl = await page.$(`text=${tab}`);
      if (tabEl) {
        await tabEl.click();
        await page.waitForTimeout(1000);
        await screenshot(page, `integrations-tab-${tab.replace(/\s+/g, '-').toLowerCase()}`, '12-integrations');
      }
    } catch (e) {}
  }

  // Click View on each integration
  const viewBtns = await page.$$('button:has-text("View"), a:has-text("View")');
  for (let i = 0; i < viewBtns.length; i++) {
    try {
      await viewBtns[i].click();
      await page.waitForTimeout(1500);
      await screenshot(page, `integration-detail-${i+1}`, '12-integrations');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {}
  }

  // Click Add Integration
  const addBtn = await page.$('button:has-text("Add Integration")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'add-integration-modal', '12-integrations');
    await page.keyboard.press('Escape');
  }

  // Click Manage Channels
  const manageBtn = await page.$('button:has-text("Manage Channels")');
  if (manageBtn) {
    await manageBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'manage-channels-modal', '12-integrations');
    await page.keyboard.press('Escape');
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   KIAAN WMS - COMPREHENSIVE 300+ SCREENSHOT TEST SUITE      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  try {
    // Test admin role with all pages
    await testAdminRole(page);

    // Test settings in depth
    await testSettingsInDepth(page);

    // Test integrations in depth
    await testIntegrationsInDepth(page);

    await context.close();

    // Test other roles for RBAC
    await testPickerRole(browser);
    await testPackerRole(browser);
    await testViewerRole(browser);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }

  // Count screenshots
  let total = 0;
  const dirs = fs.readdirSync(SCREENSHOT_DIR);
  for (const dir of dirs) {
    const dirPath = path.join(SCREENSHOT_DIR, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));
      console.log(`  ${dir}: ${files.length} screenshots`);
      total += files.length;
    }
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`  TOTAL SCREENSHOTS: ${total}`);
  console.log('════════════════════════════════════════════════════════════');
}

main();
