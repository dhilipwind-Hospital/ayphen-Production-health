import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { DoctorNote, DoctorNoteType } from '../../models/inpatient/DoctorNote';
import { DischargeSummary } from '../../models/inpatient/DischargeSummary';
import { Admission, AdmissionStatus } from '../../models/inpatient/Admission';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class DoctorRoundsController {
  // ============ DOCTOR NOTES (SOAP) ============
  
  // Create doctor note
  static createDoctorNote = async (req: Request, res: Response) => {
    try {
      const {
        admissionId,
        subjective,
        objective,
        assessment,
        plan,
        noteType
      } = req.body;
      const doctorId = (req as any).user?.id;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!admissionId || !subjective || !objective || !assessment || !plan) {
        return res.status(400).json({
          success: false,
          message: 'All SOAP fields (Subjective, Objective, Assessment, Plan) are required'
        });
      }

      const doctorNoteRepository = AppDataSource.getRepository(DoctorNote);
      const admissionRepository = AppDataSource.getRepository(Admission);

      // Verify admission exists
      const admission = await admissionRepository.findOne({ where: { id: admissionId } });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // Create doctor note
      const doctorNote = doctorNoteRepository.create({
        admissionId,
        doctorId,
        noteDateTime: new Date(),
        subjective,
        objective,
        assessment,
        plan,
        noteType: noteType || DoctorNoteType.PROGRESS
      });

      await doctorNoteRepository.save(doctorNote);

      const savedNote = await doctorNoteRepository.findOne({
        where: { id: doctorNote.id },
        relations: ['doctor', 'admission']
      });

      return res.status(201).json({
        success: true,
        message: 'Doctor note created successfully',
        doctorNote: savedNote
      });
    } catch (error) {
      console.error('Error creating doctor note:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create doctor note'
      });
    }
  };

  // Get doctor notes by admission
  static getDoctorNotesByAdmission = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const doctorNoteRepository = AppDataSource.getRepository(DoctorNote);

      const notes = await doctorNoteRepository.find({
        where: { admissionId },
        relations: ['doctor'],
        order: { noteDateTime: 'DESC' }
      });

      return res.json({
        success: true,
        doctorNotes: notes
      });
    } catch (error) {
      console.error('Error fetching doctor notes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch doctor notes'
      });
    }
  };

  // Get doctor's patients (for rounds)
  static getDoctorPatients = async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user?.id;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      const admissions = await admissionRepository.find({
        where: {
          admittingDoctorId: doctorId,
          status: AdmissionStatus.ADMITTED
        },
        relations: ['patient', 'bed', 'bed.room', 'bed.room.ward'],
        order: { admissionDateTime: 'DESC' }
      });

      return res.json({
        success: true,
        patients: admissions
      });
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch doctor patients'
      });
    }
  };

  // ============ DISCHARGE SUMMARY ============
  
  // Create discharge summary
  static createDischargeSummary = async (req: Request, res: Response) => {
    try {
      const {
        admissionId,
        admissionDiagnosis,
        dischargeDiagnosis,
        briefSummary,
        treatmentGiven,
        conditionAtDischarge,
        followUpInstructions,
        medicationsAtDischarge,
        dietaryInstructions,
        activityInstructions,
        specialInstructions
      } = req.body;
      const doctorId = (req as any).user?.id;

      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate required fields
      if (!admissionId || !admissionDiagnosis || !dischargeDiagnosis || 
          !briefSummary || !treatmentGiven || !conditionAtDischarge || 
          !followUpInstructions || !medicationsAtDischarge) {
        return res.status(400).json({
          success: false,
          message: 'All required discharge summary fields must be provided'
        });
      }

      const dischargeSummaryRepository = AppDataSource.getRepository(DischargeSummary);
      const admissionRepository = AppDataSource.getRepository(Admission);

      // Verify admission exists
      const admission = await admissionRepository.findOne({
        where: { id: admissionId },
        relations: ['dischargeSummary']
      });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // Check if discharge summary already exists
      if (admission.dischargeSummary) {
        return res.status(400).json({
          success: false,
          message: 'Discharge summary already exists for this admission'
        });
      }

      // Create discharge summary
      const dischargeSummary = dischargeSummaryRepository.create({
        admissionId,
        doctorId,
        dischargeDateTime: new Date(),
        admissionDiagnosis,
        dischargeDiagnosis,
        briefSummary,
        treatmentGiven,
        conditionAtDischarge,
        followUpInstructions,
        medicationsAtDischarge,
        dietaryInstructions,
        activityInstructions,
        specialInstructions
      });

      await dischargeSummaryRepository.save(dischargeSummary);

      const savedSummary = await dischargeSummaryRepository.findOne({
        where: { id: dischargeSummary.id },
        relations: ['doctor', 'admission', 'admission.patient']
      });

      return res.status(201).json({
        success: true,
        message: 'Discharge summary created successfully',
        dischargeSummary: savedSummary
      });
    } catch (error) {
      console.error('Error creating discharge summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create discharge summary'
      });
    }
  };

  // Get discharge summary by admission
  static getDischargeSummary = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const dischargeSummaryRepository = AppDataSource.getRepository(DischargeSummary);

      const dischargeSummary = await dischargeSummaryRepository.findOne({
        where: { admissionId },
        relations: ['doctor', 'admission', 'admission.patient']
      });

      if (!dischargeSummary) {
        return res.status(404).json({
          success: false,
          message: 'Discharge summary not found'
        });
      }

      return res.json({
        success: true,
        dischargeSummary
      });
    } catch (error) {
      console.error('Error fetching discharge summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch discharge summary'
      });
    }
  };

  // Update discharge summary
  static updateDischargeSummary = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        admissionDiagnosis,
        dischargeDiagnosis,
        briefSummary,
        treatmentGiven,
        conditionAtDischarge,
        followUpInstructions,
        medicationsAtDischarge,
        dietaryInstructions,
        activityInstructions,
        specialInstructions
      } = req.body;

      const dischargeSummaryRepository = AppDataSource.getRepository(DischargeSummary);

      const dischargeSummary = await dischargeSummaryRepository.findOne({
        where: { id }
      });

      if (!dischargeSummary) {
        return res.status(404).json({
          success: false,
          message: 'Discharge summary not found'
        });
      }

      // Update fields
      if (admissionDiagnosis) dischargeSummary.admissionDiagnosis = admissionDiagnosis;
      if (dischargeDiagnosis) dischargeSummary.dischargeDiagnosis = dischargeDiagnosis;
      if (briefSummary) dischargeSummary.briefSummary = briefSummary;
      if (treatmentGiven) dischargeSummary.treatmentGiven = treatmentGiven;
      if (conditionAtDischarge) dischargeSummary.conditionAtDischarge = conditionAtDischarge;
      if (followUpInstructions) dischargeSummary.followUpInstructions = followUpInstructions;
      if (medicationsAtDischarge) dischargeSummary.medicationsAtDischarge = medicationsAtDischarge;
      if (dietaryInstructions !== undefined) dischargeSummary.dietaryInstructions = dietaryInstructions;
      if (activityInstructions !== undefined) dischargeSummary.activityInstructions = activityInstructions;
      if (specialInstructions !== undefined) dischargeSummary.specialInstructions = specialInstructions;

      await dischargeSummaryRepository.save(dischargeSummary);

      return res.json({
        success: true,
        message: 'Discharge summary updated successfully',
        dischargeSummary
      });
    } catch (error) {
      console.error('Error updating discharge summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update discharge summary'
      });
    }
  };
}
