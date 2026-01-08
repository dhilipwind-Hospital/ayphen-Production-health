import { useState, useEffect } from 'react';
import api from '../services/api';

interface OrganizationStats {
  totalPatients: number;
  totalDoctors: number;
  totalStaff: number;
  totalDepartments: number;
  totalServices: number;
  totalAppointments: number;
  totalMedicines: number;
  totalLabTests: number;
  isNewOrganization: boolean;
}

export const useOrganizationData = () => {
  const [stats, setStats] = useState<OrganizationStats>({
    totalPatients: 0,
    totalDoctors: 0,
    totalStaff: 0,
    totalDepartments: 0,
    totalServices: 0,
    totalAppointments: 0,
    totalMedicines: 0,
    totalLabTests: 0,
    isNewOrganization: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationStats = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats to determine if organization has data
        const response = await api.get('/analytics/dashboard-stats');
        const data = response.data?.data || {};

        const orgStats = {
          totalPatients: data.totalPatients || 0,
          totalDoctors: data.totalDoctors || 0,
          totalStaff: data.totalStaff || 0,
          totalDepartments: data.totalDepartments || 0,
          totalServices: data.totalServices || 0,
          totalAppointments: data.totalAppointments || 0,
          totalMedicines: data.totalMedicines || 0,
          totalLabTests: data.totalLabTests || 0,
          isNewOrganization: false,
        };

        // Determine if this is a new organization (no meaningful data)
        const hasData = orgStats.totalPatients > 0 || 
                       orgStats.totalDoctors > 0 || 
                       orgStats.totalDepartments > 0 ||
                       orgStats.totalServices > 0;

        orgStats.isNewOrganization = !hasData;
        setStats(orgStats);
      } catch (error) {
        console.error('Error fetching organization stats:', error);
        // Default to new organization if we can't fetch stats
        setStats(prev => ({ ...prev, isNewOrganization: true }));
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationStats();
  }, []);

  return { stats, loading, refetch: () => window.location.reload() };
};
