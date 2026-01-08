# 🔐 SMTP Server Setup Guide - Hospital Management System

## ⚠️ SECURITY WARNING
**NEVER share your email credentials in plain text!** Always use environment variables and App Passwords.

## 📋 Prerequisites
Your Gmail account needs to be configured for App Passwords (not your regular password).

## 🔧 Step 1: Enable Gmail App Password

### For Gmail Account (dhilipwind@gmail.com):
1. **Go to Google Account Settings**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (must be enabled)
3. **App Passwords** → **Select app: Mail** → **Select device: Other**
4. **Enter**: "Hospital Management System"
5. **Copy the 16-character App Password** (e.g., `abcd efgh ijkl mnop`)

## 🔧 Step 2: Update Environment Variables

Replace the placeholder in your `.env` file:

```bash
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dhilipwind@gmail.com
SMTP_PASS=your_16_character_app_password_here  # ⚠️ REPLACE THIS!
SMTP_FROM_NAME=Hospital Management System
SMTP_FROM_EMAIL=dhilipwind@gmail.com
```

## 🧪 Step 3: Test SMTP Configuration

Run this test command to verify your SMTP setup:

```bash
npm run test:email
```

## ⚡ Current Configuration Status

✅ **SMTP Service**: Already configured in `src/services/email.service.ts`  
✅ **Email Templates**: Pre-built for all hospital notifications  
✅ **Environment Setup**: Ready for your App Password  
⚠️ **Missing**: Gmail App Password (security required)  

## 📧 Available Email Features

Your hospital system can send:

- 🎉 **Welcome emails** for new patients
- ✅ **Appointment confirmations** 
- ⏰ **Appointment reminders**
- 💊 **Prescription notifications**
- 📋 **Test result notifications**
- 🔔 **System notifications**

## 🛡️ Security Best Practices

1. ✅ **Use App Passwords** (not regular Gmail password)
2. ✅ **Environment variables** (never hardcode credentials)
3. ✅ **Separate SMTP user** from system email
4. ✅ **Enable 2FA** on Gmail account
5. ✅ **Regular password rotation**

## 🚀 Quick Setup Commands

```bash
# 1. Copy your Gmail App Password
# 2. Update .env file
nano .env

# 3. Test email service
npm run test:email

# 4. Restart backend
npm run dev
```

## 📞 Support

If you encounter issues:
1. Verify 2FA is enabled on Gmail
2. Check App Password is correct (16 characters)
3. Ensure SMTP_USER matches Gmail account
4. Test with the provided test script

---
🏥 **Hospital Management System** - Secure Email Configuration
