const fs = require('fs');
const path = require('path');

/**
 * Script to add tenant filtering to all controllers
 * This adds import statements and tenant context checks
 */

const controllersPath = path.join(__dirname, 'src', 'controllers');

// List of controllers to update
const controllersToUpdate = [
  'allergy.controller.ts',
  'appointment.controller.ts',
  'availability.controller.ts',
  'callback.controller.ts',
  'consultation.controller.ts',
  'diagnosis.controller.ts',
  'emergency.controller.ts',
  'inventory.controller.ts',
  'lab-order.controller.ts',
  'lab-result.controller.ts',
  'lab-sample.controller.ts',
  'lab-test.controller.ts',
  'medicalRecords.controller.ts',
  'messaging.controller.ts',
  'notification.controller.ts',
  'prescription.controller.ts',
  'referral.controller.ts',
  'reminder.controller.ts',
  'vital-signs.controller.ts',
  'inpatient/admission.controller.ts',
  'inpatient/bed.controller.ts',
  'inpatient/ward.controller.ts',
  'inpatient/room.controller.ts',
  'inpatient/doctor-rounds.controller.ts',
  'inpatient/nursing-care.controller.ts',
  'pharmacy/medicine.controller.ts',
  'pharmacy/prescription.controller.ts',
  'pharmacy/inventory.controller.ts'
];

function addTenantImport(content, isSubdirectory = false) {
  const importPath = isSubdirectory ? '../../repositories/TenantRepository' : '../repositories/TenantRepository';

  // Check if import already exists
  if (content.includes('createTenantRepository')) {
    console.log('  ✓ Import already exists');
    return content;
  }

  // Find the last import statement
  const importRegex = /^import .* from .*;$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport) + lastImport.length;

    // Insert the new import after the last import
    const newImport = `\nimport { createTenantRepository } from '${importPath}';`;
    content = content.slice(0, lastImportIndex) + newImport + content.slice(lastImportIndex);
    console.log('  ✓ Added import statement');
  }

  return content;
}

function processController(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const isSubdirectory = filePath.includes('/inpatient/') || filePath.includes('/pharmacy/');

    // Add import
    content = addTenantImport(content, isSubdirectory);

    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  ✓ Updated successfully');

    return true;
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('Starting tenant filtering updates...\n');
  console.log('=' .repeat(60));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const controllerFile of controllersToUpdate) {
    const fullPath = path.join(controllersPath, controllerFile);

    if (!fs.existsSync(fullPath)) {
      console.log(`\n⏭️  Skipped: ${controllerFile} (file not found)`);
      skipped++;
      continue;
    }

    const success = processController(fullPath);
    if (success) {
      updated++;
    } else {
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nSummary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('\n✨ Import statements added!');
  console.log('\n⚠️  Note: You still need to manually update each method to:');
  console.log('   1. Get orgId from req.tenant?.id or req.user?.organization_id');
  console.log('   2. Create tenant repository: createTenantRepository(repo, orgId)');
  console.log('   3. Replace repo.find/findOne/save calls with tenantRepo methods');
  console.log('   4. Add organization_id check in query builders');
}

main();
