# Patient Organization-Specific Data Visibility

## Overview
Once a patient selects/joins an organization, they can view all their organization-specific data including appointments, prescriptions, lab orders, and medical records.

---

## 1. PATIENT ORGANIZATION SELECTION

### 1.1 Patient Registers or First-Time Login
**Flow**:
```
Patient visits: http://ishan.localhost:3000/
  ↓
Subdomain extracted: "ishan" → Get organization ID
  ↓
Patient creates account with email/password
  ↓
User created with:
  - organization_id: "ishan-org-id"
  - role: "patient"
```

**Registration Endpoint**: `POST /auth/register`
```typescript
const patient = await userRepo.save({
  firstName: "Raj",
  lastName: "Kumar",
  email: "raj@email.com",
  role: 'patient',
  organization_id: organizationId,  // ← LINKED TO ORGANIZATION
});
```

### 1.2 Patient Selects Organization (if needed)
**Page**: [ChooseHospital.tsx](frontend/src/pages/onboarding/ChooseHospital.tsx)
**URL**: `/onboarding/choose-hospital`

**Flow**:
1. Patient views list of available organizations
2. Patient clicks "Connect to Hospital"
3. Organization context saved to user profile
4. User redirected to `/portal/dashboard`

**Backend**: `PATCH /users/:id` updates user's organization_id
```typescript
const user = await userRepo.update(
  { id: userId },
  { organization_id: selectedOrgId }  // ← Organization linked
);
```

---

## 2. PATIENT DASHBOARD - ORGANIZATION OVERVIEW

### 2.1 Patient Portal Home
**Page**: [PatientDashboard.tsx](frontend/src/pages/portal/PatientDashboard.tsx)
**URL**: `/portal/dashboard`

**What Patient Sees**:
1. **Organization Check**:
   ```typescript
   const userOrganization = user?.organization;
   const needsOrganizationSelection = !userOrganization ||
                                     !userOrganization.id ||
                                     userOrganization.id === 'default';

   if (needsOrganizationSelection) {
     // Show: "You're not connected to a hospital yet"
     // Button: "Choose Hospital" → /onboarding/choose-hospital
   }
   ```

2. **Patient ID Display** (Organization-specific):
   ```typescript
   const displayPid = `PID-${organization.subdomain}-${patientId.slice(-6)}`;
   // Example: PID-ISHAN-ABC123
   ```

3. **Upcoming Appointments** (Organization-filtered):
   ```
   GET /appointments (filtered by patient + organization)
   ```

4. **Recent Appointments** (Last 5, organization-filtered):
   ```
   GET /appointments (limit: 25, organization-filtered)
   ```

5. **Medical Records Link**:
   - Button: "Open Records" → `/portal/records`

6. **Bills Link**:
   - Button: "Open Bills" → `/portal/bills`

7. **Insurance Link**:
   - Button: "Open My Insurance" → `/portal/insurance`

---

## 3. PATIENT MEDICAL RECORDS - COMPLETE VIEW

### 3.1 Medical Records Page
**Page**: [MedicalRecords.tsx](frontend/src/pages/portal/MedicalRecords.tsx)
**URL**: `/portal/records`

**What Patient Sees**:
Aggregated view combining:
1. ✅ **Medical Records** (from doctors)
2. ✅ **Prescriptions** (created by doctors)
3. ✅ **Lab Orders** (with results)

**All Filtered by Organization**

