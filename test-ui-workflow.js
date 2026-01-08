// UI Testing Script - Run this in browser console
// This script will help verify the complete workflow

console.log('🏥 Hospital Management System - UI Test Script');
console.log('===============================================');

// Test 1: Check if we're on the correct page
function checkCurrentPage() {
  const url = window.location.href;
  const title = document.title;
  console.log(`📍 Current URL: ${url}`);
  console.log(`📄 Page Title: ${title}`);
  return { url, title };
}

// Test 2: Check login form
function testLoginForm() {
  console.log('\n🔐 Testing Login Form...');
  const emailInput = document.querySelector('input[type="email"], input[name="email"]');
  const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
  const loginButton = document.querySelector('button[type="submit"], button:contains("Login")');
  
  console.log(`✅ Email input found: ${!!emailInput}`);
  console.log(`✅ Password input found: ${!!passwordInput}`);
  console.log(`✅ Login button found: ${!!loginButton}`);
  
  return { emailInput: !!emailInput, passwordInput: !!passwordInput, loginButton: !!loginButton };
}

// Test 3: Check appointments table
function testAppointmentsTable() {
  console.log('\n📅 Testing Appointments Table...');
  const table = document.querySelector('table');
  const rows = document.querySelectorAll('tr');
  const writePrescriptionButtons = document.querySelectorAll('button:contains("Write Prescription"), a:contains("Write Prescription")');
  
  console.log(`✅ Table found: ${!!table}`);
  console.log(`✅ Table rows: ${rows.length}`);
  console.log(`✅ Write Prescription buttons: ${writePrescriptionButtons.length}`);
  
  // Check for patient names
  const patientNames = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    cells.forEach(cell => {
      if (cell.textContent.includes('raja') || cell.textContent.includes('arun')) {
        patientNames.push(cell.textContent.trim());
      }
    });
  });
  
  console.log(`✅ Patient names found: ${patientNames.join(', ')}`);
  return { table: !!table, rows: rows.length, buttons: writePrescriptionButtons.length, patients: patientNames };
}

// Test 4: Check prescription form
function testPrescriptionForm() {
  console.log('\n💊 Testing Prescription Form...');
  const patientNameDisplay = document.querySelector('h2, h3, .patient-name, [class*="patient"]');
  const diagnosisInput = document.querySelector('textarea[name="diagnosis"], input[name="diagnosis"]');
  const medicineSection = document.querySelector('[class*="medicine"], .medicines');
  const saveButton = document.querySelector('button:contains("Save"), button[type="submit"]');
  
  console.log(`✅ Patient name display found: ${!!patientNameDisplay}`);
  if (patientNameDisplay) {
    console.log(`📝 Patient name text: "${patientNameDisplay.textContent}"`);
  }
  console.log(`✅ Diagnosis input found: ${!!diagnosisInput}`);
  console.log(`✅ Medicine section found: ${!!medicineSection}`);
  console.log(`✅ Save button found: ${!!saveButton}`);
  
  return { 
    patientDisplay: !!patientNameDisplay, 
    patientText: patientNameDisplay?.textContent || 'Not found',
    diagnosisInput: !!diagnosisInput,
    medicineSection: !!medicineSection,
    saveButton: !!saveButton
  };
}

// Test 5: Check pharmacy dashboard
function testPharmacyDashboard() {
  console.log('\n🏪 Testing Pharmacy Dashboard...');
  const prescriptionsTab = document.querySelector('[data-node-key="prescriptions"], .ant-tabs-tab:contains("Prescriptions")');
  const prescriptionTable = document.querySelector('table');
  const dispenseButtons = document.querySelectorAll('button:contains("Dispense")');
  
  console.log(`✅ Prescriptions tab found: ${!!prescriptionsTab}`);
  console.log(`✅ Prescription table found: ${!!prescriptionTable}`);
  console.log(`✅ Dispense buttons: ${dispenseButtons.length}`);
  
  return { 
    prescriptionsTab: !!prescriptionsTab,
    prescriptionTable: !!prescriptionTable,
    dispenseButtons: dispenseButtons.length
  };
}

// Test 6: Check patient portal
function testPatientPortal() {
  console.log('\n👤 Testing Patient Portal...');
  const medicalRecordsLink = document.querySelector('a:contains("Medical Records"), [href*="records"]');
  const recordsTable = document.querySelector('table');
  const prescriptionRecords = document.querySelectorAll('tr:contains("Prescription"), .prescription');
  
  console.log(`✅ Medical Records link found: ${!!medicalRecordsLink}`);
  console.log(`✅ Records table found: ${!!recordsTable}`);
  console.log(`✅ Prescription records: ${prescriptionRecords.length}`);
  
  return {
    medicalRecordsLink: !!medicalRecordsLink,
    recordsTable: !!recordsTable,
    prescriptionRecords: prescriptionRecords.length
  };
}

// Main test runner
function runAllTests() {
  console.log('🚀 Starting UI Tests...\n');
  
  const results = {
    page: checkCurrentPage(),
    login: testLoginForm(),
    appointments: testAppointmentsTable(),
    prescription: testPrescriptionForm(),
    pharmacy: testPharmacyDashboard(),
    patient: testPatientPortal()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.hospitalTests = {
  runAllTests,
  checkCurrentPage,
  testLoginForm,
  testAppointmentsTable,
  testPrescriptionForm,
  testPharmacyDashboard,
  testPatientPortal
};

console.log('\n💡 Usage: You can run individual tests by calling:');
console.log('   hospitalTests.testLoginForm()');
console.log('   hospitalTests.testAppointmentsTable()');
console.log('   hospitalTests.testPrescriptionForm()');
console.log('   etc...');
