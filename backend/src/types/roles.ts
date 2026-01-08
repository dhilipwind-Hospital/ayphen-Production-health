export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PATIENT = 'patient',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  ACCOUNTANT = 'accountant'
}

export enum Permission {
  // User permissions
  VIEW_USER = 'view_user',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  
  // Patient permissions
  VIEW_PATIENT = 'view_patient',
  CREATE_PATIENT = 'create_patient',
  UPDATE_PATIENT = 'update_patient',
  DELETE_PATIENT = 'delete_patient',
  
  // Appointment permissions
  VIEW_APPOINTMENT = 'view_appointment',
  CREATE_APPOINTMENT = 'create_appointment',
  UPDATE_APPOINTMENT = 'update_appointment',
  DELETE_APPOINTMENT = 'delete_appointment',
  
  // Medical record permissions
  VIEW_MEDICAL_RECORD = 'view_medical_record',
  CREATE_MEDICAL_RECORD = 'create_medical_record',
  UPDATE_MEDICAL_RECORD = 'update_medical_record',
  
  // Billing permissions
  VIEW_BILL = 'view_bill',
  CREATE_BILL = 'create_bill',
  UPDATE_BILL = 'update_bill',
  
  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  
  // Settings permissions
  MANAGE_SETTINGS = 'manage_settings',
  
  // Role permissions
  MANAGE_ROLES = 'manage_roles',
  
  // Report permissions
  VIEW_REPORTS = 'view_reports',
  GENERATE_REPORTS = 'generate_reports'
}

type RolePermissions = {
  [key in UserRole]: Permission[];
};

export const rolePermissions: RolePermissions = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  
  [UserRole.ADMIN]: [
    Permission.VIEW_USER,
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_PATIENT,
    Permission.CREATE_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT,
    Permission.CREATE_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD,
    Permission.VIEW_BILL,
    Permission.CREATE_BILL,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS
  ],
  
  [UserRole.DOCTOR]: [
    Permission.VIEW_PATIENT,
    Permission.VIEW_APPOINTMENT,
    Permission.CREATE_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD,
    Permission.CREATE_MEDICAL_RECORD,
    Permission.UPDATE_MEDICAL_RECORD
  ],
  
  [UserRole.NURSE]: [
    Permission.VIEW_PATIENT,
    Permission.VIEW_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD,
    Permission.UPDATE_MEDICAL_RECORD
  ],
  
  [UserRole.PATIENT]: [
    Permission.VIEW_APPOINTMENT,
    Permission.CREATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD,
    Permission.VIEW_BILL
  ],
  
  [UserRole.RECEPTIONIST]: [
    Permission.VIEW_PATIENT,
    Permission.CREATE_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT,
    Permission.CREATE_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT
  ],
  
  [UserRole.PHARMACIST]: [
    Permission.VIEW_PATIENT,
    Permission.VIEW_MEDICAL_RECORD,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY
  ],
  
  [UserRole.LAB_TECHNICIAN]: [
    Permission.VIEW_PATIENT,
    Permission.VIEW_MEDICAL_RECORD,
    Permission.UPDATE_MEDICAL_RECORD,
    Permission.VIEW_INVENTORY
  ],
  
  [UserRole.ACCOUNTANT]: [
    Permission.VIEW_BILL,
    Permission.CREATE_BILL,
    Permission.UPDATE_BILL,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS
  ]
};

// Helper function to check if a role has a specific permission
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role]?.includes(permission) || false;
};

// Helper to get all permissions for a role
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
};
