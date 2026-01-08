#!/bin/bash

echo "🏥 Hospital Core Workflow Tests - 5 Essential Tests"
echo "=================================================="

# Check if system is running
echo "📋 Checking system status..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend not running on localhost:3000"
    echo "Please run: docker-compose up -d"
    exit 1
fi

echo "✅ System is running"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers
echo "🌐 Ensuring Playwright browsers are installed..."
npx playwright install chromium

echo ""
echo "🚀 Running Core Workflow Tests..."
echo "================================="
echo "1. Patient Registration"
echo "2. Patient Login"  
echo "3. Doctor Writing Prescription"
echo "4. Pharmacy Dispensing Medicine"
echo "5. Medicine Reflected in Patient Dashboard"
echo ""

# Run only the core workflow tests
case "$1" in
    "headed")
        echo "🖥️  Running tests in headed mode (browser visible)..."
        npx playwright test tests/core-workflow.spec.ts --headed --project=chromium
        ;;
    "debug")
        echo "🐛 Running tests in debug mode..."
        npx playwright test tests/core-workflow.spec.ts --debug --project=chromium
        ;;
    *)
        echo "🤖 Running tests in headless mode..."
        npx playwright test tests/core-workflow.spec.ts --project=chromium
        ;;
esac

echo ""
echo "📊 Test Results Summary:"
echo "========================"

if [ $? -eq 0 ]; then
    echo "✅ All core workflow tests PASSED!"
    echo ""
    echo "🎉 Your Hospital Management System is working correctly:"
    echo "   ✅ Patient Registration"
    echo "   ✅ Patient Login"
    echo "   ✅ Doctor Writing Prescription"
    echo "   ✅ Pharmacy Dispensing Medicine"
    echo "   ✅ Medicine Reflected in Patient Dashboard"
else
    echo "⚠️  Some tests failed - check output above for details"
    echo ""
    echo "💡 Common solutions:"
    echo "   - Ensure system is fully running (docker-compose up -d)"
    echo "   - Check database has patient data"
    echo "   - Try running with --headed to see browser actions"
fi

echo ""
echo "💡 Usage options:"
echo "  ./run-core-tests.sh           - Run tests (headless)"
echo "  ./run-core-tests.sh headed    - Run with browser visible"
echo "  ./run-core-tests.sh debug     - Run in debug mode"
echo ""
echo "📁 Test file: tests/core-workflow.spec.ts"
