# Multi-Tenancy Isolation E2E Tests

## Overview

This test suite verifies that the hospital management system properly isolates data between organizations (multi-tenancy).

## Test: New Organization Data Isolation

**File:** `new-organization-isolation.spec.ts`

### What It Tests

1. ✅ **Organization Creation** - New organization can be created successfully
2. ✅ **Clean Portfolio** - New organization starts with ZERO data
3. ✅ **No Data Inheritance** - No data is inherited from other organizations
4. ✅ **Organization Name Display** - Correct organization name is shown
5. ✅ **Dashboard Zeros** - Dashboard shows 0 counts for all stats
6. ✅ **Empty Patients** - Patients page shows 0 patients
7. ✅ **Empty Departments** - Departments page shows 0 departments
8. ✅ **Empty Services** - Services page shows 0 services
9. ✅ **Empty Appointments** - Appointments page shows 0 appointments
10. ✅ **Data Preservation** - Old organization data is not affected

## Prerequisites

Before running the tests:

1. **Backend must be running:**
   ```bash
   cd backend
   docker-compose up
   # OR
   npm run dev
   ```

2. **Frontend must be running:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Services should be accessible:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api

## Running the Tests

### Option 1: Quick Run (Recommended)

```bash
# From the project root
./run-isolation-test.sh
```

This script will:
- Check if services are running
- Install Playwright if needed
- Run the test in headed mode (you can see the browser)
- Generate a report

### Option 2: Manual Run

```bash
# Install Playwright (first time only)
npm install -D @playwright/test
npx playwright install

# Run the test
npx playwright test tests/e2e/new-organization-isolation.spec.ts

# Run with UI (see the browser)
npx playwright test tests/e2e/new-organization-isolation.spec.ts --headed

# Run in debug mode
npx playwright test tests/e2e/new-organization-isolation.spec.ts --debug

# Run specific browser
npx playwright test tests/e2e/new-organization-isolation.spec.ts --project=chromium
```

### Option 3: Run All E2E Tests

```bash
npx playwright test tests/e2e/
```

## Test Output

### Success Output

```
🧪 Starting new organization isolation test...
📍 Step 1: Navigating to signup page...
📍 Step 2: Filling organization details...
📍 Step 3: Submitting organization creation form...
📍 Step 4: Logging out...
📍 Step 5: Logging in with new organization credentials...
📍 Step 6: Verifying organization name...
✅ Organization name displayed correctly
📍 Step 7: Verifying dashboard shows 0 counts...
✅ Dashboard shows 4 zero counts
📍 Step 8: Checking Patients page...
✅ Patients page is empty (0 patients)
📍 Step 9: Checking Departments page...
✅ Departments page is empty (0 departments)
📍 Step 10: Checking Services page...
✅ Services page is empty (0 services)
📍 Step 11: Checking Appointments page...
✅ Appointments page is empty (0 appointments)

🎉 TEST PASSED: New organization has clean portfolio!
✅ Organization created successfully
✅ Organization name displayed correctly
✅ Dashboard shows 0 counts
✅ Patients: 0 (no inherited data)
✅ Departments: 0 (no inherited data)
✅ Services: 0 (no inherited data)
✅ Appointments: 0 (no inherited data)
✅ Multi-tenancy isolation working correctly
```

### Failure Output

If the test finds inherited data:

```
❌ FAIL: Found patient data in new organization!
   Patient count: 8
   - Patient 1: dhilip demo
   - Patient 2: Hospital User
   - Patient 3: ...
```

## Viewing Test Reports

### HTML Report

```bash
npx playwright show-report
```

This opens an interactive HTML report showing:
- Test results
- Screenshots (on failure)
- Videos (on failure)
- Step-by-step execution trace

### JSON Report

```bash
cat test-results.json
```

## Test Configuration

The test is configured in `playwright.config.ts`:

- **Base URL:** http://localhost:3000
- **Timeout:** 120 seconds (2 minutes)
- **Retries:** 0 (no retries in dev, 2 in CI)
- **Screenshots:** Only on failure
- **Videos:** Retained on failure
- **Browsers:** Chromium, Firefox, WebKit

## Troubleshooting

### Test Fails: "Frontend is not running"

**Solution:** Start the frontend:
```bash
cd frontend
npm run dev
```

### Test Fails: "Organization not found"

**Possible causes:**
1. Backend is not running
2. Database is not initialized
3. Organization creation API is failing

**Solution:**
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Test Fails: "Found patient data in new organization"

This means the multi-tenancy isolation is NOT working correctly.

**Check:**
1. Are database queries filtering by `organization_id`?
2. Is the tenant middleware working?
3. Are new records being created with `organization_id`?

**Debug:**
```bash
# Check backend logs for tenant middleware
docker-compose logs backend | grep "Tenant Middleware"

# Check database
docker-compose exec postgres psql -U postgres -d hospital_db
SELECT id, email, organization_id FROM users WHERE role = 'patient';
```

### Test Times Out

**Solution:**
- Increase timeout in the test file
- Check if pages are loading slowly
- Check network tab in browser (run with `--headed`)

## CI/CD Integration

To run in CI/CD:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: docker-compose up -d
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. **Run tests in isolation** - Each test should be independent
2. **Use unique identifiers** - Test uses timestamps to avoid conflicts
3. **Clean up after tests** - Tests should not leave test data
4. **Check multiple pages** - Verify isolation across all pages
5. **Test both new and old** - Verify old data is preserved

## What Gets Tested

### ✅ Tested
- Organization creation
- Login flow
- Dashboard display
- Patients list
- Departments list
- Services list
- Appointments list
- Organization name display
- Zero counts verification

### ❌ Not Tested (Future)
- Staff management
- Pharmacy inventory
- Laboratory tests
- Billing data
- Medical records
- Settings pages

## Extending the Tests

To add more checks:

```typescript
// Check Staff page
await page.click('a:has-text("Staff")');
await page.waitForLoadState('networkidle');
const staffCount = await page.locator('table tbody tr').count();
expect(staffCount).toBe(0);
```

## Support

If tests fail consistently:
1. Check backend logs
2. Check database state
3. Verify all controllers have organization_id filtering
4. Review tenant middleware logic
5. Check JWT token includes organization_id

## Summary

This test ensures that:
- ✅ New organizations start with a clean slate
- ✅ No data leaks between organizations
- ✅ Multi-tenancy isolation is working correctly
- ✅ Old organization data is preserved
- ✅ System is production-ready for multi-tenant use
