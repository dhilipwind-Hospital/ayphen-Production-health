# 🧪 Manual UI Testing Guide

## Prerequisites
- System should be running: `docker-compose up -d`
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Test Scenario 1: Doctor Workflow

### Step 1.1: Doctor Login
1. **Navigate to:** `http://localhost:3000/login`
2. **Enter credentials:**
   - Email: `cardiology.consultant@example.com`
   - Password: `doctor123`
3. **Click:** Login button
4. **Expected:** Redirect to doctor dashboard

**✅ Pass Criteria:**
- Login successful
- Redirected to `/appointments` or doctor dashboard
- No error messages

### Step 1.2: View Appointments
1. **Navigate to:** Appointments section
2. **Expected to see:**
   - Table with appointments
   - Patient names: "raja patient", "arun bharati"
   - Service: ECG
   - Status: Confirmed
   - "Write Prescription" buttons

**✅ Pass Criteria:**
- Real patient names displayed (not "Unknown Patient")
- Multiple appointments visible
- Write Prescription buttons present

### Step 1.3: Write Prescription
1. **Click:** "Write Prescription" for "raja patient"
2. **Expected:**
   - Form opens with patient details
   - Patient name shows "raja patient" (not "Patient Unknown")
   - Age, gender, contact info displayed
   - Medicine selection available

**✅ Pass Criteria:**
- Correct patient name displayed
- Form fields populated
- Medicine dropdown works
- No console errors

### Step 1.4: Add Medicines
1. **Click:** "Add Medicine" button
2. **Select:** Ibuprofen 400mg
3. **Fill:**
   - Dosage: 1 tablet
   - Frequency: Twice daily
   - Duration: 5 days
   - Instructions: Take after meals
4. **Click:** "Save Prescription"

**✅ Pass Criteria:**
- Medicine added successfully
- Form validation works
- Success message displayed
- Prescription saved

---

## Test Scenario 2: Pharmacy Workflow

### Step 2.1: Pharmacist Login
1. **Navigate to:** `http://localhost:3000/login`
2. **Enter credentials:**
   - Email: `pharmacist@example.com`
   - Password: `Pharmacist@123`
3. **Click:** Login button

**✅ Pass Criteria:**
- Login successful
- Redirected to pharmacy dashboard

### Step 2.2: View Prescriptions
1. **Navigate to:** Prescriptions tab
2. **Expected to see:**
   - Pending prescriptions
   - Patient names from doctors
   - Medicine details
   - "Dispense" buttons

**✅ Pass Criteria:**
- Prescriptions from doctors visible
- Real patient names shown
- Medicine details accurate

### Step 2.3: Dispense Medicine
1. **Click:** "Dispense" button
2. **Mark medicines as:** Dispensed
3. **Click:** "Dispense Prescription"
4. **Check:** Prescription moves to "Dispensed" tab

**✅ Pass Criteria:**
- Dispensing modal opens
- Status updates successfully
- Prescription moves to correct tab

---

## Test Scenario 3: Patient Portal

### Step 3.1: Patient Login
1. **Navigate to:** `http://localhost:3000/login`
2. **Enter credentials:**
   - Email: `raja.patient@example.com`
   - Password: `Patient@123`
3. **Click:** Login button

**✅ Pass Criteria:**
- Login successful
- Redirected to patient portal

### Step 3.2: View Medical Records
1. **Navigate to:** Medical Records section
2. **Expected to see:**
   - Prescription records
   - Medicine details
   - Doctor information
   - Dates and instructions

**✅ Pass Criteria:**
- Medical records displayed
- Prescription information accurate
- Medicine details visible

---

## Test Scenario 4: Registration & Booking

### Step 4.1: New Patient Registration
1. **Navigate to:** `http://localhost:3000/register`
2. **Fill form:**
   - Name: Test Patient
   - Email: test.patient@example.com
   - Phone: +91-9876543999
   - Password: TestPatient@123
   - Role: Patient
3. **Click:** Register

**✅ Pass Criteria:**
- Registration successful
- Account created
- Can login with new credentials

### Step 4.2: Book Appointment
1. **Login as new patient**
2. **Navigate to:** Book Appointment
3. **Select:**
   - Department: Cardiology
   - Doctor: Cardiology Consultant
   - Service: ECG
   - Available time slot
4. **Submit booking**

**✅ Pass Criteria:**
- Appointment booking successful
- Confirmation message shown
- Appointment appears in doctor's list

---

## Browser Console Testing

### Run Automated Tests
1. **Open browser console** (F12)
2. **Copy and paste** the content from `test-ui-workflow.js`
3. **Press Enter** to run tests
4. **Review results** in console output

### Expected Console Output
```
🏥 Hospital Management System - UI Test Script
===============================================
📍 Current URL: http://localhost:3000/...
📄 Page Title: Hospital Management System
✅ Email input found: true
✅ Password input found: true
✅ Login button found: true
...
```

---

## Common Issues & Solutions

### Issue: "Patient Unknown" displayed
- **Check:** URL parameters being passed correctly
- **Verify:** Patient data in database
- **Console:** Look for API errors

### Issue: No appointments showing
- **Check:** Doctor has appointments in database
- **Verify:** API endpoints working
- **Console:** Check for 404 or 500 errors

### Issue: Pharmacy not showing prescriptions
- **Check:** Prescriptions created by doctors
- **Verify:** Database has prescription data
- **Console:** Check API responses

### Issue: Login redirects incorrectly
- **Check:** User role in database
- **Verify:** Route guards working
- **Console:** Check authentication errors

---

## Success Metrics

### Overall System Health
- [ ] All logins work (Doctor, Patient, Pharmacist, Admin)
- [ ] Real patient names displayed everywhere
- [ ] Prescription workflow end-to-end functional
- [ ] No console errors during normal usage
- [ ] Database integration working
- [ ] All CRUD operations functional

### Performance Checks
- [ ] Pages load within 3 seconds
- [ ] No memory leaks in browser
- [ ] API responses under 1 second
- [ ] No broken images or assets
- [ ] Mobile responsive design works

---

## Reporting Issues

When reporting issues, please include:
1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Browser console errors**
4. **Network tab API responses**
5. **Screenshots if applicable**

---

*This guide covers the complete UI testing workflow for the Hospital Management System.*
