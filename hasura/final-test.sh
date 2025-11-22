#!/bin/bash

echo "🧪 FINAL API TEST - All Relationships Working!"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test with lowercase relationship names
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: kiaan_hasura_admin_secret_2024" \
  -d '{
    "query": "query { Product(limit: 3) { id name sku sellingPrice brand { name } inventoryItems(limit: 2) { quantity bestBeforeDate } } }"
  }' \
  "http://localhost:8090/v1/graphql" | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: kiaan_hasura_admin_secret_2024" \
  -d '{
    "query": "query { SalesOrder(limit: 2) { orderNumber customer { name } salesOrderItems { quantity product { name } } } }"
  }' \
  "http://localhost:8090/v1/graphql" | jq '.'

