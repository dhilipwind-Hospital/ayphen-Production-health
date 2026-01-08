import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import { Card, Table, Button, Space, Tag, Row, Col, Typography, Input, Select, Modal, Form, message, Tabs, Checkbox, Divider, Alert, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  SecurityScanOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Role and Permission definitions (matching backend)
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

interface RoleData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isSystemRole: boolean;
  color: string;
  isSaaSOnly?: boolean;
}

interface UserRoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  assignedDate: string;
  assignedBy: string;
  status: 'Active' | 'Inactive';
}

const RolesPermissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAssignRoleModalVisible, setIsAssignRoleModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [form] = Form.useForm();
  const [assignRoleForm] = Form.useForm();
  
  // Get current user role from AuthContext
  const { user } = useAuth();
  const currentUserRole = ((user?.role || 'admin').toLowerCase()) as UserRole;
  const isSaaSAdmin = currentUserRole === UserRole.SUPER_ADMIN;

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/roles?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched roles data:', data); // Debug log
        if (data.success && Array.isArray(data.data)) {
          // Apply role filtering based on user type
          const filteredRoles = isSaaSAdmin 
            ? data.data 
            : data.data.filter((role: RoleData) => role.name !== UserRole.SUPER_ADMIN);
          console.log('Setting filtered roles:', filteredRoles); // Debug log
          setRoles(filteredRoles);
        }
      } else {
        console.error('Failed to fetch roles:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Fetch user role assignments from API
  const fetchUserRoleAssignments = async () => {
    try {
      const response = await fetch('/api/roles/assignments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setUserRoleAssignments(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user role assignments:', error);
    }
  };
  
  // Get organization data to determine if this is a new organization
  const { stats: orgStats } = useOrganizationData();

  // Fetch data on component mount
  useEffect(() => {
    fetchRoles();
    fetchUserRoleAssignments();
  }, []);

  // Sample data - replace with API calls
  const allRoles: RoleData[] = [
    {
      id: '1',
      name: UserRole.SUPER_ADMIN,
      displayName: 'Super Administrator',
      description: 'Full system access with SaaS management capabilities',
      permissions: Object.values(Permission),
      userCount: 2,
      isSystemRole: true,
      color: '#722ed1',
      isSaaSOnly: true
    },
    {
      id: '2',
      name: UserRole.ADMIN,
      displayName: 'Hospital Administrator',
      description: 'Full hospital management access',
      permissions: [
        Permission.VIEW_USER, Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
        Permission.MANAGE_SETTINGS, Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT,
        Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
        Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL, Permission.CREATE_BILL,
        Permission.VIEW_INVENTORY, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS
      ],
      userCount: 5,
      isSystemRole: true,
      color: '#e91e63'
    },
    {
      id: '3',
      name: UserRole.DOCTOR,
      displayName: 'Doctor',
      description: 'Medical staff with patient care access',
      permissions: [
        Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
        Permission.VIEW_MEDICAL_RECORD, Permission.CREATE_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD
      ],
      userCount: 15,
      isSystemRole: true,
      color: '#52c41a'
    },
    {
      id: '4',
      name: UserRole.NURSE,
      displayName: 'Nurse',
      description: 'Nursing staff with patient care support',
      permissions: [
        Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD
      ],
      userCount: 25,
      isSystemRole: true,
      color: '#1890ff'
    },
    {
      id: '5',
      name: UserRole.PHARMACIST,
      displayName: 'Pharmacist',
      description: 'Pharmacy management and inventory control',
      permissions: [
        Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_INVENTORY, Permission.MANAGE_INVENTORY
      ],
      userCount: 3,
      isSystemRole: true,
      color: '#fa8c16'
    }
  ];
  
  // Filter roles based on user type
  const [roles, setRoles] = useState<RoleData[]>(
    isSaaSAdmin ? allRoles : allRoles.filter(r => !r.isSaaSOnly)
  );

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'Dr. John Smith',
      userEmail: 'john.smith@hospital.com',
      role: UserRole.DOCTOR,
      assignedDate: '2024-01-15',
      assignedBy: 'Admin User',
      status: 'Active'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah Johnson',
      userEmail: 'sarah.johnson@hospital.com',
      role: UserRole.NURSE,
      assignedDate: '2024-01-20',
      assignedBy: 'Admin User',
      status: 'Active'
    }
  ]);

  const permissionCategories = {
    'User Management': [Permission.VIEW_USER, Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER],
    'Patient Management': [Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT, Permission.DELETE_PATIENT],
    'Appointments': [Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT, Permission.DELETE_APPOINTMENT],
    'Medical Records': [Permission.VIEW_MEDICAL_RECORD, Permission.CREATE_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD],
    'Billing': [Permission.VIEW_BILL, Permission.CREATE_BILL, Permission.UPDATE_BILL],
    'Inventory': [Permission.VIEW_INVENTORY, Permission.MANAGE_INVENTORY],
    'System Administration': [Permission.MANAGE_SETTINGS, Permission.MANAGE_ROLES, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS]
  };

  const roleColumns = [
    {
      title: 'Role',
      key: 'role',
      render: (record: RoleData) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color={record.color}>{record.displayName}</Tag>
            {record.isSystemRole && (
              <Tooltip title="System Role - Cannot be deleted">
                <LockOutlined style={{ color: '#faad14' }} />
              </Tooltip>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: Permission[]) => {
        const permissionArray = Array.isArray(permissions) ? permissions : [];
        return (
          <div>
            <Text strong>{permissionArray.length}</Text>
            <Text type="secondary"> permissions</Text>
            <div style={{ marginTop: 4 }}>
              {permissionArray.slice(0, 3).map(permission => (
                <Tag key={permission} style={{ fontSize: '10px' }}>
                  {permission.replace(/_/g, ' ').toLowerCase()}
                </Tag>
              ))}
              {permissionArray.length > 3 && (
                <Tag style={{ fontSize: '10px' }}>
                  +{permissionArray.length - 3} more
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e91e63' }}>{count}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>users</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: RoleData) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewRole(record)}
            title="View role details"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditRole(record)}
            title={record.isSystemRole ? "Edit system role permissions" : "Edit custom role"}
          />
          {!record.isSystemRole && (
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDeleteRole(record)}
              title="Delete custom role"
            />
          )}
        </Space>
      ),
    },
  ];

  const userRoleColumns = [
    {
      title: 'User',
      key: 'user',
      render: (record: UserRoleAssignment) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.userName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        const roleData = roles.find(r => r.name === role);
        return (
          <Tag color={roleData?.color || '#default'}>
            {roleData?.displayName || role}
          </Tag>
        );
      },
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
    },
    {
      title: 'Assigned By',
      dataIndex: 'assignedBy',
      key: 'assignedBy',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: UserRoleAssignment) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditUserRole(record)}
          />
          <Button 
            type="text" 
            danger 
            onClick={() => handleRevokeRole(record)}
          >
            Revoke
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUserRole(record)}
          />
        </Space>
      ),
    },
  ];

  const handleViewRole = (role: RoleData) => {
    Modal.info({
      title: `Role Details: ${role.displayName}`,
      width: 800,
      content: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Description: </Text>
            <Text>{role.description}</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Type: </Text>
            <Tag color={role.isSystemRole ? 'orange' : 'green'}>
              {role.isSystemRole ? 'System Role' : 'Custom Role'}
            </Tag>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>User Count: </Text>
            <Text>{role.userCount} users assigned</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Permissions ({role.permissions.length}): </Text>
          </div>
          {Object.entries(permissionCategories).map(([category, permissions]) => {
            const categoryPermissions = permissions.filter(p => role.permissions.includes(p));
            if (categoryPermissions.length === 0) return null;
            
            return (
              <div key={category} style={{ marginBottom: 12 }}>
                <Title level={5} style={{ marginBottom: 8, color: '#1890ff' }}>
                  {category}
                </Title>
                <div>
                  {categoryPermissions.map(permission => (
                    <Tag key={permission} color="blue" style={{ marginBottom: 4 }}>
                      {permission.replace(/_/g, ' ').toLowerCase()}
                    </Tag>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ),
    });
  };


  const handleEditRole = (role: RoleData) => {
    console.log('Editing role:', role);
    console.log('Role permissions:', role.permissions);
    console.log('Permissions array length:', role.permissions?.length);
    
    setEditingRole(role);
    
    const formValues = {
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions || [],
      color: role.color
    };
    
    console.log('Setting form values:', formValues);
    
    // Reset form first to clear any previous state
    form.resetFields();
    
    // Set the form values
    form.setFieldsValue(formValues);
    setIsModalVisible(true);
    
    // Debug: Check form values after setting
    setTimeout(() => {
      const currentValues = form.getFieldsValue();
      console.log('Form values after setting:', currentValues);
      console.log('Form permissions after setting:', currentValues.permissions);
    }, 100);
  };

  const handleDeleteRole = async (role: RoleData) => {
    if (role.isSystemRole) {
      message.warning('System roles cannot be deleted');
      return;
    }

    Modal.confirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete the role "${role.displayName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/roles/${role.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            message.success(`Role "${role.displayName}" deleted successfully`);
            fetchRoles(); // Refresh the roles list
          } else {
            const errorData = await response.json();
            message.error(`Failed to delete role: ${errorData.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error deleting role:', error);
          message.error('Failed to delete role');
        }
      },
    });
  };

  const handleEditUserRole = (record: UserRoleAssignment) => {
    // Pre-fill the form with existing user data
    assignRoleForm.setFieldsValue({
      userName: record.userName,
      userEmail: record.userEmail,
      userPhone: '0000000000', // Default since we don't store phone in assignments
      role: record.role
    });
    setIsAssignRoleModalVisible(true);
  };

  const handleRevokeRole = (record: UserRoleAssignment) => {
    Modal.confirm({
      title: 'Revoke Role',
      content: `Are you sure you want to revoke the role "${record.role}" from ${record.userName}?`,
      okText: 'Revoke',
      okType: 'danger',
      onOk: () => {
        setUserRoleAssignments(userRoleAssignments.filter(assignment => assignment.id !== record.id));
        message.success(`Role revoked from ${record.userName}`);
      },
    });
  };

  const handleDeleteUserRole = (record: UserRoleAssignment) => {
    Modal.confirm({
      title: 'Delete User Assignment',
      content: (
        <div>
          <p>Are you sure you want to <strong>permanently delete</strong> the user assignment for:</p>
          <div style={{ margin: '16px 0', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <div><strong>User:</strong> {record.userName}</div>
            <div><strong>Email:</strong> {record.userEmail}</div>
            <div><strong>Role:</strong> {record.role}</div>
          </div>
          <p style={{ color: '#ff4d4f', fontWeight: 500 }}>⚠️ This action cannot be undone!</p>
        </div>
      ),
      okText: 'Delete Permanently',
      okType: 'danger',
      cancelText: 'Cancel',
      width: 500,
      onOk: async () => {
        try {
          const response = await fetch(`/api/roles/assignments/${record.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            message.success(`User assignment for ${record.userName} deleted permanently`);
            fetchUserRoleAssignments(); // Refresh the list
            fetchRoles(); // Update role counts
          } else {
            const errorData = await response.json();
            message.error(`Failed to delete user assignment: ${errorData.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error deleting user assignment:', error);
          message.error('Failed to delete user assignment');
        }
      },
    });
  };

  const handleBulkDelete = () => {
    const selectedAssignments = userRoleAssignments.filter(assignment => 
      selectedRowKeys.includes(assignment.id)
    );

    Modal.confirm({
      title: 'Bulk Delete User Assignments',
      content: (
        <div>
          <p>Are you sure you want to <strong>permanently delete</strong> the following {selectedAssignments.length} user assignments?</p>
          <div style={{ margin: '16px 0', maxHeight: '200px', overflowY: 'auto' }}>
            {selectedAssignments.map(assignment => (
              <div key={assignment.id} style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '8px' }}>
                <div><strong>{assignment.userName}</strong> ({assignment.userEmail})</div>
                <div>Role: <span style={{ color: '#e91e63' }}>{assignment.role}</span></div>
              </div>
            ))}
          </div>
          <p style={{ color: '#ff4d4f', fontWeight: 500 }}>⚠️ This action cannot be undone!</p>
        </div>
      ),
      okText: `Delete ${selectedAssignments.length} Assignments`,
      okType: 'danger',
      cancelText: 'Cancel',
      width: 600,
      onOk: async () => {
        try {
          const response = await fetch('/api/roles/assignments/bulk', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
              userIds: selectedRowKeys
            })
          });

          if (response.ok) {
            setSelectedRowKeys([]);
            message.success(`${selectedAssignments.length} user assignments deleted permanently`);
            fetchUserRoleAssignments(); // Refresh the list
            fetchRoles(); // Update role counts
          } else {
            const errorData = await response.json();
            message.error(`Failed to delete user assignments: ${errorData.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error bulk deleting user assignments:', error);
          message.error('Failed to delete user assignments');
        }
      },
    });
  };


  const handleAddRole = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleAssignRole = () => {
    assignRoleForm.resetFields();
    setIsAssignRoleModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate required fields
      if (!values.displayName || !values.description) {
        message.error('Please fill in all required fields');
        return;
      }

      // Ensure permissions is always an array
      const permissions = Array.isArray(values.permissions) ? values.permissions : [];

      if (editingRole) {
        // Update existing role via API
        console.log('Updating role with data:', {
          displayName: values.displayName,
          description: values.description,
          permissions: permissions,
          color: values.color,
          permissionCount: permissions.length
        });

        const response = await fetch(`/api/roles/${editingRole.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            displayName: values.displayName,
            description: values.description,
            permissions: permissions,
            color: values.color
          })
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('Update response:', responseData);
          
          message.success('Role updated successfully');
          setIsModalVisible(false);
          setEditingRole(null);
          form.resetFields();
          await fetchRoles(); // Refresh roles list
          
          // Debug: Check if the role was updated in the roles array
          setTimeout(() => {
            const updatedRole = roles.find(r => r.id === editingRole.id);
            console.log('Updated role in state:', updatedRole);
            console.log('Updated role permissions:', updatedRole?.permissions);
          }, 500);
        } else {
          const errorData = await response.json();
          message.error(`Failed to update role: ${errorData.message || 'Unknown error'}`);
        }
      } else {
        // Create new role via API
        const response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            displayName: values.displayName,
            description: values.description,
            permissions: permissions,
            color: values.color
          })
        });

        if (response.ok) {
          message.success('Role created successfully');
          setIsModalVisible(false);
          setEditingRole(null);
          form.resetFields();
          await fetchRoles(); // Refresh roles list
        } else {
          const errorData = await response.json();
          message.error(`Failed to create role: ${errorData.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving role:', error);
      message.error('Failed to save role. Please check all fields and try again.');
    }
  };

  const handleAssignRoleOk = async () => {
    try {
      const values = await assignRoleForm.validateFields();
      
      // Validate required fields
      if (!values.userName || !values.userEmail || !values.role) {
        message.error('Please fill in all required fields');
        return;
      }

      // Create user with role assignment via API
      const response = await fetch('/api/roles/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userName: values.userName,
          userEmail: values.userEmail,
          role: values.role,
          userPhone: values.userPhone || '0000000000'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success(`✅ User created successfully! Welcome email sent to ${values.userEmail}`);
          setIsAssignRoleModalVisible(false);
          assignRoleForm.resetFields();
          fetchUserRoleAssignments(); // Refresh the assignments list
          fetchRoles(); // Refresh roles to update user counts
        } else {
          message.error(`Failed to create user: ${result.message || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json();
        message.error(`Failed to create user: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      message.error('Failed to create user. Please check all fields and try again.');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          <SecurityScanOutlined /> Roles & Permissions Management
        </Title>
        <Text type="secondary">
          Manage user roles and permissions for your hospital system
        </Text>
      </div>

      {/* Info Banner for Hospital Admins - Only show for established organizations */}
      {!isSaaSAdmin && !orgStats.isNewOrganization && (
        <Alert
          message="Hospital Organization View"
          description="You are viewing roles available for your hospital organization. Super Administrator role is reserved for SaaS platform management."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}
      
      {/* Clean info for new organizations */}
      {!isSaaSAdmin && orgStats.isNewOrganization && (
        <Alert
          message="Roles & Permissions Management"
          description="Configure user roles and permissions for your hospital staff. Set up appropriate access levels for doctors, nurses, receptionists, and other team members."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#e91e63' }}>
                {roles.length}
              </div>
              <div style={{ color: '#666' }}>Total Roles</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </div>
              <div style={{ color: '#666' }}>Total Users</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>
                {Object.values(Permission).length}
              </div>
              <div style={{ color: '#666' }}>Available Permissions</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#faad14' }}>
                {userRoleAssignments.filter(u => u.status === 'Active').length}
              </div>
              <div style={{ color: '#666' }}>Active Assignments</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><TeamOutlined />Roles</span>} key="roles">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Search
                placeholder="Search roles..."
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddRole}
                style={{ background: '#e91e63', borderColor: '#e91e63' }}
              >
                Add Role
              </Button>
            </div>
            
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} roles`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><UserOutlined />User Assignments</span>} key="assignments">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Search
                  placeholder="Search user assignments..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                {selectedRowKeys.length > 0 && (
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBulkDelete}
                  >
                    Delete Selected ({selectedRowKeys.length})
                  </Button>
                )}
              </div>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAssignRole}
                style={{ background: '#e91e63', borderColor: '#e91e63' }}
              >
                Assign Role
              </Button>
            </div>
            
            <Table
              columns={userRoleColumns}
              dataSource={userRoleAssignments}
              rowKey="id"
              rowSelection={{
                selectedRowKeys,
                onChange: (selectedRowKeys) => {
                  setSelectedRowKeys(selectedRowKeys);
                },
                getCheckboxProps: (record) => ({
                  name: record.userName,
                }),
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} assignments`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><LockOutlined />Permissions</span>} key="permissions">
          <Card title="System Permissions">
            {Object.entries(permissionCategories).map(([category, permissions]) => (
              <div key={category} style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: '#e91e63' }}>{category}</Title>
                <Row gutter={[16, 16]}>
                  {permissions.map(permission => (
                    <Col span={8} key={permission}>
                      <Card size="small" style={{ textAlign: 'center' }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20, marginBottom: 8 }} />
                        <div style={{ fontWeight: 500 }}>
                          {permission.replace(/_/g, ' ').toLowerCase()}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Role Modal */}
      <Modal
        key={editingRole?.id || 'new'}
        title={editingRole ? 'Edit Role' : 'Add New Role'}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRole(null);
          form.resetFields();
        }}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="displayName"
                label="Role Name"
                rules={[{ required: true, message: 'Please enter role name' }]}
              >
                <Input placeholder="Enter role name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="color"
                label="Role Color"
                initialValue="#1890ff"
              >
                <Input type="color" style={{ width: '100%', height: '32px' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter role description" />
          </Form.Item>
          
          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[{ required: false }]}
          >
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '6px', padding: '12px' }}>
              <Checkbox.Group style={{ width: '100%' }}>
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <Title level={5} style={{ marginBottom: 8, color: '#1890ff' }}>
                      {category}
                    </Title>
                    <Row>
                      {permissions.map(permission => (
                        <Col span={12} key={permission} style={{ marginBottom: 8 }}>
                          <Checkbox value={permission}>
                            <span style={{ textTransform: 'capitalize' }}>
                              {permission.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </Checkbox.Group>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Role Modal */}
      <Modal
        title="Assign Role to User"
        visible={isAssignRoleModalVisible}
        onOk={handleAssignRoleOk}
        onCancel={() => setIsAssignRoleModalVisible(false)}
        width={600}
      >
        <Form form={assignRoleForm} layout="vertical">
          <Form.Item
            name="userName"
            label="User Name"
            rules={[{ required: true, message: 'Please enter user name' }]}
          >
            <Input placeholder="Enter user name" />
          </Form.Item>
          
          <Form.Item
            name="userEmail"
            label="User Email"
            rules={[
              { required: true, message: 'Please enter user email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter user email" />
          </Form.Item>

          <Form.Item
            name="userPhone"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select a role">
              {roles.filter(role => isSaaSAdmin || role.name !== UserRole.SUPER_ADMIN).map(role => (
                <Option key={role.name} value={role.name}>
                  <Tag color={role.color} style={{ marginRight: 8 }}>
                    {role.displayName}
                  </Tag>
                  {role.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="userId" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesPermissions;
