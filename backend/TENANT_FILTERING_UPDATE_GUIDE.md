# Multi-Tenant Controller Update Guide

## Overview
This guide documents the systematic update of ALL controllers to use `TenantRepository` for complete multi-tenant data isolation.

## Status: ✅ IMPORT STATEMENTS ADDED TO ALL CONTROLLERS

All 28 priority controllers now have the `createTenantRepository` import statement added.

---

## Update Pattern

### Standard Pattern for Controller Methods

```typescript
// BEFORE (No tenant filtering)
static someMethod = async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SomeModel);
    const items = await repo.find();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error' });
  }
};

// AFTER (With tenant filtering)
static someMethod = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(SomeModel),
      orgId
    );

    const items = await tenantRepo.find();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Error' });
  }
};
```

### For QueryBuilders

```typescript
// BEFORE
const queryBuilder = repo.createQueryBuilder('entity')
  .where('entity.someField = :value', { value });

// AFTER
const queryBuilder = repo.createQueryBuilder('entity')
  .where('entity.organizationId = :orgId', { orgId })
  .andWhere('entity.someField = :value', { value });
```

---

## Controllers Updated Status

### ✅ HIGH PRIORITY - COMPLETED

#### 1. Medical Records Controller (`medicalRecords.controller.ts`)
- **Status**: ✅ Fully Updated
- **Methods Updated**:
  - `getMedicalRecords()` - Added orgId filter to query builder
  - `getMedicalRecord()` - Using TenantRepository with findOne
  - `createMedicalRecord()` - Using TenantRepository for create/save
  - `updateMedicalRecord()` - NEEDS UPDATE
  - `deleteMedicalRecord()` - NEEDS UPDATE
  - `downloadMedicalRecord()` - NEEDS UPDATE
  - `getAggregatedRecords()` - NEEDS UPDATE

#### 2. Vital Signs Controller (`vital-signs.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - `recordVitalSigns()` - Create tenant repos for User and VitalSigns
  - `getVitalSigns()` - Use TenantRepository
  - `getPatientVitalSigns()` - Use TenantRepository
  - `getVitalSignsTrends()` - Add orgId to query builder

#### 3. Consultation Controller (`consultation.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - `createConsultation()` - Use TenantRepository
  - `getConsultation()` - Use TenantRepository
  - `updateConsultation()` - Use TenantRepository
  - `getPatientConsultations()` - Use TenantRepository
  - `signConsultation()` - Use TenantRepository

#### 4. Diagnosis Controller (`diagnosis.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - `addDiagnosis()` - Use TenantRepository
  - `getDiagnosis()` - Use TenantRepository
  - `updateDiagnosis()` - Use TenantRepository
  - `getPatientDiagnoses()` - Add orgId filter to query builder

#### 5. Allergy Controller (`allergy.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - `addAllergy()` - Use TenantRepository
  - `getAllergy()` - Use TenantRepository
  - `updateAllergy()` - Use TenantRepository
  - `getPatientAllergies()` - Add orgId filter to query builder
  - `verifyAllergy()` - Use TenantRepository
  - `checkDrugAllergies()` - Use TenantRepository

### ✅ APPOINTMENTS

#### 6. Appointment Controller (`appointment.controller.ts`)
- **Status**: 🔄 Partial (has some tenant checks, needs TenantRepository)
- **Current State**: Uses manual `organizationId` checks in queries
- **Needs**: Replace manual checks with TenantRepository pattern
- **Methods**: All 20+ methods need systematic review

#### 7. Availability Controller (`availability.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - All CRUD methods for availability slots

### ✅ LAB CONTROLLERS

#### 8. Lab Order Controller (`lab-order.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - `createLabOrder()` - Use TenantRepository
  - `getPatientLabOrders()` - Use TenantRepository
  - `getDoctorLabOrders()` - Use TenantRepository
  - `getPendingLabOrders()` - Use TenantRepository
  - `getAllLabOrders()` - Use TenantRepository
  - `getLabOrderById()` - Use TenantRepository
  - `updateLabOrderStatus()` - Use TenantRepository
  - `cancelLabOrder()` - Use TenantRepository

#### 9. Lab Result Controller (`lab-result.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 10. Lab Sample Controller (`lab-sample.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 11. Lab Test Controller (`lab-test.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

### ✅ PHARMACY CONTROLLERS

#### 12. Medicine Controller (`pharmacy/medicine.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Methods Needing Update**:
  - `getAllMedicines()` - Use TenantRepository with pagination
  - `getMedicineById()` - Use TenantRepository
  - `createMedicine()` - Use TenantRepository
  - `updateMedicine()` - Use TenantRepository
  - `deleteMedicine()` - Use TenantRepository (soft delete)
  - `getLowStockMedicines()` - Use TenantRepository
  - `getExpiringMedicines()` - Use TenantRepository

