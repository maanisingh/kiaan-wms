/**
 * Test Credentials for Kiaan WMS
 * These match the demo users in the login page
 */

export const TEST_USERS = {
  SUPER_ADMIN: {
    email: 'admin@kiaan-wms.com',
    password: 'Admin@123',
    role: 'SUPER_ADMIN',
  },
  COMPANY_ADMIN: {
    email: 'companyadmin@kiaan-wms.com',
    password: 'Admin@123',
    role: 'COMPANY_ADMIN',
  },
  WAREHOUSE_MANAGER: {
    email: 'warehousemanager@kiaan-wms.com',
    password: 'Admin@123',
    role: 'WAREHOUSE_MANAGER',
  },
  INVENTORY_MANAGER: {
    email: 'inventorymanager@kiaan-wms.com',
    password: 'Admin@123',
    role: 'INVENTORY_MANAGER',
  },
  PICKER: {
    email: 'picker@kiaan-wms.com',
    password: 'Admin@123',
    role: 'PICKER',
  },
  VIEWER: {
    email: 'viewer@kiaan-wms.com',
    password: 'Admin@123',
    role: 'VIEWER',
  },
};

// Default user for most tests
export const DEFAULT_USER = TEST_USERS.SUPER_ADMIN;

// Helper function for login
export async function loginAsUser(page: any, user = DEFAULT_USER) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"], input[name="password"]', user.password);

  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}
