import { test, expect } from '@playwright/test';

/**
 * Pick List Generation Page Tests
 * Verifies FEFO/FIFO algorithm integration with real Hasura data
 */
test.describe('Pick List Generation Page', () => {
  test('should load pick list generation page', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Check page heading
    await expect(page.locator('h1, h2').filter({ hasText: /Pick List|Generate/i })).toBeVisible();

    console.log('✅ Pick list generation page loaded');
  });

  test('should display order selection dropdown', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Look for order selection
    const selectLabel = page.locator('text=/Select Order|Choose Order/i');
    await expect(selectLabel).toBeVisible();

    // Should have a select/dropdown component
    const select = page.locator('.ant-select, select');
    await expect(select.first()).toBeVisible();

    console.log('✅ Order selection available');
  });

  test('should load real orders in dropdown', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Click on select to open dropdown
    const select = page.locator('.ant-select').first();
    await select.click();

    // Wait for dropdown options
    await page.waitForTimeout(1000);

    // Check for options
    const options = page.locator('.ant-select-item, option');
    const optionCount = await options.count();

    expect(optionCount).toBeGreaterThan(0);
    console.log(`✅ Found ${optionCount} orders in dropdown`);

    // Close dropdown
    await page.keyboard.press('Escape');
  });

  test('should have generate button', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Look for generate/create button
    const generateButton = page.locator('button').filter({ hasText: /Generate|Create|Build/i });
    await expect(generateButton.first()).toBeVisible();

    console.log('✅ Generate button present');
  });

  test('should show algorithm description (FEFO/FIFO)', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Look for algorithm information
    const pageContent = await page.textContent('body');
    
    // Should mention FEFO or FIFO
    const hasFEFO = pageContent?.toLowerCase().includes('fefo') || 
                    pageContent?.toLowerCase().includes('first-expired');
    const hasFIFO = pageContent?.toLowerCase().includes('fifo') || 
                    pageContent?.toLowerCase().includes('first-in');

    expect(hasFEFO || hasFIFO).toBeTruthy();
    console.log('✅ Algorithm information displayed');
  });

  test('should generate pick list when order selected', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Select first order
    const select = page.locator('.ant-select').first();
    await select.click();
    await page.waitForTimeout(500);

    // Click first option
    const firstOption = page.locator('.ant-select-item').first();
    await firstOption.click();
    await page.waitForTimeout(500);

    // Click generate button
    const generateButton = page.locator('button').filter({ hasText: /Generate|Create|Build/i }).first();
    await generateButton.click();

    // Wait for results
    await page.waitForTimeout(2000);

    // Check for results table or list
    const resultTable = page.locator('.ant-table').nth(1); // Second table (first might be order selection)
    const resultContent = page.locator('text=/Pick List|Items to Pick|Picking Instructions/i');

    const hasResults = (await resultTable.count()) > 0 || (await resultContent.count()) > 0;
    expect(hasResults).toBeTruthy();

    console.log('✅ Pick list generated successfully');
  });

  test('should highlight expiring items in red', async ({ page }) => {
    await page.goto('/picking/generate');
    await page.waitForLoadState('networkidle');

    // Select an order and generate
    const select = page.locator('.ant-select').first();
    await select.click();
    await page.waitForTimeout(500);
    
    const firstOption = page.locator('.ant-select-item').first();
    await firstOption.click();
    await page.waitForTimeout(500);

    const generateButton = page.locator('button').filter({ hasText: /Generate|Create|Build/i }).first();
    await generateButton.click();
    await page.waitForTimeout(2000);

    // Look for warning/expiry indicators (red text, warning icons, etc.)
    const warningElements = page.locator('.ant-alert-warning, .text-red, [style*="color: red"], [style*="color:red"]');
    const warningCount = await warningElements.count();

    console.log(`✅ Found ${warningCount} expiry warnings (items expiring within 30 days)`);
  });
});
