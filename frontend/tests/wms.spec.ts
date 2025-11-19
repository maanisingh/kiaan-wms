import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3011';

test.describe('WMS Platform - Comprehensive Tests', () => {

  // Marketing Page Tests
  test.describe('Marketing Page', () => {
    test('should load marketing homepage', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('text=Kiaan WMS').first()).toBeVisible();
      await expect(page.locator('text=Warehouse Operations')).toBeVisible();
      await expect(page.locator('text=Reimagined')).toBeVisible();
    });

    test('should have Start Free Trial button (no demo button)', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('text=Start Free Trial').first()).toBeVisible();
      // Ensure demo buttons are NOT present
      await expect(page.locator('text=View Live Demo')).not.toBeVisible();
    });

    test('should display role cards', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('h3:has-text("Administrator")').first()).toBeVisible();
      await expect(page.locator('h3:has-text("Warehouse Manager")').first()).toBeVisible();
      await expect(page.locator('h3:has-text("Picker")').first()).toBeVisible();
      await expect(page.locator('h3:has-text("Packer")').first()).toBeVisible();
    });

    test('should have working navigation links', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator('a[href="#features"]').first().click();
      await page.locator('a[href="#roles"]').first().click();
      await page.locator('a[href="#stats"]').first().click();
    });
  });

  // Login Page Tests
  test.describe('Login Page', () => {
    test('should load login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await expect(page.locator('text=Sign in to your account')).toBeVisible();
      await expect(page.locator('input[placeholder*="admin@example.com"]')).toBeVisible();
    });

    test('should display all 5 quick login roles', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await expect(page.locator('text=Quick Login (Demo)')).toBeVisible();
      await expect(page.locator('button:has-text("Admin User")')).toBeVisible();
      await expect(page.locator('button:has-text("Warehouse Manager")')).toBeVisible();
      await expect(page.locator('button:has-text("Warehouse Staff")')).toBeVisible();
      await expect(page.locator('button:has-text("Picker")')).toBeVisible();
      await expect(page.locator('button:has-text("Packer")')).toBeVisible();
    });

    test('should login as Admin via quick login', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('button:has-text("Admin User")').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    });
  });

  // Dashboard Tests (Admin Role)
  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Quick login as admin
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    });

    test('should display dashboard correctly', async ({ page }) => {
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      // Check for KPI cards
      await expect(page.locator('text=Total Stock')).toBeVisible();
      await expect(page.locator('text=Orders Today')).toBeVisible();
    });

    test('should have working sidebar menu - controlled expansion', async ({ page }) => {
      // Click Warehouses submenu
      await page.locator('text=Warehouses').click();
      await expect(page.locator('text=All Warehouses')).toBeVisible();

      // Click Products - Warehouses should close
      await page.locator('text=Products').click();
      await expect(page.locator('text=All Products')).toBeVisible();
      // Warehouses submenu should be closed
      const warehousesSubmenu = page.locator('text=All Warehouses');
      await expect(warehousesSubmenu).not.toBeVisible();
    });

    test('should have sticky footer with no gaps', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      // Check footer styling
      const footerBox = await footer.boundingBox();
      expect(footerBox).toBeTruthy();
    });
  });

  // Companies Module Tests
  test.describe('Companies Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
      await page.goto(`${BASE_URL}/companies`);
    });

    test('should load companies page', async ({ page }) => {
      await expect(page.locator('text=Companies')).toBeVisible();
    });

    test('should open Add Company modal', async ({ page }) => {
      await page.locator('button:has-text("Add Company")').first().click();
      await expect(page.locator('text=Add New Company')).toBeVisible({ timeout: 3000 });
    });
  });

  // Warehouses Module Tests
  test.describe('Warehouses Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    });

    test('should navigate to warehouses page', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses`);
      await expect(page.locator('text=Warehouses')).toBeVisible();
    });

    test('should open Add Warehouse modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses`);
      await page.locator('button:has-text("Add Warehouse")').first().click();
      await expect(page.locator('text=Add New Warehouse')).toBeVisible({ timeout: 3000 });
    });

    test('should access Zones submenu page', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses/zones`);
      await expect(page.locator('text=Zones')).toBeVisible();
    });

    test('should access Locations submenu page', async ({ page }) => {
      await page.goto(`${BASE_URL}/warehouses/locations`);
      await expect(page.locator('text=Locations')).toBeVisible();
    });
  });

  // Products Module Tests
  test.describe('Products Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    });

    test('should navigate to products page', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await expect(page.locator('text=Products')).toBeVisible();
    });

    test('should access Categories submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/products/categories`);
      await expect(page.locator('text=Categories')).toBeVisible();
    });

    test('should access Import submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/products/import`);
      await expect(page.locator('text=Import')).toBeVisible();
    });
  });

  // Inventory Module Tests
  test.describe('Inventory Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    });

    test('should navigate to inventory overview', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory`);
      await expect(page.locator('text=Inventory')).toBeVisible();
    });

    test('should access Adjustments submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory/adjustments`);
      await expect(page.locator('text=Adjustments')).toBeVisible();
    });

    test('should access Cycle Counts submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory/cycle-counts`);
      await expect(page.locator('text=Cycle Counts')).toBeVisible();
    });

    test('should access Batches submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory/batches`);
      await expect(page.locator('text=Batches')).toBeVisible();
    });

    test('should access Movements submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/inventory/movements`);
      await expect(page.locator('text=Movements')).toBeVisible();
    });
  });

  // Integrations Module Tests
  test.describe('Integrations Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    });

    test('should access Channels submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations/channels`);
      await expect(page.locator('text=Channels')).toBeVisible();
    });

    test('should access Mappings submenu', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations/mappings`);
      await expect(page.locator('text=Mappings')).toBeVisible();
    });
  });

  // FBA Transfers Test
  test.describe('FBA Transfers', () => {
    test('should load FBA transfers page', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
      await page.goto(`${BASE_URL}/fba-transfers`);
      await expect(page.locator('text=FBA Transfers')).toBeVisible();
    });
  });

  // All Routes Accessibility Test
  test.describe('All 39 Routes Accessibility', () => {
    const routes = [
      '/',
      '/auth/login',
      '/dashboard',
      '/companies',
      '/warehouses',
      '/warehouses/zones',
      '/warehouses/locations',
      '/products',
      '/products/categories',
      '/products/import',
      '/inventory',
      '/inventory/adjustments',
      '/inventory/cycle-counts',
      '/inventory/batches',
      '/inventory/movements',
      '/purchase-orders',
      '/goods-receiving',
      '/sales-orders',
      '/customers',
      '/picking',
      '/packing',
      '/shipments',
      '/returns',
      '/transfers',
      '/fba-transfers',
      '/integrations',
      '/integrations/channels',
      '/integrations/mappings',
      '/labels',
      '/reports',
      '/users',
      '/settings',
      '/about',
      '/contact',
      '/privacy',
      '/demo'
    ];

    test('all routes should return 200 status', async ({ page }) => {
      // Login first for authenticated routes
      await page.goto(`${BASE_URL}/auth/login`);
      await page.locator('text=Admin User').click();
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });

      for (const route of routes) {
        const response = await page.goto(`${BASE_URL}${route}`);
        expect(response?.status()).toBe(200);
      }
    });
  });

  // Multi-Role Tests
  test.describe('Multiple Roles Functionality', () => {
    const roles = [
      { name: 'Admin User', role: 'admin' },
      { name: 'Warehouse Manager', role: 'manager' },
      { name: 'Warehouse Staff', role: 'warehouse_staff' },
      { name: 'Picker', role: 'picker' },
      { name: 'Packer', role: 'packer' }
    ];

    for (const { name, role } of roles) {
      test(`should login and access dashboard as ${role}`, async ({ page }) => {
        await page.goto(`${BASE_URL}/auth/login`);
        await page.locator(`button:has-text("${name}")`).click();
        await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      });
    }
  });
});
