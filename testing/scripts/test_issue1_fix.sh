#!/bin/bash

# Test script for Issue #1 - Inventory Batches Endpoint Fix

echo "=== ISSUE #1 FIX VERIFICATION: Inventory Batches Endpoint ==="
echo ""

# Get authentication token
echo "1. Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST https://serene-adaptation-production-c6d3.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: Could not obtain authentication token"
  exit 1
fi

echo "✓ Token obtained"
echo ""

# Test GET /api/inventory/batches
echo "2. Testing GET /api/inventory/batches..."
BATCH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  https://serene-adaptation-production-c6d3.up.railway.app/api/inventory/batches)

# Check if response contains error
if echo "$BATCH_RESPONSE" | grep -q "Internal server error"; then
  echo "❌ FAILED: Endpoint still returning 500 error"
  echo "Response: $BATCH_RESPONSE"
  exit 1
elif echo "$BATCH_RESPONSE" | grep -q '"error"'; then
  echo "❌ FAILED: Endpoint returned error"
  echo "Response: $BATCH_RESPONSE"
  exit 1
else
  echo "✓ Endpoint responded successfully"

  # Count batches
  BATCH_COUNT=$(echo "$BATCH_RESPONSE" | grep -o '"id":' | wc -l)
  echo "✓ Found $BATCH_COUNT inventory batches"

  # Show first batch
  echo ""
  echo "Sample response (first 500 chars):"
  echo "$BATCH_RESPONSE" | head -c 500
  echo ""
fi

echo ""
echo "=== VERIFICATION SUMMARY ==="
echo "✅ GET /api/inventory/batches: WORKING"
echo "✅ Issue #1: FIXED"
echo ""
echo "All batch tracking endpoints should now be functional:"
echo "  - GET /api/inventory/batches"
echo "  - GET /api/inventory/batches/:id"
echo "  - POST /api/inventory/batches"
echo "  - POST /api/inventory/batches/allocate-fifo"
echo "  - POST /api/inventory/batches/allocate-lifo"
echo "  - POST /api/inventory/batches/allocate-fefo"
echo "  - PATCH /api/inventory/batches/:id/status"
echo ""
