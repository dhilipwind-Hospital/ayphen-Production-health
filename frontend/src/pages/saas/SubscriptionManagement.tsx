import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Statistic, Row, Col, Typography, Input, Select, Modal, Form, message, Tabs, Progress, Timeline, Badge, Spin } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  CreditCardOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Subscription {
  id: string;
  organizationId: string;
  organizationName: string;
  plan: 'Basic' | 'Professional' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Trial' | 'Expired' | 'Pending';
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  yearlyPrice: number;
  billingCycle: 'Monthly' | 'Yearly';
  features: string[];
  userLimit: number;
  currentUsers: number;
  storageLimit: string;
  currentStorage: string;
  lastPayment: string;
  nextPayment: string;
  paymentMethod: string;
}

const SubscriptionManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [form] = Form.useForm();

  const planPrices = {
    basic: { monthly: 99, yearly: 990 },
    professional: { monthly: 299, yearly: 2990 },
    trial: { monthly: 0, yearly: 0 },
    enterprise: { monthly: 999, yearly: 9990 }
  };

  const planFeatures = {
    Basic: [
      'Up to 25 users',
      '10GB storage',
      'Basic patient management',
      'Simple appointment scheduling',
      'Basic medical records',
      'Email support',
      'Standard security'
    ],
    Professional: [
      'Up to 100 users',
      '100GB storage',
      'Advanced patient management',
      'Smart appointment scheduling',
      'Complete medical records',
      'Pharmacy management',
      'Laboratory management',
      'Billing & invoicing',
      'Basic reports',
      'Phone & email support',
      'Enhanced security'
    ],
    Enterprise: [
      'Up to 500 users',
      '1TB storage',
      'All Professional features',
      'Advanced analytics & reporting',
      'API access',
      'Custom integrations',
      'Multi-location support',
      'Priority support',
      'Advanced security & compliance',
      'Custom branding',
      'Dedicated account manager'
    ]
  };

  // Fetch subscriptions from backend
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      
      console.log('Subscriptions response:', response.data);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const transformedSubs = response.data.data.map((org: any, index: number) => {
          const plan = org.subscription?.plan || org.plan || 'trial';
          const planKey = plan.toLowerCase();
          const prices = planPrices[planKey as keyof typeof planPrices] || planPrices.trial;
          
          return {
            id: org.id || `sub-${index}`,
            organizationId: org.id,
            organizationName: org.name,
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            status: (org.subscription?.status || 'active').charAt(0).toUpperCase() + (org.subscription?.status || 'active').slice(1),
            startDate: org.subscription?.startDate ? new Date(org.subscription.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: org.subscription?.endDate ? new Date(org.subscription.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            monthlyPrice: prices.monthly,
            yearlyPrice: prices.yearly,
            billingCycle: 'Monthly' as const,
            features: planFeatures[plan.charAt(0).toUpperCase() + plan.slice(1) as keyof typeof planFeatures] || planFeatures.Professional,
            userLimit: org.settings?.limits?.maxUsers || 100,
            currentUsers: 0,
            storageLimit: org.settings?.limits?.maxStorage ? `${org.settings.limits.maxStorage}GB` : '100GB',
            currentStorage: '0GB',
            lastPayment: org.subscription?.startDate ? new Date(org.subscription.startDate).toISOString().split('T')[0] : 'N/A',
            nextPayment: org.subscription?.endDate ? new Date(org.subscription.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paymentMethod: 'Automatic Billing'
          };
        });
        
        setSubscriptions(transformedSubs);
      } else {
        console.error('Invalid response structure:', response.data);
        message.error('Failed to load subscriptions');
        setSubscriptions([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch subscriptions:', error);
      message.error(error.response?.data?.message || 'Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const columns = [
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      key: 'organizationName',
      render: (text: string, record: Subscription) => (
        <div>
          <div style={{ fontWeight: 600, color: '#e91e63' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.organizationId.substring(0, 8)}</div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string, record: Subscription) => {
        const colors = {
          Basic: '#52c41a',
          Professional: '#e91e63',
          Enterprise: '#722ed1'
        };
        return (
          <div>
            <Tag color={colors[plan as keyof typeof colors]}>{plan}</Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ${record.billingCycle === 'Monthly' ? record.monthlyPrice : record.yearlyPrice}
              /{record.billingCycle.toLowerCase()}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Subscription) => {
        const colors = {
          Active: '#52c41a',
          Suspended: '#ff4d4f',
          Trial: '#faad14',
          Expired: '#ff4d4f',
          Pending: '#1890ff'
        };
        const icons = {
          Active: <CheckCircleOutlined />,
          Suspended: <StopOutlined />,
          Trial: <ClockCircleOutlined />,
          Expired: <ExclamationCircleOutlined />,
          Pending: <ClockCircleOutlined />
        };
        return (
          <div>
            <Tag color={colors[status as keyof typeof colors]} icon={icons[status as keyof typeof icons]}>
              {status}
            </Tag>
            {status === 'Trial' && (
              <div style={{ fontSize: '12px', color: '#faad14' }}>
                Expires: {record.endDate}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (record: Subscription) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text strong>Users: </Text>
            <Text>{record.currentUsers}/{record.userLimit}</Text>
            <Progress 
              percent={(record.currentUsers / record.userLimit) * 100} 
              size="small" 
              showInfo={false}
              strokeColor="#e91e63"
            />
          </div>
          <div>
            <Text strong>Storage: </Text>
            <Text>{record.currentStorage}/{record.storageLimit}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Next Payment',
      dataIndex: 'nextPayment',
      key: 'nextPayment',
      render: (date: string, record: Subscription) => (
        <div>
          <div>{date}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.paymentMethod}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Subscription) => (
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
          {record.status === 'Active' && (
            <Button 
              type="text" 
              danger 
              onClick={() => handleSuspend(record)}
            >
              Suspend
            </Button>
          )}
          {record.status === 'Suspended' && (
            <Button 
              type="text" 
              style={{ color: '#52c41a' }}
              onClick={() => handleActivate(record)}
            >
              Activate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (sub: Subscription) => {
    Modal.info({
      title: `${sub.organizationName} - Subscription Details`,
      width: 800,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="Plan Details">
                <p><strong>Plan:</strong> {sub.plan}</p>
                <p><strong>Status:</strong> <Tag color={sub.status === 'Active' ? '#52c41a' : '#faad14'}>{sub.status}</Tag></p>
                <p><strong>Billing:</strong> {sub.billingCycle}</p>
                <p><strong>Price:</strong> ${sub.billingCycle === 'Monthly' ? sub.monthlyPrice : sub.yearlyPrice}</p>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Usage">
                <p><strong>Users:</strong> {sub.currentUsers}/{sub.userLimit}</p>
                <p><strong>Storage:</strong> {sub.currentStorage}/{sub.storageLimit}</p>
                <p><strong>Next Payment:</strong> {sub.nextPayment}</p>
              </Card>
            </Col>
          </Row>
          <Card size="small" title="Features" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {sub.features.map(feature => (
                <Tag key={feature} color="#e91e63">{feature}</Tag>
              ))}
            </div>
          </Card>
        </div>
      ),
    });
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    form.setFieldsValue(sub);
    setIsModalVisible(true);
  };

  const handleSuspend = (sub: Subscription) => {
    Modal.confirm({
      title: 'Suspend Subscription',
      content: `Are you sure you want to suspend ${sub.organizationName}'s subscription?`,
      okText: 'Suspend',
      okType: 'danger',
      onOk: () => {
        setSubscriptions(subs => 
          subs.map(s => 
            s.id === sub.id ? { ...s, status: 'Suspended' as const } : s
          )
        );
        message.success(`${sub.organizationName}'s subscription suspended`);
      },
    });
  };

  const handleActivate = (sub: Subscription) => {
    setSubscriptions(subs => 
      subs.map(s => 
        s.id === sub.id ? { ...s, status: 'Active' as const } : s
      )
    );
    message.success(`${sub.organizationName}'s subscription activated`);
  };

  const totalRevenue = subscriptions.reduce((sum, sub) => 
    sum + (sub.billingCycle === 'Monthly' ? sub.monthlyPrice : sub.yearlyPrice), 0
  );
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'Active').length;
  const trialSubscriptions = subscriptions.filter(sub => sub.status === 'Trial').length;

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
            <CreditCardOutlined /> Subscription Management
          </Title>
          <Text type="secondary">
            Manage all hospital subscriptions and billing
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Subscriptions"
                value={subscriptions.length}
                prefix={<CreditCardOutlined style={{ color: '#e91e63' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Subscriptions"
                value={activeSubscriptions}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Trial Subscriptions"
                value={trialSubscriptions}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
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

        <Tabs defaultActiveKey="1">
          <TabPane tab="All Subscriptions" key="1">
            {/* Controls */}
            <Card style={{ marginBottom: '16px' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Search
                      placeholder="Search subscriptions..."
                      style={{ width: 300 }}
                      prefix={<SearchOutlined />}
                    />
                    <Select defaultValue="all" style={{ width: 120 }}>
                      <Option value="all">All Status</Option>
                      <Option value="active">Active</Option>
                      <Option value="trial">Trial</Option>
                      <Option value="suspended">Suspended</Option>
                      <Option value="expired">Expired</Option>
                    </Select>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Subscriptions Table */}
            <Card>
              <Table
                columns={columns}
                dataSource={subscriptions}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} subscriptions`,
                }}
              />
            </Card>
          </TabPane>

          <TabPane tab="Plan Features" key="2">
            <Row gutter={16}>
              {Object.entries(planFeatures).map(([plan, features]) => (
                <Col span={8} key={plan}>
                  <Card 
                    title={plan}
                    extra={
                      <Tag color={plan === 'Basic' ? '#52c41a' : plan === 'Professional' ? '#e91e63' : '#722ed1'}>
                        {plan}
                      </Tag>
                    }
                  >
                    <ul style={{ paddingLeft: '20px' }}>
                      {features.map((feature, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab="Billing Timeline" key="3">
            <Card>
              <Timeline>
                {subscriptions.slice(0, 5).map((sub, index) => (
                  <Timeline.Item key={index} color={sub.status === 'Active' ? 'green' : 'blue'}>
                    <p><strong>{sub.nextPayment}</strong> - {sub.organizationName} - {sub.status} (${sub.monthlyPrice})</p>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </TabPane>
        </Tabs>

        {/* Edit Modal */}
        <Modal
          title={editingSub ? 'Edit Subscription' : 'New Subscription'}
          visible={isModalVisible}
          onOk={() => {
            form.validateFields().then(values => {
              if (editingSub) {
                setSubscriptions(subs => 
                  subs.map(sub => 
                    sub.id === editingSub.id ? { ...sub, ...values } : sub
                  )
                );
                message.success('Subscription updated successfully');
              }
              setIsModalVisible(false);
            });
          }}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="plan" label="Plan">
              <Select>
                <Option value="Basic">Basic - $99/month</Option>
                <Option value="Professional">Professional - $299/month</Option>
                <Option value="Enterprise">Enterprise - $999/month</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Trial">Trial</Option>
                <Option value="Suspended">Suspended</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="billingCycle" label="Billing Cycle">
              <Select>
                <Option value="Monthly">Monthly</Option>
                <Option value="Yearly">Yearly (10% discount)</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
};

export default SubscriptionManagement;
