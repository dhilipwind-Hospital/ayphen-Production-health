const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// Telemedicine Session Model (you would typically use a proper ORM)
const telemedicineSessions = [];
const waitingRoom = [];

// GET /api/telemedicine/sessions - Get all telemedicine sessions
router.get('/sessions', authenticateToken, requireRole(['doctor', 'admin', 'super_admin', 'nurse']), async (req, res) => {
  try {
    const { status, date, doctorId } = req.query;
    let filteredSessions = [...telemedicineSessions];

    // Filter by status
    if (status && status !== 'all') {
      filteredSessions = filteredSessions.filter(session => 
        session.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Filter by date
    if (date) {
      filteredSessions = filteredSessions.filter(session => 
        session.appointmentDate === date
      );
    }

    // Filter by doctor (for doctor role)
    if (req.user.role === 'doctor' || doctorId) {
      const targetDoctorId = doctorId || req.user.id;
      filteredSessions = filteredSessions.filter(session => 
        session.doctorId === targetDoctorId
      );
    }

    res.json({
      success: true,
      data: filteredSessions,
      total: filteredSessions.length
    });
  } catch (error) {
    console.error('Error fetching telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine sessions'
    });
  }
});

// POST /api/telemedicine/sessions - Create new telemedicine session
router.post('/sessions', authenticateToken, requireRole(['doctor', 'admin', 'super_admin']), async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      doctorId,
      doctorName,
      appointmentDate,
      appointmentTime,
      duration,
      sessionType,
      reason
    } = req.body;

    // Validate required fields
    if (!patientId || !patientName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newSession = {
      id: Date.now().toString(),
      sessionId: `TM-${new Date().getFullYear()}-${String(telemedicineSessions.length + 1).padStart(3, '0')}`,
      patientId,
      patientName,
      patientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${patientName}`,
      doctorId: doctorId || req.user.id,
      doctorName: doctorName || `${req.user.firstName} ${req.user.lastName}`,
      doctorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctorName}`,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      status: 'Scheduled',
      sessionType: sessionType || 'Video',
      reason: reason || 'General consultation',
      followUpRequired: false,
      recordingAvailable: false,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };

    telemedicineSessions.push(newSession);

    res.status(201).json({
      success: true,
      data: newSession,
      message: 'Telemedicine session scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create telemedicine session'
    });
  }
});

// PUT /api/telemedicine/sessions/:id - Update telemedicine session
router.put('/sessions/:id', authenticateToken, requireRole(['doctor', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sessionIndex = telemedicineSessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found'
      });
    }

    // Check if user has permission to update this session
    const session = telemedicineSessions[sessionIndex];
    if (req.user.role === 'doctor' && session.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }

    // Update session
    telemedicineSessions[sessionIndex] = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };

    res.json({
      success: true,
      data: telemedicineSessions[sessionIndex],
      message: 'Telemedicine session updated successfully'
    });
  } catch (error) {
    console.error('Error updating telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update telemedicine session'
    });
  }
});

// POST /api/telemedicine/sessions/:id/start - Start telemedicine session
router.post('/sessions/:id/start', authenticateToken, requireRole(['doctor', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const sessionIndex = telemedicineSessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found'
      });
    }

    const session = telemedicineSessions[sessionIndex];
    
    // Check if user has permission to start this session
    if (req.user.role === 'doctor' && session.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this session'
      });
    }

    // Update session status
    telemedicineSessions[sessionIndex] = {
      ...session,
      status: 'In Progress',
      actualStartTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };

    // Generate session token/room ID for video call
    const sessionToken = `session_${id}_${Date.now()}`;

    res.json({
      success: true,
      data: {
        session: telemedicineSessions[sessionIndex],
        sessionToken,
        videoRoomId: `room_${id}`
      },
      message: 'Telemedicine session started successfully'
    });
  } catch (error) {
    console.error('Error starting telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start telemedicine session'
    });
  }
});

