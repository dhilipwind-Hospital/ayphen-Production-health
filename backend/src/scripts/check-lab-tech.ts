import { AppDataSource } from '../config/database';
import { User } from '../models/User';

async function checkLabTech() {
  try {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: 'labtech@hospital.com' } });
    
    if (user) {
      console.log('✅ User found:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Has password:', !!user.password);
      console.log('First Name:', user.firstName);
      console.log('Last Name:', user.lastName);
    } else {
      console.log('❌ User not found');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLabTech();
