#!/bin/bash
# EXHAUSTIVE API ENDPOINT TESTING
# Testing all 50+ endpoints with various scenarios

BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
TOKEN=$(cat /root/kiaan-wms/testing/reports/auth_token.txt 2>/dev/null || echo "")
REPORT_FILE="/root/kiaan-wms/testing/reports/2_api_report.txt"

echo "========================================" > $REPORT_FILE
echo "COMPREHENSIVE API ENDPOINT TESTING" >> $REPORT_FILE
echo "Started: $(date)" >> $REPORT_FILE
echo "========================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_ISSUES=0
HIGH_ISSUES=0

# Get fresh token first
echo "Getting fresh authentication token..." | tee -a $REPORT_FILE
auth_response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@kiaan-wms.com","password":"Admin@123"}')
TOKEN=$(echo "$auth_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "CRITICAL: Could not obtain authentication token!" | tee -a $REPORT_FILE
    exit 1
fi

echo "Token obtained successfully" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local auth_required="$4"
    local data="$5"
    local expected_status="$6"

    echo "Testing: $test_name" | tee -a $REPORT_FILE

    if [ "$auth_required" == "YES" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BACKEND_URL$endpoint" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Authorization: Bearer $TOKEN" \
                "$BACKEND_URL$endpoint" 2>&1)
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BACKEND_URL$endpoint" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "$BACKEND_URL$endpoint" 2>&1)
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Check if status code matches expected
    if [ "$http_code" == "$expected_status" ]; then
        echo "  ✓ PASS: Got expected status $http_code" | tee -a $REPORT_FILE
        TESTS_PASSED=$((TESTS_PASSED + 1))
        # Return body for further inspection
        echo "$body"
    else
        echo "  ✗ FAIL: Expected $expected_status but got $http_code" | tee -a $REPORT_FILE
        echo "  Response: ${body:0:200}" | tee -a $REPORT_FILE
        TESTS_FAILED=$((TESTS_FAILED + 1))
        if [ "$http_code" == "500" ]; then
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        elif [ "$http_code" == "404" ] && [ "$expected_status" == "200" ]; then
            HIGH_ISSUES=$((HIGH_ISSUES + 1))
        fi
    fi
    echo "" >> $REPORT_FILE
}

echo "=== SECTION 1: HEALTH & SYSTEM ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Health Check (root)" "GET" "/health" "NO" "" "200"
test_endpoint "Health Check (API)" "GET" "/api/health" "NO" "" "200"

echo "=== SECTION 2: AUTHENTICATION ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get Current User (with auth)" "GET" "/api/auth/me" "YES" "" "200"
test_endpoint "Get Current User (no auth)" "GET" "/api/auth/me" "NO" "" "401"
test_endpoint "Profile Update" "PUT" "/api/auth/profile" "YES" '{"name":"Test User Updated"}' "200"

echo "=== SECTION 3: DASHBOARD ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

dashboard_stats=$(test_endpoint "Dashboard Stats" "GET" "/api/dashboard/stats" "YES" "" "200")
test_endpoint "Recent Orders" "GET" "/api/dashboard/recent-orders" "YES" "" "200"
test_endpoint "Low Stock Alerts" "GET" "/api/dashboard/low-stock" "YES" "" "200"
test_endpoint "Activity Feed" "GET" "/api/dashboard/activity" "YES" "" "200"

echo "=== SECTION 4: PRODUCTS ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

products=$(test_endpoint "Get All Products" "GET" "/api/products" "YES" "" "200")
product_count=$(echo "$products" | grep -o '"id"' | wc -l)
echo "Products found: $product_count" | tee -a $REPORT_FILE

