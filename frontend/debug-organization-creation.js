// Debug script to test organization creation
const axios = require('axios');

async function testOrganizationCreation() {
  console.log('🔍 Testing Organization Creation API...');
  
  const testData = {
    name: "Debug Organization Test",
    subdomain: "debug-org-test",
    description: "Testing organization creation from debug script",
    adminEmail: "debug@orgtest.com",
    adminPassword: "DebugTest123!",
    adminFirstName: "Debug",
    adminLastName: "Admin",
    plan: "professional"
  };
  
  try {
    console.log('📤 Sending request with data:', {
      ...testData,
      adminPassword: '***'
    });
    
    const response = await axios.post('http://localhost:3000/api/organizations', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Response:', response.data);
    console.log('📊 Status Code:', response.status);
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Full Error:', error.response?.data);
  }
}

// Test with missing fields
async function testMissingFields() {
  console.log('\n🔍 Testing with missing required fields...');
  
  const incompleteData = {
    name: "Incomplete Test",
    // Missing subdomain, adminEmail, adminPassword
  };
  
  try {
    const response = await axios.post('http://localhost:3000/api/organizations', incompleteData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Unexpected success:', response.data);
    
  } catch (error) {
    console.log('❌ Expected error for missing fields:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
}

// Test with invalid subdomain
async function testInvalidSubdomain() {
  console.log('\n🔍 Testing with invalid subdomain...');
  
  const invalidData = {
    name: "Invalid Subdomain Test",
    subdomain: "Invalid Subdomain!@#",
    adminEmail: "invalid@test.com",
    adminPassword: "Test123!",
    adminFirstName: "Invalid",
    adminLastName: "Test"
  };
  
  try {
    const response = await axios.post('http://localhost:3000/api/organizations', invalidData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Unexpected success:', response.data);
    
  } catch (error) {
    console.log('❌ Expected error for invalid subdomain:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
  }
}

// Run all tests
async function runAllTests() {
  await testOrganizationCreation();
  await testMissingFields();
  await testInvalidSubdomain();
}

runAllTests();
