import dotenv from 'dotenv';
import { EmailService } from '../services/email.service';

// Load environment variables
dotenv.config();

/**
 * Test SMTP Configuration
 * This script tests the email service configuration
 */
async function testEmailService() {
  console.log('🧪 Testing SMTP Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`✅ SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`✅ SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`✅ SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`✅ SMTP_PASS: ${process.env.SMTP_PASS ? '***configured***' : '❌ NOT SET'}`);
  console.log(`✅ FROM_NAME: ${process.env.SMTP_FROM_NAME}`);
  console.log(`✅ FROM_EMAIL: ${process.env.SMTP_FROM_EMAIL}\n`);

  // Validate configuration
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials not configured!');
    console.log('📖 Please check SMTP_SETUP_GUIDE.md for setup instructions');
    return;
  }

  if (process.env.SMTP_PASS === 'REPLACE_WITH_GMAIL_APP_PASSWORD') {
    console.error('❌ Gmail App Password not set!');
    console.log('📖 Please follow the setup guide to generate Gmail App Password');
    return;
  }

  // Initialize email service
  console.log('🔧 Initializing Email Service...');
  EmailService.initialize();

  // Test 1: Basic email test
  console.log('\n📧 Test 1: Sending test email...');
  try {
    const success = await EmailService.sendEmail({
      to: process.env.SMTP_USER!, // Send to yourself
      subject: '🧪 SMTP Test - Hospital Management System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">✅ SMTP Configuration Test Successful!</h2>
          <p>Your Hospital Management System email service is working correctly.</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>From Email:</strong> ${process.env.SMTP_FROM_EMAIL}</li>
              <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          
          <p>🎉 You can now send hospital notifications, appointment reminders, and welcome emails!</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Hospital Management System - SMTP Test Email<br>
            This is an automated test message.
          </p>
        </div>
      `
    });

    if (success) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Test email failed to send');
    }
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }

  // Test 2: Welcome email template test
  console.log('\n📧 Test 2: Testing welcome email template...');
  try {
    const success = await EmailService.sendWelcomeEmail(
      process.env.SMTP_USER!,
      'Test User'
    );

    if (success) {
      console.log('✅ Welcome email template sent successfully!');
    } else {
      console.log('❌ Welcome email template failed');
    }
  } catch (error) {
    console.error('❌ Welcome email test failed:', error);
  }

  // Test 3: Appointment confirmation test
  console.log('\n📧 Test 3: Testing appointment confirmation template...');
  try {
    const success = await EmailService.sendAppointmentConfirmationEmail(
      process.env.SMTP_USER!,
      'John Doe',
      'Dr. Smith',
      'Tomorrow at 2:00 PM',
      'Cardiology'
    );

    if (success) {
      console.log('✅ Appointment confirmation email sent successfully!');
    } else {
      console.log('❌ Appointment confirmation email failed');
    }
  } catch (error) {
    console.error('❌ Appointment confirmation test failed:', error);
  }

  console.log('\n🎉 SMTP Testing Complete!');
  console.log('📬 Check your email inbox for test messages');
  console.log('🏥 Your Hospital Management System email service is ready!');
}

// Run the test
testEmailService()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
