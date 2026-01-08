import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Row, Col, Space, Tag, message, Tabs, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, PhoneOutlined, TruckOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

interface Ambulance {
  id: string;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'Available' | 'On Duty' | 'Maintenance' | 'Out of Service';
  location: { latitude: number; longitude: number };
  currentTrip?: string;
  fuelLevel: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
}

interface Trip {
  id: string;
  ambulanceId: string;
  patientName: string;
  pickupLocation: string;
  dropoffLocation: string;
  startTime: string;
  endTime?: string;
  distance: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  driverName: string;
}

interface Maintenance {
  id: string;
  ambulanceId: string;
  maintenanceType: 'Routine' | 'Repair' | 'Inspection';
  description: string;
  cost: number;
  completedDate: string;
  nextDueDate: string;
}

interface Stats {
  total: number;
  available: number;
  onDuty: number;
  maintenance: number;
  totalTrips: number;
  completedTrips: number;
  avgFuel: number;
}

const AmbulanceManagement: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ambulance' | 'trip' | 'maintenance'>('ambulance');
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ambRes, tripRes, maintRes, statsRes] = await Promise.all([
        api.get('/ambulance'),
        api.get('/ambulance/trips/list'),
        api.get('/ambulance/maintenance/list'),
        api.get('/ambulance/stats/overview'),
      ]);
      setAmbulances(ambRes.data?.data || []);
      setTrips(tripRes.data?.data || []);
      setMaintenanceRecords(maintRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (e: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAmbulance = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post('/ambulance', values);
      setAmbulances([...ambulances, res.data?.data]);
      setIsModalOpen(false);
      form.resetFields();
      message.success('Ambulance added');
    } catch (e: any) {
      message.error('Failed to add ambulance');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post('/ambulance/trips', values);
      setTrips([...trips, res.data?.data]);
      setIsModalOpen(false);
      form.resetFields();
      message.success('Trip created');
    } catch (e: any) {
      message.error('Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    try {
      setLoading(true);
      const res = await api.patch(`/ambulance/trips/${tripId}/complete`);
      setTrips(trips.map(t => t.id === tripId ? res.data?.data : t));
      message.success('Trip completed');
    } catch (e: any) {
      message.error('Failed to complete trip');
    } finally {
      setLoading(false);
    }
  };

  const ambulanceColumns = [
    { title: 'Registration', dataIndex: 'registrationNumber', key: 'registrationNumber' },
    { title: 'Driver', dataIndex: 'driverName', key: 'driverName' },
    { title: 'Phone', dataIndex: 'driverPhone', key: 'driverPhone', render: (p: string) => <Tag icon={<PhoneOutlined />}>{p}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = s === 'Available' ? 'green' : s === 'On Duty' ? 'blue' : s === 'Maintenance' ? 'orange' : 'red';
      return <Tag color={color}>{s}</Tag>;
    } },
    { title: 'Fuel', dataIndex: 'fuelLevel', key: 'fuelLevel', render: (f: number) => <Tag color={f > 50 ? 'green' : 'orange'}>{f}%</Tag> },
    { title: 'Location', key: 'location', render: (_: any, r: Ambulance) => (
      <Tag icon={<EnvironmentOutlined />}>{r.location.latitude.toFixed(4)}, {r.location.longitude.toFixed(4)}</Tag>
    ) },
  ];

  const tripColumns = [
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Pickup', dataIndex: 'pickupLocation', key: 'pickupLocation' },
    { title: 'Dropoff', dataIndex: 'dropoffLocation', key: 'dropoffLocation' },
    { title: 'Distance', dataIndex: 'distance', key: 'distance', render: (d: number) => `${d} km` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = s === 'Completed' ? 'green' : s === 'In Progress' ? 'blue' : 'orange';
      return <Tag color={color}>{s}</Tag>;
    } },
    { title: 'Actions', key: 'actions', render: (_: any, r: Trip) => (
      r.status === 'Scheduled' && <Button size="small" onClick={() => handleCompleteTrip(r.id)}>Start</Button>
    ) },
  ];

  const maintenanceColumns = [
    { title: 'Ambulance', key: 'ambulanceId', render: (_: any, r: Maintenance) => {
      const amb = ambulances.find(a => a.id === r.ambulanceId);
      return amb?.registrationNumber || r.ambulanceId;
    } },
    { title: 'Type', dataIndex: 'maintenanceType', key: 'maintenanceType' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Cost', dataIndex: 'cost', key: 'cost', render: (c: number) => `$${c}` },
    { title: 'Completed', dataIndex: 'completedDate', key: 'completedDate' },
    { title: 'Next Due', dataIndex: 'nextDueDate', key: 'nextDueDate' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '📊 Dashboard',
          children: (
            <Row gutter={16}>
              <Col span={6}><Statistic title="Total Ambulances" value={stats?.total || 0} /></Col>
              <Col span={6}><Statistic title="Available" value={stats?.available || 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="On Duty" value={stats?.onDuty || 0} valueStyle={{ color: '#1890ff' }} /></Col>
              <Col span={6}><Statistic title="Avg Fuel" value={`${stats?.avgFuel || 0}%`} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Total Trips" value={stats?.totalTrips || 0} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Completed" value={stats?.completedTrips || 0} valueStyle={{ color: '#52c41a' }} /></Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '🚑 Fleet',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setModalType('ambulance'); setIsModalOpen(true); }}>Add Ambulance</Button>}>
              <Table rowKey="id" columns={ambulanceColumns as any} dataSource={ambulances} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '3',
          label: '📍 Trips',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setModalType('trip'); setIsModalOpen(true); }}>Create Trip</Button>}>
              <Table rowKey="id" columns={tripColumns as any} dataSource={trips} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '4',
          label: '🔧 Maintenance',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setModalType('maintenance'); setIsModalOpen(true); }}>Log Maintenance</Button>}>
              <Table rowKey="id" columns={maintenanceColumns as any} dataSource={maintenanceRecords} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
      ]} />

      <Modal open={isModalOpen} title={modalType === 'ambulance' ? 'Add Ambulance' : modalType === 'trip' ? 'Create Trip' : 'Log Maintenance'} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={modalType === 'ambulance' ? handleCreateAmbulance : modalType === 'trip' ? handleCreateTrip : () => {}}>
          {modalType === 'ambulance' && (
            <>
              <Form.Item name="registrationNumber" label="Registration Number" rules={[{ required: true }]}>
                <Input placeholder="AMB-001" />
              </Form.Item>
              <Form.Item name="driverName" label="Driver Name" rules={[{ required: true }]}>
                <Input placeholder="John Smith" />
              </Form.Item>
              <Form.Item name="driverPhone" label="Driver Phone" rules={[{ required: true }]}>
                <Input placeholder="+1234567890" />
              </Form.Item>
            </>
          )}
          {modalType === 'trip' && (
            <>
              <Form.Item name="ambulanceId" label="Ambulance" rules={[{ required: true }]}>
                <Select placeholder="Select ambulance">
                  {ambulances.filter(a => a.status === 'Available').map(a => (
                    <Option key={a.id} value={a.id}>{a.registrationNumber} - {a.driverName}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="patientName" label="Patient Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="pickupLocation" label="Pickup Location" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="dropoffLocation" label="Dropoff Location" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="distance" label="Distance (km)" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </>
          )}
          <Space>
            <Button type="primary" htmlType="submit">Save</Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default AmbulanceManagement;
