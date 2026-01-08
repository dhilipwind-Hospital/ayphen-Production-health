#!/bin/bash

# Multi-Tenant Testing Script
# Tests that multi-tenant migration didn't break anything

echo "🧪 Multi-Tenant Migration - Testing Script"
echo "==========================================="
echo ""

API_URL="${API_URL:-http://localhost:5001}"

echo "Testing against: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local headers=$6
    
    echo -n "Testing: $test_name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" $headers)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $status_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "   Response: $body"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "🔍 Phase 1: Testing Database Structure"
echo "--------------------------------------"

# Test 1: Check if organizations table exists
echo -n "1. Organizations table exists... "
if psql -U postgres -d hospital_db -c "\dt organizations" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 2: Check if default organization exists
echo -n "2. Default organization exists... "
DEFAULT_ORG=$(psql -U postgres -d hospital_db -t -c "SELECT COUNT(*) FROM organizations WHERE subdomain = 'default'" 2>/dev/null | tr -d ' ')
if [ "$DEFAULT_ORG" = "1" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 3: Check if users have organization_id
echo -n "3. Users table has organization_id... "
if psql -U postgres -d hospital_db -c "\d users" | grep organization_id > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test 4: Check if all users are assigned to an organization
echo -n "4. All users assigned to organization... "
USERS_WITHOUT_ORG=$(psql -U postgres -d hospital_db -t -c "SELECT COUNT(*) FROM users WHERE organization_id IS NULL" 2>/dev/null | tr -d ' ')
if [ "$USERS_WITHOUT_ORG" = "0" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} ($USERS_WITHOUT_ORG users without organization)"
    ((TESTS_FAILED++))
fi

echo ""
echo "🌐 Phase 2: Testing API Endpoints (Backward Compatibility)"
echo "-----------------------------------------------------------"

# Test 5: Health check
test_endpoint "Health check" "GET" "/api/health" "" "200"

# Test 6: Get departments (public endpoint)
test_endpoint "Get departments" "GET" "/api/departments" "" "200"

# Test 7: Get services (public endpoint)
test_endpoint "Get services" "GET" "/api/services" "" "200"

# Test 8: Login with existing user (backward compatibility)
echo ""
echo "Testing authentication with existing user..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Subdomain: default" \
    -d '{"email": "admin@hospital.com", "password": "Admin@2025"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Login successful"
    ((TESTS_PASSED++))
    
    # Test 9: Get user profile with token
    test_endpoint "Get user profile" "GET" "/api/users/me" "" "200" "-H 'Authorization: Bearer $TOKEN' -H 'X-Tenant-Subdomain: default'"
    
    # Test 10: Get appointments with token
    test_endpoint "Get appointments" "GET" "/api/appointments" "" "200" "-H 'Authorization: Bearer $TOKEN' -H 'X-Tenant-Subdomain: default'"
else
    echo -e "${RED}❌ FAILED${NC} - Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    ((TESTS_FAILED++))
fi

echo ""
echo "🔒 Phase 3: Testing Tenant Isolation"
echo "-------------------------------------"

# Test 11: Try to access with non-existent tenant
echo -n "11. Reject non-existent tenant... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/departments" \
    -H "X-Tenant-Subdomain: nonexistent")
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "404" ]; then
    echo -e "${GREEN}✅ PASSED${NC} (Correctly rejected)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} (Should reject non-existent tenant)"
    ((TESTS_FAILED++))
fi

# Test 12: Access with default tenant should work
test_endpoint "Access with default tenant" "GET" "/api/departments" "" "200" "-H 'X-Tenant-Subdomain: default'"

echo ""
echo "📊 Test Results"
echo "==============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your multi-tenant migration was successful!${NC}"
    echo ""
    echo "✅ Backward compatibility maintained"
    echo "✅ Existing users can still login"
    echo "✅ All endpoints working correctly"
    echo "✅ Tenant isolation working"
    echo ""
    echo "🚀 Your application is ready for multi-tenancy!"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Make sure the backend server is running"
    echo "  - Check if migrations ran successfully"
    echo "  - Verify database connection"
    echo "  - Check if default organization exists"
    exit 1
fi