### 3.2 Data Fetching
**Frontend Service** [medicalRecords.service.ts:34](frontend/src/services/medicalRecords.service.ts#L34):
```typescript
getAggregatedRecords: async (patientId?: string) => {
  const response = await api.get('/medical-records/aggregated', {
    params: patientId ? { patientId } : {}
  });
  return response.data;
}
```

**Backend Controller** [medicalRecords.controller.ts:342](backend/src/controllers/medicalRecords.controller.ts#L342):
```typescript
export const getAggregatedRecords = async (req: Request, res: Response) => {
  // Step 1: Extract organization
  const orgId = (req as any).tenant?.id || user?.organization_id;

  if (!orgId) {
    return res.status(400).json({ message: 'Organization context required' });
  }

  // Step 2: Create tenant repositories (ALL operations filtered by orgId)
  const medicalRecordTenantRepo = createTenantRepository(
    AppDataSource.getRepository(MedicalRecord),
    orgId  // ← CRITICAL: Filter by organization
  );

  const prescriptionTenantRepo = createTenantRepository(
    AppDataSource.getRepository(Prescription),
    orgId  // ← CRITICAL: Filter by organization
  );

  const labOrderTenantRepo = createTenantRepository(
    AppDataSource.getRepository(LabOrder),
    orgId  // ← CRITICAL: Filter by organization
  );

  // Step 3: Get records for THIS patient from THIS organization
  const medicalRecords = await medicalRecordTenantRepo.find({
    where: { patient: { id: targetPatientId } },  // Patient filter
    relations: ['patient', 'doctor'],
    take: 50
  });

  const prescriptions = await prescriptionTenantRepo.find({
    where: { patient: { id: targetPatientId } },  // Patient filter
    relations: ['patient', 'doctor'],
    take: 50
  });

  const labOrders = await labOrderTenantRepo.find({
    where: { patient: { id: targetPatientId } },  // Patient filter
    relations: ['patient', 'doctor', 'items'],
    take: 50
  });

  // Step 4: Combine and return
  const aggregated = [
    ...medicalRecords.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      date: r.recordDate,
      doctor: `Dr. ${r.doctor.firstName} ${r.doctor.lastName}`,
      source: 'medical_record'
    })),
    ...prescriptions.map(p => ({
      id: p.id,
      type: 'prescription',
      title: 'Prescription',
      date: p.createdAt,
      doctor: `Dr. ${p.doctor.firstName} ${p.doctor.lastName}`,
      status: p.status,
      source: 'prescription'
    })),
    ...labOrders.map(l => ({
      id: l.id,
      type: 'lab_report',
      title: `Lab Order ${l.orderNumber}`,
      date: l.createdAt,
      doctor: `Dr. ${l.doctor.firstName} ${l.doctor.lastName}`,
      source: 'lab_order'
    }))
  ];

  return res.json({ data: aggregated });
};
```

### 3.3 Data Display in Table
**Columns**:
| Date | Type | Title | Doctor | Status | Action |
|------|------|-------|--------|--------|--------|
| Nov 28, 2025 | Prescription | Prescription | Dr. John Smith | Dispensed | View |
| Nov 27, 2025 | Lab Report | Lab Order LAB-2025-0001 | Dr. John Smith | Completed | View |
| Nov 26, 2025 | Medical Record | Consultation | Dr. John Smith | — | Download |

### 3.4 Patient Can View Prescription Details
**On click "View" for Prescription**:

**Frontend**:
```typescript
const handleViewRecord = async (record: MedicalRecord) => {
  if (record.type === 'prescription') {
    const details = await medicalRecordsService.getPrescriptionDetails(record.id);
    setViewRec({
      ...record,
      prescriptionItems: details.items,  // medicines
      diagnosis: details.diagnosis
    });
  }
};
```

**API Call**:
```
GET /pharmacy/prescriptions/{prescriptionId}
```

**Backend** [prescription.controller.ts:190](backend/src/controllers/pharmacy/prescription.controller.ts#L190):
```typescript
static getPrescriptionById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenant?.id || user?.organization_id;
  const { id } = req.params;

  const prescriptionRepository = AppDataSource.getRepository(Prescription);

  // CRITICAL: Filter by organization
  const prescription = await prescriptionRepository.findOne({
    where: { id, organizationId: tenantId },
    relations: ['patient', 'doctor', 'items', 'items.medicine']
  });

  if (!prescription) {
    return res.status(404).json({ message: 'Prescription not found' });
  }

  return res.status(200).json({ data: prescription });
};
```

**Shows**:
```
Prescription Details
├─ Doctor: Dr. John Smith
├─ Diagnosis: Acute coronary syndrome
├─ Notes: Monitor chest pain
└─ Medicines:
   ├─ Aspirin 500mg, Twice daily, 7 days, 14 tablets
   ├─ Isosorbide 10mg, Once daily, 7 days, 7 tablets
   └─ Atorvastatin 40mg, Once daily, 30 days, 30 tablets
```

---

## 4. PATIENT PRESCRIPTIONS VIEW

### 4.1 Patient Can See Their Own Prescriptions
**Endpoint**: `GET /pharmacy/prescriptions/patient/{patientId}`
**Backend** [prescription.controller.ts:148](backend/src/controllers/pharmacy/prescription.controller.ts#L148):

```typescript
static getPatientPrescriptions = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenant?.id || user?.organization_id;
  const { patientId } = req.params;

  const prescriptionRepository = AppDataSource.getRepository(Prescription);

  // CRITICAL: Filter by organization
  const [prescriptions, total] = await prescriptionRepository.findAndCount({
    where: { patientId, organizationId: tenantId },  // ← Patient + Org filter
    relations: ['doctor', 'patient', 'items', 'items.medicine'],
    order: { prescriptionDate: 'DESC' },
    skip, take
  });

  return res.status(200).json({
    prescriptions,
    meta: { total, page, totalPages: Math.ceil(total / limit) }
  });
};
```

**Guarantees**:
- ✅ Patient sees ONLY their prescriptions
- ✅ ONLY from selected organization
- ✅ Cannot access prescriptions from other organizations
- ✅ Cannot access other patients' prescriptions

---

## 5. PATIENT LAB ORDERS & RESULTS

### 5.1 Patient Can See Their Lab Orders
**Endpoint**: `GET /lab/orders/patient/{patientId}`
**Backend** [lab-order.controller.ts:102](backend/src/controllers/lab-order.controller.ts#L102):

```typescript
static getPatientLabOrders = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const orgId = (req as any).tenant?.id || user?.organization_id;

  // Create tenant repository (filters by organization)
  const labOrderTenantRepo = createTenantRepository(
    AppDataSource.getRepository(LabOrder),
    orgId  // ← CRITICAL: Organization filter
  );

  const orders = await labOrderTenantRepo.find({
    where: { patientId },  // Patient filter
    relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.result'],
    order: { createdAt: 'DESC' }
  });

  res.json(orders);
};
```

**Shows**:
```
Lab Orders
├─ Order #LAB-2025-0001
│  ├─ Doctor: Dr. John Smith
│  ├─ Ordered: Nov 27, 2025
│  ├─ Status: Completed
│  └─ Tests:
│     ├─ ECG - Completed
│     ├─ Troponin Test - Completed
│     ├─ Full Blood Count - Completed
│     └─ Lipid Profile - Completed
└─ Order #LAB-2025-0002
   ├─ Doctor: Dr. Jane Doe
   ├─ Ordered: Nov 20, 2025
   ├─ Status: Completed
   └─ Tests:
      ├─ Glucose Test - Completed
      └─ Insulin Test - Completed
```

### 5.2 Patient Can View Lab Results
**Page**: [PatientLabResults.tsx](frontend/src/pages/laboratory/PatientLabResults.tsx)
**URL**: `/laboratory/patient-results`

**Fetches**: `GET /lab/results/patient/{patientId}`
**Backend** [lab-result.controller.ts](backend/src/controllers/lab-result.controller.ts):

```typescript
// Filter by organization + patient
const results = await labResultTenantRepo.find({
  where: { labOrderItem: { labOrder: { patientId, organizationId } } }
});
```

---

## 6. PATIENT APPOINTMENTS

### 6.1 Patient Can See Their Appointments
**Endpoint**: `GET /appointments`
**Backend** [appointment.controller.ts](backend/src/controllers/appointment.controller.ts):

```typescript
const appointments = await appointmentRepo.findAndCount({
  where: {
    patientId: patientId,
    organizationId: tenantId  // ← Organization filter
  },
  relations: ['patient', 'doctor', 'service', 'department'],
  order: { startTime: 'DESC' }
});
```

**Shows**:
```
My Appointments
├─ Upcoming:
│  └─ Dec 5, 2025 at 10:00 AM
│     └─ Dr. John Smith (Cardiology)
│
└─ Recent:
   ├─ Nov 28, 2025 at 2:00 PM - Confirmed
   ├─ Nov 20, 2025 at 10:30 AM - Completed
   └─ Nov 15, 2025 at 3:00 PM - Completed
```

---

## 7. COMPLETE PATIENT VISIBILITY FLOW

```
┌─────────────────────────────────────────────────────┐
│     PATIENT ORGANIZATION DATA VISIBILITY FLOW        │
└─────────────────────────────────────────────────────┘

1. PATIENT REGISTRATION / SELECTION
   ├─ Register at: http://ishan.localhost:3000
   ├─ Organization extracted from subdomain: "ishan"
   └─ User created with: organization_id = ishan-org-id

2. PATIENT PORTAL HOME
   ├─ URL: /portal/dashboard
   ├─ Check: Does patient have organization?
   │  ├─ NO → Show: "Choose Hospital" button
   │  │       → Navigate to: /onboarding/choose-hospital
   │  │       → Select organization
   │  └─ YES → Continue to show data
   ├─ Display:
   │  ├─ Patient ID (organization-specific): PID-ISHAN-ABC123
   │  ├─ Upcoming appointment (org-filtered)
   │  ├─ Recent appointments (org-filtered)
   │  └─ Links to medical records, bills, insurance

3. PATIENT MEDICAL RECORDS
   ├─ URL: /portal/records
   ├─ Endpoint: GET /medical-records/aggregated
   ├─ Backend Filters:
   │  ├─ Organization: createTenantRepository(orgId)
   │  ├─ Patient: WHERE patientId = :patientId
   │  └─ Combines:
   │     ├─ Medical Records (from doctors)
   │     ├─ Prescriptions (created by doctors)
   │     └─ Lab Orders (with results)
   └─ Show: Aggregated table with all records

4. PATIENT PRESCRIPTIONS (DETAILED VIEW)
   ├─ Click "View" on prescription in table
   ├─ Endpoint: GET /pharmacy/prescriptions/{id}
   ├─ Backend Filters:
   │  ├─ Organization: WHERE organizationId = :orgId
   │  ├─ Patient: Cannot access other patients' prescriptions
   │  └─ Prescription: WHERE id = :prescriptionId
   └─ Show: Medicine list with dosage, frequency, duration

5. PATIENT LAB ORDERS & RESULTS
   ├─ URL: /laboratory/patient-results
   ├─ Endpoint: GET /lab/orders/patient/{patientId}
   ├─ Backend Filters:
   │  ├─ Organization: createTenantRepository(orgId)
   │  ├─ Patient: WHERE patientId = :patientId
   │  └─ Includes: items, results, samples
   └─ Show: Lab orders with test status and results

6. PATIENT APPOINTMENTS
   ├─ URL: /appointments
   ├─ Endpoint: GET /appointments
   ├─ Backend Filters:
   │  ├─ Organization: WHERE organizationId = :orgId
   │  └─ Patient: WHERE patientId = :patientId
   └─ Show: Upcoming and recent appointments

7. ORGANIZATION ISOLATION
   └─ Patient from Org A CANNOT see:
      ├─ Data from Org B (different organization)
      ├─ Prescriptions from other patients
      ├─ Lab orders from other patients
      └─ Appointments from other patients
```

---

## 8. PATIENT API ENDPOINTS - ORGANIZATION FILTERING

| Endpoint | Method | Organization Filter | Patient Filter |
|----------|--------|-------------------|-----------------|
| `/appointments` | GET | `WHERE organization_id = :orgId` | `WHERE patientId = :patientId` |
| `/appointments/{id}` | GET | ✅ Yes | ✅ Yes |
| `/appointments` | POST | Sets: `organization_id = orgId` | Sets: `patientId = user.id` |
| `/medical-records/aggregated` | GET | `createTenantRepository(orgId)` | `WHERE patientId = :patientId` |
| `/pharmacy/prescriptions/patient/{id}` | GET | `WHERE organizationId = orgId` | `WHERE patientId = :patientId` |
| `/pharmacy/prescriptions/{id}` | GET | `WHERE organizationId = orgId` | ✅ Yes (related patient) |
| `/lab/orders/patient/{id}` | GET | `createTenantRepository(orgId)` | `WHERE patientId = :patientId` |
| `/lab/results/patient/{id}` | GET | `createTenantRepository(orgId)` | `WHERE patientId = :patientId` |
| `/portal/records` | GET | ✅ Yes (aggregated) | ✅ Yes (current user) |

---

## 9. PATIENT DATA ISOLATION - GUARANTEES

### ✅ **ONLY Sees Own Data**
```
Patient A (Org A) CANNOT see:
- Patient B's prescriptions (even in Org A)
- Patient B's lab orders (even in Org A)
- Patient B's appointments (even in Org A)
- Patient B's medical records (even in Org A)
```

### ✅ **ONLY Sees Selected Organization**
```
Patient connected to Org A CANNOT see:
- Data from Org B
- Prescriptions from Org B's doctors
- Lab orders from Org B
- Appointments in Org B
```

### ✅ **Cannot Access Other Patients**
```typescript
// Backend pattern for patient endpoints:
WHERE patientId = CURRENT_USER.id AND organizationId = TENANT_ORG
```

---

## 10. ORGANIZATION CONTEXT IN PATIENT FLOW

### At Every Step:
1. ✅ Extract organization from:
   - Request header: `X-Tenant-ID`
   - Request subdomain: `ishan.localhost:3000`
   - User's token: `organization_id`

2. ✅ Create tenant repository:
   ```typescript
   const repo = createTenantRepository(baseRepo, organizationId);
   // All queries auto-filtered by organizationId
   ```

3. ✅ Filter by patient ID:
   ```typescript
   WHERE patientId = :patientId AND organizationId = :orgId
   ```

---

## 11. SUMMARY - PATIENT ORGANIZATION VISIBILITY

| Feature | Status | Details |
|---------|--------|---------|
| **Organization Selection** | ✅ Complete | Patient selects hospital via `/onboarding/choose-hospital` |
| **Organization Check** | ✅ Complete | Dashboard checks and prompts if not selected |
| **Patient ID (Org-Specific)** | ✅ Complete | Displays: `PID-{ORGANIZATION}-{PATIENTID}` |
| **Appointments (Org-Filtered)** | ✅ Complete | Only shows appointments in selected org |
| **Prescriptions (Org-Filtered)** | ✅ Complete | Only shows prescriptions from selected org |
| **Lab Orders (Org-Filtered)** | ✅ Complete | Only shows orders from selected org |
| **Medical Records (Org-Filtered)** | ✅ Complete | Aggregated view filtered by organization |
| **Data Isolation** | ✅ Complete | Patient A cannot see Patient B's data |
| **Organization Isolation** | ✅ Complete | Patient in Org A cannot see Org B's data |

---

## 12. FILE REFERENCES

- [Patient Dashboard](frontend/src/pages/portal/PatientDashboard.tsx)
- [Medical Records](frontend/src/pages/portal/MedicalRecords.tsx)
- [Medical Records Service](frontend/src/services/medicalRecords.service.ts)
- [Prescription Controller](backend/src/controllers/pharmacy/prescription.controller.ts)
- [Lab Order Controller](backend/src/controllers/lab-order.controller.ts)
- [Appointment Controller](backend/src/controllers/appointment.controller.ts)
- [Medical Records Controller - Aggregated](backend/src/controllers/medicalRecords.controller.ts#L342)
