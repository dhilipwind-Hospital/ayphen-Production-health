import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function completeLabOrder() {
  try {
    const orderNumber = process.argv[2];
    
    if (!orderNumber) {
      console.log('Usage: npx ts-node src/scripts/complete-lab-order.ts LAB-2025-0001');
      return;
    }

    console.log(`🔄 Completing order ${orderNumber}...\n`);
    
    // Login as lab tech
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'labtech@hospital.com',
      password: 'LabTech@123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in as lab tech\n');
    
    // Get all orders
    const ordersResponse = await axios.get(`${API_URL}/lab/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const order = ordersResponse.data.orders.find((o: any) => o.orderNumber === orderNumber);
    
    if (!order) {
      console.log(`❌ Order ${orderNumber} not found`);
      return;
    }
    
    console.log(`📋 Found order: ${order.orderNumber}`);
    console.log(`Current status: ${order.status}`);
    console.log(`Patient: ${order.patient.firstName} ${order.patient.lastName}`);
    console.log(`Tests: ${order.items.length}\n`);
    
    // Update status to completed
    await axios.put(`${API_URL}/lab/orders/${order.id}/status`, {
      status: 'completed'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Order marked as completed!');
    console.log('\n🎉 Patient can now view results!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

completeLabOrder();
