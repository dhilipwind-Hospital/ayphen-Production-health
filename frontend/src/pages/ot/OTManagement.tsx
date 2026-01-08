import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Space, Tag, message, Tabs, Statistic, Checkbox, Calendar, List } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, ClockCircleOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;

interface OTRoom { id: string; name: string; status: 'available' | 'in_use' | 'maintenance' | 'cleaning'; }
interface Surgery {
  id: string; otRoomId: string; patientName: string; doctorName: string; procedure: string;
  priority: 'Emergency' | 'Urgent' | 'Elective'; date: string; startTime: string; durationMinutes: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}
interface Checklist { id: string; surgeryId: string; items: { name: string; completed: boolean }[]; }
interface Equipment { id: string; otRoomId: string; name: string; status: 'available' | 'in_use' | 'maintenance'; }
interface Analytics { completed: number; scheduled: number; inProgress: number; avgDuration: number; total: number; }

interface Doctor { id: string; name: string; }

const OTManagement: React.FC = () => {
  const [rooms, setRooms] = useState<OTRoom[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [queue, setQueue] = useState<Surgery[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const loadAll = async () => {
    try {
      setLoading(true);
      const [roomsRes, surgeriesRes, queueRes, equipRes, analyticsRes, doctorsRes] = await Promise.all([
        api.get('/ot/rooms'),
        api.get('/ot/surgeries'),
        api.get('/ot/queue'),
        api.get('/ot/equipment'),
        api.get('/ot/analytics'),
        api.get('/ot/doctors/list'),
      ]);
      setRooms(roomsRes.data?.data || []);
      setSurgeries(surgeriesRes.data?.data || []);
      setQueue(queueRes.data?.data || []);
      setEquipment(equipRes.data?.data || []);
      setAnalytics(analyticsRes.data?.data || null);
      setDoctors(doctorsRes.data?.data || []);
    } catch (e: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        otRoomId: values.otRoomId,
        patientName: values.patientName,
        doctorName: values.doctorName,
        procedure: values.procedure,
        priority: values.priority,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        durationMinutes: Number(values.durationMinutes),
      };
      if (editingSurgery) {
        await api.put(`/ot/surgeries/${editingSurgery.id}`, payload);
        setSurgeries(surgeries.map(s => s.id === editingSurgery.id ? { ...s, ...payload } : s));
        message.success('Surgery updated');
      } else {
        const res = await api.post('/ot/surgeries', payload);
        setSurgeries([...surgeries, res.data?.data]);
        message.success('Surgery scheduled');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingSurgery(null);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to save surgery');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (surgeryId: string, newStatus: Surgery['status']) => {
    try {
      await api.patch(`/ot/surgeries/${surgeryId}/status`, { status: newStatus });
      setSurgeries(surgeries.map(s => s.id === surgeryId ? { ...s, status: newStatus } : s));
      message.success(`Status updated to ${newStatus}`);
    } catch (e: any) {
      message.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ot/surgeries/${id}`);
      setSurgeries(surgeries.filter(s => s.id !== id));
      message.success('Surgery deleted');
    } catch (e: any) {
      message.error('Failed to delete surgery');
    }
  };

  const handleEditEquipment = async (equipId: string, newStatus: Equipment['status']) => {
    try {
      await api.put(`/ot/equipment/${equipId}`, { status: newStatus });
      setEquipment(equipment.map(e => e.id === equipId ? { ...e, status: newStatus } : e));
      message.success('Equipment status updated');
    } catch (e: any) {
      message.error('Failed to update equipment');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const surgeryColumns = [
    { title: 'OT', dataIndex: 'otRoomId', key: 'otRoomId', render: (v: string) => rooms.find(r => r.id === v)?.name || v },
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Doctor', dataIndex: 'doctorName', key: 'doctorName' },
    { title: 'Procedure', dataIndex: 'procedure', key: 'procedure' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: Surgery['priority']) => {
      const color = p === 'Emergency' ? 'red' : p === 'Urgent' ? 'orange' : 'blue';
      return <Tag color={color}>{p}</Tag>;
    } },
    { title: 'Date/Time', key: 'datetime', render: (_: any, r: Surgery) => `${r.date} ${r.startTime}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: Surgery['status']) => {
      const map: any = { 'Scheduled': 'gold', 'In Progress': 'green', 'Completed': 'blue', 'Cancelled': 'red' };
      return <Tag color={map[s] || 'default'}>{s}</Tag>;
    } },
    { title: 'Actions', key: 'actions', render: (_: any, r: Surgery) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => {
          setEditingSurgery(r);
          form.setFieldsValue({ ...r, date: dayjs(r.date), startTime: dayjs(r.startTime, 'HH:mm') });
          setIsModalOpen(true);
        }} />
        {r.status === 'Scheduled' && <Button size="small" onClick={() => handleStatusUpdate(r.id, 'In Progress')}>Start</Button>}
        {r.status === 'In Progress' && <Button size="small" onClick={() => handleStatusUpdate(r.id, 'Completed')}>Complete</Button>}
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
      </Space>
    ) },
  ];

  const equipmentColumns = [
    { title: 'OT Room', dataIndex: 'otRoomId', key: 'otRoomId', render: (v: string) => rooms.find(r => r.id === v)?.name || v },
    { title: 'Equipment', dataIndex: 'name', key: 'name' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: Equipment['status']) => {
      const color = s === 'available' ? 'green' : s === 'in_use' ? 'blue' : 'red';
      return <Tag color={color}>{s}</Tag>;
    } },
    { title: 'Action', key: 'action', render: (_: any, r: Equipment) => (
      <Select value={r.status} onChange={(v) => handleEditEquipment(r.id, v)} style={{ width: 120 }}>
        <Option value="available">Available</Option>
        <Option value="in_use">In Use</Option>
        <Option value="maintenance">Maintenance</Option>
      </Select>
    ) },
  ];

  const calendarSurgeries = surgeries.filter(s => s.date === selectedDate.format('YYYY-MM-DD'));

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '📊 Dashboard',
          children: (
            <Row gutter={16}>
              <Col span={6}><Statistic title="Total Surgeries" value={analytics?.total || 0} /></Col>
              <Col span={6}><Statistic title="Scheduled" value={analytics?.scheduled || 0} prefix={<ClockCircleOutlined />} /></Col>
              <Col span={6}><Statistic title="In Progress" value={analytics?.inProgress || 0} prefix={<CheckOutlined />} /></Col>
              <Col span={6}><Statistic title="Avg Duration" value={`${analytics?.avgDuration || 0}m`} /></Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '📋 Schedule',
          children: (
            <Card extra={<Button type="primary" onClick={() => { setEditingSurgery(null); form.resetFields(); setIsModalOpen(true); }}>Schedule Surgery</Button>}>
              <Table rowKey="id" columns={surgeryColumns as any} dataSource={surgeries} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '3',
          label: '🚨 Emergency Queue',
          children: (
            <List dataSource={queue} renderItem={(s) => (
              <List.Item>
                <List.Item.Meta title={`${s.patientName} - ${s.procedure}`} description={`Priority: ${s.priority} | Doctor: ${s.doctorName}`} />
                <Button onClick={() => handleStatusUpdate(s.id, 'In Progress')}>Start Surgery</Button>
              </List.Item>
            )} />
          ),
        },
        {
          key: '4',
          label: '📅 Calendar',
          children: (
            <Row gutter={16}>
              <Col span={12}>
                <Calendar value={selectedDate} onChange={setSelectedDate} />
              </Col>
              <Col span={12}>
                <Card title={`Surgeries on ${selectedDate.format('YYYY-MM-DD')}`}>
                  {calendarSurgeries.length > 0 ? (
                    calendarSurgeries.map(s => (
                      <div key={s.id} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                        <div><strong>{s.patientName}</strong> - {s.procedure}</div>
                        <div>{s.startTime} ({s.durationMinutes}m)</div>
                        <Tag color={s.priority === 'Emergency' ? 'red' : 'blue'}>{s.priority}</Tag>
                      </div>
                    ))
                  ) : (
                    <p>No surgeries scheduled</p>
                  )}
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: '5',
          label: '🔧 Equipment',
          children: (
            <Table rowKey="id" columns={equipmentColumns as any} dataSource={equipment} loading={loading} />
          ),
        },
      ]} />

      <Modal open={isModalOpen} title={editingSurgery ? 'Edit Surgery' : 'Schedule Surgery'} onCancel={() => { setIsModalOpen(false); setEditingSurgery(null); }} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleSave} initialValues={{ priority: 'Elective', durationMinutes: 60 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientName" label="Patient Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doctorName" label="Doctor Name" rules={[{ required: true }]}>
                <Select placeholder="Select doctor">
                  {doctors.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="procedure" label="Procedure" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="Emergency">Emergency</Option>
                  <Option value="Urgent">Urgent</Option>
                  <Option value="Elective">Elective</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="durationMinutes" label="Duration (min)" rules={[{ required: true }]}>
                <Input type="number" min={15} step={15} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="otRoomId" label="OT Room" rules={[{ required: true }]}>
                <Select>
                  {rooms.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit">Save</Button>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default OTManagement;
