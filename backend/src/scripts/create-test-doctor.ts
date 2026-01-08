import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function createTestDoctor() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Connected to PostgreSQL');

    const userRepo = AppDataSource.getRepository(User);
    
    // Check if user already exists
    const existingUser = await userRepo.findOne({ 
      where: { email: 'ortho.chief@example.com' } 
    });
    
    if (existingUser) {
      console.log('Test doctor already exists. Updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash('Ortho@2025', 10);
      existingUser.password = hashedPassword;
      existingUser.role = UserRole.DOCTOR;
      existingUser.firstName = 'Rahul';
      existingUser.lastName = 'Mehta';
      
      await userRepo.save(existingUser);
      
      console.log('Test doctor password updated successfully.');
    } else {
      // Create new test doctor
      const hashedPassword = await bcrypt.hash('Ortho@2025', 10);
      
      const testDoctor = userRepo.create({
        email: 'ortho.chief@example.com',
        password: hashedPassword,
        firstName: 'Rahul',
        lastName: 'Mehta',
        phone: '1234567890',
        role: UserRole.DOCTOR
      });
      
      await userRepo.save(testDoctor);
      console.log('Test doctor created successfully.');
    }
    
    console.log('Login credentials:');
    console.log('Email: ortho.chief@example.com');
    console.log('Password: Ortho@2025');
    
  } catch (error) {
    console.error('Error creating test doctor:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createTestDoctor();
