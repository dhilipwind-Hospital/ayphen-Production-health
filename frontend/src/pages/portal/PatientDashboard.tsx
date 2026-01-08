import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Typography, List, Tag, Statistic, Alert, Spin, Descriptions, Button, Empty, Table, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
// Removed OrganizationSelectionCard import - using simple banner only

const { Title, Text } = Typography;

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  reason?: string;
  service?: { id: string; name: string; };
  doctor?: { id: string; firstName?: string; lastName?: string };
};

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const navigate = useNavigate();
  const [msg, msgCtx] = message.useMessage();
  // Check if user needs to select organization
  const userOrganization = (user as any)?.organization;

  // Check if user is on default organization by subdomain (more reliable than ID)
  const isOnDefaultOrg = userOrganization?.subdomain === 'default';
  const userIsPatient = user?.role === 'patient';
  const needsHospitalSelection = isOnDefaultOrg && userIsPatient;

  // Legacy check for other default orgs (backward compatibility)
  const needsOrganizationSelection = !userOrganization ||
                                   !userOrganization.id ||
                                   userOrganization.id === 'default' ||
                                   userOrganization.id === 'default-org-00000000-0000-0000-0000-000000000001' ||
                                   userOrganization.subdomain === 'default';

  // Debug logging
  console.log('🔍 PatientDashboard Debug:');
  console.log('👤 User:', user?.firstName, user?.lastName, `(${user?.role})`);
  console.log('🏥 User organization:', userOrganization);
  console.log('❓ Needs organization selection:', needsOrganizationSelection);

  // Removed handleOrganizationSelect - using dedicated page instead

  const go = (path: string) => {
    if (needsOrganizationSelection) {
      msg.warning('Please choose a hospital first');
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch recent appointments for the patient
        const res = await api.get('/appointments', { params: { limit: 25 }, suppressErrorToast: true } as any);
        setAppts(res.data?.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load your appointments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const future = appts.filter(a => dayjs(a.startTime).valueOf() >= now);
    future.sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
    return future[0];
  }, [appts]);

  const recent = useMemo(() => appts.slice(0, 5), [appts]);
  const displayPid = useMemo(() => {
    const raw = String((user as any)?.id || '');
    const tail = raw.replace(/-/g, '').slice(-6).toUpperCase();
    const sub = String((user as any)?.organization?.subdomain || '').toUpperCase();
    return sub ? `PID-${sub}-${tail}` : `PID-${tail}`;
  }, [user]);

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <div style={{ padding: '24px' }}>
      {msgCtx}
      
      {/* Organization Selection - Simple Banner Only */}

      <Title level={2}>Patient Portal</Title>

      {/* Hospital Selection for Default Organization Users */}
      {needsHospitalSelection && (
        <Alert
          type="warning"
          showIcon
          banner
          message="Choose Your Hospital *Required"
          description="You're currently connected to Ayphen Care (default). Please select your actual hospital to access doctors and services."
          action={<Button type="primary" size="small" onClick={() => navigate('/onboarding/choose-hospital')}>Choose Hospital</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {needsOrganizationSelection && (
        <Alert
          type="warning"
          showIcon
          banner
          message="You're not connected to a hospital yet"
          description="Connect your account to your hospital to access appointments and records."
          action={<Button type="primary" size="small" onClick={() => navigate('/onboarding/choose-hospital')}>Choose Hospital</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Upcoming Appointment" extra={<Link to="/appointments">View all</Link>}>
            {upcoming ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Date & Time">{dayjs(upcoming.startTime).format('MMM DD, YYYY h:mm A')}</Descriptions.Item>
                <Descriptions.Item label="Doctor">{upcoming.doctor ? `Dr. ${upcoming.doctor.firstName || ''} ${upcoming.doctor.lastName || ''}`.trim() : '—'}</Descriptions.Item>
                <Descriptions.Item label="Service">{upcoming.service?.name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color={String(upcoming.status).toLowerCase() === 'confirmed' ? 'green' : 'orange'}>{String(upcoming.status).toUpperCase()}</Tag></Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="No upcoming appointments">
                <Button type="primary" onClick={() => go('/appointments/new')}>Book Appointment</Button>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Your Profile" extra={<Link to="/profile">Edit</Link>}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Patient ID">{displayPid}</Descriptions.Item>
              <Descriptions.Item label="Name">{user?.firstName} {user?.lastName}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{(user as any)?.phone || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Appointments" extra={<Link to="/appointments">View all</Link>}>
            {appts.length ? (
              <Table
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                dataSource={recent}
                columns={[
                  { title: 'Date', dataIndex: 'startTime', render: (v: string) => dayjs(v).format('MMM DD, YYYY h:mm A') },
                  { title: 'Doctor', dataIndex: ['doctor','firstName'], render: (_: any, r: Appointment) => r.doctor ? `Dr. ${r.doctor.firstName || ''} ${r.doctor.lastName || ''}`.trim() : '—' },
                  { title: 'Service', dataIndex: ['service','name'], render: (v: any) => v || '—' },
                  { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={String(s).toLowerCase() === 'confirmed' ? 'green' : String(s).toLowerCase() === 'cancelled' ? 'red' : 'orange'}>{String(s).toUpperCase()}</Tag> },
                ]}
              />
            ) : (
              <Empty description="No appointments yet">
                <Button type="primary" onClick={() => go('/appointments/new')}>Book your first appointment</Button>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Medical Records" extra={<Link to="/portal/records">View all</Link>}>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>Access your lab results, prescriptions, and visit summaries.</Typography.Paragraph>
                <Button onClick={() => go('/portal/records')}>Open Records</Button>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Bills" extra={<Link to="/portal/bills">View all</Link>}>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>Check outstanding balances and payment history.</Typography.Paragraph>
                <Button onClick={() => go('/portal/bills')}>Open Bills</Button>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Insurance" extra={<Link to="/portal/insurance">Open</Link>}>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  Compare plans, calculate premiums, and view benefits.
                </Typography.Paragraph>
                <Button type="primary" onClick={() => go('/portal/insurance')}>Open My Insurance</Button>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default PatientDashboard;
