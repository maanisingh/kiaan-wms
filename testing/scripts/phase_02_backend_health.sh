#!/bin/bash
# Phase 2: Backend Server Health
# Tests: All major API endpoint categories respond correctly
# Pass Criteria: All 6 tests must pass

BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
PASS=0
FAIL=0
TOKEN=""

echo "=========================================="
echo "  PHASE 2: BACKEND SERVER HEALTH"
echo "=========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""

# First, get auth token
echo "Authenticating..."
AUTH_RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')
TOKEN=$(echo "$AUTH_RESULT" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

if [ -z "$TOKEN" ]; then
    echo "  ❌ FAIL: Could not authenticate"
    exit 1
fi
echo "  ✅ Token received"
echo ""

# Test 1: Dashboard Stats Endpoint
echo "Test 1: Dashboard stats endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/dashboard/stats" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"totalProducts"* ]] || [[ "$RESULT" == *"total"* ]]; then
    echo "  ✅ PASS: Dashboard stats responding"
    ((PASS++))
else
    echo "  ❌ FAIL: Dashboard stats not responding"
    echo "  Response: ${RESULT:0:200}"
    ((FAIL++))
fi

# Test 2: Inventory Endpoint
echo ""
echo "Test 2: Inventory endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/inventory" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"quantity"* ]] || [[ "$RESULT" == *"[]"* ]] || [[ "$RESULT" == *"product"* ]]; then
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Inventory endpoint responding ($COUNT items)"
    ((PASS++))
else
    echo "  ❌ FAIL: Inventory endpoint not responding"
    echo "  Response: ${RESULT:0:200}"
    ((FAIL++))
fi

# Test 3: Customers Endpoint
echo ""
echo "Test 3: Customers endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/customers" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"name"* ]] || [[ "$RESULT" == *"email"* ]] || [[ "$RESULT" == *"[]"* ]]; then
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Customers endpoint responding ($COUNT customers)"
    ((PASS++))
else
    echo "  ❌ FAIL: Customers endpoint not responding"
    echo "  Response: ${RESULT:0:200}"
    ((FAIL++))
fi

# Test 4: Sales Orders Endpoint
echo ""
echo "Test 4: Sales orders endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/sales-orders" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"status"* ]] || [[ "$RESULT" == *"[]"* ]] || [[ "$RESULT" == *"order"* ]]; then
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Sales orders endpoint responding ($COUNT orders)"
    ((PASS++))
else
    echo "  ❌ FAIL: Sales orders endpoint not responding"
    echo "  Response: ${RESULT:0:200}"
    ((FAIL++))
fi

# Test 5: Brands Endpoint
echo ""
echo "Test 5: Brands endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/brands" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"name"* ]] || [[ "$RESULT" == *"[]"* ]]; then
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Brands endpoint responding ($COUNT brands)"
    ((PASS++))
else
    echo "  ❌ FAIL: Brands endpoint not responding"
    echo "  Response: ${RESULT:0:200}"
    ((FAIL++))
fi

# Test 6: Replenishment Config Endpoint
echo ""
echo "Test 6: Replenishment config endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/replenishment/config" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"minStockLevel"* ]] || [[ "$RESULT" == *"[]"* ]] || [[ "$RESULT" == *"product"* ]]; then
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Replenishment config responding ($COUNT configs)"
    ((PASS++))
else
    echo "  ❌ FAIL: Replenishment config not responding"
    echo "  Response: ${RESULT:0:200}"
    ((FAIL++))
fi

# Summary
echo ""
echo "=========================================="
echo "  PHASE 2 SUMMARY"
echo "=========================================="
echo "  Passed: $PASS/6"
echo "  Failed: $FAIL/6"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  ✅ PHASE 2 COMPLETE - All tests passed!"
    echo ""
    exit 0
else
    echo "  ❌ PHASE 2 FAILED - $FAIL test(s) need fixing"
    echo ""
    exit 1
fi
