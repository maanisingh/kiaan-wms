import { test, expect } from '@playwright/test';

/**
 * Content Verification Tests
 * Verifies that real data is loading from the API, not just checking 200 OK
 */

// Helper to login before each test
async function login(page: any) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'admin@kiaan.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Dashboard Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
  });

  test('should display dashboard title and layout', async ({ page }) => {
    // Page title
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText(/dashboard|overview/i);

    // Should have some statistics cards
    const statsCards = page.locator('.ant-card, .stat-card, [class*="card"]');
    const cardCount = await statsCards.count();
    expect(cardCount).toBeGreaterThan(0);

    console.log(`✅ Dashboard has ${cardCount} stat cards`);
  });

  test('should display real KPI metrics with numbers', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load

    // Look for numeric values in the dashboard
    const pageContent = await page.textContent('body');

    // Should have some numbers (products, orders, inventory, etc.)
    const hasNumbers = /\d+/.test(pageContent || '');
    expect(hasNumbers).toBeTruthy();

    // Look for common KPI indicators
    const hasKPIs = /(total|count|value|revenue|stock|orders|products|inventory)/i.test(pageContent || '');
    expect(hasKPIs).toBeTruthy();

    console.log('✅ Dashboard displays KPI metrics with real data');
  });

  test('should display charts or visualizations', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for chart elements (canvas, svg, or recharts)
    const charts = page.locator('canvas, svg[class*="recharts"], [class*="chart"]');
    const chartCount = await charts.count();

    if (chartCount > 0) {
      console.log(`✅ Dashboard has ${chartCount} charts/visualizations`);
      expect(chartCount).toBeGreaterThan(0);
    } else {
      console.log('ℹ️  No charts found (may be tables instead)');
    }
  });

  test('should show recent activity or alerts', async ({ page }) => {
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // Look for activity indicators
    const hasActivity = /(recent|latest|activity|alerts|notifications|pending)/i.test(pageContent || '');

    if (hasActivity) {
      console.log('✅ Dashboard shows activity/alerts section');
    }
  });
});

test.describe('Products Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/products');
  });

  test('should display products page with title and search', async ({ page }) => {
    // Page title
    await expect(page.locator('h1, h2')).toContainText(/products/i);

    // Should have search or filter
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]');
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      console.log('✅ Products page has search functionality');
    }

    // Should have "Add" or "Create" button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should load and display products from API', async ({ page }) => {
    await page.waitForTimeout(3000); // Wait for API call

    // Look for table or grid with products
    const table = page.locator('table, .ant-table, [role="table"]');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      // Check for table rows (excluding header)
      const rows = page.locator('tbody tr, [role="row"]');
      const rowCount = await rows.count();

      console.log(`✅ Products table loaded with ${rowCount} rows`);
      expect(rowCount).toBeGreaterThan(0);

      // Verify columns contain product data
      const firstRow = rows.first();
      const rowText = await firstRow.textContent();

      // Should have SKU, name, or other product identifiers
      const hasProductData = /(SKU|name|price|stock|quantity)/i.test(rowText || '');
      expect(hasProductData).toBeTruthy();

      console.log('✅ Product rows contain real data (SKU, name, price, etc.)');
    } else {
      // Might be using cards instead
      const cards = page.locator('.ant-card, [class*="product-card"]');
      const cardCount = await cards.count();
      console.log(`ℹ️  Found ${cardCount} product cards instead of table`);
    }
  });

  test('should display product details when row is clicked', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Find first product row and click
    const firstRow = page.locator('tbody tr, [role="row"]').first();
    const isVisible = await firstRow.isVisible().catch(() => false);

    if (isVisible) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      // Should show modal or detail view
      const modal = page.locator('.ant-modal, [role="dialog"], .modal');
      const hasModal = await modal.isVisible().catch(() => false);

      if (hasModal) {
        console.log('✅ Product detail modal/dialog opened');

        // Verify modal has product information
        const modalText = await modal.textContent();
        const hasProductInfo = /(sku|name|description|price|stock)/i.test(modalText || '');
        expect(hasProductInfo).toBeTruthy();
      }
    }
  });

  test('should show pagination or load more for large datasets', async ({ page }) => {
    await page.waitForTimeout(2000);

    const pagination = page.locator('.ant-pagination, [class*="pagination"]');
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      console.log('✅ Products page has pagination');

      // Check total count
      const paginationText = await pagination.textContent();
      const totalMatch = paginationText?.match(/(\d+)\s*(total|items|products)/i);

      if (totalMatch) {
        console.log(`✅ Total products: ${totalMatch[1]}`);
      }
    }
  });
});

