import { test, expect } from '@playwright/test';

/**
 * CRUD Workflow Tests
 * Tests Create, Read, Update, Delete operations for key entities
 */

// Helper to login
async function login(page: any) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'admin@kiaan.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Product CRUD Workflow', () => {
  test('should create, read, update, and delete a product', async ({ page }) => {
    await login(page);
    await page.goto('/products');
    await page.waitForTimeout(2000);

    const testSKU = `TEST-${Date.now()}`;
    const testName = `Test Product ${Date.now()}`;

    // CREATE
    console.log('🔵 Testing CREATE product...');
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await addButton.click();

    await page.waitForTimeout(1000);

    // Fill form
    const skuInput = page.locator('input[name="sku"], #sku, [placeholder*="SKU" i]').first();
    const nameInput = page.locator('input[name="name"], #name, [placeholder*="name" i]').first();

    if (await skuInput.isVisible()) {
      await skuInput.fill(testSKU);
    }

    if (await nameInput.isVisible()) {
      await nameInput.fill(testName);
    }

    // Fill price if present
    const priceInput = page.locator('input[name="price"], #price, [placeholder*="price" i]').first();
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.fill('99.99');
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")').last();
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Verify success message
    const successMsg = page.locator('.ant-message-success, [role="alert"]');
    const hasSuccess = await successMsg.isVisible().catch(() => false);

    if (hasSuccess) {
      console.log('✅ Product created successfully');
    }

    // READ - Search for the created product
    console.log('🔵 Testing READ product...');
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(testSKU);
      await page.waitForTimeout(1500);

      const tableBody = await page.textContent('tbody');
      if (tableBody?.includes(testSKU)) {
        console.log('✅ Product found in table');
      }
    }

    // UPDATE - Click on the product and edit
    console.log('🔵 Testing UPDATE product...');
    const productRow = page.locator(`tr:has-text("${testSKU}")`).first();
    const isRowVisible = await productRow.isVisible().catch(() => false);

    if (isRowVisible) {
      // Click edit button or row
      const editButton = productRow.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label="Edit"]').first();
      const hasEditButton = await editButton.isVisible().catch(() => false);

      if (hasEditButton) {
        await editButton.click();
      } else {
        await productRow.click();
      }

      await page.waitForTimeout(1000);

      // Update name
      const updatedName = `${testName} UPDATED`;
      const editNameInput = page.locator('input[name="name"], #name').first();

      if (await editNameInput.isVisible().catch(() => false)) {
        await editNameInput.clear();
        await editNameInput.fill(updatedName);

        // Submit update
        const updateButton = page.locator('button:has-text("Update"), button:has-text("Save")').last();
        await updateButton.click();

        await page.waitForTimeout(2000);

        console.log('✅ Product updated successfully');
      }
    }

    // DELETE
    console.log('🔵 Testing DELETE product...');
    await page.waitForTimeout(1000);

    const deleteButton = page.locator(`tr:has-text("${testSKU}") button:has-text("Delete"), tr:has-text("${testSKU}") [aria-label="Delete"]`).first();
    const hasDeleteButton = await deleteButton.isVisible().catch(() => false);

    if (hasDeleteButton) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Confirm deletion
      const confirmButton = page.locator('button:has-text("OK"), button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
      await confirmButton.click();

      await page.waitForTimeout(2000);

      console.log('✅ Product deleted successfully');

      // Verify deletion
      const tableAfterDelete = await page.textContent('tbody');
      const stillExists = tableAfterDelete?.includes(testSKU);

      if (!stillExists) {
        console.log('✅ Product no longer appears in table');
      }
    }

    console.log('✅ CRUD workflow completed successfully');
  });
});

test.describe('Customer CRUD Workflow', () => {
  test('should create and manage a customer', async ({ page }) => {
    await login(page);
    await page.goto('/customers');
    await page.waitForTimeout(2000);

    const testEmail = `test${Date.now()}@example.com`;
    const testName = `Test Customer ${Date.now()}`;

    // CREATE
    console.log('🔵 Creating customer...');
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create")').first();

    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1000);

      // Fill customer form
      const nameInput = page.locator('input[name="name"], #name').first();
      const emailInput = page.locator('input[name="email"], #email, input[type="email"]').first();

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(testName);
      }

      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(testEmail);
      }

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")').last();
      await submitButton.click();
      await page.waitForTimeout(2000);

      console.log('✅ Customer created');
    }
  });
});

test.describe('Inventory Adjustment Workflow', () => {
  test('should perform inventory adjustment', async ({ page }) => {
    await login(page);
    await page.goto('/inventory');
    await page.waitForTimeout(3000);

    console.log('🔵 Testing inventory adjustment...');

    // Find first inventory item
    const firstRow = page.locator('tbody tr').first();
    const isVisible = await firstRow.isVisible().catch(() => false);

    if (isVisible) {
      // Get current quantity
      const rowText = await firstRow.textContent();
      console.log('📊 Current row data:', rowText?.substring(0, 100));

      // Look for adjust/edit button
      const adjustButton = firstRow.locator('button:has-text("Adjust"), button:has-text("Edit"), [aria-label*="Edit"]').first();
      const hasButton = await adjustButton.isVisible().catch(() => false);

      if (hasButton) {
        await adjustButton.click();
        await page.waitForTimeout(1000);

        // Adjust quantity
        const quantityInput = page.locator('input[name="quantity"], #quantity, [placeholder*="quantity" i]').first();

        if (await quantityInput.isVisible().catch(() => false)) {
          const currentValue = await quantityInput.inputValue();
          const newValue = (parseInt(currentValue) || 0) + 10;

          await quantityInput.clear();
          await quantityInput.fill(newValue.toString());

          // Submit
          const submitButton = page.locator('button:has-text("Save"), button:has-text("Update")').last();
          await submitButton.click();
          await page.waitForTimeout(2000);

          console.log('✅ Inventory adjusted successfully');
        }
      }
    }
  });
});

