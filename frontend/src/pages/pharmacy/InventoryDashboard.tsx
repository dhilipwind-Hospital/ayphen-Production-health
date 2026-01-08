import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Alert, Button, Table, Tag, Space, Spin } from 'antd';
import { 
  WarningOutlined, 
  StopOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';

const InventoryDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadAlerts();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/dashboard');
      setDashboard(res.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await api.get('/inventory/alerts?status=active');
      setAlerts(res.data.categorized?.critical || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      setGenerating(true);
      await api.post('/inventory/alerts/generate');
      await loadDashboard();
      await loadAlerts();
    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  const criticalAlerts = alerts.slice(0, 5);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Inventory Dashboard</h2>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleGenerateAlerts}
          loading={generating}
        >
          Generate Alerts
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert
          message="Critical Inventory Issues"
          description={
            <div>
              {criticalAlerts.map((alert: any) => (
                <div key={alert.id} style={{ marginTop: 8 }}>
                  <Tag color="red">{alert.alertType.replace('_', ' ').toUpperCase()}</Tag>
                  <span>{alert.message}</span>
                </div>
              ))}
              <Link to="/pharmacy/inventory/alerts">
                <Button type="link" style={{ padding: 0, marginTop: 8 }}>
                  View All Alerts →
                </Button>
              </Link>
            </div>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Total Medicines"
              value={dashboard?.totalMedicines || 0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Low Stock"
              value={dashboard?.lowStockCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Out of Stock"
              value={dashboard?.outOfStockCount || 0}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Total Stock Value"
              value={dashboard?.totalStockValue || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatCard>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Near Expiry"
              value={dashboard?.nearExpiryCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="items"
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Expired"
              value={dashboard?.expiredCount || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix="items"
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Active Alerts"
              value={dashboard?.activeAlerts || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard>
            <Statistic
              title="Critical Issues"
              value={dashboard?.criticalIssues || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </StatCard>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title="Quick Actions" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/pharmacy/inventory/alerts">
                <Button block>View All Alerts</Button>
              </Link>
              <Link to="/pharmacy/inventory/reports">
                <Button block>View Reports</Button>
              </Link>
              <Link to="/pharmacy/suppliers">
                <Button block>Manage Suppliers</Button>
              </Link>
              <Link to="/pharmacy/purchase-orders">
                <Button block>Purchase Orders</Button>
              </Link>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="System Status" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Inventory Health:</span>
                <Tag color={dashboard?.criticalIssues > 0 ? 'red' : 'green'}>
                  {dashboard?.criticalIssues > 0 ? 'Needs Attention' : 'Good'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Stock Coverage:</span>
                <Tag color={dashboard?.outOfStockCount > 0 ? 'orange' : 'green'}>
                  {dashboard?.outOfStockCount > 0 ? 'Partial' : 'Full'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Expiry Status:</span>
                <Tag color={dashboard?.expiredCount > 0 ? 'red' : 'green'}>
                  {dashboard?.expiredCount > 0 ? 'Action Required' : 'Good'}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InventoryDashboard;

const StatCard = styled(Card)`
  .ant-card-body {
    padding: 20px;
  }
  
  .ant-statistic-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .ant-statistic-content {
    font-size: 24px;
  }
`;
