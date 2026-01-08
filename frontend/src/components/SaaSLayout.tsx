import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, theme, Breadcrumb, Badge, Divider } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  ExperimentOutlined,
  HomeOutlined,
  BankOutlined,
  CrownOutlined,
  SafetyOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  AuditOutlined,
  DollarOutlined,
  HeartOutlined,
  PhoneOutlined,
  AlertOutlined,
  GlobalOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  RocketOutlined,
  AppstoreOutlined,
  ShopOutlined,
  ExperimentFilled,
  UserSwitchOutlined,
  ScheduleOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styled from 'styled-components';
import ThemeToggle from './ThemeToggle';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import NotificationBell from './NotificationBell';
import ChooseHospital from '../pages/onboarding/ChooseHospital';
import { useOrganizationData } from '../hooks/useOrganizationData';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// Types for permissions (matching backend)
enum UserRole {
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

enum Permission {
  VIEW_USER = 'view_user',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  VIEW_PATIENT = 'view_patient',
  CREATE_PATIENT = 'create_patient',
  UPDATE_PATIENT = 'update_patient',
  DELETE_PATIENT = 'delete_patient',
  VIEW_APPOINTMENT = 'view_appointment',
  CREATE_APPOINTMENT = 'create_appointment',
  UPDATE_APPOINTMENT = 'update_appointment',
  DELETE_APPOINTMENT = 'delete_appointment',
  VIEW_MEDICAL_RECORD = 'view_medical_record',
  CREATE_MEDICAL_RECORD = 'create_medical_record',
  UPDATE_MEDICAL_RECORD = 'update_medical_record',
  VIEW_BILL = 'view_bill',
  CREATE_BILL = 'create_bill',
  UPDATE_BILL = 'update_bill',
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_ROLES = 'manage_roles',
  VIEW_REPORTS = 'view_reports',
  GENERATE_REPORTS = 'generate_reports'
}

const rolePermissions = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.VIEW_USER, Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
    Permission.MANAGE_SETTINGS, Permission.MANAGE_ROLES, Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL, Permission.CREATE_BILL,
    Permission.VIEW_INVENTORY, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS
  ],
  [UserRole.DOCTOR]: [
    Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD, Permission.CREATE_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD
  ],
  [UserRole.NURSE]: [
    Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD
  ],
  [UserRole.PATIENT]: [
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT
  ],
  [UserRole.PHARMACIST]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_INVENTORY, Permission.MANAGE_INVENTORY
  ],
  [UserRole.LAB_TECHNICIAN]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD, Permission.VIEW_INVENTORY
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.VIEW_BILL, Permission.CREATE_BILL, Permission.UPDATE_BILL, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS
  ]
};

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(233, 30, 99, 0.08);
  z-index: 1;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  height: 64px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  color: #e91e63;
`;

const OrganizationInfo = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(233, 30, 99, 0.1);
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
`;

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  min-height: 280px;
  background: #fff;
  border-radius: 8px;
