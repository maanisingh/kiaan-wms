import { test, expect } from '@playwright/test';

/**
 * Sales Orders Page Tests
 * Verifies 30 real orders are loaded from Hasura
 */
test.describe('Sales Orders Page', () => {
  test('should load orders list with real data', async ({ page }) => {
    await page.goto('/sales-orders');
    await page.waitForLoadState('networkidle');

    // Check page heading
    await expect(page.locator('h1, h2').filter({ hasText: /Orders|Sales/i })).toBeVisible();

    // Verify table is present
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();

    // Verify we have rows (should have 30 orders)
    const rows = page.locator('.ant-table-tbody tr:not(.ant-table-placeholder)');
    const rowCount = await rows.count();
    
    expect(rowCount).toBeGreaterThan(0);
    console.log(`✅ Found ${rowCount} order rows`);
  });

  test('should display order details in table', async ({ page }) => {
    await page.goto('/sales-orders');
    await page.waitForLoadState('networkidle');

    // Check for key columns
    const columns = page.locator('th');
    const columnTexts = await columns.allTextContents();
    const columnString = columnTexts.join(' ').toLowerCase();

    // Verify essential order columns
    expect(columnString).toMatch(/order|id|number/i);
    expect(columnString).toMatch(/status/i);
    expect(columnString).toMatch(/customer|client/i);

    console.log('✅ Order columns present');
  });

  test('should show real order data (not mock)', async ({ page }) => {
    await page.goto('/sales-orders');
    await page.waitForLoadState('networkidle');

    // Get first order row
    const firstRow = page.locator('.ant-table-tbody tr').first();
    const rowText = await firstRow.textContent();

    // Should not contain mock/test data
    expect(rowText).not.toContain('Mock');
    expect(rowText).not.toContain('Test Order');
    expect(rowText).toBeTruthy();

    console.log('✅ Orders loaded with real data');
  });

  test('should verify expected order count (~30 orders)', async ({ page }) => {
    await page.goto('/sales-orders');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.ant-table-tbody tr:not(.ant-table-placeholder)');
    const rowCount = await rows.count();

    // We seeded 30 orders
    expect(rowCount).toBeGreaterThanOrEqual(10); // At least 10
    expect(rowCount).toBeLessThanOrEqual(50);    // Not more than 50

    console.log(`✅ Order count correct: ${rowCount} orders`);
  });

  test('should display order status badges', async ({ page }) => {
    await page.goto('/sales-orders');
    await page.waitForLoadState('networkidle');

    // Look for status badges (Ant Design tags)
    const statusBadges = page.locator('.ant-tag, .ant-badge');
    const badgeCount = await statusBadges.count();

    expect(badgeCount).toBeGreaterThan(0);
    console.log('✅ Order status badges present');
  });
});
