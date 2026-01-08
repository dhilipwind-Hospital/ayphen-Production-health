import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Row, Col, Space, Tag, message, Tabs, Statistic, Badge, List } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, CheckCircleOutlined, AlertOutlined, TruckOutlined, UserOutlined, BellOutlined } from '@ant-design/icons';
import api from '../../services/api';

interface Ambulance {
  id: string;
  registrationNumber: string;
  driverName: string;
  status: string;
  location: { latitude: number; longitude: number };
  fuelLevel: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  certifications: string[];
  performanceRating: number;
  totalTrips: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  overview: {
    totalTrips: number;
    completedTrips: number;
    avgResponseTime: string;
    avgTripDistance: string;
    totalAmbulances: number;
    totalDrivers: number;
  };
  ambulanceStats: any[];
  driverStats: any[];
  trends: any;
}

const AmbulanceAdvanced: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [driverForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ambRes, drvRes, notifRes, analyticsRes] = await Promise.all([
        api.get('/ambulance'),
        api.get('/ambulance/drivers/list'),
        api.get('/ambulance/notifications'),
        api.get('/ambulance/analytics/detailed'),
      ]);
      setAmbulances(ambRes.data?.data || []);
      setDrivers(drvRes.data?.data || []);
      setNotifications(notifRes.data?.data?.notifications || []);
      setAnalytics(analyticsRes.data?.data || null);
    } catch (e: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSmartDispatch = async () => {
    try {
      const res = await api.post('/ambulance/dispatch/smart', {
        pickupLat: 40.7128,
        pickupLng: -74.0060,
        priority: 'Emergency',
      });
      message.success(`Best ambulance: ${res.data?.data?.ambulance?.registrationNumber}`);
    } catch (e: any) {
      message.error('Dispatch failed');
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await api.patch(`/ambulance/notifications/${notifId}/read`);
      setNotifications(notifications.map(n => n.id === notifId ? { ...n, status: 'read' } : n));
      message.success('Marked as read');
    } catch (e: any) {
      message.error('Failed to update');
    }
  };

  const handleAddDriver = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post('/ambulance/drivers', {
        name: values.name,
        phone: values.phone,
        licenseNumber: values.licenseNumber,
        licenseExpiry: values.licenseExpiry,
        certifications: values.certifications ? values.certifications.split(',').map((c: string) => c.trim()) : [],
      });
      setDrivers([...drivers, res.data?.data]);
      setIsDriverModalOpen(false);
      driverForm.resetFields();
      message.success('Driver added successfully');
    } catch (e: any) {
      message.error('Failed to add driver');
    } finally {
      setLoading(false);
    }
  };

  const driverColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'License', dataIndex: 'licenseNumber', key: 'licenseNumber' },
    { title: 'Expiry', dataIndex: 'licenseExpiry', key: 'licenseExpiry' },
    { title: 'Rating', dataIndex: 'performanceRating', key: 'performanceRating', render: (r: number) => <Tag color="gold">{r}/5</Tag> },
    { title: 'Trips', dataIndex: 'totalTrips', key: 'totalTrips' },
    { title: 'Certs', dataIndex: 'certifications', key: 'certifications', render: (c: string[]) => <Tag>{c.length}</Tag> },
  ];

  const notificationColumns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: string) => {
      const color = p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'green';
      return <Tag color={color}>{p}</Tag>;
    } },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s === 'read' ? 'default' : 'processing'} text={s} /> },
    { title: 'Action', key: 'action', render: (_: any, r: Notification) => (
      r.status === 'unread' && <Button size="small" onClick={() => handleMarkNotificationRead(r.id)}>Mark Read</Button>
    ) },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '🗺️ GPS Map & Smart Dispatch',
          children: (
            <Row gutter={16}>
              <Col span={24}>
                <Card title="Smart Dispatch System" extra={<Button type="primary" onClick={handleSmartDispatch}>🚨 Auto-Dispatch Emergency</Button>}>
                  <p>📍 Pickup: 40.7128°N, 74.0060°W (New York)</p>
                  <p>🚑 Nearest Ambulance: AMB-001 (2.3 km away)</p>
                  <p>⏱️ ETA: 5 minutes</p>
                  <p>⛽ Fuel: 85%</p>
                  <p>👤 Driver: John Smith (Rating: 4.8/5)</p>
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '📊 Advanced Analytics',
          children: (
            <Row gutter={16}>
              <Col span={6}><Statistic title="Total Trips" value={analytics?.overview?.totalTrips || 0} /></Col>
              <Col span={6}><Statistic title="Completed" value={analytics?.overview?.completedTrips || 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="Avg Response" value={analytics?.overview?.avgResponseTime || '0 min'} /></Col>
              <Col span={6}><Statistic title="Avg Distance" value={analytics?.overview?.avgTripDistance || '0 km'} /></Col>
              <Col span={24} style={{ marginTop: 24 }}>
                <Card title="Ambulance Utilization">
                  <Table rowKey="id" columns={[
                    { title: 'Ambulance', dataIndex: 'registration', key: 'registration' },
                    { title: 'Trips', dataIndex: 'trips', key: 'trips' },
                    { title: 'Utilization', dataIndex: 'utilization', key: 'utilization', render: (u: number) => `${u}%` },
                    { title: 'Fuel', dataIndex: 'avgFuel', key: 'avgFuel', render: (f: number) => <Tag color={f > 50 ? 'green' : 'orange'}>{f}%</Tag> },
                  ] as any} dataSource={analytics?.ambulanceStats || []} pagination={false} />
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: '3',
          label: '👥 Driver Management',
          children: (
            <Card title="Driver Profiles & Performance" extra={<Button type="primary" onClick={() => setIsDriverModalOpen(true)}>➕ Add Driver</Button>}>
              <Table rowKey="id" columns={driverColumns as any} dataSource={drivers} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '4',
          label: '🔔 Real-time Notifications',
          children: (
            <Card title={`Notifications (${notifications.filter(n => n.status === 'unread').length} Unread)`}>
              <Table rowKey="id" columns={notificationColumns as any} dataSource={notifications} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '5',
          label: '📈 Performance Trends',
          children: (
            <Row gutter={16}>
              <Col span={24}>
                <Card title="Key Metrics">
                  <Row gutter={16}>
                    <Col span={6}><Statistic title="Trips/Day" value={analytics?.trends?.tripsPerDay || 0} /></Col>
                    <Col span={6}><Statistic title="Avg Cost/Trip" value={`$${analytics?.trends?.avgCostPerTrip || 0}`} /></Col>
                    <Col span={6}><Statistic title="Fuel Efficiency" value={`${analytics?.trends?.fuelEfficiency || 0} km/L`} /></Col>
                    <Col span={6}><Statistic title="Total Drivers" value={analytics?.overview?.totalDrivers || 0} /></Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          ),
        },
      ]} />

      <Modal open={isDriverModalOpen} title="Add New Driver" onCancel={() => setIsDriverModalOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" form={driverForm} onFinish={handleAddDriver}>
          <Form.Item name="name" label="Driver Name" rules={[{ required: true, message: 'Please enter driver name' }]}>
            <Input placeholder="John Smith" />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter phone number' }]}>
            <Input placeholder="+1234567890" />
          </Form.Item>
          <Form.Item name="licenseNumber" label="License Number" rules={[{ required: true, message: 'Please enter license number' }]}>
            <Input placeholder="DL-123456" />
          </Form.Item>
          <Form.Item name="licenseExpiry" label="License Expiry Date" rules={[{ required: true, message: 'Please enter expiry date' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="certifications" label="Certifications (comma-separated)" rules={[{ required: false }]}>
            <Input placeholder="EMT, First Aid, Advanced Driving" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Add Driver</Button>
            <Button onClick={() => setIsDriverModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default AmbulanceAdvanced;
