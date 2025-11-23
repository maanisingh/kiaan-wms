# 🚀 Kiaan WMS - Phase 2 Implementation Plan

**Date:** November 23, 2025
**Status:** Planning Phase
**Phase 1 Completion:** ✅ 100% (12/12 entities deployed)

---

## 📊 Phase 1 Recap

**Completed:**
- ✅ All 12 core CRUD entities (Products, Sales, Customers, Suppliers, Brands, Warehouses, Locations, Inventory, Bundles, Pick Lists, Transfers, Zones)
- ✅ GraphQL API with Hasura
- ✅ PostgreSQL database with relationships
- ✅ Production deployment on Railway
- ✅ Ant Design UI framework
- ✅ Multi-tenancy support (companyId)

**What's Missing (Phase 2 Opportunities):**
- ❌ User authentication/authorization
- ❌ Dashboard with analytics
- ❌ Barcode/QR code support
- ❌ Advanced reporting & exports
- ❌ Email notifications
- ❌ Mobile-optimized views
- ❌ Audit trail/change history
- ❌ Third-party integrations

---

## 🎯 Phase 2 Feature Categories

### Category A: Essential Business Features (High Priority)
Critical features that make the system production-ready for real warehouse operations.

### Category B: Enhanced Operations (Medium Priority)
Features that improve efficiency and user experience.

### Category C: Advanced Features (Nice-to-Have)
Features that provide competitive advantage but aren't essential for launch.

---

## 📋 Detailed Phase 2 Features

### **A1. Authentication & User Management** 🔐
**Priority:** HIGH | **Effort:** 8-12 hours | **Impact:** Critical

**Features:**
- Login/logout with JWT tokens
- User registration and profile management
- Password reset and change password
- Session management
- Remember me functionality

**Tables Needed:**
- User table already exists
- Add: Session, PasswordReset tables

**Pages to Create:**
- `/login` - Login form
- `/register` - User registration
- `/profile` - User profile settings
- `/forgot-password` - Password reset

**Technical Requirements:**
- JWT token generation and validation
- Password hashing (bcrypt)
- Token storage (localStorage/cookies)
- Protected route wrapper
- Hasura JWT authentication mode

**User Story:**
*"As a warehouse manager, I want to log in with my credentials so that only authorized users can access the system."*

---

### **A2. Role-Based Access Control (RBAC)** 👥
**Priority:** HIGH | **Effort:** 6-8 hours | **Impact:** Critical

**Roles to Implement:**
1. **Super Admin** - Full system access, multi-company management
2. **Company Admin** - Full access to their company data
3. **Warehouse Manager** - Manage warehouse operations
4. **Inventory Manager** - Manage stock and inventory
5. **Picker** - Access to pick lists only
6. **Viewer** - Read-only access

**Features:**
- Role-based menu visibility
- Permission-based CRUD operations
- Hasura permission rules
- Role assignment UI

**Pages to Modify:**
- All entity pages need permission checks
- Add `/users/roles` - Role management page

**Technical Requirements:**
- Hasura role-based permissions
- Frontend route guards
- GraphQL permission rules
- Role hierarchy system

**User Story:**
*"As a company admin, I want to assign different access levels to my team members so that pickers can only see pick lists, not sensitive customer data."*

---

### **A3. Dashboard & Analytics** 📊
**Priority:** HIGH | **Effort:** 10-15 hours | **Impact:** High

**Dashboard Sections:**
1. **Overview Cards**
   - Total products in stock
   - Low stock alerts
   - Pending orders
   - Active pick lists
   - Transfer in-transit

2. **Charts**
   - Sales trend (last 30 days)
   - Top products by sales
   - Inventory turnover
   - Warehouse utilization
   - Pick efficiency metrics

3. **Recent Activity**
   - Latest orders
   - Recent transfers
   - Low stock alerts
   - Expired/expiring inventory

**Pages to Create:**
- `/dashboard` - Main analytics dashboard (NEW)

**Technical Requirements:**
- Chart.js or Recharts for visualizations
- Real-time data aggregation
- GraphQL aggregate queries
- Date range filters
- Export to PDF/Excel

**User Story:**
*"As a warehouse manager, I want to see key metrics on a dashboard so I can quickly identify issues and make informed decisions."*

---

### **A4. Advanced Inventory Management** 📦
**Priority:** HIGH | **Effort:** 12-16 hours | **Impact:** High

**Features to Add:**

1. **Stock Alerts & Notifications**
   - Low stock warnings (below reorder point)
   - Expiry alerts (7 days, 30 days, 90 days)
   - Overstock warnings
   - Email/SMS notifications

