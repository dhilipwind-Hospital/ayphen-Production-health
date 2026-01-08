import React, { useState } from 'react';
import { Card, Steps, Button, Row, Col, Typography, Progress, List, Avatar, Tag, Alert, Divider, Space, Statistic } from 'antd';
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  SafetyOutlined,
  BookOutlined,
  PlayCircleOutlined,
  GiftOutlined,
  RocketOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  category: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
}

const HospitalOnboardingDashboard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(2); // Hospital is in setup phase

  // What new hospitals get automatically
  const inheritedFeatures = [
    {
      category: 'Clinical Management',
      items: [
        'Patient Registration System',
        'Electronic Health Records (EHR)',
        'Appointment Scheduling',
        'Medical Records Management',
        'Prescription Management',
        'Laboratory Integration',
        'Radiology Services',
        'Telemedicine Platform'
      ]
    },
    {
      category: 'Administrative Tools',
      items: [
        'Staff Management System',
        'Role-Based Access Control',
        'Billing & Invoice Management',
        'Insurance Claims Processing',
        'Inventory Management',
        'Report Generation',
        'Analytics Dashboard',
        'Compliance Tracking'
      ]
    },
    {
      category: 'Patient Services',
      items: [
        'Patient Portal Access',
        'Online Appointment Booking',
        'Test Results Viewing',
        'Prescription Refills',
        'Health Records Access',
        'Communication Tools',
        'Payment Processing',
        'Health Education Resources'
      ]
    },
    {
      category: 'Technology Infrastructure',
      items: [
        'Cloud-Based Hosting',
        'Data Backup & Recovery',
        'Security & Encryption',
        'Mobile Applications',
        'API Integrations',
        'Real-Time Notifications',
        'Multi-Device Support',
        '24/7 System Monitoring'
      ]
    }
  ];

  const onboardingTasks = [
    {
      id: '1',
      title: 'Complete Hospital Profile',
      description: 'Add hospital details, contact information, and branding',
      status: 'completed' as const,
      category: 'Setup',
      estimatedTime: '15 minutes',
      priority: 'high' as const
    },
    {
      id: '2',
      title: 'Configure Departments',
      description: 'Set up medical departments and specializations',
      status: 'in-progress' as const,
      category: 'Setup',
      estimatedTime: '30 minutes',
      priority: 'high' as const
    },
    {
      id: '3',
      title: 'Add Staff Members',
      description: 'Invite doctors, nurses, and administrative staff',
      status: 'pending' as const,
      category: 'Staff',
      estimatedTime: '45 minutes',
      priority: 'high' as const
    },
    {
      id: '4',
      title: 'Set Up Services',
      description: 'Configure medical services and pricing',
      status: 'pending' as const,
      category: 'Services',
      estimatedTime: '20 minutes',
      priority: 'medium' as const
    },
    {
      id: '5',
      title: 'Configure Appointment Slots',
      description: 'Set doctor availability and appointment schedules',
      status: 'pending' as const,
      category: 'Scheduling',
      estimatedTime: '25 minutes',
      priority: 'high' as const
    },
    {
      id: '6',
      title: 'Test Telemedicine Setup',
      description: 'Verify video calling and device compatibility',
      status: 'pending' as const,
      category: 'Technology',
      estimatedTime: '15 minutes',
      priority: 'medium' as const
    },
    {
      id: '7',
      title: 'Import Patient Data',
      description: 'Migrate existing patient records (optional)',
      status: 'pending' as const,
      category: 'Data',
      estimatedTime: '60 minutes',
      priority: 'low' as const
    },
    {
      id: '8',
      title: 'Staff Training Session',
      description: 'Schedule training for your team',
      status: 'pending' as const,
      category: 'Training',
      estimatedTime: '90 minutes',
      priority: 'medium' as const
    }
  ];

  const quickStartActions = [
    {
      title: 'Add Your First Doctor',
      description: 'Invite a doctor to start accepting appointments',
      icon: <UserOutlined />,
      action: '/admin/doctors',
      color: '#e91e63'
    },
    {
      title: 'Configure Services',
      description: 'Set up medical services and consultation fees',
      icon: <MedicineBoxOutlined />,
      action: '/admin/services',
      color: '#52c41a'
    },
    {
      title: 'Test Telemedicine',
      description: 'Verify video calling works properly',
      icon: <PlayCircleOutlined />,
      action: '/telemedicine',
      color: '#1890ff'
    },
    {
      title: 'Schedule Training',
      description: 'Book a training session for your staff',
      icon: <BookOutlined />,
      action: '/training/schedule',
      color: '#faad14'
    }
  ];

  const completedTasks = onboardingTasks.filter(task => task.status === 'completed').length;
  const totalTasks = onboardingTasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div style={{ padding: '24px' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={1} style={{ color: '#e91e63', marginBottom: '8px' }}>
          🎉 Welcome to Ayphen Care!
        </Title>
        <Title level={3} style={{ color: '#666', fontWeight: 400 }}>
          Your hospital management system is ready to go
        </Title>
        <Paragraph style={{ fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          Congratulations! Your hospital has been successfully registered. 
          Let's get you set up with everything you need to start managing your hospital efficiently.
        </Paragraph>
      </div>

      {/* Progress Overview */}
      <Row gutter={16} style={{ marginBottom: '32px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Setup Progress"
              value={completionPercentage}
              suffix="%"
              prefix={<RocketOutlined style={{ color: '#e91e63' }} />}
              valueStyle={{ color: '#e91e63' }}
            />
            <Progress percent={completionPercentage} strokeColor="#e91e63" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tasks Completed"
              value={completedTasks}
              suffix={`/ ${totalTasks}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Features Available"
              value={inheritedFeatures.reduce((sum, cat) => sum + cat.items.length, 0)}
              prefix={<GiftOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Go-Live Estimate"
              value="2-3"
              suffix="hours"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Onboarding Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={3} style={{ color: '#e91e63', marginBottom: '24px' }}>
          <SettingOutlined /> Setup Progress
        </Title>
        
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="Registration" description="Hospital registered" />
          <Step title="System Setup" description="Configure your system" />
          <Step title="Staff Onboarding" description="Add your team" />
          <Step title="Go Live" description="Start serving patients" />
        </Steps>

        <Alert
          message="You're making great progress!"
          description={`${completedTasks} of ${totalTasks} setup tasks completed. Continue with the remaining tasks to go live.`}
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      </Card>

      <Row gutter={16}>
        {/* Quick Start Actions */}
        <Col span={12}>
          <Card title={<span><RocketOutlined /> Quick Start Actions</span>} style={{ marginBottom: '24px' }}>
            <List
              dataSource={quickStartActions}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.icon} 
                        style={{ backgroundColor: item.color }}
                      />
                    }
                    title={
                      <Button 
                        type="link" 
                        style={{ padding: 0, height: 'auto', color: item.color }}
                        onClick={() => window.location.href = item.action}
                      >
                        {item.title}
                      </Button>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Onboarding Tasks */}
        <Col span={12}>
          <Card title={<span><CheckCircleOutlined /> Onboarding Checklist</span>}>
            <List
              dataSource={onboardingTasks}
              renderItem={(task) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={
                          task.status === 'completed' ? <CheckCircleOutlined /> :
                          task.status === 'in-progress' ? <ClockCircleOutlined /> :
                          <ClockCircleOutlined />
                        }
                        style={{ 
                          backgroundColor: 
                            task.status === 'completed' ? '#52c41a' :
                            task.status === 'in-progress' ? '#e91e63' :
                            '#d9d9d9'
                        }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{task.title}</span>
                        <Tag color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'blue'}>
                          {task.priority}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>{task.description}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Estimated time: {task.estimatedTime}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* What You Get */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={3} style={{ color: '#e91e63', marginBottom: '24px' }}>
          <GiftOutlined /> What Your Hospital Gets Out of the Box
        </Title>
        
        <Row gutter={16}>
          {inheritedFeatures.map((category, index) => (
            <Col span={6} key={index}>
              <Card 
                size="small" 
                title={category.category}
                style={{ height: '100%' }}
                headStyle={{ backgroundColor: '#fce4ec', color: '#e91e63' }}
              >
                <List
                  size="small"
                  dataSource={category.items}
                  renderItem={(item) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Text style={{ fontSize: '13px' }}>{item}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Support & Resources */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={3} style={{ color: '#e91e63', marginBottom: '24px' }}>
          <SafetyOutlined /> Support & Resources
        </Title>
        
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="📚 Training Resources">
              <List size="small">
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    📹 Video Tutorials (15 videos)
                  </Button>
                </List.Item>
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    📖 User Manual (Complete Guide)
                  </Button>
                </List.Item>
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    🎯 Best Practices Guide
                  </Button>
                </List.Item>
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    📋 Setup Checklist
                  </Button>
                </List.Item>
              </List>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="🆘 Get Help">
              <List size="small">
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    💬 Live Chat Support (24/7)
                  </Button>
                </List.Item>
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    📞 Phone Support: +1-800-AYPHEN
                  </Button>
                </List.Item>
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    📧 Email: support@ayphen.care
                  </Button>
                </List.Item>
                <List.Item>
                  <Button type="link" style={{ padding: 0 }}>
                    🎓 Schedule Training Session
                  </Button>
                </List.Item>
              </List>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card size="small" title="🚀 Go Live Checklist">
              <List size="small">
                <List.Item>
                  ✅ Hospital profile completed
                </List.Item>
                <List.Item>
                  🔄 Add at least 1 doctor
                </List.Item>
                <List.Item>
                  🔄 Configure 3+ services
                </List.Item>
                <List.Item>
                  🔄 Test telemedicine
                </List.Item>
                <List.Item>
                  🔄 Staff training completed
                </List.Item>
              </List>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Call to Action */}
      <Card style={{ marginTop: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)' }}>
        <Title level={4} style={{ color: '#e91e63' }}>
          Ready to Continue Setup?
        </Title>
        <Paragraph>
          Complete the remaining tasks to go live with your hospital management system.
        </Paragraph>
        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            style={{ background: '#e91e63', borderColor: '#e91e63' }}
            onClick={() => window.location.href = '/admin/departments'}
          >
            Continue Setup
          </Button>
          <Button 
            size="large"
            onClick={() => window.location.href = '/training/schedule'}
          >
            Schedule Training
          </Button>
          <Button 
            size="large"
            onClick={() => window.location.href = '/support/chat'}
          >
            Get Help
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default HospitalOnboardingDashboard;
