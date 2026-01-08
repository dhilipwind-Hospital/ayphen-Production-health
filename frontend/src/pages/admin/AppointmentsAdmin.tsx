import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, TimePicker, Card, Typography, Statistic, Row, Col, message, Descriptions } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

type User = { id: string; firstName: string; lastName: string };
type Department = { id: string; name: string };
type Service = { id: string; name: string; department?: { id: string; name: string } };

type AppointmentRow = {
  id: string;
  service?: Service;
  doctor?: User;
  patient?: User;
  startTime: string;
  endTime: string;
  status: string;
};

const AppointmentsAdmin: React.FC = () => {
  const [data, setData] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | undefined>('pending');
  const [dateRange, setDateRange] = useState<any>();
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [doctorId, setDoctorId] = useState<string | undefined>();
  const [patientId, setPatientId] = useState<string | undefined>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [viewing, setViewing] = useState<AppointmentRow | null>(null);
  const [viewData, setViewData] = useState<any>(null);
  const [rescheduleFor, setRescheduleFor] = useState<AppointmentRow | null>(null);
  const [rescheduleRange, setRescheduleRange] = useState<any>();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const loadRefs = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([
        api.get('/departments', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any),
        api.get('/public/doctors', { suppressErrorToast: true } as any),
      ]);
      setDepartments(deptRes.data?.data || deptRes.data || []);
      setDoctors(docRes.data?.data || docRes.data || []);
    } catch {}
  };

  const onConfirmAppt = async (row: AppointmentRow) => {
    try {
      await api.patch(`/appointments/admin/${row.id}/confirm`, {} as any);
      message.success('Appointment confirmed');
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to confirm');
    }
  };

  const onOpenReschedule = (row: AppointmentRow) => {
    setRescheduleFor(row);
    setRescheduleRange(null);
  };

  const onReschedule = async () => {
    if (!rescheduleFor || !rescheduleRange || rescheduleRange.length !== 2) {
      return message.warning('Please pick start and end time');
    }
    try {
      await api.patch(`/appointments/admin/${rescheduleFor.id}/reschedule`, {
        startTime: rescheduleRange[0].toISOString(),
        endTime: rescheduleRange[1].toISOString(),
      } as any);
      message.success('Appointment rescheduled');
      setRescheduleFor(null);
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to reschedule');
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize, search: query || undefined, status, doctorId, patientId };
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      if (departmentId) params.departmentId = departmentId;
      const res = await api.get('/appointments/admin', { params, suppressErrorToast: true } as any);
      const rows: AppointmentRow[] = res.data?.data || res.data || [];
      setData(rows);
      const meta = res.data?.meta;
      setTotal(meta?.total || rows.length || 0);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRefs(); }, []);
  useEffect(() => { load(); }, [query, status, dateRange, departmentId, doctorId, patientId, page]);

  // Poll for new pending appointments every 30s
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await api.get('/appointments/admin', { params: { status: 'pending', page: 1, limit: 1 }, suppressErrorToast: true } as any);
        const total = res.data?.meta?.total ?? (res.data?.data?.length || 0);
        if (mounted && typeof total === 'number') {
          if (pendingCount && total > pendingCount) {
            setPendingNotice(`New pending appointments: +${total - pendingCount}`);
          }
          setPendingCount(total);
        }
      } catch {}
    };
    // initial fetch
    poll();
    const id = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const onView = async (row: AppointmentRow) => {
    try {
      setViewing(row);
      const res = await api.get(`/appointments/admin/${row.id}`, { suppressErrorToast: true } as any);
      setViewData(res.data);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load appointment');
      setViewing(null);
    }
  };

  const onCancelAppt = async (row: AppointmentRow) => {
    Modal.confirm({
      title: 'Cancel appointment?',
      content: 'This will mark the appointment as cancelled.',
      okText: 'Cancel Appointment',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.patch(`/appointments/admin/${row.id}/cancel`, {} as any);
          message.success('Appointment cancelled');
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to cancel');
        }
      }
    });
  };

  const columns: ColumnsType<AppointmentRow> = [
    { title: 'Patient', key: 'patient', render: (_, r) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '—' },
    { title: 'Department', key: 'department', render: (_, r) => r.service?.department?.name || '—' },
    { title: 'Doctor', key: 'doctor', render: (_, r) => r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}` : '—' },
    { title: 'Start', dataIndex: 'startTime', render: (v: string) => new Date(v).toLocaleString() },
    { title: 'End', dataIndex: 'endTime', render: (v: string) => new Date(v).toLocaleString() },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'confirmed' ? 'green' : s === 'pending' ? 'orange' : s === 'cancelled' ? 'red' : 'default'}>{(s || '—').toUpperCase()}</Tag> },
    { title: 'Actions', key: 'actions', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => onView(r)}>View</Button>
        <Button size="small" onClick={() => onConfirmAppt(r)}>Confirm</Button>
        <Button size="small" onClick={() => onOpenReschedule(r)}>Reschedule</Button>
        <Button size="small" danger onClick={() => onCancelAppt(r)}>Cancel</Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>All Appointments</Title>
        <Space>
          <Input.Search placeholder="Search service/doctor/patient" allowClear onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} />
          <Select placeholder="Status" allowClear style={{ minWidth: 140 }} value={status} onChange={setStatus}>
            <Option value="pending">Pending</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <RangePicker showTime onChange={(vals) => setDateRange(vals as any)} />
          <Select placeholder="Department" allowClear style={{ minWidth: 180 }} value={departmentId} onChange={setDepartmentId}>
            {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
          </Select>
          <Select placeholder="Doctor" allowClear style={{ minWidth: 180 }} value={doctorId} onChange={setDoctorId}>
            {doctors.map(d => <Option key={d.id} value={d.id}>{d.firstName} {d.lastName}</Option>)}
          </Select>
        </Space>
      </div>
      {pendingNotice && (
        <Card style={{ marginBottom: 12, background: '#fffbe6', borderColor: '#ffe58f' }} onClick={() => setPendingNotice(null)}>
          <Typography.Text strong>{pendingNotice}</Typography.Text>
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>(click to dismiss)</Typography.Text>
        </Card>
      )}
      <Card style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ current: page, total, pageSize, onChange: setPage }}
        />
      </Card>
      <Modal open={!!viewing} title="Appointment Details" onCancel={() => { setViewing(null); setViewData(null); }} footer={<Button onClick={() => { setViewing(null); setViewData(null); }}>Close</Button>}>
        {viewData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Patient">{viewData.patient ? `${viewData.patient.firstName} ${viewData.patient.lastName}` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Doctor">{viewData.doctor ? `${viewData.doctor.firstName} ${viewData.doctor.lastName}` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Service">{viewData.service?.name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Start">{new Date(viewData.startTime).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="End">{new Date(viewData.endTime).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Status">{String(viewData.status).toUpperCase()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      <Modal
        open={!!rescheduleFor}
        title="Reschedule Appointment"
        onCancel={() => setRescheduleFor(null)}
        onOk={onReschedule}
        okText="Reschedule"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <RangePicker showTime style={{ width: '100%' }} value={rescheduleRange as any} onChange={(vals) => setRescheduleRange(vals as any)} />
        </Space>
      </Modal>
    </div>
  );
};

export default AppointmentsAdmin;