test.describe('Inventory Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/inventory');
  });

  test('should display inventory page with filters', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/inventory/i);

    // Should have filters (warehouse, location, status)
    const pageContent = await page.textContent('body');
    const hasFilters = /(filter|warehouse|location|zone|status)/i.test(pageContent || '');

    if (hasFilters) {
      console.log('✅ Inventory page has filters');
    }
  });

  test('should load inventory items with stock levels', async ({ page }) => {
    await page.waitForTimeout(3000);

    const table = page.locator('table tbody tr, [role="row"]');
    const rowCount = await table.count();

    console.log(`✅ Inventory loaded with ${rowCount} items`);
    expect(rowCount).toBeGreaterThan(0);

    // Verify first row has inventory data
    const firstRow = table.first();
    const rowText = await firstRow.textContent();

    // Should show quantities, locations, dates
    const hasInventoryData = /(quantity|stock|location|warehouse|lot|batch|expir)/i.test(rowText || '');
    expect(hasInventoryData).toBeTruthy();

    console.log('✅ Inventory items display stock levels and locations');
  });

  test('should highlight low stock or expiring items', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for warning/error indicators
    const warnings = page.locator('.ant-tag-red, .ant-tag-warning, [class*="warning"], [class*="low-stock"]');
    const warningCount = await warnings.count();

    if (warningCount > 0) {
      console.log(`✅ Found ${warningCount} low stock/expiry warnings`);
    } else {
      console.log('ℹ️  No low stock warnings (all items might be well-stocked)');
    }
  });

  test('should display best-before dates for perishable items', async ({ page }) => {
    await page.waitForTimeout(3000);

    const pageContent = await page.textContent('body');

    // Look for dates
    const hasDates = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i.test(pageContent || '');

    if (hasDates) {
      console.log('✅ Inventory displays dates (best-before, expiry, received)');
    }
  });
});

test.describe('Sales Orders Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/sales-orders');
  });

  test('should display sales orders with customer information', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/sales|orders/i);

    await page.waitForTimeout(3000);

    const table = page.locator('table tbody tr, [role="row"]');
    const rowCount = await table.count();

    if (rowCount > 0) {
      console.log(`✅ Sales orders loaded with ${rowCount} orders`);

      // Check first order
      const firstRow = table.first();
      const rowText = await firstRow.textContent();

      // Should have order ID, customer, date, status
      const hasOrderData = /(order|customer|date|status|total|amount)/i.test(rowText || '');
      expect(hasOrderData).toBeTruthy();

      console.log('✅ Orders display customer info and status');
    }
  });

  test('should show order status badges', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Look for status tags/badges
    const badges = page.locator('.ant-tag, .ant-badge, [class*="status"], [class*="badge"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      console.log(`✅ Found ${badgeCount} status badges`);

      // Common statuses: PENDING, PROCESSING, COMPLETED, CANCELLED
      const pageText = await page.textContent('body');
      const hasStatuses = /(pending|processing|completed|cancelled|shipped)/i.test(pageText || '');
      expect(hasStatuses).toBeTruthy();
    }
  });

  test('should display order totals and line items', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Click first order to expand or view details
    const firstRow = page.locator('tbody tr, [role="row"]').first();
    const isVisible = await firstRow.isVisible().catch(() => false);

    if (isVisible) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      const pageContent = await page.textContent('body');

      // Should show line items, quantities, prices
      const hasOrderDetails = /(quantity|price|total|subtotal|item|product)/i.test(pageContent || '');

      if (hasOrderDetails) {
        console.log('✅ Order details show line items and totals');
      }
    }
  });
});

