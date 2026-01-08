import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  message,
  Card,
  DatePicker,
  Select,
  Switch,
  Table,
  Space,
  Tag,
  Modal,
  Typography,
  Collapse,
  Divider,
  Row,
  Col
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface AvailabilityRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  status: 'available' | 'on-leave' | 'holiday' | 'blocked';
  isRecurring: boolean;
  createdAt: string;
}

interface AvailabilityFormData {
  date: dayjs.Dayjs;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  status: 'available' | 'on-leave' | 'holiday' | 'blocked';
  isRecurring: boolean;
}

const AvailabilitySetup: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm<AvailabilityFormData>();
  const [schedule, setSchedule] = useState<AvailabilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadSchedule();
    }
  }, [user?.id]);

  const loadSchedule = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await api.get(`/appointments/doctor-schedule/${user.id}`);
      setSchedule(res.data?.data || []);
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: AvailabilityFormData) => {
    if (!user?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime,
        endTime: values.endTime,
        slotDurationMinutes: values.slotDurationMinutes,
        status: values.status,
        isRecurring: values.isRecurring
      };

      if (editingId) {
        // Update existing availability
        await api.put(`/appointments/availability/${user.id}/${editingId}`, payload);
        msgApi.success('Availability updated successfully!');
      } else {
        // Create new availability
        await api.post(`/appointments/availability/${user.id}`, payload);
        msgApi.success('Availability added successfully!');
      }

      form.resetFields();
      setEditingId(null);
      loadSchedule();
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to save availability');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Availability',
      content: 'Are you sure you want to delete this availability record?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await api.delete(`/appointments/availability/${user?.id}/${id}`);
          msgApi.success('Availability deleted successfully!');
          loadSchedule();
        } catch (error: any) {
          msgApi.error(error.response?.data?.message || 'Failed to delete availability');
        }
      }
    });
  };

  const handleEdit = (record: AvailabilityRecord) => {
    setEditingId(record.id);
    form.setFieldsValue({
      date: dayjs(record.date),
      startTime: record.startTime,
      endTime: record.endTime,
      slotDurationMinutes: record.slotDurationMinutes,
      status: record.status,
      isRecurring: record.isRecurring
    });
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('MMM DD, YYYY'),
      width: 150
    },
    {
      title: 'Time',
      key: 'time',
      render: (_: any, record: AvailabilityRecord) => `${record.startTime} - ${record.endTime}`,
      width: 130
    },
    {
      title: 'Slot Duration',
      dataIndex: 'slotDurationMinutes',
      key: 'slotDurationMinutes',
      render: (text: number) => `${text} min`,
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          available: 'green',
          'on-leave': 'orange',
          holiday: 'red',
          blocked: 'gray'
        };
        return <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>;
      },
      width: 120
    },
    {
      title: 'Recurring',
      dataIndex: 'isRecurring',
      key: 'isRecurring',
      render: (isRecurring: boolean) => isRecurring ? '✓ Yes (12 weeks)' : '✗ No',
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AvailabilityRecord) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        <Title level={2}>My Availability Schedule</Title>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={10}>
            <Card title={editingId ? 'Edit Availability' : 'Add Availability'}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
              >
                <Form.Item
                  name="date"
                  label="Date"
                  rules={[
                    { required: true, message: 'Please select a date' },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (value.isBefore(dayjs(), 'day')) {
                          return Promise.reject(new Error('Please select a future date'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="startTime"
                  label="Start Time"
                  rules={[{ required: true, message: 'Please enter start time' }]}
                >
                  <Input
                    type="time"
                    placeholder="HH:mm"
                  />
                </Form.Item>

                <Form.Item
                  name="endTime"
                  label="End Time"
                  rules={[
                    { required: true, message: 'Please enter end time' },
                    {
                      validator: (_, value) => {
                        const startTime = form.getFieldValue('startTime');
                        if (!startTime || !value) return Promise.resolve();
                        if (value <= startTime) {
                          return Promise.reject(new Error('End time must be after start time'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input
                    type="time"
                    placeholder="HH:mm"
                  />
                </Form.Item>

                <Form.Item
                  name="slotDurationMinutes"
                  label="Slot Duration (minutes)"
                  rules={[{ required: true, message: 'Please select slot duration' }]}
                  initialValue={30}
                >
                  <Select
                    options={[
                      { value: 15, label: '15 minutes' },
                      { value: 20, label: '20 minutes' },
                      { value: 30, label: '30 minutes' },
                      { value: 45, label: '45 minutes' },
                      { value: 60, label: '60 minutes' }
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                  initialValue="available"
                >
                  <Select
                    options={[
                      { value: 'available', label: 'Available' },
                      { value: 'on-leave', label: 'On Leave' },
                      { value: 'holiday', label: 'Holiday' },
                      { value: 'blocked', label: 'Blocked' }
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  name="isRecurring"
                  label="Repeat for 12 weeks?"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Switch />
                </Form.Item>

                <Form.Item noStyle>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    {editingId && (
                      <Button onClick={() => {
                        form.resetFields();
                        setEditingId(null);
                      }}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button type="primary" htmlType="submit" loading={submitting}>
                      {editingId ? 'Update' : 'Add'} Availability
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Card style={{ marginTop: 20 }}>
              <Title level={5}>Tips</Title>
              <ul style={{ fontSize: 12 }}>
                <li>Set your availability weekly to help patients book appointments</li>
                <li>Use "On Leave" for planned vacations</li>
                <li>Use "Holiday" for public holidays</li>
                <li>Use "Blocked" to block specific time slots</li>
                <li>Enable "Repeat for 12 weeks" to apply the same schedule weekly</li>
              </ul>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title="Your Schedule">
              <Table
                columns={columns}
                dataSource={schedule}
                loading={loading}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true
                }}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default AvailabilitySetup;
