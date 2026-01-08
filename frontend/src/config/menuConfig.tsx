import React from 'react';
import {
  DashboardOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  TeamOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  AlertOutlined,
  UnorderedListOutlined,
  StarOutlined,
  PhoneOutlined,
} from '@ant-design/icons';

export type UserRole = 'admin' | 'super_admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist' | 'pharmacist' | 'lab_technician' | 'lab_supervisor' | 'accountant';

export interface MenuItem {
  key: string;
  icon?: any;
  label: string;
  path?: string;
  children?: MenuItem[];
  roles: UserRole[];
  description?: string;
}

/**
 * Centralized menu configuration for all user roles
 * Each menu item defines which roles can see it
 */
export const menuConfig: MenuItem[] = [
  // Dashboard - Available to all authenticated users
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/',
    roles: ['admin', 'super_admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_technician', 'lab_supervisor', 'accountant'],
    description: 'Main dashboard'
  },

  // Appointments - Multiple views for different roles
  {
    key: 'appointments',
    icon: <CalendarOutlined />,
    label: 'Appointments',
    path: '/appointments',
    roles: ['patient', 'doctor', 'nurse', 'receptionist'],
    description: 'View personal appointments'
  },

  // Book Appointment - Patients only
  {
    key: 'book-appointment',
    icon: <CalendarOutlined />,
    label: 'Book Appointment',
    path: '/appointments/new',
    roles: ['patient'],
    description: 'Book a new appointment'
  },

  // Doctor Availability - Doctors only
  {
    key: 'availability-setup',
    icon: <ClockCircleOutlined />,
    label: 'My Availability',
    path: '/doctor/availability-setup',
    roles: ['doctor'],
    description: 'Set your working hours and availability'
  },

  // Emergency Appointment - Patients and staff
  {
    key: 'emergency-appointment',
    icon: <AlertOutlined />,
    label: 'Emergency Appointment',
    path: '/appointments/emergency',
    roles: ['patient', 'receptionist', 'nurse'],
    description: 'Book emergency same-day appointment'
  },

  // Laboratory
  {
    key: 'laboratory',
    icon: <ExperimentOutlined />,
    label: 'Laboratory',
    roles: ['doctor', 'patient', 'lab_technician', 'lab_supervisor', 'admin', 'super_admin', 'nurse'],
    children: [
      // Doctor items
      {
        key: 'lab-order',
        label: 'Order Lab Tests',
        path: '/laboratory/order',
        roles: ['doctor', 'admin', 'super_admin'],
        description: 'Create lab test orders for patients'
      },
      {
        key: 'lab-results',
        label: 'View Lab Results',
        path: '/laboratory/results',
        roles: ['doctor', 'admin', 'super_admin'],
        description: 'View lab test results'
      },
      // Lab Tech items
      {
        key: 'lab-dashboard',
        label: 'Lab Dashboard',
        path: '/laboratory/dashboard',
        roles: ['lab_technician', 'lab_supervisor', 'admin', 'super_admin'],
        description: 'Laboratory management dashboard'
      },
      {
        key: 'lab-sample-collection',
        label: 'Sample Collection',
        path: '/laboratory/sample-collection',
        roles: ['lab_technician', 'lab_supervisor', 'admin', 'super_admin'],
        description: 'Collect and log samples'
      },
      {
        key: 'lab-results-entry',
        label: 'Results Entry',
        path: '/laboratory/results-entry',
        roles: ['lab_technician', 'lab_supervisor', 'admin', 'super_admin'],
        description: 'Enter lab test results'
      },
      // Patient items
      {
        key: 'lab-my-results',
        label: 'My Lab Results',
        path: '/laboratory/my-results',
        roles: ['patient'],
        description: 'View your lab test results'
      },
      // Admin items
      {
        key: 'lab-test-catalog',
        label: 'Test Catalog',
        path: '/laboratory/tests',
        roles: ['admin', 'super_admin'],
        description: 'Manage lab test catalog'
      },
    ]
  },

  // Medical Records
  {
    key: 'records',
    icon: <FileTextOutlined />,
    label: 'Medical Records',
    path: '/records',
    roles: ['doctor', 'nurse', 'patient', 'admin', 'super_admin'],
    description: 'View and manage medical records'
  },

  // Patients
  {
    key: 'patients',
    icon: <UserOutlined />,
    label: 'Patients',
    path: '/patients',
    roles: ['doctor', 'nurse', 'receptionist', 'admin', 'super_admin'],
    description: 'Patient management'
  },

  // Pharmacy
  {
    key: 'pharmacy',
    icon: <MedicineBoxOutlined />,
    label: 'Pharmacy',
    path: '/pharmacy',
    roles: ['doctor', 'nurse', 'patient', 'pharmacist', 'admin', 'super_admin'],
    description: 'Pharmacy management'
  },

  // Patient Portal
  {
    key: 'portal',
    icon: <UserOutlined />,
    label: 'Patient Portal',
    path: '/portal',
    roles: ['patient', 'receptionist', 'nurse', 'admin', 'super_admin'],
    description: 'Patient self-service portal'
  },

  // ==================== ADMIN ONLY ITEMS ====================

  // All Appointments (Admin view)
  {
    key: 'all-appointments',
    icon: <CalendarOutlined />,
    label: 'All Appointments',
    path: '/admin/appointments',
    roles: ['admin', 'super_admin'],
    description: 'View and manage all appointments'
  },

  // Appointment Management Dashboard
  {
    key: 'appointment-management',
    icon: <UnorderedListOutlined />,
    label: 'Appointment Management',
    path: '/admin/appointments-management',
    roles: ['admin', 'super_admin'],
    description: 'Manage appointment settings and policies'
  },

  // Callback Requests
  {
    key: 'callback-requests',
    icon: <PhoneOutlined />,
    label: 'Callback Requests',
    path: '/admin/callback-requests',
    roles: ['admin', 'super_admin'],
    description: 'View patient callback requests'
  },

  // Departments
  {
    key: 'departments-admin',
    icon: <TeamOutlined />,
    label: 'Departments',
    path: '/admin/departments',
    roles: ['admin', 'super_admin'],
    description: 'Manage hospital departments'
  },

  // Emergency Requests (Admin)
  {
    key: 'emergency-requests',
    icon: <AlertOutlined />,
    label: 'Emergency Requests',
    path: '/admin/emergency-requests',
    roles: ['admin', 'super_admin'],
    description: 'View emergency appointment requests'
  },

  // Inpatient Management
  {
    key: 'inpatient-management',
    icon: <HomeOutlined />,
    label: 'Inpatient Management',
    roles: ['admin', 'super_admin'],
    children: [
      {
        key: 'inpatient-wards',
        label: 'Wards',
        path: '/admin/inpatient/wards',
        roles: ['admin', 'super_admin'],
        description: 'Manage hospital wards'
      },
      {
        key: 'inpatient-rooms',
        label: 'Rooms',
        path: '/admin/inpatient/rooms',
        roles: ['admin', 'super_admin'],
        description: 'Manage patient rooms'
      },
      {
        key: 'inpatient-beds',
        label: 'Beds',
        path: '/inpatient/beds',
        roles: ['admin', 'super_admin'],
        description: 'Manage bed allocation'
      },
    ]
  },

  // Manage Doctors
  {
    key: 'staff',
    icon: <TeamOutlined />,
    label: 'Manage Doctors',
    path: '/admin/doctors',
    roles: ['admin', 'super_admin'],
    description: 'Manage doctor accounts and schedules'
  },

  // Manage Services
  {
    key: 'manage-services',
    icon: <MedicineBoxOutlined />,
    label: 'Manage Services',
    path: '/admin/services',
    roles: ['admin', 'super_admin'],
    description: 'Manage hospital services'
  },

  // Reports
  {
    key: 'reports',
    icon: <FileTextOutlined />,
    label: 'Reports',
    path: '/admin/reports',
    roles: ['admin', 'super_admin'],
    description: 'View hospital analytics and reports'
  },

  // Queue Management - Nurse and Receptionist
  {
    key: 'queue',
    icon: <UnorderedListOutlined />,
    label: 'Queue Management',
    path: '/queue',
    roles: ['nurse', 'receptionist', 'admin', 'super_admin'],
    description: 'Patient queue management'
  },

  // Triage - Nurse
  {
    key: 'triage',
    icon: <HeartOutlined />,
    label: 'Triage Station',
    path: '/triage',
    roles: ['nurse', 'admin', 'super_admin'],
    description: 'Patient triage and vital signs'
  },

  // Billing
  {
    key: 'billing',
    icon: <FileTextOutlined />,
    label: 'Billing',
    path: '/billing',
    roles: ['accountant', 'admin', 'super_admin'],
    description: 'Billing and payments'
  },

  // Settings - Available to most users
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    path: '/settings',
    roles: ['admin', 'super_admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_technician', 'lab_supervisor', 'accountant'],
    description: 'User settings and preferences'
  },
];

