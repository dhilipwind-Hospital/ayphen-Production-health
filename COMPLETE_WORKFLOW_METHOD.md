# Complete Organization Workflow Method

## Overview
This document describes the complete patient-doctor-admin workflow in the multi-tenant hospital management system, including all organization isolation and data filtering mechanisms.

---

## 1. ORGANIZATION INITIALIZATION

### 1.1 Create New Organization
**Endpoint**: `POST /organizations`
**Request**:
```json
{
  "name": "Ishan Hospital",
  "subdomain": "ishan",
  "email": "admin@ishan.hospital",
  "phone": "+91-9876543210"
}
```

**What Happens**:
1. Organization created in `organizations` table with unique `id` (UUID)
2. Subdomain stored for multi-tenant routing (e.g., `ishan.localhost:3000`)
3. Organization admin user created with role `admin`
4. Organization context stored in request headers/subdomain

**Organization Isolation**:
- All subsequent operations filtered by `organization_id`
- No sample data loaded automatically

### 1.2 Organization Context Extraction
**Middleware**: `tenantContext` in [backend/src/middleware/tenant.middleware.ts](backend/src/middleware/tenant.middleware.ts)

```typescript
// Extracts organization from:
// 1. Request header: X-Tenant-ID
// 2. Request subdomain: ishan.localhost:3000 → extract "ishan"
// 3. User's organization_id from authentication token

(req as any).tenant = { id: organizationId }
```

---

## 2. DOCTOR ONBOARDING

### 2.1 Admin Creates Doctor Account
**Page**: [DoctorsAdminEnhanced.tsx](frontend/src/pages/admin/DoctorsAdminEnhanced.tsx)
**Flow**:

1. **Admin navigates to**: `/admin/doctors`
2. **Fills form**:
   - First Name: "John"
   - Last Name: "Smith"
   - Email: "john@hospital.com"
   - Specialization: "Cardiology"
   - Phone: "+91-9876543210"

3. **Submit to**: `POST /admin/users`
**Backend Handler**: [user.controller.ts:adminCreateUser()](backend/src/controllers/user.controller.ts)

```typescript
// Step 1: Extract organization context
const tenantId = (req as any).tenant?.id || user?.organization_id;
// Result: tenantId = "org-123-uuid"

// Step 2: Generate temporary password
const tempPassword = Math.random().toString(36).slice(2) + 'A1!';
// Result: tempPassword = "a1b2c3d4A1!"

// Step 3: Create user with organization_id
const user = await repo.save({
  firstName: "John",
  lastName: "Smith",
  email: "john@hospital.com",
  role: "doctor",
  organization_id: tenantId,  // ← CRITICAL: Organization isolation
  password: hashedPassword
});

// Step 4: Send welcome email
await EmailService.sendDoctorWelcomeEmail(
  "john@hospital.com",
  "John",
  tempPassword,
  "Ishan Hospital",
  "ishan"  // ← Organization-specific subdomain
);
```

### 2.2 Doctor Receives Welcome Email
**Email Service**: [email.service.ts:sendDoctorWelcomeEmail()](backend/src/services/email.service.ts)

**Email Template**:
```
Subject: Welcome to Ishan Hospital - Doctor Portal Access

Dear John,

Your account has been created at Ishan Hospital.

Login Details:
- Email: john@hospital.com
- Temporary Password: a1b2c3d4A1!
- Login URL: http://ishan.localhost:3000/login

Please log in and change your password immediately.

Best regards,
Ishan Hospital
```

**Key Feature**: Login URL includes organization subdomain → automatically logs into correct organization

### 2.3 Doctor Login
**Page**: [LoginNew.tsx](frontend/src/pages/LoginNew.tsx)
**Flow**:

1. **Visit**: `http://ishan.localhost:3000/login`
2. **Enter credentials**:
   - Email: john@hospital.com
   - Password: a1b2c3d4A1!
3. **Backend validates** `POST /auth/login`:

