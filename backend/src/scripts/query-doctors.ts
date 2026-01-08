import 'reflect-metadata';
import { AppDataSource } from '../config/database';

const doctorsQuery = async () => {
  const ds = await AppDataSource.initialize();

  const doctors = await ds.query(`
    SELECT
      u.id,
      u.email,
      u.firstName,
      u.lastName,
      u.isActive,
      u.organizationId,
      o.name as orgName,
      o.subdomain
    FROM users u
    LEFT JOIN organizations o ON u.organizationId = o.id
    WHERE u.role = 'doctor'
    ORDER BY u.organizationId, u.firstName
  `);

  console.log('Total doctors:', doctors.length);
  console.log('\n=== DOCTORS BY ORGANIZATION ===');
  const byOrg: { [key: string]: any[] } = {};
  doctors.forEach((doc: any) => {
    const org = doc.orgName || 'Unknown';
    if (!byOrg[org]) byOrg[org] = [];
    byOrg[org].push(doc);
  });

  Object.keys(byOrg).forEach(org => {
    console.log(`\n${org} (${byOrg[org].length} doctors):`);
    byOrg[org].forEach((doc: any) => {
      console.log(`  - ${doc.firstName} ${doc.lastName} (${doc.email}) - Active: ${doc.isActive}`);
    });
  });
};

doctorsQuery();
