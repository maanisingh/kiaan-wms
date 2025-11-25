#!/bin/bash
# Phase 22: Role-Based Dashboards
FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0; FAIL=0

echo "=========================================="; echo "  PHASE 22: ROLE-BASED DASHBOARDS"; echo "=========================================="

PAGES=("/protected/dashboard" "/protected/dashboards/manager" "/protected/dashboards/picker" "/protected/dashboards/packer" "/protected/dashboards/warehouse-staff")
for PAGE in "${PAGES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL$PAGE")
    if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ $PAGE"; ((PASS++)); else echo "  ❌ $PAGE (HTTP $HTTP_CODE)"; ((FAIL++)); fi
done

echo ""; echo "  PHASE 22 SUMMARY: $PASS/5 passed"
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 22 COMPLETE!"; exit 0; else echo "  ❌ FAILED"; exit 1; fi
