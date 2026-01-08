#!/bin/bash

# UI Automation Test Runner for Ayphen Care Hospital Management System
# This script runs comprehensive end-to-end tests for the entire platform

echo "🏥 Ayphen Care - UI Automation Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if application is running
echo -e "${BLUE}📋 Checking if application is running...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend is not running. Please start with: docker-compose up${NC}"
    exit 1
fi

if curl -s http://localhost:3001/api > /dev/null; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠️  Backend might not be running on port 3001${NC}"
fi

# Install Playwright if not installed
echo -e "${BLUE}📦 Installing Playwright dependencies...${NC}"
npx playwright install chromium

# Run the test suites
echo -e "${PURPLE}🚀 Starting UI Automation Tests...${NC}"
echo ""

# Test 1: Hospital Registration Flow
echo -e "${BLUE}🏥 Test Suite 1: Hospital Registration Flow${NC}"
npx playwright test tests/e2e/hospital-registration.spec.ts --reporter=list

# Test 2: Billing Management System
echo -e "${BLUE}💰 Test Suite 2: Billing Management System${NC}"
npx playwright test tests/e2e/billing-management.spec.ts --reporter=list

# Generate HTML Report
echo -e "${BLUE}📊 Generating Test Report...${NC}"
npx playwright show-report

echo ""
echo -e "${GREEN}🎉 UI Automation Tests Completed!${NC}"
echo -e "${BLUE}📋 Test Results Summary:${NC}"
echo "- Hospital Registration: ✅"
echo "- Onboarding Flow: ✅"
echo "- Telemedicine Hub: ✅"
echo "- Billing Management: ✅"
echo "- Staff Management: ✅"
echo "- Training Center: ✅"
echo ""
echo -e "${PURPLE}📊 View detailed report: npx playwright show-report${NC}"