```typescript
// Find user by email AND organization
const user = await repo.findOne({
  where: {
    email: "john@hospital.com",
    organization_id: tenantId  // ← Filter by organization
  }
});

if (user && validatePassword(password)) {
  // Generate JWT token
  const token = jwt.sign({
    userId: user.id,
    role: 'doctor',
    organizationId: user.organization_id  // ← Include in token
  }, SECRET);

  return { token, user };
}
```

4. **Frontend stores token** in localStorage
5. **Frontend stores organization context** in AuthContext

---

## 3. PATIENT APPOINTMENT BOOKING

### 3.1 Patient Visits Hospital Website
**Public Page**: [BookAppointmentStepper.tsx](frontend/src/pages/appointments/BookAppointmentStepper.tsx)

**URL**: `http://ishan.localhost:3000/appointments/new`

**Flow**:

1. **Subdomain extraction**:
   ```typescript
   const subdomain = window.location.hostname.split('.')[0]; // "ishan"
   const organizationId = extractOrganizationFromSubdomain(subdomain);
   ```

2. **Fetch available doctors**:
   ```
   GET /public/doctors?organization=ishan
   ```

   **Backend Filter**:
   ```typescript
   const doctors = await repo.find({
     where: {
       role: 'doctor',
       organization_id: organizationId  // ← Filter by subdomain
     }
   });
   ```

3. **Patient fills form**:
   - Name: "Raj Kumar"
   - Email: "raj@email.com"
   - Phone: "+91-9876543210"
   - Select Doctor: "John Smith - Cardiology"
   - Select Date/Time: "2025-10-29 10:00 AM"
   - Chief Complaint: "Chest pain"

4. **Submit to**: `POST /appointments`
   **Backend Handler**: [appointment.controller.ts:createAppointment()](backend/src/controllers/appointment.controller.ts)

```typescript
// Step 1: Extract organization from subdomain/header
const organizationId = extractOrganizationId(req);

// Step 2: Validate doctor belongs to this organization
const doctor = await userRepo.findOne({
  where: {
    id: doctorId,
    organization_id: organizationId  // ← CRITICAL
  }
});

// Step 3: Create appointment with organization_id
const appointment = await appointmentRepo.save({
  patientId: patientId,
  doctorId: doctorId,
  organizationId: organizationId,  // ← CRITICAL: Link to organization
  serviceId: serviceId,
  startTime: startTime,
  endTime: endTime,
  status: 'pending',
  chiefComplaint: 'Chest pain'
});

// Step 4: Send confirmation email to patient
await EmailService.sendAppointmentConfirmation(
  patientId,
  appointment,
  organizationId
);
```

### 3.2 Patient Registration/Login
**Options**:
- **Option A**: Create patient account (register)
- **Option B**: Login if existing patient
- **Option C**: Continue as guest

**Endpoint**: `POST /auth/register` or `POST /auth/login`

```typescript
// Create patient user
const patient = await userRepo.save({
  firstName: "Raj",
  lastName: "Kumar",
  email: "raj@email.com",
  phone: "+91-9876543210",
  role: 'patient',
  organization_id: organizationId,  // ← CRITICAL: Link to organization
});

// Generate token with organization context
const token = jwt.sign({
  userId: patient.id,
  role: 'patient',
  organizationId: organizationId  // ← Include in token
}, SECRET);
```

---

## 4. RECEPTION QUEUE & TRIAGE

### 4.1 Patient Checks In at Reception
**Page**: [ReceptionQueue.tsx](frontend/src/pages/queue/ReceptionQueue.tsx)
**URL**: `/queue/reception`

**Flow**:

1. **Reception staff calls patient from waiting list**:
   ```
   POST /queue/call-next?stage=triage
   ```

   **Backend**:
   ```typescript
   // Extract organization
   const orgId = (req as any).tenant?.id;

   // Find next waiting patient in queue
   const nextPatient = await queueRepo
     .createQueryBuilder('q')
     .where('q.organization_id = :orgId', { orgId })  // ← Filter by org
     .andWhere('q.stage = :stage', { stage: 'triage' })
     .andWhere('q.status = :waiting', { waiting: 'waiting' })
     .orderBy('q.priority', 'DESC')
     .getOne();

   // Mark as called
   nextPatient.status = 'called';
   await queueRepo.save(nextPatient);
   ```

