import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function createLabTechViaRegister() {
  try {
    console.log('👨‍🔬 Creating lab technician via registration...\n');
    
    // First try to register
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: 'labtech@hospital.com',
        password: 'LabTech@123',
        confirmPassword: 'LabTech@123',
        firstName: 'Lab',
        lastName: 'Technician',
        phone: '+1234567890'
      });
      
      console.log('✅ User registered successfully!');
      console.log('User ID:', registerResponse.data.user?.id);
      
      // Now update the role to lab_technician
      console.log('\n🔄 Updating role to lab_technician...');
      
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@hospital.com',
        password: 'Admin@2025'
      });
      
      const adminToken = loginResponse.data.accessToken;
      const userId = registerResponse.data.user.id;
      
      await axios.put(`${API_URL}/users/${userId}`, {
        role: 'lab_technician'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Role updated to lab_technician!');
      
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, updating role...');
        
        // Login as admin and find the user
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'admin@hospital.com',
          password: 'Admin@2025'
        });
        
        const adminToken = loginResponse.data.accessToken;
        
        // Get users and find lab tech
        const usersResponse = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params: { email: 'labtech@hospital.com' }
        });
        
        const users = usersResponse.data.data || [];
        const labTech = users.find((u: any) => u.email === 'labtech@hospital.com');
        
        if (labTech) {
          await axios.put(`${API_URL}/users/${labTech.id}`, {
            role: 'lab_technician',
            isActive: true
          }, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          console.log('✅ Role updated to lab_technician!');
        }
      } else {
        throw error;
      }
    }
    
    console.log('\n📋 Lab Technician Account:');
    console.log('   Email:    labtech@hospital.com');
    console.log('   Password: LabTech@123');
    console.log('   Role:     Lab Technician');
    console.log('\n🎉 Setup complete!');
    
    // Test login
    console.log('\n🔐 Testing login...');
    const testLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'labtech@hospital.com',
      password: 'LabTech@123'
    });
    
    console.log('✅ Login test successful!');
    console.log('Role:', testLogin.data.user?.role);
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createLabTechViaRegister();
