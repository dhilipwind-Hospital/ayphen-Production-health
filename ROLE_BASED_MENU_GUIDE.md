# Role-Based Menu System Documentation

## Overview

This document describes the role-based menu system that ensures the sidebar menu is displayed based on user roles in the organization. The system uses a centralized configuration file that defines which menu items are visible to each user role.

## Architecture

### Components

1. **Menu Configuration File** (`/frontend/src/config/menuConfig.ts`)
   - Centralized configuration of all menu items
   - Defines which roles can access each menu item
   - Provides utility functions for role-based menu filtering

2. **Layout Component** (`/frontend/src/components/Layout.tsx`)
   - Renders the sidebar menu using the menu configuration
   - Filters menu items based on current user's role
   - Handles menu navigation and active state management

3. **Authentication Context** (`/frontend/src/contexts/AuthContext.tsx`)
   - Provides user information including role and organization_id
   - Available to all components via useAuth hook

## Menu Configuration Structure

### MenuConfig File

**File:** `/frontend/src/config/menuConfig.ts`

```typescript
export interface MenuItem {
  key: string;              // Unique identifier
  icon?: React.ReactNode;   // Ant Design icon
  label: string;            // Display label
  path?: string;            // Route path
  children?: MenuItem[];    // Sub-menu items
  roles: UserRole[];        // Roles that can see this item
  description?: string;     // Optional description
}

export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'doctor'
  | 'nurse'
  | 'patient'
  | 'receptionist'
  | 'pharmacist'
  | 'lab_technician'
  | 'lab_supervisor'
  | 'accountant';
```

### Example Menu Item

```typescript
{
  key: 'appointments',
  icon: <CalendarOutlined />,
  label: 'Appointments',
  path: '/appointments',
  roles: ['patient', 'doctor', 'nurse', 'receptionist'],
  description: 'View personal appointments'
}
```

### Menu Item with Sub-items

```typescript
{
  key: 'laboratory',
  icon: <ExperimentOutlined />,
  label: 'Laboratory',
  roles: ['doctor', 'patient', 'lab_technician', 'lab_supervisor', 'admin', 'super_admin', 'nurse'],
  children: [
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
    // More sub-items...
  ]
}
```

## Menu Items by Role

### Admin / Super Admin
- Dashboard
- All Appointments
- Appointment Management
- Callback Requests
- Departments
- Emergency Requests
- Inpatient Management (Wards, Rooms, Beds)
- Manage Doctors
- Manage Services
- Reports
- Laboratory (Lab Dashboard, Sample Collection, Results Entry, Test Catalog)
- Settings

### Doctor
- Dashboard
- Appointments
- My Availability
- Laboratory (Order Lab Tests, View Lab Results)
- Medical Records
- Patients
- Pharmacy
- Settings

### Patient
- Dashboard (labeled as "My Portal")
- Appointments
- Book Appointment
- Emergency Appointment
- Laboratory (My Lab Results)
- Settings

### Nurse
- Dashboard
- Appointments
- Emergency Appointment
- Laboratory (Sample Collection, Results Entry)
- Medical Records
- Patients
- Pharmacy
- Triage Station
- Queue Management
- Settings

### Receptionist
- Dashboard
- Appointments
- Emergency Appointment
- Medical Records
- Patients
- Pharmacy
- Patient Portal
- Queue Management
- Settings

### Pharmacist
- Pharmacy (main dashboard)
- Settings

### Lab Technician / Lab Supervisor
- Dashboard (goes to Laboratory Dashboard)
- Laboratory (Sample Collection, Results Entry)
- Settings

### Accountant
- Billing
- Settings

## Using the Menu Configuration

### In Components

#### Get Menu Items for Current User

```typescript
import { getMenuItemsForRole } from '../config/menuConfig';
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  const menuItems = getMenuItemsForRole(user?.role, user?.organization_id);

  // menuItems now contains only items visible to this role
}
```

#### Check Menu Access

```typescript
import { hasMenuAccess } from '../config/menuConfig';

// Check if current role can access a specific menu
if (hasMenuAccess(userRole, 'appointments')) {
  // Show appointments feature
}
```

#### Get Accessible Menu Keys

```typescript
import { getAccessibleMenuKeys } from '../config/menuConfig';

const accessibleKeys = getAccessibleMenuKeys('doctor');
// Returns: ['dashboard', 'appointments', 'availability-setup', ...]
```

#### Get Dashboard Path for Role

```typescript
import { getDashboardPathForRole } from '../config/menuConfig';

const dashboardPath = getDashboardPathForRole('doctor');
// Returns: '/queue/doctor'
```

### Layout Component Usage

