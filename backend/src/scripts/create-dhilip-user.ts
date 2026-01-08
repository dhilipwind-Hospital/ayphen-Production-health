import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import bcrypt from 'bcryptjs';

async function createUserAndSendNotification() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Connected to PostgreSQL\n');

    const userRepo = AppDataSource.getRepository(User);
    const notificationRepo = AppDataSource.getRepository(Notification);
    
    // Check if user exists
    let user = await userRepo.findOne({ 
      where: { email: 'dhilipwind@gmail.com' } 
    });
    
    if (!user) {
      console.log('📝 Creating new user: dhilipwind@gmail.com');
      
      const hashedPassword = await bcrypt.hash('Dhilip@2025', 10);
      user = userRepo.create({
        email: 'dhilipwind@gmail.com',
        password: hashedPassword,
        firstName: 'Dhilip',
        lastName: 'Elango',
        phone: '9876543210',
        role: UserRole.PATIENT
      });
      
      user = await userRepo.save(user);
      console.log('✅ User created successfully!');
      console.log('📧 Email: dhilipwind@gmail.com');
      console.log('🔑 Password: Dhilip@2025\n');
    } else {
      console.log('✅ User already exists!');
      console.log('👤 Name:', user.firstName, user.lastName);
      console.log('📧 Email:', user.email, '\n');
    }
    
    // Send welcome notification
    const welcomeNotification = notificationRepo.create({
      user: user,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: '🎉 Welcome to Hospital Management System!',
      message: `Hello ${user.firstName}! Welcome to our Hospital Management System. You can now book appointments, view medical records, and access all healthcare services.`,
      priority: NotificationPriority.HIGH,
      actionUrl: '/portal',
      actionLabel: 'Go to Dashboard',
      isRead: false
    });
    
    await notificationRepo.save(welcomeNotification);
    console.log('✅ Welcome notification sent!');
    
    // Send test notification
    const testNotification = notificationRepo.create({
      user: user,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: '🔔 Notification System Test',
      message: `Hi ${user.firstName}! This is a test notification sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}. Your notification system is working perfectly! ✅`,
      priority: NotificationPriority.HIGH,
      actionUrl: '/notifications',
      actionLabel: 'View All Notifications',
      isRead: false
    });
    
    await notificationRepo.save(testNotification);
    console.log('✅ Test notification sent!\n');
    
    // Get all notifications
    const allNotifications = await notificationRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 10
    });
    
    console.log('📊 NOTIFICATION SUMMARY');
    console.log('========================');
    console.log('👤 User:', user.firstName, user.lastName);
    console.log('📧 Email:', user.email);
    console.log('🔔 Total Notifications:', allNotifications.length);
    console.log('📬 Unread:', allNotifications.filter(n => !n.isRead).length);
    console.log('\n📋 Recent Notifications:');
    console.log('------------------------');
    
    allNotifications.slice(0, 5).forEach((notif, index) => {
      console.log(`\n${index + 1}. ${notif.title}`);
      console.log(`   📝 ${notif.message}`);
      console.log(`   ${notif.isRead ? '✅ Read' : '📬 Unread'}`);
      console.log(`   🕐 ${notif.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    });
    
    console.log('\n\n🎊 SUCCESS!');
    console.log('===========');
    console.log('✅ User created/verified: dhilipwind@gmail.com');
    console.log('✅ Notifications sent successfully');
    console.log('✅ You can now login to the system');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: dhilipwind@gmail.com');
    console.log('   Password: Dhilip@2025');
    console.log('\n🌐 Access the system at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('\n✅ Database connection closed');
  }
}

createUserAndSendNotification();
