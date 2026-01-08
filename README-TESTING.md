# 🧪 Automated UI Testing for Hospital Management System

## Overview
This testing suite provides comprehensive automated UI testing using Playwright for the complete hospital management workflow.

## Prerequisites
- System running: `docker-compose up -d`
- Node.js installed
- Frontend accessible at `http://localhost:3000`
- Backend accessible at `http://localhost:5001`

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Run Tests
```bash
# Run all tests (headless)
./run-tests.sh

# Run tests with browser visible
./run-tests.sh headed

# Run specific test suite
./run-tests.sh specific auth
./run-tests.sh specific doctor-workflow
./run-tests.sh specific pharmacy-workflow
./run-tests.sh specific patient-workflow
./run-tests.sh specific end-to-end

# Debug mode (step through tests)
./run-tests.sh debug

# View test report
./run-tests.sh report
```

## Test Suites

### 🔐 Authentication Tests (`auth.spec.ts`)
- Doctor login and redirect
- Patient login and redirect  
- Pharmacist login and redirect
- Admin login and redirect
- Invalid login error handling

### 👨‍⚕️ Doctor Workflow Tests (`doctor-workflow.spec.ts`)
- View appointments with real patient data
- Write prescription with correct patient names
- Add medicines to prescriptions
- View patient records
- Navigation between doctor sections

### 🏪 Pharmacy Workflow Tests (`pharmacy-workflow.spec.ts`)
- View pharmacy dashboard
- View medicine inventory
- View prescriptions from doctors
- Dispense prescription workflow
- Filter prescriptions by status
- Search prescriptions

### 👤 Patient Workflow Tests (`patient-workflow.spec.ts`)
- View patient portal dashboard
- View medical records
- View prescription details
- Filter and search medical records
- View appointment history
- Update patient profile
- Book new appointments

### 🔄 End-to-End Tests (`end-to-end.spec.ts`)
- Complete prescription workflow: Doctor → Pharmacy → Patient
- Patient registration and appointment booking
- Admin dashboard overview
- System health check

## Test Results

### HTML Report
After running tests, view the detailed HTML report:
```bash
npx playwright show-report
```

### JSON Results
Test results are saved to `test-results.json` for CI/CD integration.

### Screenshots & Videos
- Screenshots captured on test failures
- Videos recorded for failed tests
- Traces available for debugging

## Key Test Scenarios

### ✅ Critical Path Testing
1. **Doctor Login** → **View Appointments** → **Write Prescription**
2. **Pharmacist Login** → **View Prescriptions** → **Dispense Medicine**
3. **Patient Login** → **View Medical Records** → **See Prescription History**

### ✅ Data Validation Testing
- Correct patient names displayed (not "Patient Unknown")
- Real appointment data from database
- Medicine inventory integration
- Prescription status updates

### ✅ User Role Testing
- Doctor role permissions and redirects
- Patient role portal access
- Pharmacist role prescription management
- Admin role system oversight

## Test Configuration

### Browser Support
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

### Test Settings
- Parallel execution for speed
- Automatic retries on CI
- Screenshot/video on failure
- Network request tracing

## Debugging Tests

### Debug Mode
```bash
./run-tests.sh debug
```
This opens Playwright Inspector for step-by-step debugging.

### Console Logs
Tests include console.log statements for tracking progress:
```
Step 1: Doctor login and create prescription
Step 2: Pharmacist login and dispense prescription  
Step 3: Patient login and view medical records
✅ End-to-end workflow completed successfully!
```

### Common Issues & Solutions

#### Issue: Tests fail with "Element not found"
- **Solution:** Check if UI elements have correct selectors
- **Debug:** Use `page.locator().highlight()` to verify elements

#### Issue: Login redirects incorrectly
- **Solution:** Verify user roles in database
- **Debug:** Check network tab for API responses

#### Issue: Patient names show as "Unknown"
- **Solution:** Verify patient data seeded correctly
- **Debug:** Check database has real patient records

#### Issue: Prescriptions not appearing in pharmacy
- **Solution:** Ensure doctor created prescriptions successfully
- **Debug:** Check prescription API endpoints

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run UI Tests
  run: |
    docker-compose up -d
    npm install
    npx playwright install
    npx playwright test
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Test Reports
- HTML report with screenshots
- JUnit XML for CI integration
- JSON results for custom processing

## Performance Testing

Tests include performance checks:
- Page load times under 3 seconds
- API response times under 1 second
- No memory leaks during navigation
- Mobile responsive design validation

## Test Data

### Test Accounts Used
- **Doctor:** `cardiology.consultant@example.com` / `doctor123`
- **Patient:** `raja.patient@example.com` / `Patient@123`
- **Pharmacist:** `pharmacist@example.com` / `Pharmacist@123`
- **Admin:** `admin@hospital.com` / `Admin@2025`

### Test Scenarios
- Real patient data: raja patient, arun bharati
- Real appointments with ECG services
- Real medicine inventory from pharmacy
- Complete prescription workflow

## Maintenance

### Updating Tests
1. Modify test files in `tests/` directory
2. Update selectors if UI changes
3. Add new test scenarios as features are added
4. Keep test data synchronized with database

### Best Practices
- Use data-testid attributes for stable selectors
- Keep tests independent and isolated
- Use page object model for complex workflows
- Regular test maintenance and updates

---

**🎯 This testing suite ensures the Hospital Management System works correctly across all user roles and workflows!**