// POST /api/telemedicine/sessions/:id/end - End telemedicine session
router.post('/sessions/:id/end', authenticateToken, requireRole(['doctor', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, prescriptions, followUpRequired } = req.body;
    
    const sessionIndex = telemedicineSessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found'
      });
    }

    const session = telemedicineSessions[sessionIndex];
    
    // Check if user has permission to end this session
    if (req.user.role === 'doctor' && session.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this session'
      });
    }

    // Calculate actual duration
    const startTime = new Date(session.actualStartTime || session.appointmentTime);
    const endTime = new Date();
    const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Update session
    telemedicineSessions[sessionIndex] = {
      ...session,
      status: 'Completed',
      actualEndTime: endTime.toISOString(),
      actualDuration,
      notes: notes || session.notes,
      prescriptions: prescriptions || session.prescriptions || [],
      followUpRequired: followUpRequired || false,
      recordingAvailable: true,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };

    res.json({
      success: true,
      data: telemedicineSessions[sessionIndex],
      message: 'Telemedicine session completed successfully'
    });
  } catch (error) {
    console.error('Error ending telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end telemedicine session'
    });
  }
});

// GET /api/telemedicine/waiting-room - Get virtual waiting room
router.get('/waiting-room', authenticateToken, requireRole(['doctor', 'admin', 'super_admin', 'nurse']), async (req, res) => {
  try {
    res.json({
      success: true,
      data: waitingRoom,
      total: waitingRoom.length
    });
  } catch (error) {
    console.error('Error fetching waiting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waiting room'
    });
  }
});

// POST /api/telemedicine/waiting-room - Add patient to waiting room
router.post('/waiting-room', authenticateToken, requireRole(['doctor', 'admin', 'super_admin', 'receptionist']), async (req, res) => {
  try {
    const { patientId, patientName, appointmentTime, priority } = req.body;

    if (!patientId || !patientName || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const waitingEntry = {
      id: Date.now().toString(),
      patientId,
      patientName,
      patientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${patientName}`,
      appointmentTime,
      waitingTime: 0,
      priority: priority || 'Normal',
      deviceStatus: 'Ready',
      connectionQuality: 'Excellent',
      joinedAt: new Date().toISOString()
    };

    waitingRoom.push(waitingEntry);

    res.status(201).json({
      success: true,
      data: waitingEntry,
      message: 'Patient added to waiting room'
    });
  } catch (error) {
    console.error('Error adding patient to waiting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add patient to waiting room'
    });
  }
});

// DELETE /api/telemedicine/waiting-room/:id - Remove patient from waiting room
router.delete('/waiting-room/:id', authenticateToken, requireRole(['doctor', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const entryIndex = waitingRoom.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Waiting room entry not found'
      });
    }

    const removedEntry = waitingRoom.splice(entryIndex, 1)[0];

    res.json({
      success: true,
      data: removedEntry,
      message: 'Patient removed from waiting room'
    });
  } catch (error) {
    console.error('Error removing patient from waiting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove patient from waiting room'
    });
  }
});

// GET /api/telemedicine/statistics - Get telemedicine statistics
router.get('/statistics', authenticateToken, requireRole(['doctor', 'admin', 'super_admin']), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const todaySessions = telemedicineSessions.filter(s => s.appointmentDate === today);
    const activeSessions = telemedicineSessions.filter(s => s.status === 'In Progress');
    const completedSessions = telemedicineSessions.filter(s => s.status === 'Completed');
    const waitingPatients = waitingRoom.length;

    // Calculate average session duration
    const completedWithDuration = completedSessions.filter(s => s.actualDuration);
    const avgDuration = completedWithDuration.length > 0 
      ? Math.round(completedWithDuration.reduce((sum, s) => sum + s.actualDuration, 0) / completedWithDuration.length)
      : 0;

    // Calculate patient satisfaction (mock data)
    const patientSatisfaction = 4.7;

    res.json({
      success: true,
      data: {
        todaySessions: todaySessions.length,
        activeSessions: activeSessions.length,
        completedSessions: completedSessions.length,
        waitingPatients,
        avgDuration,
        patientSatisfaction,
        totalSessions: telemedicineSessions.length
      }
    });
  } catch (error) {
    console.error('Error fetching telemedicine statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine statistics'
    });
  }
});

module.exports = router;
