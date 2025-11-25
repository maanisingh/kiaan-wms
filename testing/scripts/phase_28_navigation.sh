#!/bin/bash
# Phase 28: Navigation & Sidebar
FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0; FAIL=0

echo "=========================================="; echo "  PHASE 28: NAVIGATION & SIDEBAR"; echo "=========================================="

# Test main navigation menu items
MENU_PAGES=("/protected/dashboard" "/protected/products" "/protected/inventory" "/protected/warehouses" "/protected/sales-orders" "/protected/picking" "/protected/packing" "/protected/shipments" "/protected/users" "/protected/settings")

for PAGE in "${MENU_PAGES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$FRONTEND_URL$PAGE")
    if [[ "$HTTP_CODE" == "200" ]]; then ((PASS++)); else ((FAIL++)); fi
done

echo "  Tested ${#MENU_PAGES[@]} navigation links"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo ""; echo "  PHASE 28 SUMMARY: $PASS/${#MENU_PAGES[@]} passed"
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 28 COMPLETE!"; exit 0; else echo "  ❌ FAILED"; exit 1; fi
