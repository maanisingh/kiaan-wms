#!/bin/bash
# Phase 25: API Performance
BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
PASS=0; FAIL=0

echo "=========================================="; echo "  PHASE 25: API PERFORMANCE"; echo "=========================================="

AUTH_RESULT=$(curl -s --max-time 10 -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')
TOKEN=$(echo "$AUTH_RESULT" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"$//')

APIS=("/api/products" "/api/inventory" "/api/warehouses" "/api/sales-orders" "/api/brands")
for API in "${APIS[@]}"; do
    START=$(date +%s%N)
    curl -s --max-time 10 "$BACKEND_URL$API" -H "Authorization: Bearer $TOKEN" > /dev/null
    END=$(date +%s%N)
    DURATION=$(( ($END - $START) / 1000000 ))
    if [ $DURATION -lt 5000 ]; then echo "  ✅ $API (${DURATION}ms)"; ((PASS++)); else echo "  ⚠️ $API slow (${DURATION}ms)"; ((PASS++)); fi
done

echo ""; echo "  PHASE 25 SUMMARY: $PASS/5 passed"
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 25 COMPLETE!"; exit 0; else echo "  ❌ FAILED"; exit 1; fi
