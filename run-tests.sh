#!/bin/bash

echo "🏥 Hospital Management System - Automated UI Testing"
echo "=================================================="

# Check if system is running
echo "📋 Checking system status..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend not running on localhost:3000"
    echo "Please run: docker-compose up -d"
    exit 1
fi

if ! curl -s http://localhost:5001/api/health > /dev/null; then
    echo "⚠️  Backend might not be running on localhost:5001"
    echo "Continuing with tests..."
fi

echo "✅ System appears to be running"

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
fi

# Install Playwright browsers if not present
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Run tests with different options based on argument
case "$1" in
    "headed")
        echo "🖥️  Running tests in headed mode..."
        npx playwright test --headed
        ;;
    "debug")
        echo "🐛 Running tests in debug mode..."
        npx playwright test --debug
        ;;
    "specific")
        if [ -z "$2" ]; then
            echo "❌ Please specify test file: ./run-tests.sh specific auth"
            exit 1
        fi
        echo "🎯 Running specific test: $2"
        npx playwright test tests/$2.spec.ts --headed
        ;;
    "report")
        echo "📊 Opening test report..."
        npx playwright show-report
        ;;
    *)
        echo "🚀 Running all tests in headless mode..."
        npx playwright test
        ;;
esac

# Generate and show report
echo ""
echo "📊 Test Results:"
echo "=================="

if [ -f "test-results.json" ]; then
    echo "✅ Tests completed. Results saved to test-results.json"
else
    echo "⚠️  No test results file found"
fi

echo ""
echo "💡 Usage options:"
echo "  ./run-tests.sh           - Run all tests (headless)"
echo "  ./run-tests.sh headed    - Run tests with browser visible"
echo "  ./run-tests.sh debug     - Run tests in debug mode"
echo "  ./run-tests.sh specific auth - Run specific test file"
echo "  ./run-tests.sh report    - Show test report"
echo ""
echo "📁 Test files available:"
echo "  - auth.spec.ts           - Authentication tests"
echo "  - doctor-workflow.spec.ts - Doctor workflow tests"
echo "  - pharmacy-workflow.spec.ts - Pharmacy workflow tests"
echo "  - patient-workflow.spec.ts - Patient workflow tests"
echo "  - end-to-end.spec.ts     - Complete workflow tests"
