import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function createLabTech() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@hospital.com',
      password: 'Admin@2025'
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully\n');

    console.log('👨‍🔬 Creating lab technician account...');
    
    const labTechData = {
      email: 'labtech@hospital.com',
      password: 'LabTech@123',
      firstName: 'Lab',
      lastName: 'Technician',
      role: 'lab_technician',
      phone: '+1234567890',
      isActive: true,
      permissions: []
    };

    try {
      const response = await axios.post(`${API_URL}/users`, labTechData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Lab technician created successfully!');
      console.log('\n📋 Lab Technician Account:');
      console.log('   Email:    labtech@hospital.com');
      console.log('   Password: LabTech@123');
      console.log('   Role:     Lab Technician');
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Lab technician account already exists');
        console.log('\n📋 Lab Technician Account:');
        console.log('   Email:    labtech@hospital.com');
        console.log('   Password: LabTech@123');
        console.log('   Role:     Lab Technician');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Setup complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createLabTech();
