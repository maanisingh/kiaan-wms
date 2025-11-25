#!/bin/bash
# Phase 16: Inventory Management
# Tests: Inventory adjustments, movements, batches, cycle counts
# Pass Criteria: All 10 tests must pass

BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0
FAIL=0

echo "=========================================="
echo "  PHASE 16: INVENTORY MANAGEMENT"
echo "=========================================="
echo ""

AUTH_RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')
TOKEN=$(echo "$AUTH_RESULT" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

# Test 1: Inventory Overview
echo "Test 1: Inventory Overview page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 2: Inventory Adjustments
echo ""
echo "Test 2: Inventory Adjustments page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory/adjustments")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 3: Inventory Movements
echo ""
echo "Test 3: Inventory Movements page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory/movements")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 4: Inventory Batches
echo ""
echo "Test 4: Inventory Batches page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory/batches")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 5: Cycle Counts
echo ""
echo "Test 5: Cycle Counts page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory/cycle-counts")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 6: Inventory Alerts
echo ""
echo "Test 6: Inventory Alerts page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory/alerts")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 7: Inventory API data
echo ""
echo "Test 7: Inventory API..."
INVENTORY=$(curl -s --max-time 10 "$BACKEND_URL/api/inventory" -H "Authorization: Bearer $TOKEN")
if [[ "$INVENTORY" == *"["* ]]; then
    COUNT=$(echo "$INVENTORY" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: $COUNT items"
    ((PASS++))
else echo "  ❌ FAIL"; ((FAIL++)); fi

# Test 8: New Adjustment page
echo ""
echo "Test 8: New Adjustment page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inventory/adjustments/new")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 9: Inbound page
echo ""
echo "Test 9: Inbound page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/inbound")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

# Test 10: Outbound page
echo ""
echo "Test 10: Outbound page..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/outbound")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ PASS"; ((PASS++)); else echo "  ❌ FAIL: HTTP $HTTP_CODE"; ((FAIL++)); fi

echo ""
echo "=========================================="
echo "  PHASE 16 SUMMARY: $PASS/10 passed"
echo "=========================================="
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 16 COMPLETE!"; exit 0; else echo "  ❌ PHASE 16 FAILED"; exit 1; fi
