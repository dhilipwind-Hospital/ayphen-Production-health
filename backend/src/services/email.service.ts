import nodemailer from 'nodemailer';
import { NotificationType } from '../models/Notification';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  // Initialize email transporter
  static initialize() {
    // Configure SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });

    console.log('📧 Email service initialized');
  }

  // Send email
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.initialize();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Ayphen Care'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Send welcome email
  static async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const subject = '🎉 Welcome to Ayphen Care!';
    const html = this.getWelcomeEmailTemplate(firstName);
    
    return await this.sendEmail({ to: email, subject, html });
  }

  // Send appointment confirmation email
  static async sendAppointmentConfirmationEmail(
    email: string,
    patientName: string,
    doctorName: string,
    appointmentTime: string,
    department: string
  ): Promise<boolean> {
    const subject = '✅ Appointment Confirmed - Hospital Management System';
    const html = this.getAppointmentConfirmationTemplate(patientName, doctorName, appointmentTime, department);
    
    return await this.sendEmail({ to: email, subject, html });
  }

  // Send appointment reminder email
  static async sendAppointmentReminderEmail(
    email: string,
    patientName: string,
    doctorName: string,
    appointmentTime: string
  ): Promise<boolean> {
    const subject = '⏰ Appointment Reminder - Tomorrow';
    const html = this.getAppointmentReminderTemplate(patientName, doctorName, appointmentTime);
    
    return await this.sendEmail({ to: email, subject, html });
  }

  // Send prescription notification email
  static async sendPrescriptionNotificationEmail(
    email: string,
    patientName: string,
    doctorName: string
  ): Promise<boolean> {
    const subject = '💊 New Prescription Available';
    const html = this.getPrescriptionNotificationTemplate(patientName, doctorName);
    
    return await this.sendEmail({ to: email, subject, html });
  }

  // Send test result notification email
  static async sendTestResultNotificationEmail(
    email: string,
    patientName: string,
    testName: string
  ): Promise<boolean> {
    const subject = '📋 Test Results Available';
    const html = this.getTestResultNotificationTemplate(patientName, testName);
    
    return await this.sendEmail({ to: email, subject, html });
  }

  // Send notification email (generic)
  static async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
    type: NotificationType
  ): Promise<boolean> {
    const subject = `🔔 ${title}`;
    const html = this.getGenericNotificationTemplate(title, message, type);

    return await this.sendEmail({ to: email, subject, html });
  }

  // Send doctor welcome email with login credentials
  static async sendDoctorWelcomeEmail(
    email: string,
    firstName: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string
  ): Promise<boolean> {
    const subject = `Welcome to ${organizationName} - Doctor Portal Access`;
    const html = this.getDoctorWelcomeEmailTemplate(firstName, email, tempPassword, organizationName, subdomain);

    return await this.sendEmail({ to: email, subject, html });
  }

  // Send nurse welcome email with login credentials
  static async sendNurseWelcomeEmail(
    email: string,
    firstName: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string
  ): Promise<boolean> {
    const subject = `Welcome to ${organizationName} - Nurse Portal Access`;
    const html = this.getNurseWelcomeEmailTemplate(firstName, email, tempPassword, organizationName, subdomain);

    return await this.sendEmail({ to: email, subject, html });
  }

  // Send receptionist welcome email with login credentials
  static async sendReceptionistWelcomeEmail(
    email: string,
    firstName: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string
  ): Promise<boolean> {
    const subject = `Welcome to ${organizationName} - Receptionist Portal Access`;
    const html = this.getReceptionistWelcomeEmailTemplate(firstName, email, tempPassword, organizationName, subdomain);

    return await this.sendEmail({ to: email, subject, html });
  }

  // Universal welcome email for any role
  static async sendUniversalWelcomeEmail(
    email: string,
    firstName: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string,
    role: string
  ): Promise<boolean> {
    const roleDisplayName = this.getRoleDisplayName(role);
    const subject = `Welcome to ${organizationName} - ${roleDisplayName} Portal Access`;
    const html = this.getUniversalWelcomeEmailTemplate(firstName, email, tempPassword, organizationName, subdomain, role);

    return await this.sendEmail({ to: email, subject, html });
  }

  // Get display name for role
  private static getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'doctor': 'Doctor',
      'nurse': 'Nurse',
      'patient': 'Patient',
      'receptionist': 'Receptionist',
      'pharmacist': 'Pharmacist',
      'lab_technician': 'Lab Technician',
      'accountant': 'Accountant'
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetUrl: string
  ): Promise<boolean> {
    const subject = '🔐 Password Reset Request - Hospital Management System';
    const html = this.getPasswordResetEmailTemplate(firstName, resetUrl);

    return await this.sendEmail({ to: email, subject, html });
  }

  // Email Templates

  private static getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Ayphen Care!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Thank you for registering with Ayphen Care. Your account has been created successfully!</p>
            
            <h3>What you can do:</h3>
            <ul>
              <li>📅 Book appointments with doctors</li>
              <li>📋 View your medical records</li>
              <li>💊 Access prescriptions</li>
              <li>📊 Track your health history</li>
              <li>💬 Communicate with healthcare providers</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
            
            <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 Ayphen Care. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getAppointmentConfirmationTemplate(
    patientName: string,
    doctorName: string,
    appointmentTime: string,
    department: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName}!</h2>
            <p>Your appointment has been confirmed. Here are the details:</p>
            
            <div class="appointment-details">
              <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>🏥 Department:</strong> ${department}</p>
              <p><strong>📅 Date & Time:</strong> ${appointmentTime}</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>Please arrive 15 minutes before your appointment</li>
              <li>Bring your ID and insurance card</li>
              <li>Bring any relevant medical records</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal" class="button">View Appointment</a>
            
            <p style="margin-top: 30px;">Need to reschedule? Contact us or manage your appointment online.</p>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getAppointmentReminderTemplate(
    patientName: string,
    doctorName: string,
    appointmentTime: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder-box { background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Appointment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName}!</h2>
            <p>This is a friendly reminder about your upcoming appointment:</p>
            
            <div class="reminder-box">
              <p><strong>👨‍⚕️ Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>📅 Date & Time:</strong> ${appointmentTime}</p>
              <p><strong>⏰ Time:</strong> Tomorrow</p>
            </div>
            
            <p><strong>Please remember to:</strong></p>
            <ul>
              <li>✅ Arrive 15 minutes early</li>
              <li>✅ Bring your ID and insurance card</li>
              <li>✅ Bring any relevant medical records</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal" class="button">View Details</a>
            
            <p style="margin-top: 30px;">Need to cancel or reschedule? Please contact us as soon as possible.</p>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPrescriptionNotificationTemplate(
    patientName: string,
    doctorName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .prescription-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 New Prescription Available</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName}!</h2>
            <p>Dr. ${doctorName} has prescribed new medication for you.</p>
            
            <div class="prescription-box">
              <p>Your prescription is now available in your patient portal.</p>
              <p>You can view the details and pick it up from the pharmacy.</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/records" class="button">View Prescription</a>
            
            <p style="margin-top: 30px;"><strong>Important:</strong> Please follow the dosage instructions carefully.</p>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getTestResultNotificationTemplate(
    patientName: string,
    testName: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .result-box { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Test Results Available</h1>
          </div>
          <div class="content">
            <h2>Hello ${patientName}!</h2>
            <p>Your ${testName} results are now available.</p>
            
            <div class="result-box">
              <p>You can view your test results in your patient portal.</p>
              <p>If you have any questions about your results, please contact your doctor.</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/records" class="button">View Results</a>
            
            <p style="margin-top: 30px;">Your healthcare provider will discuss the results with you if needed.</p>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getGenericNotificationTemplate(
    title: string,
    message: string,
    type: NotificationType
  ): string {
    const colors: Record<string, string> = {
      [NotificationType.SYSTEM_ANNOUNCEMENT]: '#6366f1',
      [NotificationType.EMERGENCY_NEW]: '#ef4444',
      [NotificationType.EMERGENCY_ASSIGNED]: '#ef4444',
      default: '#667eea'
    };

    const color = colors[type] || colors.default;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-left: 4px solid ${color}; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: ${color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 ${title}</h1>
          </div>
          <div class="content">
            <div class="message-box">
              <p>${message}</p>
            </div>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications" class="button">View in Portal</a>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getDoctorWelcomeEmailTemplate(
    firstName: string,
    email: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string
  ): string {
    // Build login URL with organization subdomain
    let loginUrl: string;
    const frontendUrl = process.env.FRONTEND_URL;

    if (frontendUrl && frontendUrl !== 'http://localhost:3000') {
      // Production: replace domain with subdomain version
      // e.g., https://yourdomain.com -> https://ishan.yourdomain.com
      const urlObj = new URL(frontendUrl);
      const hostname = urlObj.hostname;
      loginUrl = `${urlObj.protocol}//${subdomain}.${hostname}/login`;
    } else {
      // Development: use subdomain.localhost:port
      loginUrl = `http://${subdomain}.localhost:3000/login`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: white; padding: 20px; border-left: 4px solid #e91e63; margin: 20px 0; border-radius: 5px; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; color: #e91e63; }
          .credential-value { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; margin-top: 5px; word-break: break-all; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .warning-icon { font-weight: bold; color: #856404; }
          .button { display: inline-block; padding: 12px 30px; background: #e91e63; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .step { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid #e91e63; padding-left: 15px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👨‍⚕️ Welcome Dr. ${firstName}!</h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Doctor Portal Access</p>
          </div>
          <div class="content">
            <h2>Hello Dr. ${firstName},</h2>
            <p>Your doctor account has been successfully created on <strong>${organizationName}</strong> Hospital Management System.</p>

            <div class="credentials-box">
              <h3 style="color: #e91e63; margin-top: 0;">🔐 Your Login Credentials</h3>

              <div class="credential-item">
                <div class="credential-label">📧 Email:</div>
                <div class="credential-value">${email}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🔑 Temporary Password:</div>
                <div class="credential-value">${tempPassword}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🌐 Login URL:</div>
                <div class="credential-value"><a href="${loginUrl}" style="color: #e91e63; text-decoration: none;">${loginUrl}</a></div>
              </div>
            </div>

            <div class="warning-box">
              <p style="margin: 0;"><span class="warning-icon">⚠️ IMPORTANT:</span> Please change your password immediately after your first login for security purposes.</p>
            </div>

            <h3 style="color: #333; margin-top: 30px;">📋 Quick Start Guide</h3>

            <div class="step">
              <strong>Step 1:</strong> Visit the login URL above
            </div>

            <div class="step">
              <strong>Step 2:</strong> Enter your email and temporary password
            </div>

            <div class="step">
              <strong>Step 3:</strong> Change your password to something secure and memorable
            </div>

            <div class="step">
              <strong>Step 4:</strong> Access your doctor dashboard and start managing patients
            </div>

            <a href="${loginUrl}" class="button">Login to Doctor Portal</a>

            <h3 style="color: #333; margin-top: 30px;">✨ What You Can Do</h3>
            <ul style="color: #666;">
              <li>👥 Manage your patients and medical records</li>
              <li>📅 View and manage appointments</li>
              <li>💊 Create prescriptions</li>
              <li>📊 View patient health history</li>
              <li>💬 Communicate with patients and staff</li>
              <li>📋 Access lab reports and test results</li>
            </ul>

            <p style="color: #666; margin-top: 30px;"><strong>Need Help?</strong> If you encounter any issues logging in or have questions, please contact the hospital administration or IT support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 ${organizationName} Hospital Management System. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e91e63, #ad1457); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔐 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Hospital Management System</p>
          </div>
          <div class="content">
            <h2 style="color: #e91e63;">Hello ${firstName}!</h2>
            
            <p>We received a request to reset your password for your Hospital Management System account.</p>
            
            <p>If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important Security Information:</strong></p>
              <ul style="margin: 10px 0 0 0;">
                <li>This link will expire in <strong>15 minutes</strong> for security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged if you don't click the link</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <p style="margin-top: 30px; color: #666;">
              <strong>Need help?</strong> Contact your hospital's IT support team if you continue to have issues accessing your account.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Hospital Management System. All rights reserved.</p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">This is an automated security email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getNurseWelcomeEmailTemplate(
    firstName: string,
    email: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string
  ): string {
    // Build login URL with organization subdomain
    let loginUrl: string;
    const frontendUrl = process.env.FRONTEND_URL;

    if (frontendUrl && frontendUrl !== 'http://localhost:3000') {
      // Production: replace domain with subdomain version
      const urlObj = new URL(frontendUrl);
      const hostname = urlObj.hostname;
      loginUrl = `${urlObj.protocol}//${subdomain}.${hostname}/login`;
    } else {
      // Development: use subdomain.localhost:port
      loginUrl = `http://${subdomain}.localhost:3000/login`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: white; padding: 20px; border-left: 4px solid #1890ff; margin: 20px 0; border-radius: 5px; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; color: #1890ff; }
          .credential-value { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; margin-top: 5px; word-break: break-all; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .warning-icon { font-weight: bold; color: #856404; }
          .button { display: inline-block; padding: 12px 30px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .step { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid #1890ff; padding-left: 15px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .feature-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 3px solid #52c41a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👩‍⚕️ Welcome Nurse ${firstName}!</h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Nursing Portal Access</p>
          </div>
          <div class="content">
            <h2>Hello Nurse ${firstName},</h2>
            <p>Your nursing account has been successfully created on <strong>${organizationName}</strong> Hospital Management System.</p>

            <div class="credentials-box">
              <h3 style="color: #1890ff; margin-top: 0;">🔐 Your Login Credentials</h3>

              <div class="credential-item">
                <div class="credential-label">📧 Email:</div>
                <div class="credential-value">${email}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🔑 Temporary Password:</div>
                <div class="credential-value">${tempPassword}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🌐 Login URL:</div>
                <div class="credential-value"><a href="${loginUrl}" style="color: #1890ff; text-decoration: none;">${loginUrl}</a></div>
              </div>
            </div>

            <div class="warning-box">
              <p style="margin: 0;"><span class="warning-icon">⚠️ IMPORTANT:</span> Please change your password immediately after your first login for security purposes.</p>
            </div>

            <h3 style="color: #333; margin-top: 30px;">🏥 Your Nursing Responsibilities</h3>

            <div class="feature-box">
              <strong>🩺 Triage Station:</strong> Assess patients, record vital signs, and assign priority levels
            </div>

            <div class="feature-box">
              <strong>🏥 Inpatient Care:</strong> Monitor admitted patients, administer medications, and document care
            </div>

            <div class="feature-box">
              <strong>📋 Patient Records:</strong> Update medical records and add nursing observations
            </div>

            <div class="feature-box">
              <strong>🛏️ Bed Management:</strong> Manage patient bed assignments and ward monitoring
            </div>

            <h3 style="color: #333; margin-top: 30px;">📋 Quick Start Guide</h3>

            <div class="step">
              <strong>Step 1:</strong> Visit the login URL above
            </div>

            <div class="step">
              <strong>Step 2:</strong> Enter your email and temporary password
            </div>

            <div class="step">
              <strong>Step 3:</strong> Change your password to something secure and memorable
            </div>

            <div class="step">
              <strong>Step 4:</strong> Access the Triage Station to start your nursing workflow
            </div>

            <div class="step">
              <strong>Step 5:</strong> Familiarize yourself with the inpatient care module
            </div>

            <a href="${loginUrl}" class="button">🚀 Login to Nursing Portal</a>

            <h3 style="color: #333; margin-top: 30px;">📞 Need Help?</h3>
            <p>If you have any questions about using the nursing portal, please contact:</p>
            <ul>
              <li>Your nursing supervisor</li>
              <li>Hospital IT support team</li>
              <li>Hospital administration</li>
            </ul>

            <p style="margin-top: 30px; padding: 15px; background: #e6f7ff; border-radius: 5px; border-left: 4px solid #1890ff;">
              <strong>💡 Pro Tip:</strong> After logging in, you'll be automatically redirected to the Triage Station where you can start processing patients immediately.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 ${organizationName}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
            <p style="margin-top: 10px; color: #999;">
              Welcome to the nursing team! We're excited to have you on board. 👩‍⚕️
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getReceptionistWelcomeEmailTemplate(
    firstName: string,
    email: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string
  ): string {
    // Build login URL with organization subdomain
    let loginUrl: string;
    const frontendUrl = process.env.FRONTEND_URL;

    if (frontendUrl && frontendUrl !== 'http://localhost:3000') {
      // Production: replace domain with subdomain version
      const urlObj = new URL(frontendUrl);
      const hostname = urlObj.hostname;
      loginUrl = `${urlObj.protocol}//${subdomain}.${hostname}/login`;
    } else {
      // Development: use subdomain.localhost:port
      loginUrl = `http://${subdomain}.localhost:3000/login`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: white; padding: 20px; border-left: 4px solid #52c41a; margin: 20px 0; border-radius: 5px; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; color: #52c41a; }
          .credential-value { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; margin-top: 5px; word-break: break-all; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .warning-icon { font-weight: bold; color: #856404; }
          .button { display: inline-block; padding: 12px 30px; background: #52c41a; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .step { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid #52c41a; padding-left: 15px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .feature-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 3px solid #1890ff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Welcome ${firstName}!</h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Receptionist Portal Access</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>Your receptionist account has been successfully created on <strong>${organizationName}</strong> Hospital Management System.</p>

            <div class="credentials-box">
              <h3 style="color: #52c41a; margin-top: 0;">🔐 Your Login Credentials</h3>

              <div class="credential-item">
                <div class="credential-label">📧 Email:</div>
                <div class="credential-value">${email}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🔑 Temporary Password:</div>
                <div class="credential-value">${tempPassword}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🌐 Login URL:</div>
                <div class="credential-value"><a href="${loginUrl}" style="color: #52c41a; text-decoration: none;">${loginUrl}</a></div>
              </div>
            </div>

            <div class="warning-box">
              <p style="margin: 0;"><span class="warning-icon">⚠️ IMPORTANT:</span> Please change your password immediately after your first login for security purposes.</p>
            </div>

            <h3 style="color: #333; margin-top: 30px;">🏥 Your Reception Responsibilities</h3>

            <div class="feature-box">
              <strong>👥 Patient Registration:</strong> Register new patients and manage patient information
            </div>

            <div class="feature-box">
              <strong>📅 Appointment Scheduling:</strong> Book, reschedule, and manage patient appointments
            </div>

            <div class="feature-box">
              <strong>📞 Phone Management:</strong> Handle incoming calls and patient inquiries
            </div>

            <div class="feature-box">
              <strong>🎫 Queue Management:</strong> Manage patient queues and waiting lists
            </div>

            <div class="feature-box">
              <strong>💳 Payment Processing:</strong> Handle patient payments and billing inquiries
            </div>

            <h3 style="color: #333; margin-top: 30px;">📋 Quick Start Guide</h3>

            <div class="step">
              <strong>Step 1:</strong> Visit the login URL above
            </div>

            <div class="step">
              <strong>Step 2:</strong> Enter your email and temporary password
            </div>

            <div class="step">
              <strong>Step 3:</strong> Change your password to something secure and memorable
            </div>

            <div class="step">
              <strong>Step 4:</strong> Access the reception dashboard to start managing patients
            </div>

            <div class="step">
              <strong>Step 5:</strong> Familiarize yourself with appointment scheduling and patient registration
            </div>

            <a href="${loginUrl}" class="button">🚀 Login to Reception Portal</a>

            <h3 style="color: #333; margin-top: 30px;">📞 Need Help?</h3>
            <p>If you have any questions about using the reception portal, please contact:</p>
            <ul>
              <li>Your supervisor or office manager</li>
              <li>Hospital IT support team</li>
              <li>Hospital administration</li>
            </ul>

            <p style="margin-top: 30px; padding: 15px; background: #f6ffed; border-radius: 5px; border-left: 4px solid #52c41a;">
              <strong>💡 Pro Tip:</strong> As the first point of contact, your friendly service creates the first impression for patients. Welcome to the team!
            </p>
          </div>
          <div class="footer">
            <p>© 2025 ${organizationName}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
            <p style="margin-top: 10px; color: #999;">
              Welcome to the reception team! We're excited to have you on board. 🏥
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getUniversalWelcomeEmailTemplate(
    firstName: string,
    email: string,
    tempPassword: string,
    organizationName: string,
    subdomain: string,
    role: string
  ): string {
    // Build login URL with organization subdomain
    let loginUrl: string;
    const frontendUrl = process.env.FRONTEND_URL;

    if (frontendUrl && frontendUrl !== 'http://localhost:3000') {
      const urlObj = new URL(frontendUrl);
      const hostname = urlObj.hostname;
      loginUrl = `${urlObj.protocol}//${subdomain}.${hostname}/login`;
    } else {
      loginUrl = `http://${subdomain}.localhost:3000/login`;
    }

    // Role-specific configurations
    const roleConfig = this.getRoleConfig(role);
    const roleDisplayName = this.getRoleDisplayName(role);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${roleConfig.gradient}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials-box { background: white; padding: 20px; border-left: 4px solid ${roleConfig.color}; margin: 20px 0; border-radius: 5px; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; color: ${roleConfig.color}; }
          .credential-value { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; margin-top: 5px; word-break: break-all; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .warning-icon { font-weight: bold; color: #856404; }
          .button { display: inline-block; padding: 12px 30px; background: ${roleConfig.color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .step { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid ${roleConfig.color}; padding-left: 15px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .feature-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 3px solid ${roleConfig.accentColor}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${roleConfig.icon} Welcome ${firstName}!</h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">${roleDisplayName} Portal Access</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>Your ${roleDisplayName.toLowerCase()} account has been successfully created on <strong>${organizationName}</strong> Hospital Management System.</p>

            <div class="credentials-box">
              <h3 style="color: ${roleConfig.color}; margin-top: 0;">🔐 Your Login Credentials</h3>

              <div class="credential-item">
                <div class="credential-label">📧 Email:</div>
                <div class="credential-value">${email}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🔑 Temporary Password:</div>
                <div class="credential-value">${tempPassword}</div>
              </div>

              <div class="credential-item">
                <div class="credential-label">🌐 Login URL:</div>
                <div class="credential-value"><a href="${loginUrl}" style="color: ${roleConfig.color}; text-decoration: none;">${loginUrl}</a></div>
              </div>
            </div>

            <div class="warning-box">
              <p style="margin: 0;"><span class="warning-icon">⚠️ IMPORTANT:</span> Please change your password immediately after your first login for security purposes.</p>
            </div>

            <h3 style="color: #333; margin-top: 30px;">🏥 Your ${roleDisplayName} Responsibilities</h3>

            ${roleConfig.responsibilities.map((resp: any) => `
              <div class="feature-box">
                <strong>${resp.icon} ${resp.title}:</strong> ${resp.description}
              </div>
            `).join('')}

            <h3 style="color: #333; margin-top: 30px;">📋 Quick Start Guide</h3>

            <div class="step">
              <strong>Step 1:</strong> Visit the login URL above
            </div>

            <div class="step">
              <strong>Step 2:</strong> Enter your email and temporary password
            </div>

            <div class="step">
              <strong>Step 3:</strong> Change your password to something secure and memorable
            </div>

            <div class="step">
              <strong>Step 4:</strong> ${roleConfig.quickStart}
            </div>

            <div class="step">
              <strong>Step 5:</strong> Familiarize yourself with your role-specific features
            </div>

            <a href="${loginUrl}" class="button">🚀 Login to ${roleDisplayName} Portal</a>

            <h3 style="color: #333; margin-top: 30px;">📞 Need Help?</h3>
            <p>If you have any questions about using the ${roleDisplayName.toLowerCase()} portal, please contact:</p>
            <ul>
              <li>Your supervisor or department head</li>
              <li>Hospital IT support team</li>
              <li>Hospital administration</li>
            </ul>

            <p style="margin-top: 30px; padding: 15px; background: ${roleConfig.tipBackground}; border-radius: 5px; border-left: 4px solid ${roleConfig.color};">
              <strong>💡 Pro Tip:</strong> ${roleConfig.proTip}
            </p>
          </div>
          <div class="footer">
            <p>© 2025 ${organizationName}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
            <p style="margin-top: 10px; color: #999;">
              Welcome to the ${roleDisplayName.toLowerCase()} team! We're excited to have you on board. ${roleConfig.icon}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static getRoleConfig(role: string) {
    const configs: { [key: string]: any } = {
      'super_admin': {
        color: '#722ed1',
        gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
        accentColor: '#9254de',
        icon: '👑',
        tipBackground: '#f9f0ff',
        quickStart: 'Access the super admin dashboard to manage the entire system',
        proTip: 'You have full system access - use your power responsibly!',
        responsibilities: [
          { icon: '🏢', title: 'System Management', description: 'Manage all organizations and system-wide settings' },
          { icon: '👥', title: 'User Administration', description: 'Create and manage all user accounts across organizations' },
          { icon: '🔧', title: 'System Configuration', description: 'Configure system-wide settings and features' },
          { icon: '📊', title: 'Global Analytics', description: 'View system-wide reports and analytics' }
        ]
      },
      'admin': {
        color: '#e91e63',
        gradient: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
        accentColor: '#f06292',
        icon: '👨‍💼',
        tipBackground: '#fce4ec',
        quickStart: 'Access the admin dashboard to manage your hospital',
        proTip: 'You manage this hospital - coordinate with all departments for smooth operations!',
        responsibilities: [
          { icon: '🏥', title: 'Hospital Management', description: 'Oversee all hospital operations and departments' },
          { icon: '👥', title: 'Staff Management', description: 'Manage doctors, nurses, and support staff' },
          { icon: '📊', title: 'Reports & Analytics', description: 'Generate reports and analyze hospital performance' },
          { icon: '⚙️', title: 'Settings & Configuration', description: 'Configure hospital settings and preferences' }
        ]
      },
      'patient': {
        color: '#2196f3',
        gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        accentColor: '#64b5f6',
        icon: '🤒',
        tipBackground: '#e3f2fd',
        quickStart: 'Access your patient portal to view appointments and records',
        proTip: 'Keep your contact information updated and attend scheduled appointments!',
        responsibilities: [
          { icon: '📅', title: 'Appointment Management', description: 'Book and manage your medical appointments' },
          { icon: '📋', title: 'Medical Records', description: 'View your medical history and test results' },
          { icon: '💊', title: 'Prescriptions', description: 'Access your prescription history and refills' },
          { icon: '💳', title: 'Billing', description: 'View and pay your medical bills' }
        ]
      },
      'pharmacist': {
        color: '#ff9800',
        gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        accentColor: '#ffb74d',
        icon: '💊',
        tipBackground: '#fff3e0',
        quickStart: 'Access the pharmacy dashboard to manage medications',
        proTip: 'Always verify prescriptions and check for drug interactions!',
        responsibilities: [
          { icon: '💊', title: 'Medication Management', description: 'Manage pharmacy inventory and prescriptions' },
          { icon: '📋', title: 'Prescription Verification', description: 'Verify and dispense prescribed medications' },
          { icon: '📦', title: 'Inventory Control', description: 'Monitor stock levels and order supplies' },
          { icon: '⚠️', title: 'Drug Safety', description: 'Check for interactions and allergies' }
        ]
      },
      'lab_technician': {
        color: '#9c27b0',
        gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
        accentColor: '#ba68c8',
        icon: '🔬',
        tipBackground: '#f3e5f5',
        quickStart: 'Access the laboratory dashboard to manage tests',
        proTip: 'Accuracy is crucial - double-check all test procedures and results!',
        responsibilities: [
          { icon: '🔬', title: 'Laboratory Testing', description: 'Perform and analyze laboratory tests' },
          { icon: '📊', title: 'Test Results', description: 'Record and report test results accurately' },
          { icon: '🧪', title: 'Sample Management', description: 'Handle and process patient samples' },
          { icon: '⚙️', title: 'Equipment Maintenance', description: 'Maintain and calibrate lab equipment' }
        ]
      },
      'accountant': {
        color: '#607d8b',
        gradient: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)',
        accentColor: '#90a4ae',
        icon: '💰',
        tipBackground: '#eceff1',
        quickStart: 'Access the accounting dashboard to manage finances',
        proTip: 'Keep accurate records and ensure all transactions are properly documented!',
        responsibilities: [
          { icon: '💰', title: 'Financial Management', description: 'Manage hospital finances and budgets' },
          { icon: '📊', title: 'Financial Reports', description: 'Generate financial reports and statements' },
          { icon: '💳', title: 'Billing & Payments', description: 'Process patient billing and payments' },
          { icon: '📋', title: 'Audit & Compliance', description: 'Ensure financial compliance and auditing' }
        ]
      }
    };

    return configs[role] || {
      color: '#666666',
      gradient: 'linear-gradient(135deg, #666666 0%, #424242 100%)',
      accentColor: '#999999',
      icon: '👤',
      tipBackground: '#f5f5f5',
      quickStart: 'Access your dashboard to start working',
      proTip: 'Welcome to the team! Explore your role-specific features.',
      responsibilities: [
        { icon: '🏥', title: 'Hospital Operations', description: 'Contribute to smooth hospital operations' },
        { icon: '👥', title: 'Team Collaboration', description: 'Work effectively with your team members' },
        { icon: '📋', title: 'Task Management', description: 'Complete your assigned tasks efficiently' }
      ]
    };
  }
}
