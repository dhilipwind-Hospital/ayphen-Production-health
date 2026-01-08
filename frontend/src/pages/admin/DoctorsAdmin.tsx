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
  TimePicker
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
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../../services/api';
import styled from 'styled-components';

const { Title } = Typography;
const { Option } = Select;

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

const StatusBadge = styled(Badge)<{ status: string }>`
  .ant-badge-status-dot {
    ${props => props.status === 'active' 
      ? 'background-color: #52c41a;' 
      : 'background-color: #ff4d4f;'
    }
  }
`;

const DoctorsAdmin: React.FC = () => {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState<string | undefined>();
  const [role, setRole] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/doctors', { suppressErrorToast: true } as any);
      const rows: Doctor[] = res.data?.data || res.data || [];
      let list = rows;
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(d =>
          `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
          (d.specialization || '').toLowerCase().includes(q) ||
          (d.departmentName || '').toLowerCase().includes(q) ||
          (d.qualification || '').toLowerCase().includes(q)
        );
      }
      if (department) {
        const dep = departments.find(d => d.id === department);
        const depName = dep?.name?.toLowerCase() || '';
        list = list.filter(d => (d.departmentName || '').toLowerCase() === depName);
      }
      if (role) list = list.filter(d => (d.role || '').toLowerCase() === role.toLowerCase());
      setData(list);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const exportDoctorsCsv = async () => {
    try {
      const res = await api.get('/users/export/csv', { params: { role: 'doctor' }, responseType: 'blob' } as any);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'doctors.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to export');
    }
  };

  const bulkDelete = () => {
    if (!selectedRowKeys.length) return;
    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} doctor(s)?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete('/users/bulk-delete' as any, { data: { ids: selectedRowKeys } } as any);
          message.success('Deleted selected');
          setSelectedRowKeys([]);
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to delete selected');
        }
      }
    });
  };

  const bulkSetActive = async (active: boolean) => {
    if (!selectedRowKeys.length) return;
    try {
      await Promise.all(selectedRowKeys.map(id => api.put(`/users/${id}`, { isActive: active } as any)));
      message.success(active ? 'Activated selected' : 'Deactivated selected');
      setSelectedRowKeys([]);
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update selected');
    }
  };

  useEffect(() => { load(); }, [query, department, role]);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const res = await api.get('/departments', { params: { page: 1, limit: 100 }, suppressErrorToast: true } as any);
        setDepartments(res.data?.data || res.data || []);
      } catch { /* noop */ }
    };
    fetchDeps();
  }, []);

  const openEdit = (row: Doctor) => {
    setEditing(row);
    form.setFieldsValue({
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      email: row.email,
      role: row.role || 'Doctor',
      isActive: row.isActive !== false,
      departmentId: undefined,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          role: values.role,
          isActive: values.isActive,
          departmentId: values.departmentId || undefined,
        } as any);
        message.success('Doctor updated');
      } else {
        // Create a new doctor user
        const createRes = await api.post('/users', {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          phone: values.phone,
          role: 'doctor',
          isActive: values.isActive !== false,
        } as any);
        const newUser = createRes.data;
        // Optionally assign department
        if (values.departmentId) {
          await api.put(`/users/${newUser.id}`, { departmentId: values.departmentId } as any);
        }
        message.success('Doctor created');
      }
      setOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || 'Failed to update doctor');
    }
  };

  const toggleActive = async (row: Doctor) => {
    try {
      await api.put(`/users/${row.id}`, { isActive: !row.isActive } as any);
      message.success(!row.isActive ? 'Activated' : 'Deactivated');
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to toggle');
    }
  };

  const deleteDoctor = async (row: Doctor) => {
    Modal.confirm({
      title: 'Delete doctor?',
      content: `This will remove ${row.firstName} ${row.lastName}. This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/users/${row.id}` as any);
          message.success('Doctor deleted');
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const columns: ColumnsType<Doctor> = [
    { title: 'Name', key: 'name', render: (_, r) => `${r.firstName} ${r.lastName}` },
    { title: 'Department', dataIndex: 'departmentName' },
    { title: 'Specialization', dataIndex: 'specialization' },
    { title: 'Role', dataIndex: 'role', render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Qualification', dataIndex: 'qualification' },
    { title: 'Phone', dataIndex: 'phone', render: (v: string) => v || '—' },
    { title: 'Email', dataIndex: 'email', render: (v: string) => v || '—' },
    { title: 'Active', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'YES' : 'NO'}</Tag> },
    { title: 'Actions', key: 'actions', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
        <Button size="small" danger={r.isActive} onClick={() => toggleActive(r)}>
          {r.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button size="small" danger onClick={() => deleteDoctor(r)}>Delete</Button>
      </Space>
    )}
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Manage Doctors</Title>
        <Space>
          <Input.Search placeholder="Search name, specialization" allowClear onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} />
          <Select placeholder="Department" allowClear value={department} onChange={setDepartment} style={{ width: 220 }}>
            {departments.map(d => (
              <Option value={d.id} key={d.id}>{d.name}</Option>
            ))}
          </Select>
          <Select placeholder="Role" allowClear value={role} onChange={setRole} style={{ width: 200 }}>
            <Option value="Chief Doctor">Chief Doctor</Option>
            <Option value="Senior Doctor">Senior Doctor</Option>
            <Option value="Consultant">Consultant</Option>
            <Option value="Practitioner">Practitioner</Option>
          </Select>
          <Button onClick={exportDoctorsCsv}>Export CSV</Button>
          <Button type="primary" onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue({ role: 'Doctor', isActive: true }); setOpen(true); }}>New Doctor</Button>
        </Space>
      </div>
      <Card>
        <Space style={{ marginBottom: 8 }}>
          <Button disabled={!selectedRowKeys.length} onClick={() => bulkSetActive(true)}>Activate Selected</Button>
          <Button disabled={!selectedRowKeys.length} onClick={() => bulkSetActive(false)}>Deactivate Selected</Button>
          <Button danger disabled={!selectedRowKeys.length} onClick={bulkDelete}>Delete Selected</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        />
      </Card>
      <Drawer
        title={editing ? 'Edit Doctor' : 'New Doctor'}
        placement="right"
        width={480}
        onClose={() => setOpen(false)}
        open={open}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={onSubmit}>{editing ? 'Save' : 'Create'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: 'First name required' }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Last name required' }]}> 
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="role" initialValue="Doctor">
            <Select>
              <Option value="Chief Doctor">Chief Doctor</Option>
              <Option value="Senior Doctor">Senior Doctor</Option>
              <Option value="Consultant">Consultant</Option>
              <Option value="Practitioner">Practitioner</Option>
              <Option value="Doctor">Doctor</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Department" name="departmentId">
            <Select allowClear placeholder="Assign department">
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default DoctorsAdmin;
