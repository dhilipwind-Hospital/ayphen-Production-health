import api from './api';

export interface TelemedicineSession {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
  sessionType: 'Video' | 'Audio' | 'Chat';
  reason: string;
  notes?: string;
  prescriptions?: string[];
  followUpRequired: boolean;
  recordingAvailable: boolean;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;
}

export interface VirtualWaitingRoom {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  appointmentTime: string;
  waitingTime: number;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  deviceStatus: 'Ready' | 'Testing' | 'Issues';
  connectionQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  joinedAt: string;
}

export interface TelemedicineStatistics {
  todaySessions: number;
  activeSessions: number;
  completedSessions: number;
  waitingPatients: number;
  avgDuration: number;
  patientSatisfaction: number;
  totalSessions: number;
}

class TelemedicineService {
  // Session Management
  async getSessions(filters?: {
    status?: string;
    date?: string;
    doctorId?: string;
  }): Promise<{ data: TelemedicineSession[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.doctorId) params.append('doctorId', filters.doctorId);

      const response = await api.get(`/telemedicine/sessions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching telemedicine sessions:', error);
      throw error;
    }
  }

  async createSession(sessionData: {
    patientId: string;
    patientName: string;
    doctorId?: string;
    doctorName?: string;
    appointmentDate: string;
    appointmentTime: string;
    duration?: number;
    sessionType?: 'Video' | 'Audio' | 'Chat';
    reason?: string;
  }): Promise<TelemedicineSession> {
    try {
      const response = await api.post('/telemedicine/sessions', sessionData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating telemedicine session:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, updates: Partial<TelemedicineSession>): Promise<TelemedicineSession> {
    try {
      const response = await api.put(`/telemedicine/sessions/${sessionId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating telemedicine session:', error);
      throw error;
    }
  }

  async startSession(sessionId: string): Promise<{
    session: TelemedicineSession;
    sessionToken: string;
    videoRoomId: string;
  }> {
    try {
      const response = await api.post(`/telemedicine/sessions/${sessionId}/start`);
      return response.data.data;
    } catch (error) {
      console.error('Error starting telemedicine session:', error);
      throw error;
    }
  }

  async endSession(sessionId: string, sessionData: {
    notes?: string;
    prescriptions?: string[];
    followUpRequired?: boolean;
  }): Promise<TelemedicineSession> {
    try {
      const response = await api.post(`/telemedicine/sessions/${sessionId}/end`, sessionData);
      return response.data.data;
    } catch (error) {
      console.error('Error ending telemedicine session:', error);
      throw error;
    }
  }

  // Waiting Room Management
  async getWaitingRoom(): Promise<VirtualWaitingRoom[]> {
    try {
      const response = await api.get('/telemedicine/waiting-room');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching waiting room:', error);
      throw error;
    }
  }

  async addToWaitingRoom(patientData: {
    patientId: string;
    patientName: string;
    appointmentTime: string;
    priority?: 'Normal' | 'Urgent' | 'Emergency';
  }): Promise<VirtualWaitingRoom> {
    try {
      const response = await api.post('/telemedicine/waiting-room', patientData);
      return response.data.data;
    } catch (error) {
      console.error('Error adding patient to waiting room:', error);
      throw error;
    }
  }

  async removeFromWaitingRoom(entryId: string): Promise<void> {
    try {
      await api.delete(`/telemedicine/waiting-room/${entryId}`);
    } catch (error) {
      console.error('Error removing patient from waiting room:', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics(): Promise<TelemedicineStatistics> {
    try {
      const response = await api.get('/telemedicine/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching telemedicine statistics:', error);
      throw error;
    }
  }

  // Video Call Integration (WebRTC)
  async initializeVideoCall(sessionId: string): Promise<{
    roomId: string;
    token: string;
    iceServers: RTCIceServer[];
  }> {
    try {
      // This would integrate with a video calling service like Twilio, Agora, or WebRTC
      const response = await api.post(`/telemedicine/sessions/${sessionId}/video/initialize`);
      return response.data.data;
    } catch (error) {
      console.error('Error initializing video call:', error);
      // Fallback to mock data for demo
      return {
        roomId: `room_${sessionId}`,
        token: `token_${Date.now()}`,
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
    }
  }

  // Device Testing
  async testDevices(): Promise<{
    camera: boolean;
    microphone: boolean;
    speakers: boolean;
    connectionQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  }> {
    try {
      // Test camera access
      const cameraTest = await navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          return true;
        })
        .catch(() => false);

      // Test microphone access
      const microphoneTest = await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          return true;
        })
        .catch(() => false);

      // Test speakers (basic check)
      const speakersTest = typeof Audio !== 'undefined';

      // Test connection quality (mock implementation)
      const connectionQuality = 'Excellent' as const;

      return {
        camera: cameraTest,
        microphone: microphoneTest,
        speakers: speakersTest,
        connectionQuality
      };
    } catch (error) {
      console.error('Error testing devices:', error);
      return {
        camera: false,
        microphone: false,
        speakers: false,
        connectionQuality: 'Poor'
      };
    }
  }

  // Real-time notifications (WebSocket integration)
  subscribeToSessionUpdates(callback: (update: {
    type: 'session_started' | 'session_ended' | 'patient_joined' | 'patient_left';
    data: any;
  }) => void): () => void {
    // This would integrate with WebSocket for real-time updates
    const mockInterval = setInterval(() => {
      // Mock real-time updates
      if (Math.random() > 0.95) {
        callback({
          type: 'patient_joined',
          data: { patientName: 'New Patient', timestamp: new Date().toISOString() }
        });
      }
    }, 5000);

    return () => clearInterval(mockInterval);
  }

  // Prescription Integration
  async createPrescription(sessionId: string, prescription: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    notes?: string;
  }): Promise<void> {
    try {
      await api.post(`/telemedicine/sessions/${sessionId}/prescription`, prescription);
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  // Session Recording
  async getSessionRecording(sessionId: string): Promise<{
    recordingUrl: string;
    duration: number;
    size: number;
  }> {
    try {
      const response = await api.get(`/telemedicine/sessions/${sessionId}/recording`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching session recording:', error);
      throw error;
    }
  }
}

export const telemedicineService = new TelemedicineService();
export default telemedicineService;
