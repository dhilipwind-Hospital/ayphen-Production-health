import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Statistic, Row, Col, Typography, Input, Select, Modal, Form, message, Spin } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  BankOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  ReloadOutlined,
  MailOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Organization {
  id: string;
  name: string;
  domain: string;
  email: string;
  plan: 'Basic' | 'Professional' | 'Enterprise';
  users: number;
  maxUsers: number;
  status: 'Active' | 'Suspended' | 'Trial';
  createdAt: string;
  lastActive: string;
  monthlyRevenue: number;
}

const OrganizationsManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();

  // Fetch organizations from backend
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      
      console.log('Organizations response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        // Validate that data is an array
        if (!Array.isArray(response.data.data)) {
          console.error('Response data is not an array:', response.data.data);
          message.error('Invalid response format from server');
          setOrganizations([]);
          return;
        }
        
        // Transform backend data to match frontend interface
        const transformedOrgs = response.data.data.map((org: any) => {
          const plan = org.subscription?.plan || org.plan || 'professional';
          const status = org.subscription?.status || org.status || 'active';
          
          return {
            id: org.id,
            name: org.name,
            domain: org.subdomain || org.domain || '',
            email: org.adminEmail || org.email || `admin@${org.subdomain || org.domain || 'hospital'}.com`,
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            users: org.users || 0,
            maxUsers: org.maxUsers || 100,
            status: status.charAt(0).toUpperCase() + status.slice(1),
            createdAt: org.createdAt ? new Date(org.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastActive: org.lastActive || org.updatedAt ? new Date(org.lastActive || org.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            monthlyRevenue: org.monthlyRevenue || 0
          };
        });
        setOrganizations(transformedOrgs);
      } else {
        console.error('Invalid response structure:', response.data);
        message.error('Failed to load organizations');
        setOrganizations([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch organizations:', error);
      console.error('Error response:', error.response?.data);
      message.error(error.response?.data?.message || 'Failed to load organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const columns = [
    {
      title: 'Organization',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Organization) => (
        <div>
          <div style={{ fontWeight: 600, color: '#e91e63' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.domain}</div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => {
        const colors = {
          Basic: '#52c41a',
          Professional: '#e91e63',
          Enterprise: '#722ed1'
        };
        return <Tag color={colors[plan as keyof typeof colors]}>{plan}</Tag>;
      },
    },
    {
      title: 'Users',
      key: 'users',
      render: (record: Organization) => (
        <div>
          <Text strong>{record.users}</Text>
          <Text type="secondary">/{record.maxUsers}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          Active: '#52c41a',
          Suspended: '#ff4d4f',
          Trial: '#faad14'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: 'Monthly Revenue',
      dataIndex: 'monthlyRevenue',
      key: 'monthlyRevenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#e91e63' }}>
          ${revenue}
        </Text>
      ),
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Organization) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const handleView = (org: Organization) => {
    setViewingOrg(org);
    setIsViewModalVisible(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.setFieldsValue(org);
    setIsModalVisible(true);
  };

  const handleDelete = (org: Organization) => {
    Modal.confirm({
      title: 'Delete Organization',
      content: `Are you sure you want to delete ${org.name}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setOrganizations(orgs => orgs.filter(o => o.id !== org.id));
        message.success(`${org.name} deleted successfully`);
      },
    });
  };

  const handleAddNew = () => {
    setEditingOrg(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      
      if (editingOrg) {
        // Update existing
        setOrganizations(orgs => 
          orgs.map(org => 
            org.id === editingOrg.id ? { ...org, ...values } : org
          )
        );
        message.success('Organization updated successfully');
      } else {
        // Add new - send to backend
        try {
          const response = await api.post('/organizations', values);
          if (response.data?.success) {
            message.success('Organization created successfully');
            // Refresh the list to show new organization
            await fetchOrganizations();
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to create organization');
        }
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const totalRevenue = organizations.reduce((sum, org) => sum + org.monthlyRevenue, 0);
  const totalUsers = organizations.reduce((sum, org) => sum + org.users, 0);
  const activeOrgs = organizations.filter(org => org.status === 'Active').length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          <BankOutlined /> Organizations Management
        </Title>
        <Text type="secondary">
          Manage all hospital organizations in your SaaS platform
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Organizations"
              value={organizations.length}
              prefix={<BankOutlined style={{ color: '#e91e63' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Organizations"
              value={activeOrgs}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#e91e63' }} />}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Search
                placeholder="Search organizations..."
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="trial">Trial</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchOrganizations}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              style={{ background: '#e91e63', borderColor: '#e91e63' }}
            >
              Add Organization
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Organizations Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={organizations}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} organizations`,
            }}
          />
        </Spin>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingOrg ? 'Edit Organization' : 'Add New Organization'}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Organization Name"
            rules={[{ required: true, message: 'Please enter organization name' }]}
          >
            <Input placeholder="Enter organization name" />
          </Form.Item>
          
          <Form.Item
            name="domain"
            label="Domain"
            rules={[{ required: true, message: 'Please enter domain' }]}
          >
            <Input placeholder="organization.hospital.com" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Organization Email"
            rules={[
              { required: true, message: 'Please enter organization email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input placeholder="admin@organization.com" prefix={<MailOutlined />} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plan"
                label="Plan"
                rules={[{ required: true, message: 'Please select a plan' }]}
              >
                <Select placeholder="Select plan">
                  <Option value="Basic">Basic</Option>
                  <Option value="Professional">Professional</Option>
                  <Option value="Enterprise">Enterprise</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxUsers"
                label="Max Users"
                rules={[{ required: true, message: 'Please enter max users' }]}
              >
                <Input type="number" placeholder="100" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="Active">Active</Option>
              <Option value="Trial">Trial</Option>
              <Option value="Suspended">Suspended</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Organization Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOutlined style={{ color: '#e91e63' }} />
            <span>Organization Details</span>
          </div>
        }
        visible={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            style={{ background: '#e91e63', borderColor: '#e91e63' }}
            onClick={() => {
              setIsViewModalVisible(false);
              if (viewingOrg) {
                handleEdit(viewingOrg);
              }
            }}
          >
            Edit Organization
          </Button>
        ]}
        width={700}
      >
        {viewingOrg && (
          <div style={{ padding: '16px 0' }}>
            {/* Organization Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)', 
              color: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                {viewingOrg.name}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                🌐 {viewingOrg.domain}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                📧 {viewingOrg.email}
              </div>
            </div>

            {/* Organization Details Grid */}
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <BankOutlined style={{ fontSize: '24px', color: '#e91e63', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Organization ID</div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{viewingOrg.id}</div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag 
                      color={
                        viewingOrg.plan === 'Basic' ? '#52c41a' :
                        viewingOrg.plan === 'Professional' ? '#e91e63' : '#722ed1'
                      }
                      style={{ fontSize: '14px', padding: '4px 12px', marginBottom: '8px' }}
                    >
                      {viewingOrg.plan}
                    </Tag>
                    <div style={{ fontSize: '12px', color: '#666' }}>Subscription Plan</div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[24, 16]} style={{ marginTop: '16px' }}>
              <Col span={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <UserOutlined style={{ fontSize: '20px', color: '#1890ff', marginBottom: '8px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                      {viewingOrg.users}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Current Users
                    </div>
                    <div style={{ fontSize: '10px', color: '#999' }}>
                      Max: {viewingOrg.maxUsers}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag 
                      color={
                        viewingOrg.status === 'Active' ? '#52c41a' :
                        viewingOrg.status === 'Trial' ? '#faad14' : '#ff4d4f'
                      }
                      style={{ fontSize: '14px', padding: '4px 12px', marginBottom: '8px' }}
                    >
                      {viewingOrg.status}
                    </Tag>
                    <div style={{ fontSize: '12px', color: '#666' }}>Status</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ height: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <DollarOutlined style={{ fontSize: '20px', color: '#e91e63', marginBottom: '8px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e91e63' }}>
                      ${viewingOrg.monthlyRevenue}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Monthly Revenue
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Contact Information */}
            <Card 
              title={
                <span>
                  <MailOutlined style={{ marginRight: '8px', color: '#e91e63' }} />
                  Contact Information
                </span>
              }
              size="small" 
              style={{ marginTop: '24px' }}
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Organization Email
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#333', wordBreak: 'break-all' }}>
                      {viewingOrg.email}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Domain/Subdomain
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {viewingOrg.domain}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Timeline Information */}
            <Card 
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: '8px', color: '#e91e63' }} />
                  Timeline Information
                </span>
              }
              size="small" 
              style={{ marginTop: '24px' }}
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Created Date
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {new Date(viewingOrg.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Last Active
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {new Date(viewingOrg.lastActive).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Usage Statistics */}
            <Card 
              title={
                <span>
                  <UserOutlined style={{ marginRight: '8px', color: '#e91e63' }} />
                  Usage Statistics
                </span>
              }
              size="small" 
              style={{ marginTop: '16px' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>User Capacity</span>
                    <div style={{ flex: 1, margin: '0 16px' }}>
                      <div style={{ 
                        background: '#f0f0f0', 
                        height: '8px', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: viewingOrg.users / viewingOrg.maxUsers > 0.8 ? '#ff4d4f' : 
                                    viewingOrg.users / viewingOrg.maxUsers > 0.6 ? '#faad14' : '#52c41a',
                          height: '100%',
                          width: `${(viewingOrg.users / viewingOrg.maxUsers) * 100}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>
                      {Math.round((viewingOrg.users / viewingOrg.maxUsers) * 100)}%
                    </span>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Quick Actions */}
            <Card 
              title={
                <span>
                  <EditOutlined style={{ marginRight: '8px', color: '#e91e63' }} />
                  Quick Actions
                </span>
              }
              size="small" 
              style={{ marginTop: '16px' }}
            >
              <Space wrap>
                <Button 
                  type="primary" 
                  size="small"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  View Users
                </Button>
                <Button 
                  type="primary" 
                  size="small"
                  style={{ background: '#1890ff', borderColor: '#1890ff' }}
                >
                  View Analytics
                </Button>
                <Button 
                  type="primary" 
                  size="small"
                  style={{ background: '#faad14', borderColor: '#faad14' }}
                >
                  Billing History
                </Button>
                <Button 
                  type="primary" 
                  size="small"
                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                >
                  System Logs
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrganizationsManagement;