2. **QueueItem is created** when appointment is confirmed:
   ```typescript
   // In appointment confirmation
   const queueItem = await queueRepo.save({
     visitId: visit.id,
     stage: 'triage',
     status: 'waiting',
     priority: calculatePriority(appointment),
     organization_id: organizationId  // ← CRITICAL
   });
   ```

3. **Patient called to triage**:
   - Token number displayed on TV screen (for privacy)
   - Reception staff calls: "Token #001, please proceed to Triage"

### 4.2 Triage Station - Nurse Records Vitals
**Page**: [TriageStation.tsx](frontend/src/pages/queue/TriageStation.tsx)
**URL**: `/queue/triage`

**Flow**:

1. **Triage nurse opens patient record**:
   ```
   GET /triage/:visitId
   ```

   **Backend** [triage.routes.ts](backend/src/routes/triage.routes.ts):
   ```typescript
   const orgId = (req as any).tenant?.id;
   const visitId = req.params.visitId;

   // CRITICAL: Filter by organization
   const triage = await triageRepo.findOne({
     where: {
       visitId: visitId,
       organizationId: orgId  // ← Organization isolation
     }
   });
   ```

2. **Nurse records vitals**:
   - Temperature: 98.6°F
   - Blood Pressure: 120/80 mmHg
   - Heart Rate: 72 bpm
   - SpO2: 98%
   - Weight: 75 kg
   - Height: 180 cm

3. **Nurse records symptoms**:
   - Chief Complaint: "Chest pain for 2 days"
   - Symptoms: "Shortness of breath, mild fever"
   - Allergies: "Penicillin"
   - Current Medications: "Aspirin 100mg daily"
   - Pain Scale: 6/10
   - Priority: "urgent"

4. **Submit to**: `PATCH /triage/:visitId`
   **Backend**:
   ```typescript
   const orgId = (req as any).tenant?.id;
   const visitId = req.params.visitId;
   const { vitals, symptoms, allergies, currentMeds, painScale, priority } = req.body;

   // Find/create triage record with organization filter
   let triage = await triageRepo.findOne({
     where: {
       visitId: visitId,
       organizationId: orgId  // ← CRITICAL
     }
   });

   if (!triage) {
     triage = triageRepo.create({
       visitId: visitId,
       organizationId: orgId,  // ← CRITICAL
     });
   }

   // Update vitals
   triage.vitals = vitals;
   triage.symptoms = symptoms;
   triage.allergies = allergies;
   triage.currentMeds = currentMeds;
   triage.painScale = painScale;
   triage.priority = priority;

   await triageRepo.save(triage);
   ```

5. **Move to Doctor Queue**:
   ```
   POST /queue/:id/call
   ```

   Updates QueueItem:
   ```typescript
   await queueItemRepo.update(
     { id: queueItem.id, organization_id: orgId },  // ← Filter by org
     { stage: 'doctor', status: 'waiting' }
   );
   ```

---

## 5. DOCTOR CONSULTATION

### 5.1 Doctor Logs In
**Similar to 2.3 Doctor Login**

### 5.2 Doctor Views Patient Queue
**Page**: [DoctorQueueView]
**URL**: `/queue/doctor`

**Flow**:

1. **Fetch patients waiting for doctor**:
   ```
   GET /queue?stage=doctor&doctorId=doctor-123
   ```

   **Backend**:
   ```typescript
   const orgId = (req as any).tenant?.id;
   const doctorId = (req as any).user.id;

   const queueItems = await queueRepo
     .createQueryBuilder('q')
     .where('q.organization_id = :orgId', { orgId })  // ← Filter by org
     .andWhere('q.stage = :stage', { stage: 'doctor' })
     .andWhere('q.assigned_doctor_id = :doctorId OR q.assigned_doctor_id IS NULL',
       { doctorId })
     .leftJoinAndSelect('q.visit', 'v')
     .leftJoinAndSelect('v.patient', 'p')
     .leftJoinAndSelect('v.triage', 't')
     .orderBy('q.priority', 'DESC')
     .getMany();
   ```

