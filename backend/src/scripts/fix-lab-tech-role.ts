import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function fixLabTechRole() {
  try {
    console.log('🔧 Fixing lab tech role...\n');
    
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
    
    if (!labTech) {
      console.log('❌ Lab tech user not found');
      return;
    }
    
    console.log('📋 Found user:');
    console.log('- ID:', labTech.id);
    console.log('- Email:', labTech.email);
    console.log('- Current Role:', labTech.role);
    console.log('- Active:', labTech.isActive);
    
    // Update role
    console.log('\n🔄 Updating role to lab_technician...');
    await axios.put(`${API_URL}/users/${labTech.id}`, {
      role: 'lab_technician',
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Role updated successfully!');
    
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

fixLabTechRole();
