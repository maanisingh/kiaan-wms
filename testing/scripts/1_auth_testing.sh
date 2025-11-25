#!/bin/bash
# EXHAUSTIVE AUTHENTICATION & AUTHORIZATION TESTING
# Testing all edge cases, security vulnerabilities, and access controls

BACKEND_URL="https://serene-adaptation-production-c6d3.up.railway.app"
REPORT_FILE="/root/kiaan-wms/testing/reports/1_auth_report.txt"

echo "========================================" > $REPORT_FILE
echo "AUTHENTICATION & AUTHORIZATION TESTING" >> $REPORT_FILE
echo "Started: $(date)" >> $REPORT_FILE
echo "========================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Helper function to test and log
test_auth() {
    local test_name="$1"
    local email="$2"
    local password="$3"
    local expected_result="$4"

    echo "Testing: $test_name" | tee -a $REPORT_FILE

    response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [[ "$expected_result" == "SUCCESS" && "$http_code" == "200" ]]; then
        echo "  ✓ PASS: Got 200 status code" | tee -a $REPORT_FILE
        TESTS_PASSED=$((TESTS_PASSED + 1))
        # Extract and return token
        echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
    elif [[ "$expected_result" == "FAIL" && "$http_code" != "200" ]]; then
        echo "  ✓ PASS: Correctly rejected with status $http_code" | tee -a $REPORT_FILE
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ FAIL: Expected $expected_result but got $http_code" | tee -a $REPORT_FILE
        echo "  Response: $body" | tee -a $REPORT_FILE
        TESTS_FAILED=$((TESTS_FAILED + 1))
        if [[ "$test_name" == *"SQL"* ]] || [[ "$test_name" == *"XSS"* ]]; then
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        fi
    fi
    echo "" | tee -a $REPORT_FILE
}

echo "=== TEST 1: Valid Credentials - All 6 Roles ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

# Test all 6 roles with correct credentials
SUPER_ADMIN_TOKEN=$(test_auth "Super Admin - Valid Credentials" "admin@kiaan-wms.com" "Admin@123" "SUCCESS")
test_auth "Company Admin - Valid Credentials" "companyadmin@kiaan-wms.com" "Admin@123" "SUCCESS"
test_auth "Warehouse Manager - Valid Credentials" "manager@kiaan-wms.com" "Admin@123" "SUCCESS"
test_auth "Inventory Manager - Valid Credentials" "inventory@kiaan-wms.com" "Admin@123" "SUCCESS"
test_auth "Picker - Valid Credentials" "picker@kiaan-wms.com" "Admin@123" "SUCCESS"
test_auth "Viewer - Valid Credentials" "viewer@kiaan-wms.com" "Admin@123" "SUCCESS"

echo "=== TEST 2: Invalid Credentials ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_auth "Wrong Password" "admin@kiaan-wms.com" "WrongPassword123" "FAIL"
test_auth "Non-existent Email" "notexist@example.com" "Admin@123" "FAIL"
test_auth "Empty Email" "" "Admin@123" "FAIL"
test_auth "Empty Password" "admin@kiaan-wms.com" "" "FAIL"
test_auth "Both Fields Empty" "" "" "FAIL"

echo "=== TEST 3: Special Characters & Edge Cases ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_auth "Email with Spaces" "admin @kiaan-wms.com" "Admin@123" "FAIL"
test_auth "Password with Spaces Only" "admin@kiaan-wms.com" "   " "FAIL"
test_auth "Very Long Email (500 chars)" "$(printf 'a%.0s' {1..500})@test.com" "Admin@123" "FAIL"
test_auth "Very Long Password (500 chars)" "admin@kiaan-wms.com" "$(printf 'a%.0s' {1..500})" "FAIL"
test_auth "Unicode in Email" "admïn@kiaan-wms.com" "Admin@123" "FAIL"
test_auth "Emoji in Password" "admin@kiaan-wms.com" "Admin😀123" "FAIL"