2. **Doctor calls next patient**:
   ```
   POST /queue/call-next?stage=doctor&doctorId=doctor-123
   ```

3. **Doctor views patient record with triage data**:
   - Patient vitals (from triage)
   - Symptoms & chief complaint (from triage)
   - Allergies (from triage)
   - Current medications (from triage)
   - Pain scale (from triage)
   - Previous medical history

### 5.3 Doctor Creates Prescription
**Page**: [WritePrescription.tsx](frontend/src/pages/doctor/WritePrescription.tsx)
**URL**: `/doctor/write-prescription/:patientId`

**Flow**:

1. **Doctor fills prescription form**:
   - Patient: "Raj Kumar"
   - Diagnosis: "Acute coronary syndrome"
   - Notes: "Monitor chest pain, follow up in 3 days"
   - Add medicines:
     - Medicine: "Aspirin"
     - Dosage: "500mg"
     - Frequency: "Twice daily"
     - Duration: "7 days"
     - Quantity: "14 tablets"
     - Instructions: "Take after meals"

2. **Submit to**: `POST /pharmacy/prescriptions`
   **Backend Handler**: [prescription.controller.ts:createPrescription()](backend/src/controllers/pharmacy/prescription.controller.ts)

```typescript
const { patientId, items, diagnosis, notes } = req.body;
const doctorId = (req as any).user?.id;
const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

// Step 1: Validate organization context
if (!tenantId) {
  return res.status(400).json({ message: 'Organization context required' });
}

// Step 2: Start transaction
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.startTransaction();

try {
  const prescriptionRepo = queryRunner.manager.getRepository(Prescription);

  // Step 3: Create prescription with organization_id
  const prescription = prescriptionRepo.create({
    doctorId: doctorId,
    patientId: patientId,
    prescriptionDate: new Date(),
    diagnosis: diagnosis,
    notes: notes,
    status: 'pending',
    organizationId: tenantId  // ← CRITICAL: Link to organization
  });

  const savedPrescription = await prescriptionRepo.save(prescription);

  // Step 4: Create prescription items
  const prescriptionItemRepo = queryRunner.manager.getRepository(PrescriptionItem);
  const medicineRepo = queryRunner.manager.getRepository(Medicine);

  const savedItems = [];
  for (const item of items) {
    // CRITICAL: Validate medicine belongs to this organization
    const medicine = await medicineRepo.findOne({
      where: {
        id: item.medicineId,
        organizationId: tenantId  // ← Organization filter
      }
    });

    if (!medicine) {
      throw new Error(`Medicine not found`);
    }

    // Create prescription item
    const prescriptionItem = prescriptionItemRepo.create({
      prescriptionId: savedPrescription.id,
      medicineId: item.medicineId,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
      quantity: item.quantity,
      status: 'pending',
      organizationId: tenantId  // ← CRITICAL
    });

    const savedItem = await prescriptionItemRepo.save(prescriptionItem);
    savedItems.push(savedItem);
  }

  // Step 5: Commit transaction
  await queryRunner.commitTransaction();

  // Step 6: Send notification emails
  const patient = await userRepo.findOne({
    where: {
      id: patientId,
      organizationId: tenantId  // ← Organization filter
    }
  });

  if (patient) {
    await EmailService.sendPrescriptionNotificationEmail(
      patient.email,
      patient.firstName,
      doctorFirstName
    );
  }

  return res.status(201).json({
    message: 'Prescription created successfully',
    prescription: { ...savedPrescription, items: savedItems }
  });

} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### 5.4 Doctor Orders Lab Tests
**Page**: [OrderLabTest.tsx](frontend/src/pages/laboratory/OrderLabTest.tsx)
**URL**: `/laboratory/order-test/:patientId`

**Flow**:

1. **Doctor selects lab tests**:
   - ECG (Electrocardiogram)
   - Troponin Test
   - Full Blood Count (CBC)
   - Lipid Profile

2. **Submit to**: `POST /lab-orders`
   **Backend Handler**: [lab-order.controller.ts:createLabOrder()](backend/src/controllers/lab-order.controller.ts)

```typescript
const { patientId, tests, clinicalNotes, diagnosis, isUrgent } = req.body;
const doctorId = (req as any).user.id;
const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

