import api from './api';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  totalPrescriptions: number;
  totalLabOrders: number;
  emergencyRequests: number;
  callbackRequests: number;
  activeDepartments: number;
  activeDoctors: number;
}

export interface DepartmentPerformance {
  id: string;
  department: string;
  patients: number;
  appointments: number;
  utilization: number;
}

export interface RecentActivity {
  id: string;
  patient: string;
  doctor: string;
  department: string;
  time: string;
  status: string;
}

class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/analytics/dashboard-stats');
    return response.data;
  }

  async getDepartmentPerformance(): Promise<DepartmentPerformance[]> {
    const response = await api.get('/analytics/department-performance');
    return response.data;
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    const response = await api.get('/analytics/recent-activity');
    return response.data;
  }
}

export default new AnalyticsService();
