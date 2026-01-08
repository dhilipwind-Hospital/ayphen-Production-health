import { AppDataSource } from './src/config/database';

async function queryDoctors() {
  try {
    await AppDataSource.initialize();
    
    const doctors = await AppDataSource.query(`
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
    console.log(JSON.stringify(doctors, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

queryDoctors();
