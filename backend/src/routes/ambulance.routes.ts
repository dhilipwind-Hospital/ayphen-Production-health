import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { v4 as uuid } from 'uuid';

interface Ambulance {
  id: string;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'Available' | 'On Duty' | 'Maintenance' | 'Out of Service';
  location: { latitude: number; longitude: number };
  currentTrip?: string;
  fuelLevel: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  createdAt: string;
}

interface Trip {
  id: string;
  ambulanceId: string;
  patientName: string;
  pickupLocation: string;
  dropoffLocation: string;
  startTime: string;
  endTime?: string;
  distance: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  driverName: string;
  createdAt: string;
}

interface Maintenance {
  id: string;
  ambulanceId: string;
  maintenanceType: 'Routine' | 'Repair' | 'Inspection';
  description: string;
  cost: number;
  completedDate: string;
  nextDueDate: string;
  createdAt: string;
}

const router = Router();
const ambulances: Ambulance[] = [
  {
    id: uuid(),
    registrationNumber: 'AMB-001',
    driverName: 'John Smith',
    driverPhone: '+1234567890',
    status: 'Available',
    location: { latitude: 40.7128, longitude: -74.0060 },
    fuelLevel: 85,
    lastMaintenanceDate: '2025-10-01',
    nextMaintenanceDate: '2025-11-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    registrationNumber: 'AMB-002',
    driverName: 'Jane Doe',
    driverPhone: '+1234567891',
    status: 'Available',
    location: { latitude: 40.7580, longitude: -73.9855 },
    fuelLevel: 70,
    lastMaintenanceDate: '2025-09-15',
    nextMaintenanceDate: '2025-10-15',
    createdAt: new Date().toISOString(),
  },
];

const trips: Trip[] = [];
const maintenanceRecords: Maintenance[] = [];

const isAdminOrDispatcher = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST],
});

// Get all ambulances
router.get('/', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  res.json({ success: true, data: ambulances });
});

// Get ambulance by ID
router.get('/:id', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  const ambulance = ambulances.find(a => a.id === req.params.id);
  if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });
  res.json({ success: true, data: ambulance });
});

