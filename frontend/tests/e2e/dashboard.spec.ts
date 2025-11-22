import { test, expect } from '@playwright/test';

/**
 * Dashboard Page Tests
 * Verifies real data is loaded from Hasura GraphQL
 */
test.describe('Dashboard Page', () => {
  test('should load dashboard with real KPIs', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/Dashboard/i);

    // Verify main stats cards are present
    await expect(page.locator('text=/Total Products/i')).toBeVisible();
    await expect(page.locator('text=/Sales Orders/i')).toBeVisible();
    await expect(page.locator('text=/Total Inventory/i')).toBeVisible();

    // Verify we have real numbers (not 0 or placeholders)
    const statsCard = page.locator('.ant-statistic-content');
    const firstStatValue = await statsCard.first().textContent();
    expect(firstStatValue).not.toBe('0');
    expect(firstStatValue).not.toBe('--');
    expect(firstStatValue).not.toContain('Loading');

    console.log('✅ Dashboard loaded with real KPIs');
  });

  test('should display recent orders section', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for orders table or list
    const ordersSection = page.locator('text=/Recent Sales Orders/i');
    await expect(ordersSection).toBeVisible();

    console.log('✅ Recent orders section visible');
  });

  test('should not show loading spinners after load', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any async data loads

    // Verify no loading spinners
    const spinners = page.locator('.ant-spin');
    const spinnerCount = await spinners.count();
    expect(spinnerCount).toBe(0);

    console.log('✅ No loading spinners present');
  });
});
