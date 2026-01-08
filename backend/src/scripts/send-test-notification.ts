import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function sendTestNotification() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Connected to PostgreSQL');

    const userRepo = AppDataSource.getRepository(User);
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Find user by email
    let user = await userRepo.findOne({ 
      where: { email: 'dhilipwind@gmail.com' } 
    });
    
    if (!user) {
      console.log('❌ User not found with email: dhilipwind@gmail.com');
      console.log('📝 Creating test user...');
      
      // Create test user if not exists
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      const newUser = userRepo.create({
        email: 'dhilipwind@gmail.com',
        password: hashedPassword,
        firstName: 'Dhilip',
        lastName: 'Elango',
        phone: '1234567890',
        role: UserRole.PATIENT
      });
      
      user = await userRepo.save(newUser);
      console.log('✅ Test user created successfully');
      
      // Create notification for new user
      const notification = notificationRepo.create({
        user: user,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: '🎉 Welcome to Hospital Management System!',
        message: `Hello Dhilip! Your account has been created successfully. You can now access all features of the hospital management system.`,
        priority: NotificationPriority.HIGH,
        actionUrl: '/portal',
        actionLabel: 'Go to Dashboard',
        isRead: false
      });
      
      await notificationRepo.save(notification);
      console.log('✅ Welcome notification sent successfully!');
      
    } else {
      console.log('✅ User found:', user.firstName, user.lastName);
      
      // Create test notification
      const notification = notificationRepo.create({
        user: user,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: '🔔 Test Notification from Hospital System',
        message: `Hi ${user.firstName}! This is a test notification sent at ${new Date().toLocaleString()}. Your notification system is working perfectly! ✅`,
        priority: NotificationPriority.HIGH,
        actionUrl: '/notifications',
        actionLabel: 'View All Notifications',
        isRead: false
      });
      
      await notificationRepo.save(notification);
      console.log('✅ Test notification sent successfully!');
    }
    
    // Get all notifications for this user
    const allNotifications = await notificationRepo.find({
      where: { user: { email: 'dhilipwind@gmail.com' } },
      order: { createdAt: 'DESC' },
      take: 5
    });
    
    console.log('\n📊 Recent Notifications:');
    console.log('========================');
    allNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title}`);
      console.log(`   ${notif.message}`);
      console.log(`   Status: ${notif.isRead ? '✅ Read' : '📬 Unread'}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log('---');
    });
    
    console.log('\n✅ Notification system is working fine!');
    console.log('📧 Email: dhilipwind@gmail.com');
    console.log('🔔 Total notifications:', allNotifications.length);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

sendTestNotification();
