const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://91.98.157.75:8000';
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/wms-guide';

if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    console.log('Navigating to login page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Screenshot login page
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login.png`, fullPage: true });
    console.log('Login page captured');
    
    // Get all input fields
    const inputs = await page.$$eval('input', els => els.map(e => ({
        type: e.type,
        name: e.name,
        placeholder: e.placeholder,
        id: e.id,
        className: e.className
    })));
    console.log('Input fields found:', JSON.stringify(inputs, null, 2));
    
    // Try to find and fill login fields
    const allInputs = await page.locator('input').all();
    console.log(`Total inputs: ${allInputs.length}`);
    
    // Fill username/email field
    const usernameInput = await page.locator('input').first();
    if (usernameInput) {
        await usernameInput.fill('admin');
        console.log('Filled username field');
    }
    
    // Find password field or second input
    if (allInputs.length > 1) {
        const passwordInput = await page.locator('input').nth(1);
        await passwordInput.fill('admin123');
        console.log('Filled password field');
    }
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-filled.png`, fullPage: true });
    
    // Click login button
    const buttons = await page.$$eval('button', els => els.map(e => e.textContent));
    console.log('Buttons found:', buttons);
    
    const loginBtn = page.locator('button').first();
    if (loginBtn) {
        await loginBtn.click();
        console.log('Clicked login button');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-login.png`, fullPage: true });
    
    // Check current URL
    console.log('Current URL:', page.url());
    
    // Get sidebar/menu items
    const menuItems = await page.$$eval('a, [role="menuitem"], .menu-item, .nav-item, .sidebar a', 
        els => els.map(e => ({ text: e.textContent?.trim(), href: e.href })).filter(e => e.text)
    );
    console.log('Menu items found:', JSON.stringify(menuItems.slice(0, 20), null, 2));
    
    await browser.close();
    console.log('Analysis complete');
}

run().catch(console.error);
