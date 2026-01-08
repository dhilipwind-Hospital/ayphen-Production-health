/**
 * Automated Inpatient Module Setup Test
 * 
 * This script tests the complete workflow:
 * 1. Creates departments (auto-created via fallback IDs)
 * 2. Creates wards
 * 3. Creates rooms
 * 4. Creates beds
 * 
 * Run: node test-inpatient-setup.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@hospital.com';
const ADMIN_PASSWORD = 'Admin@2025';

let authToken = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Step 1: Login as Admin
async function login() {
  logSection('STEP 1: Admin Login');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    authToken = response.data.token || response.data.accessToken;
    logSuccess(`Logged in as ${ADMIN_EMAIL}`);
    if (authToken) {
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
    }
    return !!authToken;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Step 2: Create Wards (with auto-created departments)
async function createWards() {
  logSection('STEP 2: Creating Wards');
  
  const wards = [
    {
      wardNumber: 'W-001',
      name: 'General Ward',
      departmentId: 'dept-1', // General Medicine (will be auto-created)
      capacity: 50,
      location: 'Building A, Floor 2',
      description: 'Main general medical ward'
    },
    {
      wardNumber: 'W-002',
      name: 'Cardiology Ward',
      departmentId: 'dept-2', // Cardiology (will be auto-created)
      capacity: 30,
      location: 'Building A, Floor 3',
      description: 'Specialized cardiology ward'
    },
    {
      wardNumber: 'W-003',
      name: 'Pediatric Ward',
      departmentId: 'dept-4', // Pediatrics (will be auto-created)
      capacity: 40,
      location: 'Building B, Floor 1',
      description: 'Children and pediatric care'
    },
    {
      wardNumber: 'W-004',
      name: 'ICU',
      departmentId: 'dept-13', // ICU (will be auto-created)
      capacity: 20,
      location: 'Building A, Floor 4',
      description: 'Intensive Care Unit'
    },
  ];

  const createdWards = [];

  for (const ward of wards) {
    try {
      logInfo(`Creating ward: ${ward.name} (${ward.wardNumber})`);
      
      const response = await axios.post(
        `${API_BASE}/inpatient/wards`,
        ward,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      createdWards.push(response.data.ward);
      logSuccess(`Ward created: ${ward.name} - Department auto-created!`);
      logInfo(`  Ward ID: ${response.data.ward.id}`);
      logInfo(`  Department: ${ward.departmentId} (auto-created)`);
      
    } catch (error) {
      logError(`Failed to create ward ${ward.name}: ${error.response?.data?.message || error.message}`);
    }
  }

  logInfo(`\nTotal wards created: ${createdWards.length}/${wards.length}`);
  return createdWards;
}

// Step 3: Create Rooms
async function createRooms(wards) {
  logSection('STEP 3: Creating Rooms');
  
  const roomTypes = ['general', 'semi_private', 'private', 'deluxe', 'icu'];
  const createdRooms = [];

  for (const ward of wards) {
    logInfo(`\nCreating rooms for ward: ${ward.name}`);
    
    // Create 5 rooms per ward
    for (let i = 1; i <= 5; i++) {
      const roomType = ward.name.includes('ICU') ? 'icu' : roomTypes[i - 1];
      const capacity = roomType === 'private' || roomType === 'deluxe' ? 1 : 
                      roomType === 'semi_private' ? 2 : 4;
      const dailyRate = roomType === 'deluxe' ? 8000 :
                       roomType === 'private' ? 5000 :
                       roomType === 'semi_private' ? 3000 :
                       roomType === 'icu' ? 10000 : 2000;

      const room = {
        roomNumber: `R-${ward.wardNumber.split('-')[1]}0${i}`,
        wardId: ward.id,
        roomType: roomType,
        capacity: capacity,
        dailyRate: dailyRate,
        features: roomType === 'deluxe' ? 'AC, TV, Sofa, Mini Fridge' :
                 roomType === 'private' ? 'AC, TV, Attached Bathroom' :
                 roomType === 'icu' ? 'Ventilator, Monitor, Emergency Equipment' :
                 'AC, Shared Bathroom'
      };

      try {
        const response = await axios.post(
          `${API_BASE}/inpatient/rooms`,
          room,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );

        createdRooms.push(response.data.room);
        logSuccess(`  Room ${room.roomNumber} created (${roomType}, ${capacity} beds, ₹${dailyRate}/day)`);
        
      } catch (error) {
        logError(`  Failed to create room ${room.roomNumber}: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  logInfo(`\nTotal rooms created: ${createdRooms.length}`);
  return createdRooms;
}

// Step 4: Create Beds
async function createBeds(rooms) {
  logSection('STEP 4: Creating Beds');
  
  const createdBeds = [];

  for (const room of rooms) {
    logInfo(`\nCreating beds for room: ${room.roomNumber} (Capacity: ${room.capacity})`);
    
    // Create beds based on room capacity
    const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    for (let i = 0; i < room.capacity; i++) {
      const bed = {
        bedNumber: `B-${room.roomNumber.split('-')[1]}-${bedLetters[i]}`,
        roomId: room.id,
        notes: `Bed ${bedLetters[i]} in ${room.roomType} room`
      };

      try {
        const response = await axios.post(
          `${API_BASE}/inpatient/beds`,
          bed,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );

        createdBeds.push(response.data.bed);
        logSuccess(`  Bed ${bed.bedNumber} created`);
        
      } catch (error) {
        logError(`  Failed to create bed ${bed.bedNumber}: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  logInfo(`\nTotal beds created: ${createdBeds.length}`);
  return createdBeds;
}

// Step 5: Verify Setup
async function verifySetup() {
  logSection('STEP 5: Verifying Setup');
  
  try {
    // Check wards
    const wardsResponse = await axios.get(
      `${API_BASE}/inpatient/wards`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logSuccess(`Wards in database: ${wardsResponse.data.wards.length}`);

    // Check rooms
    const roomsResponse = await axios.get(
      `${API_BASE}/inpatient/rooms`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logSuccess(`Rooms in database: ${roomsResponse.data.rooms.length}`);

    // Check beds
    const bedsResponse = await axios.get(
      `${API_BASE}/inpatient/beds`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logSuccess(`Beds in database: ${bedsResponse.data.beds.length}`);

    // Check departments (auto-created)
    const deptsResponse = await axios.get(
      `${API_BASE}/departments`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    const allDepts = deptsResponse.data.departments || deptsResponse.data || [];
    const autoDepts = allDepts.filter(d => 
      d.description && d.description.includes('Auto-created')
    );
    logSuccess(`Auto-created departments: ${autoDepts.length}`);
    autoDepts.forEach(dept => {
      logInfo(`  - ${dept.name}`);
    });

    return {
      wards: wardsResponse.data.wards.length,
      rooms: roomsResponse.data.rooms.length,
      beds: bedsResponse.data.beds.length,
      departments: autoDepts.length
    };
    
  } catch (error) {
    logError(`Verification failed: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Step 6: Display Summary
function displaySummary(stats) {
  logSection('SETUP COMPLETE - SUMMARY');
  
  console.log('\n📊 Database Statistics:');
  console.log('┌─────────────────────────┬──────────┐');
  console.log('│ Entity                  │ Count    │');
  console.log('├─────────────────────────┼──────────┤');
  console.log(`│ Departments (auto)      │ ${String(stats.departments).padStart(8)} │`);
  console.log(`│ Wards                   │ ${String(stats.wards).padStart(8)} │`);
  console.log(`│ Rooms                   │ ${String(stats.rooms).padStart(8)} │`);
  console.log(`│ Beds                    │ ${String(stats.beds).padStart(8)} │`);
  console.log('└─────────────────────────┴──────────┘');

  console.log('\n🎯 Next Steps:');
  logInfo('1. Open browser: http://localhost:3000/admin/inpatient/wards');
  logInfo('2. Login as admin@hospital.com / Admin@2025');
  logInfo('3. Navigate to:');
  logInfo('   - Inpatient - Wards (Admin) → See 4 wards');
  logInfo('   - Inpatient - Rooms (Admin) → See 20 rooms');
  logInfo('   - Inpatient - Beds → See all beds');
  logInfo('4. Try admitting a patient!');

  console.log('\n✅ Inpatient Module Setup Complete!\n');
}

// Main execution
async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     AUTOMATED INPATIENT MODULE SETUP TEST                 ║', 'cyan');
  log('║     Testing: Wards → Rooms → Beds Creation                ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      logError('Cannot proceed without authentication');
      process.exit(1);
    }

    // Wait a bit for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Create Wards
    const wards = await createWards();
    if (wards.length === 0) {
      logError('No wards created. Check backend logs.');
      process.exit(1);
    }

    // Wait a bit between steps
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 3: Create Rooms
    const rooms = await createRooms(wards);
    if (rooms.length === 0) {
      logError('No rooms created. Check backend logs.');
      process.exit(1);
    }

    // Wait a bit between steps
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4: Create Beds
    const beds = await createBeds(rooms);
    if (beds.length === 0) {
      logError('No beds created. Check backend logs.');
      process.exit(1);
    }

    // Wait a bit before verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Verify
    const stats = await verifySetup();
    if (!stats) {
      logError('Verification failed');
      process.exit(1);
    }

    // Step 6: Summary
    displaySummary(stats);

  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main();