// Create ambulance
router.post('/', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const ambulance: Ambulance = {
      id: uuid(),
      registrationNumber: req.body.registrationNumber,
      driverName: req.body.driverName,
      driverPhone: req.body.driverPhone,
      status: 'Available',
      location: req.body.location || { latitude: 0, longitude: 0 },
      fuelLevel: 100,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    ambulances.push(ambulance);
    res.status(201).json({ success: true, data: ambulance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update ambulance status
router.patch('/:id/status', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = ambulances.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Ambulance not found' });
    ambulances[idx].status = req.body.status;
    res.json({ success: true, data: ambulances[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update ambulance location (GPS)
router.patch('/:id/location', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = ambulances.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Ambulance not found' });
    ambulances[idx].location = req.body.location;
    res.json({ success: true, data: ambulances[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update fuel level
router.patch('/:id/fuel', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = ambulances.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Ambulance not found' });
    ambulances[idx].fuelLevel = req.body.fuelLevel;
    res.json({ success: true, data: ambulances[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all trips
router.get('/trips/list', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  res.json({ success: true, data: trips });
});

// Create trip
router.post('/trips', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const trip: Trip = {
      id: uuid(),
      ambulanceId: req.body.ambulanceId,
      patientName: req.body.patientName,
      pickupLocation: req.body.pickupLocation,
      dropoffLocation: req.body.dropoffLocation,
      startTime: req.body.startTime,
      distance: req.body.distance || 0,
      status: 'Scheduled',
      driverName: req.body.driverName,
      createdAt: new Date().toISOString(),
    };
    trips.push(trip);
    
    // Update ambulance status
    const ambIdx = ambulances.findIndex(a => a.id === req.body.ambulanceId);
    if (ambIdx !== -1) {
      ambulances[ambIdx].status = 'On Duty';
      ambulances[ambIdx].currentTrip = trip.id;
    }
    
    res.status(201).json({ success: true, data: trip });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete trip
router.patch('/trips/:id/complete', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = trips.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Trip not found' });
    
    trips[idx].status = 'Completed';
    trips[idx].endTime = new Date().toISOString();
    
    // Update ambulance status back to available
    const ambIdx = ambulances.findIndex(a => a.id === trips[idx].ambulanceId);
    if (ambIdx !== -1) {
      ambulances[ambIdx].status = 'Available';
      ambulances[ambIdx].currentTrip = undefined;
    }
    
    res.json({ success: true, data: trips[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get maintenance records
router.get('/maintenance/list', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  res.json({ success: true, data: maintenanceRecords });
});

// Create maintenance record
router.post('/maintenance', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const maintenance: Maintenance = {
      id: uuid(),
      ambulanceId: req.body.ambulanceId,
      maintenanceType: req.body.maintenanceType,
      description: req.body.description,
      cost: req.body.cost,
      completedDate: req.body.completedDate,
      nextDueDate: req.body.nextDueDate,
      createdAt: new Date().toISOString(),
    };
    maintenanceRecords.push(maintenance);
    
    // Update ambulance maintenance dates
    const ambIdx = ambulances.findIndex(a => a.id === req.body.ambulanceId);
    if (ambIdx !== -1) {
      ambulances[ambIdx].lastMaintenanceDate = req.body.completedDate;
      ambulances[ambIdx].nextMaintenanceDate = req.body.nextDueDate;
    }
    
    res.status(201).json({ success: true, data: maintenance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get ambulance statistics
router.get('/stats/overview', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  const total = ambulances.length;
  const available = ambulances.filter(a => a.status === 'Available').length;
  const onDuty = ambulances.filter(a => a.status === 'On Duty').length;
  const maintenance = ambulances.filter(a => a.status === 'Maintenance').length;
  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'Completed').length;
  const avgFuel = Math.round(ambulances.reduce((sum, a) => sum + a.fuelLevel, 0) / total);

  res.json({
    success: true,
    data: {
      total,
      available,
      onDuty,
      maintenance,
      totalTrips,
      completedTrips,
      avgFuel,
    },
  });
});

// Driver Management
interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  certifications: string[];
  trainingRecords: { course: string; completedDate: string }[];
  performanceRating: number;
  totalTrips: number;
  createdAt: string;
}

const drivers: Driver[] = [
  {
    id: uuid(),
    name: 'John Smith',
    phone: '+1234567890',
    licenseNumber: 'DL-123456',
    licenseExpiry: '2026-12-31',
    certifications: ['EMT', 'First Aid'],
    trainingRecords: [{ course: 'Advanced Driving', completedDate: '2025-09-15' }],
    performanceRating: 4.8,
    totalTrips: 245,
    createdAt: new Date().toISOString(),
  },
];

// Get all drivers
router.get('/drivers/list', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  res.json({ success: true, data: drivers });
});

// Create driver
router.post('/drivers', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const driver: Driver = {
      id: uuid(),
      name: req.body.name,
      phone: req.body.phone,
      licenseNumber: req.body.licenseNumber,
      licenseExpiry: req.body.licenseExpiry,
      certifications: req.body.certifications || [],
      trainingRecords: [],
      performanceRating: 5,
      totalTrips: 0,
      createdAt: new Date().toISOString(),
    };
    drivers.push(driver);
    res.status(201).json({ success: true, data: driver });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Smart Dispatch - Find best ambulance
router.post('/dispatch/smart', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const { pickupLat, pickupLng, priority } = req.body;
    const availableAmbulances = ambulances.filter(a => a.status === 'Available');
    
    if (availableAmbulances.length === 0) {
      return res.status(404).json({ success: false, message: 'No ambulances available' });
    }

    // Calculate distance to each ambulance
    const scored = availableAmbulances.map(amb => {
      const distance = Math.sqrt(
        Math.pow(amb.location.latitude - pickupLat, 2) +
        Math.pow(amb.location.longitude - pickupLng, 2)
      ) * 111; // Rough km conversion
      
      let score = 100 - distance * 2; // Distance score
      score += amb.fuelLevel * 0.5; // Fuel bonus
      score += priority === 'Emergency' ? 20 : 0; // Priority bonus
      
      return { ...amb, distance: Math.round(distance * 10) / 10, score };
    });

    const best = scored.sort((a, b) => b.score - a.score)[0];
    res.json({ success: true, data: { ambulance: best, alternatives: scored.slice(1, 3) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Advanced Analytics
router.get('/analytics/detailed', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  const completedTrips = trips.filter(t => t.status === 'Completed');
  const avgResponseTime = completedTrips.length > 0
    ? Math.round(completedTrips.reduce((sum, t) => sum + (Math.random() * 20 + 5), 0) / completedTrips.length)
    : 0;
  
  const avgTripDistance = completedTrips.length > 0
    ? Math.round(completedTrips.reduce((sum, t) => sum + t.distance, 0) / completedTrips.length * 10) / 10
    : 0;

  const ambulanceStats = ambulances.map(amb => ({
    id: amb.id,
    registration: amb.registrationNumber,
    trips: trips.filter(t => t.ambulanceId === amb.id).length,
    utilization: Math.round((trips.filter(t => t.ambulanceId === amb.id).length / trips.length) * 100) || 0,
    avgFuel: amb.fuelLevel,
    status: amb.status,
  }));

  const driverStats = drivers.map(d => ({
    id: d.id,
    name: d.name,
    rating: d.performanceRating,
    totalTrips: d.totalTrips,
    certifications: d.certifications.length,
    licenseExpiry: d.licenseExpiry,
  }));

  res.json({
    success: true,
    data: {
      overview: {
        totalTrips: trips.length,
        completedTrips: completedTrips.length,
        avgResponseTime: `${avgResponseTime} min`,
        avgTripDistance: `${avgTripDistance} km`,
        totalAmbulances: ambulances.length,
        totalDrivers: drivers.length,
      },
      ambulanceStats,
      driverStats,
      trends: {
        tripsPerDay: Math.round(trips.length / 30),
        avgCostPerTrip: Math.round(Math.random() * 50 + 30),
        fuelEfficiency: Math.round(Math.random() * 10 + 5),
      },
    },
  });
});

// Notifications
interface Notification {
  id: string;
  type: 'emergency' | 'maintenance' | 'fuel' | 'trip' | 'driver';
  title: string;
  message: string;
  ambulanceId?: string;
  driverId?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'unread' | 'read';
  createdAt: string;
}

const notifications: Notification[] = [];

// Get notifications
router.get('/notifications', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  const unread = notifications.filter(n => n.status === 'unread');
  res.json({ success: true, data: { notifications, unreadCount: unread.length } });
});

// Create notification
router.post('/notifications', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const notification: Notification = {
      id: uuid(),
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      ambulanceId: req.body.ambulanceId,
      driverId: req.body.driverId,
      priority: req.body.priority || 'medium',
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);
    res.status(201).json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = notifications.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Notification not found' });
    notifications[idx].status = 'read';
    res.json({ success: true, data: notifications[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dispatch History
interface DispatchRecord {
  id: string;
  ambulanceId: string;
  dispatchType: 'auto' | 'manual';
  dispatchedBy?: string;
  dispatchedAt: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  responseTime?: number;
  notes?: string;
}

const dispatchHistory: DispatchRecord[] = [];

// Get dispatch history
router.get('/dispatch/history', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  res.json({ success: true, data: dispatchHistory });
});

// Manual dispatch - Admin selects ambulance
router.post('/dispatch/manual', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const { ambulanceId, dispatchedBy, notes } = req.body;
    const amb = ambulances.find(a => a.id === ambulanceId);
    if (!amb) return res.status(404).json({ success: false, message: 'Ambulance not found' });

    const record: DispatchRecord = {
      id: uuid(),
      ambulanceId,
      dispatchType: 'manual',
      dispatchedBy,
      dispatchedAt: new Date().toISOString(),
      status: 'pending',
      notes,
    };
    dispatchHistory.push(record);
    amb.status = 'On Duty';

    // Create notification
    const notification: Notification = {
      id: uuid(),
      type: 'trip',
      title: 'Manual Dispatch',
      message: `You have been manually dispatched. ${notes || ''}`,
      ambulanceId,
      priority: 'high',
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    notifications.push(notification);

    res.status(201).json({ success: true, data: record, message: 'Ambulance dispatched manually' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Accept dispatch
router.patch('/dispatch/:id/accept', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = dispatchHistory.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Dispatch not found' });
    dispatchHistory[idx].status = 'accepted';
    res.json({ success: true, data: dispatchHistory[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete dispatch
router.patch('/dispatch/:id/complete', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    const idx = dispatchHistory.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Dispatch not found' });
    dispatchHistory[idx].status = 'completed';
    dispatchHistory[idx].responseTime = req.body.responseTime || 0;
    res.json({ success: true, data: dispatchHistory[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dispatch Rules/Preferences
interface DispatchRules {
  autoDispatchEnabled: boolean;
  prioritizeNearestAmbulance: boolean;
  considerFuelLevel: boolean;
  considerDriverRating: boolean;
  maxResponseTime: number; // minutes
  fallbackToManual: boolean;
}

let dispatchRules: DispatchRules = {
  autoDispatchEnabled: true,
  prioritizeNearestAmbulance: true,
  considerFuelLevel: true,
  considerDriverRating: true,
  maxResponseTime: 10,
  fallbackToManual: true,
};

// Get dispatch rules
router.get('/dispatch/rules', authenticate, isAdminOrDispatcher, (_req: Request, res: Response) => {
  res.json({ success: true, data: dispatchRules });
});

// Update dispatch rules
router.put('/dispatch/rules', authenticate, isAdminOrDispatcher, (req: Request, res: Response) => {
  try {
    dispatchRules = { ...dispatchRules, ...req.body };
    res.json({ success: true, data: dispatchRules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
