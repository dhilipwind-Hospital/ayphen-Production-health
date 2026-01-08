# Menu System - Quick Reference Guide

## File Locations

| File | Purpose |
|------|---------|
| `/frontend/src/config/menuConfig.ts` | Menu configuration & utility functions |
| `/frontend/src/components/Layout.tsx` | Sidebar component using menu config |
| `/frontend/src/contexts/AuthContext.tsx` | User authentication context |

## Supported Roles

- `admin` - Hospital administrator
- `super_admin` - Super administrator
- `doctor` - Medical doctor
- `nurse` - Nurse staff
- `patient` - Patient user
- `receptionist` - Receptionist staff
- `pharmacist` - Pharmacy staff
- `lab_technician` - Lab technician
- `lab_supervisor` - Lab supervisor
- `accountant` - Accounting staff

## Quick Tasks

### Add a New Menu Item

```typescript
// In /frontend/src/config/menuConfig.ts, add to menuConfig array:

{
  key: 'unique-key',
  icon: <YourIcon />,
  label: 'Display Name',
  path: '/your-path',
  roles: ['admin', 'doctor'],  // Who can see it
  description: 'What it does'
}
```

### Add Sub-menu Items

```typescript
{
  key: 'parent',
  icon: <ParentIcon />,
  label: 'Parent Menu',
  roles: ['admin'],
  children: [
    {
      key: 'child1',
      label: 'Child Item 1',
      path: '/parent/child1',
      roles: ['admin']
    },
    {
      key: 'child2',
      label: 'Child Item 2',
      path: '/parent/child2',
      roles: ['admin', 'doctor']
    }
  ]
}
```

### Hide Menu Item from Role

Remove the role from the `roles` array:

```typescript
// Before
roles: ['admin', 'doctor', 'patient']

// After (hide from doctor)
roles: ['admin', 'patient']
```

### Change Menu Item Label or Icon

```typescript
{
  key: 'appointments',
  icon: <NewIcon />,        // Change icon
  label: 'My New Label',     // Change label
  path: '/appointments',
  roles: ['patient', 'doctor']
}
```

### Check Menu Access in Code

```typescript
import { hasMenuAccess, getMenuItemsForRole } from '../config/menuConfig';

// Check if user can access specific menu
if (hasMenuAccess('doctor', 'appointments')) {
  // Show feature
}

// Get all accessible menu items
const items = getMenuItemsForRole('doctor');
```

## Current Menu Structure

### Admin/Super Admin
```
├── Dashboard
├── All Appointments
├── Appointment Management
├── Callback Requests
├── Departments
├── Emergency Requests
├── Inpatient Management
│   ├── Wards
│   ├── Rooms
│   └── Beds
├── Manage Doctors
├── Manage Services
├── Reports
├── Laboratory
│   ├── Lab Dashboard
│   ├── Sample Collection
│   ├── Results Entry
│   └── Test Catalog
└── Settings
```

### Doctor
```
├── Dashboard
├── Appointments
├── My Availability
├── Laboratory
│   ├── Order Lab Tests
│   └── View Lab Results
├── Medical Records
├── Patients
├── Pharmacy
└── Settings
```

### Patient
```
├── My Portal (Dashboard)
├── Appointments
├── Book Appointment
├── Emergency Appointment
├── Laboratory
│   └── My Lab Results
└── Settings
```

### Nurse
```
├── Dashboard
├── Appointments
├── Emergency Appointment
├── Laboratory
│   ├── Sample Collection
│   └── Results Entry
├── Medical Records
├── Patients
├── Pharmacy
├── Triage Station
├── Queue Management
└── Settings
```

### Receptionist
```
├── Dashboard
├── Appointments
├── Emergency Appointment
├── Medical Records
├── Patients
├── Pharmacy
├── Patient Portal
├── Queue Management
└── Settings
```

### Pharmacist
```
├── Pharmacy
└── Settings
```

### Lab Technician/Supervisor
```
├── Dashboard (Lab Dashboard)
├── Laboratory
│   ├── Sample Collection
│   └── Results Entry
└── Settings
```

### Accountant
```
├── Billing
└── Settings
```

## Utility Functions

### `getMenuItemsForRole(role, organizationId?)`
Get menu items visible to a specific role.

```typescript
const items = getMenuItemsForRole('doctor');
```

### `hasMenuAccess(role, menuKey)`
Check if role can access a menu item.

```typescript
if (hasMenuAccess('patient', 'appointments')) {
  // Patient has access
}
```

### `getMenuItemByKey(key)`
Get a specific menu item configuration.

```typescript
const item = getMenuItemByKey('appointments');
console.log(item.label); // 'Appointments'
```

### `getAccessibleMenuKeys(role)`
Get all menu keys a role can access.

```typescript
const keys = getAccessibleMenuKeys('doctor');
// ['dashboard', 'appointments', 'availability-setup', ...]
```

### `getDashboardPathForRole(role)`
Get dashboard path for a role.

```typescript
const path = getDashboardPathForRole('doctor');
// '/queue/doctor'
```

## Menu Item Properties

```typescript
interface MenuItem {
  key: string;              // Unique ID (required)
  label: string;            // Display label (required)
  roles: UserRole[];        // Accessible roles (required)
  icon?: React.ReactNode;   // Ant Design icon (optional)
  path?: string;            // Route path (optional)
  children?: MenuItem[];    // Sub-items (optional)
  description?: string;     // Help text (optional)
}
```

## Menu Item Key Naming Convention

- Use lowercase
- Use hyphens for word separation
- Be descriptive
- Examples: `all-appointments`, `emergency-appointment`, `availability-setup`

## Testing Menu Changes

1. **Add menu item** → Check visibility for each role
2. **Change roles** → Login as different roles, verify access
3. **Hide menu item** → Ensure hidden role can't see it
4. **Reorder items** → Verify order in sidebar
5. **Modify label** → Check breadcrumb updates

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Menu item not showing | Check role is in roles array |
| Wrong item highlighted | Add path to getActiveKeyFromPath() mapping |
| Parent visible, children hidden | Check children roles array |
| Menu updates after reload | Verify AuthContext provides updated role |

## Menu Item Checklist

When adding a new menu item, verify:

- [ ] Unique `key` value
- [ ] Proper `icon` (if visible item)
- [ ] Clear `label`
- [ ] Correct `path` (if clickable)
- [ ] Appropriate `roles` array
- [ ] Helpful `description`
- [ ] Parent menu accessible if nested
- [ ] Path mapping in Layout.tsx (if needed)

## Layout Component

The Layout component automatically:
- Filters menu by user role
- Handles menu navigation
- Manages active state
- Generates breadcrumbs
- No additional setup needed

## API Endpoints Used

- `/auth/me` - Get current user (role, organization_id)
- `/api/users` - User information

## Icons Available

All Ant Design icons:
```typescript
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
```

## Organization-Specific Menus (Future)

The system is ready for organization-specific menu customization:

```typescript
// Currently supports
getMenuItemsForRole('doctor', organizationId);

// Future implementation can apply org-specific rules
```

## Maintenance

### Weekly
- Check new menu requests
- Review menu structure alignment

### Monthly
- Audit menu item accessibility
- Update deprecated items
- Performance review

### As Needed
- Add new features to menu
- Update role access
- Reorganize menu structure

