import React from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Button, Empty, message } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import styled from 'styled-components';
import { useOrganizationData } from '../hooks/useOrganizationData';

const { Title } = Typography;

const DashboardContainer = styled.div`
  .dashboard-header {
    margin-bottom: 24px;
  }
  
  .stat-card {
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .ant-statistic-title {
      font-size: 16px;
      color: #666;
    }
    
    .ant-statistic-content {
      font-size: 24px;
      font-weight: 600;
    }
  }
`;

const SpaceWrap = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

type Appt = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  reason?: string;
  patient?: { id: string; firstName?: string; lastName?: string };
  service?: { id: string; name: string };
  doctor?: { id: string; firstName?: string; lastName?: string };
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msg, msgCtx] = message.useMessage();
  const role = String(user?.role || '').toLowerCase();
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const { stats: orgStats, loading: orgLoading } = useOrganizationData();

  const [loading, setLoading] = React.useState(false);
  const [appts, setAppts] = React.useState<Appt[]>([]);
  const [adminStats, setAdminStats] = React.useState({ totalPatients: 0, todayAppointments: 0, pendingAppointments: 0, monthlyRevenue: 0, activeStaff: 0, departments: 0, bedOccupancy: 0, satisfaction: 0 });

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        if (isDoctor) {
          const res = await api.get('/appointments/doctor/me', { params: { limit: 50 }, suppressErrorToast: true } as any);
          if (!mounted) return;
          setAppts((res.data?.data as Appt[]) || []);
        } else {
          // Fetch admin statistics
          try {
            const patientsRes = await api.get('/patients', { params: { limit: 1 }, suppressErrorToast: true } as any);
            const appointmentsRes = await api.get('/admin/appointments', { params: { limit: 100 }, suppressErrorToast: true } as any);
            const staffRes = await api.get('/admin/users', { params: { limit: 1 }, suppressErrorToast: true } as any);
            const departmentsRes = await api.get('/admin/departments', { params: { limit: 1 }, suppressErrorToast: true } as any);
            
            if (!mounted) return;
            
            const today = new Date();
            const allAppts = (appointmentsRes.data?.data as Appt[]) || [];
            const todayAppts = allAppts.filter(a => {
              const isSameDayCheck = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
              return isSameDayCheck(new Date(a.startTime), today);
            }).length;
            const pendingAppts = allAppts.filter(a => String(a.status).toLowerCase() === 'pending').length;
            
            setAdminStats({
              totalPatients: patientsRes.data?.total || 0,
              todayAppointments: todayAppts,
              pendingAppointments: pendingAppts,
              monthlyRevenue: 0,
              activeStaff: staffRes.data?.total || 0,
              departments: departmentsRes.data?.total || 0,
              bedOccupancy: 0,
              satisfaction: 0
            });
          } catch (e) {
            console.error('Failed to fetch admin stats:', e);
            setAdminStats({ totalPatients: 0, todayAppointments: 0, pendingAppointments: 0, monthlyRevenue: 0, activeStaff: 0, departments: 0, bedOccupancy: 0, satisfaction: 0 });
          }
        }
      } catch (_e) {
        if (mounted) msg.warning('Could not load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [isDoctor, msg]);

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const todayAppointments = appts.filter(a => isSameDay(new Date(a.startTime), new Date())).length;
  const pendingAppointments = appts.filter(a => String(a.status).toLowerCase() === 'pending').length;
  const totalPatients = Array.from(new Set(appts.map(a => a.patient?.id).filter(Boolean))).length;
  
  // Use real data for admin, calculated data for doctor
  const dashboardData = isAdmin ? adminStats : {
    totalPatients,
    todayAppointments,
    pendingAppointments,
    monthlyRevenue: null
  };

  // Show Smart Dashboard Hub for new organizations
  if (orgStats.isNewOrganization && isAdmin && !orgLoading) {
    const orgName = (user as any)?.organization?.name || 'your hospital';
    return (
      <DashboardContainer>
        {msgCtx}
        
        {/* Welcome Section */}
        <Card 
          style={{ 
            marginBottom: 24, 
            background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
            borderRadius: 16,
            border: '1px solid #f0f0f0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #e91e63, #f06292, #e91e63)'
          }} />
          
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              background: 'linear-gradient(135deg, #e91e63, #f06292)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)'
            }}>
              <span style={{ fontSize: 32, color: 'white' }}>🏥</span>
            </div>
            <Title level={2} style={{ marginBottom: 16, color: '#262626' }}>
              Welcome to <span style={{ color: '#e91e63' }}>{orgName}</span>
            </Title>
            <Typography.Text style={{ fontSize: 16, color: '#595959' }}>
              Your hospital management system is ready for setup
            </Typography.Text>
          </div>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Setup Progress */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ color: '#e91e63' }}>
                  🚀 Setup Progress
                </span>
              }
              style={{ height: '100%' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Title level={1} style={{ color: '#e91e63', margin: 0 }}>0%</Title>
                <Typography.Text type="secondary">Complete</Typography.Text>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  height: 8, 
                  background: '#f5f5f5', 
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: '0%', 
                    background: 'linear-gradient(90deg, #e91e63, #f06292)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              
              <Typography.Text style={{ color: '#8c8c8c' }}>
                0 of 9 setup steps completed
              </Typography.Text>
              
              <div style={{ marginTop: 16, padding: 16, background: '#fce4ec', borderRadius: 8 }}>
                <Typography.Text style={{ color: '#e91e63', fontWeight: 500 }}>
                  💡 Tip: Use the "Quick Setup" menu in the sidebar to get started!
                </Typography.Text>
              </div>
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <span style={{ color: '#e91e63' }}>
                  ⚡ Quick Actions
                </span>
              }
              style={{ height: '100%' }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/admin/departments')}
                  style={{ 
                    background: '#e91e63', 
                    borderColor: '#e91e63',
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  🏠 Configure Departments
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/admin/staff')}
                  style={{ 
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: '#e91e63',
                    color: '#e91e63'
                  }}
                >
                  👥 Add Staff Members
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/admin/doctors')}
                  style={{ 
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: '#e91e63',
                    color: '#e91e63'
                  }}
                >
                  👨‍⚕️ Register Doctors
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/patients/new')}
                  style={{ 
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: '#e91e63',
                    color: '#e91e63'
                  }}
                >
                  👤 Add First Patient
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Hospital Overview */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card 
              title={
                <span style={{ color: '#e91e63' }}>
                  📊 Hospital Overview
                </span>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Title level={2} style={{ color: '#e91e63', margin: 0 }}>0</Title>
                    <Typography.Text type="secondary">Patients</Typography.Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Title level={2} style={{ color: '#f06292', margin: 0 }}>0</Title>
                    <Typography.Text type="secondary">Doctors</Typography.Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Title level={2} style={{ color: '#ec407a', margin: 0 }}>0</Title>
                    <Typography.Text type="secondary">Appointments</Typography.Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Title level={2} style={{ color: '#ad1457', margin: 0 }}>$0</Title>
                    <Typography.Text type="secondary">Revenue</Typography.Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Next Steps */}
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <span style={{ color: '#e91e63' }}>
                  🎯 Next Steps
                </span>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #f0f0f0', 
                  borderRadius: 8,
                  borderLeft: '4px solid #e91e63'
                }}>
                  <Typography.Text strong>1. Complete Essential Setup</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    Configure departments, add staff, and register doctors (3 steps remaining)
                  </Typography.Text>
                </div>
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #f0f0f0', 
                  borderRadius: 8,
                  borderLeft: '4px solid #f06292'
                }}>
                  <Typography.Text strong>2. Add Your First Patient</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    Register your first patient to start using the system
                  </Typography.Text>
                </div>
                <div style={{ 
                  padding: 16, 
                  border: '1px solid #f0f0f0', 
                  borderRadius: 8,
                  borderLeft: '4px solid #ec407a'
                }}>
                  <Typography.Text strong>3. Schedule Initial Appointment</Typography.Text>
                  <br />
                  <Typography.Text type="secondary">
                    Book your first appointment to test the workflow
                  </Typography.Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card 
              title={
                <span style={{ color: '#e91e63' }}>
                  📚 Resources & Help
                </span>
              }
              style={{ height: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button 
                  type="link" 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px 0',
                    color: '#e91e63',
                    height: 'auto'
                  }}
                >
                  📖 Getting Started Guide
                </Button>
                <Button 
                  type="link" 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px 0',
                    color: '#e91e63',
                    height: 'auto'
                  }}
                >
                  🎥 Video Tutorials
                </Button>
                <Button 
                  type="link" 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px 0',
                    color: '#e91e63',
                    height: 'auto'
                  }}
                >
                  💬 Contact Support
                </Button>
                <Button 
                  type="link" 
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px 0',
                    color: '#e91e63',
                    height: 'auto'
                  }}
                >
                  ❓ FAQ & Help Center
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {msgCtx}
      <div className="dashboard-header">
        <Title level={3}>Welcome back, {user?.firstName}!</Title>
        <Typography.Text type="secondary">
          Here's what's happening with your hospital today.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Patients"
              value={dashboardData.totalPatients}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#e91e63' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Today's Appointments"
              value={dashboardData.todayAppointments}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Pending Appointments"
              value={dashboardData.pendingAppointments}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Monthly Revenue"
              value={dashboardData.monthlyRevenue || 0}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#e91e63' }}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Recent Appointments" style={{ height: '100%' }} loading={loading}>
            {isDoctor ? (
              appts.length ? (
                <Table
                  size="small"
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  dataSource={appts.slice(0, 10)}
                  columns={[
                    { title: 'Patient', dataIndex: ['patient','firstName'], key: 'patient', render: (_: any, r: Appt) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '-' },
                    { title: 'Service', dataIndex: ['service','name'], key: 'service', render: (v: any) => v || '-' },
                    { title: 'Start', dataIndex: 'startTime', key: 'start', render: (v: string) => new Date(v).toLocaleString() },
                    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => {
                        const s = String(v).toLowerCase();
                        const color = s === 'pending' ? 'orange' : s === 'confirmed' ? 'green' : s === 'cancelled' ? 'red' : 'default';
                        return <Tag color={color}>{s.toUpperCase()}</Tag>;
                      }
                    },
                  ]}
                />
              ) : (
                <Empty description="No recent appointments">
                  <SpaceWrap>
                    <Button type="primary" onClick={() => navigate('/availability')}>Add Availability</Button>
                    <Button onClick={() => navigate('/appointments/new')}>Create Appointment</Button>
                  </SpaceWrap>
                </Empty>
              )
            ) : (
              // Admin dashboard content
              <div>
                <Title level={5} style={{ color: '#e91e63', marginBottom: 16 }}>Hospital Overview</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic 
                        title="Active Staff" 
                        value={adminStats.activeStaff} 
                        valueStyle={{ color: '#52c41a', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic 
                        title="Departments" 
                        value={adminStats.departments} 
                        valueStyle={{ color: '#1890ff', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic 
                        title="Bed Occupancy" 
                        value={adminStats.bedOccupancy} 
                        suffix="%" 
                        valueStyle={{ color: '#faad14', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic 
                        title="Satisfaction" 
                        value={adminStats.satisfaction} 
                        suffix="/5" 
                        valueStyle={{ color: '#e91e63', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Quick Actions" style={{ height: '100%' }}>
            {isDoctor ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <Button type="primary" onClick={() => navigate('/availability')}>Add Availability</Button>
                <Button onClick={() => navigate('/appointments')}>View My Appointments</Button>
                <Button onClick={() => navigate('/doctor/my-patients')}>My Patients</Button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/admin/appointments')}
                  style={{ background: '#e91e63', borderColor: '#e91e63' }}
                >
                  Manage Appointments
                </Button>
                <Button onClick={() => navigate('/patients')}>
                  View Patients
                </Button>
                <Button onClick={() => navigate('/admin/doctors')}>
                  Manage Staff
                </Button>
                <Button onClick={() => navigate('/admin/departments')}>
                  Departments
                </Button>
                <Button onClick={() => navigate('/admin/reports')}>
                  View Reports
                </Button>
                {role === 'super_admin' && (
                  <Button 
                    onClick={() => navigate('/saas/organizations')}
                    style={{ borderColor: '#e91e63', color: '#e91e63' }}
                  >
                    SaaS Management
                  </Button>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </DashboardContainer>
  );
};

export default Dashboard;
