import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Select, Space, message, Modal, Form, Input, Popconfirm } from 'antd';
import { HomeOutlined, CheckCircleOutlined, CloseCircleOutlined, ToolOutlined, SyncOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

interface Bed {
  id: string;
  bedNumber: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  notes?: string;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    ward: {
      id: string;
      name: string;
    };
  };
  currentAdmission?: {
    id: string;
    admissionNumber: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
}

interface Ward {
  id: string;
  name: string;
  wardNumber: string;
}

interface Room {
  id: string;
  roomNumber: string;
  ward: {
    id: string;
    name: string;
  };
}

const BedManagement: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchWards();
    fetchBeds();
  }, []);

  const fetchWards = async () => {
    try {
      const response = await api.get('/inpatient/wards');
      setWards(response.data.wards || []);
    } catch (error: any) {
      console.error('Error fetching wards:', error);
      // Only show error if it's not a 404 or empty response
      if (error.response?.status !== 404) {
        message.error('Failed to fetch wards');
      }
    }
  };

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inpatient/beds');
      setBeds(response.data.beds || []);
    } catch (error: any) {
      console.error('Error fetching beds:', error);
      // Only show error if it's not a 404 or empty response
      if (error.response?.status !== 404) {
        message.error('Failed to fetch beds');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (values: any) => {
    if (!selectedBed) return;

    try {
      await api.put(`/inpatient/beds/${selectedBed.id}/status`, {
        status: values.status,
        notes: values.notes
      });
      message.success('Bed status updated successfully');
      setStatusModalVisible(false);
      form.resetFields();
      fetchBeds();
    } catch (error) {
      console.error('Error updating bed status:', error);
      message.error('Failed to update bed status');
    }
  };

  const openStatusModal = (bed: Bed) => {
    setSelectedBed(bed);
    form.setFieldsValue({
      status: bed.status,
      notes: bed.notes
    });
    setStatusModalVisible(true);
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/inpatient/rooms');
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleCreate = () => {
    fetchRooms();
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const handleEdit = (bed: Bed) => {
    setSelectedBed(bed);
    fetchRooms();
    editForm.setFieldsValue({
      bedNumber: bed.bedNumber,
      roomId: bed.room.id,
      notes: bed.notes
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/inpatient/beds/${id}`);
      message.success('Bed deleted successfully');
      fetchBeds();
    } catch (error: any) {
      console.error('Error deleting bed:', error);
      message.error(error.response?.data?.message || 'Failed to delete bed');
    }
  };

  const handleCreateSubmit = async (values: any) => {
    try {
      await api.post('/inpatient/beds', values);
      message.success('Bed created successfully');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchBeds();
    } catch (error: any) {
      console.error('Error creating bed:', error);
      message.error(error.response?.data?.message || 'Failed to create bed');
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!selectedBed) return;
    try {
      await api.put(`/inpatient/beds/${selectedBed.id}`, values);
      message.success('Bed updated successfully');
      setEditModalVisible(false);
      editForm.resetFields();
      fetchBeds();
    } catch (error: any) {
      console.error('Error updating bed:', error);
      message.error(error.response?.data?.message || 'Failed to update bed');
    }
  };

  // Filter beds
  const filteredBeds = beds.filter(bed => {
    const wardMatch = selectedWard === 'all' || bed.room.ward.id === selectedWard;
    const statusMatch = statusFilter === 'all' || bed.status === statusFilter;
    return wardMatch && statusMatch;
  });

  // Calculate statistics
  const totalBeds = filteredBeds.length;
  const availableBeds = filteredBeds.filter(b => b.status === 'available').length;
  const occupiedBeds = filteredBeds.filter(b => b.status === 'occupied').length;
  const maintenanceBeds = filteredBeds.filter(b => b.status === 'maintenance').length;
  const cleaningBeds = filteredBeds.filter(b => b.status === 'cleaning').length;
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'success',
      occupied: 'error',
      reserved: 'warning',
      maintenance: 'default',
      cleaning: 'processing'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      available: <CheckCircleOutlined />,
      occupied: <CloseCircleOutlined />,
      reserved: <HomeOutlined />,
      maintenance: <ToolOutlined />,
      cleaning: <SyncOutlined />
    };
    return icons[status] || <HomeOutlined />;
  };

  const columns = [
    {
      title: 'Bed Number',
      dataIndex: 'bedNumber',
      key: 'bedNumber',
      sorter: (a: Bed, b: Bed) => a.bedNumber.localeCompare(b.bedNumber),
    },
    {
      title: 'Ward',
      dataIndex: ['room', 'ward', 'name'],
      key: 'ward',
    },
    {
      title: 'Room',
      dataIndex: ['room', 'roomNumber'],
      key: 'room',
    },
    {
      title: 'Room Type',
      dataIndex: ['room', 'roomType'],
      key: 'roomType',
      render: (type: string) => type.replace('_', ' ').toUpperCase(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (record: Bed) => {
        if (record.currentAdmission) {
          return (
            <div>
              <div>{`${record.currentAdmission.patient.firstName} ${record.currentAdmission.patient.lastName}`}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {record.currentAdmission.admissionNumber}
              </div>
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || '-',
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: Bed) => (
        <Space>
          <Button
            type="link"
            onClick={() => openStatusModal(record)}
            disabled={record.status === 'occupied'}
          >
            Change Status
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this bed?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.status === 'occupied'}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.status === 'occupied'}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Bed Management</h1>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Beds"
              value={totalBeds}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Available"
              value={availableBeds}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Occupied"
              value={occupiedBeds}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Cleaning"
              value={cleaningBeds}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Maintenance"
              value={maintenanceBeds}
              valueStyle={{ color: '#888' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Occupancy Rate"
              value={occupancyRate}
              suffix="%"
              valueStyle={{ color: parseFloat(occupancyRate) > 80 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="large">
            <div>
              <span style={{ marginRight: '8px' }}>Ward:</span>
              <Select
                style={{ width: 200 }}
                value={selectedWard}
                onChange={setSelectedWard}
              >
                <Option value="all">All Wards</Option>
                {wards.map(ward => (
                  <Option key={ward.id} value={ward.id}>
                    {ward.name}
                  </Option>
                ))}
              </Select>
            </div>
          <div>
            <span style={{ marginRight: '8px' }}>Status:</span>
            <Select
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="available">Available</Option>
              <Option value="occupied">Occupied</Option>
              <Option value="reserved">Reserved</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="cleaning">Cleaning</Option>
            </Select>
            </div>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Bed
          </Button>
        </Space>
      </Card>

      {/* Bed Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBeds}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} beds`,
          }}
        />
      </Card>

      {/* Status Change Modal */}
      <Modal
        title="Change Bed Status"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleStatusChange}>
          <Form.Item label="Bed Number">
            <Input value={selectedBed?.bedNumber} disabled />
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Option value="available">Available</Option>
              <Option value="reserved">Reserved</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="cleaning">Cleaning</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Bed Modal */}
      <Modal
        title="Create Bed"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit}>
          <Form.Item
            label="Bed Number"
            name="bedNumber"
            rules={[{ required: true, message: 'Please enter bed number' }]}
          >
            <Input placeholder="e.g., B-101-A" />
          </Form.Item>
          <Form.Item
            label="Room"
            name="roomId"
            rules={[{ required: true, message: 'Please select room' }]}
          >
            <Select placeholder="Select room">
              {rooms.map(room => (
                <Option key={room.id} value={room.id}>
                  {room.roomNumber} - {room.ward.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Bed Modal */}
      <Modal
        title="Edit Bed"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label="Bed Number"
            name="bedNumber"
            rules={[{ required: true, message: 'Please enter bed number' }]}
          >
            <Input placeholder="e.g., B-101-A" />
          </Form.Item>
          <Form.Item
            label="Room"
            name="roomId"
            rules={[{ required: true, message: 'Please select room' }]}
          >
            <Select placeholder="Select room">
              {rooms.map(room => (
                <Option key={room.id} value={room.id}>
                  {room.roomNumber} - {room.ward.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BedManagement;
