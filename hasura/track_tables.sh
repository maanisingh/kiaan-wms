#!/bin/bash
# Track all WMS tables in Hasura

HASURA_URL="http://localhost:8090/v1/metadata"
ADMIN_SECRET="kiaan_hasura_admin_secret_2024"

# List of WMS tables to track
TABLES=(
  "User"
  "Company"
  "Warehouse"
  "Zone"
  "Location"
  "Brand"
  "Product"
  "BundleItem"
  "Inventory"
  "Customer"
  "Supplier"
  "SalesChannel"
  "ChannelPrice"
  "SalesOrder"
  "SalesOrderItem"
  "PickList"
  "PickItem"
  "Transfer"
  "TransferItem"
  "ReplenishmentConfig"
  "ReplenishmentTask"
)

echo "🚀 Tracking WMS tables in Hasura..."
echo ""

for table in "${TABLES[@]}"; do
  echo "📋 Tracking: $table"
  
  curl -s "$HASURA_URL" \
    -H "Content-Type: application/json" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -d "{
      \"type\": \"pg_track_table\",
      \"args\": {
        \"source\": \"default\",
        \"table\": {
          \"name\": \"$table\",
          \"schema\": \"public\"
        }
      }
    }" | jq -r '.message // "✅ Success"'
done

echo ""
echo "🔗 Creating relationships..."

# Track all foreign keys as relationships
curl -s "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "type": "pg_create_foreign_key_constraint_relationships",
    "args": {
      "source": "default"
    }
  }' | jq -r '.message // "✅ Relationships created"'

echo ""
echo "✅ All tables tracked and relationships created!"
echo "🌐 Open: http://localhost:8090/console"
