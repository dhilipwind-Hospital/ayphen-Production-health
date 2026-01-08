import { Router } from 'express';
import { LabTestController } from '../controllers/lab-test.controller';
import { LabOrderController } from '../controllers/lab-order.controller';
import { LabSampleController } from '../controllers/lab-sample.controller';
import { LabResultController } from '../controllers/lab-result.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ==================== LAB TEST ROUTES ====================

// Get test categories (must be before /tests/:id)
router.get('/tests/categories', authenticate, LabTestController.getCategories);

// Get all lab tests (accessible to doctors and lab techs)
router.get('/tests', authenticate, LabTestController.getAllLabTests);

// Get single lab test
router.get('/tests/:id', authenticate, LabTestController.getLabTestById);

// Create lab test (admin only)
router.post('/tests', authenticate, LabTestController.createLabTest);

// Update lab test (admin only)
router.put('/tests/:id', authenticate, LabTestController.updateLabTest);

// Delete lab test (admin only)
router.delete('/tests/:id', authenticate, LabTestController.deleteLabTest);

// ==================== LAB ORDER ROUTES ====================

// Create lab order (doctors only)
router.post('/orders', authenticate, LabOrderController.createLabOrder);

// Get all lab orders (admin/lab tech)
router.get('/orders', authenticate, LabOrderController.getAllLabOrders);

// Get pending lab orders (lab tech)
router.get('/orders/pending', authenticate, LabOrderController.getPendingLabOrders);

// Get doctor's lab orders
router.get('/orders/doctor', authenticate, LabOrderController.getDoctorLabOrders);

// Get patient's lab orders
router.get('/orders/patient/:patientId', authenticate, LabOrderController.getPatientLabOrders);

// Get single lab order
router.get('/orders/:id', authenticate, LabOrderController.getLabOrderById);

// Update lab order status
router.put('/orders/:id/status', authenticate, LabOrderController.updateLabOrderStatus);

// Cancel lab order
router.put('/orders/:id/cancel', authenticate, LabOrderController.cancelLabOrder);

// ==================== LAB SAMPLE ROUTES ====================

// Register sample (lab tech)
router.post('/samples', authenticate, LabSampleController.registerSample);

// Update sample status (lab tech)
router.put('/samples/:id/status', authenticate, LabSampleController.updateSampleStatus);

// Reject sample (lab tech)
router.put('/samples/:id/reject', authenticate, LabSampleController.rejectSample);

// Get sample by ID
router.get('/samples/:id', authenticate, LabSampleController.getSampleById);

// Get samples by lab order
router.get('/orders/:orderId/samples', authenticate, LabSampleController.getSamplesByLabOrder);

// ==================== LAB RESULT ROUTES ====================

// Enter lab result (lab tech)
router.post('/results', authenticate, LabResultController.enterLabResult);

// Verify lab result (lab supervisor)
router.put('/results/:id/verify', authenticate, LabResultController.verifyLabResult);

// Get result by ID
router.get('/results/:id', authenticate, LabResultController.getResultById);

// Get results by lab order
router.get('/orders/:orderId/results', authenticate, LabResultController.getResultsByLabOrder);

// Get patient lab results
router.get('/results/patient/:patientId', authenticate, LabResultController.getPatientLabResults);

export default router;
