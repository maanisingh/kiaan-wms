const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://frontend-production-c9100.up.railway.app';

  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  console.log('=== DELETE DEBUG TEST ===\n');

  try {
    // Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
    await page.fill('#login_email', 'admin@kiaan-wms.com');
    await page.fill('#login_password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => {
      const s = localStorage.getItem('wms-auth-storage');
      return s && JSON.parse(s)?.state?.isAuthenticated;
    }, { timeout: 15000 });
    console.log('   Logged in!\n');

    // Navigate to brands page
    console.log('2. Navigating to Brands...');
    await page.goto(`${BASE_URL}/protected/products/brands`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check the actual HTML of the delete button
    const firstDeleteBtn = page.locator('button:has-text("Delete")').first();
    const btnHTML = await firstDeleteBtn.evaluate(el => el.outerHTML);
    console.log('\n3. Delete button HTML:');
    console.log(`   ${btnHTML}`);

    // Check if the button has onClick
    const hasOnClick = await firstDeleteBtn.evaluate(el => {
      // Check for React fiber props
      const keys = Object.keys(el);
      const reactKey = keys.find(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
      if (reactKey) {
        const reactProps = el[reactKey];
        return !!reactProps?.onClick || !!reactProps?.memoizedProps?.onClick;
      }
      return false;
    });
    console.log(`   Has React onClick: ${hasOnClick}`);

    // Try clicking with force
    console.log('\n4. Clicking delete button with force...');
    await firstDeleteBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Check for any modal in the DOM
    const modalsInDOM = await page.evaluate(() => {
      const modals = document.querySelectorAll('.ant-modal, .ant-modal-wrap, .ant-modal-root');
      return {
        count: modals.length,
        classes: Array.from(modals).map(m => m.className)
      };
    });
    console.log(`   Modals in DOM: ${modalsInDOM.count}`);
    console.log(`   Classes: ${JSON.stringify(modalsInDOM.classes)}`);

    // Check body for any modal containers
    const bodyChildren = await page.evaluate(() => {
      const body = document.body;
      return Array.from(body.children).map(c => c.tagName + '.' + c.className.substring(0, 50));
    });
    console.log(`\n   Body children (first 10):`, bodyChildren.slice(0, 10));

    await page.screenshot({ path: '/tmp/delete_debug.png', fullPage: true });

    // Now try using page.evaluate to call the function directly
    console.log('\n5. Trying to trigger Modal.confirm via evaluate...');
    const modalResult = await page.evaluate(() => {
      // Try to access antd Modal
      if (typeof window !== 'undefined') {
        // Check if Modal is available globally
        console.log('Checking for Modal...');
        return {
          hasAntd: typeof window.antd !== 'undefined',
          bodyContent: document.body.innerHTML.includes('ant-modal')
        };
      }
      return null;
    });
    console.log(`   Result: ${JSON.stringify(modalResult)}`);

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/delete_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
