#!/bin/bash
HASURA_URL="http://localhost:8090/v1/metadata"
ADMIN_SECRET="kiaan_hasura_admin_secret_2024"

echo "🔐 Setting up Hasura Permissions..."
echo ""

# Admin role - full access to all tables
TABLES=("User" "Company" "Warehouse" "Zone" "Location" "Brand" "Product" "BundleItem" "Inventory" "Customer" "Supplier" "SalesChannel" "ChannelPrice" "SalesOrder" "SalesOrderItem" "PickList" "PickItem" "Transfer" "TransferItem" "ReplenishmentConfig" "ReplenishmentTask")

echo "👑 Setting ADMIN role (full access)..."
for table in "${TABLES[@]}"; do
  # Admin can select all
  curl -s "$HASURA_URL" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"pg_create_select_permission\",\"args\":{\"source\":\"default\",\"table\":\"$table\",\"role\":\"admin\",\"permission\":{\"columns\":\"*\",\"filter\":{}}}}" > /dev/null
  
  # Admin can insert
  curl -s "$HASURA_URL" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"pg_create_insert_permission\",\"args\":{\"source\":\"default\",\"table\":\"$table\",\"role\":\"admin\",\"permission\":{\"check\":{},\"columns\":\"*\"}}}" > /dev/null
  
  # Admin can update
  curl -s "$HASURA_URL" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"pg_create_update_permission\",\"args\":{\"source\":\"default\",\"table\":\"$table\",\"role\":\"admin\",\"permission\":{\"filter\":{},\"columns\":\"*\"}}}" > /dev/null
  
  # Admin can delete
  curl -s "$HASURA_URL" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"pg_create_delete_permission\",\"args\":{\"source\":\"default\",\"table\":\"$table\",\"role\":\"admin\",\"permission\":{\"filter\":{}}}}" > /dev/null
done
echo "   ✅ Admin permissions set"

echo "📦 Setting PICKER role..."
# Picker can read products, inventory, pick lists
for table in "Product" "Inventory" "PickList" "PickItem" "Location" "Warehouse" "Zone"; do
  curl -s "$HASURA_URL" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"pg_create_select_permission\",\"args\":{\"source\":\"default\",\"table\":\"$table\",\"role\":\"picker\",\"permission\":{\"columns\":\"*\",\"filter\":{}}}}" > /dev/null
done

# Picker can update pick items
curl -s "$HASURA_URL" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"pg_create_update_permission","args":{"source":"default","table":"PickItem","role":"picker","permission":{"filter":{},"columns":["pickedQuantity","status"]}}}' > /dev/null

# Picker can update inventory
curl -s "$HASURA_URL" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"pg_create_update_permission","args":{"source":"default","table":"Inventory","role":"picker","permission":{"filter":{},"columns":["availableQuantity","pickedQuantity"]}}}' > /dev/null

echo "   ✅ Picker permissions set"

echo "📦 Setting PACKER role..."
# Packer can read products, orders, pick lists
for table in "Product" "SalesOrder" "SalesOrderItem" "PickList" "PickItem"; do
  curl -s "$HASURA_URL" \
    -H "x-hasura-admin-secret: $ADMIN_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"pg_create_select_permission\",\"args\":{\"source\":\"default\",\"table\":\"$table\",\"role\":\"packer\",\"permission\":{\"columns\":\"*\",\"filter\":{}}}}" > /dev/null
done

# Packer can update order status
curl -s "$HASURA_URL" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"pg_create_update_permission","args":{"source":"default","table":"SalesOrder","role":"packer","permission":{"filter":{},"columns":["status","packedAt"]}}}' > /dev/null

echo "   ✅ Packer permissions set"

echo ""
echo "✅ All permissions configured successfully!"
echo "📋 Roles available: admin, picker, packer"
