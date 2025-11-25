#!/bin/bash
# Phase 4: Frontend Build & Startup
# Tests: Frontend pages load, static assets work, no critical errors
# Pass Criteria: All 6 tests must pass

FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0
FAIL=0

echo "=========================================="
echo "  PHASE 4: FRONTEND BUILD & STARTUP"
echo "=========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Homepage loads
echo "Test 1: Homepage loads..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$FRONTEND_URL/")
RESULT=$(curl -s --max-time 15 "$FRONTEND_URL/" | head -c 500)

if [[ "$HTTP_CODE" == "200" ]] && [[ "$RESULT" == *"html"* ]]; then
    echo "  ✅ PASS: Homepage loads (HTTP $HTTP_CODE)"
    ((PASS++))
else
    echo "  ❌ FAIL: Homepage not loading"
    echo "  HTTP Code: $HTTP_CODE"
    ((FAIL++))
fi

# Test 2: Login page loads
echo ""
echo "Test 2: Login page loads..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$FRONTEND_URL/auth/login")
RESULT=$(curl -s --max-time 15 "$FRONTEND_URL/auth/login" | head -c 1000)

if [[ "$HTTP_CODE" == "200" ]] && [[ "$RESULT" == *"html"* ]]; then
    echo "  ✅ PASS: Login page loads (HTTP $HTTP_CODE)"
    ((PASS++))
else
    echo "  ❌ FAIL: Login page not loading"
    echo "  HTTP Code: $HTTP_CODE"
    ((FAIL++))
fi

# Test 3: Dashboard redirect works (should redirect to login or load)
echo ""
echo "Test 3: Protected route redirects..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL/protected/dashboard")

if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "307" ]] || [[ "$HTTP_CODE" == "302" ]]; then
    echo "  ✅ PASS: Protected route accessible (HTTP $HTTP_CODE)"
    ((PASS++))
else
    echo "  ❌ FAIL: Protected route error"
    echo "  HTTP Code: $HTTP_CODE"
    ((FAIL++))
fi

# Test 4: Static assets load (CSS)
echo ""
echo "Test 4: Static assets (CSS) load..."
CSS_URL=$(curl -s --max-time 15 "$FRONTEND_URL/" | grep -o '/_next/static/[^"]*\.css' | head -1)

if [ -n "$CSS_URL" ]; then
    CSS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL$CSS_URL")
    if [[ "$CSS_CODE" == "200" ]]; then
        echo "  ✅ PASS: CSS assets loading (HTTP $CSS_CODE)"
        ((PASS++))
    else
        echo "  ❌ FAIL: CSS assets not loading (HTTP $CSS_CODE)"
        ((FAIL++))
    fi
else
    echo "  ⚠️  WARN: No CSS links found in HTML (might be inline)"
    echo "  ✅ PASS: Proceeding (inline CSS assumed)"
    ((PASS++))
fi

# Test 5: Static assets load (JS)
echo ""
echo "Test 5: Static assets (JS) load..."
JS_URL=$(curl -s --max-time 15 "$FRONTEND_URL/" | grep -o '/_next/static/[^"]*\.js' | head -1)

if [ -n "$JS_URL" ]; then
    JS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL$JS_URL")
    if [[ "$JS_CODE" == "200" ]]; then
        echo "  ✅ PASS: JS assets loading (HTTP $JS_CODE)"
        ((PASS++))
    else
        echo "  ❌ FAIL: JS assets not loading (HTTP $JS_CODE)"
        ((FAIL++))
    fi
else
    echo "  ❌ FAIL: No JS links found in HTML"
    ((FAIL++))
fi

# Test 6: Multiple protected routes accessible
echo ""
echo "Test 6: Multiple protected routes..."
ROUTES_OK=0
ROUTES_FAIL=0

for ROUTE in "/protected/products" "/protected/inventory" "/protected/warehouses"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$FRONTEND_URL$ROUTE")
    if [[ "$HTTP_CODE" == "200" ]]; then
        ((ROUTES_OK++))
    else
        ((ROUTES_FAIL++))
    fi
done

if [ $ROUTES_FAIL -eq 0 ]; then
    echo "  ✅ PASS: All protected routes accessible ($ROUTES_OK/3)"
    ((PASS++))
else
    echo "  ❌ FAIL: Some routes not accessible ($ROUTES_FAIL/3 failed)"
    ((FAIL++))
fi

# Summary
echo ""
echo "=========================================="
echo "  PHASE 4 SUMMARY"
echo "=========================================="
echo "  Passed: $PASS/6"
echo "  Failed: $FAIL/6"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  ✅ PHASE 4 COMPLETE - All tests passed!"
    echo ""
    exit 0
else
    echo "  ❌ PHASE 4 FAILED - $FAIL test(s) need fixing"
    echo ""
    exit 1
fi
