import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { v4 as uuid } from 'uuid';

// In-memory data for fast iteration. Replace with TypeORM entities later.
interface OTRoom { id: string; name: string; status: 'available' | 'in_use' | 'maintenance' | 'cleaning'; }
interface Surgery {
  id: string;
  otRoomId: string;
  patientName: string;
  doctorName: string;
  procedure: string;
  priority: 'Emergency' | 'Urgent' | 'Elective';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

const router = Router();

const otRooms: OTRoom[] = [
  { id: 'ot-1', name: 'OT-1', status: 'available' },
  { id: 'ot-2', name: 'OT-2', status: 'available' },
  { id: 'ot-3', name: 'OT-3', status: 'maintenance' },
];

const surgeries: Surgery[] = [
  {
    id: uuid(),
    otRoomId: 'ot-1',
    patientName: 'John Smith',
    doctorName: 'Dr. Sarah Johnson',
    procedure: 'Appendectomy',
    priority: 'Elective',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    durationMinutes: 60,
    status: 'Scheduled',
  },
];

// Middleware
const isAdminOrDoctor = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR] });

// Rooms
router.get('/rooms', authenticate, isAdminOrDoctor, (_req: Request, res: Response) => {
  res.json({ success: true, data: otRooms });
});

// Surgeries
router.get('/surgeries', authenticate, isAdminOrDoctor, (_req, res) => {
  res.json({ success: true, data: surgeries });
});

router.post('/surgeries', authenticate, isAdminOrDoctor, (req, res) => {
  const body = req.body || {};
  const s: Surgery = {
    id: uuid(),
    otRoomId: String(body.otRoomId || ''),
    patientName: String(body.patientName || ''),
    doctorName: String(body.doctorName || ''),
    procedure: String(body.procedure || ''),
    priority: ['Emergency', 'Urgent', 'Elective'].includes(body.priority) ? body.priority : 'Elective',
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    startTime: String(body.startTime || '09:00'),
    durationMinutes: Number(body.durationMinutes || 60),
    status: 'Scheduled',
  };
  surgeries.push(s);
  res.status(201).json({ success: true, data: s });
});

router.put('/surgeries/:id', authenticate, isAdminOrDoctor, (req, res) => {
  const idx = surgeries.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  surgeries[idx] = { ...surgeries[idx], ...req.body };
  res.json({ success: true, data: surgeries[idx] });
});

router.delete('/surgeries/:id', authenticate, isAdminOrDoctor, (req, res) => {
  const idx = surgeries.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  const removed = surgeries.splice(idx, 1)[0];
  res.json({ success: true, data: removed });
});

// Update surgery status
router.patch('/surgeries/:id/status', authenticate, isAdminOrDoctor, (req, res) => {
  const idx = surgeries.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  const status = req.body.status || 'Scheduled';
  surgeries[idx].status = status;
  res.json({ success: true, data: surgeries[idx] });
});

// Analytics
router.get('/analytics', authenticate, isAdminOrDoctor, (_req, res) => {
  const completed = surgeries.filter(s => s.status === 'Completed').length;
  const scheduled = surgeries.filter(s => s.status === 'Scheduled').length;
  const inProgress = surgeries.filter(s => s.status === 'In Progress').length;
  const avgDuration = surgeries.length > 0 ? Math.round(surgeries.reduce((sum, s) => sum + s.durationMinutes, 0) / surgeries.length) : 0;
  res.json({ success: true, data: { completed, scheduled, inProgress, avgDuration, total: surgeries.length } });
});

// Pre-op checklist
interface Checklist { id: string; surgeryId: string; items: { name: string; completed: boolean }[]; }
const checklists: Checklist[] = [];

router.post('/checklists', authenticate, isAdminOrDoctor, (req, res) => {
  const c: Checklist = { id: uuid(), surgeryId: req.body.surgeryId, items: req.body.items || [] };
  checklists.push(c);
  res.status(201).json({ success: true, data: c });
});

router.get('/checklists/:surgeryId', authenticate, isAdminOrDoctor, (req, res) => {
  const c = checklists.find(x => x.surgeryId === req.params.surgeryId);
  res.json({ success: true, data: c || null });
});

router.put('/checklists/:id', authenticate, isAdminOrDoctor, (req, res) => {
  const idx = checklists.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  checklists[idx] = { ...checklists[idx], ...req.body };
  res.json({ success: true, data: checklists[idx] });
});

// Equipment tracking
interface Equipment { id: string; otRoomId: string; name: string; status: 'available' | 'in_use' | 'maintenance'; }
const equipment: Equipment[] = [
  { id: uuid(), otRoomId: 'ot-1', name: 'Anesthesia Machine', status: 'available' },
  { id: uuid(), otRoomId: 'ot-1', name: 'Surgical Lights', status: 'available' },
  { id: uuid(), otRoomId: 'ot-2', name: 'Anesthesia Machine', status: 'available' },
];

router.get('/equipment', authenticate, isAdminOrDoctor, (_req, res) => {
  res.json({ success: true, data: equipment });
});

router.get('/equipment/:otRoomId', authenticate, isAdminOrDoctor, (req, res) => {
  const eq = equipment.filter(e => e.otRoomId === req.params.otRoomId);
  res.json({ success: true, data: eq });
});

router.put('/equipment/:id', authenticate, isAdminOrDoctor, (req, res) => {
  const idx = equipment.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Not found' });
  equipment[idx] = { ...equipment[idx], ...req.body };
  res.json({ success: true, data: equipment[idx] });
});

// Emergency queue (surgeries sorted by priority)
router.get('/queue', authenticate, isAdminOrDoctor, (_req, res) => {
  const priorityMap = { 'Emergency': 0, 'Urgent': 1, 'Elective': 2 };
  const queue = [...surgeries].filter(s => s.status === 'Scheduled').sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
  res.json({ success: true, data: queue });
});

// Get list of doctors for dropdown (fetches from User table)
router.get('/doctors/list', authenticate, isAdminOrDoctor, async (_req, res) => {
  try {
    // In production, this would query the User table with role='doctor'
    // For now, return mock doctors that can be extended
    const mockDoctors = [
      { id: '1', name: 'Dr. Sarah Johnson' },
      { id: '2', name: 'Dr. Michael Brown' },
      { id: '3', name: 'Dr. Emily Davis' },
      { id: '4', name: 'Dr. James Wilson' },
      { id: '5', name: 'Dr. Lisa Anderson' },
    ];
    res.json({ success: true, data: mockDoctors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
