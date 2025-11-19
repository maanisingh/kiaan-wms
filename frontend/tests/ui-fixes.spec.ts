import { test, expect } from '@playwright/test';

// Base URL configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('WMS UI Fixes Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
  });

  test.describe('Admin Dashboard Tests', () => {

    test('Admin Dashboard - New Order button should navigate to sales order form', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Find and click the "New Order" button
      const newOrderButton = page.getByRole('button', { name: /new order/i }).first();
      await expect(newOrderButton).toBeVisible();
      await newOrderButton.click();

      // Verify navigation to new sales order page
      await expect(page).toHaveURL(/\/sales-orders\/new/);
      await expect(page.getByRole('heading', { name: /create new sales order/i })).toBeVisible();
    });

    test('Quick Actions - Create Order button should work', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Scroll to quick actions section
      const createOrderButton = page.getByRole('button', { name: /create order/i });
      await createOrderButton.scrollIntoViewIfNeeded();
      await createOrderButton.click();

      await expect(page).toHaveURL(/\/sales-orders\/new/);
    });
  });

  test.describe('Warehouses Module Tests', () => {

    test('Warehouses - Add Warehouse button should open form', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses`);

      // Find and click "Add Warehouse" button
      const addButton = page.getByRole('button', { name: /add warehouse/i });
      await expect(addButton).toBeVisible();
      await addButton.click();

      // Verify navigation to new warehouse page
      await expect(page).toHaveURL(/\/warehouses\/new/);
      await expect(page.getByRole('heading', { name: /add new warehouse/i })).toBeVisible();

      // Verify form fields are present
      await expect(page.getByLabel(/warehouse name/i)).toBeVisible();
      await expect(page.getByLabel(/warehouse code/i)).toBeVisible();
    });

    test('Warehouses - Form should have all required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses/new`);

      // Check all major form fields exist
      await expect(page.getByLabel(/warehouse name/i)).toBeVisible();
      await expect(page.getByLabel(/warehouse code/i)).toBeVisible();
      await expect(page.getByLabel(/type/i)).toBeVisible();
      await expect(page.getByLabel(/street address/i)).toBeVisible();
      await expect(page.getByLabel(/city/i)).toBeVisible();
      await expect(page.getByLabel(/state/i)).toBeVisible();

      // Check submit button exists
      await expect(page.getByRole('button', { name: /create warehouse/i })).toBeVisible();
    });
  });

  test.describe('Products Module Tests', () => {

    test('Products - Add Product button should open form', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);

      const addButton = page.getByRole('button', { name: /add product/i });
      await expect(addButton).toBeVisible();
      await addButton.click();

      await expect(page).toHaveURL(/\/products\/new/);
      await expect(page.getByRole('heading', { name: /add new product/i })).toBeVisible();
    });

    test('Products - Form should have all required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/products/new`);

      // Check form fields
      await expect(page.getByLabel(/product name/i)).toBeVisible();
      await expect(page.getByLabel(/sku/i)).toBeVisible();
      await expect(page.getByLabel(/cost price/i)).toBeVisible();
      await expect(page.getByLabel(/selling price/i)).toBeVisible();

      await expect(page.getByRole('button', { name: /create product/i })).toBeVisible();
    });
  });

  test.describe('Inventory Module Tests', () => {

    test('Inventory - Stock Adjustment should open form', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory/adjustments`);

      // Look for add/new adjustment button
      const newAdjustmentButton = page.getByRole('link', { name: /new adjustment|add adjustment/i }).or(
        page.getByRole('button', { name: /new adjustment|add adjustment/i })
      );

      if (await newAdjustmentButton.count() > 0) {
        await newAdjustmentButton.first().click();
        await expect(page).toHaveURL(/\/inventory\/adjustments\/new/);
      }
    });

    test('Inventory Adjustments - Form should work', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory/adjustments/new`);

      await expect(page.getByRole('heading', { name: /new stock adjustment/i })).toBeVisible();
      await expect(page.getByLabel(/adjustment number/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /add item/i })).toBeVisible();
    });
  });

  test.describe('Outbound Module Tests', () => {

    test('Sales Orders - New Order button should work', async ({ page }) => {
      await page.goto(`${BASE_URL}/sales-orders`);

      const newOrderButton = page.getByRole('button', { name: /new order/i }).or(
        page.getByRole('link', { name: /new order/i })
      );
      await expect(newOrderButton.first()).toBeVisible();
      await newOrderButton.first().click();

      await expect(page).toHaveURL(/\/sales-orders\/new/);
    });

    test('Sales Orders - View Order should navigate to detail page', async ({ page }) => {
      await page.goto(`${BASE_URL}/sales-orders`);

      // Click first "View" button in the table
      const viewButton = page.getByRole('button', { name: /view/i }).first();

      if (await viewButton.count() > 0) {
        await viewButton.click();

        // Should navigate to order detail page
        await expect(page).toHaveURL(/\/sales-orders\/[^/]+/);
        await expect(page.getByRole('heading', { name: /order/i })).toBeVisible();
      }
    });
  });

  test.describe('Customer Section Tests', () => {

    test('Customers - Delete button should show confirmation dialog', async ({ page }) => {
      await page.goto(`${BASE_URL}/customers`);

      // Set up dialog handler
      page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain('delete');
        await dialog.dismiss();
      });

      // Click delete button
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();

      if (await deleteButton.count() > 0) {
        await deleteButton.click();
      }
    });
  });

  test.describe('Role-Based Dashboard Tests', () => {

    test('Manager Dashboard should be accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboards/manager`);

      await expect(page.getByRole('heading', { name: /manager dashboard/i })).toBeVisible();
      await expect(page.getByText(/total orders/i)).toBeVisible();
      await expect(page.getByText(/active staff/i)).toBeVisible();
    });

    test('Warehouse Staff Dashboard should be accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboards/warehouse-staff`);

      await expect(page.getByRole('heading', { name: /warehouse staff dashboard/i })).toBeVisible();
      await expect(page.getByText(/received today/i)).toBeVisible();
    });

    test('Picker Dashboard should be accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboards/picker`);

      await expect(page.getByRole('heading', { name: /picker dashboard/i })).toBeVisible();
      await expect(page.getByText(/orders picked/i)).toBeVisible();
    });

    test('Packer Dashboard should be accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboards/packer`);

      await expect(page.getByRole('heading', { name: /packer dashboard/i })).toBeVisible();
      await expect(page.getByText(/orders packed/i)).toBeVisible();
    });
  });

  test.describe('Navigation Tests', () => {

    test('All critical navigation links should work', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Test main navigation items
      const navigationTests = [
        { link: /warehouses/i, expectedUrl: /warehouses/ },
        { link: /products/i, expectedUrl: /products/ },
        { link: /inventory/i, expectedUrl: /inventory/ },
        { link: /sales.*orders/i, expectedUrl: /sales-orders/ },
      ];

      for (const { link, expectedUrl } of navigationTests) {
        await page.goto(`${BASE_URL}/dashboard`);
        const navLink = page.getByRole('link', { name: link }).first();

        if (await navLink.count() > 0) {
          await navLink.click();
          await expect(page).toHaveURL(expectedUrl);
          await page.goBack();
        }
      }
    });
  });

  test.describe('Form Validation Tests', () => {

    test('Warehouse form should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses/new`);

      // Try to submit without filling required fields
      await page.getByRole('button', { name: /create warehouse/i }).click();

      // Should show validation messages
      // Note: Ant Design shows validation on form submit
      await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
    });

    test('Product form should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/products/new`);

      await page.getByRole('button', { name: /create product/i }).click();

      await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible({ timeout: 3000 });
    });
  });
});