/**
 * Filter menu items based on user role and organization
 * @param role - User's role
 * @param organizationId - Organization ID (for future organizational filtering)
 * @returns Filtered menu items for the user
 */
export function getMenuItemsForRole(role: UserRole | string, organizationId?: string): MenuItem[] {
  const normalizedRole = String(role).toLowerCase() as UserRole;

  // Filter menu items based on user role
  const filteredItems = menuConfig
    .filter(item => item.roles.includes(normalizedRole))
    .map(item => ({
      ...item,
      children: item.children
        ? item.children.filter(child => child.roles.includes(normalizedRole))
        : undefined
    }))
    // Remove items that have no children after filtering
    .filter(item => !item.children || item.children.length > 0);

  return filteredItems;
}

/**
 * Get specific menu item configuration
 * @param key - Menu item key
 * @returns Menu item configuration or undefined
 */
export function getMenuItemByKey(key: string): MenuItem | undefined {
  const findItem = (items: MenuItem[]): MenuItem | undefined => {
    for (const item of items) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findItem(item.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  return findItem(menuConfig);
}

/**
 * Get menu path for a specific role (dashboard fallback)
 * @param role - User's role
 * @returns Appropriate dashboard path for role
 */
export function getDashboardPathForRole(role: UserRole | string): string {
  const normalizedRole = String(role).toLowerCase() as UserRole;

  const dashboardMap: Record<UserRole, string> = {
    super_admin: '/admin/appointments',
    admin: '/admin/appointments',
    doctor: '/queue/doctor',
    nurse: '/queue/triage',
    receptionist: '/queue/reception',
    pharmacist: '/pharmacy',
    lab_technician: '/laboratory/dashboard',
    lab_supervisor: '/laboratory/dashboard',
    accountant: '/billing',
    patient: '/portal',
  };

  return dashboardMap[normalizedRole] || '/';
}

/**
 * Check if a role has access to a menu item
 * @param role - User's role
 * @param menuKey - Menu item key
 * @returns True if role has access to menu item
 */
export function hasMenuAccess(role: UserRole | string, menuKey: string): boolean {
  const normalizedRole = String(role).toLowerCase() as UserRole;
  const menuItem = getMenuItemByKey(menuKey);
  return menuItem ? menuItem.roles.includes(normalizedRole) : false;
}

/**
 * Get all menu keys accessible to a role
 * @param role - User's role
 * @returns Array of accessible menu keys
 */
export function getAccessibleMenuKeys(role: UserRole | string): string[] {
  const items = getMenuItemsForRole(role);
  const keys: string[] = [];

  const collectKeys = (items: MenuItem[]) => {
    items.forEach(item => {
      keys.push(item.key);
      if (item.children) {
        collectKeys(item.children);
      }
    });
  };

  collectKeys(items);
  return keys;
}
