import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Typography,
  Select,
  Drawer,
  Form,
  Switch,
  App,
  Modal,
  Row,
  Col,
  Avatar,
  Tooltip,
  Popconfirm,
  Badge,
  Divider,
  DatePicker,
  TimePicker,
  InputNumber,
  Checkbox
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  FilterOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  departmentName?: string;
  role?: string;
  qualification?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  avatar?: string;
  experience?: number;
  consultationFee?: number;
  availableFrom?: string;
  availableTo?: string;
  workingDays?: string[];
  licenseNumber?: string;
  joinDate?: string;
  address?: string;
  emergencyContact?: string;
  patientsCount?: number;
  rating?: number;
};

// Styled Components
const StyledCard = styled(Card)`
  .ant-card-head {
    background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
    color: white;
    
    .ant-card-head-title {
      color: white;
    }
  }
`;

const DoctorAvatar = styled(Avatar)`
  border: 2px solid #e91e63;
`;

const StatusBadge = styled(Badge)<{ $status: string }>`
  .ant-badge-status-dot {
    ${props => props.$status === 'active' 
      ? 'background-color: #52c41a;' 
      : 'background-color: #ff4d4f;'
    }
  }
`;

const DoctorsAdminEnhanced: React.FC = () => {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<string | undefined>();
  const [specialization, setSpecialization] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        // Fetch doctors from the API using configured api instance (filters by authenticated user's organization)
        const response = await api.get('/users?role=doctor');
        const result = response.data;
        const doctors = (result.data || result || []).map((doc: any) => ({
            id: doc.id,
            firstName: doc.firstName || '',
            lastName: doc.lastName || '',
            specialization: doc.specialization || doc.department?.name || '',
            departmentName: doc.department?.name || doc.departmentName || '',
            role: doc.role || '',
            qualification: doc.qualification || '',
            phone: doc.phone || '',
            email: doc.email || '',
            isActive: doc.isActive !== false,
            avatar: doc.avatar || doc.profileImage || '',
            experience: doc.experience || 0,
            consultationFee: doc.consultationFee || 0,
            availableFrom: doc.availableFrom || '',
            availableTo: doc.availableTo || '',
            workingDays: doc.workingDays || [],
            licenseNumber: doc.licenseNumber || '',
            joinDate: doc.joinDate || doc.createdAt || '',
            address: doc.address || '',
            emergencyContact: doc.emergencyContact || '',
            patientsCount: doc.patientsCount || 0,
            rating: doc.rating || 0
          }));
        setData(doctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        const result = response.data;
        const depts = (result.data || result || []).map((dept: any) => ({
          id: dept.id,
          name: dept.name || ''
        }));
        setDepartments(depts);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };

    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        const result = response.data;
        const srvcs = (result.data || result || []).map((service: any) => ({
          id: service.id,
          name: service.name || service.serviceName || ''
        }));
        setServices(srvcs);
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      }
    };

    fetchDoctors();
    fetchDepartments();
    fetchServices();
  }, []);

  const filteredData = data.filter(doctor => {
    const matchesQuery = query ? 
      `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      (doctor.specialization || '').toLowerCase().includes(query.toLowerCase()) ||
      (doctor.qualification || '').toLowerCase().includes(query.toLowerCase()) ||
      (doctor.email || '').toLowerCase().includes(query.toLowerCase())
      : true;
    
    const matchesDepartment = department ? doctor.departmentName === department : true;
    const matchesSpecialization = specialization ? doctor.specialization === specialization : true;
    
    return matchesQuery && matchesDepartment && matchesSpecialization;
  });

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const doctorPayload = {
        firstName: values.firstName,
        lastName: values.lastName,
        departmentId: values.departmentName, // departmentName is actually department ID from dropdown
        role: 'doctor', // Always set role as doctor
        specialization: values.specialization,
        qualification: values.qualification,
        phone: values.phone,
        email: values.email,
        isActive: values.isActive ?? true,
        experience: values.experience,
        consultationFee: values.consultationFee,
        availableFrom: values.availableFrom?.format('HH:mm'),
        availableTo: values.availableTo?.format('HH:mm'),
        workingDays: values.workingDays || [],
        licenseNumber: values.licenseNumber,
        joinDate: values.joinDate?.format('YYYY-MM-DD'),
        address: values.address,
        emergencyContact: values.emergencyContact,
        password: values.password || 'Doctor@123' // Default password if not provided
      };

      if (editing) {
        // UPDATE: Call backend API to update doctor
        await api.put(`/users/${editing.id}`, doctorPayload);
        message.success('Doctor updated successfully!');
      } else {
        // CREATE: Call backend API to create doctor
        await api.post('/users', doctorPayload);
        message.success('Doctor added successfully!');
      }

      // Reload the data from server to reflect changes
      const response = await api.get('/users?role=doctor');
      const result = response.data;
      const doctors = (result.data || result || []).map((doc: any) => ({
        id: doc.id,
        firstName: doc.firstName || '',
        lastName: doc.lastName || '',
        specialization: doc.specialization || doc.department?.name || '',
        departmentName: doc.department?.name || doc.departmentName || '',
        role: doc.role || '',
        qualification: doc.qualification || '',
        phone: doc.phone || '',
        email: doc.email || '',
        isActive: doc.isActive !== false,
        avatar: doc.avatar || doc.profileImage || '',
        experience: doc.experience || 0,
        consultationFee: doc.consultationFee || 0,
        availableFrom: doc.availableFrom || '',
        availableTo: doc.availableTo || '',
        workingDays: doc.workingDays || [],
        licenseNumber: doc.licenseNumber || '',
        joinDate: doc.joinDate || doc.createdAt || '',
        address: doc.address || '',
        emergencyContact: doc.emergencyContact || '',
        patientsCount: doc.patientsCount || 0,
        rating: doc.rating || 0
      }));
      setData(doctors);

      setOpen(false);
      setEditing(null);
      form.resetFields();
    } catch (error: any) {
      console.error('Failed to save doctor:', error);
      message.error(error?.response?.data?.message || 'Failed to save doctor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditing(doctor);
    setViewMode(false);
    form.setFieldsValue({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      departmentName: doctor.departmentName,
      role: doctor.role,
      qualification: doctor.qualification,
      phone: doctor.phone,
      email: doctor.email,
      isActive: doctor.isActive,
      experience: doctor.experience,
      consultationFee: doctor.consultationFee,
      availableFrom: doctor.availableFrom ? dayjs(doctor.availableFrom, 'HH:mm') : null,
      availableTo: doctor.availableTo ? dayjs(doctor.availableTo, 'HH:mm') : null,
      workingDays: doctor.workingDays,
      licenseNumber: doctor.licenseNumber,
      joinDate: doctor.joinDate ? dayjs(doctor.joinDate) : null,
      address: doctor.address,
      emergencyContact: doctor.emergencyContact
    });
    setOpen(true);
  };

  const handleView = (doctor: Doctor) => {
    setEditing(doctor);
    setViewMode(true);
    setOpen(true);
  };

  const handleDelete = async (doctorId: string) => {
    try {
      // DELETE: Call backend API to delete doctor
      await api.delete(`/users/${doctorId}`);
      message.success('Doctor deleted successfully!');

      // Reload the data from server
      const response = await api.get('/users?role=doctor');
      const result = response.data;
      const doctors = (result.data || result || []).map((doc: any) => ({
        id: doc.id,
        firstName: doc.firstName || '',
        lastName: doc.lastName || '',
        specialization: doc.specialization || doc.department?.name || '',
        departmentName: doc.department?.name || doc.departmentName || '',
        role: doc.role || '',
        qualification: doc.qualification || '',
        phone: doc.phone || '',
        email: doc.email || '',
        isActive: doc.isActive !== false,
        avatar: doc.avatar || doc.profileImage || '',
        experience: doc.experience || 0,
        consultationFee: doc.consultationFee || 0,
        availableFrom: doc.availableFrom || '',
        availableTo: doc.availableTo || '',
        workingDays: doc.workingDays || [],
        licenseNumber: doc.licenseNumber || '',
        joinDate: doc.joinDate || doc.createdAt || '',
        address: doc.address || '',
        emergencyContact: doc.emergencyContact || '',
        patientsCount: doc.patientsCount || 0,
        rating: doc.rating || 0
      }));
      setData(doctors);
    } catch (error: any) {
      console.error('Failed to delete doctor:', error);
      message.error(error?.response?.data?.message || 'Failed to delete doctor.');
    }
  };

  const handleStatusToggle = async (doctorId: string, newStatus: boolean) => {
    try {
      // UPDATE: Call backend API to update doctor status
      await api.put(`/users/${doctorId}`, { isActive: newStatus });
      message.success(`Doctor ${newStatus ? 'activated' : 'deactivated'} successfully!`);

      // Reload the data from server
      const response = await api.get('/users?role=doctor');
      const result = response.data;
      const doctors = (result.data || result || []).map((doc: any) => ({
        id: doc.id,
        firstName: doc.firstName || '',
        lastName: doc.lastName || '',
        specialization: doc.specialization || doc.department?.name || '',
        departmentName: doc.department?.name || doc.departmentName || '',
        role: doc.role || '',
        qualification: doc.qualification || '',
        phone: doc.phone || '',
        email: doc.email || '',
        isActive: doc.isActive !== false,
        avatar: doc.avatar || doc.profileImage || '',
        experience: doc.experience || 0,
        consultationFee: doc.consultationFee || 0,
        availableFrom: doc.availableFrom || '',
        availableTo: doc.availableTo || '',
        workingDays: doc.workingDays || [],
        licenseNumber: doc.licenseNumber || '',
        joinDate: doc.joinDate || doc.createdAt || '',
        address: doc.address || '',
        emergencyContact: doc.emergencyContact || '',
        patientsCount: doc.patientsCount || 0,
        rating: doc.rating || 0
      }));
      setData(doctors);
    } catch (error: any) {
      console.error('Failed to update doctor status:', error);
      message.error(error?.response?.data?.message || 'Failed to update doctor status.');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Specialization', 'Department', 'Phone', 'Email', 'Status', 'Experience', 'Fee'].join(','),
      ...filteredData.map(d => [
        `${d.firstName} ${d.lastName}`,
        d.specialization || '',
        d.departmentName || '',
        d.phone || '',
        d.email || '',
        d.isActive ? 'Active' : 'Inactive',
        d.experience || '',
        d.consultationFee || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Data exported successfully!');
  };

  // Use services as specializations, fallback to existing doctors' specializations if services empty
  const specializations = services.length > 0
    ? services.map(s => s.name)
    : [...new Set(data.map(d => d.specialization).filter(Boolean))];

  const columns: ColumnsType<Doctor> = [
    {
      title: 'Doctor',
      key: 'doctor',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record) => (
        <Tooltip title={`Dr. ${record.firstName} ${record.lastName} - ${record.qualification || 'N/A'}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DoctorAvatar
              src={record.avatar}
              icon={<UserOutlined />}
              size={40}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Dr. {record.firstName} {record.lastName}
              </div>
              <Text type="secondary" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {record.qualification || 'N/A'}
              </Text>
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Specialization',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 180,
      ellipsis: {
        showTitle: false,
      },
      render: (specialization) => (
        <Tooltip title={specialization || 'Not specified'}>
          <Tag color="blue" icon={<MedicineBoxOutlined />} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {specialization || 'Not specified'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (departmentName) => (
        <Tooltip title={departmentName || 'Not assigned'}>
          <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {departmentName || 'Not assigned'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <PhoneOutlined style={{ color: '#e91e63' }} />
            <Text style={{ fontSize: '12px' }}>{record.phone}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MailOutlined style={{ color: '#e91e63' }} />
            <Text style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Experience',
      key: 'experience',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: '#e91e63' }}>
            {record.experience} years
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.patientsCount} patients
          </Text>
        </div>
      ),
    },
    {
      title: 'Fee',
      dataIndex: 'consultationFee',
      key: 'consultationFee',
      render: (fee) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${fee}
        </Text>
      ),
    },
    {
      title: 'Availability',
      key: 'availability',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> {record.availableFrom} - {record.availableTo}
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.workingDays?.length} days/week
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <StatusBadge 
          $status={record.isActive ? 'active' : 'inactive'}
          status={record.isActive ? 'success' : 'error'}
          text={record.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Doctor">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Switch
              size="small"
              checked={record.isActive}
              onChange={(checked) => handleStatusToggle(record.id, checked)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this doctor?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Doctor">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <StyledCard
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined />
            Doctors Management
          </div>
        }
        extra={
          <Space>
            <Button
              type="default"
              icon={<ExportOutlined />}
              onClick={exportData}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setViewMode(false);
                form.resetFields();
                setOpen(true);
              }}
            >
              Add Doctor
            </Button>
          </Space>
        }
      >
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#e91e63', margin: 0 }}>
                  {data.filter(d => d.isActive).length}
                </Title>
                <Text type="secondary">Active Doctors</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#fa8c16', margin: 0 }}>
                  {specializations.length}
                </Title>
                <Text type="secondary">Specializations</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
                  {data.reduce((sum, d) => sum + (d.patientsCount || 0), 0)}
                </Title>
                <Text type="secondary">Total Patients</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                  {data.length}
                </Title>
                <Text type="secondary">Total Doctors</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="Search doctors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Department"
              value={department}
              onChange={setDepartment}
              allowClear
              style={{ width: '100%' }}
            >
              {departments.map(dept => (
                <Option key={dept.id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Specialization"
              value={specialization}
              onChange={setSpecialization}
              allowClear
              style={{ width: '100%' }}
            >
              {specializations.map(spec => (
                <Option key={spec} value={spec}>
                  {spec}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} doctors`,
          }}
          scroll={{ x: 1200 }}
        />
      </StyledCard>

      {/* Add/Edit Doctor Drawer */}
      <Drawer
        title={viewMode ? 'Doctor Details' : (editing ? 'Edit Doctor' : 'Add New Doctor')}
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          setViewMode(false);
          form.resetFields();
        }}
        width={600}
        footer={
          !viewMode && (
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="primary" onClick={() => form.submit()} loading={loading}>
                  {editing ? 'Update' : 'Add'} Doctor
                </Button>
              </Space>
            </div>
          )
        }
      >
        {viewMode && editing ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <DoctorAvatar size={80} src={editing.avatar} icon={<UserOutlined />} />
              <Title level={4} style={{ marginTop: 16 }}>
                Dr. {editing.firstName} {editing.lastName}
              </Title>
              <Text type="secondary">{editing.specialization}</Text>
            </div>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Department:</Text>
                <div>{editing.departmentName}</div>
              </Col>
              <Col span={12}>
                <Text strong>Role:</Text>
                <div>{editing.role}</div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Experience:</Text>
                <div>{editing.experience} years</div>
              </Col>
              <Col span={12}>
                <Text strong>Consultation Fee:</Text>
                <div>${editing.consultationFee}</div>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Phone:</Text>
                <div>{editing.phone}</div>
              </Col>
              <Col span={12}>
                <Text strong>Email:</Text>
                <div>{editing.email}</div>
              </Col>
            </Row>
            
            <Divider />
            
            <Text strong>Working Hours:</Text>
            <div>{editing.availableFrom} - {editing.availableTo}</div>
            
            <Text strong style={{ marginTop: 16, display: 'block' }}>Working Days:</Text>
            <div>
              {editing.workingDays?.map(day => (
                <Tag key={day} color="blue">{day}</Tag>
              ))}
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="firstName"
                  label="First Name"
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lastName"
                  label="Last Name"
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input placeholder="Enter last name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="specialization"
                  label="Specialization"
                  rules={[{ required: true, message: 'Please enter specialization' }]}
                >
                  <Select placeholder="Select specialization">
                    {specializations.map(spec => (
                      <Option key={spec} value={spec}>{spec}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="departmentName"
                  label="Department"
                  rules={[{ required: true, message: 'Please select department' }]}
                >
                  <Select placeholder="Select department">
                    {departments.map(dept => (
                      <Option key={dept.id} value={dept.id}>
                        {dept.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone" label="Phone">
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label="Email">
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="experience" label="Experience (Years)">
                  <InputNumber min={0} max={50} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="consultationFee" label="Consultation Fee ($)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="availableFrom" label="Available From">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="availableTo" label="Available To">
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="workingDays" label="Working Days">
              <Checkbox.Group>
                <Row>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <Col span={8} key={day}>
                      <Checkbox value={day}>{day}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item name="qualification" label="Qualification">
              <Input placeholder="Enter qualification" />
            </Form.Item>

            <Form.Item name="licenseNumber" label="License Number">
              <Input placeholder="Enter license number" />
            </Form.Item>

            <Form.Item name="joinDate" label="Join Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} placeholder="Enter address" />
            </Form.Item>

            <Form.Item name="emergencyContact" label="Emergency Contact">
              <Input placeholder="Enter emergency contact" />
            </Form.Item>

            <Form.Item name="isActive" valuePropName="checked" label="Active Status">
              <Switch />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default DoctorsAdminEnhanced;