// Step 1: Validate organization
if (!orgId) {
  return res.status(400).json({ message: 'Organization context required' });
}

// Step 2: Create tenant repositories (filters by organization)
const labOrderTenantRepo = createTenantRepository(
  AppDataSource.getRepository(LabOrder),
  orgId  // ← All operations filtered by orgId
);

// Step 3: Generate order number
const orderNumber = await generateOrderNumber(orgId);
// Result: "LAB-2025-0001"

// Step 4: Create lab order with organization_id
const labOrder = await labOrderTenantRepo.save({
  orderNumber: orderNumber,
  doctorId: doctorId,
  patientId: patientId,
  orderDate: new Date(),
  clinicalNotes: clinicalNotes,
  diagnosis: diagnosis,
  isUrgent: isUrgent || false,
  status: 'ordered',
  organizationId: orgId  // ← CRITICAL
});

// Step 5: Create order items
const labOrderItemTenantRepo = createTenantRepository(
  AppDataSource.getRepository(LabOrderItem),
  orgId
);

const labTestTenantRepo = createTenantRepository(
  AppDataSource.getRepository(LabTest),
  orgId
);

for (const testId of tests) {
  // Validate test belongs to organization
  const test = await labTestTenantRepo.findOne({ where: { id: testId } });

  if (test) {
    const item = await labOrderItemTenantRepo.save({
      labOrderId: labOrder.id,
      labTestId: testId,
      status: 'ordered',
      organizationId: orgId  // ← CRITICAL
    });
  }
}

