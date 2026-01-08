import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Row, Col, Space, Tag, message, Tabs, Statistic, Switch } from 'antd';
import { SendOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

interface Reminder {
  id: string;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  reminderType: 'SMS' | 'Email' | 'WhatsApp';
  reminderTiming: '24h' | '2h' | '30m';
  status: 'Pending' | 'Sent' | 'Failed';
  sentAt?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  successRate: number;
  byType: { SMS: number; Email: number; WhatsApp: number };
}

const AppointmentReminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [autoSend, setAutoSend] = useState(true);

  const loadReminders = async () => {
    try {
      setLoading(true);
      // Load reminders first
      const remindersRes = await api.get('/appointment-reminders');
      setReminders(remindersRes.data?.data || []);
      
      // Then load stats
      try {
        const statsRes = await api.get('/appointment-reminders/stats');
        setStats(statsRes.data?.data || null);
      } catch (statsErr) {
        console.warn('Failed to load stats:', statsErr);
        // Continue even if stats fail
      }
    } catch (e: any) {
      console.error('Failed to load reminders:', e);
      message.error(e.response?.data?.message || 'Failed to load reminders');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post('/appointment-reminders', values);
      setReminders([...reminders, res.data?.data]);
      setIsModalOpen(false);
      form.resetFields();
      message.success('Reminder created');
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (reminderId: string) => {
    try {
      setLoading(true);
      const res = await api.post(`/appointment-reminders/${reminderId}/send`);
      setReminders(reminders.map(r => r.id === reminderId ? res.data?.data : r));
      message.success(res.data?.message || 'Reminder sent');
    } catch (e: any) {
      message.error('Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reminderId: string) => {
    try {
      setLoading(true);
      await api.delete(`/appointment-reminders/${reminderId}`);
      setReminders(reminders.filter(r => r.id !== reminderId));
      message.success('Reminder deleted');
    } catch (e: any) {
      message.error('Failed to delete reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAll = async () => {
    try {
      setLoading(true);
      const pending = reminders.filter(r => r.status === 'Pending');
      for (const reminder of pending) {
        await api.post(`/appointment-reminders/${reminder.id}/send`);
      }
      await loadReminders();
      message.success(`${pending.length} reminders sent`);
    } catch (e: any) {
      message.error('Failed to send reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const columns = [
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Appointment', key: 'appointment', render: (_: any, r: Reminder) => `${r.appointmentDate} ${r.appointmentTime}` },
    { title: 'Type', dataIndex: 'reminderType', key: 'reminderType', render: (t: string) => {
      const icon = t === 'SMS' ? <PhoneOutlined /> : t === 'Email' ? <MailOutlined /> : '💬';
      return <Tag icon={icon}>{t}</Tag>;
    } },
    { title: 'Timing', dataIndex: 'reminderTiming', key: 'reminderTiming', render: (t: string) => <Tag color="blue">{t} before</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = s === 'Sent' ? 'green' : s === 'Pending' ? 'orange' : 'red';
      return <Tag color={color}>{s}</Tag>;
    } },
    { title: 'Actions', key: 'actions', render: (_: any, r: Reminder) => (
      <Space size="small">
        {r.status === 'Pending' && <Button size="small" icon={<SendOutlined />} onClick={() => handleSend(r.id)}>Send</Button>}
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)}>Delete</Button>
      </Space>
    ) },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '📊 Dashboard',
          children: (
            <Row gutter={16}>
              <Col span={6}><Statistic title="Total Reminders" value={stats?.total || 0} /></Col>
              <Col span={6}><Statistic title="Sent" value={stats?.sent || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="Pending" value={stats?.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Col>
              <Col span={6}><Statistic title="Success Rate" value={`${stats?.successRate || 0}%`} valueStyle={{ color: '#1890ff' }} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="SMS" value={stats?.byType?.SMS || 0} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Email" value={stats?.byType?.Email || 0} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="WhatsApp" value={stats?.byType?.WhatsApp || 0} /></Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '📋 Reminders',
          children: (
            <Card extra={
              <Space>
                <Switch checked={autoSend} onChange={setAutoSend} /> Auto-send
                <Button type="primary" onClick={() => setIsModalOpen(true)}>Create Reminder</Button>
                <Button onClick={handleSendAll} disabled={!reminders.some(r => r.status === 'Pending')}>Send All Pending</Button>
              </Space>
            }>
              <Table rowKey="id" columns={columns as any} dataSource={reminders} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
      ]} />

      <Modal open={isModalOpen} title="Create Appointment Reminder" onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientName" label="Patient Name" rules={[{ required: true }]}>
                <Input placeholder="Enter patient name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doctorName" label="Doctor Name" rules={[{ required: true }]}>
                <Input placeholder="Enter doctor name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientEmail" label="Patient Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="patient@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientPhone" label="Patient Phone">
                <Input placeholder="+1234567890" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appointmentDate" label="Appointment Date" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appointmentTime" label="Appointment Time" rules={[{ required: true }]}>
                <Input type="time" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reminderType" label="Reminder Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="Email">Email</Option>
                  <Option value="SMS">SMS</Option>
                  <Option value="WhatsApp">WhatsApp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reminderTiming" label="Send Before" rules={[{ required: true }]}>
                <Select placeholder="Select timing">
                  <Option value="24h">24 hours</Option>
                  <Option value="2h">2 hours</Option>
                  <Option value="30m">30 minutes</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit">Create Reminder</Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentReminders;
