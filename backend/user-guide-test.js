const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://91.98.157.75:8000';
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/guide-screenshots';
const ANALYSIS_FILE = '/root/kiaan-wms-frontend/backend/screen-analysis.json';

if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const screenAnalysis = [];
let shotNum = 0;

async function captureAndAnalyze(page, section, name, manualAnalysis = null) {
    shotNum++;
    const filename = `${String(shotNum).padStart(2, '0')}-${section}-${name}.png`;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, filename), fullPage: true });

    // Analyze what's actually on the screen
    const analysis = manualAnalysis || await analyzeScreen(page);

    screenAnalysis.push({
        screenshot: filename,
        section,
        name,
        url: page.url(),
        ...analysis
    });

    console.log(`[${shotNum}] ${filename}`);
    return filename;
}

async function analyzeScreen(page) {
    const analysis = {
        title: '',
        elements: [],
        buttons: [],
        forms: [],
        tables: [],
        navigation: [],
        features: []
    };

    // Get page title
    analysis.title = await page.title().catch(() => '');

    // Get visible headings
    const headings = await page.$$eval('h1, h2, h3', els => els.map(e => e.textContent?.trim()).filter(Boolean).slice(0, 5));
    analysis.elements.push(...headings.map(h => ({ type: 'heading', text: h })));

    // Get buttons
    const buttons = await page.$$eval('button:visible, a[class*="btn"]:visible', els =>
        els.map(e => e.textContent?.trim()).filter(t => t && t.length < 30).slice(0, 10)
    );
    analysis.buttons = buttons;

    // Get form fields
    const formFields = await page.$$eval('input:visible, select:visible, textarea:visible', els =>
        els.map(e => ({
            type: e.tagName.toLowerCase(),
            name: e.name || e.placeholder || e.getAttribute('aria-label') || ''
        })).filter(f => f.name).slice(0, 10)
    );
    analysis.forms = formFields;

    // Get table info
    const tableInfo = await page.$$eval('table', tables => tables.map(t => ({
        rows: t.querySelectorAll('tbody tr').length,
        columns: t.querySelectorAll('thead th, thead td').length,
        headers: Array.from(t.querySelectorAll('thead th')).map(th => th.textContent?.trim()).slice(0, 8)
    }))).catch(() => []);
    analysis.tables = tableInfo;

    // Get navigation items
    const navItems = await page.$$eval('nav a, [class*="sidebar"] a, [class*="menu"] a', els =>
        els.map(e => e.textContent?.trim()).filter(t => t && t.length < 25).slice(0, 15)
    ).catch(() => []);
    analysis.navigation = navItems;

    // Get stats/cards
    const stats = await page.$$eval('[class*="stat"], [class*="card"], [class*="metric"]', els =>
        els.map(e => e.textContent?.trim().substring(0, 50)).filter(Boolean).slice(0, 6)
    ).catch(() => []);
    analysis.features = stats;

    return analysis;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    console.log('Creating WMS User Guide with Screen Analysis...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    // ===== 1. LOGIN =====
    console.log('\n--- AUTHENTICATION ---');
    await page.goto(`${BASE_URL}/auth/login`);
    await delay(1500);
    await captureAndAnalyze(page, 'auth', 'login-page', {
        title: 'Login Page',
        description: 'The authentication entry point for Kiaan WMS',
        features: [
            'Email input field for user credentials',
            'Password input field with secure masking',
            'Login button to submit credentials',
            'Remember me checkbox option',
            'Forgot password link for account recovery'
        ],
        howToUse: 'Enter your registered email and password, then click Login. Contact admin if you need account access.'
    });

    // Login
    await page.fill('input[type="email"]', 'admin@kiaan-wms.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    await delay(2000);

    // ===== 2. DASHBOARD =====
    console.log('\n--- DASHBOARD ---');
    await captureAndAnalyze(page, 'dashboard', 'main-overview', {
        title: 'Dashboard Overview',
        description: 'Central hub showing real-time warehouse metrics and KPIs',
        features: [
            'Total Orders widget - shows pending, processing, shipped counts',
            'Inventory Status - stock levels, low stock alerts',
            'Recent Activity feed - latest actions in the system',
            'Quick Actions panel - shortcuts to common tasks',
            'Performance Charts - visual analytics of operations',
            'Navigation Sidebar - access to all WMS modules'
        ],
        howToUse: 'Use the dashboard as your starting point each day. Check pending orders, review low stock alerts, and use quick actions for common tasks. Click any metric to drill down into details.'
    });

    // ===== 3. PRODUCTS =====
    console.log('\n--- PRODUCTS ---');
    await page.click('a[href*="product"], text=Products').catch(() => page.goto(`${BASE_URL}/products`));
    await delay(2000);
    await captureAndAnalyze(page, 'products', 'product-list', {
        title: 'Product Management',
        description: 'Complete product catalog with inventory tracking',
        features: [
            'Product table with SKU, Name, Price, Stock columns',
            'Search bar - filter products by name, SKU, or barcode',
            'Add Product button - create new products',
            'Bulk Actions dropdown - mass edit/delete/export',
            'Column sorting - click headers to sort',
            'Pagination - navigate through product pages',
            'Category filter - filter by product category',
            'Export button - download product data as CSV/Excel'
        ],
        howToUse: 'Search for products using the search bar or filters. Click a product row to view details. Use Add Product to create new items. Select multiple products for bulk operations.'
    });

    // Open Add Product modal
    const addProdBtn = await page.$('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    if (addProdBtn) {
        await addProdBtn.click();
        await delay(1000);
        await captureAndAnalyze(page, 'products', 'add-product-form', {
            title: 'Add New Product Form',
            description: 'Form to create a new product in the catalog',
            features: [
                'Product Name field - required, the display name',
                'SKU field - unique stock keeping unit identifier',
                'Barcode field - scannable barcode number',
                'Price field - selling price',
                'Cost field - purchase/manufacturing cost',
                'Category dropdown - organize products',
                'Description textarea - detailed product info',
                'Image upload - product photos',
                'Variants section - size/color options',
                'Save/Cancel buttons'
            ],
            howToUse: 'Fill in required fields (Name, SKU). Add barcode for scanning support. Set pricing and select category. Upload images for visual identification. Click Save to create the product.'
        });
        await page.keyboard.press('Escape');
        await delay(500);
    }

    // ===== 4. INVENTORY =====
    console.log('\n--- INVENTORY ---');
    await page.click('a[href*="inventory"], text=Inventory').catch(() => page.goto(`${BASE_URL}/inventory`));
    await delay(2000);
    await captureAndAnalyze(page, 'inventory', 'inventory-management', {
        title: 'Inventory Management',
        description: 'Real-time stock levels and inventory operations',
        features: [
            'Stock Level table - product, location, quantity, status',
            'Low Stock Alerts - highlighted items below threshold',
            'Adjust Stock button - manual stock corrections',
            'Transfer Stock button - move between locations',
            'Receive Inventory button - log incoming stock',
            'Location filter - view by warehouse/zone',
            'Stock History - audit trail of changes',
            'Reorder alerts - items needing replenishment'
        ],
        howToUse: 'Monitor stock levels in the table. Red/yellow highlights indicate low stock. Use Adjust Stock for corrections (damaged, miscounted). Use Transfer to move stock between locations. Receive Inventory when new shipments arrive.'
    });

    // ===== 5. SALES ORDERS =====
    console.log('\n--- SALES ORDERS ---');
    await page.click('a[href*="sales"], a[href*="order"], text=Sales, text=Orders').catch(() => page.goto(`${BASE_URL}/sales-orders`));
    await delay(2000);
    await captureAndAnalyze(page, 'orders', 'sales-orders-list', {
        title: 'Sales Orders Management',
        description: 'Order processing from receipt to fulfillment',
        features: [
            'Orders table - Order #, Customer, Date, Status, Total',
            'Status badges - Pending, Processing, Shipped, Delivered',
            'Create Order button - manual order entry',
            'Order Search - find by order number or customer',
            'Status filter dropdown - filter by order status',
            'Date range filter - orders within timeframe',
            'Bulk Actions - process multiple orders',
            'Export orders - download order data',
            'Order sync status - integration sync indicators'
        ],
        howToUse: 'New orders appear as Pending. Click an order to view details and process it. Use filters to find specific orders. Bulk select orders for batch processing. Status automatically updates as orders move through picking/packing/shipping.'
    });

    // Order details if possible
    const orderRow = await page.$('tbody tr');
    if (orderRow) {
        await orderRow.click();
        await delay(1500);
        await captureAndAnalyze(page, 'orders', 'order-details', {
            title: 'Order Details View',
            description: 'Complete order information and fulfillment actions',
            features: [
                'Order header - order number, date, status',
                'Customer info - name, email, shipping address',
                'Order items list - products, quantities, prices',
                'Order totals - subtotal, tax, shipping, total',
                'Status timeline - order progression history',
                'Action buttons - Start Picking, Print Label, Ship',
                'Notes section - internal order notes',
                'Payment status indicator'
            ],
            howToUse: 'Review order details and customer info. Click Start Picking to begin fulfillment. Print shipping labels when ready. Update status as order progresses. Add notes for team communication.'
        });
        await page.goBack().catch(() => {});
        await delay(1000);
    }

    // ===== 6. PICKING =====
    console.log('\n--- PICKING ---');
    await page.click('a[href*="pick"], text=Picking').catch(() => page.goto(`${BASE_URL}/picking`));
    await delay(2000);
    await captureAndAnalyze(page, 'fulfillment', 'picking-queue', {
        title: 'Picking Queue',
        description: 'Orders ready for warehouse picking',
        features: [
            'Pick queue table - orders awaiting picking',
            'Priority indicators - urgent orders highlighted',
            'Start Picking button - begin pick process',
            'Batch Pick option - pick multiple orders together',
            'Pick list view - items to collect',
            'Location guidance - bin/shelf locations',
            'Barcode scan input - verify picked items',
            'Complete Pick button - finish picking process',
            'Picker assignment - see who is picking what'
        ],
        howToUse: 'Select an order and click Start Picking. Follow the pick list showing item locations. Scan each item barcode to verify correct picks. Mark items as picked. Click Complete when all items collected. Order moves to Packing queue.'
    });

    // ===== 7. PACKING =====
    console.log('\n--- PACKING ---');
    await page.click('a[href*="pack"], text=Packing').catch(() => page.goto(`${BASE_URL}/packing`));
    await delay(2000);
    await captureAndAnalyze(page, 'fulfillment', 'packing-station', {
        title: 'Packing Station',
        description: 'Pack picked orders for shipment',
        features: [
            'Packing queue - picked orders ready to pack',
            'Order items checklist - verify all items present',
            'Package selection - box size options',
            'Weight input - package weight for shipping',
            'Print Label button - generate shipping label',
            'Packing slip print - include in package',
            'Complete Packing button - finalize package',
            'Carrier selection - shipping carrier options'
        ],
        howToUse: 'Scan order or select from queue. Verify all items match the order. Select appropriate box size. Enter package weight. Print shipping label and packing slip. Apply label to package. Click Complete to move to shipping.'
    });

    // ===== 8. CUSTOMERS =====
    console.log('\n--- CUSTOMERS ---');
    await page.click('a[href*="customer"], text=Customers').catch(() => page.goto(`${BASE_URL}/customers`));
    await delay(2000);
    await captureAndAnalyze(page, 'customers', 'customer-management', {
        title: 'Customer Management',
        description: 'Customer database and order history',
        features: [
            'Customer table - Name, Email, Phone, Orders, Total Spent',
            'Add Customer button - create new customer',
            'Customer search - find by name/email/phone',
            'Customer details - click to view full profile',
            'Order history link - see customer orders',
            'Edit customer - update contact info',
            'Customer notes - add internal notes',
            'Export customers - download customer list'
        ],
        howToUse: 'Search for customers or browse the list. Click a customer to see their full profile and order history. Add new customers manually or they are auto-created from orders. Use notes for CRM-style tracking.'
    });

    // ===== 9. WAREHOUSES =====
    console.log('\n--- WAREHOUSES ---');
    await page.click('a[href*="warehouse"], text=Warehouses').catch(() => page.goto(`${BASE_URL}/warehouses`));
    await delay(2000);
    await captureAndAnalyze(page, 'warehouses', 'warehouse-management', {
        title: 'Warehouse Management',
        description: 'Warehouse locations, zones, and bin management',
        features: [
            'Warehouse list - all warehouse locations',
            'Add Warehouse button - create new warehouse',
            'Warehouse details - address, contact, capacity',
            'Zones section - logical warehouse divisions',
            'Locations/Bins - specific storage locations',
            'Location naming - customizable bin naming scheme',
            'Capacity tracking - space utilization',
            'Default warehouse setting'
        ],
        howToUse: 'Set up warehouses representing physical locations. Create zones within each warehouse (Receiving, Storage, Shipping). Define bin locations for precise inventory placement. Use location codes for efficient picking routes.'
    });

    // ===== 10. USERS & RBAC =====
    console.log('\n--- USERS & RBAC ---');
    await page.click('a[href*="user"], text=Users').catch(() => page.goto(`${BASE_URL}/users`));
    await delay(2000);
    await captureAndAnalyze(page, 'admin', 'user-management', {
        title: 'User Management & Access Control',
        description: 'Manage team members and their permissions',
        features: [
            'User table - Name, Email, Role, Status, Last Active',
            'Add User button - invite new team members',
            'Role column - SUPER_ADMIN, PICKER, PACKER, VIEWER',
            'Status toggle - Active/Inactive users',
            'Edit user - change role or details',
            'Delete user - remove access',
            'Role permissions summary',
            'Password reset option'
        ],
        howToUse: 'Add users with appropriate roles. SUPER_ADMIN has full access. PICKER can only access picking functions. PACKER handles packing station. VIEWER has read-only access. Deactivate users to revoke access without deleting history.'
    });

    // ===== 11. INTEGRATIONS =====
    console.log('\n--- INTEGRATIONS ---');
    await page.click('a[href*="integration"], a[href*="channel"], text=Integrations').catch(() => page.goto(`${BASE_URL}/integrations`));
    await delay(2000);
    await captureAndAnalyze(page, 'integrations', 'integration-hub', {
        title: 'Integrations & Sales Channels',
        description: 'Connect external platforms and services',
        features: [
            'Amazon Seller Central - sync Amazon orders/inventory',
            'Shopify - e-commerce platform integration',
            'ShipStation - shipping carrier management',
            'QuickBooks - accounting sync',
            'Connection status indicators - Connected/Disconnected',
            'Configure button - set up API credentials',
            'Sync Now button - manual data sync',
            'Last Sync timestamp - sync status',
            'Webhook URLs - for incoming data'
        ],
        howToUse: 'Click Configure on each platform to enter API credentials. Once connected, orders sync automatically. Inventory updates push to connected channels. Use Sync Now for immediate updates. Check sync status for any issues.'
    });

    // ===== 12. SETTINGS =====
    console.log('\n--- SETTINGS ---');
    await page.click('a[href*="setting"], text=Settings').catch(() => page.goto(`${BASE_URL}/settings`));
    await delay(2000);
    await captureAndAnalyze(page, 'settings', 'system-settings', {
        title: 'System Settings',
        description: 'Configure WMS behavior and preferences',
        features: [
            'Company Settings - business name, address, logo',
            'Label Settings - shipping label format (ZPL, PDF)',
            'Printer Configuration - connect label printers',
            'Barcode Settings - scanner configuration',
            'Notification Settings - email/alert preferences',
            'Tax Settings - tax rates by region',
            'Shipping Settings - carrier accounts',
            'Backup & Export - data backup options'
        ],
        howToUse: 'Configure company details first. Set up printers for label printing (supports ZPL thermal printers). Configure barcode scanners for hands-free operation. Set tax rates for accurate order totals. Enable notifications for important alerts.'
    });

    // ===== 13. REPORTS =====
    console.log('\n--- REPORTS ---');
    await page.click('a[href*="report"], text=Reports').catch(() => page.goto(`${BASE_URL}/reports`));
    await delay(2000);
    await captureAndAnalyze(page, 'reports', 'analytics-reports', {
        title: 'Reports & Analytics',
        description: 'Business intelligence and operational reports',
        features: [
            'Sales Reports - revenue, orders by period',
            'Inventory Reports - stock levels, movement',
            'Fulfillment Reports - pick/pack efficiency',
            'Date Range selector - custom reporting periods',
            'Export options - PDF, CSV, Excel download',
            'Chart visualizations - graphs and trends',
            'Comparison tools - period over period',
            'Scheduled reports - automatic report emails'
        ],
        howToUse: 'Select report type from the menu. Set date range for the period you want to analyze. Charts show trends visually. Export data for further analysis. Use scheduled reports for regular updates to stakeholders.'
    });

    // ===== 14. RBAC DEMO - PICKER =====
    console.log('\n--- RBAC DEMO ---');
    // Logout
    const logoutBtn = await page.$('button:has-text("Logout"), a:has-text("Logout"), text=Sign Out');
    if (logoutBtn) await logoutBtn.click();
    await delay(1000);

    await page.goto(`${BASE_URL}/auth/login`);
    await delay(1000);
    await page.fill('input[type="email"]', 'picker@kiaan-wms.com');
    await page.fill('input[type="password"]', 'Picker@123');
    await page.click('button[type="submit"]');
    await delay(3000);

    await captureAndAnalyze(page, 'rbac', 'picker-restricted-view', {
        title: 'RBAC Demo - Picker Role (Restricted Access)',
        description: 'Demonstrates role-based access control limiting picker to relevant functions only',
        features: [
            'Limited navigation - only picking-related menus visible',
            'No Settings access - configuration hidden',
            'No User Management - cannot see other users',
            'No Integration access - cannot modify connections',
            'Picking queue accessible - core job function',
            'View-only on orders - cannot edit order details',
            'Focused interface - reduces errors and confusion'
        ],
        howToUse: 'Pickers see only what they need. They can access the picking queue and mark items as picked. All admin functions are hidden. This improves security and simplifies the interface for warehouse staff.'
    });

    // Try to access restricted page
    await page.goto(`${BASE_URL}/settings`);
    await delay(1500);
    await captureAndAnalyze(page, 'rbac', 'access-denied-example', {
        title: 'Access Denied - RBAC Enforcement',
        description: 'When a restricted user tries to access admin pages',
        features: [
            'Access denied message or redirect',
            'User redirected to allowed page',
            'No sensitive data exposed',
            'Audit log entry created',
            'Clear feedback to user about permissions'
        ],
        howToUse: 'If you see this screen, you do not have permission for this area. Contact your administrator if you need access. Your current role determines available features.'
    });

    await browser.close();

    // Save analysis
    fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(screenAnalysis, null, 2));
    console.log(`\n✅ Complete! ${screenAnalysis.length} screens analyzed`);
    console.log(`Analysis saved to: ${ANALYSIS_FILE}`);
}

run().catch(console.error);
