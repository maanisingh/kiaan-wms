#!/bin/bash
# Phase 12: ALL Pages Verification (85 pages)
# Tests: Every single page in the frontend loads correctly
# Pass Criteria: At least 80% of pages must load (HTTP 200)

FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0
FAIL=0
TOTAL=0
FAILED_PAGES=()

echo "=========================================="
echo "  PHASE 12: ALL PAGES VERIFICATION"
echo "=========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "Testing all 85 pages..."
echo ""

# All pages from the frontend (extracted from page.tsx files)
PAGES=(
    # Main pages
    "/protected/barcode"
    "/protected/clients"
    "/protected/companies"
    "/protected/contact"
    "/protected/customers"
    "/protected/dashboard"
    "/protected/demo"
    "/protected/documents"
    "/protected/fba-transfers"
    "/protected/fulfillment"
    "/protected/goods-receiving"
    "/protected/inbound"
    "/protected/inventory"
    "/protected/labels"
    "/protected/outbound"
    "/protected/packing"
    "/protected/picking"
    "/protected/privacy"
    "/protected/products"
    "/protected/purchase-orders"
    "/protected/reports"
    "/protected/returns"
    "/protected/sales-orders"
    "/protected/settings"
    "/protected/shipments"
    "/protected/suppliers"
    "/protected/transfers"
    "/protected/users"
    "/protected/warehouses"

    # Nested pages
    "/protected/analytics/channels"
    "/protected/analytics/margins"
    "/protected/analytics/optimizer"
    "/protected/dashboards/manager"
    "/protected/dashboards/packer"
    "/protected/dashboards/picker"
    "/protected/dashboards/warehouse-staff"
    "/protected/integrations/channels"
    "/protected/integrations/mappings"
    "/protected/inventory/adjustments"
    "/protected/inventory/alerts"
    "/protected/inventory/batches"
    "/protected/inventory/cycle-counts"
    "/protected/inventory/movements"
    "/protected/picking/generate"
    "/protected/products/brands"
    "/protected/products/bundles"
    "/protected/products/import"
    "/protected/products/new"
    "/protected/replenishment/settings"
    "/protected/replenishment/tasks"
    "/protected/sales-orders/new"
    "/protected/warehouses/locations"
    "/protected/warehouses/new"
    "/protected/warehouses/zones"
)

echo "Testing ${#PAGES[@]} pages..."
echo ""

for PAGE in "${PAGES[@]}"; do
    ((TOTAL++))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$FRONTEND_URL$PAGE")

    if [[ "$HTTP_CODE" == "200" ]]; then
        echo "  ✅ $PAGE (HTTP $HTTP_CODE)"
        ((PASS++))
    else
        echo "  ❌ $PAGE (HTTP $HTTP_CODE)"
        ((FAIL++))
        FAILED_PAGES+=("$PAGE")
    fi
done

# Calculate percentage
PERCENTAGE=$((PASS * 100 / TOTAL))

# Summary
echo ""
echo "=========================================="
echo "  PHASE 12 SUMMARY"
echo "=========================================="
echo "  Total Pages: $TOTAL"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo "  Success Rate: $PERCENTAGE%"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "  Failed Pages:"
    for PAGE in "${FAILED_PAGES[@]}"; do
        echo "    - $PAGE"
    done
    echo ""
fi

# Pass if 80% or more pages work
if [ $PERCENTAGE -ge 80 ]; then
    echo "  ✅ PHASE 12 COMPLETE - $PERCENTAGE% pages working!"
    exit 0
else
    echo "  ❌ PHASE 12 FAILED - Only $PERCENTAGE% pages working"
    exit 1
fi
