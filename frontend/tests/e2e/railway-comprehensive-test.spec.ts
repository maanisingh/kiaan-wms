import { test, expect } from '@playwright/test';

/**
 * COMPREHENSIVE RAILWAY DEPLOYMENT TEST
 * Tests actual functionality, data flow, and CRUD operations
 */

test.describe('Railway Deployment - Deep Content Analysis', () => {

  test('ANALYSIS: Login page - Form elements and interactivity', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== LOGIN PAGE ANALYSIS ===');

    // Get page title
    const title = await page.title();
    console.log(`✅ Page Title: ${title}`);

    // Check for form
    const form = page.locator('form#login');
    await expect(form).toBeVisible();
    console.log('✅ Login form present');

    // Analyze email input
    const emailInput = page.locator('input#login_email');
    const emailVisible = await emailInput.isVisible();
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const emailType = await emailInput.getAttribute('type');
    console.log(`✅ Email Input: visible=${emailVisible}, type=${emailType}, placeholder=${emailPlaceholder}`);

    // Analyze password input
    const passwordInput = page.locator('input#login_password');
    const passwordVisible = await passwordInput.isVisible();
    const passwordType = await passwordInput.getAttribute('type');
    console.log(`✅ Password Input: visible=${passwordVisible}, type=${passwordType}`);

    // Check submit button
    const submitBtn = page.locator('button[type="submit"]');
    const btnText = await submitBtn.textContent();
    console.log(`✅ Submit Button: text="${btnText}"`);

    // Count quick login buttons
    const quickLoginBtns = page.locator('button:has-text("Administrator"), button:has-text("Manager"), button:has-text("Picker")');
    const quickBtnCount = await quickLoginBtns.count();
    console.log(`✅ Quick Login Buttons: ${quickBtnCount} found`);

    // Get all button texts
    const allButtons = await page.locator('button').all();
    console.log(`\n📊 Total buttons on page: ${allButtons.length}`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const text = await allButtons[i].textContent();
      console.log(`   Button ${i + 1}: "${text?.trim()}"`);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/railway-login-analysis.png', fullPage: true });
    console.log('📸 Screenshot saved: railway-login-analysis.png\n');
  });

  test('FUNCTIONALITY: Actual login attempt and response analysis', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== LOGIN FUNCTIONALITY TEST ===');

    // Try to login
    const emailInput = page.locator('input#login_email');
    const passwordInput = page.locator('input#login_password');
    const submitBtn = page.locator('button[type="submit"]');

    console.log('Filling email...');
    await emailInput.fill('admin@kiaan-wms.com');

    console.log('Filling password...');
    await passwordInput.fill('Admin@123');

    console.log('Clicking submit...');

    // Listen for API calls
    let apiCalled = false;
    let apiResponse: any = null;

    page.on('response', async (response) => {
      if (response.url().includes('/auth/login') || response.url().includes('/api/')) {
        apiCalled = true;
        console.log(`🌐 API Call detected: ${response.url()}`);
        console.log(`   Status: ${response.status()}`);
        try {
          const body = await response.json();
          apiResponse = body;
          console.log(`   Response: ${JSON.stringify(body).substring(0, 200)}`);
        } catch (e) {
          console.log(`   Response: [Non-JSON]`);
        }
      }
    });

    await submitBtn.click();

    // Wait for navigation or error
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`\n📍 Current URL after login: ${currentUrl}`);

    if (apiCalled) {
      console.log('✅ API was called');
      if (apiResponse) {
        console.log(`📦 API Response received: ${JSON.stringify(apiResponse, null, 2).substring(0, 500)}`);
      }
    } else {
      console.log('⚠️ No API call detected');
    }

    // Check for error messages
    const errorMsg = page.locator('.ant-message-error, [role="alert"], .error');
    const hasError = await errorMsg.count() > 0;
    if (hasError) {
      const errorText = await errorMsg.first().textContent();
      console.log(`❌ Error message: ${errorText}`);
    }

    // Check if redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Redirected to dashboard - LOGIN SUCCESSFUL');
    } else {
      console.log(`⚠️ Still on: ${currentUrl}`);
    }

    await page.screenshot({ path: 'test-results/railway-after-login.png', fullPage: true });
    console.log('📸 Screenshot saved: railway-after-login.png\n');
  });

  test('DATA FLOW: Dashboard content and API integration', async ({ page }) => {
    // First login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input#login_email');
    const passwordInput = page.locator('input#login_password');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill('admin@kiaan-wms.com');
    await passwordInput.fill('Admin@123');

    // Track all API calls
    const apiCalls: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/') || request.url().includes('/graphql')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });

    await submitBtn.click();
    await page.waitForTimeout(3000);

    console.log('\n=== DASHBOARD DATA ANALYSIS ===');

    // Try to navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log(`📍 Current URL: ${page.url()}`);

    // Analyze page content
    const pageText = await page.textContent('body');
    const hasLoading = pageText?.toLowerCase().includes('loading');
    const hasError = pageText?.toLowerCase().includes('error');
    const hasData = pageText?.toLowerCase().includes('total') || pageText?.toLowerCase().includes('count');

    console.log(`\n📊 Content Analysis:`);
    console.log(`   Contains "loading": ${hasLoading}`);
    console.log(`   Contains "error": ${hasError}`);
    console.log(`   Contains data indicators: ${hasData}`);

    // Check for specific dashboard elements
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log(`\n📋 Headings found: ${headings.length}`);
    headings.slice(0, 5).forEach((h, i) => console.log(`   ${i + 1}. ${h}`));

    // Check for data tables
    const tables = await page.locator('table').count();
    console.log(`\n📊 Tables found: ${tables}`);

    if (tables > 0) {
      const rows = await page.locator('tbody tr').count();
      console.log(`   Table rows: ${rows}`);

      if (rows > 0) {
        const firstRowText = await page.locator('tbody tr').first().textContent();
        console.log(`   First row sample: ${firstRowText?.substring(0, 100)}`);
      }
    }

    // Check for cards/statistics
    const cards = await page.locator('.ant-card, [class*="card"]').count();
    console.log(`\n📇 Cards/Stats widgets: ${cards}`);

    // API calls summary
    console.log(`\n🌐 API Calls Made: ${apiCalls.length}`);
    apiCalls.slice(0, 10).forEach((call, i) => {
      console.log(`   ${i + 1}. ${call.method} ${call.url}`);
    });

    await page.screenshot({ path: 'test-results/railway-dashboard-analysis.png', fullPage: true });
    console.log('\n📸 Screenshot saved: railway-dashboard-analysis.png\n');
  });

  test('CRUD ANALYSIS: Products page - Data and functionality', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Login first
    await page.locator('input#login_email').fill('admin@kiaan-wms.com');
    await page.locator('input#login_password').fill('Admin@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    console.log('\n=== PRODUCTS PAGE CRUD ANALYSIS ===');

    // Navigate to products
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log(`📍 URL: ${page.url()}`);

    // Check for data table
    const table = page.locator('table');
    const hasTable = await table.count() > 0;
    console.log(`\n📊 Has data table: ${hasTable}`);

    if (hasTable) {
      const rows = await page.locator('tbody tr').count();
      console.log(`   Rows visible: ${rows}`);

      if (rows > 0) {
        // Analyze first product
        const firstRow = page.locator('tbody tr').first();
        const cellCount = await firstRow.locator('td').count();
        console.log(`   Columns per row: ${cellCount}`);

        // Get cell contents
        for (let i = 0; i < Math.min(cellCount, 8); i++) {
          const cell = firstRow.locator('td').nth(i);
          const text = await cell.textContent();
          console.log(`   Column ${i + 1}: ${text?.trim().substring(0, 50)}`);
        }
      } else {
        console.log('   ⚠️ No product rows found - Empty or loading');
      }
    }

    // Check for action buttons
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    const hasAddBtn = await addButton.count() > 0;
    console.log(`\n🔘 Has "Add/Create" button: ${hasAddBtn}`);

    // Check for search/filter
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    const hasSearch = await searchInput.count() > 0;
    console.log(`🔍 Has search functionality: ${hasSearch}`);

    // Check for pagination
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.count() > 0;
    console.log(`📄 Has pagination: ${hasPagination}`);

    if (hasPagination) {
      const pageInfo = await pagination.textContent();
      console.log(`   Pagination info: ${pageInfo}`);
    }

    await page.screenshot({ path: 'test-results/railway-products-crud.png', fullPage: true });
    console.log('\n📸 Screenshot saved: railway-products-crud.png\n');
  });

  test('NAVIGATION FLOW: Test all major pages and rendering', async ({ page }) => {
    console.log('\n=== COMPLETE NAVIGATION ANALYSIS ===\n');

    // Login first
    await page.goto('/auth/login');
    await page.locator('input#login_email').fill('admin@kiaan-wms.com');
    await page.locator('input#login_password').fill('Admin@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    const pagesToTest = [
      '/dashboard',
      '/products',
      '/products/brands',
      '/products/bundles',
      '/inventory',
      '/sales-orders',
      '/customers',
      '/warehouses',
      '/picking',
      '/replenishment',
      '/transfers'
    ];

    const results: any[] = [];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const url = page.url();
      const title = await page.title();
      const bodyText = await page.textContent('body');

      const hasContent = bodyText && bodyText.length > 100;
      const hasLoading = bodyText?.toLowerCase().includes('loading');
      const hasError = bodyText?.toLowerCase().includes('error') || bodyText?.toLowerCase().includes('404');
      const hasTable = await page.locator('table').count() > 0;
      const hasCards = await page.locator('.ant-card').count();

      const result = {
        path: pagePath,
        url,
        title,
        contentLength: bodyText?.length || 0,
        hasContent,
        hasLoading,
        hasError,
        hasTable,
        cardCount: hasCards,
        status: hasError ? '❌' : hasContent ? '✅' : '⚠️'
      };

      results.push(result);

      console.log(`${result.status} ${pagePath}`);
      console.log(`   Content: ${result.contentLength} chars, Table: ${hasTable}, Cards: ${hasCards}`);
      console.log(`   Loading: ${hasLoading}, Error: ${hasError}\n`);
    }

    // Summary
    const successful = results.filter(r => r.status === '✅').length;
    const warnings = results.filter(r => r.status === '⚠️').length;
    const errors = results.filter(r => r.status === '❌').length;

    console.log('\n=== NAVIGATION SUMMARY ===');
    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`⚠️ Warnings: ${warnings}/${results.length}`);
    console.log(`❌ Errors: ${errors}/${results.length}\n`);
  });
});