return res.status(201).json(labOrder);
```

---

## 6. PHARMACY OPERATIONS

### 6.1 Pharmacist Views Pending Prescriptions
**Page**: [PharmacyDashboard.tsx](frontend/src/pages/PharmacyDashboard.tsx)
**URL**: `/pharmacy`

**Flow**:

1. **Pharmacist logs in**:
   ```
   POST /auth/login
   ```
   Email: pharmacist@hospital.com
   Role: pharmacist
   Organization: ishan

2. **Fetch pending prescriptions**:
   ```
   GET /pharmacy/prescriptions/pending
   ```

   **Backend**:
   ```typescript
   const tenantId = (req as any).tenant?.id;

   const prescriptions = await prescriptionRepo.findAndCount({
     where: {
       status: 'pending',
       organizationId: tenantId  // ← CRITICAL: Filter by organization
     },
     relations: ['doctor', 'patient', 'items', 'items.medicine'],
     order: { prescriptionDate: 'ASC' }
   });
   ```

3. **Pharmacist dispenses prescription**:
   - Check medicine stock
   - Verify dosage and quantity
   - Prepare medicines
   - Label and package

4. **Mark as dispensed**:
   ```
   PUT /pharmacy/prescriptions/:id/status
   ```

   **Backend**:
   ```typescript
   const prescriptionRepo = queryRunner.manager.getRepository(Prescription);

   // CRITICAL: Filter by organization
   const prescription = await prescriptionRepo.findOne({
     where: {
       id: prescriptionId,
       organizationId: tenantId
     }
   });

   // Update prescription item status
   const item = await itemRepo.findOne({
     where: { id: itemId }
   });
   item.status = 'dispensed';
   await itemRepo.save(item);

   // Update medicine stock
   const medicine = await medicineRepo.findOne({
     where: {
       id: item.medicineId,
       organizationId: tenantId  // ← Organization filter
     }
   });

   medicine.currentStock -= item.quantity;
   await medicineRepo.save(medicine);

   // Create medicine transaction for inventory tracking
   const transaction = medicineTransactionRepo.create({
     medicineId: medicine.id,
     transactionType: 'SALE',
     quantity: item.quantity,
     transactionDate: new Date(),
     reference: `Prescription: ${prescription.id}`,
     organizationId: tenantId  // ← CRITICAL
   });

   await medicineTransactionRepo.save(transaction);
   ```

---

## 7. LABORATORY OPERATIONS

### 7.1 Lab Technician Views Pending Orders
**Page**: [SampleCollection.tsx](frontend/src/pages/laboratory/SampleCollection.tsx)
**URL**: `/laboratory/sample-collection`

**Flow**:

1. **Lab technician logs in**:
   ```
   POST /auth/login
   ```
   Email: labtech@hospital.com
   Role: lab_technician
   Organization: ishan

2. **Fetch pending lab orders**:
   ```
   GET /lab-orders/pending
   ```

   **Backend**:
   ```typescript
   const orgId = (req as any).tenant?.id;

   const orders = await labOrderRepo
     .createQueryBuilder('order')
     .where('order.organizationId = :orgId', { orgId })  // ← CRITICAL
     .andWhere('order.status IN (:...statuses)', {
       statuses: ['ordered', 'sample_collected', 'in_progress']
     })
     .orderBy('order.isUrgent', 'DESC')
     .addOrderBy('order.createdAt', 'ASC')
     .getMany();
   ```

3. **Technician collects sample**:
   - Call patient by token number
   - Collect blood sample (for blood tests)
   - Document sample collection
   - Create sample record

4. **Update order status**:
   ```
   PATCH /lab-orders/:id/status
   ```
   Status: `sample_collected`

5. **Lab technician performs tests** and enters results:
   ```
   POST /lab-results
   ```

   **Backend**:
   ```typescript
   const labResultRepo = queryRunner.manager.getRepository(LabResult);

   const result = labResultRepo.create({
     labOrderItemId: orderItemId,
     value: '120 mg/dL',
     unit: 'mg/dL',
     referenceRange: '70-100 mg/dL',
     status: 'abnormal',
     notes: 'Slightly elevated',
     organizationId: tenantId  // ← CRITICAL
   });
   ```

6. **Update order status**:
   ```
   PATCH /lab-orders/:id/status
   ```
   Status: `completed`

---

## 8. ADMIN MONITORING

### 8.1 Admin Views All Appointments
**Page**: [AppointmentsAdmin.tsx](frontend/src/pages/admin/AppointmentsAdmin.tsx)
**URL**: `/admin/appointments`

**Backend** [appointment.controller.ts:getAdminAppointments()](backend/src/controllers/appointment.controller.ts):

```typescript
const tenantId = (req as any).tenant?.id;
const { page, limit, status, doctorId, patientId, departmentId } = req.query;

// CRITICAL: Filter all appointments by organization
const [appointments, total] = await appointmentRepo.findAndCount({
  where: {
    organizationId: tenantId,  // ← CRITICAL
    status: status ? status : undefined,
    doctorId: doctorId ? doctorId : undefined,
    patientId: patientId ? patientId : undefined,
    departmentId: departmentId ? departmentId : undefined
  },
  relations: ['patient', 'doctor', 'service', 'department'],
  skip: (page - 1) * limit,
  take: limit,
  order: { createdAt: 'DESC' }
});

return res.json({
  data: appointments,
  meta: { total, page, totalPages: Math.ceil(total / limit) }
});
```

### 8.2 Admin Views All Prescriptions
**Page**: [PrescriptionsAdmin.tsx](frontend/src/pages/admin/PrescriptionsAdmin.tsx)
**URL**: `/admin/prescriptions`

**Backend** [prescription.controller.ts:getPendingPrescriptions()](backend/src/controllers/pharmacy/prescription.controller.ts):

```typescript
const tenantId = (req as any).tenant?.id;
const { page = 1, limit = 10, status } = req.query;

const prescriptionRepo = AppDataSource.getRepository(Prescription);

