import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Typography, Space, Button, message, Modal, Input, Select, DatePicker, Tooltip } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

interface AppointmentRow {
  id: string;
  service?: { id: string; name: string };
  doctor?: { id: string; firstName: string; lastName: string };
  patient?: { id: string; firstName: string; lastName: string };
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  createdAt?: string;
}

const MyAppointments: React.FC = () => {
  const [data, setData] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const [notesModal, setNotesModal] = useState<{ open: boolean; row?: AppointmentRow; notes: string }>({ open: false, notes: '' });
  const [referModal, setReferModal] = useState<{ open: boolean; row?: AppointmentRow; departmentId?: string }>({ open: false });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [msgApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const highlightId = useMemo(() => new URLSearchParams(location.search).get('highlight') || '', [location.search]);
  const lastSeenKey = role === 'doctor' ? 'hms_doctor_appt_last_seen' : 'hms_patient_appt_last_seen';
  const [lastSeenAt] = useState<number>(() => Number(localStorage.getItem(lastSeenKey) || '0'));
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; row?: AppointmentRow; start?: Dayjs }>(
    { open: false }
  );
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; row?: AppointmentRow }>({ open: false });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; row?: AppointmentRow; reason: string }>({ open: false, reason: '' });
  const [history, setHistory] = useState<{ loading: boolean; items: Array<{ id: string; action: string; details?: string; createdAt: string }> }>({ loading: false, items: [] });

  const load = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'doctor' ? '/appointments/doctor/me' : '/appointments';
      const res = await api.get(endpoint, { params: { page: 1, limit: 20 } });
      const rows = res.data?.data || res.data || [];
      setData(rows);
    } catch (e: any) {
      msgApi.error(e?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [role]);

  // Persist "last seen" when leaving the page
  useEffect(() => {
    return () => {
      try { localStorage.setItem(lastSeenKey, String(Date.now())); } catch {}
    };
  }, [lastSeenKey]);

  // Load appointment history when details modal opens
  useEffect(() => {
    const fetchHistory = async (id: string) => {
      setHistory(prev => ({ ...prev, loading: true }));
      try {
        const res = await api.get(`/appointments/${id}/history` as any);
        const items = (res.data?.data || res.data || []) as any[];
        setHistory({ loading: false, items: items.map(i => ({ id: i.id, action: i.action, details: i.details, createdAt: i.createdAt })) });
      } catch {
        setHistory({ loading: false, items: [] });
      }
    };
    if (detailsModal.open && detailsModal.row?.id) {
      fetchHistory(detailsModal.row.id);
    }
  }, [detailsModal.open, detailsModal.row?.id]);

  const columns: ColumnsType<AppointmentRow> = [
    {
      title: 'Service',
      dataIndex: ['service', 'name'],
      key: 'service',
      render: (_: any, record) => {
        const name = record.service?.name || '—';
        const isHighlighted = record.id === highlightId;
        const isNew = record.createdAt ? dayjs(record.createdAt).valueOf() > lastSeenAt : false;
        return (
          <Space size={6}>
            <span>{name}</span>
            {isHighlighted && <Tag color="orange">Recent</Tag>}
            {isNew && <Tag color="green">New</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_: any, record) => record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : '—'
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, record) => record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : '—'
    },
    {
      title: 'Start',
      dataIndex: 'startTime',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: 'End',
      dataIndex: 'endTime',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => {
        const up = String(s || '').toUpperCase();
        const color = up === 'CONFIRMED' ? 'green' : up === 'PENDING' ? 'gold' : up === 'CANCELLED' ? 'red' : 'default';
        return <Tag color={color}>{up}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, row) => (
        <Space>
          <Button size="small" onClick={() => setDetailsModal({ open: true, row })}>Details</Button>
          {role === 'doctor' && (
            <>
              <Button size="small" onClick={() => setNotesModal({ open: true, row, notes: row.notes || '' })}>Notes</Button>
              {row.patient?.id && (
                <Link to={`/doctor/patients/${row.patient.id}/records`}>
                  <Button size="small">Records</Button>
                </Link>
              )}
              {row.patient?.id && (
                <Link to={`/doctor/consultations/${row.id}`}>
                  <Button size="small">Consultation</Button>
                </Link>
              )}
              {row.patient?.id && (
                <Link to={`/doctor/patients/${row.patient.id}/prescriptions/new?patientName=${encodeURIComponent(row.patient.firstName + ' ' + row.patient.lastName)}`}>
                  <Button size="small">Prescription</Button>
                </Link>
              )}
              {row.patient?.id && (
                <Button size="small" onClick={async () => {
                  try {
                    // lazy load departments once
                    if (!departments.length) {
                      const d = await api.get('/departments', { params: { status: 'active' }, suppressErrorToast: true } as any);
                      setDepartments(d.data?.data || d.data || []);
                    }
                  } catch (_) {}
                  setReferModal({ open: true, row });
                }}>Refer</Button>
              )}
            </>
          )}
          {/* Patient actions: reschedule/cancel */}
          {role !== 'doctor' && (
            <>
              <Button size="small" onClick={() => setRescheduleModal({ open: true, row, start: dayjs(row.startTime) })}>Reschedule</Button>
              {(() => {
                const cutoffHours = 24;
                const withinCutoff = dayjs(row.startTime).diff(dayjs(), 'hour') < cutoffHours;
                const cancelBtn = (
                  <Button
                    size="small"
                    danger
                    disabled={withinCutoff}
                    onClick={() => setCancelModal({ open: true, row, reason: '' })}
                  >
                    Cancel
                  </Button>
                );
                return withinCutoff ? (
                  <Tooltip title={`Cannot cancel within ${cutoffHours} hours. Please contact support.`}>
                    {cancelBtn}
                  </Tooltip>
                ) : cancelBtn;
              })()}
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>My Appointments</Title>
        <Link to="/appointments/new"><Button type="primary">Book Appointment</Button></Link>
      </div>
      {contextHolder}
      <style>{`.row-highlight td { background: #fff7e6 !important; }`}</style>
      <Table
        loading={loading}
        rowKey="id"
        columns={columns}
        dataSource={data}
        rowClassName={(row) => (row.id === highlightId ? 'row-highlight' : '')}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        open={notesModal.open}
        title="Edit Notes"
        onCancel={() => setNotesModal({ open: false, notes: '' })}
        onOk={async () => {
          if (!notesModal.row) return setNotesModal({ open: false, notes: '' });
          try {
            await api.patch(`/appointments/doctor/${notesModal.row.id}/notes`, { notes: notesModal.notes } as any);
            msgApi.success('Notes updated');
            setNotesModal({ open: false, notes: '' });
            load();
          } catch (e: any) {
            msgApi.error(e?.response?.data?.message || 'Failed to update notes');
          }
        }}
        okText="Save"
      >
        <Input.TextArea rows={4} value={notesModal.notes} onChange={(e) => setNotesModal(prev => ({ ...prev, notes: e.target.value }))} />
      </Modal>
      {/* Details modal */}
      <Modal
        open={detailsModal.open}
        title="Appointment Details"
        footer={null}
        onCancel={() => setDetailsModal({ open: false })}
      >
        {detailsModal.row && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Service:</strong> {detailsModal.row.service?.name || '—'}</div>
            <div><strong>Doctor:</strong> {detailsModal.row.doctor ? `${detailsModal.row.doctor.firstName} ${detailsModal.row.doctor.lastName}` : '—'}</div>
            {detailsModal.row.patient && (
              <div><strong>Patient:</strong> {`${detailsModal.row.patient.firstName} ${detailsModal.row.patient.lastName}`}</div>
            )}
            <div><strong>Start:</strong> {dayjs(detailsModal.row.startTime).format('YYYY-MM-DD HH:mm')}</div>
            <div><strong>End:</strong> {dayjs(detailsModal.row.endTime).format('YYYY-MM-DD HH:mm')}</div>
            <div><strong>Status:</strong> {String(detailsModal.row.status || '').toUpperCase()}</div>
            {detailsModal.row.notes && <div><strong>Notes:</strong> {detailsModal.row.notes}</div>}
            <div style={{ marginTop: 12 }}><strong>History</strong></div>
            {history.loading ? (
              <div>Loading…</div>
            ) : history.items.length === 0 ? (
              <div>No history yet.</div>
            ) : (
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {history.items.map(h => (
                  <li key={h.id} style={{ marginBottom: 6 }}>
                    <span style={{ color: '#888' }}>{dayjs(h.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    {' — '}<strong>{h.action}</strong>
                    {h.details ? `: ${h.details}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={referModal.open}
        title="Refer Patient"
        onCancel={() => setReferModal({ open: false })}
        onOk={async () => {
          if (!referModal.row?.patient?.id || !referModal.departmentId) {
            msgApi.warning('Please choose a department');
            return;
          }
          try {
            await api.post(`/patients/${referModal.row.patient.id}/referrals/doctor`, { departmentId: referModal.departmentId } as any);
            msgApi.success('Referral created');
            setReferModal({ open: false });
          } catch (e: any) {
            msgApi.error(e?.response?.data?.message || 'Failed to create referral');
          }
        }}
        okText="Create Referral"
      >
        <div style={{ marginBottom: 8 }}>Select Department</div>
        <Select
          style={{ width: '100%' }}
          placeholder="Choose department"
          value={referModal.departmentId}
          onChange={(v) => setReferModal(prev => ({ ...prev, departmentId: v }))}
          options={departments.map(d => ({ value: d.id, label: d.name }))}
          showSearch
          optionFilterProp="label"
        />
      </Modal>
      {/* Reschedule modal */}
      <Modal
        open={rescheduleModal.open}
        title="Reschedule Appointment"
        onCancel={() => setRescheduleModal({ open: false })}
        okText="Reschedule"
        onOk={async () => {
          if (!rescheduleModal.row || !rescheduleModal.start) {
            return setRescheduleModal({ open: false });
          }
          try {
            const row = rescheduleModal.row;
            // Compute end time using original duration as fallback
            let durationMin = 30;
            try {
              const original = dayjs(row.endTime).diff(dayjs(row.startTime), 'minute');
              if (original > 0) durationMin = Math.round(original);
              else if (row.service?.id) {
                const svcRes = await api.get(`/services/${row.service.id}` as any);
                if (svcRes.data?.averageDuration) durationMin = svcRes.data.averageDuration;
              }
            } catch { /* ignore and use fallback */ }
            const startISO = rescheduleModal.start.toISOString();
            const endISO = rescheduleModal.start.add(durationMin, 'minute').toISOString();
            // Use new reschedule endpoint
            await api.post(`/appointments/${row.id}/reschedule`, { 
              startTime: startISO, 
              endTime: endISO,
              reason: 'Patient requested reschedule'
            } as any);
            msgApi.success('Appointment rescheduled successfully');
            setRescheduleModal({ open: false });
            load();
          } catch (e: any) {
            msgApi.error(e?.response?.data?.message || 'Failed to reschedule');
          }
        }}
      >
        <div style={{ marginBottom: 8 }}>New start date & time</div>
        <DatePicker
          showTime
          style={{ width: '100%' }}
          value={rescheduleModal.start}
          onChange={(v) => setRescheduleModal(prev => ({ ...prev, start: v || undefined }))}
          disabledDate={(d) => d && d < dayjs().startOf('day')}
        />
      </Modal>

      {/* Cancel with reason modal */}
      <Modal
        open={cancelModal.open}
        title="Cancel Appointment"
        okText="Cancel Appointment"
        okButtonProps={{ danger: true }}
        onCancel={() => setCancelModal({ open: false, reason: '' })}
        onOk={async () => {
          if (!cancelModal.row) return setCancelModal({ open: false, reason: '' });
          try {
            await api.post(`/appointments/${cancelModal.row.id}/cancel`, { reason: cancelModal.reason } as any);
            msgApi.success('Appointment cancelled');
            setCancelModal({ open: false, reason: '' });
            load();
          } catch (e: any) {
            msgApi.error(e?.response?.data?.message || 'Failed to cancel');
          }
        }}
      >
        <div style={{ marginBottom: 8 }}>Reason (optional)</div>
        <Input.TextArea
          rows={4}
          value={cancelModal.reason}
          onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Provide a brief reason to help our team"
        />
      </Modal>
    </div>
  );
};

export default MyAppointments;
