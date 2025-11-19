#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          Railway Deployment Verification Script                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
HEALTH=$(curl -s https://serene-adaptation-production-11be.up.railway.app/health)
if echo "$HEALTH" | grep -q "ok"; then
  echo "   ✅ Health check passed"
else
  echo "   ❌ Health check failed"
  exit 1
fi
echo ""

# Test 2: Login
echo "2. Testing Login (checks if database is seeded)..."
LOGIN_RESPONSE=$(curl -s -X POST https://serene-adaptation-production-11be.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo "   ✅ Login SUCCESS - Database is seeded!"
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  echo ""
  
  # Test 3: Get Brands
  echo "3. Testing Brands Endpoint..."
  BRANDS=$(curl -s -H "Authorization: Bearer $TOKEN" \
    https://serene-adaptation-production-11be.up.railway.app/api/brands)
  BRAND_COUNT=$(echo "$BRANDS" | jq 'length')
  echo "   ✅ Found $BRAND_COUNT brands"
  echo "   Brands: $(echo "$BRANDS" | jq -r '.[].name' | head -5 | tr '\n' ', ' | sed 's/,$//')"
  echo ""
  
  # Test 4: Get Bundles
  echo "4. Testing Bundles Endpoint..."
  BUNDLES=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://serene-adaptation-production-11be.up.railway.app/api/products?type=BUNDLE")
  BUNDLE_COUNT=$(echo "$BUNDLES" | jq 'length')
  echo "   ✅ Found $BUNDLE_COUNT bundles"
  echo ""
  
  # Test 5: Get Inventory
  echo "5. Testing Inventory Endpoint..."
  INVENTORY=$(curl -s -H "Authorization: Bearer $TOKEN" \
    https://serene-adaptation-production-11be.up.railway.app/api/inventory)
  INV_COUNT=$(echo "$INVENTORY" | jq 'length')
  echo "   ✅ Found $INV_COUNT inventory items"
  echo ""
  
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║                   ✅ ALL TESTS PASSED!                           ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Frontend should now display data at:"
  echo "  • Bundles: https://frontend-production-c9100.up.railway.app/products/bundles"
  echo "  • Brands: https://frontend-production-c9100.up.railway.app/products/brands"
  echo "  • Inventory: https://frontend-production-c9100.up.railway.app/inventory"
  
else
  echo "   ❌ Login FAILED"
  echo "   Response: $LOGIN_RESPONSE"
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║                  ⚠️  BACKEND NOT READY                           ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Please check Railway Dashboard:"
  echo "  1. Verify JWT_SECRET environment variable is set"
  echo "  2. Check deployment logs for errors"
  echo "  3. Ensure DATABASE_URL is populated (from PostgreSQL plugin)"
  echo "  4. Redeploy if necessary"
  echo ""
  echo "See RAILWAY_DEPLOYMENT_STATUS.md for detailed troubleshooting."
fi
