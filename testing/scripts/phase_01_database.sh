#!/bin/bash
# Phase 1: Database Health & Connection
# Tests: Database connectivity, schema verification, seed data presence
# Pass Criteria: All 5 tests must pass

BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
PASS=0
FAIL=0
TOKEN=""

echo "=========================================="
echo "  PHASE 1: DATABASE HEALTH & CONNECTION"
echo "=========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Backend Health Check
echo "Test 1: Backend health endpoint..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/health")
if [[ "$RESULT" == *"ok"* ]]; then
    echo "  ✅ PASS: Backend responding"
    ((PASS++))
else
    echo "  ❌ FAIL: Backend not responding"
    echo "  Response: $RESULT"
    ((FAIL++))
fi

# Test 2: Database Connected (via API health)
echo ""
echo "Test 2: Database connection..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/health")
if [[ "$RESULT" == *"PostgreSQL"* ]] || [[ "$RESULT" == *"Prisma"* ]]; then
    echo "  ✅ PASS: Database connected (PostgreSQL + Prisma)"
    ((PASS++))
else
    echo "  ❌ FAIL: Database connection issue"
    echo "  Response: $RESULT"
    ((FAIL++))
fi

# Test 3: Authentication works (get token)
echo ""
echo "Test 3: Authentication - Login..."
AUTH_RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')

if [[ "$AUTH_RESULT" == *"token"* ]]; then
    TOKEN=$(echo "$AUTH_RESULT" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')
    echo "  ✅ PASS: Authentication successful, token received"
    ((PASS++))
else
    echo "  ❌ FAIL: Authentication failed"
    echo "  Response: $AUTH_RESULT"
    ((FAIL++))
    echo ""
    echo "Cannot continue without authentication."
    echo "=========================================="
    echo "  PHASE 1 FAILED - Authentication required"
    echo "=========================================="
    exit 1
fi

# Test 4: Products exist (seed data verification)
echo ""
echo "Test 4: Seed data - Products..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/products" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"sku"* ]] || [[ "$RESULT" == *"name"* ]]; then
    # Count products
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Products found ($COUNT products)"
    ((PASS++))
else
    echo "  ❌ FAIL: No products in database"
    echo "  Response: ${RESULT:0:200}..."
    ((FAIL++))
fi

# Test 5: Warehouses exist (seed data verification)
echo ""
echo "Test 5: Seed data - Warehouses..."
RESULT=$(curl -s --max-time 10 "$BACKEND_URL/api/warehouses" \
    -H "Authorization: Bearer $TOKEN")
if [[ "$RESULT" == *"name"* ]] || [[ "$RESULT" == *"Main"* ]]; then
    COUNT=$(echo "$RESULT" | grep -o '"id"' | wc -l)
    echo "  ✅ PASS: Warehouses found ($COUNT warehouses)"
    ((PASS++))
else
    echo "  ❌ FAIL: No warehouses in database"
    echo "  Response: ${RESULT:0:200}..."
    ((FAIL++))
fi

# Summary
echo ""
echo "=========================================="
echo "  PHASE 1 SUMMARY"
echo "=========================================="
echo "  Passed: $PASS/5"
echo "  Failed: $FAIL/5"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  ✅ PHASE 1 COMPLETE - All tests passed!"
    echo ""
    exit 0
else
    echo "  ❌ PHASE 1 FAILED - $FAIL test(s) need fixing"
    echo ""
    exit 1
fi