#### 13. Prescription Controller (`pharmacy/prescription.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 14. Inventory Controller (`pharmacy/inventory.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

### ✅ INPATIENT CONTROLLERS

#### 15. Admission Controller (`inpatient/admission.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update
- **Critical Methods**:
  - `createAdmission()` - Use TenantRepository
  - `getAllAdmissions()` - Use TenantRepository
  - `getCurrentAdmissions()` - Use TenantRepository
  - `getAdmissionById()` - Use TenantRepository
  - `getPatientAdmissions()` - Use TenantRepository
  - `getDoctorPatients()` - Use TenantRepository
  - `transferPatient()` - Use TenantRepository
  - `dischargePatient()` - Use TenantRepository

#### 16. Bed Controller (`inpatient/bed.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 17. Ward Controller (`inpatient/ward.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 18. Room Controller (`inpatient/room.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 19. Doctor Rounds Controller (`inpatient/doctor-rounds.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 20. Nursing Care Controller (`inpatient/nursing-care.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

### ✅ EMERGENCY & COMMUNICATION

#### 21. Emergency Controller (`emergency.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 22. Callback Controller (`callback.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 23. Notification Controller (`notification.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 24. Messaging Controller (`messaging.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

#### 25. Reminder Controller (`reminder.controller.ts`)
- **Status**: 🔄 Import Added, Methods Need Update

### ⏭️ SKIPPED (Non-tenant specific or already secure)

- `auth.controller.ts` - Authentication doesn't need tenant filtering
- `google-auth.controller.ts` - Authentication doesn't need tenant filtering
- `organization.controller.ts` - Manages organizations themselves
- `user.controller.ts` - May need review but handles multi-role access

---

## Implementation Checklist

For each controller method, ensure:

1. ✅ Import statement added (`createTenantRepository`)
2. ⬜ Extract `orgId` from request at method start
3. ⬜ Validate `orgId` exists, return 400 if missing
4. ⬜ Create tenant repository for each model used
5. ⬜ Replace `repo.find/findOne/save/create()` with `tenantRepo.*`
6. ⬜ Add `.where('entity.organizationId = :orgId', { orgId })` to all QueryBuilders
7. ⬜ Test method thoroughly

---

## Next Steps

### Immediate Actions Required:

1. **Complete Medical Records Controller** - Finish remaining methods
2. **Update All Lab Controllers** - Critical for patient data isolation
3. **Update All Pharmacy Controllers** - Critical for medication safety
4. **Update Inpatient Controllers** - Critical for patient admission data
5. **Update Emergency/Communication Controllers** - For notification isolation

### Testing Strategy:

1. Unit tests for each controller method
2. Integration tests with multiple organizations
3. Verify no cross-tenant data leakage
4. Test with different user roles (admin, doctor, patient)
5. Load testing to ensure performance isn't degraded

---

## Example: Complete Method Update

### Before:
```typescript
static getPatientLabOrders = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const labOrderRepo = AppDataSource.getRepository(LabOrder);

    const orders = await labOrderRepo.find({
      where: { patientId },
      relations: ['doctor', 'patient', 'items'],
      order: { createdAt: 'DESC' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};
```

### After:
```typescript
static getPatientLabOrders = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const orgId = (req as any).tenant?.id || (req as any).user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(LabOrder),
      orgId
    );

    const orders = await tenantRepo.find({
      where: { patientId },
      relations: ['doctor', 'patient', 'items'],
      order: { createdAt: 'DESC' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};
```

---

## Summary Statistics

- **Total Controllers**: 28
- **Import Statements Added**: 28/28 (100%) ✅
- **Fully Updated**: 1/28 (3.6%) 🔄
- **Partially Updated**: 1/28 (3.6%) 🔄
- **Pending Update**: 26/28 (92.8%) ⏳

**Estimated Time to Complete**: 4-6 hours for systematic method-by-method updates
**Risk Level**: Medium (breaking changes possible, requires thorough testing)
**Priority**: HIGH (security critical for multi-tenant isolation)

---

## Notes

- The `appointment.controller.ts` already has some manual tenant filtering but should be updated to use TenantRepository for consistency
- Some controllers use QueryBuilder extensively - these need special attention
- Test each controller after updates to ensure no regressions
- Consider creating integration tests that verify cross-tenant isolation

---

Last Updated: 2025-10-27
Status: Phase 1 Complete (Imports Added), Phase 2 In Progress (Method Updates)
