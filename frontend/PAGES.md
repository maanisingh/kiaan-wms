# Complete Page Routing Structure

This document lists all pages and routes in the Kiaan WMS frontend application.

## Public Routes (No Authentication Required)

### Authentication
- `/auth/login` - Login page with company selection
- `/auth/register` - User registration
- `/auth/forgot-password` - Password reset request

## Protected Routes (Authentication Required)

### Dashboard
- `/dashboard` - Main dashboard
  - KPI cards (Total Stock, Orders Today, Pick Backlog, Expiry Alerts)
  - Daily orders chart
  - Receiving vs Shipping chart
  - Warehouse utilization donut chart
  - Orders by status breakdown
  - Recent orders table
  - Quick action buttons

### Companies (Multi-tenant)
- `/companies` - Companies list (table view)
- `/companies/new` - Create new company
- `/companies/[id]` - Company detail view
  - Overview tab
  - Billing Rules tab
  - Statistics tab
- `/companies/[id]/edit` - Edit company

### Warehouses
- `/warehouses` - Warehouses list (card + table views)
- `/warehouses/new` - Create new warehouse
- `/warehouses/[id]` - Warehouse detail view
  - Overview tab
  - Zones tab
  - Locations tab
  - Layout/Map tab
  - Capacity Report tab
- `/warehouses/[id]/edit` - Edit warehouse
- `/warehouses/zones` - Zones management (tree view)
- `/warehouses/zones/new` - Create zone
- `/warehouses/zones/[id]` - Zone detail
- `/warehouses/locations` - Locations management (hierarchical)
- `/warehouses/locations/new` - Create location
- `/warehouses/locations/[id]` - Location detail
- `/warehouses/locations/map` - Visual bin map viewer

### Products
- `/products` - Products list (advanced table)
- `/products/new` - Create new product (multi-step form)
- `/products/[id]` - Product detail view
  - Overview tab
  - Stock Levels tab
  - Variants tab (if variant product)
  - Bundles tab (if bundle product)
  - History tab
- `/products/[id]/edit` - Edit product
- `/products/[id]/variants` - Manage variants
- `/products/[id]/bundles` - Manage bundle items
- `/products/categories` - Categories management (tree view)
- `/products/categories/new` - Create category
- `/products/import` - CSV import page
- `/products/export` - Export configuration

### Inventory
- `/inventory` - Inventory overview (summary + table)
- `/inventory/low-stock` - Low stock alerts with reorder suggestions
- `/inventory/expiring` - Expiring stock (sorted by expiry date)
- `/inventory/adjustments` - Stock adjustments list
- `/inventory/adjustments/new` - Create stock adjustment
- `/inventory/adjustments/[id]` - Adjustment detail (with approval)
- `/inventory/cycle-counts` - Cycle counts list
- `/inventory/cycle-counts/new` - Create cycle count
- `/inventory/cycle-counts/[id]` - Cycle count detail
- `/inventory/cycle-counts/[id]/execute` - Execute count (mobile-optimized)
- `/inventory/batches` - Batch management
- `/inventory/batches/[id]` - Batch detail
- `/inventory/serial-numbers` - Serial number search and tracking
- `/inventory/serial-numbers/[id]` - Serial number detail
- `/inventory/movements` - Stock movements log (read-only)

### Purchase Orders (Inbound)
- `/purchase-orders` - Purchase orders list
- `/purchase-orders/new` - Create PO (multi-step)
  - Supplier selection
  - Items
  - Shipping info
  - Review
- `/purchase-orders/[id]` - PO detail view
  - Overview tab
  - Items tab
  - Receiving History tab
  - Actions tab
- `/purchase-orders/[id]/edit` - Edit PO
- `/purchase-orders/[id]/receive` - Receive against PO

### Goods Receiving (GRN)
- `/goods-receiving` - GRN list (pending receives)
- `/goods-receiving/new` - Create GRN (with/without PO)
- `/goods-receiving/[id]` - GRN detail with receiving interface
- `/goods-receiving/[id]/qc` - QC inspection interface
- `/goods-receiving/[id]/putaway` - Putaway screen

### Customers
- `/customers` - Customers list
- `/customers/new` - Create customer
- `/customers/[id]` - Customer detail view
  - Overview tab
  - Orders tab
  - Addresses tab
  - History tab
- `/customers/[id]/edit` - Edit customer

### Sales Orders (Outbound)
- `/sales-orders` - Sales orders list (table OR kanban board toggle)
- `/sales-orders/new` - Create sales order
  - Customer selection
  - Items
  - Shipping address
  - Review
- `/sales-orders/[id]` - Order detail view
  - Order Info tab
  - Items tab
  - Allocations tab
  - Pick/Pack Status tab
  - Shipments tab
  - Timeline tab
- `/sales-orders/[id]/edit` - Edit order
- `/sales-orders/[id]/allocate` - Allocation viewer

### Picking (Fulfillment)
- `/picking` - Pick list queue (assigned picks)
- `/picking/wave` - Create wave pick (batch multiple orders)
- `/picking/[id]` - Pick list detail (items sorted by optimized sequence)
- `/picking/[id]/desktop` - Desktop pick view (for oversight)
- `/picking/[id]/mobile` - Mobile pick interface

