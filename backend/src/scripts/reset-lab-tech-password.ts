import axios from 'axios';
import * as bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:5001/api';

async function resetLabTechPassword() {
  try {
    console.log('🔑 Resetting lab tech password...\n');
    
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
    
    console.log('📋 Found user:', labTech.email);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('LabTech@123', 10);
    console.log('🔐 Password hashed');
    
    // Update password
    console.log('\n🔄 Updating password...');
    await axios.put(`${API_URL}/users/${labTech.id}`, {
      password: hashedPassword,
      role: 'lab_technician',
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Password updated successfully!');
    
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

resetLabTechPassword();