2. **Inventory Adjustments**
   - Stock count adjustments
   - Damage/loss reporting
   - Return to vendor
   - Reason codes for adjustments

3. **Batch/Lot Tracking**
   - FIFO/LIFO enforcement
   - Batch recall functionality
   - Trace forward/backward
   - Best-before date enforcement

4. **Cycle Counting**
   - Schedule cycle counts
   - Assign to users
   - Variance reporting
   - Auto-adjustment on approval

**Tables Needed:**
- InventoryAdjustment
- StockAlert
- CycleCount

**Pages to Create:**
- `/inventory/adjustments` - Stock adjustments
- `/inventory/alerts` - Low stock & expiry alerts
- `/inventory/cycle-counts` - Cycle counting

**Technical Requirements:**
- Background jobs for alert checks
- Email service integration
- PDF report generation
- Barcode scanner integration

**User Story:**
*"As an inventory manager, I want to receive alerts when stock falls below reorder point so I can replenish inventory before stockouts occur."*

---

### **B1. Barcode & QR Code Support** 📱
**Priority:** MEDIUM-HIGH | **Effort:** 8-10 hours | **Impact:** High

**Features:**
1. **Barcode Scanning**
   - Product lookup by barcode
   - Location lookup by QR code
   - Pick list scanning
   - Inventory counting with scanner

2. **Barcode Generation**
   - Generate product barcodes (EAN-13, UPC, Code-128)
   - Generate location QR codes
   - Print barcode labels
   - Bulk barcode generation

3. **Mobile Scanner App**
   - Camera-based scanning
   - Quick product lookup
   - Pick list completion
   - Inventory count entry

**Pages to Create:**
- `/barcode/scan` - Scanner interface
- `/barcode/generate` - Generate barcodes
- `/barcode/labels` - Print labels

**Technical Requirements:**
- HTML5 camera API or React-Webcam
- Barcode library (react-barcode, jsbarcode)
- QR code library (qrcode.react)
- Print CSS for label templates
- Mobile-responsive design

**User Story:**
*"As a picker, I want to scan barcodes with my phone so I can quickly verify I'm picking the correct product."*

---

### **B2. Advanced Reporting System** 📄
**Priority:** MEDIUM | **Effort:** 10-12 hours | **Impact:** Medium

**Reports to Create:**

1. **Inventory Reports**
   - Current stock levels by product
   - Stock value report
   - Inventory aging report
   - ABC analysis (Pareto)
   - Slow-moving inventory

2. **Sales Reports**
   - Sales by customer
   - Sales by product
   - Sales by date range
   - Revenue analysis

3. **Operational Reports**
   - Pick efficiency report
   - Transfer history
   - Warehouse utilization
   - Cycle count variance

**Export Formats:**
- PDF (print-ready)
- Excel/CSV (data analysis)
- JSON (API export)

**Pages to Create:**
- `/reports` - Report selection dashboard
- `/reports/inventory` - Inventory reports
- `/reports/sales` - Sales reports
- `/reports/operations` - Operational reports

**Technical Requirements:**
- PDF generation (jsPDF, react-pdf)
- Excel export (xlsx library)
- Chart integration
- Schedule reports (cron jobs)
- Email delivery

**User Story:**
*"As a company admin, I want to generate inventory reports in Excel format so I can analyze stock trends and make purchasing decisions."*

---

### **B3. Email Notifications & Alerts** 📧
**Priority:** MEDIUM | **Effort:** 6-8 hours | **Impact:** Medium

**Notification Types:**

1. **Inventory Alerts**
   - Low stock email to inventory manager
   - Expiry alerts (7/30/90 days)
   - Overstock warnings

2. **Order Notifications**
   - New order created
   - Order shipped
   - Order completed

3. **User Notifications**
   - Pick list assigned
   - Transfer received
   - Cycle count assigned

**Features:**
- Email templates (HTML)
- Notification preferences
- Digest emails (daily/weekly)
- SMS integration (optional)

**Technical Requirements:**
- Email service (SendGrid, Mailgun, or AWS SES)
- Template engine (Handlebars, EJS)
- Queue system (Bull, BullMQ)
- Notification settings table

**User Story:**
*"As an inventory manager, I want to receive email alerts when stock is low so I can order before running out."*

---

### **B4. Document Management** 📑
**Priority:** MEDIUM | **Effort:** 8-10 hours | **Impact:** Medium

**Documents to Generate:**

1. **Pick Lists**
   - Printable pick list
   - Grouped by zone
   - Barcode labels

2. **Packing Slips**
   - Order details
   - Shipping info
   - Item list

3. **Transfer Documents**
   - Transfer order form
   - Receiving checklist