The Layout component automatically:
1. Gets the current user's role from AuthContext
2. Filters menu items using `getMenuItemsForRole()`
3. Renders only accessible menu items
4. Manages active menu state based on current route
5. Handles menu navigation

**No additional code needed** - the Layout component handles everything automatically.

## Adding New Menu Items

### Step 1: Add to Menu Configuration

Edit `/frontend/src/config/menuConfig.ts`:

```typescript
const menuConfig: MenuItem[] = [
  // ... existing items ...

  // New menu item
  {
    key: 'my-new-feature',
    icon: <MyNewIcon />,
    label: 'My New Feature',
    path: '/my-new-feature',
    roles: ['admin', 'doctor'],  // Only admin and doctor can see
    description: 'Description of the feature'
  },
];
```

### Step 2: Update Layout Path Mapping (Optional)

If the route path doesn't match expected patterns, add to `getActiveKeyFromPath()` in Layout.tsx:

```typescript
const pathMap: Record<string, string> = {
  '/my-new-feature': 'my-new-feature',
  // ... other paths ...
};
```

### Step 3: Create the Route

In your router configuration:

```typescript
{
  path: '/my-new-feature',
  element: <MyNewFeaturePage />,
  requiredRoles: ['admin', 'doctor']
}
```

## Modifying Existing Menu Items

### Change Accessible Roles

Edit the `roles` array in the menu item:

```typescript
{
  key: 'appointments',
  // ... other properties ...
  roles: ['patient', 'doctor', 'nurse', 'receptionist', 'admin', 'super_admin']  // Added admin and super_admin
}
```

### Change Menu Label or Icon

```typescript
{
  key: 'appointments',
  icon: <NewIcon />,  // Changed icon
  label: 'My Appointments',  // Changed label
  // ... other properties ...
}
```

### Change Menu Path

```typescript
{
  key: 'appointments',
  path: '/my-appointments/list',  // Changed path
  // ... other properties ...
}
```

## Hiding Menu Items for Specific Roles

Option 1: Remove role from the `roles` array

```typescript
{
  key: 'pharmacy',
  // ... properties ...
  roles: ['doctor', 'patient', 'pharmacist', 'admin', 'super_admin']  // Removed nurse
}
```

Option 2: Create separate menu items for different roles

```typescript
{
  key: 'pharmacy-doctor',
  label: 'Pharmacy',
  path: '/pharmacy/doctor',
  roles: ['doctor']
},
{
  key: 'pharmacy-patient',
  label: 'Pharmacy',
  path: '/pharmacy/patient',
  roles: ['patient']
}
```

## Organizing Menu Items

### Group by Category

Use sub-menu items (children) to organize related items:

```typescript
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
      roles: ['admin', 'super_admin']
    },
    {
      key: 'inpatient-rooms',
      label: 'Rooms',
      path: '/admin/inpatient/rooms',
      roles: ['admin', 'super_admin']
    }
  ]
}
```

### Sort Menu Items

The menu configuration is defined in a logical order. To reorder:
1. Edit the `menuConfig` array in menuConfig.ts
2. Move menu items up or down as needed
3. The order in the array determines display order

## Utility Functions

### getMenuItemsForRole(role, organizationId?)

Filters all menu items based on user role.

**Parameters:**
- `role`: User role string
- `organizationId`: Optional organization ID for future organizational filtering

**Returns:** Array of MenuItem objects accessible to the role

**Example:**
```typescript
const items = getMenuItemsForRole('doctor');
// Returns menu items with 'doctor' in their roles array
```

### getMenuItemByKey(key)

Gets a specific menu item configuration by key.

**Parameters:**
- `key`: Menu item key

**Returns:** MenuItem object or undefined

**Example:**
```typescript
const appointmentMenu = getMenuItemByKey('appointments');
```

### hasMenuAccess(role, menuKey)

Checks if a role has access to a specific menu item.

**Parameters:**
- `role`: User role string
- `menuKey`: Menu item key

**Returns:** Boolean

**Example:**
```typescript
if (hasMenuAccess('patient', 'appointments')) {
  // Patient can access appointments
}
```

### getAccessibleMenuKeys(role)

Gets all menu keys accessible to a role.

**Parameters:**
- `role`: User role string

**Returns:** Array of menu keys

**Example:**
```typescript
const keys = getAccessibleMenuKeys('doctor');
// Returns: ['dashboard', 'appointments', 'availability-setup', ...]
```

### getDashboardPathForRole(role)

Gets the appropriate dashboard path for a role.

**Parameters:**
- `role`: User role string

**Returns:** Dashboard path string

**Example:**
```typescript
const path = getDashboardPathForRole('doctor');
// Returns: '/queue/doctor'
```

## Organization-Specific Menu (Future Enhancement)

