const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Database connection
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hospital',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createTestDoctor() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Hash the password
    const hashedPassword = await bcrypt.hash('Ortho@2025', 10);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['ortho.chief@example.com']
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      await client.query(`
        UPDATE users 
        SET password = $1, 
            first_name = $2, 
            last_name = $3, 
            role = $4,
            phone = $5,
            is_active = $6,
            updated_at = NOW()
        WHERE email = $7
      `, [
        hashedPassword,
        'Rahul',
        'Mehta', 
        'doctor',
        '+91-9876543210',
        true,
        'ortho.chief@example.com'
      ]);
      console.log('Test doctor updated successfully');
    } else {
      // Create new user
      await client.query(`
        INSERT INTO users (
          email, password, first_name, last_name, role, phone, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        'ortho.chief@example.com',
        hashedPassword,
        'Rahul',
        'Mehta',
        'doctor',
        '+91-9876543210',
        true
      ]);
      console.log('Test doctor created successfully');
    }

    console.log('\nLogin credentials:');
    console.log('Email: ortho.chief@example.com');
    console.log('Password: Ortho@2025');
    console.log('Role: doctor');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTestDoctor();
