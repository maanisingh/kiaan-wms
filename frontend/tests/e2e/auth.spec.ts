import { test, expect } from '@playwright/test';

/**
 * Authentication & Authorization Tests
 * Tests login flows, protected routes, role-based access
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to auth/login
    await expect(page).toHaveURL(/\/auth\/login/);

    // Verify login page content
    await expect(page.locator('h1, h2, [data-testid="login-title"]')).toContainText(/login|sign in/i);

    // Check for email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in login form
    await page.fill('input[type="email"], input[name="email"]', 'admin@kiaan.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin123!');

    // Click login button
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    // Wait for navigation
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard content is loaded
    await expect(page.locator('h1, h2, [data-testid="page-title"]')).toContainText(/dashboard|overview/i);

    // Should see user menu or profile
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .ant-dropdown-trigger');
    await expect(userMenu).toBeVisible({ timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error message (don't navigate away)
    await page.waitForTimeout(2000);

    const errorMessage = page.locator('.ant-message-error, .error-message, [role="alert"]');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);

    if (isErrorVisible) {
      await expect(errorMessage).toContainText(/invalid|incorrect|failed|error/i);
    }

    // Should still be on login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@kiaan.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Find and click logout
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .ant-dropdown-trigger').first();
    await userMenu.click();

    await page.waitForTimeout(500);

    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
    await logoutButton.click();

    // Should redirect to login
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Protected Routes', () => {
  test('should protect /dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should protect /products route', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should protect /inventory route', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@kiaan.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Try accessing protected routes
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products/);
    await expect(page.locator('h1, h2')).toContainText(/products/i);

    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/inventory/);
    await expect(page.locator('h1, h2')).toContainText(/inventory/i);
  });
});

test.describe('User Roles & Permissions', () => {
  test('Super Admin should have full access', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'superadmin@kiaan.com');
    await page.fill('input[type="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Check menu has admin-only items
    const menu = page.locator('nav, .ant-menu, [role="navigation"]');
    await expect(menu).toContainText(/users|settings|companies/i);
  });

  test('Warehouse Manager should have limited access', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'manager@kiaan.com');
    await page.fill('input[type="password"]', 'Manager123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Should see warehouse operations
    const menu = page.locator('nav, .ant-menu');
    await expect(menu).toContainText(/warehouse|inventory|picking/i);
  });

  test('Picker should only see picking-related pages', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'picker@kiaan.com');
    await page.fill('input[type="password"]', 'Picker123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Should see pick lists
    const menu = page.locator('nav, .ant-menu');
    const menuText = await menu.textContent();

    expect(menuText?.toLowerCase()).toContain('pick');

    // Should NOT see admin items
    expect(menuText?.toLowerCase()).not.toContain('users');
    expect(menuText?.toLowerCase()).not.toContain('companies');
  });
});

test.describe('Session Persistence', () => {
  test('should maintain session after page reload', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@kiaan.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
  });

  test('should maintain session across navigation', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@kiaan.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Navigate to different pages
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products/);

    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/inventory/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Should still be authenticated
    const userMenu = page.locator('[data-testid="user-menu"], .user-dropdown, .ant-dropdown-trigger').first();
    await expect(userMenu).toBeVisible();
  });
});
