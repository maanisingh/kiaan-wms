-- Expiring Inventory Alert (FEFO Priority)
-- Purpose: Identify products expiring within 30 days
-- Critical: < 7 days
-- Warning: < 30 days

SELECT 
  p.name as "Product",
  p.sku as "SKU",
  i."lotNumber" as "Lot Number",
  i."bestBeforeDate" as "Expiry Date",
  i."availableQuantity" as "Quantity",
  w.name as "Warehouse",
  l.code as "Location",
  CASE 
    WHEN i."bestBeforeDate" <= CURRENT_DATE THEN 'EXPIRED'
    WHEN i."bestBeforeDate" <= CURRENT_DATE + INTERVAL '7 days' THEN 'Critical (< 7 days)'
    WHEN i."bestBeforeDate" <= CURRENT_DATE + INTERVAL '30 days' THEN 'Warning (< 30 days)'
    ELSE 'OK'
  END as "Urgency",
  (i."bestBeforeDate" - CURRENT_DATE) as "Days Until Expiry"
FROM "Inventory" i
JOIN "Product" p ON i."productId" = p.id
JOIN "Location" l ON i."locationId" = l.id
JOIN "Warehouse" w ON l."warehouseId" = w.id
WHERE i."bestBeforeDate" IS NOT NULL
  AND i."bestBeforeDate" <= CURRENT_DATE + INTERVAL '30 days'
  AND i."availableQuantity" > 0
ORDER BY i."bestBeforeDate";

-- Metabase Visualization Settings:
-- Type: Table
-- Conditional formatting: 
--   - Red for "EXPIRED" and "Critical"
--   - Yellow for "Warning"
-- Sort by: Days Until Expiry (ascending)
