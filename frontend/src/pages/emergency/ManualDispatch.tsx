import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Row, Col, Space, Tag, message, Tabs, Statistic, Switch, List, Timeline } from 'antd';
import { SendOutlined, CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

interface Ambulance {
  id: string;
  registrationNumber: string;
  driverName: string;
  status: string;
  fuelLevel: number;
  location: { latitude: number; longitude: number };
}

interface DispatchRecord {
  id: string;
  ambulanceId: string;
  dispatchType: 'auto' | 'manual';
  dispatchedBy?: string;
  dispatchedAt: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  responseTime?: number;
  notes?: string;
}

interface DispatchRules {
  autoDispatchEnabled: boolean;
  prioritizeNearestAmbulance: boolean;
  considerFuelLevel: boolean;
  considerDriverRating: boolean;
  maxResponseTime: number;
  fallbackToManual: boolean;
}

const ManualDispatch: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchRecord[]>([]);
  const [dispatchRules, setDispatchRules] = useState<DispatchRules | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [rulesForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ambRes, historyRes, rulesRes] = await Promise.all([
        api.get('/ambulance'),
        api.get('/ambulance/dispatch/history'),
        api.get('/ambulance/dispatch/rules'),
      ]);
      setAmbulances(ambRes.data?.data || []);
      setDispatchHistory(historyRes.data?.data || []);
      setDispatchRules(rulesRes.data?.data || null);
    } catch (e: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualDispatch = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post('/ambulance/dispatch/manual', {
        ambulanceId: values.ambulanceId,
        dispatchedBy: 'Admin',
        notes: values.notes,
      });
      setDispatchHistory([...dispatchHistory, res.data?.data]);
      setIsDispatchModalOpen(false);
      form.resetFields();
      message.success('Ambulance dispatched manually');
    } catch (e: any) {
      message.error('Failed to dispatch');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDispatch = async (dispatchId: string) => {
    try {
      setLoading(true);
      const res = await api.patch(`/ambulance/dispatch/${dispatchId}/accept`);
      setDispatchHistory(dispatchHistory.map(d => d.id === dispatchId ? res.data?.data : d));
      message.success('Dispatch accepted');
    } catch (e: any) {
      message.error('Failed to accept');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDispatch = async (dispatchId: string) => {
    try {
      setLoading(true);
      const res = await api.patch(`/ambulance/dispatch/${dispatchId}/complete`, { responseTime: 8 });
      setDispatchHistory(dispatchHistory.map(d => d.id === dispatchId ? res.data?.data : d));
      message.success('Dispatch completed');
    } catch (e: any) {
      message.error('Failed to complete');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRules = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.put('/ambulance/dispatch/rules', values);
      setDispatchRules(res.data?.data);
      setIsRulesModalOpen(false);
      message.success('Dispatch rules updated');
    } catch (e: any) {
      message.error('Failed to update rules');
    } finally {
      setLoading(false);
    }
  };

  const dispatchColumns = [
    { title: 'Ambulance', key: 'ambulanceId', render: (_: any, r: DispatchRecord) => {
      const amb = ambulances.find(a => a.id === r.ambulanceId);
      return amb?.registrationNumber || r.ambulanceId;
    } },
    { title: 'Type', dataIndex: 'dispatchType', key: 'dispatchType', render: (t: string) => <Tag color={t === 'auto' ? 'blue' : 'green'}>{t}</Tag> },
    { title: 'Dispatched By', dataIndex: 'dispatchedBy', key: 'dispatchedBy' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = s === 'completed' ? 'green' : s === 'accepted' ? 'blue' : 'orange';
      return <Tag color={color}>{s}</Tag>;
    } },
    { title: 'Response Time', dataIndex: 'responseTime', key: 'responseTime', render: (t: number) => t ? `${t} min` : '-' },
    { title: 'Actions', key: 'actions', render: (_: any, r: DispatchRecord) => (
      <Space size="small">
        {r.status === 'pending' && <Button size="small" onClick={() => handleAcceptDispatch(r.id)}>Accept</Button>}
        {r.status === 'accepted' && <Button size="small" onClick={() => handleCompleteDispatch(r.id)}>Complete</Button>}
      </Space>
    ) },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '👤 Manual Dispatch',
          children: (
            <Card title="Manual Ambulance Selection & Dispatch" extra={<Button type="primary" onClick={() => setIsDispatchModalOpen(true)}>📍 Dispatch Ambulance</Button>}>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}><Statistic title="Available" value={ambulances.filter(a => a.status === 'Available').length} /></Col>
                <Col span={6}><Statistic title="On Duty" value={ambulances.filter(a => a.status === 'On Duty').length} /></Col>
                <Col span={6}><Statistic title="Total Dispatches" value={dispatchHistory.length} /></Col>
                <Col span={6}><Statistic title="Completed" value={dispatchHistory.filter(d => d.status === 'completed').length} /></Col>
              </Row>
              <Card title="Available Ambulances for Dispatch">
                <Table rowKey="id" columns={[
                  { title: 'Registration', dataIndex: 'registrationNumber', key: 'registrationNumber' },
                  { title: 'Driver', dataIndex: 'driverName', key: 'driverName' },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Available' ? 'green' : 'orange'}>{s}</Tag> },
                  { title: 'Fuel', dataIndex: 'fuelLevel', key: 'fuelLevel', render: (f: number) => <Tag color={f > 50 ? 'green' : 'orange'}>{f}%</Tag> },
                  { title: 'Action', key: 'action', render: (_: any, r: Ambulance) => (
                    <Button size="small" onClick={() => {
                      form.setFieldsValue({ ambulanceId: r.id });
                      setIsDispatchModalOpen(true);
                    }}>Select</Button>
                  ) },
                ] as any} dataSource={ambulances.filter(a => a.status === 'Available')} pagination={false} />
              </Card>
            </Card>
          ),
        },
        {
          key: '2',
          label: '📋 Dispatch History',
          children: (
            <Card title="All Dispatch Records">
              <Table rowKey="id" columns={dispatchColumns as any} dataSource={dispatchHistory} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '3',
          label: '⚙️ Dispatch Rules',
          children: (
            <Card title="Dispatch Configuration & Rules" extra={<Button type="primary" onClick={() => {
              if (dispatchRules) rulesForm.setFieldsValue(dispatchRules);
              setIsRulesModalOpen(true);
            }}>Edit Rules</Button>}>
              {dispatchRules && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Card>
                      <p><strong>Auto Dispatch:</strong> {dispatchRules.autoDispatchEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
                      <p><strong>Prioritize Nearest:</strong> {dispatchRules.prioritizeNearestAmbulance ? '✅ Yes' : '❌ No'}</p>
                      <p><strong>Consider Fuel:</strong> {dispatchRules.considerFuelLevel ? '✅ Yes' : '❌ No'}</p>
                      <p><strong>Consider Rating:</strong> {dispatchRules.considerDriverRating ? '✅ Yes' : '❌ No'}</p>
                      <p><strong>Max Response Time:</strong> {dispatchRules.maxResponseTime} minutes</p>
                      <p><strong>Fallback to Manual:</strong> {dispatchRules.fallbackToManual ? '✅ Yes' : '❌ No'}</p>
                    </Card>
                  </Col>
                </Row>
              )}
            </Card>
          ),
        },
        {
          key: '4',
          label: '🔄 Fallback Logic',
          children: (
            <Card title="Auto-dispatch Fallback Settings">
              <List
                dataSource={[
                  { title: 'If no ambulance available', desc: 'System waits for next available ambulance' },
                  { title: 'If response time exceeds limit', desc: 'System alerts dispatcher for manual intervention' },
                  { title: 'If auto-dispatch fails', desc: 'Falls back to manual dispatch mode' },
                  { title: 'If driver rejects', desc: 'System re-allocates to next best ambulance' },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta title={item.title} description={item.desc} />
                  </List.Item>
                )}
              />
            </Card>
          ),
        },
      ]} />

      <Modal open={isDispatchModalOpen} title="Manual Ambulance Dispatch" onCancel={() => setIsDispatchModalOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleManualDispatch}>
          <Form.Item name="ambulanceId" label="Select Ambulance" rules={[{ required: true }]}>
            <Select placeholder="Choose ambulance">
              {ambulances.filter(a => a.status === 'Available').map(a => (
                <Option key={a.id} value={a.id}>{a.registrationNumber} - {a.driverName} (Fuel: {a.fuelLevel}%)</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Dispatch Notes (Optional)">
            <Input.TextArea placeholder="Add any special instructions or notes" rows={3} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>📍 Dispatch Now</Button>
            <Button onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={isRulesModalOpen} title="Configure Dispatch Rules" onCancel={() => setIsRulesModalOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" form={rulesForm} onFinish={handleUpdateRules}>
          <Form.Item name="autoDispatchEnabled" label="Enable Auto-dispatch" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="prioritizeNearestAmbulance" label="Prioritize Nearest Ambulance" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="considerFuelLevel" label="Consider Fuel Level" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="considerDriverRating" label="Consider Driver Rating" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="maxResponseTime" label="Max Response Time (minutes)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="fallbackToManual" label="Fallback to Manual if Auto Fails" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Save Rules</Button>
            <Button onClick={() => setIsRulesModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ManualDispatch;
