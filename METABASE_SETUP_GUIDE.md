# 📊 Metabase Setup Guide - Kiaan WMS
**Open Source Analytics Tool - Zero Coding Required!**

---

## 🎯 What is Metabase?

Metabase is a powerful open-source BI (Business Intelligence) tool that lets you:
- Create beautiful dashboards **without coding**
- Write SQL queries → Get instant charts
- Embed dashboards in your React app
- Share insights with your team

**Why We Use It:**
- ✅ **No Dashboard Coding** - Saves 2-3 weeks of development
- ✅ **Free & Open Source** - No licensing costs
- ✅ **Easy to Use** - Point-and-click interface
- ✅ **Powerful** - SQL support for complex queries
- ✅ **Embeddable** - Iframe integration with React

---

## 🚀 Initial Setup (First Time Only)

### Step 1: Access Metabase
Open in browser: http://localhost:3002

### Step 2: Create Admin Account
**On first visit, you'll see a welcome screen:**

1. **Language:** Select "English"
2. **Create your account:**
   - Full Name: `Admin User`
   - Email: `admin@kiaan.com`
   - Password: `kiaan_admin_2024` (or your choice)
   - Company: `Kiaan WMS`

3. Click **"Next"**

### Step 3: Connect to Database
**Database Configuration:**

1. **Database type:** Select **"PostgreSQL"**

2. **Connection Details:**
   ```
   Display name: Kiaan WMS Database
   Host: host.docker.internal
   Port: 5439
   Database name: kiaan_wms
   Username: wms_user
   Password: wms_secure_password_2024
   ```

3. **Advanced Options (optional):**
   - Use a secure connection (SSL): No
   - Tunnel: No
   - Additional JDBC options: Leave empty

4. Click **"Connect Database"**

5. Metabase will scan your database and detect:
   - ✅ 21 tables
   - ✅ Relationships between tables
   - ✅ Data types

6. Click **"Next"** → **"Take me to Metabase"**

---

## 📊 Create Your First Dashboard - ABC Analysis

### What is ABC Analysis?
- **A Items:** Top 20% products = 80% revenue (High priority)
- **B Items:** Next 30% products = 15% revenue (Medium priority)  
- **C Items:** Bottom 50% products = 5% revenue (Low priority)

### Step 1: Create a Question (Query)

