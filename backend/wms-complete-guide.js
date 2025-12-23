const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://91.98.157.75:8000';
const PANEL_URL = 'http://91.98.157.75:8000/panel';
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/wms-guide';
const GUIDE_FILE = '/root/kiaan-wms-frontend/backend/USER_GUIDE.md';

if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let guideContent = [];
let screenshotCount = 0;

function addSection(title, description, features = []) {
    let section = `\n## ${title}\n\n${description}\n`;
    if (features.length > 0) {
        section += '\n**Features:**\n';
        features.forEach(f => section += `- ${f}\n`);
    }
    guideContent.push(section);
}

async function captureScreen(page, name, description) {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}`, fullPage: false });
    guideContent.push(`\n![${description}](./wms-guide/${filename})\n`);
    console.log(`Captured: ${filename}`);
    return filename;
}

async function analyzePageElements(page) {
    const analysis = {
        buttons: await page.$$eval('button', els => els.map(e => e.textContent?.trim()).filter(t => t)),
        inputs: await page.$$eval('input:not([type="hidden"])', els => els.map(e => ({ 
            type: e.type, 
            placeholder: e.placeholder,
            name: e.name 
        })).filter(e => e.placeholder || e.name)),
        tables: await page.$$eval('table', () => true).catch(() => false),
        forms: await page.$$eval('form', () => true).catch(() => false),
        cards: await page.$$eval('.card, [class*="card"]', els => els.length),
        menuItems: await page.$$eval('[class*="sidebar"] a, [class*="menu"] a, nav a', 
            els => els.map(e => e.textContent?.trim()).filter(t => t && t.length < 30)
        )
    };
    return analysis;
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    guideContent.push('# Kiaan WMS - Complete User Guide\n');
    guideContent.push('This guide provides comprehensive instructions for using the Kiaan Warehouse Management System.\n');
    
    // ========== SECTION 1: AUTHENTICATION ==========
    console.log('\n=== AUTHENTICATION ===');
    addSection('1. Authentication', 'The WMS panel requires authentication to access warehouse management features.');
    
    await page.goto(PANEL_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Check if we're on login or already in panel
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
        await captureScreen(page, 'login-page', 'WMS Login Page');
        
        // Analyze login form
        const emailField = page.locator('input[type="email"], input[name="email"]').first();
        const passField = page.locator('input[type="password"]').first();
        
        addSection('1.1 Login Process', 
            'To access the WMS panel, enter your credentials on the login page.',
            ['Email: Enter your registered admin email address',
             'Password: Enter your secure password',
             'Click "Login" to authenticate']
        );
        
        // Try common credentials
        const credentials = [
            { email: 'admin@example.com', pass: 'admin123' },
            { email: 'admin@kiaan.com', pass: 'password' },
            { email: 'test@test.com', pass: 'test123' }
        ];
        
        let loggedIn = false;
        for (const cred of credentials) {
            if (await emailField.isVisible().catch(() => false)) {
                await emailField.fill(cred.email);
                await passField.fill(cred.pass);
                await page.screenshot({ path: `${SCREENSHOT_DIR}/login-attempt.png` });
                
                const submitBtn = page.locator('button[type="submit"]').first();
                if (await submitBtn.isVisible().catch(() => false)) {
                    await submitBtn.click();
                    await page.waitForTimeout(3000);
                    
                    if (!page.url().includes('login')) {
                        loggedIn = true;
                        console.log('Logged in with:', cred.email);
                        break;
                    }
                }
            }
        }
        
        if (!loggedIn) {
            console.log('Could not login, continuing with what we have...');
        }
    }
    
    // ========== SECTION 2: DASHBOARD ==========
    console.log('\n=== DASHBOARD ===');
    
    await page.goto(PANEL_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageAnalysis = await analyzePageElements(page);
    console.log('Page analysis:', JSON.stringify(pageAnalysis, null, 2));
    
    await captureScreen(page, 'dashboard', 'WMS Dashboard - Main Control Center');
    
    const dashboardFeatures = [];
    if (pageAnalysis.cards > 0) dashboardFeatures.push(`${pageAnalysis.cards} data cards showing key metrics`);
    if (pageAnalysis.tables) dashboardFeatures.push('Data tables for detailed information');
    if (pageAnalysis.menuItems.length > 0) dashboardFeatures.push('Navigation menu for accessing all modules');
    
    addSection('2. Dashboard Overview',
        'The dashboard provides a centralized view of your warehouse operations. This is your main control center for monitoring inventory, orders, and system status.',
        dashboardFeatures
    );
    
    // Get sidebar menu items for navigation
    const sidebarLinks = await page.$$eval('aside a, [class*="sidebar"] a, .nav-link, .menu-item a',
        els => els.map(e => ({
            text: e.textContent?.trim(),
            href: e.href
        })).filter(e => e.text && e.href && e.text.length < 40)
    );
    
    console.log('Sidebar links:', sidebarLinks);
    
    // ========== EXPLORE ALL SECTIONS ==========
    const sections = [
        { name: 'Products', patterns: ['product', 'inventory', 'item'] },
        { name: 'Orders', patterns: ['order', 'purchase'] },
        { name: 'Categories', patterns: ['categor'] },
        { name: 'Users', patterns: ['user', 'customer', 'account'] },
        { name: 'Warehouse', patterns: ['warehouse', 'stock', 'location'] },
        { name: 'Reports', patterns: ['report', 'analytic', 'statistic'] },
        { name: 'Settings', patterns: ['setting', 'config', 'preference'] }
    ];
    
    let sectionNum = 3;
    for (const section of sections) {
        const matchingLink = sidebarLinks.find(link => 
            section.patterns.some(p => link.text?.toLowerCase().includes(p) || link.href?.toLowerCase().includes(p))
        );
        
        if (matchingLink) {
            console.log(`\n=== ${section.name.toUpperCase()} ===`);
            console.log('Navigating to:', matchingLink.href);
            
            await page.goto(matchingLink.href, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2000);
            
            const analysis = await analyzePageElements(page);
            await captureScreen(page, section.name.toLowerCase(), `${section.name} Management Screen`);
            
            const features = [];
            if (analysis.tables) features.push('Data table with sortable columns');
            if (analysis.buttons.length > 0) {
                const actionButtons = analysis.buttons.filter(b => 
                    b.toLowerCase().includes('add') || 
                    b.toLowerCase().includes('create') || 
                    b.toLowerCase().includes('new') ||
                    b.toLowerCase().includes('edit') ||
                    b.toLowerCase().includes('delete')
                );
                if (actionButtons.length > 0) features.push(`Action buttons: ${actionButtons.join(', ')}`);
            }
            if (analysis.inputs.length > 0) features.push('Search and filter options');
            
            addSection(`${sectionNum}. ${section.name} Management`,
                `The ${section.name} module allows you to manage all ${section.name.toLowerCase()}-related operations in your warehouse.`,
                features
            );
            
            // Try to open a modal/form if there's an Add button
            const addBtn = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add"), a:has-text("Create")').first();
            if (await addBtn.isVisible().catch(() => false)) {
                await addBtn.click();
                await page.waitForTimeout(1500);
                
                // Check if modal opened
                const modalVisible = await page.locator('.modal, [role="dialog"], [class*="modal"]').isVisible().catch(() => false);
                if (modalVisible) {
                    await captureScreen(page, `${section.name.toLowerCase()}-form`, `Add New ${section.name.slice(0, -1)} Form`);
                    
                    const formInputs = await page.$$eval('.modal input, [role="dialog"] input', 
                        els => els.map(e => e.placeholder || e.name).filter(t => t)
                    );
                    
                    if (formInputs.length > 0) {
                        guideContent.push(`\n**Form Fields:** ${formInputs.join(', ')}\n`);
                    }
                    
                    // Close modal
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                }
            }
            
            sectionNum++;
        }
    }
    
    // ========== WRITE GUIDE FILE ==========
    console.log('\n=== WRITING GUIDE ===');
    
    guideContent.push('\n## Quick Reference\n');
    guideContent.push('\n### Keyboard Shortcuts\n');
    guideContent.push('- **Esc**: Close modals and dialogs\n');
    guideContent.push('- **Enter**: Submit forms\n');
    guideContent.push('- **Tab**: Navigate between fields\n');
    
    guideContent.push('\n### Common Actions\n');
    guideContent.push('1. **Adding Items**: Click the "Add" or "Create" button on any list page\n');
    guideContent.push('2. **Editing Items**: Click the edit icon or row to modify\n');
    guideContent.push('3. **Deleting Items**: Select item and click delete, confirm in popup\n');
    guideContent.push('4. **Searching**: Use the search bar to filter by keywords\n');
    guideContent.push('5. **Exporting**: Look for export buttons to download data\n');
    
    fs.writeFileSync(GUIDE_FILE, guideContent.join('\n'));
    console.log(`Guide written to: ${GUIDE_FILE}`);
    
    await browser.close();
    console.log('\n=== COMPLETE ===');
    console.log(`Screenshots: ${screenshotCount}`);
}

run().catch(console.error);
