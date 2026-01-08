import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  DatePicker, 
  Space, 
  Button, 
  Select, 
  Tabs,
  Table,
  Tag,
  Progress
} from 'antd';
import {
  DownloadOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  PhoneOutlined,
  AlertOutlined
} from '@ant-design/icons';
import analyticsService, { DashboardStats, DepartmentPerformance, RecentActivity } from '../../services/analytics.service';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsAdmin: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDepartments();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, deptData, activityData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getDepartmentPerformance(),
        analyticsService.getRecentActivity()
      ]);
      
      setStats(statsData);
      setDepartmentData(deptData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments', { params: { page: 1, limit: 100 } });
      const depts = response.data?.data || response.data || [];
      setDepartments(depts.filter((d: any) => d.status === 'active'));
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Patients', stats?.totalPatients || 0],
      ['Today\'s Appointments', stats?.todayAppointments || 0],
      ['Prescriptions', stats?.totalPrescriptions || 0],
      ['Lab Orders', stats?.totalLabOrders || 0],
      ['Emergency Requests', stats?.emergencyRequests || 0],
      ['Callback Requests', stats?.callbackRequests || 0],
      ['Active Departments', stats?.activeDepartments || 0],
      ['Active Doctors', stats?.activeDoctors || 0],
      [],
      ['Department Performance'],
      ['Department', 'Patients', 'Appointments', 'Utilization %'],
      ...departmentData.map(d => [d.department, d.patients, d.appointments, d.utilization])
    ].map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hospital-reports-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departmentColumns = [
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Patients', dataIndex: 'patients', key: 'patients' },
    { title: 'Appointments', dataIndex: 'appointments', key: 'appointments' },
    { 
      title: 'Utilization', 
      dataIndex: 'utilization', 
      key: 'utilization',
      render: (value: number) => <Progress percent={value} size="small" />
    },
  ];

  const activityColumns = [
    { title: 'Patient', dataIndex: 'patient', key: 'patient' },
    { title: 'Doctor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          'Completed': 'green',
          'Pending': 'orange',
          'Confirmed': 'blue',
          'Cancelled': 'red'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
  ];

  return (
    <div>
      {/* Header with Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Reports & Analytics</Title>
        <Space>
          <Select 
            value={selectedDepartment} 
            onChange={setSelectedDepartment}
            style={{ width: 200 }}
            showSearch
            placeholder="Select Department"
            optionFilterProp="children"
          >
            <Option value="all">All Departments</Option>
            {departments.map(dept => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
          <RangePicker />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            Export CSV
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Total Patients" 
              value={stats?.totalPatients || 0} 
              prefix={<UserOutlined />}
              valueStyle={{ color: '#0ea5a5' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Today's Appointments" 
              value={stats?.todayAppointments || 0} 
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Prescriptions" 
              value={stats?.totalPrescriptions || 0} 
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Lab Orders" 
              value={stats?.totalLabOrders || 0} 
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Emergency Requests" 
              value={stats?.emergencyRequests || 0} 
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Callback Requests" 
              value={stats?.callbackRequests || 0} 
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Active Departments" 
              value={stats?.activeDepartments || 0} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            loading={loading}
            hoverable
            style={{ 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f7';
              e.currentTarget.style.borderColor = '#EC407A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <Statistic 
              title="Active Doctors" 
              value={stats?.activeDoctors || 0} 
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Reports Tabs */}
      <Card>
        <Tabs defaultActiveKey="departments">
          <Tabs.TabPane tab="Department Performance" key="departments">
            <Table 
              columns={departmentColumns} 
              dataSource={departmentData} 
              pagination={false}
              loading={loading}
              rowKey="id"
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="Recent Activity" key="activity">
            <Table 
              columns={activityColumns} 
              dataSource={recentActivity} 
              pagination={{ pageSize: 10 }}
              loading={loading}
              rowKey="id"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReportsAdmin;