1. Click **"New"** → **"Question"**
2. Select **"Native query"** (we'll write SQL)
3. **Database:** Kiaan WMS Database

### Step 2: Write ABC Analysis Query

Paste this SQL:

```sql
-- ABC Analysis for Products
WITH ProductRevenue AS (
  SELECT 
    p.id,
    p.name,
    p.sku,
    COALESCE(SUM(soi."quantity" * soi."unitPrice"), 0) as total_revenue,
    COUNT(DISTINCT so.id) as order_count
  FROM "Product" p
  LEFT JOIN "SalesOrderItem" soi ON p.id = soi."productId"
  LEFT JOIN "SalesOrder" so ON soi."salesOrderId" = so.id
  WHERE so.status != 'CANCELLED'
  GROUP BY p.id, p.name, p.sku
),
RankedProducts AS (
  SELECT 
    *,
    SUM(total_revenue) OVER() as grand_total,
    SUM(total_revenue) OVER(ORDER BY total_revenue DESC) as running_total
  FROM ProductRevenue
),
ClassifiedProducts AS (
  SELECT 
    *,
    (running_total / grand_total * 100) as cumulative_percentage,
    CASE 
      WHEN (running_total / grand_total * 100) <= 80 THEN 'A'
      WHEN (running_total / grand_total * 100) <= 95 THEN 'B'
      ELSE 'C'
    END as abc_class
  FROM RankedProducts
)
SELECT 
  abc_class as "Class",
  COUNT(*) as "Product Count",
  SUM(total_revenue) as "Total Revenue",
  ROUND(SUM(total_revenue) / MAX(grand_total) * 100, 2) as "Revenue %",
  ROUND(AVG(total_revenue), 2) as "Avg Revenue per Product"
FROM ClassifiedProducts
GROUP BY abc_class
ORDER BY abc_class;
```

4. Click **"Execute"** (or press Ctrl+Enter)
5. You'll see results in a table

### Step 3: Visualize the Data

1. Click **"Visualization"** button
2. Select **"Bar Chart"**
3. **Configure:**
   - X-axis: Class
   - Y-axis: Total Revenue
   - Series: Product Count (optional)

4. Click **"Save"**
   - Name: `ABC Analysis - Product Classification`
   - Description: `Pareto 80/20 analysis for inventory prioritization`
   - Collection: Create new → `WMS Dashboards`

### Step 4: Create Pie Chart (ABC Distribution)

1. Click **"New"** → **"Question"** → **"Native query"**
2. Paste same SQL as above
3. **Visualization:** Select **"Pie Chart"**
4. **Configure:**
   - Dimension: Class
   - Metric: Product Count

5. **Save as:** `ABC Analysis - Distribution Pie Chart`

### Step 5: Create Dashboard

1. Click **"New"** → **"Dashboard"**
2. **Name:** `ABC Analysis Dashboard`
3. **Description:** `Product prioritization using Pareto 80/20 principle`

4. Click **"Add a question"**
5. Add both saved questions:
   - ABC Analysis - Product Classification
   - ABC Analysis - Distribution Pie Chart

6. **Arrange cards:**
   - Resize and position as needed
   - Add text cards for context

7. Click **"Save"**

---

## 🎨 More Dashboards to Create

### 2. Sales Performance Dashboard

**Queries to create:**

#### Daily Sales Trend
```sql
SELECT 
  DATE("orderDate") as date,
  COUNT(*) as order_count,
  SUM("totalAmount") as total_sales
FROM "SalesOrder"
WHERE "orderDate" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE("orderDate")
ORDER BY date;
```

**Visualization:** Line chart

#### Sales by Channel
```sql
SELECT 
  "orderType",
  COUNT(*) as orders,
  SUM("totalAmount") as revenue
FROM "SalesOrder"
GROUP BY "orderType";
```

**Visualization:** Bar chart

### 3. Inventory Health Dashboard

#### Stock Levels by Warehouse
```sql
SELECT 
  w.name as warehouse,
  SUM(i.quantity) as total_qty,
  SUM(i."availableQuantity") as available_qty,
  COUNT(DISTINCT i."productId") as product_count
FROM "Inventory" i
JOIN "Location" l ON i."locationId" = l.id
JOIN "Warehouse" w ON l."warehouseId" = w.id
GROUP BY w.name;
```

**Visualization:** Bar chart

#### Items Expiring Soon (FEFO Alert)
```sql
SELECT 
  p.name as product,
  i."lotNumber",
  i."bestBeforeDate",
  i."availableQuantity",
  CASE 
    WHEN i."bestBeforeDate" <= CURRENT_DATE + INTERVAL '7 days' THEN 'Critical (< 7 days)'
    WHEN i."bestBeforeDate" <= CURRENT_DATE + INTERVAL '30 days' THEN 'Warning (< 30 days)'
    ELSE 'OK'
  END as urgency
FROM "Inventory" i
JOIN "Product" p ON i."productId" = p.id
WHERE i."bestBeforeDate" IS NOT NULL
  AND i."bestBeforeDate" <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY i."bestBeforeDate";
```

**Visualization:** Table with conditional formatting

### 4. Warehouse Utilization Dashboard

#### Location Occupancy
```sql
SELECT 
  w.name as warehouse,
  z.name as zone,
  COUNT(DISTINCT l.id) as total_locations,
  COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN l.id END) as occupied_locations,
  ROUND(
    COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN l.id END)::numeric / 
    COUNT(DISTINCT l.id) * 100, 
    2
  ) as occupancy_rate
FROM "Warehouse" w
LEFT JOIN "Zone" z ON z."warehouseId" = w.id
LEFT JOIN "Location" l ON l."warehouseId" = w.id
LEFT JOIN "Inventory" i ON i."locationId" = l.id
GROUP BY w.name, z.name
ORDER BY w.name, z.name;
```

**Visualization:** Table or gauge chart

---

## 🔗 Embed Dashboards in React

### Step 1: Enable Public Sharing

1. Open your dashboard in Metabase
2. Click **"Share"** icon (top right)
3. Click **"Enable sharing"**
4. Copy the **Public Link** or **Embed code**

### Step 2: Create React Component

```typescript
// /frontend/app/analytics/abc-analysis/page.tsx
'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from 'antd';

export default function ABCAnalysisPage() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">ABC Analysis Dashboard</h1>
        
        <Card>
          <iframe
            src="http://localhost:3002/public/dashboard/YOUR_DASHBOARD_ID"
            width="100%"
            height="800px"
            frameBorder="0"
            allowTransparency
          />
        </Card>
      </div>
    </MainLayout>
  );
}
```

### Step 3: Add to Navigation

Update sidebar to include link to `/analytics/abc-analysis`

---

## 📋 Metabase Best Practices

### 1. **Organize with Collections**
- Create collections for different areas (Sales, Inventory, Warehouse)
- Keep related dashboards together

### 2. **Use Filters**
- Add date range filters
- Add warehouse filters
- Make dashboards interactive

### 3. **Refresh Schedule**
- Set automatic refresh for real-time data
- Default: Every 1-5 minutes

### 4. **Permissions**
- Create user groups (Admin, Manager, Viewer)
- Restrict access to sensitive data

### 5. **Performance**
- Use database indexes
- Cache frequently-run queries
- Limit data ranges (last 30/90 days)

---

## 🎯 Quick Reference

### Access URLs:
- **Metabase UI:** http://localhost:3002
- **Database:** host.docker.internal:5439
- **Hasura (if needed):** http://localhost:8090

### Credentials:
- **Metabase Admin:** admin@kiaan.com / kiaan_admin_2024
- **Database:** wms_user / wms_secure_password_2024

### Common Tables:
- `Product` - 32 products
- `Inventory` - 10,707 items with best-before dates
- `SalesOrder` - 30 orders
- `SalesOrderItem` - Order line items
- `Warehouse` - Warehouses
- `Location` - Storage locations
- `Customer` - Customers

---

## 🚀 Time Saved

**Without Metabase:**
- Manual dashboard coding: 2-3 weeks
- Chart libraries setup: 2-3 days
- Data aggregation logic: 1 week
- **Total:** 3-4 weeks

**With Metabase:**
- Database connection: 5 minutes
- Create queries: 30 minutes
- Build dashboards: 1-2 hours
- Embed in React: 15 minutes
- **Total:** 2-3 hours

**Savings:** 95%+ time saved! 🎉

---

**Created by:** Claude Code
**Date:** November 22, 2025
**Tool:** Metabase (Open Source BI)
**Result:** Zero-code analytics dashboards
