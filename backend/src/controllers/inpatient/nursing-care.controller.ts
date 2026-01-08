import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { NursingNote, NursingNoteType } from '../../models/inpatient/NursingNote';
import { VitalSign } from '../../models/inpatient/VitalSign';
import { MedicationAdministration } from '../../models/inpatient/MedicationAdministration';
import { Admission } from '../../models/inpatient/Admission';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class NursingCareController {
  // ============ NURSING NOTES ============
  
  // Create nursing note
  static createNursingNote = async (req: Request, res: Response) => {
    try {
      const { admissionId, notes, noteType } = req.body;
      const nurseId = (req as any).user?.id;

      if (!nurseId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!admissionId || !notes) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID and notes are required'
        });
      }

      const nursingNoteRepository = AppDataSource.getRepository(NursingNote);
      const admissionRepository = AppDataSource.getRepository(Admission);

      // Verify admission exists
      const admission = await admissionRepository.findOne({ where: { id: admissionId } });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // Create nursing note
      const nursingNote = nursingNoteRepository.create({
        admissionId,
        nurseId,
        noteDateTime: new Date(),
        notes,
        noteType: noteType || NursingNoteType.ROUTINE
      });

      await nursingNoteRepository.save(nursingNote);

      const savedNote = await nursingNoteRepository.findOne({
        where: { id: nursingNote.id },
        relations: ['nurse', 'admission']
      });

      return res.status(201).json({
        success: true,
        message: 'Nursing note created successfully',
        nursingNote: savedNote
      });
    } catch (error) {
      console.error('Error creating nursing note:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create nursing note'
      });
    }
  };

  // Get nursing notes by admission
  static getNursingNotesByAdmission = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const nursingNoteRepository = AppDataSource.getRepository(NursingNote);

      const notes = await nursingNoteRepository.find({
        where: { admissionId },
        relations: ['nurse'],
        order: { noteDateTime: 'DESC' }
      });

      return res.json({
        success: true,
        nursingNotes: notes
      });
    } catch (error) {
      console.error('Error fetching nursing notes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch nursing notes'
      });
    }
  };

  // ============ VITAL SIGNS ============
  
  // Record vital signs
  static recordVitalSigns = async (req: Request, res: Response) => {
    try {
      const {
        admissionId,
        temperature,
        heartRate,
        respiratoryRate,
        systolicBP,
        diastolicBP,
        oxygenSaturation,
        weight,
        painScore,
        notes
      } = req.body;
      const recordedById = (req as any).user?.id;

      if (!recordedById) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!admissionId) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID is required'
        });
      }

      const vitalSignRepository = AppDataSource.getRepository(VitalSign);
      const admissionRepository = AppDataSource.getRepository(Admission);

      // Verify admission exists
      const admission = await admissionRepository.findOne({ where: { id: admissionId } });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // Create vital sign record
      const vitalSign = vitalSignRepository.create({
        admissionId,
        recordedById,
        recordedAt: new Date(),
        temperature,
        heartRate,
        respiratoryRate,
        systolicBP,
        diastolicBP,
        oxygenSaturation,
        weight,
        painScore,
        notes
      });

      await vitalSignRepository.save(vitalSign);

      const savedVitalSign = await vitalSignRepository.findOne({
        where: { id: vitalSign.id },
        relations: ['recordedBy', 'admission']
      });

      return res.status(201).json({
        success: true,
        message: 'Vital signs recorded successfully',
        vitalSign: savedVitalSign
      });
    } catch (error) {
      console.error('Error recording vital signs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to record vital signs'
      });
    }
  };

  // Get vital signs by admission
  static getVitalSignsByAdmission = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const vitalSignRepository = AppDataSource.getRepository(VitalSign);

      const vitalSigns = await vitalSignRepository.find({
        where: { admissionId },
        relations: ['recordedBy'],
        order: { recordedAt: 'DESC' }
      });

      return res.json({
        success: true,
        vitalSigns
      });
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch vital signs'
      });
    }
  };

  // Get latest vital signs for admission
  static getLatestVitalSigns = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const vitalSignRepository = AppDataSource.getRepository(VitalSign);

      const latestVitalSign = await vitalSignRepository.findOne({
        where: { admissionId },
        relations: ['recordedBy'],
        order: { recordedAt: 'DESC' }
      });

      return res.json({
        success: true,
        vitalSign: latestVitalSign
      });
    } catch (error) {
      console.error('Error fetching latest vital signs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch latest vital signs'
      });
    }
  };

  // ============ MEDICATION ADMINISTRATION ============
  
  // Administer medication
  static administerMedication = async (req: Request, res: Response) => {
    try {
      const { admissionId, medication, dosage, route, notes } = req.body;
      const administeredById = (req as any).user?.id;

      if (!administeredById) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!admissionId || !medication || !dosage || !route) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID, medication, dosage, and route are required'
        });
      }

      const medicationRepository = AppDataSource.getRepository(MedicationAdministration);
      const admissionRepository = AppDataSource.getRepository(Admission);

      // Verify admission exists
      const admission = await admissionRepository.findOne({ where: { id: admissionId } });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // Create medication administration record
      const medicationAdmin = medicationRepository.create({
        admissionId,
        administeredById,
        administeredAt: new Date(),
        medication,
        dosage,
        route,
        notes
      });

      await medicationRepository.save(medicationAdmin);

      const savedMedication = await medicationRepository.findOne({
        where: { id: medicationAdmin.id },
        relations: ['administeredBy', 'admission']
      });

      return res.status(201).json({
        success: true,
        message: 'Medication administered successfully',
        medication: savedMedication
      });
    } catch (error) {
      console.error('Error administering medication:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to administer medication'
      });
    }
  };

  // Get medications by admission
  static getMedicationsByAdmission = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const medicationRepository = AppDataSource.getRepository(MedicationAdministration);

      const medications = await medicationRepository.find({
        where: { admissionId },
        relations: ['administeredBy'],
        order: { administeredAt: 'DESC' }
      });

      return res.json({
        success: true,
        medications
      });
    } catch (error) {
      console.error('Error fetching medications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch medications'
      });
    }
  };

  // ============ PATIENT CARE HISTORY ============
  
  // Get complete care history for admission
  static getCareHistory = async (req: Request, res: Response) => {
    try {
      const { admissionId } = req.params;
      const admissionRepository = AppDataSource.getRepository(Admission);

      const admission = await admissionRepository.findOne({
        where: { id: admissionId },
        relations: [
          'nursingNotes',
          'nursingNotes.nurse',
          'vitalSigns',
          'vitalSigns.recordedBy',
          'medications',
          'medications.administeredBy'
        ]
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      return res.json({
        success: true,
        careHistory: {
          nursingNotes: admission.nursingNotes,
          vitalSigns: admission.vitalSigns,
          medications: admission.medications
        }
      });
    } catch (error) {
      console.error('Error fetching care history:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch care history'
      });
    }
  };
}
