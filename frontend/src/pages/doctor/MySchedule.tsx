import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Select, TimePicker, Input, Space, Tag, message, Popconfirm, Typography, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../services/api';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Option } = Select;

interface AvailabilitySlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  specificDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const daysOfWeek = [
  { value: 'monday', label: 'Monday', order: 1 },
  { value: 'tuesday', label: 'Tuesday', order: 2 },
  { value: 'wednesday', label: 'Wednesday', order: 3 },
  { value: 'thursday', label: 'Thursday', order: 4 },
  { value: 'friday', label: 'Friday', order: 5 },
  { value: 'saturday', label: 'Saturday', order: 6 },
  { value: 'sunday', label: 'Sunday', order: 7 }
];

const PageContainer = styled.div`
  .schedule-header {
    margin-bottom: 24px;
  }

  .weekly-overview {
    margin-bottom: 24px;
  }

  .day-card {
    height: 100%;
    border-left: 4px solid #1890ff;
    
    &.has-slots {
      border-left-color: #52c41a;
    }
    
    &.no-slots {
      border-left-color: #d9d9d9;
    }
  }

  .time-slot {
    padding: 8px;
    background: #f0f2f5;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 12px;
  }
`;

const MySchedule: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.get('/availability/my-schedule');
      setSlots(res.data?.data || []);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSlot(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    form.setFieldsValue({
      dayOfWeek: slot.dayOfWeek,
      startTime: dayjs(slot.startTime, 'HH:mm:ss'),
      endTime: dayjs(slot.endTime, 'HH:mm:ss'),
      notes: slot.notes,
      isActive: slot.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/availability/${id}`);
      message.success('Availability slot deleted');
      loadSchedule();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to delete slot');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        notes: values.notes,
        isActive: values.isActive !== undefined ? values.isActive : true
      };

      if (editingSlot) {
        await api.put(`/availability/${editingSlot.id}`, payload);
        message.success('Availability slot updated');
      } else {
        // Get current user ID from token
        const userRes = await api.get('/auth/me');
        await api.post('/availability', {
          ...payload,
          doctorId: userRes.data.id
        });
        message.success('Availability slot created');
      }

      setModalVisible(false);
      loadSchedule();
    } catch (error: any) {
      if (error?.errorFields) return; // Form validation error
      message.error(error?.response?.data?.message || 'Failed to save slot');
    }
  };

  const getWeeklyOverview = () => {
    const overview: { [key: string]: AvailabilitySlot[] } = {};
    daysOfWeek.forEach(day => {
      overview[day.value] = slots.filter(slot => slot.dayOfWeek === day.value && slot.isActive);
    });
    return overview;
  };

  const weeklyOverview = getWeeklyOverview();
  const totalSlots = slots.filter(s => s.isActive).length;
  const totalHours = slots
    .filter(s => s.isActive)
    .reduce((sum, slot) => {
      const start = dayjs(slot.startTime, 'HH:mm:ss');
      const end = dayjs(slot.endTime, 'HH:mm:ss');
      return sum + end.diff(start, 'hour', true);
    }, 0);

  const columns: ColumnsType<AvailabilitySlot> = [
    {
      title: 'Day',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (day: string) => {
        const dayInfo = daysOfWeek.find(d => d.value === day);
        return <Tag color="blue">{dayInfo?.label || day}</Tag>;
      },
      sorter: (a, b) => {
        const aOrder = daysOfWeek.find(d => d.value === a.dayOfWeek)?.order || 0;
        const bOrder = daysOfWeek.find(d => d.value === b.dayOfWeek)?.order || 0;
        return aOrder - bOrder;
      }
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('hh:mm A')
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('hh:mm A')
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        const start = dayjs(record.startTime, 'HH:mm:ss');
        const end = dayjs(record.endTime, 'HH:mm:ss');
        const hours = end.diff(start, 'hour', true);
        return `${hours.toFixed(1)} hrs`;
      }
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this availability slot?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <PageContainer>
      <div className="schedule-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>My Schedule</Title>
            <Text type="secondary">Manage your availability and consultation hours</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Availability
          </Button>
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Time Slots"
                value={totalSlots}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Weekly Hours"
                value={totalHours.toFixed(1)}
                suffix="hrs"
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Days"
                value={Object.values(weeklyOverview).filter(slots => slots.length > 0).length}
                suffix="/ 7"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Card title="Weekly Overview" className="weekly-overview">
        <Row gutter={[16, 16]}>
          {daysOfWeek.map(day => {
            const daySlots = weeklyOverview[day.value];
            const hasSlots = daySlots.length > 0;
            
            return (
              <Col span={24} md={12} lg={8} key={day.value}>
                <Card 
                  size="small" 
                  className={`day-card ${hasSlots ? 'has-slots' : 'no-slots'}`}
                  title={
                    <Space>
                      <CalendarOutlined />
                      <span>{day.label}</span>
                      {hasSlots && <Tag color="green">{daySlots.length} slot{daySlots.length > 1 ? 's' : ''}</Tag>}
                    </Space>
                  }
                >
                  {hasSlots ? (
                    daySlots.map(slot => (
                      <div key={slot.id} className="time-slot">
                        <ClockCircleOutlined /> {dayjs(slot.startTime, 'HH:mm:ss').format('hh:mm A')} - {dayjs(slot.endTime, 'HH:mm:ss').format('hh:mm A')}
                      </div>
                    ))
                  ) : (
                    <Text type="secondary">No availability set</Text>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card title="All Availability Slots">
        <Table
          columns={columns}
          dataSource={slots}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingSlot ? 'Edit Availability Slot' : 'Add Availability Slot'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingSlot ? 'Update' : 'Create'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="dayOfWeek"
            label="Day of Week"
            rules={[{ required: true, message: 'Please select a day' }]}
          >
            <Select placeholder="Select day">
              {daysOfWeek.map(day => (
                <Option key={day.value} value={day.value}>
                  {day.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Please select start time' }]}
              >
                <TimePicker
                  format="hh:mm A"
                  use12Hours
                  style={{ width: '100%' }}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Please select end time' }]}
              >
                <TimePicker
                  format="hh:mm A"
                  use12Hours
                  style={{ width: '100%' }}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g., Morning consultation hours, Emergency slots, etc."
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            initialValue={true}
          >
            <Select>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default MySchedule;
