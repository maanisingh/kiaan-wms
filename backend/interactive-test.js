const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://91.98.157.75:8000';
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/screenshots-interactive';

// Clean and recreate screenshot directory
if (fs.existsSync(SCREENSHOT_DIR)) {
    fs.rmSync(SCREENSHOT_DIR, { recursive: true });
}
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let screenshotCount = 0;

async function screenshot(page, category, name) {
    const catDir = path.join(SCREENSHOT_DIR, category);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(3, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(catDir, filename), fullPage: true });
    console.log(`  [${screenshotCount}] ${category}/${filename}`);
    return filename;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('Starting INTERACTIVE test - capturing real actions...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    try {
        // ===== 01. AUTHENTICATION FLOW =====
        console.log('\n=== 01. AUTHENTICATION ===');

        await page.goto(`${BASE_URL}/auth/login`);
        await delay(1000);
        await screenshot(page, '01-auth', 'login-page-empty');

        // Type email slowly to show it being entered
        await page.fill('input[type="email"]', '');
        await page.type('input[type="email"]', 'admin@kiaan-wms.com', { delay: 50 });
        await screenshot(page, '01-auth', 'login-email-entered');

        // Type password
        await page.type('input[type="password"]', 'Admin@123', { delay: 50 });
        await screenshot(page, '01-auth', 'login-credentials-filled');

        // Click login and capture loading state
        await page.click('button[type="submit"]');
        await screenshot(page, '01-auth', 'login-submitting');

        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await delay(1500);
        await screenshot(page, '01-auth', 'login-success-dashboard');

        // ===== 02. DASHBOARD INTERACTIONS =====
        console.log('\n=== 02. DASHBOARD ===');

        await screenshot(page, '02-dashboard', 'dashboard-overview');

        // Click on different dashboard cards/sections if available
        const dashCards = await page.$$('.card, [class*="stat"], [class*="widget"]');
        for (let i = 0; i < Math.min(dashCards.length, 3); i++) {
            try {
                await dashCards[i].hover();
                await delay(300);
                await screenshot(page, '02-dashboard', `dashboard-card-${i+1}-hover`);
            } catch (e) {}
        }

        // ===== 03. PRODUCTS - FULL CRUD =====
        console.log('\n=== 03. PRODUCTS ===');

        await page.click('a[href*="products"], text=Products');
        await delay(1500);
        await screenshot(page, '03-products', 'products-list');

        // Open Add Product modal
        const addProductBtn = await page.$('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
        if (addProductBtn) {
            await addProductBtn.click();
            await delay(800);
            await screenshot(page, '03-products', 'add-product-modal-open');

            // Fill the form
            const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
            if (nameInput) {
                await nameInput.type('Test Product - Interactive Demo', { delay: 30 });
                await screenshot(page, '03-products', 'add-product-name-filled');
            }

            const skuInput = await page.$('input[name="sku"], input[placeholder*="sku" i]');
            if (skuInput) {
                await skuInput.type('TEST-SKU-001', { delay: 30 });
                await screenshot(page, '03-products', 'add-product-sku-filled');
            }

            const priceInput = await page.$('input[name="price"], input[placeholder*="price" i], input[type="number"]');
            if (priceInput) {
                await priceInput.type('99.99', { delay: 30 });
                await screenshot(page, '03-products', 'add-product-price-filled');
            }

            // Show dropdown if available
            const dropdown = await page.$('select, [class*="select"], [role="combobox"]');
            if (dropdown) {
                await dropdown.click();
                await delay(500);
                await screenshot(page, '03-products', 'add-product-dropdown-open');
                await page.keyboard.press('Escape');
            }

            await screenshot(page, '03-products', 'add-product-form-completed');

            // Close modal without saving (to not mess up data)
            await page.keyboard.press('Escape');
            await delay(500);
        }

        // Click on a product row to show details
        const productRows = await page.$$('tr[class*="cursor"], tbody tr, [class*="table-row"]');
        if (productRows.length > 0) {
            await productRows[0].click();
            await delay(1000);
            await screenshot(page, '03-products', 'product-details-view');
        }

        // Show edit modal
        const editBtn = await page.$('button:has-text("Edit"), [aria-label="Edit"]');
        if (editBtn) {
            await editBtn.click();
            await delay(800);
            await screenshot(page, '03-products', 'edit-product-modal-open');
            await page.keyboard.press('Escape');
        }

        // Show delete confirmation
        const deleteBtn = await page.$('button:has-text("Delete"), [aria-label="Delete"], button[class*="danger"]');
        if (deleteBtn) {
            await deleteBtn.click();
            await delay(500);
            await screenshot(page, '03-products', 'delete-confirmation-dialog');
            // Cancel delete
            const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("No")');
            if (cancelBtn) await cancelBtn.click();
            await page.keyboard.press('Escape');
        }

        // Show search/filter
        const searchInput = await page.$('input[type="search"], input[placeholder*="search" i]');
        if (searchInput) {
            await searchInput.type('widget', { delay: 50 });
            await delay(1000);
            await screenshot(page, '03-products', 'products-search-results');
            await searchInput.fill('');
        }

        // ===== 04. INVENTORY MANAGEMENT =====
        console.log('\n=== 04. INVENTORY ===');

        await page.click('a[href*="inventory"], text=Inventory');
        await delay(1500);
        await screenshot(page, '04-inventory', 'inventory-list');

        // Stock adjustment modal
        const adjustBtn = await page.$('button:has-text("Adjust"), button:has-text("Stock")');
        if (adjustBtn) {
            await adjustBtn.click();
            await delay(800);
            await screenshot(page, '04-inventory', 'stock-adjustment-modal');

            // Fill adjustment form
            const qtyInput = await page.$('input[name="quantity"], input[type="number"]');
            if (qtyInput) {
                await qtyInput.type('50', { delay: 50 });
                await screenshot(page, '04-inventory', 'adjustment-quantity-entered');
            }

            const reasonInput = await page.$('input[name="reason"], textarea, select[name="reason"]');
            if (reasonInput) {
                await reasonInput.click();
                await delay(300);
                await screenshot(page, '04-inventory', 'adjustment-reason-dropdown');
            }

            await page.keyboard.press('Escape');
        }

        // Transfer modal
        const transferBtn = await page.$('button:has-text("Transfer")');
        if (transferBtn) {
            await transferBtn.click();
            await delay(800);
            await screenshot(page, '04-inventory', 'inventory-transfer-modal');
            await page.keyboard.press('Escape');
        }

        // ===== 05. CUSTOMERS =====
        console.log('\n=== 05. CUSTOMERS ===');

        await page.click('a[href*="customer"], text=Customers');
        await delay(1500);
        await screenshot(page, '05-customers', 'customers-list');

        // Add customer modal
        const addCustBtn = await page.$('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
        if (addCustBtn) {
            await addCustBtn.click();
            await delay(800);
            await screenshot(page, '05-customers', 'add-customer-modal');

            // Fill customer form
            const inputs = await page.$$('input[type="text"], input[type="email"]');
            for (let i = 0; i < Math.min(inputs.length, 4); i++) {
                const placeholder = await inputs[i].getAttribute('placeholder') || '';
                const name = await inputs[i].getAttribute('name') || '';
                let value = '';
                if (name.includes('name') || placeholder.toLowerCase().includes('name')) value = 'John Doe';
                else if (name.includes('email') || placeholder.toLowerCase().includes('email')) value = 'john@example.com';
                else if (name.includes('phone') || placeholder.toLowerCase().includes('phone')) value = '+1 555-123-4567';
                else if (name.includes('company') || placeholder.toLowerCase().includes('company')) value = 'Demo Corp';

                if (value) {
                    await inputs[i].type(value, { delay: 30 });
                }
            }
            await screenshot(page, '05-customers', 'add-customer-form-filled');
            await page.keyboard.press('Escape');
        }

        // ===== 06. SALES ORDERS =====
        console.log('\n=== 06. SALES ORDERS ===');

        await page.click('a[href*="sales"], a[href*="order"], text=Sales Orders, text=Orders');
        await delay(1500);
        await screenshot(page, '06-orders', 'sales-orders-list');

        // Create order modal
        const createOrderBtn = await page.$('button:has-text("Create"), button:has-text("New"), button:has-text("Add")');
        if (createOrderBtn) {
            await createOrderBtn.click();
            await delay(800);
            await screenshot(page, '06-orders', 'create-order-modal');

            // Select customer dropdown
            const custSelect = await page.$('select, [class*="select"], [role="combobox"]');
            if (custSelect) {
                await custSelect.click();
                await delay(500);
                await screenshot(page, '06-orders', 'order-customer-dropdown-open');
                await page.keyboard.press('Escape');
            }

            await page.keyboard.press('Escape');
        }

        // Click on an order to see details
        const orderRows = await page.$$('tbody tr, [class*="table-row"]');
        if (orderRows.length > 0) {
            await orderRows[0].click();
            await delay(1000);
            await screenshot(page, '06-orders', 'order-details-view');
        }

        // Order status dropdown
        const statusBtn = await page.$('button:has-text("Status"), select[name="status"], [class*="status"]');
        if (statusBtn) {
            await statusBtn.click();
            await delay(500);
            await screenshot(page, '06-orders', 'order-status-dropdown');
            await page.keyboard.press('Escape');
        }

        // ===== 07. PICKING PROCESS =====
        console.log('\n=== 07. PICKING ===');

        await page.click('a[href*="pick"], text=Picking');
        await delay(1500);
        await screenshot(page, '07-picking', 'picking-list');

        // Start picking
        const startPickBtn = await page.$('button:has-text("Start"), button:has-text("Pick")');
        if (startPickBtn) {
            await startPickBtn.click();
            await delay(800);
            await screenshot(page, '07-picking', 'picking-started');
        }

        // Scan barcode simulation
        const barcodeInput = await page.$('input[placeholder*="scan" i], input[placeholder*="barcode" i], input[name="barcode"]');
        if (barcodeInput) {
            await barcodeInput.type('PROD-001-BARCODE', { delay: 30 });
            await screenshot(page, '07-picking', 'barcode-scanned');
        }

        // Complete pick button
        const completeBtn = await page.$('button:has-text("Complete"), button:has-text("Confirm")');
        if (completeBtn) {
            await completeBtn.hover();
            await screenshot(page, '07-picking', 'complete-pick-hover');
        }

        // ===== 08. PACKING PROCESS =====
        console.log('\n=== 08. PACKING ===');

        await page.click('a[href*="pack"], text=Packing');
        await delay(1500);
        await screenshot(page, '08-packing', 'packing-list');

        // Print label button
        const printBtn = await page.$('button:has-text("Print"), button:has-text("Label")');
        if (printBtn) {
            await printBtn.click();
            await delay(800);
            await screenshot(page, '08-packing', 'print-label-modal');
            await page.keyboard.press('Escape');
        }

        // ===== 09. WAREHOUSES =====
        console.log('\n=== 09. WAREHOUSES ===');

        await page.click('a[href*="warehouse"], text=Warehouses');
        await delay(1500);
        await screenshot(page, '09-warehouses', 'warehouses-list');

        // Add warehouse
        const addWhBtn = await page.$('button:has-text("Add"), button:has-text("Create")');
        if (addWhBtn) {
            await addWhBtn.click();
            await delay(800);
            await screenshot(page, '09-warehouses', 'add-warehouse-modal');

            const whNameInput = await page.$('input[name="name"]');
            if (whNameInput) {
                await whNameInput.type('New Demo Warehouse', { delay: 30 });
                await screenshot(page, '09-warehouses', 'warehouse-name-entered');
            }
            await page.keyboard.press('Escape');
        }

        // Click warehouse to see zones/locations
        const whRows = await page.$$('tbody tr');
        if (whRows.length > 0) {
            await whRows[0].click();
            await delay(1000);
            await screenshot(page, '09-warehouses', 'warehouse-details-zones');
        }

        // ===== 10. USERS & ROLES =====
        console.log('\n=== 10. USERS & ROLES ===');

        await page.click('a[href*="user"], text=Users');
        await delay(1500);
        await screenshot(page, '10-users', 'users-list');

        // Add user modal
        const addUserBtn = await page.$('button:has-text("Add"), button:has-text("Create"), button:has-text("Invite")');
        if (addUserBtn) {
            await addUserBtn.click();
            await delay(800);
            await screenshot(page, '10-users', 'add-user-modal');

            // Fill user form
            const emailInput = await page.$('input[type="email"], input[name="email"]');
            if (emailInput) {
                await emailInput.type('newuser@company.com', { delay: 30 });
            }

            const nameInput = await page.$('input[name="name"]');
            if (nameInput) {
                await nameInput.type('New User Demo', { delay: 30 });
            }

            // Role dropdown
            const roleSelect = await page.$('select[name="role"], [class*="select"]');
            if (roleSelect) {
                await roleSelect.click();
                await delay(500);
                await screenshot(page, '10-users', 'user-role-dropdown-open');
            }

            await screenshot(page, '10-users', 'add-user-form-filled');
            await page.keyboard.press('Escape');
        }

        // ===== 11. INTEGRATIONS =====
        console.log('\n=== 11. INTEGRATIONS ===');

        await page.click('a[href*="integration"], text=Integrations, text=Channels');
        await delay(1500);
        await screenshot(page, '11-integrations', 'integrations-overview');

        // Amazon integration
        const amazonCard = await page.$('text=Amazon, [class*="amazon"]');
        if (amazonCard) {
            await amazonCard.click();
            await delay(800);
            await screenshot(page, '11-integrations', 'amazon-integration-config');
        }

        // Configure integration modal
        const configBtn = await page.$('button:has-text("Configure"), button:has-text("Connect"), button:has-text("Setup")');
        if (configBtn) {
            await configBtn.click();
            await delay(800);
            await screenshot(page, '11-integrations', 'integration-config-modal');

            // Show API key input
            const apiInput = await page.$('input[name="apiKey"], input[placeholder*="api" i], input[type="password"]');
            if (apiInput) {
                await apiInput.type('sk_test_demo_api_key_12345', { delay: 30 });
                await screenshot(page, '11-integrations', 'api-key-entered');
            }
            await page.keyboard.press('Escape');
        }

        // Shopify
        await page.goto(`${BASE_URL}/integrations`);
        await delay(1000);
        const shopifyCard = await page.$('text=Shopify');
        if (shopifyCard) {
            await shopifyCard.click();
            await delay(800);
            await screenshot(page, '11-integrations', 'shopify-integration');
        }

        // ShipStation
        const shipCard = await page.$('text=ShipStation');
        if (shipCard) {
            await shipCard.click();
            await delay(800);
            await screenshot(page, '11-integrations', 'shipstation-integration');
        }

        // ===== 12. SETTINGS =====
        console.log('\n=== 12. SETTINGS ===');

        await page.click('a[href*="setting"], text=Settings');
        await delay(1500);
        await screenshot(page, '12-settings', 'settings-main');

        // Different settings tabs
        const settingsTabs = await page.$$('[role="tab"], .tab, a[href*="settings/"]');
        for (let i = 0; i < Math.min(settingsTabs.length, 5); i++) {
            try {
                const tabText = await settingsTabs[i].textContent();
                await settingsTabs[i].click();
                await delay(800);
                await screenshot(page, '12-settings', `settings-tab-${tabText?.trim().toLowerCase().replace(/\s+/g, '-') || i}`);
            } catch (e) {}
        }

        // Printer settings
        const printerLink = await page.$('a[href*="printer"], text=Printers, text=Label');
        if (printerLink) {
            await printerLink.click();
            await delay(1000);
            await screenshot(page, '12-settings', 'printer-settings');

            // Add printer
            const addPrinterBtn = await page.$('button:has-text("Add")');
            if (addPrinterBtn) {
                await addPrinterBtn.click();
                await delay(800);
                await screenshot(page, '12-settings', 'add-printer-modal');

                // Show printer type dropdown
                const printerType = await page.$('select, [class*="select"]');
                if (printerType) {
                    await printerType.click();
                    await delay(500);
                    await screenshot(page, '12-settings', 'printer-type-dropdown');
                }
                await page.keyboard.press('Escape');
            }
        }

        // Barcode settings
        const barcodeLink = await page.$('a[href*="barcode"], text=Barcode');
        if (barcodeLink) {
            await barcodeLink.click();
            await delay(1000);
            await screenshot(page, '12-settings', 'barcode-settings');
        }

        // Label templates
        const labelLink = await page.$('a[href*="label"], text=Label');
        if (labelLink) {
            await labelLink.click();
            await delay(1000);
            await screenshot(page, '12-settings', 'label-templates');

            // Edit label template
            const editLabelBtn = await page.$('button:has-text("Edit"), tr button');
            if (editLabelBtn) {
                await editLabelBtn.click();
                await delay(800);
                await screenshot(page, '12-settings', 'label-template-editor');
                await page.keyboard.press('Escape');
            }
        }

        // ===== 13. REPORTS =====
        console.log('\n=== 13. REPORTS ===');

        await page.click('a[href*="report"], text=Reports');
        await delay(1500);
        await screenshot(page, '13-reports', 'reports-main');

        // Date range picker
        const dateBtn = await page.$('button:has-text("Date"), [class*="date"], input[type="date"]');
        if (dateBtn) {
            await dateBtn.click();
            await delay(500);
            await screenshot(page, '13-reports', 'date-range-picker-open');
            await page.keyboard.press('Escape');
        }

        // Export dropdown
        const exportBtn = await page.$('button:has-text("Export"), button:has-text("Download")');
        if (exportBtn) {
            await exportBtn.click();
            await delay(500);
            await screenshot(page, '13-reports', 'export-dropdown-open');
            await page.keyboard.press('Escape');
        }

        // Different report types
        const reportTypes = await page.$$('a[href*="report/"], button[class*="report"]');
        for (let i = 0; i < Math.min(reportTypes.length, 4); i++) {
            try {
                await reportTypes[i].click();
                await delay(1000);
                const text = await reportTypes[i].textContent();
                await screenshot(page, '13-reports', `report-${text?.trim().toLowerCase().replace(/\s+/g, '-') || i}`);
            } catch (e) {}
        }

        // ===== 14. RBAC - PICKER ROLE =====
        console.log('\n=== 14. RBAC - PICKER ===');

        // Logout
        await page.click('button:has-text("Logout"), a:has-text("Logout"), [aria-label="logout"]');
        await delay(1000);

        // Login as picker
        await page.goto(`${BASE_URL}/auth/login`);
        await delay(1000);
        await page.fill('input[type="email"]', 'picker@kiaan-wms.com');
        await page.fill('input[type="password"]', 'Picker@123');
        await screenshot(page, '14-rbac-picker', 'picker-login');

        await page.click('button[type="submit"]');
        await page.waitForURL('**/*', { timeout: 10000 });
        await delay(1500);
        await screenshot(page, '14-rbac-picker', 'picker-dashboard-limited');

        // Show restricted access - try to access admin pages
        await page.goto(`${BASE_URL}/users`);
        await delay(1500);
        await screenshot(page, '14-rbac-picker', 'picker-users-ACCESS-DENIED');

        await page.goto(`${BASE_URL}/settings`);
        await delay(1500);
        await screenshot(page, '14-rbac-picker', 'picker-settings-ACCESS-DENIED');

        await page.goto(`${BASE_URL}/integrations`);
        await delay(1500);
        await screenshot(page, '14-rbac-picker', 'picker-integrations-ACCESS-DENIED');

        // Show what picker CAN access
        await page.goto(`${BASE_URL}/picking`);
        await delay(1500);
        await screenshot(page, '14-rbac-picker', 'picker-picking-ALLOWED');

        // ===== 15. RBAC - VIEWER ROLE =====
        console.log('\n=== 15. RBAC - VIEWER ===');

        await page.click('button:has-text("Logout"), a:has-text("Logout")').catch(() => {});
        await page.goto(`${BASE_URL}/auth/login`);
        await delay(1000);
        await page.fill('input[type="email"]', 'viewer@kiaan-wms.com');
        await page.fill('input[type="password"]', 'Viewer@123');
        await screenshot(page, '15-rbac-viewer', 'viewer-login');

        await page.click('button[type="submit"]');
        await page.waitForURL('**/*', { timeout: 10000 });
        await delay(1500);
        await screenshot(page, '15-rbac-viewer', 'viewer-dashboard-readonly');

        // Viewer can see but buttons disabled
        await page.goto(`${BASE_URL}/products`);
        await delay(1500);
        await screenshot(page, '15-rbac-viewer', 'viewer-products-NO-ADD-BUTTON');

        await page.goto(`${BASE_URL}/inventory`);
        await delay(1500);
        await screenshot(page, '15-rbac-viewer', 'viewer-inventory-READ-ONLY');

        console.log(`\n✅ INTERACTIVE TEST COMPLETE`);
        console.log(`Total screenshots: ${screenshotCount}`);

    } catch (error) {
        console.error('Error:', error);
        await screenshot(page, 'error', 'error-state');
    } finally {
        await browser.close();
    }

    // Print summary
    console.log('\n=== SCREENSHOT SUMMARY ===');
    const categories = fs.readdirSync(SCREENSHOT_DIR);
    for (const cat of categories.sort()) {
        const files = fs.readdirSync(path.join(SCREENSHOT_DIR, cat));
        console.log(`${cat}: ${files.length} screenshots`);
    }
}

run();
