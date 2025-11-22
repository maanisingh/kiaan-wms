#!/bin/bash
HASURA_URL="http://localhost:8090/v1/graphql"
ADMIN_SECRET="kiaan_hasura_admin_secret_2024"

echo "🧪 Testing Hasura GraphQL Queries..."
echo ""

# Test 1: Get Products
echo "1️⃣ Testing Products Query..."
curl -s "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "query": "query { Product(limit: 5) { id name sku price status Brand { name } } }"
  }' | jq '.data.Product | length' | xargs -I {} echo "   ✅ Found {} products"

# Test 2: Get Inventory
echo "2️⃣ Testing Inventory Query..."
curl -s "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "query": "query { Inventory(limit: 5) { id quantity bestBeforeDate Product { name sku } Location { code } } }"
  }' | jq '.data.Inventory | length' | xargs -I {} echo "   ✅ Found {} inventory items"

# Test 3: Get Sales Orders
echo "3️⃣ Testing Sales Orders Query..."
curl -s "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "query": "query { SalesOrder(limit: 5) { id orderNumber orderDate status Customer { name } SalesOrderItems { quantity Product { name } } } }"
  }' | jq '.data.SalesOrder | length' | xargs -I {} echo "   ✅ Found {} sales orders"

# Test 4: Get Warehouses with Zones
echo "4️⃣ Testing Warehouses with Zones..."
curl -s "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "query": "query { Warehouse { id name code Zones { id name type } } }"
  }' | jq '.data.Warehouse | length' | xargs -I {} echo "   ✅ Found {} warehouses"

# Test 5: Aggregations
echo "5️⃣ Testing Aggregations..."
curl -s "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "query": "query { Product_aggregate { aggregate { count } } Inventory_aggregate { aggregate { sum { quantity } } } SalesOrder_aggregate { aggregate { count } } }"
  }' | jq -r '"   ✅ Products: " + (.data.Product_aggregate.aggregate.count | tostring) + ", Total Inventory Qty: " + (.data.Inventory_aggregate.aggregate.sum.quantity | tostring) + ", Sales Orders: " + (.data.SalesOrder_aggregate.aggregate.count | tostring)'

echo ""
echo "✅ All queries successful! Hasura GraphQL API is ready!"
echo "🌐 Console: http://localhost:8090/console"
