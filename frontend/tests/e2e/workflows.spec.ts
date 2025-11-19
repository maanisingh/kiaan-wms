import { test, expect } from '@playwright/test';

test.describe('Complete User Workflows', () => {
  test('Complete Product Creation Workflow', async ({ page }) => {
    // Step 1: Navigate to products
    await page.goto('/products');
    await expect(page.locator('h1')).toContainText('Products');

    // Step 2: Click Add Product
    await page.locator('button:has-text("Add Product")').click();

    // Step 3: Should navigate to new product page
    await expect(page).toHaveURL('/products/new');

    // Step 4: Fill product form
    await page.locator('input[placeholder*="product name"]').fill('Test Product Workflow');
    await page.locator('input[placeholder*="SKU"]').fill('TEST-WF-001');

    // Step 5: Submit form
    await page.locator('button:has-text("Create"), button:has-text("Save")').first().click();

    // Step 6: Should show success and redirect
    await expect(page.locator('.ant-message-success, text=/success/i')).toBeVisible({ timeout: 5000 });
  });

  test('Complete Warehouse Management Workflow', async ({ page }) => {
    // Step 1: Go to warehouses list
    await page.goto('/warehouses');

    // Step 2: View warehouse details
    const firstWarehouse = page.locator('button:has-text("View Details")').first();
    if (await firstWarehouse.isVisible()) {
      await firstWarehouse.click();

      // Step 3: Should show warehouse details
      await expect(page.locator('h1')).toBeVisible();

      // Step 4: Navigate to edit
      await page.locator('button:has-text("Edit")').first().click();

      // Step 5: Should be on edit page
      await expect(page).toHaveURL(/\/edit/);

      // Step 6: Modify warehouse data
      await page.locator('input[placeholder*="warehouse name"]').fill('Updated Warehouse Name');

      // Step 7: Can save changes
      await expect(page.locator('button:has-text("Save")')).toBeEnabled();
    }
  });

  test('Complete Sales Order Processing Flow', async ({ page }) => {
    // Step 1: Navigate to sales orders
    await page.goto('/sales-orders');
    await expect(page.locator('h1')).toContainText('Sales Orders');

    // Step 2: View order details
    const firstOrder = page.locator('table tbody tr:first-child a').first();
    await firstOrder.click();

    // Step 3: Check order status
    await expect(page.locator('.ant-tag')).toBeVisible();

    // Step 4: Navigate to edit order
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Step 5: Can modify order
      await expect(page).toHaveURL(/\/edit/);
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('Complete Purchase Order to Receiving Flow', async ({ page }) => {
    // Step 1: Create Purchase Order
    await page.goto('/purchase-orders');
    await page.locator('button:has-text("Create PO")').click();

    // Step 2: Modal should open
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Step 3: Fill PO form
    const supplierSelect = page.locator('.ant-modal .ant-select').first();
    if (await supplierSelect.isVisible()) {
      await supplierSelect.click();
      await page.locator('.ant-select-item').first().click();
    }

    // Step 4: Navigate to Goods Receiving
    await page.goto('/goods-receiving');

    // Step 5: Receive goods
    await page.locator('button:has-text("Receive")').click();

    // Step 6: Should open receiving modal
    await expect(page.locator('.ant-modal')).toBeVisible();
  });

  test('Complete Pick-Pack-Ship Workflow', async ({ page }) => {
    // Step 1: Start with Picking
    await page.goto('/picking');
    await expect(page.locator('h1')).toContainText('Pick');

    // Step 2: Create pick list
    await page.locator('button:has-text("Add New")').click();
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Step 3: Navigate to Packing
    await page.goto('/packing');
    await expect(page.locator('h1')).toContainText('Pack');

    // Step 4: Create packing slip
    await page.locator('button:has-text("Add New")').click();
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Step 5: Navigate to Shipments
    await page.goto('/shipments');
    await expect(page.locator('h1')).toContainText('Shipment');

    // Step 6: Create shipment
    await page.locator('button:has-text("Add New")').click();
    await expect(page.locator('.ant-modal')).toBeVisible();
  });

  test('Complete Return Processing Flow', async ({ page }) => {
    // Step 1: Navigate to returns
    await page.goto('/returns');

    // Step 2: Create new RMA
    await page.locator('button:has-text("Add New")').click();

    // Step 3: Fill RMA form
    await expect(page.locator('.ant-modal')).toBeVisible();

    const orderInput = page.locator('input[placeholder*="order"]').first();
    if (await orderInput.isVisible()) {
      await orderInput.fill('SO-2024-001');
    }

    // Step 4: Can submit RMA
    await expect(page.locator('.ant-modal button:has-text("OK")')).toBeEnabled();
  });

  test('Complete User Management Flow', async ({ page }) => {
    // Step 1: Navigate to users
    await page.goto('/users');

    // Step 2: Add new user
    await page.locator('button:has-text("Add New")').click();
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Step 3: Fill user details
    await page.locator('input[placeholder*="name"]').first().fill('Test User');
    await page.locator('input[type="email"]').first().fill('testuser@example.com');

    // Step 4: Submit
    await page.locator('button:has-text("OK")').click();

    // Step 5: Success message
    await expect(page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 });
  });

  test('Complete Inventory Adjustment Flow', async ({ page }) => {
    // Step 1: Go to inventory
    await page.goto('/inventory');

    // Step 2: Create stock adjustment
    await page.locator('button:has-text("Adjustment")').click();

    // Step 3: Should navigate to adjustments
    await expect(page).toHaveURL(/adjustment/);

    // Step 4: View adjustment history
    await expect(page.locator('h1, h2, h3')).toBeVisible();
  });
});
