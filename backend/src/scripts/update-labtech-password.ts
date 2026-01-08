import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import * as bcrypt from 'bcryptjs';

async function updateLabTechPassword() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepository = AppDataSource.getRepository(User);

    console.log('🔍 Finding lab technician account...');
    const labTech = await userRepository.findOne({
      where: { email: 'labtech@hospital.com' }
    });

    if (!labTech) {
      console.log('❌ Lab technician account not found!');
      console.log('Creating new account...\n');

      const hashedPassword = await bcrypt.hash('password', 10);
      
      const newLabTech = userRepository.create({
        email: 'labtech@hospital.com',
        password: hashedPassword,
        firstName: 'Lab',
        lastName: 'Technician',
        role: 'lab_technician',
        phone: '+1234567890',
        isActive: true
      });

      await userRepository.save(newLabTech);
      console.log('✅ Lab technician account created successfully!');
    } else {
      console.log('✅ Lab technician found\n');
      console.log('🔐 Updating password...');
      
      const hashedPassword = await bcrypt.hash('password', 10);
      labTech.password = hashedPassword;
      
      await userRepository.save(labTech);
      console.log('✅ Password updated successfully!');
    }

    console.log('\n📋 Lab Technician Account Details:');
    console.log('   Email:    labtech@hospital.com');
    console.log('   Password: password');
    console.log('   Role:     Lab Technician');
    console.log('\n🎉 Setup complete!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateLabTechPassword();
