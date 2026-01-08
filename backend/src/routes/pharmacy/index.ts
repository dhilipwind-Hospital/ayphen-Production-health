import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { UserRole, Permission } from '../../types/roles';
import { errorHandler } from '../../middleware/error.middleware';
import { MedicineController } from '../../controllers/pharmacy/medicine.controller';
import { PrescriptionController } from '../../controllers/pharmacy/prescription.controller';
import { InventoryController } from '../../controllers/pharmacy/inventory.controller';

const router = Router();

// Middleware for pharmacy-related roles
const isPharmacistOrAdmin = authorize({
  requireOneOf: [Permission.MANAGE_INVENTORY],
  requireRole: [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

const isPharmacist = authorize({
  requireRole: UserRole.PHARMACIST
});

const isDoctor = authorize({
  requireRole: UserRole.DOCTOR
});

const isAdmin = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

// Medicine routes
// Allow doctors to view medicines for prescriptions
router.get('/medicines', authenticate, errorHandler(MedicineController.getAllMedicines));
router.get('/medicines/low-stock', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.getLowStockMedicines));
router.get('/medicines/expiring', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.getExpiringMedicines));
router.get('/medicines/:id', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.getMedicineById));
router.post('/medicines', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.createMedicine));
router.put('/medicines/:id', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.updateMedicine));
router.delete('/medicines/:id', authenticate, isAdmin, errorHandler(MedicineController.deleteMedicine));

// Prescription routes
router.post('/prescriptions', authenticate, isDoctor, errorHandler(PrescriptionController.createPrescription));
router.get('/prescriptions/patient/:patientId', authenticate, errorHandler(PrescriptionController.getPatientPrescriptions));
router.get('/prescriptions/doctor', authenticate, isDoctor, errorHandler(PrescriptionController.getDoctorPrescriptions));
router.get('/prescriptions/pending', authenticate, isPharmacistOrAdmin, errorHandler(PrescriptionController.getPendingPrescriptions));
router.get('/prescriptions/admin', authenticate, isAdmin, errorHandler(PrescriptionController.getPendingPrescriptions)); // Admin view (uses same controller, supports status filter)
router.get('/prescriptions/:id', authenticate, errorHandler(PrescriptionController.getPrescriptionById));
router.put('/prescriptions/:id/dispense', authenticate, isPharmacistOrAdmin, errorHandler(PrescriptionController.dispensePrescription));
router.put('/prescriptions/:id/cancel', authenticate, isDoctor, errorHandler(PrescriptionController.cancelPrescription));

// Inventory routes
router.post('/inventory/add-stock', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.addStock));
router.post('/inventory/adjust-stock', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.adjustStock));
router.post('/inventory/damaged-stock', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.recordDamagedStock));
router.get('/inventory/transactions', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.getTransactionHistory));
router.get('/inventory/reports', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.generateInventoryReport));

export default router;
