-- Daily Sales Trend (Last 30 Days)
-- Purpose: Track daily order volume and revenue

SELECT 
  DATE("orderDate") as "Date",
  COUNT(*) as "Orders",
  SUM("totalAmount") as "Revenue",
  AVG("totalAmount") as "Avg Order Value",
  SUM(
    (SELECT SUM(soi.quantity) 
     FROM "SalesOrderItem" soi 
     WHERE soi."salesOrderId" = so.id)
  ) as "Items Sold"
FROM "SalesOrder" so
WHERE "orderDate" >= CURRENT_DATE - INTERVAL '30 days'
  AND status != 'CANCELLED'
GROUP BY DATE("orderDate")
ORDER BY "Date";

-- Metabase Visualization Settings:
-- Type: Line Chart
-- X-axis: Date
-- Y-axis: Revenue (primary), Orders (secondary)
-- Trend line: Yes
