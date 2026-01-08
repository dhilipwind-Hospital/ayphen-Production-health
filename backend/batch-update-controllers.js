const fs = require('fs');
const path = require('path');

/**
 * Batch update script to add tenant filtering to controller methods
 * This script adds orgId checks and updates repository usage
 */

const controllersPath = path.join(__dirname, 'src', 'controllers');

const updates = {
  updated: [],
  skipped: [],
  errors: [],
  partialUpdates: []
};

/**
 * Add tenant check at the beginning of methods
 */
function addTenantCheck(methodContent) {
  // Skip if already has tenant check
  if (methodContent.includes('Organization context required') ||
      methodContent.includes('const orgId =')) {
    return { content: methodContent, added: false };
  }

  // Find where to insert (after const declarations)
  const lines = methodContent.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find first try block
    if (line.startsWith('try {')) {
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) return { content: methodContent, added: false };

  // Insert tenant context extraction and validation
  const indentation = lines[insertIndex].match(/^(\s*)/)[0];
  const tenantCheckLines = [
    `${indentation}const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;`,
    `${indentation}`,
    `${indentation}if (!orgId) {`,
    `${indentation}  return res.status(400).json({ message: 'Organization context required' });`,
    `${indentation}}`
  ];

  lines.splice(insertIndex, 0, ...tenantCheckLines);

  return { content: lines.join('\n'), added: true };
}

/**
 * Update repository declarations to use TenantRepository
 */
function updateRepositoryUsage(content) {
  let modified = false;

  // Pattern 1: const repo = AppDataSource.getRepository(Model);
  const repoPattern1 = /const\s+(\w+Repo(?:sitory)?)\s*=\s*AppDataSource\.getRepository\((\w+)\);/g;

  content = content.replace(repoPattern1, (match, repoName, modelName) => {
    modified = true;
    return `const ${repoName} = createTenantRepository(\n      AppDataSource.getRepository(${modelName}),\n      orgId\n    );`;
  });

  // Pattern 2: AppDataSource.getRepository(Model) inline usage
  const repoPattern2 = /AppDataSource\.getRepository\((\w+)\)/g;

  // Only replace if not already wrapped in createTenantRepository
  content = content.replace(repoPattern2, (match, modelName) => {
    if (content.substring(Math.max(0, content.indexOf(match) - 30), content.indexOf(match)).includes('createTenantRepository')) {
      return match;
    }
    modified = true;
    return `createTenantRepository(AppDataSource.getRepository(${modelName}), orgId)`;
  });

  return { content, modified };
}

/**
 * Add organizationId filter to query builders
 */
function updateQueryBuilders(content) {
  let modified = false;

  // Find query builders that don't have organization filtering
  const qbPattern = /\.createQueryBuilder\(['"](\w+)['"]\)/g;
  let match;
  const matches = [];

  while ((match = qbPattern.exec(content)) !== null) {
    matches.push({ alias: match[1], index: match.index });
  }

  // For each query builder, check if it has organization filtering
  for (const qbMatch of matches.reverse()) {
    const startIndex = qbMatch.index;
    const alias = qbMatch.alias;

    // Find the next .where( or .andWhere(
    const afterQb = content.substring(startIndex);
    const whereMatch = afterQb.match(/\.(where|andWhere)\(/);

    if (whereMatch) {
      const whereIndex = startIndex + whereMatch.index;
      const whereContent = content.substring(whereIndex, whereIndex + 200);

      // Check if already has organizationId or organization_id filtering
      if (!whereContent.includes('organizationId') && !whereContent.includes('organization_id')) {
        // Find where to insert the filter
        const insertPoint = whereIndex + whereMatch[0].length;

        // Add organization filter
        const filter = `'${alias}.organizationId = :orgId', { orgId })\n      .andWhere(`;
        content = content.substring(0, insertPoint) + filter + content.substring(insertPoint);
        modified = true;
      }
    }
  }

  return { content, modified };
}

/**
 * Process a single controller file
 */
function processController(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Step 1: Add tenant checks to methods
    const methods = content.split(/(?=static\s+\w+\s*=|export\s+const\s+\w+\s*=)/);
    const updatedMethods = methods.map((method) => {
      const { content: updated, added } = addTenantCheck(method);
      if (added) hasChanges = true;
      return updated;
    });

    content = updatedMethods.join('');

    // Step 2: Update repository usage
    const { content: repoUpdated, modified: repoModified } = updateRepositoryUsage(content);
    if (repoModified) hasChanges = true;
    content = repoUpdated;

    // Step 3: Update query builders
    const { content: qbUpdated, modified: qbModified } = updateQueryBuilders(content);
    if (qbModified) hasChanges = true;
    content = qbUpdated;

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Updated successfully`);
      updates.updated.push(fileName);
      return true;
    } else {
      console.log(`  ⏭️  No changes needed (already updated or no patterns found)`);
      updates.skipped.push(fileName);
      return true;
    }

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    updates.errors.push({ file: fileName, error: error.message });
    return false;
  }
}

/**
 * Get all controller files recursively
 */
function getAllControllers(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllControllers(filePath, fileList);
    } else if (file.endsWith('.controller.ts') && !file.includes('auth.') && !file.includes('google-auth.') && !file.includes('organization.') && !file.includes('user.')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  console.log('🚀 Starting batch controller updates for tenant filtering...\n');
  console.log('='.repeat(70));

  const controllers = getAllControllers(controllersPath);

  console.log(`\n📋 Found ${controllers.length} controllers to process\n`);

  for (const controllerPath of controllers) {
    processController(controllerPath);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`  ✅ Updated: ${updates.updated.length}`);
  console.log(`  ⏭️  Skipped: ${updates.skipped.length}`);
  console.log(`  ❌ Errors: ${updates.errors.length}`);

  if (updates.updated.length > 0) {
    console.log(`\n✅ Successfully updated files:`);
    updates.updated.forEach(f => console.log(`   - ${f}`));
  }

  if (updates.errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    updates.errors.forEach(e => console.log(`   - ${e.file}: ${e.error}`));
  }

  console.log('\n✨ Batch update complete!');
  console.log('\n⚠️  Important: Please review the changes and test thoroughly.');
  console.log('   Some complex patterns may need manual adjustment.');
}

main();
