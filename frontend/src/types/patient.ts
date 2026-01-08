export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validUntil: string;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface Patient extends PatientFormData {
  id: string;
  status: 'active' | 'inactive' | 'archived';
  lastVisit?: string;
  registrationDate: string;
  profileImage?: string;
  insurance?: Insurance;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  createdAt?: string;
  updatedAt?: string;
}