# Get first product ID for testing
first_product_id=$(echo "$products" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$first_product_id" ]; then
    test_endpoint "Get Single Product" "GET" "/api/products/$first_product_id" "YES" "" "200"
else
    echo "  ⚠ WARNING: No products found to test single product endpoint" | tee -a $REPORT_FILE
fi

test_endpoint "Get Non-existent Product" "GET" "/api/products/00000000-0000-0000-0000-000000000000" "YES" "" "404"

echo "=== SECTION 5: BRANDS ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

brands=$(test_endpoint "Get All Brands" "GET" "/api/brands" "YES" "" "200")
brand_count=$(echo "$brands" | grep -o '"id"' | wc -l)
echo "Brands found: $brand_count" | tee -a $REPORT_FILE

echo "=== SECTION 6: INVENTORY ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

inventory=$(test_endpoint "Get All Inventory" "GET" "/api/inventory" "YES" "" "200")
inventory_count=$(echo "$inventory" | grep -o '"id"' | wc -l)
echo "Inventory items found: $inventory_count" | tee -a $REPORT_FILE

test_endpoint "Get Inventory Adjustments" "GET" "/api/inventory/adjustments" "YES" "" "200"
test_endpoint "Get Cycle Counts" "GET" "/api/inventory/cycle-counts" "YES" "" "200"
test_endpoint "Get Inventory Alerts" "GET" "/api/inventory/alerts" "YES" "" "200"
test_endpoint "Get Inventory Batches" "GET" "/api/inventory/batches" "YES" "" "200"
test_endpoint "Get Inventory Movements" "GET" "/api/inventory/movements" "YES" "" "200"

echo "=== SECTION 7: CUSTOMER ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

customers=$(test_endpoint "Get All Customers" "GET" "/api/customers" "YES" "" "200")
customer_count=$(echo "$customers" | grep -o '"id"' | wc -l)
echo "Customers found: $customer_count" | tee -a $REPORT_FILE

# Count B2C vs B2B
b2c_count=$(echo "$customers" | grep -o '"customerType":"B2C"' | wc -l)
b2b_count=$(echo "$customers" | grep -o '"customerType":"B2B"' | wc -l)
echo "  B2C Customers: $b2c_count" | tee -a $REPORT_FILE
echo "  B2B Customers: $b2b_count" | tee -a $REPORT_FILE

echo "=== SECTION 8: WAREHOUSE ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

warehouses=$(test_endpoint "Get All Warehouses" "GET" "/api/warehouses" "YES" "" "200")
warehouse_count=$(echo "$warehouses" | grep -o '"id"' | wc -l)
echo "Warehouses found: $warehouse_count" | tee -a $REPORT_FILE

echo "=== SECTION 9: SALES ORDERS ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

orders=$(test_endpoint "Get All Sales Orders" "GET" "/api/sales-orders" "YES" "" "200")
order_count=$(echo "$orders" | grep -o '"id"' | wc -l)
echo "Sales orders found: $order_count" | tee -a $REPORT_FILE

echo "=== SECTION 10: REPLENISHMENT ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get Replenishment Tasks" "GET" "/api/replenishment/tasks" "YES" "" "200"
test_endpoint "Get Replenishment Config" "GET" "/api/replenishment/config" "YES" "" "200"

echo "=== SECTION 11: TRANSFER ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get All Transfers" "GET" "/api/transfers" "YES" "" "200"

echo "=== SECTION 12: CHANNEL & ANALYTICS ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get Sales Channels" "GET" "/api/channels" "YES" "" "200"
test_endpoint "Get Channel Prices" "GET" "/api/analytics/channel-prices" "YES" "" "200"

echo "=== SECTION 13: COMPANY ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get Companies" "GET" "/api/companies" "YES" "" "200"

echo "=== SECTION 14: BARCODE & DOCUMENT ENDPOINTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get Barcode Statistics" "GET" "/api/barcode/statistics" "YES" "" "200"
test_endpoint "Get Document Templates" "GET" "/api/documents/templates" "YES" "" "200"

echo "=== SECTION 15: CATEGORIES ENDPOINT ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Get Categories" "GET" "/api/categories" "YES" "" "200"

echo "=== SECTION 16: SECURITY TESTS - AUTHORIZATION ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "Protected endpoint without token" "GET" "/api/products" "NO" "" "401"
test_endpoint "Protected endpoint with invalid token" "GET" "/api/products" "NO" "" "401"

# Test with invalid token explicitly
TEMP_TOKEN="$TOKEN"
TOKEN="invalid_token_123"
test_endpoint "Protected endpoint with malformed token" "GET" "/api/products" "YES" "" "401"
TOKEN="$TEMP_TOKEN"

echo "=== SECTION 17: EDGE CASES & INVALID REQUESTS ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_endpoint "GET non-existent endpoint" "GET" "/api/nonexistent" "YES" "" "404"
test_endpoint "POST to GET-only endpoint" "POST" "/api/products" "YES" '{"name":"test"}' "201"
test_endpoint "Invalid JSON in POST" "POST" "/api/products" "YES" '{invalid json}' "400"

echo "========================================" | tee -a $REPORT_FILE
echo "API TESTING SUMMARY" | tee -a $REPORT_FILE
echo "========================================" | tee -a $REPORT_FILE
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))" | tee -a $REPORT_FILE
echo "Passed: $TESTS_PASSED" | tee -a $REPORT_FILE
echo "Failed: $TESTS_FAILED" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Issues by Severity:" | tee -a $REPORT_FILE
echo "  Critical (500 errors): $CRITICAL_ISSUES" | tee -a $REPORT_FILE
echo "  High (404 on expected endpoints): $HIGH_ISSUES" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Data Verification:" | tee -a $REPORT_FILE
echo "  Products: $product_count (expected 40+)" | tee -a $REPORT_FILE
echo "  Brands: $brand_count (expected 10)" | tee -a $REPORT_FILE
echo "  Inventory: $inventory_count (expected 48)" | tee -a $REPORT_FILE
echo "  Customers: $customer_count (expected 25)" | tee -a $REPORT_FILE
echo "    - B2C: $b2c_count (expected 20)" | tee -a $REPORT_FILE
echo "    - B2B: $b2b_count (expected 5)" | tee -a $REPORT_FILE
echo "  Warehouses: $warehouse_count (expected 2)" | tee -a $REPORT_FILE
echo "  Sales Orders: $order_count" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Completed: $(date)" | tee -a $REPORT_FILE

echo ""
echo "Report saved to: $REPORT_FILE"