// CRITICAL: Filter all prescriptions by organization
const [prescriptions, total] = await prescriptionRepo.findAndCount({
  where: {
    organizationId: tenantId,  // ← CRITICAL
    status: status ? status : undefined
  },
  relations: ['doctor', 'patient', 'items', 'items.medicine'],
  skip: (Number(page) - 1) * Number(limit),
  take: Number(limit),
  order: { prescriptionDate: 'DESC' }
});

return res.json({
  prescriptions: prescriptions,
  meta: {
    page: Number(page),
    limit: Number(limit),
    total: total,
    totalPages: Math.ceil(total / Number(limit))
  }
});
```

### 8.3 Admin Views All Lab Orders
**Page**: [LabOrdersAdmin.tsx](frontend/src/pages/admin/LabOrdersAdmin.tsx)
**URL**: `/admin/lab-orders`

**Backend** [lab-order.controller.ts:getAllLabOrders()](backend/src/controllers/lab-order.controller.ts):

```typescript
const orgId = (req as any).tenant?.id;
const { page = 1, limit = 20, status = '' } = req.query;

// Create tenant repository - all operations filtered by organization
const labOrderTenantRepo = createTenantRepository(
  AppDataSource.getRepository(LabOrder),
  orgId  // ← CRITICAL: All queries filtered by orgId
);

const whereConditions: any = {};
if (status) {
  whereConditions.status = status;
}

const [orders, total] = await labOrderTenantRepo.findAndCount({
  where: whereConditions,
  relations: ['doctor', 'patient', 'items', 'items.labTest'],
  order: { createdAt: 'DESC' },
  skip: (Number(page) - 1) * Number(limit),
  take: Number(limit)
});

return res.json({
  orders: orders,
  total: total,
  page: Number(page),
  totalPages: Math.ceil(total / Number(limit))
});
```

---

## 9. COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      PATIENT JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. APPOINTMENT BOOKING
   Patient → BookAppointmentStepper.tsx
   ↓
   Organization extracted from subdomain: "ishan"
   ↓
   POST /appointments
   Backend: Create Appointment with organization_id = "ishan-org-id"
   ↓
   Create QueueItem with organization_id = "ishan-org-id"
   ↓
   Send confirmation email

2. RECEPTION & TRIAGE
   Reception → ReceptionQueue.tsx
   ↓
   POST /queue/call-next?stage=triage
   Backend: Filter QueueItems by organization_id
   ↓
   Triage Nurse → TriageStation.tsx
   ↓
   PATCH /triage/:visitId
   Backend: Create/Update Triage with organization_id
   ↓
   POST /queue/call?stage=doctor

3. DOCTOR CONSULTATION
   Doctor → DoctorQueueView
   ↓
   GET /queue?stage=doctor&doctorId=X
   Backend: Filter QueueItems by organization_id AND doctorId
   ↓
   POST /queue/call-next?stage=doctor
   ↓
   Doctor views patient with triage data

4. PRESCRIPTION & LAB ORDERS
   Doctor → WritePrescription.tsx
   ↓
   POST /pharmacy/prescriptions
   Backend: Create Prescription with organization_id
   ↓
   Doctor → OrderLabTest.tsx
   ↓
   POST /lab-orders
   Backend: Create LabOrder with organization_id

5. PHARMACY OPERATIONS
   Pharmacist → PharmacyDashboard.tsx
   ↓
   GET /pharmacy/prescriptions/pending
   Backend: Filter Prescriptions by organization_id
   ↓
   PUT /pharmacy/prescriptions/:id/status
   Backend: Update status + medicine stock (organization filtered)

6. LABORATORY OPERATIONS
   Lab Tech → SampleCollection.tsx
   ↓
   GET /lab-orders/pending
   Backend: Filter LabOrders by organization_id
   ↓
   POST /lab-results
   Backend: Create LabResult with organization_id

7. ADMIN MONITORING
   Admin → /admin/appointments
   GET /appointments/admin
   Backend: Show all appointments WHERE organization_id = admin's org
   ↓
   Admin → /admin/prescriptions
   GET /pharmacy/prescriptions/admin
   Backend: Show all prescriptions WHERE organization_id = admin's org
   ↓
   Admin → /admin/lab-orders
   GET /lab-orders/admin
   Backend: Show all lab orders WHERE organization_id = admin's org

```

