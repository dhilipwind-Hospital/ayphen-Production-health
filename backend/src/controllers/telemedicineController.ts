import { Request, Response } from 'express';
import TelemedicineSession from '../models/TelemedicineSession';
import { Op } from 'sequelize';

export const createTelemedicineSession = async (req: Request, res: Response) => {
  try {
    const {
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      duration,
      sessionType,
      reason,
      patientId,
      doctorId,
      followUpRequired,
      recordingAvailable,
    } = req.body;

    // Validation
    if (!patientName || !doctorName || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, doctorName, appointmentDate, appointmentTime, reason',
      });
    }

    const session = await TelemedicineSession.create({
      patientId: patientId || Date.now().toString(),
      patientName,
      doctorId: doctorId || Date.now().toString(),
      doctorName,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      sessionType: sessionType || 'Video',
      reason,
      status: 'Scheduled',
      followUpRequired: followUpRequired || false,
      recordingAvailable: recordingAvailable || false,
    });

    res.status(201).json({
      success: true,
      message: 'Telemedicine session created successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error creating telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create telemedicine session',
      error: error.message,
    });
  }
};

export const getAllTelemedicineSessions = async (req: Request, res: Response) => {
  try {
    const { status, date, doctorName, patientName } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      whereClause.appointmentDate = date;
    }

    if (doctorName) {
      whereClause.doctorName = {
        [Op.like]: `%${doctorName}%`,
      };
    }

    if (patientName) {
      whereClause.patientName = {
        [Op.like]: `%${patientName}%`,
      };
    }

    const sessions = await TelemedicineSession.findAll({
      where: whereClause,
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error('Error fetching telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine sessions',
      error: error.message,
    });
  }
};

export const getTelemedicineSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await TelemedicineSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error fetching telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine session',
      error: error.message,
    });
  }
};

export const updateTelemedicineSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = await TelemedicineSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    await session.update(updates);

    res.status(200).json({
      success: true,
      message: 'Telemedicine session updated successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error updating telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update telemedicine session',
      error: error.message,
    });
  }
};

export const deleteTelemedicineSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await TelemedicineSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    await session.destroy();

    res.status(200).json({
      success: true,
      message: 'Telemedicine session deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete telemedicine session',
      error: error.message,
    });
  }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const session = await TelemedicineSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    await session.update({ status });

    res.status(200).json({
      success: true,
      message: 'Session status updated successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error updating session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session status',
      error: error.message,
    });
  }
};

export const addSessionNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, prescriptions } = req.body;

    const session = await TelemedicineSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    await session.update({
      notes: notes || session.notes,
      prescriptions: prescriptions || session.prescriptions,
    });

    res.status(200).json({
      success: true,
      message: 'Session notes added successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error adding session notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add session notes',
      error: error.message,
    });
  }
};
