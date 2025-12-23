const { chromium } = require('playwright');

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    
    await page.goto('https://wms.alexandratechlab.com/auth/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Get all input fields
    const inputs = await page.$$eval('input', els => els.map(e => ({
        type: e.type,
        name: e.name,
        id: e.id,
        placeholder: e.placeholder,
        className: e.className.substring(0, 50)
    })));
    console.log('Inputs:', JSON.stringify(inputs, null, 2));
    
    // Get all buttons
    const buttons = await page.$$eval('button', els => els.map(e => ({
        type: e.type,
        text: e.textContent?.trim().substring(0, 30),
        className: e.className.substring(0, 50)
    })));
    console.log('\nButtons:', JSON.stringify(buttons, null, 2));
    
    // Try to fill form
    console.log('\nTrying to fill form...');
    
    const emailInput = page.locator('input').first();
    const passInput = page.locator('input').nth(1);
    
    await emailInput.fill('admin@company.com');
    console.log('Email filled');
    
    await passInput.fill('password123');
    console.log('Password filled');
    
    // Screenshot before click
    await page.screenshot({ path: '/root/kiaan-wms-frontend/backend/wms-screenshots/debug-before-login.png' });
    
    // Click button
    const btn = page.locator('button').first();
    await btn.click();
    console.log('Button clicked');
    
    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());
    
    // Screenshot after click
    await page.screenshot({ path: '/root/kiaan-wms-frontend/backend/wms-screenshots/debug-after-login.png' });
    
    // Check localStorage
    const storage = await page.evaluate(() => JSON.stringify(localStorage));
    console.log('LocalStorage:', storage);
    
    await browser.close();
}

run().catch(console.error);
