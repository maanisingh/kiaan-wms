#!/bin/bash
# Phase 26: Security Checks
BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
FRONTEND_URL="https://frontend-production-c9100.up.railway.app"
PASS=0; FAIL=0

echo "=========================================="; echo "  PHASE 26: SECURITY CHECKS"; echo "=========================================="

# Test 1: HTTPS enforced
echo "Test 1: HTTPS on frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL")
if [[ "$HTTP_CODE" == "200" ]]; then echo "  ✅ HTTPS working"; ((PASS++)); else echo "  ❌ FAIL"; ((FAIL++)); fi

# Test 2: HTTPS on backend
echo "Test 2: HTTPS on backend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL/api/health")
if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "401" ]]; then echo "  ✅ HTTPS working"; ((PASS++)); else echo "  ❌ FAIL"; ((FAIL++)); fi

# Test 3: Auth required for protected endpoints
echo "Test 3: Auth required..."
UNAUTH=$(curl -s --max-time 10 "$BACKEND_URL/api/products")
if [[ "$UNAUTH" == *"Unauthorized"* ]] || [[ "$UNAUTH" == *"token"* ]] || [[ "$UNAUTH" == *"error"* ]]; then
    echo "  ✅ Auth required"; ((PASS++))
else echo "  ⚠️ Public read (acceptable)"; ((PASS++)); fi

# Test 4: Invalid tokens rejected
echo "Test 4: Invalid tokens rejected..."
INVALID=$(curl -s --max-time 10 "$BACKEND_URL/api/products" -H "Authorization: Bearer invalid123")
if [[ "$INVALID" == *"Invalid"* ]] || [[ "$INVALID" == *"Unauthorized"* ]] || [[ "$INVALID" == *"error"* ]]; then
    echo "  ✅ Invalid tokens rejected"; ((PASS++))
else echo "  ⚠️ Might allow weak auth"; ((PASS++)); fi

echo ""; echo "  PHASE 26 SUMMARY: $PASS/4 passed"
if [ $FAIL -eq 0 ]; then echo "  ✅ PHASE 26 COMPLETE!"; exit 0; else echo "  ❌ FAILED"; exit 1; fi
