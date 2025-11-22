-- ABC Analysis for Products
-- Purpose: Classify products by revenue contribution (Pareto 80/20 principle)
-- A Items: Top 20% products = 80% revenue
-- B Items: Next 30% products = 15% revenue
-- C Items: Bottom 50% products = 5% revenue

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

-- Metabase Visualization Settings:
-- Type: Bar Chart
-- X-axis: Class
-- Y-axis: Total Revenue
-- Optional: Add Product Count as second series
