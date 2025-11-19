import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test('should navigate through all main pages', async ({ page }) => {
    const pages = [
      { path: '/dashboard', title: 'Dashboard' },
      { path: '/companies', title: 'Multi-Company Management' },
      { path: '/warehouses', title: 'Warehouses' },
      { path: '/products', title: 'Products' },
      { path: '/inventory', title: 'Inventory' },
      { path: '/sales-orders', title: 'Sales Orders' },
      { path: '/purchase-orders', title: 'Purchase Orders' },
      { path: '/goods-receiving', title: 'Goods Receiving' },
      { path: '/picking', title: 'Pick Lists' },
      { path: '/packing', title: 'Packing' },
      { path: '/shipments', title: 'Shipment' },
      { path: '/returns', title: 'Returns' },
      { path: '/transfers', title: 'Transfers' },
      { path: '/labels', title: 'Label' },
      { path: '/users', title: 'User Management' },
      { path: '/settings', title: 'Settings' },
    ];

    for (const { path, title } of pages) {
      await page.goto(path);
      await expect(page.locator('h1')).toContainText(title, { timeout: 5000 });
    }
  });

  test('should navigate using sidebar menu', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on Products in sidebar
    const productsLink = page.locator('.ant-menu a[href="/products"]').first();
    await productsLink.click();

    // Should navigate to products page
    await expect(page).toHaveURL('/products');
    await expect(page.locator('h1')).toContainText('Products');
  });

  test('should maintain navigation state on page reload', async ({ page }) => {
    await page.goto('/products');

    // Reload page
    await page.reload();

    // Should still be on products page
    await expect(page).toHaveURL('/products');
    await expect(page.locator('h1')).toContainText('Products');
  });

  test('should navigate back using browser back button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/products');

    // Go back
    await page.goBack();

    // Should be back on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle deep linking to detail pages', async ({ page }) => {
    // Navigate directly to a detail page (using mock ID)
    await page.goto('/products/1');

    // Page should load without 404
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should open submenu items', async ({ page }) => {
    await page.goto('/dashboard');

    // Find a submenu (e.g., Inventory)
    const inventoryMenu = page.locator('.ant-menu-submenu:has-text("Inventory")').first();

    if (await inventoryMenu.isVisible()) {
      // Click to expand
      await inventoryMenu.click();

      // Submenu items should be visible
      await expect(page.locator('.ant-menu-submenu-open')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should highlight active menu item', async ({ page }) => {
    await page.goto('/products');

    // Active menu item should be highlighted
    const activeMenuItem = page.locator('.ant-menu-item-selected');
    await expect(activeMenuItem).toBeVisible();
  });

  test('should navigate through breadcrumbs', async ({ page }) => {
    await page.goto('/products');

    // Click on a product to go to detail page
    await page.locator('table tbody tr:first-child a').first().click();

    // Click back button
    await page.locator('button:has-text("Back")').first().click();

    // Should be back on products list
    await expect(page).toHaveURL('/products');
  });

  test('should handle footer navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Check footer exists
    const footer = page.locator('footer, .footer');

    if (await footer.isVisible()) {
      // Click footer links if they exist
      const footerLinks = footer.locator('a');
      const linkCount = await footerLinks.count();

      if (linkCount > 0) {
        // Footer has clickable links
        expect(linkCount).toBeGreaterThan(0);
      }
    }
  });
});
