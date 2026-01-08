import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create a new prescription
export const createPrescription = (prescriptionData: any) => {
  return api.post('/prescriptions', prescriptionData);
};

// Get prescriptions by doctor
export const getDoctorPrescriptions = (doctorId: string) => {
  return api.get(`/prescriptions/doctor/${doctorId}`);
};

// Get prescriptions by patient
export const getPatientPrescriptions = (patientId: string) => {
  return api.get(`/prescriptions/patient/${patientId}`);
};

// Get prescriptions for pharmacy
export const getPharmacyPrescriptions = (status?: string) => {
  return api.get(`/prescriptions/pharmacy${status ? `?status=${status}` : ''}`);
};

// Get a single prescription by ID
export const getPrescriptionById = (id: string) => {
  return api.get(`/prescriptions/${id}`);
};

// Update prescription status (for pharmacy dispensing)
export const updatePrescriptionStatus = (prescriptionId: string, data: any) => {
  return api.put(`/prescriptions/${prescriptionId}/status`, data);
};

// Update prescription (for doctors to edit pending prescriptions)
export const updatePrescription = (prescriptionId: string, data: any) => {
  return api.put(`/prescriptions/${prescriptionId}`, data);
};

// Cancel a prescription
export const cancelPrescription = (prescriptionId: string) => {
  return api.put(`/prescriptions/${prescriptionId}/cancel`, {});
};
