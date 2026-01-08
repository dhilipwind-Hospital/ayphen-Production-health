import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Tabs } from 'antd';
import { 
  ExperimentOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import styled from 'styled-components';

const { TabPane } = Tabs;

const DashboardContainer = styled.div`
  padding: 24px;
`;

const StatsCard = styled(Card)`
  margin-bottom: 24px;
`;

interface LabOrder {
  id: string;
  orderNumber: string;
  patient: { firstName: string; lastName: string };
  doctor: { firstName: string; lastName: string };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  items: any[];
}

const LabDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<LabOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<LabOrder[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0
  });

  useEffect(() => {
    fetchPendingOrders();
    fetchCompletedOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab/orders/pending');
      console.log('Pending orders response:', response.data);
      const orders = response.data || [];
      setPendingOrders(orders);

      // Calculate stats
      const stats = {
        pending: orders.filter((o: LabOrder) => o.status === 'ordered').length,
        inProgress: orders.filter((o: LabOrder) => o.status === 'in_progress').length,
        completed: orders.filter((o: LabOrder) => o.status === 'completed').length,
        urgent: orders.filter((o: LabOrder) => o.isUrgent).length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedOrders = async () => {
    try {
      const response = await api.get('/lab/orders', {
        params: { status: 'completed', limit: 50 }
      });
      console.log('Completed orders response:', response.data);
      const orders = response.data.orders || [];
      setCompletedOrders(orders);
      
      // Update completed count in stats
      setStats(prev => ({ ...prev, completed: orders.length }));
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      setCompletedOrders([]);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ordered: 'blue',
      sample_collected: 'cyan',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: LabOrder) => (
        <>
          {text}
          {record.isUrgent && <Tag color="red" style={{ marginLeft: 8 }}>URGENT</Tag>}
        </>
      )
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, record: LabOrder) => 
        `${record.patient.firstName} ${record.patient.lastName}`
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_: any, record: LabOrder) => 
        `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`
    },
    {
      title: 'Tests',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Ordered',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: LabOrder) => {
        if (record.status === 'completed') {
          return <Tag color="green">Completed</Tag>;
        } else if (record.status === 'ordered') {
          return (
            <Button type="primary" size="small" onClick={() => window.location.href = '/laboratory/sample-collection'}>
              Collect Sample
            </Button>
          );
        } else if (record.status === 'sample_collected') {
          return (
            <Button type="primary" size="small" onClick={() => window.location.href = '/laboratory/results-entry'}>
              Enter Results
            </Button>
          );
        }
        return <Tag color="orange">In Progress</Tag>;
      }
    }
  ];

  return (
    <DashboardContainer>
      <h1>🔬 Laboratory Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Pending Orders"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatsCard>
        </Col>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </StatsCard>
        </Col>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Completed Today"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatsCard>
        </Col>
        <Col span={6}>
          <StatsCard>
            <Statistic
              title="Urgent"
              value={stats.urgent}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </StatsCard>
        </Col>
      </Row>

      <Card title="Lab Orders">
        <Tabs defaultActiveKey="all">
          <TabPane tab={`All Orders (${pendingOrders.length + completedOrders.length})`} key="all">
            <Table
              columns={columns}
              dataSource={[...pendingOrders, ...completedOrders]}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Urgent" key="urgent">
            <Table
              columns={columns}
              dataSource={pendingOrders.filter(o => o.isUrgent)}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Sample Collection" key="sample">
            <Table
              columns={columns}
              dataSource={pendingOrders.filter(o => o.status === 'ordered')}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={`Completed (${completedOrders.length})`} key="completed">
            <Table
              columns={columns}
              dataSource={completedOrders}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </DashboardContainer>
  );
};

export default LabDashboard;
