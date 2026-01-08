import api from './api';
import { Patient, PatientFormData } from '../types/patient';

const patientService = {
  // Get all patients with pagination and filters
  getPatients: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string | string[];
    gender?: string | string[];
    bloodGroup?: string | string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    // Convert array filters to comma-separated strings if needed
    const processedParams = { ...params };
    if (Array.isArray(processedParams.status)) {
      processedParams.status = processedParams.status.join(',');
    }
    if (Array.isArray(processedParams.gender)) {
      processedParams.gender = processedParams.gender.join(',');
    }
    if (Array.isArray(processedParams.bloodGroup)) {
      processedParams.bloodGroup = processedParams.bloodGroup.join(',');
    }
    const response = await api.get('/users', { params: { ...processedParams, role: 'patient' } });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  // Get a single patient by ID
  getPatient: async (id: string): Promise<Patient> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create a new patient
  createPatient: async (data: PatientFormData): Promise<Patient> => {
    const response = await api.post('/users', { ...data, role: 'patient' });
    return response.data;
  },

  // Update an existing patient
  updatePatient: async (id: string, data: Partial<PatientFormData>): Promise<Patient> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete a patient
  deletePatient: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Bulk delete patients
  bulkDeletePatients: async (ids: string[]): Promise<void> => {
    await api.delete('/users/bulk-delete', { data: { ids } });
  },

  // Export patients data
  exportPatients: async (format: 'csv' | 'pdf', filters: Record<string, any> = {}) => {
    const response = await api.get(`/users/export/${format}`, {
      params: { role: 'patient', ...filters },
      responseType: 'blob',
    });
    return response.data;
  },

  // Upload patient photo
  uploadPatientPhoto: async (patientId: string, file: File): Promise<{ photoUrl: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.post(`/users/${patientId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};

export default patientService;
