import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Table,
  Space,
  Modal,
  message,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Avatar,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = TimePicker;

// Types
interface Session {
  id: string;
  title: string;
  description?: string;
  type: 'consultation' | 'training' | 'meeting' | 'procedure';
  startTime: string;
  endTime: string;
  date: string;
  location: string;
  attendees: string[];
  maxAttendees?: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

interface Attendee {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

const ScheduleSessionWorking: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

  // Fetch data from API
  useEffect(() => {
    // Fetch attendees from API
    setAttendees([]);

    // Fetch sessions from API
    setSessions([]);
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const sessionData: Session = {
        id: editingSession?.id || Date.now().toString(),
        title: values.title,
        description: values.description,
        type: values.type,
        startTime: values.timeRange[0].format('HH:mm'),
        endTime: values.timeRange[1].format('HH:mm'),
        date: values.date.format('YYYY-MM-DD'),
        location: values.location,
        attendees: values.attendees || [],
        maxAttendees: values.maxAttendees,
        status: 'scheduled',
        createdBy: 'Current User',
        createdAt: editingSession?.createdAt || new Date().toISOString(),
        isRecurring: values.isRecurring,
        recurringPattern: values.recurringPattern
      };

      if (editingSession) {
        setSessions(prev => prev.map(s => s.id === editingSession.id ? sessionData : s));
        message.success('Session updated successfully!');
      } else {
        setSessions(prev => [...prev, sessionData]);
        message.success('Session scheduled successfully!');
      }

      setModalVisible(false);
      setEditingSession(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    form.setFieldsValue({
      title: session.title,
      description: session.description,
      type: session.type,
      date: dayjs(session.date),
      timeRange: [dayjs(session.startTime, 'HH:mm'), dayjs(session.endTime, 'HH:mm')],
      location: session.location,
      attendees: session.attendees,
      maxAttendees: session.maxAttendees,
      isRecurring: session.isRecurring,
      recurringPattern: session.recurringPattern
    });
    setModalVisible(true);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      message.success('Session deleted successfully!');
    } catch (error) {
      message.error('Failed to delete session.');
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: Session['status']) => {
    try {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: newStatus } : s
      ));
      message.success(`Session status updated to ${newStatus}!`);
    } catch (error) {
      message.error('Failed to update session status.');
    }
  };

  const getAttendeeNames = (attendeeIds: string[]) => {
    return attendeeIds.map(id => {
      const attendee = attendees.find(a => a.id === id);
      return attendee ? attendee.name : 'Unknown';
    }).join(', ');
  };

