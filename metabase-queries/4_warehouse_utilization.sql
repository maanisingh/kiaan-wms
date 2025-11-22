-- Warehouse Utilization & Capacity
-- Purpose: Monitor warehouse space usage

SELECT 
  w.name as "Warehouse",
  COUNT(DISTINCT l.id) as "Total Locations",
  COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN l.id END) as "Occupied Locations",
  COUNT(DISTINCT l.id) - COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN l.id END) as "Free Locations",
  ROUND(
    COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN l.id END)::numeric / 
    NULLIF(COUNT(DISTINCT l.id), 0) * 100, 
    2
  ) as "Occupancy %",
  SUM(COALESCE(i.quantity, 0)) as "Total Units",
  SUM(COALESCE(i."availableQuantity", 0)) as "Available Units",
  COUNT(DISTINCT i."productId") as "Unique Products"
FROM "Warehouse" w
LEFT JOIN "Location" l ON l."warehouseId" = w.id
LEFT JOIN "Inventory" i ON i."locationId" = l.id
GROUP BY w.id, w.name
ORDER BY "Occupancy %" DESC;

-- Metabase Visualization Settings:
-- Type: Table or Gauge Chart
-- Highlight: High occupancy (> 80%) in red, medium (60-80%) in yellow
-- Filter: By warehouse