### Packing (Fulfillment)
- `/packing` - Packing queue (orders ready to pack)
- `/packing/[id]` - Packing interface
  - Scan items
  - Set package details
  - Print shipping label

### Shipments
- `/shipments` - Shipments list (with tracking status)
- `/shipments/new` - Create shipment (from packed orders)
- `/shipments/[id]` - Shipment detail view
  - Overview tab
  - Tracking Timeline tab
  - Orders tab
  - Documents tab
- `/shipments/[id]/tracking` - Tracking timeline (visual progress)

### Returns (RMA)
- `/returns` - Returns list (with status workflow)
- `/returns/new` - Create return request (from SO or standalone)
- `/returns/[id]` - RMA detail view
  - Overview tab
  - Items tab
  - Inspection tab
  - Resolution tab
- `/returns/[id]/receive` - Receive return interface
- `/returns/[id]/inspect` - Inspection interface

### Transfers
- `/transfers` - Stock transfers list
- `/transfers/new` - Create transfer (warehouse or location)
- `/transfers/[id]` - Transfer detail (track shipment status)
- `/transfers/[id]/receive` - Receive transfer interface

### FBA Transfers (Amazon Specific)
- `/fba-transfers` - FBA tasks list
- `/fba-transfers/new` - Create FBA transfer (bundle creation)
- `/fba-transfers/[id]` - Track FBA shipment

### Marketplace Integrations
- `/integrations/channels` - Connected marketplace channels list
- `/integrations/channels/new` - Connect new channel (OAuth flow)
- `/integrations/channels/[id]` - Channel settings page
- `/integrations/mappings` - SKU mappings list
- `/integrations/mappings/new` - Create/Edit SKU mapping
- `/integrations/mappings/import` - Bulk mapping import
- `/integrations/logs` - Import logs (order import history)

### Label Printing
- `/labels` - Label templates overview
- `/labels/templates` - Label templates list
- `/labels/templates/new` - Template editor (with preview)
- `/labels/templates/[id]` - Edit template
- `/labels/printers` - Printers list
- `/labels/printers/new` - Add printer
- `/labels/queue` - Print queue (recent print jobs)

### Reports
- `/reports` - Report templates gallery
- `/reports/builder` - Custom report builder (drag-drop fields)
- `/reports/saved` - Saved reports list
- `/reports/schedule` - Schedule report (email delivery)
- `/reports/history` - Report execution history
- `/reports/[id]` - View/Download generated report

### Notifications
- `/notifications` - Notification inbox (list with read/unread)
- `/notifications/rules` - Notification rules settings
- `/notifications/channels` - Channel settings (email, SMS, push, webhooks)

### Settings
- `/settings` - Settings overview
- `/settings/company` - Company settings
- `/settings/user` - User preferences
- `/settings/system` - System settings (by category)
- `/settings/api` - API keys management
- `/settings/integrations` - Integration settings
- `/settings/warehouses` - Warehouse-specific settings

### User Management
- `/users` - Users list
- `/users/new` - Create user
- `/users/[id]` - User detail (with permissions)
- `/users/[id]/edit` - Edit user
- `/users/roles` - Role management
- `/users/activity` - Activity logs

## Total Pages: 60+ Pages

### Page Count by Section
- Authentication: 3 pages
- Dashboard: 1 page
- Companies: 4 pages
- Warehouses: 8 pages
- Products: 9 pages
- Inventory: 11 pages
- Purchase Orders: 5 pages
- Goods Receiving: 4 pages
- Customers: 4 pages
- Sales Orders: 6 pages
- Picking: 5 pages
- Packing: 2 pages
- Shipments: 4 pages
- Returns: 4 pages
- Transfers: 4 pages
- FBA Transfers: 3 pages
- Integrations: 6 pages
- Label Printing: 6 pages
- Reports: 6 pages
- Notifications: 3 pages
- Settings: 6 pages
- User Management: 5 pages

## Route Patterns

### List Pages
- GET `/[resource]` - List all items
- Includes: filtering, sorting, pagination, bulk actions

### Detail Pages
- GET `/[resource]/[id]` - View single item
- Typically includes tabs for related data

### Create Pages
- GET `/[resource]/new` - Form to create new item
- POST to API when submitted

### Edit Pages
- GET `/[resource]/[id]/edit` - Form to edit existing item
- PUT/PATCH to API when submitted

### Action Pages
- GET `/[resource]/[id]/[action]` - Specialized action interface
- Examples: receive, allocate, inspect, execute

## Implementation Status

### Fully Implemented (Production-Ready)
- Authentication (Login)
- Dashboard
- Products List
- Sales Orders List (Table & Kanban)
- Warehouses List
- Inventory Overview

### Implemented (Core Structure)
- All routes have folder structure created
- Placeholder pages exist for all major sections
- Can be extended by following patterns from implemented pages

### Next.js App Router Features Used
- Server Components where applicable
- Client Components for interactive features
- Dynamic routes with [id] segments
- Layout nesting
- Loading states
- Error boundaries