The menu configuration supports organization-specific menu customization through the `organizationId` parameter:

```typescript
const menuItems = getMenuItemsForRole(userRole, user?.organization_id);
```

This allows for:
- Different menu items per organization
- Organizational policies on feature access
- White-label menu customization

Implementation example in menuConfig.ts:

```typescript
export function getMenuItemsForRole(
  role: UserRole | string,
  organizationId?: string
): MenuItem[] {
  const normalizedRole = String(role).toLowerCase() as UserRole;

  // Get base menu items
  let items = menuConfig.filter(item => item.roles.includes(normalizedRole));

  // Future: Apply organization-specific overrides
  if (organizationId) {
    // items = applyOrganizationCustomization(items, organizationId);
  }

  return items;
}
```

## Best Practices

### 1. Keep Roles Array Accurate

```typescript
// ✅ Good: Only roles that should see this item
roles: ['doctor', 'admin'],

// ❌ Bad: Adding all roles just to be safe
roles: ['admin', 'super_admin', 'doctor', 'nurse', 'patient', 'receptionist', 'pharmacist', 'lab_technician', 'lab_supervisor', 'accountant']
```

### 2. Use Consistent Menu Keys

```typescript
// ✅ Good: Consistent naming convention
key: 'inpatient-management'
key: 'emergency-appointment'

// ❌ Bad: Inconsistent naming
key: 'inpatient_management'
key: 'emergencyAppointment'
```

### 3. Include Descriptions

```typescript
// ✅ Good: Helpful description
{
  key: 'availability-setup',
  label: 'My Availability',
  description: 'Set your working hours and availability',
  roles: ['doctor']
}

// ❌ Bad: No description
{
  key: 'availability-setup',
  label: 'My Availability',
  roles: ['doctor']
}
```

### 4. Match Path to Key

```typescript
// ✅ Good: Consistent path and key
key: 'doctor-profile',
path: '/doctor/:id',

// ❌ Bad: Mismatched path and key
key: 'doctor-profile',
path: '/users/doctor/profile/:id'
```

### 5. Organize Hierarchically

```typescript
// ✅ Good: Related items grouped
{
  key: 'inpatient',
  children: [
    { key: 'wards', ... },
    { key: 'rooms', ... },
    { key: 'beds', ... }
  ]
}

// ❌ Bad: Scattered related items
{ key: 'wards', ... }
{ key: 'rooms', ... }
{ key: 'beds', ... }
```

## Troubleshooting

### Menu Item Not Appearing

**Problem:** A menu item is not showing up in the sidebar.

**Solutions:**
1. Check if the user's role is in the `roles` array
2. Verify the role is spelled correctly (lowercase)
3. Check that the parent menu (if nested) is accessible to the role
4. Use browser DevTools to verify user.role value

### Wrong Menu Item Highlighted

**Problem:** The wrong menu item is highlighted as active.

**Solutions:**
1. Check `getActiveKeyFromPath()` function has mapping for current path
2. Verify menu item key matches the path mapping
3. Check path prefix patterns are correct
4. Use browser DevTools to verify `location.pathname`

### Menu Not Updating After Role Change

**Problem:** Menu doesn't update when user role changes.

**Solutions:**
1. Ensure useAuth hook returns new user object
2. Check that Layout component is using user?.role in dependency array
3. Verify localStorage isn't caching stale data
4. Clear browser cache and reload

### Sub-menu Items Not Showing

**Problem:** Parent menu appears but children don't.

**Solutions:**
1. Verify parent menu item has `children` array
2. Check child items have roles array including user's role
3. Parent and children must both have user's role
4. Verify children have `path` property

## Migration from Old System

If migrating from the old inline menu system:

1. **Map Old Items to New Config**
   - Identify all menu items from old Layout.tsx
   - Create corresponding entries in menuConfig.ts
   - Set appropriate roles arrays

2. **Update Component**
   - Replace inline menu generation with getMenuItemsForRole()
   - Remove old role-based filtering logic
   - Use new Layout.tsx structure

3. **Test All Roles**
   - Login as each role
   - Verify correct menu items appear
   - Check active menu highlighting
   - Test menu navigation

4. **Update Documentation**
   - Update menu documentation
   - Train team on new system
   - Document role-specific features

## Summary

The role-based menu system provides:
- ✅ Centralized menu configuration
- ✅ Easy role-based filtering
- ✅ Automatic menu organization
- ✅ Flexible and maintainable structure
- ✅ Support for hierarchical menus
- ✅ Organization-specific customization ready

All menu logic is now in one place, making it easy to:
- Add new menu items
- Modify role permissions
- Reorder menu items
- Organize menu structure
- Scale to more complex requirements

