# 🔐 Hospital Management System - User Credentials Guide

## ⚠️ **IMPORTANT SECURITY NOTICE**
This document contains demo/test credentials for development purposes only. **NEVER use these credentials in production environments.**

## 📋 **Demo Accounts Overview**

This hospital management system includes multiple demo accounts across different user roles for testing and demonstration purposes.

---

## 👑 **Super Admin & Admin Accounts**

### **Super Administrator**
- **Email**: `admin@example.com`
- **Password**: `Admin@123`
- **Role**: Super Admin (Full system access)
- **Access**: Complete administrative control

### **Administrator (Alternative)**
- **Email**: `admin@hospital.com`
- **Password**: `Admin@2025`
- **Role**: Admin
- **Access**: Administrative functions, user management

---

## 👨‍⚕️ **Healthcare Professional Accounts**

### **Doctor Account**
- **Email**: `doctor@example.com`
- **Password**: `doctor123`
- **Alternative Email**: `doc@example.com`
- **Alternative Password**: `Doctor@123`
- **Role**: Doctor
- **Access**: Patient records, appointments, prescriptions, medical notes

### **Nurse Account**
- **Email**: Not explicitly seeded (use registration)
- **Password**: Register via `/register` or admin creation
- **Role**: Nurse
- **Access**: Patient care, appointment assistance, basic medical records

### **Lab Technician**
- **Email**: `labtech@hospital.com`
- **Password**: `password` (⚠️ Weak password for demo)
- **Role**: Lab Technician
- **Access**: Lab tests, sample collection, results entry

---

## 💊 **Pharmacy Staff**

### **Pharmacist**
- **Email**: `pharmacist@example.com`
- **Password**: `Pharmacist@123`
- **Role**: Pharmacist
- **Access**: Inventory management, prescription processing, pharmacy dashboard

---

## 🏨 **Support Staff**

#### **Receptionist**
- **Email**: Not explicitly seeded (admin creation required)
- **Password**: Set by admin during account creation
- **Role**: Receptionist
- **Access**: Patient registration, appointment scheduling, callback queue management
- **Creation**: Via Admin Panel → User Management → Create New User

#### **Nurse**
- **Email**: Not explicitly seeded (admin creation required)
- **Password**: Set by admin during account creation
- **Role**: Nurse
- **Access**: Patient care assistance, appointment assistance, basic medical records
- **Creation**: Via Admin Panel → User Management → Create New User

#### **Accountant**
- **Email**: Not explicitly seeded (admin creation required)
- **Password**: Set by admin during account creation
- **Role**: Accountant
- **Access**: Billing management, financial reports, invoice processing
- **Creation**: Via Admin Panel → User Management → Create New User

---

## 👥 **Patient Accounts**
- **Email**: `patient.demo@example.com`
- **Password**: `patient123`
- **Role**: Patient
- **Access**: Patient portal, appointments, medical records, bills

### **Portal Demo Patient (Enhanced)**
- **Email**: `portal.demo.patient@example.com`
- **Password**: `patient123`
- **Role**: Patient
- **Access**: Full patient portal with seeded records and bills
- **Setup**: Use the dev utility to seed this account:
  ```bash
  curl -X POST http://localhost:5001/api/dev/seed-patient-portal \
    -H 'Content-Type: application/json' \
    -d '{"patientEmail":"portal.demo.patient@example.com"}'
  ```

### **Test Patient (Arun)**
- **Email**: `arun@gmail.com`
- **Password**: `Arun@1234` (can be reset via dev utility)
- **Role**: Patient
- **Access**: Patient portal functions

---

## 🛠️ **Development Utilities**

### **Password Reset (Development Only)**
Reset any user's password using the dev endpoint:
```bash
curl -X POST http://localhost:5001/api/dev/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","newPassword":"NewPassword@123"}'
```

### **Seed Patient Portal Data**
Create a demo patient with complete medical history:
```bash
curl -X POST http://localhost:5001/api/dev/seed-patient-portal \
  -H 'Content-Type: application/json' \
  -d '{"patientEmail":"portal.demo.patient@example.com"}'
```

### **Seed Patient for Doctor**
Create appointment and patient relationship:
```bash
curl -X POST http://localhost:5001/api/dev/seed-patient-for-doctor \
  -H 'Content-Type: application/json' \
  -d '{"doctorEmail":"doctor@example.com","patientEmail":"patient.demo@example.com"}'
```

---

## 🔑 **Password Policies**

### **System Requirements**
- **Minimum 8 characters**
- **At least one uppercase letter**
- **At least one lowercase letter**
- **At least one number**
- **At least one special character**

### **Demo Account Passwords**
- Follow security requirements for consistency
- Can be reset using development utilities
- Should be changed in production environments

---

## 🚀 **Quick Access Guide**

### **For Testing Different Roles**

1. **Start the application**:
   ```bash
   docker-compose up --build
   ```

2. **Access Points**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5001/health

3. **Login URLs**:
   - **Patient Portal**: `/login` → Select "Patient" role
   - **Staff Portal**: `/login` → Select appropriate role
   - **Admin Panel**: Available to admin/super-admin roles

### **Role-Specific Dashboards**

| Role | Dashboard URL | Primary Functions |
|------|---------------|-------------------|
| **Super Admin** | `/` | Complete system management |
| **Admin** | `/` | Administrative functions |
| **Doctor** | `/doctor/my-patients` | Patient management, records |
| **Nurse** | `/` | Patient care assistance |
| **Pharmacist** | `/pharmacy` | Inventory, prescriptions |
| **Lab Technician** | `/laboratory/dashboard` | Test management |
| **Receptionist** | `/admin/callback-queue` | Patient registration, scheduling |
| **Accountant** | `/` | Billing and financial management |
| **Patient** | `/portal` | Personal health management |

---

## ⚠️ **Security Best Practices**

### **For Development**
1. **Use demo accounts** for testing only
2. **Reset passwords regularly** using dev utilities
3. **Don't commit real credentials** to version control
4. **Use environment variables** for sensitive data

### **For Production**
1. **Create unique accounts** for each user
2. **Implement strong password policies**
3. **Use proper authentication** (OAuth, SSO, etc.)
4. **Enable 2FA** for admin accounts
5. **Regular security audits** and penetration testing

---

## 📞 **Support & Troubleshooting**

### **Common Issues**
- **Login Problems**: Use dev utilities to reset passwords
- **Permission Issues**: Check role assignments in admin panel
- **Missing Data**: Run appropriate seed scripts

### **Account Recovery**
- **Admins**: Can reset any user password via admin panel
- **Users**: Can request password reset (if email configured)
- **Development**: Use API endpoints for password management

---

## 🔄 **Account Management**

### **Creating New Accounts**
1. **Via Admin Panel**: Navigate to user management section
2. **Via Registration**: Public registration page (`/register`)
3. **Via API**: POST `/api/users` (admin/super-admin only)

### **Role Assignment**
- **Admin Panel**: User management interface
- **API**: Update user role via PUT `/api/users/:id`
- **Permissions**: Automatically assigned based on role

---

**🏥 Hospital Management System - Credential Documentation**
*Last Updated: October 2025*
