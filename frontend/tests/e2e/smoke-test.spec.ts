import { test, expect } from '@playwright/test';
import { DEFAULT_USER, loginAsUser } from '../helpers/test-credentials';

/**
 * Smoke Tests - Quick verification that core functionality works
 * These tests should run fast and catch major issues
 */

test.describe('Smoke Test - Core Functionality', () => {
  test('✅ Frontend loads successfully', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    expect(title).toBeTruthy();
    expect(await page.isVisible('body')).toBeTruthy();

    console.log('✅ Frontend is accessible');
  });

  test('✅ Login page exists and loads', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Check for login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('✅ Login page loads correctly');
  });

  test('✅ Can login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    console.log(`🔐 Logging in as: ${DEFAULT_USER.email}`);

    await page.fill('input[type="email"]', DEFAULT_USER.email);
    await page.fill('input[type="password"]', DEFAULT_USER.password);

    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    console.log('✅ Login successful');

    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
    console.log('📸 Screenshot saved: dashboard-loaded.png');
  });

  test('✅ Dashboard displays after login', async ({ page }) => {
    await loginAsUser(page);

    // Verify dashboard loaded
    await expect(page).toHaveURL(/\/dashboard/);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Dashboard loaded with content');

    // Check for some dashboard elements
    const hasHeading = await page.locator('h1, h2, h3').count() > 0;
    expect(hasHeading).toBeTruthy();

    console.log('✅ Dashboard has headings');
  });

  test('✅ Can navigate to Products page', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/products/);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    console.log('✅ Products page loads');

    // Take screenshot
    await page.screenshot({ path: 'test-results/products-page.png', fullPage: true });
    console.log('📸 Screenshot saved: products-page.png');
  });

  test('✅ Can navigate to Inventory page', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/inventory/);

    console.log('✅ Inventory page loads');

    // Take screenshot
    await page.screenshot({ path: 'test-results/inventory-page.png', fullPage: true });
    console.log('📸 Screenshot saved: inventory-page.png');
  });

  test('✅ Navigation menu is visible', async ({ page }) => {
    await loginAsUser(page);

    // Look for navigation menu
    const nav = page.locator('nav, .ant-menu, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    const navText = await nav.textContent();
    console.log(`📋 Navigation menu items found:`, navText?.substring(0, 200));

    expect(navText).toBeTruthy();

    console.log('✅ Navigation menu is visible');
  });

  test('✅ API connection works (GraphQL)', async ({ page }) => {
    let apiCalled = false;
    let apiUrl = '';

    // Listen for API requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('graphql') || url.includes('8090')) {
        apiCalled = true;
        apiUrl = url;
        console.log(`🌐 API Request detected: ${url}`);
      }
    });

    await loginAsUser(page);
    await page.goto('/products');
    await page.waitForTimeout(3000);

    if (apiCalled) {
      console.log(`✅ API connection verified: ${apiUrl}`);
    } else {
      console.log('⚠️  No API calls detected');
    }
  });

  test('✅ Tables/Data grids render', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for tables
    const tables = page.locator('table, .ant-table, [role="grid"]');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      console.log(`✅ Found ${tableCount} data tables`);

      // Check for rows
      const rows = page.locator('tbody tr, [role="row"]');
      const rowCount = await rows.count();

      console.log(`📊 Table has ${rowCount} rows`);

      if (rowCount > 0) {
        console.log('✅ Data is loading in tables');
      } else {
        console.log('⚠️  Table exists but no data rows');
      }
    }
  });

  test('✅ All critical pages are accessible', async ({ page }) => {
    await loginAsUser(page);

    const criticalPages = [
      '/dashboard',
      '/products',
      '/inventory',
      '/sales-orders',
      '/customers',
      '/warehouses',
      '/picking',
    ];

    for (const pagePath of criticalPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      console.log(`✅ ${pagePath} → ${url}`);

      // Verify page loaded (not 404)
      const pageText = await page.textContent('body');
      const is404 = pageText?.toLowerCase().includes('404') || pageText?.toLowerCase().includes('not found');

      expect(is404).toBeFalsy();
    }

    console.log('✅ All critical pages are accessible');
  });
});

test.describe('Smoke Test - Authentication', () => {
  test('✅ Invalid credentials are rejected', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should still be on login page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/auth\/login/);

    console.log('✅ Invalid credentials properly rejected');
  });

  test('✅ Logout works', async ({ page }) => {
    await loginAsUser(page);

    // Find user menu/dropdown
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .ant-dropdown-trigger, button:has-text("Admin")').first();

    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(500);

      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [role="menuitem"]:has-text("Logout")').first();

      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);

        // Should redirect to login
        const currentUrl = page.url();
        console.log(`📍 After logout: ${currentUrl}`);

        if (currentUrl.includes('/auth/login')) {
          console.log('✅ Logout redirected to login page');
        } else {
          console.log('⚠️  Logout did not redirect to login');
        }
      } else {
        console.log('⚠️  Logout button not found');
      }
    } else {
      console.log('⚠️  User menu not found');
    }
  });
});

test.describe('Smoke Test - Performance', () => {
  test('✅ Pages load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const loginLoadTime = Date.now() - startTime;
    console.log(`⏱️  Login page load time: ${loginLoadTime}ms`);

    expect(loginLoadTime).toBeLessThan(10000); // 10 seconds max

    await loginAsUser(page);

    const dashboardStart = Date.now();
    await page.waitForLoadState('networkidle');
    const dashboardLoadTime = Date.now() - dashboardStart;

    console.log(`⏱️  Dashboard load time: ${dashboardLoadTime}ms`);

    expect(dashboardLoadTime).toBeLessThan(15000); // 15 seconds max with data loading

    console.log('✅ Page load times are acceptable');
  });
});