---

## 10. ORGANIZATION ISOLATION - CRITICAL CHECKS

### At Every Step:
1. ✅ Extract organization from:
   - Request subdomain (frontend)
   - Tenant context middleware (backend)
   - Authenticated user's organization_id (backend)

2. ✅ Validate ownership:
   ```typescript
   WHERE organization_id = :orgId
   ```

3. ✅ Prevent cross-organization access:
   - Doctor from Org A cannot access patients from Org B
   - Pharmacist from Org A cannot see prescriptions from Org B
   - Lab tech from Org A cannot access orders from Org B

4. ✅ Filter relationships:
   - Users filtered by organization
   - Medicines filtered by organization
   - Lab tests filtered by organization
   - Departments filtered by organization
   - Services filtered by organization

---

## 11. API ENDPOINTS ORGANIZATION FILTERING

| Module | Endpoint | Organization Filter |
|--------|----------|-------------------|
| **Appointments** | GET /appointments/admin | WHERE organization_id = :tenantId |
| **Appointments** | POST /appointments | organizationId = tenantId |
| **Prescriptions** | GET /pharmacy/prescriptions/admin | WHERE organizationId = :tenantId |
| **Prescriptions** | POST /pharmacy/prescriptions | organizationId = tenantId |
| **Lab Orders** | GET /lab-orders/admin | Tenant repository filters |
| **Lab Orders** | POST /lab-orders | organizationId = tenantId |
| **Queue** | GET /queue | WHERE organization_id = :orgId |
| **Queue** | POST /queue/call-next | WHERE organization_id = :orgId |
| **Triage** | GET /triage/:visitId | WHERE organizationId = :orgId |
| **Triage** | PATCH /triage/:visitId | organizationId = :orgId |
| **Users** | GET /users | WHERE organization_id = :tenantId |
| **Users** | POST /admin/users | organization_id = tenantId |
| **Medicines** | GET /pharmacy/medicines | WHERE organization_id = :tenantId |
| **Lab Tests** | GET /lab-tests | Tenant repository filters |

---

## 12. MULTI-TENANT ROUTING

### Frontend Subdomain Routing:
```
ishan.localhost:3000/appointments/new
  ↓
Extract "ishan" from URL
  ↓
Get organizationId from subdomain
  ↓
All API calls include organization context
```

### Backend Tenant Context:
```typescript
// Middleware automatically extracts:
// 1. X-Tenant-ID header
// 2. Subdomain from request
// 3. User's organization_id from JWT token

// Then sets:
(req as any).tenant = { id: organizationId }
```

---

## 13. SUMMARY

**Key Principle**: **Every database query filters by organization_id**

```typescript
// Pattern used throughout:
await repository.find({
  where: {
    organizationId: tenantId,  // ← ALWAYS included
    // ... other conditions
  }
});
```

This ensures:
- Hospital A data never visible to Hospital B
- Doctor A can only manage his organization's patients
- Admin A can only monitor his organization's operations
- Complete data isolation between organizations

---

## File References

- [Hospital Workflow Diagram](COMPLETE_WORKFLOW_METHOD.md)
- [Triage Routes](backend/src/routes/triage.routes.ts)
- [Appointment Controller](backend/src/controllers/appointment.controller.ts)
- [Prescription Controller](backend/src/controllers/pharmacy/prescription.controller.ts)
- [Lab Order Controller](backend/src/controllers/lab-order.controller.ts)
- [Queue Routes](backend/src/routes/queue.routes.ts)
- [Appointments Admin Page](frontend/src/pages/admin/AppointmentsAdmin.tsx)
- [Prescriptions Admin Page](frontend/src/pages/admin/PrescriptionsAdmin.tsx)
- [Lab Orders Admin Page](frontend/src/pages/admin/LabOrdersAdmin.tsx)
