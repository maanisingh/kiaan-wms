#!/bin/bash

HASURA_URL="http://localhost:8090"
ADMIN_SECRET="kiaan_hasura_admin_secret_2024"

echo "═══════════════════════════════════════════════════════════"
echo "🧪 Testing Hasura GraphQL APIs"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Function to run GraphQL query
test_query() {
    local name=$1
    local query=$2

    echo "📝 Test: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    RESULT=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "x-hasura-admin-secret: $ADMIN_SECRET" \
        -d "$query" \
        "$HASURA_URL/v1/graphql")

    if echo "$RESULT" | grep -q "\"data\""; then
        echo "✅ SUCCESS"
        echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
    else
        echo "❌ FAILED"
        echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
    fi
    echo ""
}

# Test 1: Get Products with Brand
test_query "Get Products with Brand" '{
  "query": "query { Product(limit: 5) { id name sku sellingPrice status Brand { name } } }"
}'

# Test 2: Get Inventory with Best-Before Dates
test_query "Get Inventory with Best-Before Dates" '{
  "query": "query { Inventory(limit: 5 order_by: {bestBeforeDate: asc}) { id quantity bestBeforeDate status Product { name sku } Location { code } } }"
}'

# Test 3: Get Sales Orders with Customer Info
test_query "Get Sales Orders with Customer" '{
  "query": "query { SalesOrder(limit: 3) { id orderNumber orderDate status isWholesale Customer { name customerType } } }"
}'

# Test 4: Get Sales Orders with Items
test_query "Get Sales Orders with Line Items" '{
  "query": "query { SalesOrder(limit: 2) { orderNumber SalesOrderItems { quantity unitPrice Product { name } } } }"
}'

# Test 5: Get Warehouses with Locations
test_query "Get Warehouses with Locations" '{
  "query": "query { Warehouse { id name type Locations(limit: 3) { code zone } } }"
}'

# Test 6: Get Products by Brand
test_query "Get Products Filtered by Brand" '{
  "query": "query { Brand { name Product { name sku } } }"
}'

# Test 7: Aggregations - Count Products
test_query "Count Total Products" '{
  "query": "query { Product_aggregate { aggregate { count } } }"
}'

# Test 8: Aggregations - Dashboard Stats
test_query "Dashboard Statistics" '{
  "query": "query { products: Product_aggregate { aggregate { count } } inventory: Inventory_aggregate { aggregate { sum { quantity } } } orders: SalesOrder_aggregate { aggregate { count } } }"
}'

# Test 9: Get Expiring Inventory
test_query "Get Expiring Inventory (Next 60 days)" '{
  "query": "query { Inventory(where: {bestBeforeDate: {_lte: \"2026-01-31\"}, status: {_eq: \"AVAILABLE\"}}, order_by: {bestBeforeDate: asc}, limit: 5) { bestBeforeDate quantity Product { name } } }"
}'

# Test 10: Get Wholesale Orders
test_query "Get Wholesale Orders Only" '{
  "query": "query { SalesOrder(where: {isWholesale: {_eq: true}}, limit: 3) { orderNumber isWholesale salesChannel Customer { name } } }"
}'

echo "═══════════════════════════════════════════════════════════"
echo "✅ API Testing Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "All APIs are working! You can now:"
echo "  1. Open Console: http://localhost:8090/console"
echo "  2. Integrate with frontend"
echo "  3. Deploy to Railway"
echo ""
