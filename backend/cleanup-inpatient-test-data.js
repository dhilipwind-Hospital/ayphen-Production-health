/**
 * Cleanup Inpatient Test Data
 * 
 * This script deletes all test data created during automated testing:
 * - Beds
 * - Rooms
 * - Wards
 * - Auto-created departments
 * 
 * Run: node cleanup-inpatient-test-data.js
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
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
    return !!authToken;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Step 2: Get all entities
async function getAllEntities() {
  logSection('STEP 2: Fetching All Entities');
  
  try {
    const [bedsRes, roomsRes, wardsRes, deptsRes] = await Promise.all([
      axios.get(`${API_BASE}/inpatient/beds`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_BASE}/inpatient/rooms`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_BASE}/inpatient/wards`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_BASE}/departments`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    ]);

    const beds = bedsRes.data.beds || [];
    const rooms = roomsRes.data.rooms || [];
    const wards = wardsRes.data.wards || [];
    const allDepts = Array.isArray(deptsRes.data.departments) ? deptsRes.data.departments : 
                     Array.isArray(deptsRes.data) ? deptsRes.data : [];
    const autoDepts = allDepts.filter(d => 
      d && d.description && d.description.includes('Auto-created')
    );

    logInfo(`Found ${beds.length} beds`);
    logInfo(`Found ${rooms.length} rooms`);
    logInfo(`Found ${wards.length} wards`);
    logInfo(`Found ${autoDepts.length} auto-created departments`);

    return { beds, rooms, wards, autoDepts };
  } catch (error) {
    logError(`Failed to fetch entities: ${error.message}`);
    return { beds: [], rooms: [], wards: [], autoDepts: [] };
  }
}

// Step 3: Delete Beds
async function deleteBeds(beds) {
  logSection('STEP 3: Deleting Beds');
  
  let deleted = 0;
  let failed = 0;

  for (const bed of beds) {
    try {
      await axios.delete(
        `${API_BASE}/inpatient/beds/${bed.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      deleted++;
      logSuccess(`Deleted bed: ${bed.bedNumber}`);
    } catch (error) {
      failed++;
      logError(`Failed to delete bed ${bed.bedNumber}: ${error.response?.data?.message || error.message}`);
    }
  }

  logInfo(`\nBeds deleted: ${deleted}/${beds.length}`);
  if (failed > 0) {
    logWarning(`Failed to delete: ${failed} beds`);
  }
  return deleted;
}

// Step 4: Delete Rooms
async function deleteRooms(rooms) {
  logSection('STEP 4: Deleting Rooms');
  
  let deleted = 0;
  let failed = 0;

  for (const room of rooms) {
    try {
      await axios.delete(
        `${API_BASE}/inpatient/rooms/${room.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      deleted++;
      logSuccess(`Deleted room: ${room.roomNumber}`);
    } catch (error) {
      failed++;
      logError(`Failed to delete room ${room.roomNumber}: ${error.response?.data?.message || error.message}`);
    }
  }

  logInfo(`\nRooms deleted: ${deleted}/${rooms.length}`);
  if (failed > 0) {
    logWarning(`Failed to delete: ${failed} rooms`);
  }
  return deleted;
}

// Step 5: Delete Wards
async function deleteWards(wards) {
  logSection('STEP 5: Deleting Wards');
  
  let deleted = 0;
  let failed = 0;

  for (const ward of wards) {
    try {
      await axios.delete(
        `${API_BASE}/inpatient/wards/${ward.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      deleted++;
      logSuccess(`Deleted ward: ${ward.name} (${ward.wardNumber})`);
    } catch (error) {
      failed++;
      logError(`Failed to delete ward ${ward.name}: ${error.response?.data?.message || error.message}`);
    }
  }

  logInfo(`\nWards deleted: ${deleted}/${wards.length}`);
  if (failed > 0) {
    logWarning(`Failed to delete: ${failed} wards`);
  }
  return deleted;
}

// Step 6: Delete Auto-Created Departments
async function deleteDepartments(departments) {
  logSection('STEP 6: Deleting Auto-Created Departments');
  
  let deleted = 0;
  let failed = 0;

  for (const dept of departments) {
    try {
      await axios.delete(
        `${API_BASE}/departments/${dept.id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      deleted++;
      logSuccess(`Deleted department: ${dept.name}`);
    } catch (error) {
      failed++;
      logError(`Failed to delete department ${dept.name}: ${error.response?.data?.message || error.message}`);
    }
  }

  logInfo(`\nDepartments deleted: ${deleted}/${departments.length}`);
  if (failed > 0) {
    logWarning(`Failed to delete: ${failed} departments`);
  }
  return deleted;
}

// Step 7: Verify Cleanup
async function verifyCleanup() {
  logSection('STEP 7: Verifying Cleanup');
  
  try {
    const [bedsRes, roomsRes, wardsRes, deptsRes] = await Promise.all([
      axios.get(`${API_BASE}/inpatient/beds`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_BASE}/inpatient/rooms`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_BASE}/inpatient/wards`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }),
      axios.get(`${API_BASE}/departments`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    ]);

    const beds = bedsRes.data.beds || [];
    const rooms = roomsRes.data.rooms || [];
    const wards = wardsRes.data.wards || [];
    const allDepts = Array.isArray(deptsRes.data.departments) ? deptsRes.data.departments : 
                     Array.isArray(deptsRes.data) ? deptsRes.data : [];
    const autoDepts = allDepts.filter(d => 
      d && d.description && d.description.includes('Auto-created')
    );

    logInfo(`Remaining beds: ${beds.length}`);
    logInfo(`Remaining rooms: ${rooms.length}`);
    logInfo(`Remaining wards: ${wards.length}`);
    logInfo(`Remaining auto-created departments: ${autoDepts.length}`);

    return {
      beds: beds.length,
      rooms: rooms.length,
      wards: wards.length,
      departments: autoDepts.length
    };
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return null;
  }
}

// Display Summary
function displaySummary(stats) {
  logSection('CLEANUP COMPLETE - SUMMARY');
  
  console.log('\n📊 Remaining Entities:');
  console.log('┌─────────────────────────┬──────────┐');
  console.log('│ Entity                  │ Count    │');
  console.log('├─────────────────────────┼──────────┤');
  console.log(`│ Departments (auto)      │ ${String(stats.departments).padStart(8)} │`);
  console.log(`│ Wards                   │ ${String(stats.wards).padStart(8)} │`);
  console.log(`│ Rooms                   │ ${String(stats.rooms).padStart(8)} │`);
  console.log(`│ Beds                    │ ${String(stats.beds).padStart(8)} │`);
  console.log('└─────────────────────────┴──────────┘');

  if (stats.beds === 0 && stats.rooms === 0 && stats.wards === 0 && stats.departments === 0) {
    console.log('\n✅ All test data successfully deleted!\n');
  } else {
    console.log('\n⚠️  Some entities remain. Check logs for details.\n');
  }
}

// Main execution
async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'red');
  log('║     CLEANUP INPATIENT TEST DATA                           ║', 'red');
  log('║     WARNING: This will delete ALL inpatient data!         ║', 'red');
  log('╚════════════════════════════════════════════════════════════╝', 'red');
  console.log('\n');

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      logError('Cannot proceed without authentication');
      process.exit(1);
    }

    // Step 2: Get all entities
    const entities = await getAllEntities();
    
    if (entities.beds.length === 0 && entities.rooms.length === 0 && 
        entities.wards.length === 0 && entities.autoDepts.length === 0) {
      logInfo('\nNo test data found. Nothing to delete.');
      process.exit(0);
    }

    // Confirm deletion
    logWarning('\nAbout to delete:');
    logWarning(`  - ${entities.beds.length} beds`);
    logWarning(`  - ${entities.rooms.length} rooms`);
    logWarning(`  - ${entities.wards.length} wards`);
    logWarning(`  - ${entities.autoDepts.length} auto-created departments`);
    console.log('\nProceeding with deletion in 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Delete Beds (must be first due to foreign keys)
    await deleteBeds(entities.beds);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 4: Delete Rooms
    await deleteRooms(entities.rooms);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 5: Delete Wards
    await deleteWards(entities.wards);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 6: Delete Auto-Created Departments
    await deleteDepartments(entities.autoDepts);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 7: Verify
    const stats = await verifyCleanup();
    if (!stats) {
      logError('Verification failed');
      process.exit(1);
    }

    // Summary
    displaySummary(stats);

  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the cleanup
main();