  const getTypeIcon = (type: Session['type']) => {
    switch (type) {
      case 'consultation': return <UserOutlined />;
      case 'training': return <TeamOutlined />;
      case 'meeting': return <VideoCameraOutlined />;
      case 'procedure': return <CheckCircleOutlined />;
      default: return <CalendarOutlined />;
    }
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'scheduled': return <ClockCircleOutlined />;
      case 'in-progress': return <ExclamationCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      case 'cancelled': return <DeleteOutlined />;
      default: return <CalendarOutlined />;
    }
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled': return '#1890ff';
      case 'in-progress': return '#fa8c16';
      case 'completed': return '#52c41a';
      case 'cancelled': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const columns: ColumnsType<Session> = [
    {
      title: 'Session',
      key: 'session',
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getTypeIcon(record.type)}
            <Text strong>{record.title}</Text>
          </div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.date).format('MMM DD, YYYY')}</div>
          <Text type="secondary">
            {record.startTime} - {record.endTime}
          </Text>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EnvironmentOutlined />
          {location}
        </div>
      ),
    },
    {
      title: 'Attendees',
      key: 'attendees',
      render: (_, record) => (
        <div>
          <Avatar.Group maxCount={3} size="small">
            {record.attendees.map(attendeeId => {
              const attendee = attendees.find(a => a.id === attendeeId);
              return (
                <Tooltip key={attendeeId} title={attendee?.name}>
                  <Avatar src={attendee?.avatar} icon={<UserOutlined />} />
                </Tooltip>
              );
            })}
          </Avatar.Group>
          {record.maxAttendees && (
            <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
              {record.attendees.length}/{record.maxAttendees}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusIcon(record.status)}
          <span style={{ marginLeft: 4 }}>
            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
          </span>
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Session">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'scheduled' && (
            <Tooltip title="Start Session">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'in-progress')}
              />
            </Tooltip>
          )}
          {record.status === 'in-progress' && (
            <Tooltip title="Complete Session">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'completed')}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Are you sure you want to delete this session?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Session">
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
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined />
            Schedule Session Management
          </div>
        }
        extra={
          <Space>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              onClick={() => setViewMode('card')}
            >
              Card View
            </Button>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
            >
              Table View
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSession(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Schedule Session
            </Button>
          </Space>
        }
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
          color: 'white'
        }}
      >
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#e91e63', margin: 0 }}>
                  {sessions.filter(s => s.status === 'scheduled').length}
                </Title>
                <Text type="secondary">Scheduled</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#fa8c16', margin: 0 }}>
                  {sessions.filter(s => s.status === 'in-progress').length}
                </Title>
                <Text type="secondary">In Progress</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
                  {sessions.filter(s => s.status === 'completed').length}
                </Title>
                <Text type="secondary">Completed</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                  {sessions.length}
                </Title>
                <Text type="secondary">Total Sessions</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Sessions Display */}
        {viewMode === 'card' ? (
          <Row gutter={[16, 16]}>
            {sessions.map(session => (
              <Col key={session.id} xs={24} sm={12} lg={8}>
                <Card
                  size="small"
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getTypeIcon(session.type)}
                      <span>{session.title}</span>
                    </div>
                  }
                  extra={
                    <Tag color={getStatusColor(session.status)}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('-', ' ')}
                    </Tag>
                  }
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(session)}
                    />,
                    session.status === 'scheduled' ? (
                      <Button
                        key="start"
                        type="text"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleStatusChange(session.id, 'in-progress')}
                      />
                    ) : session.status === 'in-progress' ? (
                      <Button
                        key="complete"
                        type="text"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleStatusChange(session.id, 'completed')}
                      />
                    ) : null,
                    <Popconfirm
                      key="delete"
                      title="Delete this session?"
                      onConfirm={() => handleDelete(session.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                  style={{
                    borderLeft: `4px solid ${getStatusColor(session.status)}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">{session.description}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    <Text>{dayjs(session.date).format('MMM DD, YYYY')}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    <Text>{session.startTime} - {session.endTime}</Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    <Text>{session.location}</Text>
                  </div>
                  <div>
                    <Avatar.Group maxCount={3} size="small">
                      {session.attendees.map(attendeeId => {
                        const attendee = attendees.find(a => a.id === attendeeId);
                        return (
                          <Tooltip key={attendeeId} title={attendee?.name}>
                            <Avatar src={attendee?.avatar} icon={<UserOutlined />} />
                          </Tooltip>
                        );
                      })}
                    </Avatar.Group>
                    {session.maxAttendees && (
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                        {session.attendees.length}/{session.maxAttendees}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Table
            columns={columns}
            dataSource={sessions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Schedule Session Modal */}
      <Modal
        title={editingSession ? 'Edit Session' : 'Schedule New Session'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSession(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'meeting',
            date: dayjs().add(1, 'day'),
            timeRange: [dayjs('09:00', 'HH:mm'), dayjs('10:00', 'HH:mm')],
          }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Session Title"
                rules={[{ required: true, message: 'Please enter session title' }]}
              >
                <Input placeholder="Enter session title" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Session Type"
                rules={[{ required: true, message: 'Please select session type' }]}
              >
                <Select placeholder="Select session type">
                  <Option value="consultation">Consultation</Option>
                  <Option value="training">Training</Option>
                  <Option value="meeting">Meeting</Option>
                  <Option value="procedure">Procedure</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Enter location" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeRange"
                label="Time"
                rules={[{ required: true, message: 'Please select time range' }]}
              >
                <RangePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter session description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="attendees" label="Attendees">
                <Select
                  mode="multiple"
                  placeholder="Select attendees"
                  optionLabelProp="label"
                >
                  {attendees.map(attendee => (
                    <Option key={attendee.id} value={attendee.id} label={attendee.name}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" src={attendee.avatar} icon={<UserOutlined />} />
                        <div>
                          <div>{attendee.name}</div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {attendee.role}
                          </Text>
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxAttendees" label="Max Attendees">
                <Input type="number" placeholder="Enter max attendees" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CalendarOutlined />}
              >
                {editingSession ? 'Update Session' : 'Schedule Session'}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingSession(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleSessionWorking;
