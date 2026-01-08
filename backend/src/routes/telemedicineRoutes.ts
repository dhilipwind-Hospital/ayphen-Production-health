import express from 'express';
import {
  createTelemedicineSession,
  getAllTelemedicineSessions,
  getTelemedicineSessionById,
  updateTelemedicineSession,
  deleteTelemedicineSession,
  updateSessionStatus,
  addSessionNotes,
} from '../controllers/telemedicineController';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CRUD Operations
router.post('/sessions', createTelemedicineSession);
router.get('/sessions', getAllTelemedicineSessions);
router.get('/sessions/:id', getTelemedicineSessionById);
router.put('/sessions/:id', updateTelemedicineSession);
router.delete('/sessions/:id', deleteTelemedicineSession);

// Additional operations
router.patch('/sessions/:id/status', updateSessionStatus);
router.patch('/sessions/:id/notes', addSessionNotes);

export default router;
