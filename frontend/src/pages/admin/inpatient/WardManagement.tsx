import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../../../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface Ward {
  id: string;
  name: string;
  wardNumber: string;
  description?: string;
  capacity: number;
  location?: string;
  department?: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

const WardManagement: React.FC = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWards();
    fetchDepartments();
  }, []);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inpatient/wards');
      setWards(response.data.wards || []);
    } catch (error: any) {
      console.error('Error fetching wards:', error);
      if (error.response?.status !== 404) {
        message.error('Failed to fetch wards');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      console.log('Departments response:', response.data);
      // Handle different response formats
      const depts = response.data.departments || response.data || [];
      
      if (depts.length > 0) {
        setDepartments(depts);
      } else {
        // Use fallback departments if API returns empty
        const fallbackDepartments = [
          { id: 'dept-1', name: 'General Medicine' },
          { id: 'dept-2', name: 'Cardiology' },
          { id: 'dept-3', name: 'Orthopedics' },
          { id: 'dept-4', name: 'Pediatrics' },
          { id: 'dept-5', name: 'Surgery' },
          { id: 'dept-6', name: 'Gynecology' },
          { id: 'dept-7', name: 'Neurology' },
          { id: 'dept-8', name: 'Oncology' },
          { id: 'dept-9', name: 'Dermatology' },
          { id: 'dept-10', name: 'Psychiatry' },
          { id: 'dept-11', name: 'Radiology' },
          { id: 'dept-12', name: 'Emergency Medicine' },
          { id: 'dept-13', name: 'ICU' },
          { id: 'dept-14', name: 'NICU' },
          { id: 'dept-15', name: 'PICU' },
        ];
        setDepartments(fallbackDepartments);
        message.info('Using default departments. These will be created when you save the ward.');
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      // Use fallback departments on error
      const fallbackDepartments = [
        { id: 'dept-1', name: 'General Medicine' },
        { id: 'dept-2', name: 'Cardiology' },
        { id: 'dept-3', name: 'Orthopedics' },
        { id: 'dept-4', name: 'Pediatrics' },
        { id: 'dept-5', name: 'Surgery' },
        { id: 'dept-6', name: 'Gynecology' },
        { id: 'dept-7', name: 'Neurology' },
        { id: 'dept-8', name: 'Oncology' },
        { id: 'dept-9', name: 'Dermatology' },
        { id: 'dept-10', name: 'Psychiatry' },
        { id: 'dept-11', name: 'Radiology' },
        { id: 'dept-12', name: 'Emergency Medicine' },
        { id: 'dept-13', name: 'ICU' },
        { id: 'dept-14', name: 'NICU' },
        { id: 'dept-15', name: 'PICU' },
      ];
      setDepartments(fallbackDepartments);
      message.info('Using default departments list');
    }
  };

  const handleCreate = () => {
    setEditingWard(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (ward: Ward) => {
    setEditingWard(ward);
    form.setFieldsValue({
      name: ward.name,
      wardNumber: ward.wardNumber,
      description: ward.description,
      capacity: ward.capacity,
      location: ward.location,
      departmentId: ward.department?.id
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/inpatient/wards/${id}`);
      message.success('Ward deleted successfully');
      fetchWards();
    } catch (error: any) {
      console.error('Error deleting ward:', error);
      message.error(error.response?.data?.message || 'Failed to delete ward');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingWard) {
        await api.put(`/inpatient/wards/${editingWard.id}`, values);
        message.success('Ward updated successfully');
      } else {
        await api.post('/inpatient/wards', values);
        message.success('Ward created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchWards();
    } catch (error: any) {
      console.error('Error saving ward:', error);
      message.error(error.response?.data?.message || 'Failed to save ward');
    }
  };

  const columns = [
    {
      title: 'Ward Number',
      dataIndex: 'wardNumber',
      key: 'wardNumber',
      sorter: (a: Ward, b: Ward) => a.wardNumber.localeCompare(b.wardNumber),
    },
    {
      title: 'Ward Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Department',
      key: 'department',
      render: (record: Ward) => record.department?.name || '-',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Ward) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this ward?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <HomeOutlined />
            <span>Ward Management</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Ward
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={wards}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} wards`,
          }}
        />
      </Card>

      <Modal
        title={editingWard ? 'Edit Ward' : 'Create Ward'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Ward Number"
            name="wardNumber"
            rules={[{ required: true, message: 'Please enter ward number' }]}
          >
            <Input placeholder="e.g., W-001" />
          </Form.Item>

          <Form.Item
            label="Ward Name"
            name="name"
            rules={[{ required: true, message: 'Please enter ward name' }]}
          >
            <Input placeholder="e.g., General Ward" />
          </Form.Item>

          <Form.Item
            label="Department"
            name="departmentId"
            rules={[{ required: false, message: 'Please select department' }]}
            help={departments.length === 0 ? 'No departments available. You can create ward without department.' : ''}
          >
            <Select 
              placeholder={departments.length === 0 ? 'No departments available (optional)' : 'Select department'}
              allowClear
            >
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Capacity"
            name="capacity"
            rules={[{ required: true, message: 'Please enter capacity' }]}
          >
            <InputNumber min={1} max={500} style={{ width: '100%' }} placeholder="e.g., 50" />
          </Form.Item>

          <Form.Item label="Location" name="location">
            <Input placeholder="e.g., Building A, Floor 2" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WardManagement;
