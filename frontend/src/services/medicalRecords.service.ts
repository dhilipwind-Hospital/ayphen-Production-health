import api from './api';

export interface MedicalRecordParams {
  patientId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MedicalRecordFormData {
  patientId: string;
  doctorId?: string;
  type: string;
  title: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  recordDate: string;
  file?: File;
}

const medicalRecordsService = {
  // Get all medical records with filters
  getMedicalRecords: async (params: MedicalRecordParams = {}) => {
    const response = await api.get('/medical-records', { params });
    return response.data;
  },

  // Get aggregated records (medical records + prescriptions + lab orders)
  getAggregatedRecords: async (patientId?: string) => {
    const response = await api.get('/medical-records/aggregated', {
      params: patientId ? { patientId } : {}
    });
    return response.data;
  },

  // Get single medical record
  getMedicalRecord: async (id: string) => {
    const response = await api.get(`/medical-records/${id}`);
    return response.data;
  },

  // Create medical record with optional file upload
  createMedicalRecord: async (data: MedicalRecordFormData) => {
    const formData = new FormData();
    
    formData.append('patientId', data.patientId);
    if (data.doctorId) formData.append('doctorId', data.doctorId);
    formData.append('type', data.type);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.diagnosis) formData.append('diagnosis', data.diagnosis);
    if (data.treatment) formData.append('treatment', data.treatment);
    if (data.medications) formData.append('medications', data.medications);
    formData.append('recordDate', data.recordDate);
    if (data.file) formData.append('file', data.file);

    const response = await api.post('/medical-records', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update medical record
  updateMedicalRecord: async (id: string, data: Partial<MedicalRecordFormData>) => {
    const formData = new FormData();
    
    if (data.type) formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.diagnosis) formData.append('diagnosis', data.diagnosis);
    if (data.treatment) formData.append('treatment', data.treatment);
    if (data.medications) formData.append('medications', data.medications);
    if (data.recordDate) formData.append('recordDate', data.recordDate);
    if (data.file) formData.append('file', data.file);

    const response = await api.put(`/medical-records/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Delete medical record
  deleteMedicalRecord: async (id: string) => {
    await api.delete(`/medical-records/${id}`);
  },

  // Download medical record file
  downloadMedicalRecord: async (id: string, filename: string = 'medical-record') => {
    const response = await api.get(`/medical-records/${id}/download`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get prescription details with items
  getPrescriptionDetails: async (prescriptionId: string) => {
    const response = await api.get(`/pharmacy/prescriptions/${prescriptionId}`);
    return response.data;
  }
};

export default medicalRecordsService;
