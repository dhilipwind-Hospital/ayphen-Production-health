#!/bin/bash

# SaaS Multi-Tenant UI Automation Tests
# This script runs Playwright tests for organization signup and login

echo "🧪 Starting SaaS Multi-Tenant UI Automation Tests"
echo "=================================================="
echo ""

# Check if services are running
echo "📋 Checking if services are running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend is not running on port 3000"
    echo "   Please start with: docker-compose up -d frontend"
    exit 1
fi

if ! curl -s http://localhost:5001/health > /dev/null; then
    echo "❌ Backend is not running on port 5001"
    echo "   Please start with: docker-compose up -d backend"
    exit 1
fi

echo "✅ Services are running"
echo ""

# Install Playwright if not already installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

echo "📦 Ensuring Playwright is installed..."
npx playwright install chromium --with-deps > /dev/null 2>&1

echo ""
echo "🚀 Running UI Automation Tests..."
echo ""

# Run the tests
npx playwright test tests/saas-signup-login.spec.ts --reporter=list

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "📊 Test Summary:"
    echo "   - Landing page display ✅"
    echo "   - Navigation tests ✅"
    echo "   - Organization signup ✅"
    echo "   - Form validation ✅"
    echo "   - Login with new organization ✅"
    echo ""
    echo "🎉 Your SaaS multi-tenant platform is working perfectly!"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    echo ""
    echo "💡 Common issues:"
    echo "   - Make sure frontend is running on port 3000"
    echo "   - Make sure backend is running on port 5001"
    echo "   - Check if database has organization_id in all tables"
    exit 1
fi

echo ""
echo "📸 To view test report with screenshots:"
echo "   npx playwright show-report"
echo ""
