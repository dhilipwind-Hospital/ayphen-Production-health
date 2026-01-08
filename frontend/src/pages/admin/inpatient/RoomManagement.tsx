import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../../../services/api';

const { Option } = Select;

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  dailyRate: number;
  features?: string;
  ward: {
    id: string;
    name: string;
    wardNumber: string;
  };
}

interface Ward {
  id: string;
  name: string;
  wardNumber: string;
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRooms();
    fetchWards();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inpatient/rooms');
      setRooms(response.data.rooms || []);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      if (error.response?.status !== 404) {
        message.error('Failed to fetch rooms');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async () => {
    try {
      const response = await api.get('/inpatient/wards');
      const wardsData = response.data.wards || [];
      if (wardsData.length === 0) {
        message.warning('No wards found. Please create wards first in "Inpatient - Wards (Admin)"');
      }
      setWards(wardsData);
    } catch (error: any) {
      console.error('Error fetching wards:', error);
      if (error.response?.status !== 404) {
        message.error('Failed to fetch wards');
      }
    }
  };

  const handleCreate = () => {
    setEditingRoom(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.setFieldsValue({
      roomNumber: room.roomNumber,
      wardId: room.ward.id,
      roomType: room.roomType,
      capacity: room.capacity,
      dailyRate: room.dailyRate,
      features: room.features
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/inpatient/rooms/${id}`);
      message.success('Room deleted successfully');
      fetchRooms();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      message.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingRoom) {
        await api.put(`/inpatient/rooms/${editingRoom.id}`, values);
        message.success('Room updated successfully');
      } else {
        await api.post('/inpatient/rooms', values);
        message.success('Room created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchRooms();
    } catch (error: any) {
      console.error('Error saving room:', error);
      message.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const getRoomTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      general: 'default',
      semi_private: 'blue',
      private: 'green',
      deluxe: 'gold',
      icu: 'red',
      nicu: 'purple',
      picu: 'orange',
      isolation: 'magenta'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Room Number',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      sorter: (a: Room, b: Room) => a.roomNumber.localeCompare(b.roomNumber),
    },
    {
      title: 'Ward',
      key: 'ward',
      render: (record: Room) => `${record.ward.name} (${record.ward.wardNumber})`,
    },
    {
      title: 'Room Type',
      dataIndex: 'roomType',
      key: 'roomType',
      render: (type: string) => (
        <Tag color={getRoomTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Daily Rate',
      dataIndex: 'dailyRate',
      key: 'dailyRate',
      render: (rate: number) => `₹${rate.toLocaleString()}`,
    },
    {
      title: 'Features',
      dataIndex: 'features',
      key: 'features',
      render: (features: string) => features || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Room) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this room?"
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
            <span>Room Management</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Room
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} rooms`,
          }}
        />
      </Card>

      <Modal
        title={editingRoom ? 'Edit Room' : 'Create Room'}
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
            label="Room Number"
            name="roomNumber"
            rules={[{ required: true, message: 'Please enter room number' }]}
          >
            <Input placeholder="e.g., R-101" />
          </Form.Item>

          <Form.Item
            label="Ward"
            name="wardId"
            rules={[{ required: true, message: 'Please select ward' }]}
          >
            <Select placeholder="Select ward">
              {wards.map(ward => (
                <Option key={ward.id} value={ward.id}>
                  {ward.name} ({ward.wardNumber})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Room Type"
            name="roomType"
            rules={[{ required: true, message: 'Please select room type' }]}
          >
            <Select placeholder="Select room type">
              <Option value="general">General</Option>
              <Option value="semi_private">Semi-Private</Option>
              <Option value="private">Private</Option>
              <Option value="deluxe">Deluxe</Option>
              <Option value="icu">ICU</Option>
              <Option value="nicu">NICU</Option>
              <Option value="picu">PICU</Option>
              <Option value="isolation">Isolation</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Capacity (Number of Beds)"
            name="capacity"
            rules={[{ required: true, message: 'Please enter capacity' }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="e.g., 4" />
          </Form.Item>

          <Form.Item
            label="Daily Rate (₹)"
            name="dailyRate"
            rules={[{ required: true, message: 'Please enter daily rate' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 2000" />
          </Form.Item>

          <Form.Item label="Features" name="features">
            <Input placeholder="e.g., AC, TV, Attached Bathroom" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomManagement;
