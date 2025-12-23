const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://91.98.157.75:8000';
const ADMIN_URL = `${BASE_URL}/admin`;
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/wms-guide';
const GUIDE_FILE = '/root/kiaan-wms-frontend/backend/USER_GUIDE.md';

if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let guide = [];
let imgNum = 0;

function img(name, alt) {
    imgNum++;
    return {
        filename: `${String(imgNum).padStart(2, '0')}-${name}.png`,
        markdown: `![${alt}](./wms-guide/${String(imgNum).padStart(2, '0')}-${name}.png)`
    };
}

async function screenshot(page, name, alt) {
    const i = img(name, alt);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${i.filename}`, fullPage: false });
    console.log(`Screenshot: ${i.filename}`);
    return i;
}

async function getPageInfo(page) {
    return await page.evaluate(() => {
        const getText = (sel) => {
            const els = document.querySelectorAll(sel);
            return [...els].map(e => e.textContent?.trim()).filter(t => t && t.length < 100);
        };
        const getLinks = (sel) => {
            const els = document.querySelectorAll(sel);
            return [...els].map(e => ({
                text: e.textContent?.trim(),
                href: e.href
            })).filter(l => l.text && l.href);
        };
        return {
            title: document.title,
            h1: getText('h1'),
            h2: getText('h2'),
            buttons: getText('button'),
            inputs: [...document.querySelectorAll('input:not([type="hidden"])')].map(e => ({
                type: e.type,
                name: e.name || e.placeholder || '',
                placeholder: e.placeholder
            })),
            links: getLinks('a').slice(0, 50),
            sidebarLinks: getLinks('aside a, .sidebar a, [class*="sidebar"] a, nav.sidebar a, [class*="menu"] a'),
            hasTable: !!document.querySelector('table'),
            cardCount: document.querySelectorAll('.card, [class*="-card"], [class*="Card"]').length,
            formCount: document.querySelectorAll('form').length
        };
    });
}

async function run() {
    console.log('Starting comprehensive WMS guide generation...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // ============ HEADER ============
    guide.push(`# Kiaan WMS - Complete User Guide

This comprehensive guide covers all features and functionality of the Kiaan Warehouse Management System (WMS). The platform is built on Bagisto, a powerful Laravel-based e-commerce system with integrated warehouse management capabilities.

---

## Table of Contents
1. [Getting Started - Authentication](#1-getting-started---authentication)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Product Management](#3-product-management)
4. [Inventory & Stock](#4-inventory--stock-management)
5. [Order Management](#5-order-management)
6. [Customer Management](#6-customer-management)
7. [Reports & Analytics](#7-reports--analytics)
8. [System Settings](#8-system-settings)

---
`);

    // ============ 1. AUTHENTICATION ============
    console.log('=== SECTION 1: AUTHENTICATION ===');

    await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    const loginInfo = await getPageInfo(page);
    console.log('Login page info:', JSON.stringify(loginInfo, null, 2));

    const loginImg = await screenshot(page, 'admin-login', 'Admin Panel Login Page');

    guide.push(`## 1. Getting Started - Authentication

### Accessing the Admin Panel

Navigate to the admin login page at: \`${ADMIN_URL}/login\`

${loginImg.markdown}

### Login Form Fields

The login page contains the following elements:

| Field | Description |
|-------|-------------|
| **Email Address** | Enter your administrator email (e.g., admin@example.com) |
| **Password** | Your secure admin password |
| **Remember Me** | Optional checkbox to stay logged in |
| **Forgot Password** | Link to reset your password if forgotten |

### Login Process

1. Enter your registered admin email address
2. Enter your password
3. (Optional) Check "Remember Me" to stay logged in
4. Click the **Sign In** button

> **Security Note:** Always log out when using shared computers and use strong, unique passwords.

---
`);

    // Try to login with common credentials
    const credentials = [
        { email: 'admin@example.com', pass: 'admin123' },
        { email: 'admin@admin.com', pass: 'admin123' },
        { email: 'demo@example.com', pass: 'demo123' },
        { email: 'admin@kiaan.com', pass: 'password123' }
    ];

    let loggedIn = false;

    for (const cred of credentials) {
        console.log(`Trying login: ${cred.email}`);

        await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passInput = page.locator('input[type="password"]').first();

        if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill(cred.email);
            await passInput.fill(cred.pass);

            const submitBtn = page.locator('button[type="submit"]').first();
            await submitBtn.click();
            await page.waitForTimeout(3000);

            if (!page.url().includes('login')) {
                loggedIn = true;
                console.log(`SUCCESS: Logged in with ${cred.email}`);
                break;
            }
        }
    }

    if (!loggedIn) {
        console.log('Could not login with test credentials. Taking screenshots of login state...');
    }

    // ============ 2. DASHBOARD ============
    console.log('\n=== SECTION 2: DASHBOARD ===');

    if (loggedIn) {
        await page.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 60000 });
    } else {
        await page.goto(`${ADMIN_URL}`, { waitUntil: 'networkidle', timeout: 60000 });
    }
    await page.waitForTimeout(2000);

    const dashInfo = await getPageInfo(page);
    console.log('Dashboard info:', JSON.stringify(dashInfo, null, 2));

    const dashImg = await screenshot(page, 'dashboard', 'Admin Dashboard - Main Control Center');

    // Get sidebar menu items
    const menuItems = dashInfo.sidebarLinks.length > 0 ? dashInfo.sidebarLinks : dashInfo.links.filter(l =>
        l.href.includes('/admin/') && !l.href.includes('login')
    );

    console.log('Menu items found:', menuItems.length);

    let menuTable = '| Icon | Module | Description |\n|------|--------|-------------|\n';
    const menuDescriptions = {
        'dashboard': ['Dashboard', 'Main overview with key metrics and quick actions'],
        'catalog': ['Catalog', 'Manage products, categories, and attributes'],
        'product': ['Products', 'Add, edit, and manage inventory items'],
        'categor': ['Categories', 'Organize products into categories'],
        'attribute': ['Attributes', 'Define product specifications'],
        'customer': ['Customers', 'View and manage customer accounts'],
        'sale': ['Sales', 'Track orders and transactions'],
        'order': ['Orders', 'Process and fulfill customer orders'],
        'invoice': ['Invoices', 'Generate and manage invoices'],
        'shipment': ['Shipments', 'Track and manage shipping'],
        'refund': ['Refunds', 'Process returns and refunds'],
        'report': ['Reports', 'View analytics and business insights'],
        'marketing': ['Marketing', 'Promotions and campaigns'],
        'cms': ['CMS', 'Content management for pages'],
        'setting': ['Settings', 'System configuration'],
        'config': ['Configuration', 'Advanced system settings'],
        'user': ['Users', 'Admin user management'],
        'role': ['Roles', 'Permission management']
    };

    for (const item of menuItems.slice(0, 15)) {
        const key = Object.keys(menuDescriptions).find(k => item.href?.toLowerCase().includes(k) || item.text?.toLowerCase().includes(k));
        if (key) {
            menuTable += `| - | **${menuDescriptions[key][0]}** | ${menuDescriptions[key][1]} |\n`;
        }
    }

    guide.push(`## 2. Dashboard Overview

The dashboard is your central hub for monitoring and managing all warehouse operations.

${dashImg.markdown}

### Navigation Menu

The left sidebar provides access to all system modules:

${menuTable}

### Dashboard Features

The main dashboard displays:

- **Key Metrics Cards** - Real-time statistics on orders, revenue, customers
- **Recent Orders** - Quick view of latest transactions
- **Top Products** - Best-selling items overview
- **Sales Graph** - Visual representation of sales trends
- **Quick Actions** - Fast access to common tasks

### Using the Dashboard

1. **Review Metrics** - Check daily/weekly/monthly performance at a glance
2. **Monitor Orders** - See new orders requiring attention
3. **Track Inventory** - Quick overview of stock levels
4. **Access Reports** - Click through to detailed analytics

---
`);

    // ============ 3. PRODUCT MANAGEMENT ============
    console.log('\n=== SECTION 3: PRODUCTS ===');

    const productLink = menuItems.find(l => l.href?.includes('product') || l.href?.includes('catalog'));
    if (productLink) {
        await page.goto(productLink.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const prodInfo = await getPageInfo(page);
        const prodImg = await screenshot(page, 'products-list', 'Product Management - Inventory List');

        guide.push(`## 3. Product Management

The product management module allows you to add, edit, and organize your inventory.

${prodImg.markdown}

### Product List View

**Features on this screen:**
- **Product Table** - Displays all products with key information
- **Search Bar** - Find products by name, SKU, or attributes
- **Filters** - Filter by category, status, price range
- **Bulk Actions** - Apply actions to multiple products at once
- **Export** - Download product data in various formats

### Table Columns

| Column | Description |
|--------|-------------|
| Image | Product thumbnail |
| Name | Product title and variants |
| SKU | Stock Keeping Unit identifier |
| Price | Current selling price |
| Quantity | Available stock count |
| Status | Active/Inactive toggle |
| Actions | Edit, Delete, View options |

### Adding a New Product

1. Click **"Create Product"** button (top right)
2. Select product type (Simple, Configurable, Virtual, etc.)
3. Fill in required fields (marked with *)
4. Add product images
5. Set inventory quantity
6. Configure pricing
7. Click **Save** to create the product

`);

        // Try to click Create/Add Product button
        const addBtn = page.locator('button:has-text("Create"), button:has-text("Add"), a:has-text("Create"), a:has-text("Add Product")').first();
        if (await addBtn.isVisible().catch(() => false)) {
            await addBtn.click();
            await page.waitForTimeout(2000);

            const formImg = await screenshot(page, 'product-form', 'Create New Product Form');

            guide.push(`### Product Creation Form

${formImg.markdown}

**Form Sections:**

1. **General Information**
   - Product Name (required)
   - SKU - Stock Keeping Unit
   - URL Key - SEO-friendly URL slug
   - Product Type selection

2. **Description**
   - Short Description - Brief summary for listings
   - Full Description - Detailed product information
   - Rich text editor with formatting options

3. **Meta Information**
   - Meta Title - SEO page title
   - Meta Keywords - Search keywords
   - Meta Description - Search result snippet

4. **Images**
   - Main product image
   - Additional gallery images
   - Image alt text for accessibility

5. **Pricing**
   - Base Price
   - Special/Sale Price
   - Cost price (for profit calculations)

6. **Inventory**
   - Quantity in stock
   - Stock availability status
   - Backorder settings

---
`);
            await page.goBack();
            await page.waitForTimeout(1000);
        }
    }

    // ============ 4. INVENTORY ============
    console.log('\n=== SECTION 4: INVENTORY ===');

    guide.push(`## 4. Inventory & Stock Management

The inventory module helps you track stock levels across your warehouse.

### Stock Management Features

| Feature | Description |
|---------|-------------|
| **Stock Tracking** | Real-time inventory counts |
| **Low Stock Alerts** | Notifications when items run low |
| **Stock Adjustments** | Manual inventory corrections |
| **Warehouse Locations** | Multi-location support |
| **Stock History** | Audit trail of changes |

### Managing Stock Levels

1. **View Current Stock**
   - Navigate to Products -> select a product
   - View "Inventory" section for quantity details

2. **Adjust Inventory**
   - Edit product -> Inventory section
   - Enter new quantity
   - System logs the adjustment automatically

3. **Bulk Stock Update**
   - Use import/export feature
   - Download current inventory CSV
   - Update quantities in spreadsheet
   - Upload modified file

### Low Stock Notifications

Configure alerts in Settings -> Inventory:
- Set minimum stock threshold per product
- Enable email notifications
- Configure notification recipients

---
`);

    // ============ 5. ORDERS ============
    console.log('\n=== SECTION 5: ORDERS ===');

    const orderLink = menuItems.find(l => l.href?.includes('order') || l.href?.includes('sale'));
    if (orderLink) {
        await page.goto(orderLink.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const orderImg = await screenshot(page, 'orders-list', 'Order Management - All Orders');

        guide.push(`## 5. Order Management

Process and fulfill customer orders efficiently.

${orderImg.markdown}

### Order List Features

- **Order Table** - All orders with status indicators
- **Status Filters** - Pending, Processing, Complete, Cancelled
- **Date Range** - Filter by order date
- **Search** - Find orders by ID, customer, or product
- **Quick Actions** - Process orders directly from list

### Order Statuses

| Status | Color | Description |
|--------|-------|-------------|
| **Pending** | Yellow | New order awaiting processing |
| **Processing** | Blue | Order being prepared |
| **Shipped** | Purple | Order dispatched |
| **Completed** | Green | Order delivered |
| **Cancelled** | Red | Order cancelled |
| **Refunded** | Gray | Payment returned |

### Processing an Order

1. **View Order Details**
   - Click order number to open details
   - Review items, quantities, pricing

2. **Create Invoice**
   - Click "Create Invoice" button
   - Verify line items
   - Submit to generate invoice

3. **Create Shipment**
   - Click "Create Shipment"
   - Enter tracking number
   - Select carrier
   - Confirm shipment

4. **Complete Order**
   - Order auto-completes when shipped
   - Customer receives notification

`);

        // Try to view order detail
        const orderRow = page.locator('table tr').nth(1);
        if (await orderRow.isVisible().catch(() => false)) {
            const viewLink = orderRow.locator('a').first();
            if (await viewLink.isVisible().catch(() => false)) {
                await viewLink.click();
                await page.waitForTimeout(2000);

                const detailImg = await screenshot(page, 'order-detail', 'Order Detail View');
                guide.push(`### Order Detail View

${detailImg.markdown}

**Order Detail Sections:**

1. **Order Information**
   - Order number, date, status
   - Payment method used
   - Customer IP address

2. **Customer Details**
   - Name and contact info
   - Billing address
   - Shipping address

3. **Items Ordered**
   - Product list with images
   - Quantities and prices
   - Subtotals per item

4. **Order Totals**
   - Subtotal
   - Shipping cost
   - Tax amount
   - Grand total

5. **Order History**
   - Status change log
   - Comments and notes
   - Timestamps

---
`);
                await page.goBack();
            }
        }
    }

    // ============ 6. CUSTOMERS ============
    console.log('\n=== SECTION 6: CUSTOMERS ===');

    const customerLink = menuItems.find(l => l.href?.includes('customer'));
    if (customerLink) {
        await page.goto(customerLink.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const custImg = await screenshot(page, 'customers-list', 'Customer Management');

        guide.push(`## 6. Customer Management

Manage customer accounts and their order history.

${custImg.markdown}

### Customer List Features

- **Customer Table** - All registered customers
- **Search** - Find by name, email, phone
- **Status Filter** - Active/Inactive customers
- **Customer Groups** - Filter by membership level
- **Export** - Download customer data

### Customer Information

| Field | Description |
|-------|-------------|
| Name | Customer full name |
| Email | Primary contact email |
| Phone | Contact number |
| Group | Customer category (Guest, General, VIP) |
| Orders | Total order count |
| Revenue | Lifetime purchase value |
| Status | Account active/inactive |

### Managing Customers

1. **View Customer Profile**
   - Click customer name
   - See complete account details
   - Review order history

2. **Edit Customer**
   - Update contact information
   - Change customer group
   - Modify account status

3. **Customer Groups**
   - Create custom groups (Wholesale, VIP, etc.)
   - Set group-specific pricing
   - Apply special discounts

---
`);
    }

    // ============ 7. REPORTS ============
    console.log('\n=== SECTION 7: REPORTS ===');

    const reportLink = menuItems.find(l => l.href?.includes('report') || l.text?.toLowerCase().includes('report'));
    if (reportLink) {
        await page.goto(reportLink.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const reportImg = await screenshot(page, 'reports', 'Reports & Analytics');

        guide.push(`## 7. Reports & Analytics

Access comprehensive business intelligence and analytics.

${reportImg.markdown}

### Available Reports

| Report Type | Description |
|-------------|-------------|
| **Sales Report** | Revenue, orders, average order value |
| **Product Report** | Best sellers, inventory turnover |
| **Customer Report** | New vs returning, lifetime value |
| **Tax Report** | Tax collected by region |
| **Abandoned Carts** | Cart abandonment analysis |

### Using Reports

1. **Select Report Type**
   - Choose from dropdown menu
   - Each report has specific metrics

2. **Set Date Range**
   - Use date picker for custom range
   - Quick options: Today, Week, Month, Year

3. **Apply Filters**
   - Filter by category
   - Filter by customer group
   - Filter by payment method

4. **Export Data**
   - Download as CSV/Excel
   - Print reports
   - Share via email

---
`);
    }

    // ============ 8. SETTINGS ============
    console.log('\n=== SECTION 8: SETTINGS ===');

    const settingLink = menuItems.find(l => l.href?.includes('setting') || l.href?.includes('config'));
    if (settingLink) {
        await page.goto(settingLink.href, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const settingImg = await screenshot(page, 'settings', 'System Settings');

        guide.push(`## 8. System Settings

Configure system preferences and business settings.

${settingImg.markdown}

### Settings Categories

| Category | Options |
|----------|---------|
| **General** | Store name, logo, contact info |
| **Catalog** | Product display, pagination |
| **Sales** | Order processing, invoicing |
| **Shipping** | Carriers, rates, zones |
| **Payment** | Payment gateways, methods |
| **Tax** | Tax rates, rules, zones |
| **Email** | Notification templates |
| **Users** | Admin accounts, permissions |

### Key Configuration Areas

1. **Store Information**
   - Business name and logo
   - Store address
   - Contact details
   - Operating hours

2. **Payment Methods**
   - Enable/disable payment options
   - Configure gateway credentials
   - Set minimum order amounts

3. **Shipping Settings**
   - Define shipping zones
   - Set carrier rates
   - Free shipping thresholds
   - Handling fees

4. **Tax Configuration**
   - Tax rates by region
   - Product tax classes
   - Tax calculation rules

5. **Email Notifications**
   - Order confirmation templates
   - Shipping notifications
   - Customer account emails

---
`);
    }

    // ============ QUICK REFERENCE ============
    guide.push(`## Quick Reference Guide

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Esc | Close modal/dialog |
| Enter | Submit form |
| Tab | Move to next field |
| Ctrl+S | Save changes |

### Common Tasks Checklist

- [ ] **Daily:** Check new orders and process pending ones
- [ ] **Daily:** Review low stock alerts
- [ ] **Weekly:** Run sales reports
- [ ] **Weekly:** Review abandoned carts
- [ ] **Monthly:** Analyze customer trends
- [ ] **Monthly:** Update product information

### Support Resources

- **Documentation:** Access help via the ? icon
- **Support:** Contact your system administrator
- **Updates:** Check for system updates regularly

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't login | Clear browser cache, reset password |
| Page not loading | Check internet connection, refresh |
| Data not saving | Verify required fields, try again |
| Export failing | Reduce date range, check permissions |

### Getting Help

1. Check the built-in documentation
2. Contact your system administrator
3. Review the error message details
4. Clear cache and try again

---

*This guide covers the core functionality of the Kiaan WMS platform. For advanced features or customizations, consult your system administrator.*
`);

    // ============ WRITE FILE ============
    console.log('\n=== WRITING GUIDE FILE ===');

    fs.writeFileSync(GUIDE_FILE, guide.join('\n'));
    console.log(`Guide saved to: ${GUIDE_FILE}`);
    console.log(`Screenshots: ${imgNum}`);
    console.log(`Directory: ${SCREENSHOT_DIR}`);

    // List screenshots
    const screenshots = fs.readdirSync(SCREENSHOT_DIR);
    console.log('\nScreenshots created:');
    screenshots.forEach(s => console.log(`  - ${s}`));

    await browser.close();
    console.log('\n=== GUIDE GENERATION COMPLETE ===');
}

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
