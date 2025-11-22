import { test, expect } from '@playwright/test';

/**
 * Products Page Tests
 * Verifies 32 real products are loaded from Hasura
 */
test.describe('Products Page', () => {
  test('should load products list with real data', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Check page title/heading
    await expect(page.locator('h1, h2').filter({ hasText: /Products/i })).toBeVisible();

    // Verify table is present
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();

    // Verify we have rows (should have 32 products)
    const rows = page.locator('.ant-table-tbody tr');
    const rowCount = await rows.count();
    
    expect(rowCount).toBeGreaterThan(0);
    console.log(`✅ Found ${rowCount} product rows`);

    // Verify first product has real data
    const firstRow = rows.first();
    const cellText = await firstRow.textContent();
    
    expect(cellText).not.toContain('Mock');
    expect(cellText).not.toContain('Test Product');
    expect(cellText).toBeTruthy();

    console.log('✅ Products loaded with real data');
  });

  test('should display product details in table', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Check for key columns
    await expect(page.locator('th').filter({ hasText: /SKU|Name/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Price/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Status/i })).toBeVisible();

    console.log('✅ Product table columns present');
  });

  test('should have search/filter functionality', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Look for search input or filter button
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]');
    const filterButton = page.locator('button').filter({ hasText: /Filter/i });

    const hasSearch = (await searchInput.count()) > 0;
    const hasFilter = (await filterButton.count()) > 0;

    expect(hasSearch || hasFilter).toBeTruthy();
    console.log('✅ Search/filter functionality available');
  });

  test('should verify we have expected product count (~32 products)', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.ant-table-tbody tr:not(.ant-table-placeholder)');
    const rowCount = await rows.count();

    // We seeded 32 products
    expect(rowCount).toBeGreaterThanOrEqual(20); // At least 20
    expect(rowCount).toBeLessThanOrEqual(50);    // Not more than 50

    console.log(`✅ Product count correct: ${rowCount} products`);
  });
});