echo "=== TEST 4: SQL Injection Attempts ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_auth "SQL Injection - OR 1=1" "admin@kiaan-wms.com' OR '1'='1" "anything" "FAIL"
test_auth "SQL Injection - DROP TABLE" "admin'; DROP TABLE users; --" "Admin@123" "FAIL"
test_auth "SQL Injection - UNION" "admin@kiaan-wms.com' UNION SELECT * FROM users--" "Admin@123" "FAIL"
test_auth "SQL Injection - Comment" "admin@kiaan-wms.com'--" "anything" "FAIL"

echo "=== TEST 5: XSS Attempts ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

test_auth "XSS - Script Tag" "<script>alert('XSS')</script>" "Admin@123" "FAIL"
test_auth "XSS - IMG Tag" "<img src=x onerror=alert('XSS')>" "Admin@123" "FAIL"
test_auth "XSS - JavaScript Protocol" "javascript:alert('XSS')" "Admin@123" "FAIL"

echo "=== TEST 6: Token & Session Testing ===" | tee -a $REPORT_FILE
echo "" >> $REPORT_FILE

if [ -n "$SUPER_ADMIN_TOKEN" ]; then
    echo "Testing: Valid Token Access to Protected Endpoint" | tee -a $REPORT_FILE
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
        "$BACKEND_URL/api/auth/me")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" == "200" ]; then
        echo "  ✓ PASS: Valid token accepted" | tee -a $REPORT_FILE
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo "  ✗ FAIL: Valid token rejected" | tee -a $REPORT_FILE
        TESTS_FAILED=$((TESTS_FAILED + 1))
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
    fi
    echo "" >> $REPORT_FILE
fi

echo "Testing: No Token Access to Protected Endpoint" | tee -a $REPORT_FILE
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/products")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
    echo "  ✓ PASS: Protected endpoint correctly rejects no token" | tee -a $REPORT_FILE
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ FAIL: Protected endpoint accessible without token!" | tee -a $REPORT_FILE
    echo "  CRITICAL SECURITY ISSUE!" | tee -a $REPORT_FILE
    TESTS_FAILED=$((TESTS_FAILED + 1))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi
echo "" >> $REPORT_FILE

echo "Testing: Invalid Token Access" | tee -a $REPORT_FILE
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer INVALID_TOKEN_12345" \
    "$BACKEND_URL/api/products")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
    echo "  ✓ PASS: Invalid token correctly rejected" | tee -a $REPORT_FILE
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ FAIL: Invalid token accepted!" | tee -a $REPORT_FILE
    TESTS_FAILED=$((TESTS_FAILED + 1))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi
echo "" >> $REPORT_FILE

echo "Testing: Malformed Token" | tee -a $REPORT_FILE
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer not.a.valid.jwt" \
    "$BACKEND_URL/api/products")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
    echo "  ✓ PASS: Malformed token correctly rejected" | tee -a $REPORT_FILE
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "  ✗ FAIL: Malformed token accepted!" | tee -a $REPORT_FILE
    TESTS_FAILED=$((TESTS_FAILED + 1))
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi
echo "" >> $REPORT_FILE

# Summary
echo "========================================" | tee -a $REPORT_FILE
echo "AUTHENTICATION TESTING SUMMARY" | tee -a $REPORT_FILE
echo "========================================" | tee -a $REPORT_FILE
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))" | tee -a $REPORT_FILE
echo "Passed: $TESTS_PASSED" | tee -a $REPORT_FILE
echo "Failed: $TESTS_FAILED" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Issues by Severity:" | tee -a $REPORT_FILE
echo "  Critical: $CRITICAL_ISSUES" | tee -a $REPORT_FILE
echo "  High: $HIGH_ISSUES" | tee -a $REPORT_FILE
echo "  Medium: $MEDIUM_ISSUES" | tee -a $REPORT_FILE
echo "  Low: $LOW_ISSUES" | tee -a $REPORT_FILE
echo "" | tee -a $REPORT_FILE
echo "Completed: $(date)" | tee -a $REPORT_FILE

# Export token for use in other tests
echo "$SUPER_ADMIN_TOKEN" > /root/kiaan-wms/testing/reports/auth_token.txt

echo ""
echo "Report saved to: $REPORT_FILE"
echo "Auth token saved to: /root/kiaan-wms/testing/reports/auth_token.txt"
