import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, List, Avatar, Tag, Progress, Alert, Space, Divider, Steps, Tabs } from 'antd';
import { 
  UserOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  DollarOutlined,
  SafetyOutlined,
  BookOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  GiftOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;

const RoleSpecificOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const markTaskComplete = (taskId: string) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  const isTaskComplete = (taskId: string) => completedTasks.includes(taskId);

  // Admin Onboarding
  const AdminOnboarding = () => {
    const adminTasks = [
      {
        id: 'admin-1',
        title: 'Complete Hospital Profile',
        description: 'Add hospital details, logo, and contact information',
        priority: 'high',
        estimatedTime: '15 min',
        action: '/admin/hospital-profile'
      },
      {
        id: 'admin-2',
        title: 'Configure Departments',
        description: 'Set up medical departments and specializations',
        priority: 'high',
        estimatedTime: '20 min',
        action: '/admin/departments'
      },
      {
        id: 'admin-3',
        title: 'Add Medical Staff',
        description: 'Invite doctors, nurses, and support staff',
        priority: 'high',
        estimatedTime: '30 min',
        action: '/admin/staff'
      },
      {
        id: 'admin-4',
        title: 'Set Up Services & Pricing',
        description: 'Configure medical services and consultation fees',
        priority: 'medium',
        estimatedTime: '25 min',
        action: '/admin/services'
      },
      {
        id: 'admin-5',
        title: 'Configure Billing',
        description: 'Set up payment methods and billing preferences',
        priority: 'medium',
        estimatedTime: '20 min',
        action: '/billing/management'
      },
      {
        id: 'admin-6',
        title: 'Test Telemedicine',
        description: 'Verify video calling and device compatibility',
        priority: 'medium',
        estimatedTime: '15 min',
        action: '/telemedicine'
      }
    ];

    const adminFeatures = [
      'Complete hospital management dashboard',
      'Staff management and role assignments',
      'Financial oversight and billing control',
      'Analytics and performance reporting',
      'System configuration and settings',
      'Patient data and privacy management',
      'Integration with external systems',
      'Compliance and audit tools'
    ];

    return (
      <div>
        <Alert
          message="Welcome, Hospital Administrator!"
          description="You have full access to manage your hospital's operations. Complete these essential setup tasks to get started."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={16}>
          <Col span={16}>
            <Card title={<span><RocketOutlined /> Setup Tasks</span>}>
              <List
                dataSource={adminTasks}
                renderItem={(task) => (
                  <List.Item
                    actions={[
                      <Button 
                        type={isTaskComplete(task.id) ? 'default' : 'primary'}
                        onClick={() => {
                          markTaskComplete(task.id);
                          window.location.href = task.action;
                        }}
                        style={!isTaskComplete(task.id) ? { background: '#e91e63', borderColor: '#e91e63' } : {}}
                      >
                        {isTaskComplete(task.id) ? 'Completed' : 'Start'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={isTaskComplete(task.id) ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                          style={{ 
                            backgroundColor: isTaskComplete(task.id) ? '#52c41a' : '#e91e63'
                          }}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{task.title}</span>
                          <Tag color={task.priority === 'high' ? 'red' : 'orange'}>
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

          <Col span={8}>
            <Card title={<span><GiftOutlined /> Your Admin Features</span>}>
              <List
                size="small"
                dataSource={adminFeatures}
                renderItem={(feature) => (
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text style={{ fontSize: '13px' }}>{feature}</Text>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Quick Actions" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block onClick={() => window.location.href = '/admin/users'}>
                  Manage Users
                </Button>
                <Button block onClick={() => window.location.href = '/admin/departments'}>
                  Configure Departments
                </Button>
                <Button block onClick={() => window.location.href = '/billing/management'}>
                  Set Up Billing
                </Button>
                <Button block onClick={() => window.location.href = '/telemedicine'}>
                  Test Telemedicine
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Doctor Onboarding
  const DoctorOnboarding = () => {
    const doctorTasks = [
      {
        id: 'doctor-1',
        title: 'Complete Your Profile',
        description: 'Add your medical credentials, specialization, and bio',
        priority: 'high',
        estimatedTime: '10 min',
        action: '/profile'
      },
      {
        id: 'doctor-2',
        title: 'Set Your Availability',
        description: 'Configure your working hours and appointment slots',
        priority: 'high',
        estimatedTime: '15 min',
        action: '/doctor/availability'
      },
      {
        id: 'doctor-3',
        title: 'Test Telemedicine',
        description: 'Verify your camera and microphone for video consultations',
        priority: 'high',
        estimatedTime: '10 min',
        action: '/telemedicine'
      },
      {
        id: 'doctor-4',
        title: 'Review Patient Portal',
        description: 'Understand how patients will interact with the system',
        priority: 'medium',
        estimatedTime: '10 min',
        action: '/patients'
      },
      {
        id: 'doctor-5',
        title: 'Explore Mobile App',
        description: 'Download and set up the mobile app for on-the-go access',
        priority: 'medium',
        estimatedTime: '10 min',
        action: '/mobile-setup'
      }
    ];

    const doctorFeatures = [
      'Patient appointment management',
      'Electronic health records access',
      'Telemedicine video consultations',
      'Digital prescription writing',
      'Lab results and imaging review',
      'Mobile app for remote access',
      'Secure patient communication',
      'Clinical decision support tools'
    ];

    return (
      <div>
        <Alert
          message="Welcome, Doctor!"
          description="Your clinical workspace is ready. Complete these tasks to start seeing patients efficiently."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={16}>
          <Col span={16}>
            <Card title={<span><MedicineBoxOutlined /> Getting Started</span>}>
              <List
                dataSource={doctorTasks}
                renderItem={(task) => (
                  <List.Item
                    actions={[
                      <Button 
                        type={isTaskComplete(task.id) ? 'default' : 'primary'}
                        onClick={() => {
                          markTaskComplete(task.id);
                          window.location.href = task.action;
                        }}
                        style={!isTaskComplete(task.id) ? { background: '#e91e63', borderColor: '#e91e63' } : {}}
                      >
                        {isTaskComplete(task.id) ? 'Completed' : 'Start'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={isTaskComplete(task.id) ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                          style={{ 
                            backgroundColor: isTaskComplete(task.id) ? '#52c41a' : '#e91e63'
                          }}
                        />
                      }
                      title={task.title}
                      description={
                        <div>
                          <div>{task.description}</div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {task.estimatedTime}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col span={8}>
            <Card title={<span><StarOutlined /> Your Clinical Tools</span>}>
              <List
                size="small"
                dataSource={doctorFeatures}
                renderItem={(feature) => (
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <Text style={{ fontSize: '13px' }}>{feature}</Text>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Quick Access" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block onClick={() => window.location.href = '/appointments'}>
                  View Schedule
                </Button>
                <Button block onClick={() => window.location.href = '/doctor/my-patients'}>
                  My Patients
                </Button>
                <Button block onClick={() => window.location.href = '/telemedicine'}>
                  Start Video Call
                </Button>
                <Button block onClick={() => window.location.href = '/doctor/prescriptions'}>
                  Write Prescription
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Nurse Onboarding
  const NurseOnboarding = () => {
    const nurseTasks = [
      {
        id: 'nurse-1',
        title: 'Complete Your Profile',
        description: 'Add your nursing credentials and certifications',
        priority: 'high',
        estimatedTime: '10 min',
        action: '/profile'
      },
      {
        id: 'nurse-2',
        title: 'Learn Patient Care Tools',
        description: 'Explore patient monitoring and care plan features',
        priority: 'high',
        estimatedTime: '15 min',
        action: '/patients'
      },
      {
        id: 'nurse-3',
        title: 'Review Inpatient Management',
        description: 'Understand ward management and bed assignments',
        priority: 'medium',
        estimatedTime: '15 min',
        action: '/inpatient/wards'
      },
      {
        id: 'nurse-4',
        title: 'Test Mobile Access',
        description: 'Set up mobile app for bedside patient care',
        priority: 'medium',
        estimatedTime: '10 min',
        action: '/mobile-setup'
      }
    ];

    return (
      <div>
        <Alert
          message="Welcome, Nurse!"
          description="Your patient care tools are ready. These features will help you provide excellent patient care."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card title={<span><TeamOutlined /> Nursing Workspace Setup</span>}>
          <List
            dataSource={nurseTasks}
            renderItem={(task) => (
              <List.Item
                actions={[
                  <Button 
                    type={isTaskComplete(task.id) ? 'default' : 'primary'}
                    onClick={() => {
                      markTaskComplete(task.id);
                      window.location.href = task.action;
                    }}
                    style={!isTaskComplete(task.id) ? { background: '#e91e63', borderColor: '#e91e63' } : {}}
                  >
                    {isTaskComplete(task.id) ? 'Completed' : 'Start'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={isTaskComplete(task.id) ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      style={{ 
                        backgroundColor: isTaskComplete(task.id) ? '#52c41a' : '#e91e63'
                      }}
                    />
                  }
                  title={task.title}
                  description={task.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  // Patient Onboarding
  const PatientOnboarding = () => {
    const patientTasks = [
      {
        id: 'patient-1',
        title: 'Complete Your Health Profile',
        description: 'Add your medical history and current medications',
        priority: 'high',
        estimatedTime: '15 min',
        action: '/portal/profile'
      },
      {
        id: 'patient-2',
        title: 'Book Your First Appointment',
        description: 'Schedule a consultation with one of our doctors',
        priority: 'high',
        estimatedTime: '5 min',
        action: '/appointments/new'
      },
      {
        id: 'patient-3',
        title: 'Test Telemedicine',
        description: 'Verify your device works for video consultations',
        priority: 'medium',
        estimatedTime: '5 min',
        action: '/telemedicine/test'
      },
      {
        id: 'patient-4',
        title: 'Download Mobile App',
        description: 'Get the mobile app for easy access to your health records',
        priority: 'medium',
        estimatedTime: '5 min',
        action: '/mobile-app'
      }
    ];

    return (
      <div>
        <Alert
          message="Welcome to Your Health Portal!"
          description="Manage your healthcare easily with our patient portal. Complete these steps to get the most out of your experience."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Card title={<span><UserOutlined /> Patient Portal Setup</span>}>
          <List
            dataSource={patientTasks}
            renderItem={(task) => (
              <List.Item
                actions={[
                  <Button 
                    type={isTaskComplete(task.id) ? 'default' : 'primary'}
                    onClick={() => {
                      markTaskComplete(task.id);
                      window.location.href = task.action;
                    }}
                    style={!isTaskComplete(task.id) ? { background: '#e91e63', borderColor: '#e91e63' } : {}}
                  >
                    {isTaskComplete(task.id) ? 'Completed' : 'Start'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={isTaskComplete(task.id) ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      style={{ 
                        backgroundColor: isTaskComplete(task.id) ? '#52c41a' : '#e91e63'
                      }}
                    />
                  }
                  title={task.title}
                  description={task.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  const getRoleBasedContent = () => {
    const role = user?.role?.toLowerCase();
    
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <AdminOnboarding />;
      case 'doctor':
        return <DoctorOnboarding />;
      case 'nurse':
        return <NurseOnboarding />;
      case 'patient':
        return <PatientOnboarding />;
      default:
        return <AdminOnboarding />; // Default to admin view
    }
  };

  const getWelcomeMessage = () => {
    const role = user?.role?.toLowerCase();
    const firstName = user?.firstName || 'User';
    
    const messages = {
      admin: `Welcome, ${firstName}! You're all set to manage your hospital.`,
      super_admin: `Welcome, ${firstName}! You have full platform access.`,
      doctor: `Welcome, Dr. ${firstName}! Your clinical workspace is ready.`,
      nurse: `Welcome, ${firstName}! Your patient care tools are available.`,
      patient: `Welcome, ${firstName}! Your health portal is ready to use.`,
      pharmacist: `Welcome, ${firstName}! Your pharmacy management tools are ready.`,
      lab_technician: `Welcome, ${firstName}! Your laboratory tools are configured.`,
      receptionist: `Welcome, ${firstName}! Your front desk tools are ready.`,
      accountant: `Welcome, ${firstName}! Your billing and finance tools are available.`
    };
    
    return messages[role as keyof typeof messages] || `Welcome, ${firstName}!`;
  };

  const completionPercentage = Math.round((completedTasks.length / 6) * 100);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          {getWelcomeMessage()}
        </Title>
        <Paragraph>
          Complete your personalized onboarding to get the most out of Ayphen Care
        </Paragraph>
        
        <Row gutter={16} style={{ marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>
          <Col span={12}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#e91e63' }}>
                  {completionPercentage}%
                </div>
                <div>Setup Complete</div>
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                  {completedTasks.length}
                </div>
                <div>Tasks Done</div>
              </div>
            </Card>
          </Col>
        </Row>
        
        <Progress 
          percent={completionPercentage} 
          strokeColor="#e91e63" 
          style={{ marginTop: '16px', maxWidth: '400px', margin: '16px auto' }}
        />
      </div>

      {/* Role-specific content */}
      {getRoleBasedContent()}

      {/* Support Section */}
      <Card style={{ marginTop: '24px' }}>
        <Title level={4} style={{ color: '#e91e63' }}>
          <SafetyOutlined /> Need Help?
        </Title>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <BookOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontWeight: 600 }}>Training Resources</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Video tutorials and guides</div>
              <Button size="small" style={{ marginTop: '8px' }}>
                View Resources
              </Button>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontWeight: 600 }}>Live Support</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Chat with our support team</div>
              <Button size="small" style={{ marginTop: '8px' }}>
                Start Chat
              </Button>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <PlayCircleOutlined style={{ fontSize: '32px', color: '#e91e63', marginBottom: '8px' }} />
              <div style={{ fontWeight: 600 }}>Schedule Training</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Book a personalized session</div>
              <Button size="small" style={{ marginTop: '8px' }}>
                Book Session
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RoleSpecificOnboarding;
