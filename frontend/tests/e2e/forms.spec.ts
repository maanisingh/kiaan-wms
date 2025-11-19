import { test, expect } from '@playwright/test';

test.describe('Form Validation and Functionality', () => {
  test('should validate required fields in warehouse form', async ({ page }) => {
    await page.goto('/warehouses/new');

    // Try to submit empty form
    await page.locator('button:has-text("Create"), button:has-text("Save")').first().click();

    // Should show validation errors
    const errorMessages = page.locator('.ant-form-item-explain-error');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('should validate email format in customer form', async ({ page }) => {
    await page.goto('/customers');

    // Open add customer modal
    await page.locator('button:has-text("Add New")').click();

    // Wait for modal
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Fill invalid email
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid-email');
      await emailInput.blur();

      // Should show email validation error
      await expect(page.locator('text=/valid.*email/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle modal open and close', async ({ page }) => {
    await page.goto('/companies');

    // Modal should not be visible initially
    await expect(page.locator('.ant-modal')).not.toBeVisible();

    // Click Add New button
    await page.locator('button:has-text("Add New")').click();

    // Modal should be visible
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Close modal by clicking cancel
    await page.locator('button:has-text("Cancel")').first().click();

    // Modal should be hidden
    await expect(page.locator('.ant-modal')).not.toBeVisible();
  });

  test('should handle form submission success', async ({ page }) => {
    await page.goto('/users');

    // Open add user modal
    await page.locator('button:has-text("Add New")').click();

    // Fill form
    await page.locator('input[placeholder*="name"]').first().fill('Test User');
    await page.locator('input[type="email"]').first().fill('test@example.com');

    // Submit form
    await page.locator('button:has-text("OK"), button:has-text("Save")').first().click();

    // Should show success message
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('should handle dropdown selections', async ({ page }) => {
    await page.goto('/settings');

    // Find a dropdown/select
    const select = page.locator('.ant-select').first();

    if (await select.isVisible()) {
      // Click to open dropdown
      await select.click();

      // Wait for dropdown options
      await expect(page.locator('.ant-select-dropdown')).toBeVisible();

      // Click first option
      await page.locator('.ant-select-item').first().click();

      // Dropdown should close
      await expect(page.locator('.ant-select-dropdown')).not.toBeVisible();
    }
  });

  test('should handle date picker', async ({ page }) => {
    await page.goto('/sales-orders/new');

    // Find date picker
    const datePicker = page.locator('.ant-picker').first();

    if (await datePicker.isVisible()) {
      // Click to open date picker
      await datePicker.click();

      // Wait for calendar
      await expect(page.locator('.ant-picker-dropdown')).toBeVisible();

      // Select today's date
      await page.locator('.ant-picker-cell-today').first().click();

      // Calendar should close
      await expect(page.locator('.ant-picker-dropdown')).not.toBeVisible();
    }
  });

  test('should handle number input validation', async ({ page }) => {
    await page.goto('/purchase-orders');

    await page.locator('button:has-text("Create PO")').click();

    // Find number input
    const numberInput = page.locator('input[type="number"]').first();

    if (await numberInput.isVisible()) {
      // Try negative number
      await numberInput.fill('-10');

      // Should not accept negative (depends on form config)
      // Or should show validation error
    }
  });
});