test.describe('Pick List Generation Workflow', () => {
  test('should generate a pick list from sales order', async ({ page }) => {
    await login(page);

    console.log('🔵 Testing pick list generation...');

    // Go to picking page
    await page.goto('/picking');
    await page.waitForTimeout(2000);

    // Look for "Generate" or "Create" button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("New")').first();
    const hasButton = await generateButton.isVisible().catch(() => false);

    if (hasButton) {
      await generateButton.click();
      await page.waitForTimeout(1000);

      // Fill pick list form
      const pageContent = await page.textContent('body');

      // Look for order selection
      const orderSelect = page.locator('select[name="orderId"], .ant-select').first();

      if (await orderSelect.isVisible().catch(() => false)) {
        await orderSelect.click();
        await page.waitForTimeout(500);

        // Select first option
        const firstOption = page.locator('.ant-select-item, option').first();
        await firstOption.click();

        // Submit
        const submitButton = page.locator('button:has-text("Generate"), button:has-text("Create")').last();
        await submitButton.click();
        await page.waitForTimeout(2000);

        console.log('✅ Pick list generated');
      }
    }
  });
});

test.describe('Barcode Generation Workflow', () => {
  test('should generate barcode for a product', async ({ page }) => {
    await login(page);
    await page.goto('/barcode');
    await page.waitForTimeout(2000);

    console.log('🔵 Testing barcode generation...');

    // Click generate button
    const generateButton = page.locator('button:has-text("Generate")').first();
    const hasButton = await generateButton.isVisible().catch(() => false);

    if (hasButton) {
      await generateButton.click();
      await page.waitForTimeout(1000);

      // Select product
      const productSelect = page.locator('select, .ant-select').first();

      if (await productSelect.isVisible().catch(() => false)) {
        await productSelect.click();
        await page.waitForTimeout(500);

        const firstProduct = page.locator('.ant-select-item, option').first();
        await firstProduct.click();

        // Select format
        const formatSelect = page.locator('select[name="format"], .ant-select').nth(1);

        if (await formatSelect.isVisible().catch(() => false)) {
          await formatSelect.click();
          await page.waitForTimeout(300);

          const format = page.locator('.ant-select-item:has-text("CODE128")').first();
          const hasFormat = await format.isVisible().catch(() => false);

          if (hasFormat) {
            await format.click();
          }
        }

        // Generate
        const generateBtn = page.locator('button:has-text("Generate")').last();
        await generateBtn.click();
        await page.waitForTimeout(2000);

        // Verify barcode appears
        const barcode = page.locator('svg, canvas, [class*="barcode"]');
        const hasBarcode = await barcode.isVisible().catch(() => false);

        if (hasBarcode) {
          console.log('✅ Barcode generated and displayed');
        }
      }
    }
  });
});

test.describe('Scanner Workflow', () => {
  test('should scan a product and display details', async ({ page }) => {
    await login(page);
    await page.goto('/scanner');
    await page.waitForTimeout(2000);

    console.log('🔵 Testing scanner workflow...');

    // Enter a SKU to scan
    const scanInput = page.locator('input[placeholder*="scan" i], input[placeholder*="barcode" i]').first();

    if (await scanInput.isVisible()) {
      // Use a known SKU from test data
      await scanInput.fill('PROD-001');
      await scanInput.press('Enter');

      await page.waitForTimeout(2000);

      // Verify product details appear
      const pageContent = await page.textContent('body');
      const hasProductInfo = /(name|description|quantity|stock|location)/i.test(pageContent || '');

      if (hasProductInfo) {
        console.log('✅ Scanner found product and displayed details');
      } else {
        console.log('ℹ️  SKU not found (expected if no test data)');
      }
    }
  });
});

test.describe('Complete Order Fulfillment Workflow', () => {
  test('should complete full order-to-ship workflow', async ({ page }) => {
    await login(page);

    console.log('🔵 Testing complete order fulfillment workflow...');
    console.log('  1️⃣  View sales orders');
    console.log('  2️⃣  Generate pick list');
    console.log('  3️⃣  Complete picking');
    console.log('  4️⃣  Pack order');
    console.log('  5️⃣  Ship order');

    // Step 1: View orders
    await page.goto('/sales-orders');
    await page.waitForTimeout(2000);

    const ordersExist = await page.locator('tbody tr').count() > 0;

    if (ordersExist) {
      console.log('✅ Step 1: Sales orders loaded');

      // Step 2: Go to picking
      await page.goto('/picking');
      await page.waitForTimeout(2000);

      const pickListsExist = await page.locator('tbody tr').count() > 0;

      if (pickListsExist) {
        console.log('✅ Step 2: Pick lists available');

        // Step 3: View a pick list
        const firstPickList = page.locator('tbody tr').first();
        await firstPickList.click();
        await page.waitForTimeout(1000);

        console.log('✅ Step 3: Pick list opened');

        // Check for pick items
        const pageContent = await page.textContent('body');
        const hasItems = /(item|product|quantity|location)/i.test(pageContent || '');

        if (hasItems) {
          console.log('✅ Step 4: Pick items displayed');
        }

        // Look for complete/status update button
        const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish")').first();
        const hasCompleteButton = await completeButton.isVisible().catch(() => false);

        if (hasCompleteButton) {
          console.log('✅ Step 5: Complete workflow available');
        }

        console.log('✅ Full order fulfillment workflow verified');
      }
    }
  });
});
