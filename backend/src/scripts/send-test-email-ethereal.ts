import nodemailer from 'nodemailer';

async function sendTestEmailEthereal() {
  try {
    console.log('📧 Creating test email account...\n');
    
    // Create a test account on Ethereal (fake SMTP service)
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('✅ Test account created!');
    console.log('========================');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Host:', testAccount.smtp.host);
    console.log('SMTP Port:', testAccount.smtp.port);
    console.log('\n');
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('📤 Sending test email...\n');
    
    // Send email
    const info = await transporter.sendMail({
      from: '"Hospital Management System" <noreply@hospital.com>',
      to: 'dhilipwind@gmail.com',
      subject: '🔔 Test Email from Hospital Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email System Test - Dhilip Elango</h1>
            </div>
            <div class="content">
              <h2>Hello Dhilip!</h2>
              
              <div class="success-box">
                <h3>✅ Email System is Working!</h3>
                <p>This is a test email sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              
              <p>Your Hospital Management System email notification service is now fully operational!</p>
              
              <h3>📧 Email sent to: dhilipwind@gmail.com</h3>
              
              <h3>What You'll Receive:</h3>
              <ul>
                <li>📅 Appointment confirmations</li>
                <li>⏰ Appointment reminders (24h before)</li>
                <li>💊 Prescription notifications</li>
                <li>📋 Test result notifications</li>
                <li>🔔 System announcements</li>
                <li>💬 Message notifications</li>
              </ul>
              
              <p style="margin-top: 30px;"><strong>This email demonstrates that the notification system is working perfectly!</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Hospital Management System. All rights reserved.</p>
              <p>This is a test email from your notification system.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('✅ SUCCESS!');
    console.log('===========');
    console.log('✅ Test email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('\n📧 View the email here:');
    console.log('🔗', nodemailer.getTestMessageUrl(info));
    console.log('\n🎊 Email notification system is working perfectly!');
    console.log('\n📝 Note: This is a test email using Ethereal (fake SMTP)');
    console.log('📝 To send real emails to dhilipwind@gmail.com, configure Gmail SMTP in .env');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

sendTestEmailEthereal();
