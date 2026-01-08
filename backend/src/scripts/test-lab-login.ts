import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function testLabLogin() {
  try {
    console.log('🔐 Testing lab tech login...');
    console.log('Email: labtech@hospital.com');
    console.log('Password: LabTech@123\n');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'labtech@hospital.com',
      password: 'LabTech@123'
    });

    console.log('✅ Login successful!');
    console.log('\nUser data:');
    console.log('- Email:', response.data.user?.email);
    console.log('- Role:', response.data.user?.role);
    console.log('- Name:', response.data.user?.firstName, response.data.user?.lastName);
    console.log('- Active:', response.data.user?.isActive);
    console.log('\nToken received:', !!response.data.accessToken);
    
  } catch (error: any) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLabLogin();
