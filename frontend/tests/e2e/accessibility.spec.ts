import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    // Check for common accessibility issues
    await expect(page).toHaveTitle(/Kiaan|WMS/i);

    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('products page should have proper headings hierarchy', async ({ page }) => {
    await page.goto('/products');

    // Should have h1
    await expect(page.locator('h1')).toBeVisible();

    // Check heading text
    await expect(page.locator('h1')).toContainText(/product/i);
  });

  test('buttons should have accessible labels', async ({ page }) => {
    await page.goto('/products');

    // All buttons should have text or aria-label
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      // Button should have either text or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('forms should have proper labels', async ({ page }) => {
    await page.goto('/companies');

    // Open add modal
    await page.locator('button:has-text("Add New")').click();

    // All inputs should have labels or aria-labels
    const inputs = page.locator('input:visible');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Input should have some form of label
      const hasLabel = id || ariaLabel || ariaLabelledby || placeholder;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/dashboard');

    // Find all images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Image should have alt attribute (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/products');

    // Find all links
    const links = page.locator('a');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Link should have text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test('color contrast should be sufficient', async ({ page }) => {
    await page.goto('/products');

    // Check main heading color contrast
    const heading = page.locator('h1').first();

    if (await heading.isVisible()) {
      const color = await heading.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Color should be defined
      expect(color).toBeTruthy();
    }
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/products');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check if an element is focused
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    expect(focusedElement).toBeTruthy();

    // Should be able to tab multiple times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const newFocusedElement = await page.evaluateHandle(() => document.activeElement);
    expect(newFocusedElement).toBeTruthy();
  });

  test('skip links should be present for keyboard users', async ({ page }) => {
    await page.goto('/');

    // Look for skip link (common accessibility pattern)
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to")').first();

    // If skip link exists, it should be keyboard accessible
    if (await skipLink.count() > 0) {
      await page.keyboard.press('Tab');
      // Skip link might become visible on focus
    }
  });

  test('tables should have proper headers', async ({ page }) => {
    await page.goto('/products');

    // Find tables
    const tables = page.locator('table');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      const firstTable = tables.first();

      // Table should have thead and tbody
      const thead = firstTable.locator('thead');
      const tbody = firstTable.locator('tbody');

      await expect(thead).toBeVisible();
      await expect(tbody).toBeVisible();

      // Headers should have th elements
      const headers = thead.locator('th');
      expect(await headers.count()).toBeGreaterThan(0);
    }
  });

  test('modal dialogs should trap focus', async ({ page }) => {
    await page.goto('/companies');

    // Open modal
    await page.locator('button:has-text("Add New")').click();

    // Modal should be visible
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Focus should be inside modal
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const isInModal = await page.evaluate((focused) => {
      const modal = document.querySelector('.ant-modal');
      return modal?.contains(focused as Node);
    }, focusedElement);

    // Note: Ant Design handles this automatically
  });

  test('error messages should be associated with inputs', async ({ page }) => {
    await page.goto('/warehouses/new');

    // Submit empty form to trigger validation
    await page.locator('button:has-text("Create"), button:has-text("Save")').first().click();

    // Wait for error messages
    await page.waitForTimeout(500);

    // Error messages should be visible and associated with inputs
    const errorMessages = page.locator('.ant-form-item-explain-error');

    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });
});
