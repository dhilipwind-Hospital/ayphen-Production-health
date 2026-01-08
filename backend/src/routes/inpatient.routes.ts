import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole, Permission } from '../types/roles';
import { errorHandler } from '../middleware/error.middleware';
import {
  WardController,
  RoomController,
  BedController,
  AdmissionController,
  NursingCareController,
  DoctorRoundsController
} from '../controllers/inpatient';

const router = Router();

// Middleware for different roles
const isDoctor = authorize({
  requireRole: UserRole.DOCTOR
});

const isNurse = authorize({
  requireRole: UserRole.NURSE
});

const isDoctorOrNurse = authorize({
  requireRole: [UserRole.DOCTOR, UserRole.NURSE]
});

const isAdmin = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

const isAdminOrNurse = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.NURSE]
});

// ============ WARD ROUTES ============
router.get('/wards', authenticate, errorHandler(WardController.getAllWards));
router.get('/wards/:id', authenticate, errorHandler(WardController.getWardById));
router.post('/wards', authenticate, isAdmin, errorHandler(WardController.createWard));
router.put('/wards/:id', authenticate, isAdmin, errorHandler(WardController.updateWard));
router.delete('/wards/:id', authenticate, isAdmin, errorHandler(WardController.deleteWard));
router.get('/wards/:id/occupancy', authenticate, errorHandler(WardController.getWardOccupancy));

// ============ ROOM ROUTES ============
router.get('/rooms', authenticate, errorHandler(RoomController.getAllRooms));
router.get('/rooms/ward/:wardId', authenticate, errorHandler(RoomController.getRoomsByWard));
router.get('/rooms/:id', authenticate, errorHandler(RoomController.getRoomById));
router.post('/rooms', authenticate, isAdmin, errorHandler(RoomController.createRoom));
router.put('/rooms/:id', authenticate, isAdmin, errorHandler(RoomController.updateRoom));
router.delete('/rooms/:id', authenticate, isAdmin, errorHandler(RoomController.deleteRoom));

// ============ BED ROUTES ============
router.get('/beds', authenticate, errorHandler(BedController.getAllBeds));
router.get('/beds/room/:roomId', authenticate, errorHandler(BedController.getBedsByRoom));
router.get('/beds/available', authenticate, errorHandler(BedController.getAvailableBeds));
router.get('/beds/:id', authenticate, errorHandler(BedController.getBedById));
router.post('/beds', authenticate, isAdmin, errorHandler(BedController.createBed));
router.put('/beds/:id', authenticate, isAdmin, errorHandler(BedController.updateBed));
router.put('/beds/:id/status', authenticate, isAdminOrNurse, errorHandler(BedController.changeBedStatus));
router.delete('/beds/:id', authenticate, isAdmin, errorHandler(BedController.deleteBed));

// ============ ADMISSION ROUTES ============
router.post('/admissions', authenticate, isDoctorOrNurse, errorHandler(AdmissionController.createAdmission));
router.get('/admissions', authenticate, errorHandler(AdmissionController.getAllAdmissions));
router.get('/admissions/current', authenticate, errorHandler(AdmissionController.getCurrentAdmissions));
router.get('/admissions/:id', authenticate, errorHandler(AdmissionController.getAdmissionById));
router.get('/admissions/patient/:patientId', authenticate, errorHandler(AdmissionController.getPatientAdmissions));
router.get('/admissions/doctor/:doctorId', authenticate, errorHandler(AdmissionController.getDoctorPatients));
router.put('/admissions/:id/transfer', authenticate, isDoctorOrNurse, errorHandler(AdmissionController.transferPatient));
router.put('/admissions/:id/discharge', authenticate, isDoctor, errorHandler(AdmissionController.dischargePatient));

// ============ NURSING CARE ROUTES ============

// Nursing Notes
router.post('/nursing-notes', authenticate, isNurse, errorHandler(NursingCareController.createNursingNote));
router.get('/nursing-notes/admission/:admissionId', authenticate, errorHandler(NursingCareController.getNursingNotesByAdmission));

// Vital Signs
router.post('/vital-signs', authenticate, isDoctorOrNurse, errorHandler(NursingCareController.recordVitalSigns));
router.get('/vital-signs/admission/:admissionId', authenticate, errorHandler(NursingCareController.getVitalSignsByAdmission));
router.get('/vital-signs/admission/:admissionId/latest', authenticate, errorHandler(NursingCareController.getLatestVitalSigns));

// Medication Administration
router.post('/medications', authenticate, isNurse, errorHandler(NursingCareController.administerMedication));
router.get('/medications/admission/:admissionId', authenticate, errorHandler(NursingCareController.getMedicationsByAdmission));

// Care History
router.get('/care-history/:admissionId', authenticate, errorHandler(NursingCareController.getCareHistory));

// ============ DOCTOR ROUNDS ROUTES ============

// Doctor Notes
router.post('/doctor-notes', authenticate, isDoctor, errorHandler(DoctorRoundsController.createDoctorNote));
router.get('/doctor-notes/admission/:admissionId', authenticate, errorHandler(DoctorRoundsController.getDoctorNotesByAdmission));
router.get('/doctor-rounds/patients', authenticate, isDoctor, errorHandler(DoctorRoundsController.getDoctorPatients));

// Discharge Summary
router.post('/discharge-summary', authenticate, isDoctor, errorHandler(DoctorRoundsController.createDischargeSummary));
router.get('/discharge-summary/admission/:admissionId', authenticate, errorHandler(DoctorRoundsController.getDischargeSummary));
router.put('/discharge-summary/:id', authenticate, isDoctor, errorHandler(DoctorRoundsController.updateDischargeSummary));

export default router;
