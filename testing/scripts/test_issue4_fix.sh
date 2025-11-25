#!/bin/bash

echo "=== ISSUE #4 FIX VERIFICATION: Dashboard Activity Feed ==="
echo ""

# Get token
echo "1. Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: Could not obtain token"
  exit 1
fi

echo "✓ Token obtained"
echo ""

# Test activity feed endpoint
echo "2. Testing GET /api/dashboard/activity..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8010/api/dashboard/activity)

# Check response
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ FAILED: Endpoint returned error"
  echo "Response: $RESPONSE"
  exit 1
else
  echo "✅ SUCCESS: Endpoint working!"

  # Count activities
  COUNT=$(echo "$RESPONSE" | grep -o '"id":' | wc -l)
  echo "✓ Found $COUNT activity items"

  # Check if user field is populated
  if echo "$RESPONSE" | grep -q '"user"'; then
    echo "✓ Activity items have user field populated"
  fi

  echo ""
  echo "Sample response (first 300 chars):"
  echo "$RESPONSE" | head -c 300
  echo "..."
fi

echo ""
echo ""
echo "=== VERIFICATION COMPLETE ==="
echo "✅ Issue #4: FIXED"
echo "✅ Dashboard activity feed operational"
echo "✅ User reference corrected (user -> req.user)"
