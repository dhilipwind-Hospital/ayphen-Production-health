#!/bin/bash

echo "🧪 Hospital Multi-Tenancy Isolation Test"
echo "========================================"
echo ""

# Check if services are running
echo "📍 Checking if services are running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend is not running on localhost:3000"
    echo "   Please start the frontend first: npm run dev"
    exit 1
fi

if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "⚠️  Backend health check failed, but continuing..."
fi

echo "✅ Services are running"
echo ""

# Install Playwright if needed
echo "📍 Checking Playwright installation..."
if ! npx playwright --version > /dev/null 2>&1; then
    echo "📦 Installing Playwright..."
    npm install -D @playwright/test
    npx playwright install
fi

echo "✅ Playwright is ready"
echo ""

# Run the test
echo "🚀 Running multi-tenancy isolation test..."
echo ""

npx playwright test tests/e2e/new-organization-isolation.spec.ts --headed --project=chromium

echo ""
echo "📊 Test Results:"
echo "   - Check the console output above"
echo "   - HTML report: npx playwright show-report"
echo "   - Screenshots: test-results/ folder (if any failures)"
