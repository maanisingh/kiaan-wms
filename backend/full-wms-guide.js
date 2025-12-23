const { chromium } = require('playwright');
const fs = require('fs');

const WMS_URL = 'https://wms.alexandratechlab.com';
const SCREENSHOT_DIR = '/root/kiaan-wms-frontend/backend/wms-screenshots';
const GUIDE_FILE = '/root/kiaan-wms-frontend/backend/KIAAN_WMS_USER_GUIDE.md';

if (fs.existsSync(SCREENSHOT_DIR)) fs.rmSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let guide = [];
let imgNum = 0;

async function screenshot(page, name, alt) {
    imgNum++;
    const filename = `${String(imgNum).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}`, fullPage: false });
    console.log(`  [${imgNum}] ${filename}`);
    return `![${alt}](./wms-screenshots/${filename})`;
}

async function login(page, email) {
    await page.goto(`${WMS_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInput.fill(email);
        await passInput.fill('password123');

        const submitBtn = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(3000);
            return !page.url().includes('login') && !page.url().includes('auth');
        }
    }
    return false;
}

async function run() {
    console.log('=== Generating Comprehensive Kiaan WMS User Guide ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // ===== HEADER =====
    guide.push(`# Kiaan WMS - Complete User Guide

**Kiaan Warehouse Management System** is a modern, role-based platform for managing warehouse operations including inventory tracking, order fulfillment, picking, packing, and shipping.

**Access URL:** ${WMS_URL}

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Landing Page Overview](#2-landing-page-overview)
3. [Authentication & Login](#3-authentication--login)
4. [Administrator Dashboard](#4-administrator-dashboard)
5. [Manager Dashboard](#5-manager-dashboard)
6. [Picker Interface](#6-picker-interface)
7. [Packer Interface](#7-packer-interface)
8. [Inventory Management](#8-inventory-management)
9. [Order Management](#9-order-management)
10. [Reports & Analytics](#10-reports--analytics)
11. [System Settings](#11-system-settings)

---
`);

    // ===== 1. GETTING STARTED =====
    guide.push(`## 1. Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- Screen resolution: 1280x720 minimum (1920x1080 recommended)

### Quick Start

1. Open your browser and navigate to ${WMS_URL}
2. Click "Get Started" or go directly to ${WMS_URL}/auth/login
3. Enter your credentials (email and password)
4. You'll be directed to your role-specific dashboard

### User Roles

The system supports multiple roles with tailored interfaces:

| Role | Primary Functions |
|------|-------------------|
| **Administrator** | Full system access, user management, configuration |
| **Manager** | Team oversight, reporting, operational planning |
| **Picker** | Order picking, inventory location, task completion |
| **Packer** | Order packing, verification, shipping preparation |

---
`);

    // ===== 2. LANDING PAGE =====
    console.log('Section 2: Landing Page');
    await page.goto(WMS_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const landingImg = await screenshot(page, 'landing-hero', 'Kiaan WMS Landing Page Hero');

    guide.push(`## 2. Landing Page Overview

### Hero Section

${landingImg}

The landing page welcomes users with a modern, professional interface featuring:

**Main Elements:**
- **Animated Hero** - Dynamic background with gradient effects
- **Platform Title** - "Warehouse Operations Reimagined"
- **Key Selling Points:**
  - Role-based access control
  - Real-time dashboards
  - Smart inventory management

**Call-to-Action Buttons:**
- **Start Free Trial** - Begin using the platform
- **No credit card required** - Risk-free trial
- **14-day free trial** - Full feature access
- **Cancel anytime** - No commitment

`);

    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(1000);
    const featuresImg = await screenshot(page, 'features', 'Platform Features');

    guide.push(`### Platform Features

${featuresImg}

**Core Capabilities:**

| Feature | Description |
|---------|-------------|
| **Role-Based Access** | Granular permissions for each user type |
| **Lightning Performance** | Built with Next.js for sub-second loads |
| **Real-Time Dashboards** | Live KPIs tailored to each role |
| **Smart Inventory** | Track stock, batches, serial numbers, expiry |
| **Advanced Analytics** | Comprehensive reporting and insights |
| **Seamless Integrations** | API connections to major platforms |

`);

    // Scroll to roles
    await page.evaluate(() => window.scrollTo(0, 2400));
    await page.waitForTimeout(1000);
    const rolesImg = await screenshot(page, 'roles-overview', 'User Roles');

    guide.push(`### User Roles Preview

${rolesImg}

Each role has a customized experience:

- **Administrator** - Complete system oversight with full access
- **Manager** - Team and operations management
- **Supervisor** - Floor operations and task assignment
- **Picker** - Order picking with optimized routing
- **Packer** - Order verification and packaging
- **Receiver** - Inbound goods and quality inspection

---
`);

    // ===== 3. AUTHENTICATION =====
    console.log('\nSection 3: Authentication');
    await page.goto(`${WMS_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const loginImg = await screenshot(page, 'login-page', 'Login Page');

    guide.push(`## 3. Authentication & Login

### Login Screen

${loginImg}

### How to Login

1. Navigate to **${WMS_URL}/auth/login**
2. Enter your **Email Address**
3. Enter your **Password**
4. Click the **Sign In** button

### Login Form

| Field | Description |
|-------|-------------|
| **Email** | Your registered company email |
| **Password** | Your secure password |
| **Remember Me** | Stay logged in (optional) |
| **Forgot Password** | Reset your password |

### After Login

You will be automatically directed to your role-specific dashboard based on your account type.

---
`);

    // ===== 4. ADMIN DASHBOARD =====
    console.log('\nSection 4: Admin Dashboard');

    if (await login(page, 'admin@company.com')) {
        console.log('  Logged in as Admin');
        await page.waitForTimeout(2000);

        const adminDashImg = await screenshot(page, 'admin-dashboard', 'Administrator Dashboard');

        guide.push(`## 4. Administrator Dashboard

### Main View

${adminDashImg}

The Administrator dashboard provides complete visibility into warehouse operations:

### Key Metrics Cards

| Metric | Description |
|--------|-------------|
| **Total Stock** | Current inventory count with trend |
| **Orders Today** | Daily order volume |
| **Pick Backlog** | Orders waiting to be picked |
| **Expiry Alerts** | Items approaching expiration |

### Dashboard Charts

**Daily Orders Chart:**
- Shows order volume over the last 7 days
- Bar chart with daily breakdown
- Trend visualization

**Warehouse Utilization:**
- Circular gauge showing capacity usage
- Percentage of warehouse space utilized
- Visual indicator of available space

### Navigation Menu

The sidebar provides access to all system modules:

- **Dashboard** - Overview and KPIs
- **Inventory** - Stock management
- **Orders** - Order processing
- **Picking** - Pick operations
- **Packing** - Pack and ship
- **Reports** - Analytics and reports
- **Users** - User management
- **Settings** - System configuration

`);

        // Try to navigate to inventory
        const inventoryLink = page.locator('a:has-text("Inventory"), a[href*="inventory"]').first();
        if (await inventoryLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await inventoryLink.click();
            await page.waitForTimeout(2000);
            const invImg = await screenshot(page, 'inventory-list', 'Inventory Management');

            guide.push(`### Inventory Management

${invImg}

**Inventory Features:**
- View all stock items with quantities
- Filter by location, category, status
- Search by SKU, name, or barcode
- Add new inventory items
- Adjust stock quantities
- View movement history

`);
        }

        // Try to navigate to orders
        await page.goto(`${WMS_URL}/orders`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(2000);
        const ordersImg = await screenshot(page, 'orders-list', 'Order Management');

        guide.push(`### Order Management

${ordersImg}

**Order Features:**
- View all orders with status
- Filter by date, status, customer
- Process orders through workflow
- View order details
- Track fulfillment progress

---
`);

        // Logout
        await page.goto(`${WMS_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.evaluate(() => localStorage.clear());
    }

    // ===== 5. MANAGER DASHBOARD =====
    console.log('\nSection 5: Manager Dashboard');

    if (await login(page, 'manager@company.com')) {
        console.log('  Logged in as Manager');
        await page.waitForTimeout(2000);

        const managerDashImg = await screenshot(page, 'manager-dashboard', 'Manager Dashboard');

        guide.push(`## 5. Manager Dashboard

${managerDashImg}

### Manager View Features

The Manager dashboard focuses on team performance and operational oversight:

**Key Functions:**
- Monitor team productivity
- View fulfillment metrics
- Assign and manage tasks
- Review daily/weekly reports
- Track KPIs and goals

**Available Metrics:**
- Orders completed vs target
- Pick accuracy rates
- Team member performance
- Throughput by hour/day

---
`);

        await page.evaluate(() => localStorage.clear());
    }

    // ===== 6. PICKER INTERFACE =====
    console.log('\nSection 6: Picker Interface');

    if (await login(page, 'picker@company.com')) {
        console.log('  Logged in as Picker');
        await page.waitForTimeout(2000);

        const pickerDashImg = await screenshot(page, 'picker-dashboard', 'Picker Dashboard');

        guide.push(`## 6. Picker Interface

${pickerDashImg}

### Picker Dashboard

The Picker interface is optimized for warehouse floor operations:

**Main Features:**
- **Active Pick Lists** - Current assigned tasks
- **Pick Queue** - Upcoming picks
- **Performance Metrics** - Personal stats

### Pick List View

| Column | Description |
|--------|-------------|
| **Order #** | Order identifier |
| **Items** | Number of items to pick |
| **Location** | Warehouse zone |
| **Priority** | Urgency level |
| **Status** | Current progress |

### Picking Process

1. **Select Pick List** - Choose from assigned tasks
2. **Navigate to Location** - Follow optimized path
3. **Scan Item** - Verify correct product
4. **Confirm Quantity** - Enter picked amount
5. **Move to Next** - Continue to next item
6. **Complete Pick** - Finish when all items collected

---
`);

        await page.evaluate(() => localStorage.clear());
    }

    // ===== 7. PACKER INTERFACE =====
    console.log('\nSection 7: Packer Interface');

    if (await login(page, 'packer@company.com')) {
        console.log('  Logged in as Packer');
        await page.waitForTimeout(2000);

        const packerDashImg = await screenshot(page, 'packer-dashboard', 'Packer Dashboard');

        guide.push(`## 7. Packer Interface

${packerDashImg}

### Packer Dashboard

The Packer interface streamlines the packing and shipping process:

**Main Features:**
- **Orders Ready to Pack** - Queue of picked orders
- **Packing Station** - Active packing view
- **Shipping Queue** - Ready for dispatch

### Packing Process

1. **Scan Order** - Identify order to pack
2. **Verify Items** - Check all items present
3. **Select Packaging** - Choose box/envelope
4. **Pack Items** - Place items securely
5. **Add Documents** - Include packing slip
6. **Print Label** - Generate shipping label
7. **Stage for Pickup** - Move to shipping area

---
`);

        await page.evaluate(() => localStorage.clear());
    }

    // ===== GENERIC SECTIONS =====
    guide.push(`## 8. Inventory Management

### Stock Overview

The inventory module provides complete visibility into warehouse stock:

**Key Features:**

| Feature | Description |
|---------|-------------|
| **Real-Time Tracking** | Live stock levels across all locations |
| **Batch Management** | Track items by batch/lot number |
| **Serial Numbers** | Individual item tracking |
| **Expiry Dates** | Monitor product freshness |
| **Low Stock Alerts** | Automatic notifications |
| **Movement History** | Audit trail of all changes |

### Inventory Operations

**Stock In (Receiving):**
- Receive purchase orders
- Quality inspection
- Putaway to locations

**Stock Out (Shipping):**
- Order allocation
- Pick and pack
- Dispatch to carrier

**Adjustments:**
- Cycle count corrections
- Damage write-offs
- Returns processing

---

## 9. Order Management

### Order Workflow

\`\`\`
New → Allocated → Picking → Picked → Packing → Packed → Shipped → Delivered
\`\`\`

### Order Statuses

| Status | Description | Next Action |
|--------|-------------|-------------|
| **New** | Order received | Allocate stock |
| **Allocated** | Stock reserved | Create pick list |
| **Picking** | Being picked | Complete pick |
| **Picked** | Items collected | Send to packing |
| **Packing** | Being packed | Complete pack |
| **Packed** | Ready to ship | Create shipment |
| **Shipped** | With carrier | Track delivery |
| **Delivered** | Complete | Close order |

### Order Actions

- **View Details** - Full order information
- **Edit Order** - Modify before processing
- **Cancel Order** - Stop processing
- **Split Order** - Partial fulfillment
- **Prioritize** - Mark as urgent

---

## 10. Reports & Analytics

### Available Reports

| Report | Description |
|--------|-------------|
| **Inventory Summary** | Stock levels by location/category |
| **Order Volume** | Orders by day/week/month |
| **Pick Performance** | Picker productivity metrics |
| **Packing Efficiency** | Pack station throughput |
| **Shipping Analysis** | Shipments by carrier/destination |
| **Returns Report** | Return reasons and rates |

### Key Performance Indicators

**Operational KPIs:**
- Orders per hour
- Pick accuracy rate
- On-time shipping percentage
- Average order cycle time

**Inventory KPIs:**
- Stock turnover rate
- Inventory accuracy
- Dead stock percentage
- Fill rate

---

## 11. System Settings

### Configuration Areas

| Setting | Purpose |
|---------|---------|
| **Company Info** | Business name, address, logo |
| **Warehouse Setup** | Zones, locations, bins |
| **User Management** | Accounts and permissions |
| **Integrations** | API connections |
| **Notifications** | Alert configuration |
| **Labels & Printing** | Barcode/label formats |

### User Management

**Adding Users:**
1. Go to Settings → Users
2. Click "Add User"
3. Enter name, email, role
4. Set permissions
5. Send invitation

**Role Permissions:**
- View/Edit/Delete for each module
- Report access levels
- Administrative functions

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Esc** | Close modal |
| **Enter** | Submit form |
| **Tab** | Next field |
| **Ctrl+F** | Search |
| **Ctrl+P** | Print |

### Best Practices

**For Pickers:**
- Complete picks in sequence
- Report shorts immediately
- Verify quantities before confirming

**For Packers:**
- Verify all items before packing
- Use appropriate box sizes
- Check address labels

**For Managers:**
- Review daily metrics
- Address exceptions promptly
- Monitor team workload

---

## Support

For assistance:
- Check in-app help tooltips
- Contact your system administrator
- Review training documentation

---

*Kiaan WMS - Streamlining warehouse operations for modern businesses.*
`);

    // ===== WRITE GUIDE =====
    console.log('\n=== Writing Guide ===');
    fs.writeFileSync(GUIDE_FILE, guide.join('\n'));

    const screenshots = fs.readdirSync(SCREENSHOT_DIR);
    console.log(`\nGuide: ${GUIDE_FILE}`);
    console.log(`Screenshots: ${screenshots.length} files`);
    screenshots.forEach(f => console.log(`  - ${f}`));

    await browser.close();
    console.log('\n=== COMPLETE ===');
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