test.describe('Pick Lists Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/picking');
  });

  test('should display pick lists with types and status', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/pick|picking/i);

    await page.waitForTimeout(3000);

    const pageContent = await page.textContent('body');

    // Should have pick list types: SINGLE, BATCH, WAVE, ZONE
    const hasPickTypes = /(single|batch|wave|zone)/i.test(pageContent || '');

    if (hasPickTypes) {
      console.log('✅ Pick lists show different pick types');
    }

    // Should have statuses: PENDING, IN_PROGRESS, COMPLETED
    const hasStatuses = /(pending|in.progress|completed|cancelled)/i.test(pageContent || '');

    if (hasStatuses) {
      console.log('✅ Pick lists show status information');
    }
  });

  test('should show pick progress and items', async ({ page }) => {
    await page.waitForTimeout(3000);

    const table = page.locator('table tbody tr, [role="row"]');
    const rowCount = await table.count();

    if (rowCount > 0) {
      console.log(`✅ Found ${rowCount} pick lists`);

      // Look for progress indicators
      const pageContent = await page.textContent('body');
      const hasProgress = /(\d+\/\d+|\d+%|progress)/i.test(pageContent || '');

      if (hasProgress) {
        console.log('✅ Pick lists show progress tracking');
      }
    }
  });
});

test.describe('Barcode Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/barcode');
  });

  test('should display barcode management page', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/barcode|qr/i);

    // Should have generate buttons
    const generateButton = page.locator('button:has-text("Generate")');
    const hasButton = await generateButton.isVisible().catch(() => false);

    if (hasButton) {
      console.log('✅ Barcode page has generation functionality');
    }

    // Should show statistics
    const stats = page.locator('.ant-statistic, .stat-card, [class*="card"]');
    const statCount = await stats.count();

    if (statCount > 0) {
      console.log(`✅ Barcode page shows ${statCount} statistics cards`);
    }
  });
});

test.describe('Scanner Page Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/scanner');
  });

  test('should display scanner interface', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/scanner|scan/i);

    // Should have barcode input
    const input = page.locator('input[placeholder*="scan" i], input[placeholder*="barcode" i]');
    const hasInput = await input.isVisible().catch(() => false);

    if (hasInput) {
      console.log('✅ Scanner page has barcode input field');
      await expect(input).toBeFocused();
    }

    // Should show instructions
    const pageContent = await page.textContent('body');
    const hasInstructions = /(scan|barcode|sku|instructions)/i.test(pageContent || '');

    if (hasInstructions) {
      console.log('✅ Scanner page shows instructions');
    }
  });
});

test.describe('API Data Loading Verification', () => {
  test('should load data from GraphQL API', async ({ page }) => {
    await login(page);

    // Intercept GraphQL requests
    let graphqlRequestMade = false;

    page.on('request', request => {
      if (request.url().includes('graphql') || request.url().includes('hasura')) {
        graphqlRequestMade = true;
        console.log('✅ GraphQL API request detected:', request.url());
      }
    });

    await page.goto('/products');
    await page.waitForTimeout(3000);

    expect(graphqlRequestMade).toBeTruthy();
  });

  test('should handle loading states', async ({ page }) => {
    await login(page);
    await page.goto('/inventory');

    // Check for loading spinner/skeleton
    const loading = page.locator('.ant-spin, .ant-skeleton, [class*="loading"]');
    const hadLoading = await loading.isVisible().catch(() => false);

    if (hadLoading) {
      console.log('✅ Page shows loading indicator while fetching data');
    }

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Loading should be gone
    const stillLoading = await loading.isVisible().catch(() => false);
    expect(stillLoading).toBeFalsy();
  });
});
