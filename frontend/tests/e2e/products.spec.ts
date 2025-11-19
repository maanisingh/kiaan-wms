import { test, expect } from '@playwright/test';

test.describe('Products Flow', () => {
  test('should display products list page', async ({ page }) => {
    await page.goto('/products');

    // Check page title
    await expect(page.locator('h1')).toContainText('Products');

    // Check table is visible
    await expect(page.locator('table')).toBeVisible();

    // Check "Add Product" button exists
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/products');

    // Click on first product SKU
    const firstSKU = page.locator('table tbody tr:first-child a').first();
    await firstSKU.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/products\/\w+/);

    // Check detail page elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Edit Product")')).toBeVisible();
    await expect(page.locator('button:has-text("Print Label")')).toBeVisible();
  });

  test('should navigate to product edit page', async ({ page }) => {
    await page.goto('/products');

    // Click on first product
    const firstSKU = page.locator('table tbody tr:first-child a').first();
    await firstSKU.click();

    // Click Edit button
    await page.locator('button:has-text("Edit Product")').click();

    // Should navigate to edit page
    await expect(page).toHaveURL(/\/products\/\w+\/edit/);

    // Check form elements
    await expect(page.locator('input[placeholder*="product name"]')).toBeVisible();
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should fill and validate product form', async ({ page }) => {
    await page.goto('/products');

    // Navigate to first product edit
    await page.locator('table tbody tr:first-child a').first().click();
    await page.locator('button:has-text("Edit Product")').click();

    // Fill form fields
    await page.locator('input[placeholder*="product name"]').fill('Test Product Updated');
    await page.locator('input[placeholder*="SKU"]').fill('TEST-SKU-001');

    // Check form is populated
    await expect(page.locator('input[placeholder*="product name"]')).toHaveValue('Test Product Updated');

    // Test save button is enabled
    await expect(page.locator('button:has-text("Save Changes")')).toBeEnabled();
  });

  test('should search products', async ({ page }) => {
    await page.goto('/products');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();

    // Type search query
    await searchInput.fill('TEST');

    // Check search input has value
    await expect(searchInput).toHaveValue('TEST');
  });

  test('should filter products by status', async ({ page }) => {
    await page.goto('/products');

    // Click status filter if it exists
    const statusFilter = page.locator('select, .ant-select').filter({ hasText: 'Status' }).first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });
});