4. **Invoices/Receipts**
   - Sales order invoice
   - Purchase order

**Features:**
- Template customization
- Company logo/branding
- Multi-language support
- Batch printing

**Technical Requirements:**
- PDF generation
- Print templates
- Email with attachments

**User Story:**
*"As a warehouse operator, I want to print pick lists with barcodes so pickers can easily scan items."*

---

### **C1. Mobile App (PWA)** 📱
**Priority:** LOW-MEDIUM | **Effort:** 15-20 hours | **Impact:** High (for mobile users)

**Features:**
- Responsive mobile UI
- Offline mode
- Push notifications
- Camera barcode scanner
- Quick actions (pick, receive, count)

**Technical Requirements:**
- Service workers
- IndexedDB for offline storage
- PWA manifest
- Mobile-optimized components

---

### **C2. Third-Party Integrations** 🔌
**Priority:** LOW | **Effort:** Variable | **Impact:** Medium

**Potential Integrations:**
1. **Shipping Carriers**
   - ShipStation API
   - UPS/FedEx/USPS tracking
   - Rate calculator

2. **E-commerce Platforms**
   - Shopify integration
   - WooCommerce sync
   - Amazon FBA

3. **Accounting Software**
   - QuickBooks export
   - Xero integration

**Technical Requirements:**
- API client libraries
- Webhook handlers
- OAuth authentication
- Sync jobs

---

### **C3. Audit Trail & History** 📜
**Priority:** LOW-MEDIUM | **Effort:** 8-10 hours | **Impact:** Medium

**Features:**
- Track all CRUD operations
- User attribution
- Change diff view
- Searchable history
- Restore previous versions

**Tables Needed:**
- AuditLog

**Pages to Create:**
- `/audit` - Audit trail viewer
- Entity-specific history tabs

---

## 🎯 Recommended Phase 2 Roadmap

### **Sprint 1 (Week 1):** Authentication & Security
- ✅ A1. Authentication & User Management (8-12 hours)
- ✅ A2. Role-Based Access Control (6-8 hours)
- **Total:** 14-20 hours

### **Sprint 2 (Week 2):** Dashboard & Analytics
- ✅ A3. Dashboard & Analytics (10-15 hours)
- ✅ B2. Advanced Reporting (partial - 5 hours)
- **Total:** 15-20 hours

### **Sprint 3 (Week 3):** Inventory Enhancement
- ✅ A4. Advanced Inventory Management (12-16 hours)
- ✅ B3. Email Notifications (6-8 hours)
- **Total:** 18-24 hours

### **Sprint 4 (Week 4):** Barcode & Documents
- ✅ B1. Barcode & QR Code Support (8-10 hours)
- ✅ B4. Document Management (8-10 hours)
- **Total:** 16-20 hours

---

## 🛠️ Technical Stack Additions for Phase 2

**New Dependencies:**
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",           // Password hashing
    "jsonwebtoken": "^9.0.2",        // JWT tokens
    "recharts": "^2.10.0",           // Charts
    "react-pdf": "^7.5.0",           // PDF generation
    "xlsx": "^0.18.5",               // Excel export
    "react-barcode": "^1.4.6",       // Barcode generation
    "qrcode.react": "^3.1.0",        // QR codes
    "react-webcam": "^7.1.1",        // Camera access
    "@sendgrid/mail": "^7.7.0",      // Email service
    "bull": "^4.11.5"                // Job queue
  }
}
```

**Infrastructure Needs:**
- Redis (for job queue)
- Email service account (SendGrid/Mailgun)
- Cloud storage for documents (AWS S3 or similar)

---

## 📊 Success Metrics for Phase 2

**User Adoption:**
- User registration rate
- Daily active users
- Feature usage stats

**Operational Efficiency:**
- Pick time reduction (%)
- Inventory accuracy improvement
- Report generation time

**System Performance:**
- Page load time < 2s
- API response time < 500ms
- Zero downtime deployments

---

## 💬 Next Steps

**Immediate Actions:**
1. Review this plan and select priority features
2. Set up development environment for Phase 2
3. Create feature branches in Git
4. Begin Sprint 1 implementation

**Questions to Decide:**
1. Which Sprint should we start with? (Recommended: Sprint 1 - Auth)
2. Do we need mobile app support? (Affects PWA decision)
3. Which email service to use? (SendGrid, Mailgun, AWS SES)
4. Which integrations are most critical? (ShipStation, Shopify, etc.)

---

**Created:** November 23, 2025
**Status:** Planning Complete - Ready for Implementation
**Recommended Start:** Sprint 1 (Authentication & Security)
