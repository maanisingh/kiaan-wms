const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://91.98.157.75:8000';

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    // Test various common admin/panel URLs
    const urlsToTest = [
        '/panel',
        '/admin',
        '/admin/login',
        '/panel/login', 
        '/dashboard',
        '/admin/dashboard',
        '/panel/dashboard',
        '/login',
        '/api',
        '/manage',
        '/backend'
    ];
    
    console.log('Testing URLs...\n');
    
    for (const path of urlsToTest) {
        const url = `${BASE_URL}${path}`;
        try {
            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            const status = response?.status() || 'N/A';
            const finalUrl = page.url();
            const title = await page.title();
            
            console.log(`${path}`);
            console.log(`  Status: ${status}`);
            console.log(`  Final URL: ${finalUrl}`);
            console.log(`  Title: ${title}`);
            console.log('');
        } catch (e) {
            console.log(`${path} - Error: ${e.message}\n`);
        }
    }
    
    // Look at source code of panel page
    await page.goto(`${BASE_URL}/panel`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Get HTML structure
    const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 5000));
    console.log('\n=== Panel Page HTML (first 5000 chars) ===');
    console.log(bodyHtml);
    
    // Check for any Vue/React app
    const hasVue = await page.evaluate(() => !!window.__VUE__);
    const hasReact = await page.evaluate(() => !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
    console.log(`\nVue detected: ${hasVue}`);
    console.log(`React detected: ${hasReact}`);
    
    await browser.close();
}

run().catch(console.error);
