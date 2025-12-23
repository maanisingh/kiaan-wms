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
    
    // Go to homepage and see what we have
    console.log('Going to homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Screenshot homepage
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png`, fullPage: false });
    console.log('Homepage captured');
    
    // Get all links
    const links = await page.$$eval('a[href]', els => 
        [...new Set(els.map(e => e.href))].filter(h => h.includes('91.98.157.75'))
    );
    console.log('\nAll internal links:');
    links.forEach(l => console.log(l));
    
    // Check if there's a login link
    const loginLink = links.find(l => l.includes('login') || l.includes('auth') || l.includes('sign'));
    if (loginLink) {
        console.log('\nFound login link:', loginLink);
        await page.goto(loginLink, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-page.png`, fullPage: true });
    }
    
    // Check for admin/panel links
    const adminLink = links.find(l => l.includes('admin') || l.includes('panel') || l.includes('dashboard'));
    if (adminLink) {
        console.log('\nFound admin link:', adminLink);
    }
    
    // Try direct access to panel
    console.log('\nTrying direct panel access...');
    await page.goto(`${BASE_URL}/panel`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    console.log('Current URL after /panel:', page.url());
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-panel.png`, fullPage: true });
    
    // Check current page structure
    const pageText = await page.textContent('body');
    if (pageText.includes('Login') || pageText.includes('login')) {
        console.log('Landed on login page');
        
        // Find login form
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        
        if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill('admin@kiaan.com');
            console.log('Filled email');
        }
        if (await passwordInput.isVisible().catch(() => false)) {
            await passwordInput.fill('password');
            console.log('Filled password');
        }
        
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-login-filled.png`, fullPage: true });
        
        // Try login
        const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
        if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(3000);
            console.log('Clicked submit, new URL:', page.url());
            await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-login.png`, fullPage: true });
        }
    }
    
    await browser.close();
    console.log('\nDone!');
}

run().catch(console.error);
