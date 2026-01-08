import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Table, Button, Space, Modal, Select, message, Input, DatePicker, Tag, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

interface PatientRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  lastVisit?: string;
  visitCount?: number;
  nextVisit?: string | null;
}

// Curated fallback departments for resilience
const fallbackDepartments: { id: string; name: string }[] = [
  { id: 'fb-gen', name: 'General Medicine' },
  { id: 'fb-cardiology', name: 'Cardiology' },
  { id: 'fb-orthopedics', name: 'Orthopedics' },
  { id: 'fb-pediatrics', name: 'Pediatrics' },
  { id: 'fb-dermatology', name: 'Dermatology' },
  { id: 'fb-ophthalmology', name: 'Ophthalmology' },
  { id: 'fb-neurology', name: 'Neurology' },
  { id: 'fb-ent', name: 'ENT' },
  { id: 'fb-gastroenterology', name: 'Gastroenterology' },
  { id: 'fb-gynecology', name: 'Gynecology' },
  { id: 'fb-urology', name: 'Urology' },
  { id: 'fb-oncology', name: 'Oncology' },
  { id: 'fb-radiology', name: 'Radiology' },
  { id: 'fb-psychiatry', name: 'Psychiatry' },
  { id: 'fb-pulmonology', name: 'Pulmonology' },
  { id: 'fb-nephrology', name: 'Nephrology' },
];

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const myDeptId = useMemo(() => (user as any)?.department?.id || (user as any)?.departmentId, [user]);
  const [data, setData] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [referModal, setReferModal] = useState<{ open: boolean; patient?: PatientRow; departmentId?: string }>({ open: false });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [followModal, setFollowModal] = useState<{ open: boolean; patient?: PatientRow; serviceId?: string; start?: string; submitting?: boolean }>({ open: false });
  const [services, setServices] = useState<Array<{ id: string; name: string; averageDuration?: number; department?: { id: string; name: string }; departmentId?: string }>>([]);
  const filteredServices = useMemo(
    () => (myDeptId ? services.filter(s => (s.department?.id || s.departmentId) === myDeptId) : []),
    [services, myDeptId]
  );
  const [search, setSearch] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [exporting, setExporting] = useState<boolean>(false);
  const [referrals, setReferrals] = useState<Record<string, { id: string; name: string }[]>>({});

  const [msgApi, contextHolder] = message.useMessage();

  const load = async (opts?: { page?: number; pageSize?: number; search?: string; startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      const params: any = {
        page: opts?.page ?? page,
        limit: opts?.pageSize ?? pageSize,
        search: ((opts?.search ?? search) || undefined),
        startDate: opts?.startDate ?? dateRange[0],
        endDate: opts?.endDate ?? dateRange[1],
      };
      const res = await api.get('/users/doctor/my-patients', { params });
      const raw = res.data?.data || res.data || [];
      const rows: PatientRow[] = (raw as any[]).map((r: any) => ({
        id: r.id,
        firstName: r.firstName ?? r.firstname ?? '',
        lastName: r.lastName ?? r.lastname ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
        lastVisit: r.lastVisit ?? r.lastvisit ?? undefined,
        visitCount: Number(r.visitCount ?? r.visitcount ?? 0),
        nextVisit: r.nextVisit ?? r.nextvisit ?? null,
      }));
      const meta = res.data?.meta || {};
      setData(rows);
      if (meta?.total !== undefined) setTotal(meta.total);
    } catch (e: any) {
      msgApi.error(e?.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load({ page: 1 }); }, []);

  // Load referrals for current page rows
  useEffect(() => {
    const fetchRefs = async () => {
      const toFetch = data.map(d => d.id).filter(id => !referrals[id]);
      if (!toFetch.length) return;
      try {
        const entries: Array<[string, { id: string; name: string }[]]> = [];
        await Promise.all(toFetch.map(async (pid) => {
          try {
            const r = await api.get(`/patients/${pid}/referrals/doctor`, { suppressErrorToast: true } as any);
            const items = (r.data || []) as Array<{ department?: { id: string; name: string }; departmentId?: string }>;
            const mapped = items.map(x => ({ id: x.department?.id || x.departmentId || '', name: x.department?.name || '—' }))
              .filter(x => x.id);
            entries.push([pid, mapped]);
          } catch { /* ignore per patient */ }
        }));
        if (entries.length) setReferrals(prev => ({ ...prev, ...Object.fromEntries(entries) }));
      } catch { /* noop */ }
    };
    if (data.length) fetchRefs();
  }, [data]);

  const columns: ColumnsType<PatientRow> = [
    { title: 'Name', key: 'name', render: (_: any, r) => `${r.firstName} ${r.lastName}`.trim() || '—' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Last Visit', dataIndex: 'lastVisit', render: (v?: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—' },
    { title: 'Visits', dataIndex: 'visitCount', width: 90 },
    { title: 'Next Appt', dataIndex: 'nextVisit', render: (v?: string | null) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—' },
    { title: 'Referrals', key: 'referrals', render: (_: any, r) => (
      <Space size={4} wrap>
        {(referrals[r.id] || []).map(dep => <Tag key={dep.id}>{dep.name}</Tag>)}
        {!referrals[r.id] && <span style={{ color: '#999' }}>—</span>}
      </Space>
    )},
    {
      title: 'Actions', key: 'actions', render: (_: any, r) => (
        <Space>
          <Link to={`/doctor/patients/${r.id}/records`}><Button size="small">Records</Button></Link>
          <Button size="small" onClick={async () => {
            try {
              if (!services.length) {
                const params: any = { page: 1, limit: 100, isActive: true };
                if (myDeptId) params.departmentId = myDeptId;
                const s = await api.get('/services', { params, suppressErrorToast: true } as any);
                setServices(s.data?.data || s.data || []);
              }
            } catch { /* ignore */ }
            setFollowModal({ open: true, patient: r });
          }}>Book Follow-up</Button>
          <Button size="small" onClick={async () => {
            try {
              if (!departments.length) {
                const d = await api.get('/departments', { params: { isActive: true }, suppressErrorToast: true } as any);
                const apiDeps = d.data?.data || d.data || [];
                setDepartments(apiDeps.length ? apiDeps : fallbackDepartments);
              }
            } catch { /* ignore */ }
            setReferModal({ open: true, patient: r });
          }}>Refer</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Title level={2} style={{ margin: 0 }}>My Patients</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input.Search
            placeholder="Search name/email/phone"
            allowClear
            onSearch={(val) => { setSearch(val); setPage(1); load({ page: 1, search: val }); }}
            style={{ width: 260 }}
          />
          <DatePicker.RangePicker
            onChange={(vals) => {
              const start = vals?.[0]?.toDate?.()?.toISOString?.();
              const end = vals?.[1]?.toDate?.()?.toISOString?.();
              setDateRange([start, end]);
              setPage(1);
              load({ page: 1, startDate: start, endDate: end });
            }}
          />
          <Button onClick={() => load({ page: 1 })}>Refresh</Button>
          <Button
            loading={exporting}
            onClick={async () => {
              try {
                setExporting(true);
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (dateRange[0]) params.set('startDate', dateRange[0] as string);
                if (dateRange[1]) params.set('endDate', dateRange[1] as string);
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/users/doctor/my-patients.csv?${params.toString()}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'my-patients.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e: any) {
                msgApi.error(e?.message || 'Failed to export CSV');
              } finally {
                setExporting(false);
              }
            }}
            type="default"
          >
            Export CSV
          </Button>
        </div>
      </div>
      {contextHolder}
      <Card>
        <Table
          loading={loading}
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={{ current: page, pageSize, total, showSizeChanger: false }}
          onChange={(p) => { setPage(p.current || 1); load({ page: p.current || 1 }); }}
        />
      </Card>

      <Modal
        title="Refer Patient"
        open={referModal.open}
        onCancel={() => setReferModal({ open: false })}
        onOk={async () => {
          if (!referModal.patient?.id || !referModal.departmentId) {
            msgApi.warning('Please choose a department');
            return;
          }
          try {
            await api.post(`/patients/${referModal.patient.id}/referrals/doctor`, { departmentId: referModal.departmentId } as any);
            msgApi.success('Referral created');
            setReferModal({ open: false });
            // Refresh referrals for this patient so tags reflect immediately
            try {
              const r = await api.get(`/patients/${referModal.patient.id}/referrals/doctor`, { suppressErrorToast: true } as any);
              const items = (r.data || []) as Array<{ department?: { id: string; name: string }; departmentId?: string }>;
              const mapped = items.map(x => ({ id: x.department?.id || x.departmentId || '', name: x.department?.name || '—' }))
                .filter(x => x.id);
              setReferrals(prev => ({ ...prev, [referModal.patient!.id]: mapped }));
            } catch { /* ignore */ }
          } catch (e: any) {
            msgApi.error(e?.response?.data?.message || 'Failed to create referral');
          }
        }}
        okText="Create Referral"
      >
        <div style={{ marginBottom: 8 }}>Select Department</div>
        {departments.some(d => d.id?.startsWith('fb-')) && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
            message="Showing demo departments due to API issue"
            description="Please use real departments when available. Demo items are disabled."
          />
        )}
        <Select
          style={{ width: '100%' }}
          placeholder="Choose department"
          value={referModal.departmentId}
          onChange={(v) => setReferModal(prev => ({ ...prev, departmentId: v }))}
          options={departments.map(d => ({ value: d.id, label: d.name, disabled: String(d.id).startsWith('fb-') }))}
          showSearch
          optionFilterProp="label"
        />
      </Modal>

      <Modal
        title="Book Follow-up"
        open={followModal.open}
        onCancel={() => setFollowModal({ open: false })}
        okButtonProps={{ loading: followModal.submitting, disabled: !myDeptId || !followModal.serviceId || !followModal.start }}
        onOk={async () => {
          const pid = followModal.patient?.id;
          if (!myDeptId) {
            msgApi.warning('Your profile has no department assigned. Please contact admin.');
            return;
          }
          if (!pid || !followModal.serviceId || !followModal.start) {
            msgApi.warning('Please select service and time');
            return;
          }
          try {
            setFollowModal(prev => ({ ...prev, submitting: true }));
            await api.post('/appointments/doctor', {
              patientId: pid,
              serviceId: followModal.serviceId,
              startTime: followModal.start,
            } as any);
            msgApi.success('Follow-up appointment created');
            setFollowModal({ open: false });
          } catch (e: any) {
            msgApi.error(e?.response?.data?.message || 'Failed to create appointment');
          } finally {
            setFollowModal(prev => ({ ...prev, submitting: false }));
          }
        }}
        okText="Create Appointment"
      >
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          {!myDeptId && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 8 }}
              message="Follow-ups must be booked within your department"
              description="Your user profile does not have a department assigned. Please contact an admin to set your department."
            />
          )}
          <div>
            <div style={{ marginBottom: 8 }}>Service (your department only)</div>
            {myDeptId && filteredServices.length === 0 && (
              <Alert type="info" showIcon style={{ marginBottom: 8 }} message="No follow-up services available in your department" />
            )}
            <Select
              style={{ width: '100%' }}
              placeholder="Choose service"
              value={followModal.serviceId}
              onChange={(v) => setFollowModal(prev => ({ ...prev, serviceId: v }))}
              disabled={!myDeptId}
              options={(myDeptId ? filteredServices : [])
                .map(s => ({ value: s.id, label: s.name }))}
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>Start Time</div>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(d) => d && d < dayjs().startOf('day')}
              onChange={(v) => setFollowModal(prev => ({ ...prev, start: v?.toDate?.()?.toISOString?.() }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyPatients;
