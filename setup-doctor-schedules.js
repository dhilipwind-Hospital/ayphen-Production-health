const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Doctor accounts to set up
const doctors = [
  {
    email: 'general-medicine.chief@example.com',
    password: 'doctor123',
    name: 'General Medicine Chief',
    schedules: [
      { dayOfWeek: 'monday', startTime: '08:00', endTime: '12:00', notes: 'Morning clinic' },
      { dayOfWeek: 'wednesday', startTime: '14:00', endTime: '18:00', notes: 'Afternoon clinic' },
      { dayOfWeek: 'friday', startTime: '09:00', endTime: '13:00', notes: 'General consultation' }
    ]
  },
  {
    email: 'cardiology.senior@example.com',
    password: 'doctor123',
    name: 'Cardiology Senior',
    schedules: [
      { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '12:00', notes: 'Cardiac consultation' },
      { dayOfWeek: 'thursday', startTime: '14:00', endTime: '17:00', notes: 'Follow-up clinic' }
    ]
  },
  {
    email: 'orthopedics.consultant@example.com',
    password: 'doctor123',
    name: 'Orthopedics Consultant',
    schedules: [
      { dayOfWeek: 'monday', startTime: '10:00', endTime: '14:00', notes: 'Orthopedic clinic' },
      { dayOfWeek: 'wednesday', startTime: '10:00', endTime: '14:00', notes: 'Joint consultation' },
      { dayOfWeek: 'friday', startTime: '15:00', endTime: '18:00', notes: 'Sports medicine' }
    ]
  },
  {
    email: 'pediatrics.chief@example.com',
    password: 'doctor123',
    name: 'Pediatrics Chief',
    schedules: [
      { dayOfWeek: 'monday', startTime: '08:00', endTime: '11:00', notes: 'Pediatric clinic' },
      { dayOfWeek: 'tuesday', startTime: '14:00', endTime: '17:00', notes: 'Child health' },
      { dayOfWeek: 'thursday', startTime: '09:00', endTime: '12:00', notes: 'Vaccination clinic' },
      { dayOfWeek: 'saturday', startTime: '09:00', endTime: '12:00', notes: 'Weekend clinic' }
    ]
  },
  {
    email: 'dermatology.consultant@example.com',
    password: 'doctor123',
    name: 'Dermatology Consultant',
    schedules: [
      { dayOfWeek: 'tuesday', startTime: '10:00', endTime: '13:00', notes: 'Skin consultation' },
      { dayOfWeek: 'thursday', startTime: '15:00', endTime: '18:00', notes: 'Cosmetic procedures' }
    ]
  }
];

async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    return response.data.accessToken;
  } catch (error) {
    console.error(`Failed to login as ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createAvailability(token, doctorId, schedule) {
  try {
    const response = await axios.post(
      `${API_BASE}/availability`,
      {
        doctorId,
        ...schedule
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    // Ignore duplicate errors
    if (error.response?.status === 409) {
      return { skipped: true, reason: 'Already exists' };
    }
    throw error;
  }
}

async function setupDoctorSchedules() {
  console.log('🏥 Setting Up Doctor Schedules');
  console.log('==============================\n');

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const doctor of doctors) {
    console.log(`📍 Setting up: ${doctor.name}`);
    console.log(`   Email: ${doctor.email}`);

    // Login
    const token = await login(doctor.email, doctor.password);
    if (!token) {
      console.log('   ❌ Login failed\n');
      totalErrors++;
      continue;
    }

    console.log('   ✅ Logged in');

    // Get doctor ID from token
    const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const doctorId = tokenPayload.userId;

    // Create schedules
    for (const schedule of doctor.schedules) {
      try {
        const result = await createAvailability(token, doctorId, schedule);
        
        if (result.skipped) {
          console.log(`   ⚠️  ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}: Already exists`);
          totalSkipped++;
        } else {
          console.log(`   ✅ ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}: Created`);
          totalCreated++;
        }
      } catch (error) {
        console.log(`   ❌ ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}: ${error.response?.data?.message || error.message}`);
        totalErrors++;
      }
    }

    console.log('');
  }

  console.log('📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Created: ${totalCreated} slots`);
  console.log(`⚠️  Skipped: ${totalSkipped} slots (already exist)`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('');

  if (totalCreated > 0) {
    console.log('🎉 Doctor schedules set up successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Doctors can now manage their schedules at /doctor/my-schedule');
    console.log('   2. Public can book appointments at /appointments/book');
    console.log('   3. Test the booking workflow with different dates');
  }
}

setupDoctorSchedules().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
