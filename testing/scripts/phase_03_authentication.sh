#!/bin/bash
# Phase 3: Authentication System
# Tests: All demo users can login, token validation, protected route access
# Pass Criteria: All 8 tests must pass

BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
PASS=0
FAIL=0

echo "=========================================="
echo "  PHASE 3: AUTHENTICATION SYSTEM"
echo "=========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""

# Demo users to test
declare -a USERS=(
    "admin@kiaan-wms.com:Admin@123:SUPER_ADMIN"
    "companyadmin@kiaan-wms.com:Admin@123:COMPANY_ADMIN"
    "warehousemanager@kiaan-wms.com:Admin@123:WAREHOUSE_MANAGER"
    "inventorymanager@kiaan-wms.com:Admin@123:INVENTORY_MANAGER"
    "picker@kiaan-wms.com:Admin@123:PICKER"
    "viewer@kiaan-wms.com:Admin@123:VIEWER"
)

# Test 1-6: All demo users can login
echo "Testing demo user logins..."
echo ""

for USER_DATA in "${USERS[@]}"; do
    IFS=':' read -r EMAIL PASSWORD ROLE <<< "$USER_DATA"

    echo "Test: Login as $ROLE ($EMAIL)..."
    RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

    if [[ "$RESULT" == *"token"* ]]; then
        echo "  ✅ PASS: $ROLE login successful"
        ((PASS++))
    else
        echo "  ❌ FAIL: $ROLE login failed"
        echo "  Response: ${RESULT:0:100}"
        ((FAIL++))
    fi
done

# Test 7: Invalid credentials rejected
echo ""
echo "Test 7: Invalid credentials rejected..."
RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@test.com","password":"wrongpass"}')

if [[ "$RESULT" == *"error"* ]] || [[ "$RESULT" == *"Invalid"* ]] || [[ "$RESULT" == *"not found"* ]]; then
    echo "  ✅ PASS: Invalid credentials correctly rejected"
    ((PASS++))
else
    echo "  ❌ FAIL: Invalid credentials not rejected properly"
    echo "  Response: ${RESULT:0:100}"
    ((FAIL++))
fi

# Test 8: Protected route without token returns 401
echo ""
echo "Test 8: Protected route without token..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/products")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL/api/products")

if [[ "$RESULT" == *"No token"* ]] || [[ "$HTTP_CODE" == "401" ]]; then
    echo "  ✅ PASS: Protected route requires authentication"
    ((PASS++))
else
    echo "  ❌ FAIL: Protected route accessible without token"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Response: ${RESULT:0:100}"
    ((FAIL++))
fi

# Summary
echo ""
echo "=========================================="
echo "  PHASE 3 SUMMARY"
echo "=========================================="
echo "  Passed: $PASS/8"
echo "  Failed: $FAIL/8"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  ✅ PHASE 3 COMPLETE - All tests passed!"
    echo ""
    exit 0
else
    echo "  ❌ PHASE 3 FAILED - $FAIL test(s) need fixing"
    echo ""
    exit 1
fi