`;

const hasPermission = (role: string, permission: Permission): boolean => {
  const userRole = role.toUpperCase() as UserRole;
  return rolePermissions[userRole]?.includes(permission) || false;
};

const SaaSLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('hms_sider_collapsed') === '1'; } catch { return false; }
  });
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const location = useLocation();
  const { stats: orgStats, loading: orgLoading } = useOrganizationData();
  
  useKeyboardShortcuts();

  useEffect(() => {
    try { localStorage.setItem('hms_sider_collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const role = String(user?.role || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isDoctor = role === 'doctor';
  const isPharmacist = role === 'pharmacist';
  const isLabTech = role === 'lab_technician';
  const isAccountant = role === 'accountant';
  const isNurse = role === 'nurse';
  const isReceptionist = role === 'receptionist';
  const isPatient = role === 'patient';

  // Option B (flagged): require org selection before showing tenant UI
  const requireOrgSelection = String(process.env.REACT_APP_REQUIRE_ORG_SELECTION || 'false').toLowerCase() === 'true';
  const hasOrganization = Boolean((user as any)?.organization?.id);
  if (requireOrgSelection && user && !hasOrganization) {
    return (
      <StyledLayout className="app-layout">
        <Layout>
          <StyledHeader>
            <Title level={4} style={{ margin: 0, color: '#e91e63' }}>Select Hospital</Title>
          </StyledHeader>
          <StyledContent>
            <ChooseHospital />
          </StyledContent>
        </Layout>
      </StyledLayout>
    );
  }

  // SaaS Organization Info - Dynamic from user's organization
  const organizationInfo = {
    name: (user as any)?.organization?.name || 'Organization',
    plan: (user as any)?.organization?.subscription?.plan || 'Basic',
    users: (user as any)?.organization?.userCount || 0,
    maxUsers: (user as any)?.organization?.maxUsers || 100
  };

  // Role-based branding display: Admins/Super Admins can see branding.displayName override
  const orgObj: any = (user as any)?.organization || {};
  const brandingDisplayName: string | undefined = orgObj?.settings?.branding?.displayName;
  const rawName: string | undefined = orgObj?.name;
  const subdomain: string | undefined = orgObj?.subdomain;
  const titleCase = (s?: string) => (s || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const subdomainFallback = titleCase(subdomain) || 'Organization';
  
  // Super Admin gets special branding
  let displayOrgName;
  if (isSuperAdmin) {
    displayOrgName = 'Ayphen Care';
  } else {
    displayOrgName = (isAdmin || isSuperAdmin)
      ? (brandingDisplayName || rawName || subdomainFallback)
      : (rawName || subdomainFallback);
    displayOrgName = titleCase(displayOrgName);
    if ((isAdmin || isSuperAdmin) && String(subdomain).toLowerCase() === 'ayphen' && (!brandingDisplayName || displayOrgName.toLowerCase() === 'care')) {
      displayOrgName = 'Ayphen Care';
    }
  }

  const displayPlan = organizationInfo.plan !== 'Basic' ? organizationInfo.plan : 'Basic';
  const displayUsers = organizationInfo.users > 0 ? organizationInfo.users : 0;
  const displayMaxUsers = organizationInfo.maxUsers > 0 ? organizationInfo.maxUsers : 100;

  // Define menu items based on permissions and organization data
  const getMenuItems = () => {
    const items = [];
    const isNewOrg = orgStats.isNewOrganization;

    // Dashboard - Everyone gets this
    items.push({
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/',
    });

    // For new organizations, show minimal menu focused on setup (but not for super_admin)
    if (isNewOrg && isAdmin && !isSuperAdmin) {
      // Essential administration for new orgs - First priority
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'Administration',
        children: [
          {
            key: 'admin-departments',
            label: 'Departments',
            path: '/admin/departments',
          },
          {
            key: 'admin-staff',
            label: 'Staff Management',
            path: '/admin/staff',
          },
          {
            key: 'admin-doctors',
            label: 'Doctors',
            path: '/admin/doctors',
          },
          {
            key: 'admin-services',
            label: 'Services',
            path: '/admin/services',
          },
          {
            key: 'admin-pharmacy',
            label: 'Pharmacy',
            children: [
              {
                key: 'admin-pharmacy-dashboard',
                label: 'Dashboard',
                path: '/pharmacy',
              },
              {
                key: 'admin-pharmacy-medicines',
                label: 'Medicines',
                path: '/pharmacy/medicines',
              },
              {
                key: 'admin-pharmacy-inventory',
                label: 'Inventory',
                path: '/pharmacy/inventory',
              },
              {
                key: 'admin-pharmacy-suppliers',
                label: 'Suppliers',
                path: '/pharmacy/suppliers',
              },
              {
                key: 'admin-pharmacy-orders',
                label: 'Purchase Orders',
                path: '/pharmacy/purchase-orders',
              },
            ],
          },
          {
            key: 'admin-laboratory',
            label: 'Laboratory',
            path: '/laboratory/dashboard',
          },
          {
            key: 'admin-prescriptions',
            label: 'Prescriptions',
            path: '/admin/prescriptions',
          },
          {
            key: 'admin-lab-orders',
            label: 'Lab Orders',
            path: '/admin/lab-orders',
          },
          {
            key: 'admin-schedule-appointment',
            label: 'Schedule Appointment',
            path: '/appointments/new',
          },
          {
            key: 'admin-roles',
            label: 'Roles & Permissions',
            path: '/admin/roles',
          },
        ],
      });

      // Basic patient management for new orgs - Third priority
      items.push({
        key: 'patients',
        icon: <UserOutlined />,
        label: 'Patients',
        path: '/patients',
      });

      return items;
    }

    // For established organizations or non-admin users, show full menu
    // Patient Management
    if (hasPermission(role, Permission.VIEW_PATIENT)) {
      items.push({
        key: 'patients',
        icon: <UserOutlined />,
        label: 'Patients',
        path: '/patients',
      });
    }

    // Appointments
    if (hasPermission(role, Permission.VIEW_APPOINTMENT)) {
      const appointmentChildren = [];
      
      if (hasPermission(role, Permission.CREATE_APPOINTMENT)) {
        appointmentChildren.push({
          key: 'book-appointment',
          label: 'Book Appointment',
          path: '/appointments/new',
        });
      }
      
      appointmentChildren.push({
        key: 'appointments-list',
        label: 'View Appointments',
        path: '/appointments',
      });

      if (isAdmin) {
        appointmentChildren.push({
          key: 'all-appointments',
          label: 'All Appointments',
          path: '/admin/appointments',
        });
      }

      items.push({
        key: 'appointments',
        icon: <CalendarOutlined />,
        label: 'Appointments',
        children: appointmentChildren,
      });
    }

    // Medical Records
    if (hasPermission(role, Permission.VIEW_MEDICAL_RECORD)) {
      items.push({
        key: 'medical-records',
        icon: <FileTextOutlined />,
        label: 'Medical Records',
        path: '/records',
      });
    }

    // Queue & Visit Operations
    {
      const queueChildren = [] as any[];
      if (isAdmin || isSuperAdmin || isReceptionist) {
        queueChildren.push({ key: 'queue-reception', label: 'Reception Queue', path: '/queue/reception' });
      }
      if (isAdmin || isSuperAdmin || isNurse) {
        queueChildren.push({ key: 'queue-triage', label: 'Triage Station', path: '/queue/triage' });
      }
      if (isDoctor) {
        queueChildren.push({ key: 'queue-doctor', label: 'Doctor Console', path: '/queue/doctor' });
      }
      if (queueChildren.length > 0) {
        items.push({ key: 'queue', icon: <AlertOutlined />, label: 'Queue', children: queueChildren });
      }
    }

    // Laboratory
    if (hasPermission(role, Permission.VIEW_MEDICAL_RECORD) || isLabTech) {
      const labChildren = [];
      
      if (isDoctor) {
        labChildren.push(
          {
            key: 'lab-order',
            label: 'Order Lab Tests',
            path: '/laboratory/order',
          },
          {
            key: 'lab-results',
            label: 'View Results',
            path: '/laboratory/results',
          }
        );
      }
      
      if (isLabTech || isAdmin) {
        labChildren.push(
          {
            key: 'lab-dashboard',
            label: 'Lab Dashboard',
            path: '/laboratory/dashboard',
          },
          {
            key: 'lab-sample-collection',
            label: 'Sample Collection',
            path: '/laboratory/sample-collection',
          },
          {
            key: 'lab-results-entry',
            label: 'Results Entry',
            path: '/laboratory/results-entry',
          }
        );
      }

      if (isAdmin) {
        labChildren.push({
          key: 'lab-test-catalog',
          label: 'Test Catalog',
          path: '/laboratory/tests',
        });
      }

      if (labChildren.length > 0) {
        items.push({
          key: 'laboratory',
          icon: <ExperimentOutlined />,
          label: 'Laboratory',
          children: labChildren,
        });
      }
    }

    // Pharmacy
    if (hasPermission(role, Permission.VIEW_INVENTORY) || isPharmacist) {
      const pharmacyChildren = [];
      
      if (isPharmacist || isAdmin) {
        pharmacyChildren.push(
          {
            key: 'pharmacy-dashboard',
            label: 'Pharmacy Dashboard',
            path: '/pharmacy',
          },
          {
            key: 'pharmacy-medicines',
            label: 'Medicines',
            path: '/pharmacy/medicines',
          },
          {
            key: 'pharmacy-inventory',
            label: 'Inventory',
            path: '/pharmacy/inventory',
          }
        );
      }

      if (hasPermission(role, Permission.MANAGE_INVENTORY)) {
        pharmacyChildren.push(
          {
            key: 'pharmacy-suppliers',
            label: 'Suppliers',
            path: '/pharmacy/suppliers',
          },
          {
            key: 'pharmacy-orders',
            label: 'Purchase Orders',
            path: '/pharmacy/purchase-orders',
          }
        );
      }

      if (pharmacyChildren.length > 0) {
        items.push({
          key: 'pharmacy',
          icon: <MedicineBoxOutlined />,
          label: 'Pharmacy',
          children: pharmacyChildren,
        });
      }
    }

    // Inpatient Management
    if (isAdmin || isDoctor || isNurse) {
      const inpatientChildren = [];
      
      if (isAdmin || isNurse || isDoctor) {
        inpatientChildren.push(
          {
            key: 'inpatient-wards',
            label: 'Ward Overview',
            path: '/inpatient/wards',
          },
          {
            key: 'inpatient-beds',
            label: 'Bed Management',
            path: '/inpatient/beds',
          }
        );
      }
      
      if (isDoctor || isNurse) {
        inpatientChildren.push(
          {
            key: 'inpatient-admissions',
            label: 'Patient Admissions',
            path: '/inpatient/admissions/new',
          },
          {
            key: 'inpatient-rounds',
            label: 'Doctor Rounds',
            path: '/inpatient/rounds',
          }
        );
      }
      
      if (isNurse) {
        inpatientChildren.push({
          key: 'inpatient-nursing',
          label: 'Nursing Care',
          path: '/inpatient/nursing',
        });
      }
      
      if (isAdmin) {
        inpatientChildren.push(
          {
            key: 'inpatient-ward-management',
            label: 'Ward Management',
            path: '/admin/inpatient/wards',
          },
          {
            key: 'inpatient-room-management',
            label: 'Room Management',
            path: '/admin/inpatient/rooms',
          }
        );
      }

      if (inpatientChildren.length > 0) {
        items.push({
          key: 'inpatient-management',
          icon: <HomeOutlined />,
          label: 'Inpatient Management',
          children: inpatientChildren,
        });
      }
    }

    // Telemedicine
    if (isDoctor || isAdmin || isNurse) {
      items.push({
        key: 'telemedicine',
        icon: <VideoCameraOutlined />,
        label: 'Telemedicine',
        path: '/telemedicine',
      });
    }

    // Billing & Finance
    if (hasPermission(role, Permission.VIEW_BILL) || isAccountant || isAdmin) {
      const billingChildren = [];
      
      billingChildren.push({
        key: 'billing-management',
        label: 'Billing Management',
        path: '/billing/management',
      });
      
      if (isAdmin || isAccountant) {
        billingChildren.push(
          {
            key: 'revenue-analytics',
            label: 'Revenue Analytics',
            path: '/billing/analytics',
          },
          {
            key: 'payment-processing',
            label: 'Payment Processing',
            path: '/billing/payments',
          }
        );
      }

      items.push({
        key: 'billing',
        icon: <DollarOutlined />,
        label: 'Billing & Finance',
        children: billingChildren,
      });
    }

    // Reports & Analytics
    if (hasPermission(role, Permission.VIEW_REPORTS)) {
      items.push({
        key: 'reports',
        icon: <BarChartOutlined />,
        label: 'Reports & Analytics',
        path: '/reports',
      });
    }

    // Admin Section
    if (isAdmin) {
      const adminChildren: any[] = [
        {
          key: 'schedule-session',
          label: 'Schedule Session',
          path: '/admin/schedule-session',
        },
        {
          key: 'ot-management',
          label: 'OT Management',
          path: '/admin/ot',
        },
        {
          key: 'ambulance-advanced',
          label: 'Ambulance Management',
          path: '/admin/ambulance-advanced',
        },
        {
          key: 'manual-dispatch',
          label: 'Manual Dispatch',
          path: '/admin/manual-dispatch',
        },
        {
          key: 'manage-users',
          label: 'Manage Users',
          path: '/admin/users',
        },
      ];

      // Only users with MANAGE_ROLES permission can see Roles & Permissions
      if (hasPermission(role, Permission.MANAGE_ROLES) || isSuperAdmin) {
        adminChildren.push({
          key: 'roles-permissions',
          label: 'Roles & Permissions',
          path: '/admin/roles',
        });
      }

      adminChildren.push(
        {
          key: 'staff-management',
          label: 'Staff Management',
          path: '/admin/staff',
        },
        {
          key: 'manage-doctors',
          label: 'Manage Doctors',
          path: '/admin/doctors',
        },
        {
          key: 'manage-departments',
          label: 'Departments',
          path: '/admin/departments',
        },
        {
          key: 'manage-services',
          label: 'Services',
          path: '/admin/services',
        },
        {
          key: 'pharmacy-admin-section',
          label: 'Pharmacy',
          children: [
            {
              key: 'pharmacy-dashboard-admin',
              label: 'Dashboard',
              path: '/pharmacy',
            },
            {
              key: 'pharmacy-medicines-admin',
              label: 'Medicines',
              path: '/pharmacy/medicines',
            },
            {
              key: 'pharmacy-inventory-admin',
              label: 'Inventory',
              path: '/pharmacy/inventory',
            },
            {
              key: 'pharmacy-suppliers-admin',
              label: 'Suppliers',
              path: '/pharmacy/suppliers',
            },
            {
              key: 'pharmacy-orders-admin',
              label: 'Purchase Orders',
              path: '/pharmacy/purchase-orders',
            },
          ],
        },
        {
          key: 'laboratory-management',
          label: 'Laboratory',
          path: '/laboratory/dashboard',
        },
        {
          key: 'prescriptions-admin',
          label: 'Prescriptions',
          path: '/admin/prescriptions',
        },
        {
          key: 'lab-orders-admin',
          label: 'Lab Orders',
          path: '/admin/lab-orders',
        },
        {
          key: 'schedule-appointment-admin',
          label: 'Schedule Appointment',
          path: '/appointments/new',
        },
        {
          key: 'emergency-requests',
          label: 'Emergency Requests',
          path: '/admin/emergency-requests',
        },
        {
          key: 'callback-requests',
          label: 'Callback Requests',
          path: '/admin/callback-requests',
        }
      );

      items.push({
        key: 'administration',
        icon: <TeamOutlined />,
        label: 'Administration',
        children: adminChildren,
      });
    }

    // Communication
    items.push({
      key: 'communication',
      icon: <MessageOutlined />,
      label: 'Communication',
      children: [
        { key: 'messages', label: 'Messages', path: '/communication/messages' },
        { key: 'reminders', label: 'Reminders', path: '/communication/reminders' },
        { key: 'appointment-reminders', label: 'Appointment Reminders', path: '/communication/appointment-reminders' },
        { key: 'health-articles', label: 'Health Articles', path: '/communication/health-articles' },
        { key: 'feedback', label: 'Feedback', path: '/communication/feedback' },
      ],
    });

    // Super Admin - SaaS Management
    if (isSuperAdmin) {
      const saasChildren = [
        {
          key: 'organizations',
          label: 'Organizations',
          path: '/saas/organizations',
        },
        {
          key: 'subscriptions',
          label: 'Subscriptions',
          path: '/saas/subscriptions',
        },
        {
          key: 'system-health',
          label: 'System Health',
          path: '/saas/system-health',
        },
        {
          key: 'global-analytics',
          label: 'Global Analytics',
          path: '/saas/analytics',
        },
        {
          key: 'api-management',
          label: 'API Management',
          path: '/saas/api',
        },
      ];

      items.push({
        key: 'saas-management',
        icon: <CrownOutlined />,
        label: 'SaaS Management',
        children: saasChildren,
      });
    }

    // Patient Portal
    if (isPatient) {
      items.push({
        key: 'portal',
        icon: <HeartOutlined />,
        label: 'My Portal',
        path: '/portal',
      });
    }

    // Settings - Everyone gets this
    items.push({
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      path: '/settings',
    });

    return items;
  };

  const menuItems = getMenuItems();

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: <Link to="/profile">Profile</Link> },
      { key: 'organization', icon: <BankOutlined />, label: <Link to="/organization">Organization</Link> },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
    ]
  };

  // Determine active key from current pathname
  const getActiveKey = () => {
    const p = location.pathname;
    if (p === '/' || p === '') return 'dashboard';
    if (p.startsWith('/patients')) return 'patients';
    if (p.startsWith('/appointments/new')) return 'book-appointment';
    if (p.startsWith('/appointments')) return 'appointments-list';
    if (p.startsWith('/admin/appointments')) return 'all-appointments';
    if (p.startsWith('/queue')) {
      if (p.includes('/reception')) return 'queue-reception';
      if (p.includes('/triage')) return 'queue-triage';
      if (p.includes('/doctor')) return 'queue-doctor';
      return 'queue';
    }
    if (p.startsWith('/records')) return 'medical-records';
    if (p.startsWith('/laboratory')) {
      if (p.includes('/order')) return 'lab-order';
      if (p.includes('/results')) return 'lab-results';
      if (p.includes('/dashboard')) return 'lab-dashboard';
      if (p.includes('/sample-collection')) return 'lab-sample-collection';
      if (p.includes('/results-entry')) return 'lab-results-entry';
      if (p.includes('/tests')) return 'lab-test-catalog';
      return 'laboratory';
    }
    if (p.startsWith('/pharmacy')) {
      if (p.includes('/medicines')) return 'pharmacy-medicines';
      if (p.includes('/inventory')) return 'pharmacy-inventory';
      if (p.includes('/suppliers')) return 'pharmacy-suppliers';
      if (p.includes('/purchase-orders')) return 'pharmacy-orders';
      return 'pharmacy-dashboard';
    }
    if (p.startsWith('/inpatient')) {
      if (p.includes('/wards')) return 'inpatient-wards';
      if (p.includes('/beds')) return 'inpatient-beds';
      if (p.includes('/admissions')) return 'inpatient-admissions';
      if (p.includes('/rounds')) return 'inpatient-rounds';
      if (p.includes('/nursing')) return 'inpatient-nursing';
      return 'inpatient-management';
    }
    if (p.startsWith('/admin/inpatient')) {
      if (p.includes('/wards')) return 'inpatient-ward-management';
      if (p.includes('/rooms')) return 'inpatient-room-management';
      return 'inpatient-management';
    }
    if (p.startsWith('/telemedicine')) return 'telemedicine';
    if (p.startsWith('/billing')) {
      if (p.includes('/management')) return 'billing-management';
      if (p.includes('/analytics')) return 'revenue-analytics';
      if (p.includes('/payments')) return 'payment-processing';
      return 'billing';
    }
    if (p.startsWith('/reports')) return 'reports';
    if (p.startsWith('/admin')) {
      if (p.includes('/schedule-session')) return 'schedule-session';
      if (p.includes('/users')) return 'manage-users';
      if (p.includes('/roles-permissions')) return 'roles-permissions';
      if (p.includes('/staff')) return 'staff-management';
      if (p.includes('/doctors')) return 'manage-doctors';
      if (p.includes('/departments')) return 'manage-departments';
      if (p.includes('/services')) return 'manage-services';
      if (p.includes('/prescriptions')) return 'admin-prescriptions';
      if (p.includes('/lab-orders')) return 'admin-lab-orders';
      if (p.includes('/emergency-requests')) return 'emergency-requests';
      if (p.includes('/callback-requests')) return 'callback-requests';
      return 'administration';
    }
    if (p.startsWith('/saas')) {
      if (p.includes('/organizations')) return 'organizations';
      if (p.includes('/subscriptions')) return 'subscriptions';
      if (p.includes('/system-health')) return 'system-health';
      if (p.includes('/analytics')) return 'global-analytics';
      if (p.includes('/api')) return 'api-management';
      return 'saas-management';
    }
    if (p.startsWith('/portal')) return 'portal';
    if (p.startsWith('/settings')) return 'settings';
    return undefined;
  };

  const activeKey = getActiveKey();

  return (
    <StyledLayout className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={280}
        theme="light"
        breakpoint="lg"
        collapsedWidth={60}
        onBreakpoint={(broken) => { if (broken) setCollapsed(true); }}
      >
        <style>{`
          .ant-menu-light .ant-menu-item-selected {
            background-color: rgba(233, 30, 99, 0.1) !important;
            color: #e91e63 !important;
            border-right: 3px solid #e91e63 !important;
          }
          .ant-menu-light .ant-menu-item:hover {
            color: #e91e63 !important;
            background-color: rgba(233, 30, 99, 0.05) !important;
          }
          .ant-menu-light .ant-menu-submenu-title:hover {
            color: #e91e63 !important;
          }
          .ant-menu-light .ant-menu-item-selected .ant-menu-item-icon,
          .ant-menu-light .ant-menu-item-selected a { 
            color: #e91e63 !important; 
          }
        `}</style>
        
        <Logo>
          {!collapsed ? (
            <Title
              level={4}
              style={{ margin: 0, color: '#e91e63', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {displayOrgName}
            </Title>
          ) : (
            <Title level={4} style={{ margin: 0, color: '#e91e63' }}>{displayOrgName.substring(0, 2).toUpperCase()}</Title>
          )}
        </Logo>

        {!collapsed && (
          <OrganizationInfo>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong style={{ color: '#e91e63', display: 'inline-block', maxWidth: (isSuperAdmin || isAdmin) ? 180 : 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayOrgName}</Text>
              {(isSuperAdmin || isAdmin) && (
                <Badge 
                  count={displayPlan} 
                  style={{ backgroundColor: '#e91e63', fontSize: '10px' }}
                />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
              <span>{displayUsers}/{displayMaxUsers} users</span>
              <span style={{ color: '#e91e63', fontWeight: 500 }}>
                {role === 'super_admin' ? 'PLATFORM' : role.toUpperCase()}
              </span>
            </div>
          </OrganizationInfo>
        )}

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={activeKey ? [activeKey] : []}
          onClick={(info) => {
            // Find item in menuItems or in children (including nested children)
            let targetItem: any = menuItems.find(mi => mi.key === info.key);
            if (!targetItem) {
              // Check in children
              for (const item of menuItems) {
                if ((item as any).children) {
                  targetItem = (item as any).children.find((child: any) => child.key === info.key);
                  if (targetItem) break;
                  // Check in nested children
                  for (const child of (item as any).children) {
                    if ((child as any).children) {
                      targetItem = (child as any).children.find((grandchild: any) => grandchild.key === info.key);
                      if (targetItem) break;
                    }
                  }
                  if (targetItem) break;
                }
              }
            }
            if (targetItem && targetItem.path) navigate(targetItem.path);
          }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <span title={item.label}>{item.label}</span>,
            children: (item as any).children?.map((child: any) => ({
              key: child.key,
              label: <span title={child.label}>{child.label}</span>,
              children: (child as any).children?.map((grandchild: any) => ({
                key: grandchild.key,
                label: <span title={grandchild.label}>{grandchild.label}</span>,
              })),
            })),
          }))}
        />
      </Sider>
      
      <Layout>
        <StyledHeader>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <NotificationBell />
            <Button 
              type="text" 
              icon={<SettingOutlined />} 
              onClick={() => navigate('/settings')}
            />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={(user as any)?.profileImage} icon={<UserOutlined />} />
                <span>{user?.firstName} {user?.lastName}</span>
              </Space>
            </Dropdown>
          </div>
        </StyledHeader>
        
        <div style={{ padding: '0 24px' }}>
          <Breadcrumb
            items={(() => {
              const p = location.pathname;
              if (p === '/' || p === '') return [{ title: 'Dashboard' }];
              if (p.startsWith('/admin/')) return [{ title: 'Administration' }, { title: 'Management' }];
              if (p.startsWith('/saas/')) return [{ title: 'SaaS Management' }, { title: 'Platform' }];
              if (p.startsWith('/patients')) return [{ title: 'Patients' }];
              if (p.startsWith('/appointments')) return [{ title: 'Appointments' }];
              if (p.startsWith('/laboratory')) return [{ title: 'Laboratory' }];
              if (p.startsWith('/pharmacy')) return [{ title: 'Pharmacy' }];
              if (p.startsWith('/billing')) return [{ title: 'Billing & Finance' }];
              if (p.startsWith('/reports')) return [{ title: 'Reports & Analytics' }];
              if (p.startsWith('/portal')) return [{ title: 'Patient Portal' }];
              if (p.startsWith('/settings')) return [{ title: 'Settings' }];
              return [];
            })()}
          />
        </div>
        
        <StyledContent>
          {children || <Outlet />}
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default SaaSLayout;
