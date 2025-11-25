#!/bin/bash
# Phase 21: User Management & Settings
FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0; FAIL=0

echo "=========================================="; echo "  PHASE 21: USER MANAGEMENT & SETTINGS"; echo "=========================================="

PAGES=("/protected/users" "/protected/settings" "/protected/companies")
for PAGE in "${PAGES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -L "$FRONTEND_URL$PAGE")
    if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ $PAGE"; ((PASS++)); else echo "  ❌ $PAGE (HTTP $HTTP_CODE)"; ((FAIL++)); fi
done

echo ""; echo "  PHASE 21 SUMMARY: $PASS/3 passed"
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 21 COMPLETE!"; exit 0; else echo "  ❌ FAILED"; exit 1; fi
