import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function recreateLabTech() {
  try {
    console.log('🔄 Recreating lab tech account...\n');
    
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@hospital.com',
      password: 'Admin@2025'
    });
    
    const adminToken = loginResponse.data.accessToken;
    console.log('✅ Logged in as admin\n');
    
    // Get all users
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { limit: 100 }
    });
    
    const users = usersResponse.data.data || [];
    const labTech = users.find((u: any) => u.email === 'labtech@hospital.com');
    
    if (labTech) {
      console.log('🗑️  Deleting existing user...');
      await axios.delete(`${API_URL}/users/${labTech.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ User deleted\n');
    }
    
    // Create new user
    console.log('👨‍🔬 Creating new lab tech account...');
    const createResponse = await axios.post(`${API_URL}/users`, {
      email: 'labtech@hospital.com',
      password: 'LabTech@123',
      firstName: 'Lab',
      lastName: 'Technician',
      role: 'lab_technician',
      phone: '+1234567890',
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ User created successfully!');
    console.log('User ID:', createResponse.data.id);
    
    // Test login
    console.log('\n🔐 Testing login...');
    const testLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'labtech@hospital.com',
      password: 'LabTech@123'
    });
    
    console.log('✅ Login successful!');
    console.log('- Role:', testLogin.data.user?.role);
    console.log('- Name:', testLogin.data.user?.firstName, testLogin.data.user?.lastName);
    
    console.log('\n🎉 Lab tech account is ready!');
    console.log('\n📋 Login credentials:');
    console.log('   Email:    labtech@hospital.com');
    console.log('   Password: LabTech@123');
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

recreateLabTech();
