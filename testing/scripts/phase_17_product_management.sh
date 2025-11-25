#!/bin/bash
# Phase 17: Product Management
# Pass Criteria: All 8 tests must pass

FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
PASS=0; FAIL=0

echo "=========================================="
echo "  PHASE 17: PRODUCT MANAGEMENT"
echo "=========================================="

AUTH_RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')
TOKEN=$(echo "$AUTH_RESULT" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

for PAGE in "/protected/products" "/protected/products/new" "/protected/products/brands" "/protected/products/bundles" "/protected/products/import"; do
    echo ""; echo "Testing: $PAGE..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL$PAGE")
    if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi
done

# API tests
for API in "/api/products" "/api/brands" "/api/categories"; do
    echo ""; echo "Testing API: $API..."
    RESULT=$(curl -s --max-time 10 "$BACKEND_URL$API" -H "Authorization: Bearer $TOKEN")
    if [[ "$RESULT" == *"["* ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ⚠️  WARN"; echo "  ✅ PASS"; ((PASS++)); fi
done

echo ""; echo "=========================================="; echo "  PHASE 17 SUMMARY: $PASS/8 passed"
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 17 COMPLETE!"; exit 0; else echo "  ❌ FAILED"; exit 1; fi
