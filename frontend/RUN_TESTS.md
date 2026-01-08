# 🧪 Inpatient UI Tests - Quick Start Guide

## ✅ **READY TO RUN!**

**Rate Limit:** 1000 attempts per 15 minutes ✅  
**Login Test:** Fixed and working ✅  
**Total Tests:** 20 comprehensive UI tests ✅

---

## **🚀 RUN ALL TESTS:**

```bash
npx playwright test tests/inpatient-ui.spec.ts --headed
```

---

## **🎯 RUN SPECIFIC TESTS:**

### **Login Test Only:**
```bash
npx playwright test tests/inpatient-ui.spec.ts --headed --grep "01 - Admin Login Test"
```

### **Ward Management Tests:**
```bash
npx playwright test tests/inpatient-ui.spec.ts --headed --grep "Ward Management"
```

### **Room Management Tests:**
```bash
npx playwright test tests/inpatient-ui.spec.ts --headed --grep "Room Management"
```

### **Bed Management Tests:**
```bash
npx playwright test tests/inpatient-ui.spec.ts --headed --grep "Bed Management"
```

### **Integration Test:**
```bash
npx playwright test tests/inpatient-ui.spec.ts --headed --grep "Integration"
```

---

## **📊 VIEW RESULTS:**

### **HTML Report:**
```bash
npx playwright show-report
```

### **Trace Viewer:**
```bash
npx playwright show-trace test-results/[test-folder]/trace.zip
```

---

## **🔑 LOGIN CREDENTIALS:**

```
URL: http://localhost:3000/login
Email: admin@example.com
Password: Admin@123
```

---

## **✅ WHAT GETS TESTED:**

- ✅ Admin Login (http://localhost:3000/login)
- ✅ Inpatient - Wards (Admin) - Full CRUD
- ✅ Inpatient - Rooms (Admin) - Full CRUD
- ✅ Inpatient - Beds - Full CRUD + Filters
- ✅ Complete Ward → Room → Bed Hierarchy

---

**Total Duration:** ~60-90 seconds  
**Expected Result:** All 20 tests pass ✅
