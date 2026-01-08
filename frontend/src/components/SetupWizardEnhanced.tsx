import React, { useState } from 'react';
import { Card, Button, Typography, Space, Progress, Row, Col, Badge } from 'antd';
import { 
  TeamOutlined, 
  BankOutlined, 
  UserOutlined, 
  CalendarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  RightOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;

const WizardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
  min-height: 100vh;
`;

const WelcomeCard = styled(Card)`
  margin-bottom: 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 50%, #1d4ed8 100%);
  border: none;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
  
  .ant-card-body {
    text-align: center;
    padding: 48px 24px;
  }
  
  h1, h2, p {
    color: white !important;
    margin-bottom: 16px;
  }
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StepCard = styled(Card)`
  border-radius: 16px;
  border: none;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .ant-card-body {
    padding: 24px;
  }
  
  &.completed {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 2px solid #10b981;
  }
`;

const IconWrapper = styled.div<{ priority?: string }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${props => {
    switch (props.priority) {
      case 'high':
        return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'medium':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'low':
        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      default:
        return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  .anticon {
    font-size: 28px;
    color: white;
  }
  
  &.completed {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 16px;
`;

const StepTitle = styled(Title)`
  &&& {
    font-size: 18px;
    margin-bottom: 8px;
    color: #2c3e50;
  }
`;

const StepDescription = styled(Text)`
  color: #6c757d;
  font-size: 14px;
  line-height: 1.5;
`;

const ActionButton = styled(Button)<{ priority?: string; completed?: boolean }>`
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 16px;
  
  &.ant-btn-primary {
    background: ${props => {
      if (props.completed) {
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
      switch (props.priority) {
        case 'high':
          return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        case 'medium':
          return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        case 'low':
          return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        default:
          return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
      }
    }};
    border: none;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
  }
`;

const ProgressCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const HelpCard = styled(Card)`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: none;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.15);
  
  .ant-card-body {
    padding: 32px 24px;
  }
`;

const CompletionBadge = styled(Badge)`
  position: absolute;
  top: 16px;
  right: 16px;
  
  .ant-badge-count {
    background: #10b981;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  }
`;

interface SetupStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  completed?: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface SetupWizardEnhancedProps {
  organizationName?: string;
  onStepComplete?: (stepKey: string) => void;
}

const SetupWizardEnhanced: React.FC<SetupWizardEnhancedProps> = ({ 
  organizationName = 'your hospital',
  onStepComplete 
}) => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const setupSteps: SetupStep[] = [
    {
      key: 'departments',
      title: 'Configure Departments',
      description: 'Set up medical departments like Cardiology, Pediatrics, Emergency, etc.',
      icon: <BankOutlined />,
      path: '/admin/departments',
      priority: 'high',
    },
    {
      key: 'staff',
      title: 'Add Staff Members',
      description: 'Add nurses, receptionists, and administrative staff to your team',
      icon: <TeamOutlined />,
      path: '/admin/staff',
      priority: 'high',
    },
    {
      key: 'doctors',
      title: 'Register Doctors',
      description: 'Add doctors and assign them to departments with specializations',
      icon: <UserOutlined />,
      path: '/admin/doctors',
      priority: 'high',
    },
    {
      key: 'services',
      title: 'Configure Services',
      description: 'Set up medical services, procedures, and their pricing',
      icon: <SettingOutlined />,
      path: '/admin/services',
      priority: 'medium',
    },
    {
      key: 'pharmacy',
      title: 'Setup Pharmacy',
      description: 'Add medicines, manage inventory, and configure suppliers',
      icon: <MedicineBoxOutlined />,
      path: '/pharmacy/medicines',
      priority: 'medium',
    },
    {
      key: 'lab',
      title: 'Configure Laboratory',
      description: 'Set up lab tests, equipment, and sample collection procedures',
      icon: <ExperimentOutlined />,
      path: '/lab/tests',
      priority: 'medium',
    },
    {
      key: 'patients',
      title: 'Add First Patient',
      description: 'Register your first patient to start hospital operations',
      icon: <UserOutlined />,
      path: '/patients/new',
      priority: 'low',
    },
    {
      key: 'appointment',
      title: 'Schedule First Appointment',
      description: 'Book the first appointment to test the complete system workflow',
      icon: <CalendarOutlined />,
      path: '/appointments/new',
      priority: 'low',
    },
  ];

  const handleStepClick = (step: SetupStep) => {
    navigate(step.path);
    if (onStepComplete) {
      onStepComplete(step.key);
    }
  };

  const handleSkipSetup = () => {
    navigate('/');
  };

  const completionPercentage = Math.round((completedSteps.length / setupSteps.length) * 100);
  const highPrioritySteps = setupSteps.filter(step => step.priority === 'high');
  const completedHighPriority = highPrioritySteps.filter(step => completedSteps.includes(step.key)).length;

  return (
    <WizardContainer>
      {/* Welcome Header */}
      <WelcomeCard>
        <Title level={1}>🏥 Welcome to {organizationName}!</Title>
        <Paragraph style={{ fontSize: '18px', marginBottom: '24px' }}>
          Let's get your hospital management system set up in just a few steps. 
          This guided setup will help you configure the essential components to start managing your hospital efficiently.
        </Paragraph>
        <Space size="large">
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: 'white', margin: 0 }}>8</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Setup Steps</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: 'white', margin: 0 }}>~15 min</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Estimated Time</Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ color: 'white', margin: 0 }}>{completedSteps.length}</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Completed</Text>
          </div>
        </Space>
      </WelcomeCard>

      {/* Progress Overview */}
      <ProgressCard>
        <Row gutter={24} align="middle">
          <Col span={16}>
            <Title level={4} style={{ marginBottom: '8px' }}>Setup Progress</Title>
            <Progress 
              percent={completionPercentage} 
              strokeColor={{
                '0%': '#3b82f6',
                '50%': '#6366f1',
                '100%': '#10b981',
              }}
              trailColor="#e5e7eb"
              strokeWidth={8}
            />
            <Text type="secondary">
              {completedHighPriority}/{highPrioritySteps.length} essential steps completed
            </Text>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button 
              type="text" 
              onClick={handleSkipSetup}
              style={{ marginBottom: '8px' }}
            >
              Skip Setup <RightOutlined />
            </Button>
          </Col>
        </Row>
      </ProgressCard>

      {/* Setup Steps Grid */}
      <StepsGrid>
        {setupSteps.map((step) => {
          const isCompleted = completedSteps.includes(step.key);
          
          return (
            <StepCard 
              key={step.key} 
              className={isCompleted ? 'completed' : ''}
              onClick={() => handleStepClick(step)}
            >
              {isCompleted && (
                <CompletionBadge count={<CheckCircleOutlined />} />
              )}
              
              <StepHeader>
                <IconWrapper 
                  priority={step.priority} 
                  className={isCompleted ? 'completed' : ''}
                >
                  {isCompleted ? <CheckCircleOutlined /> : step.icon}
                </IconWrapper>
                <StepTitle level={4}>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </StepHeader>
              
              <ActionButton 
                type="primary" 
                priority={step.priority}
                completed={isCompleted}
                icon={isCompleted ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
              >
                {isCompleted ? 'Completed' : 'Start'}
              </ActionButton>
              
              {step.priority === 'high' && !isCompleted && (
                <div style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  left: '16px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}>
                  Essential
                </div>
              )}
            </StepCard>
          );
        })}
      </StepsGrid>

      {/* Help Section */}
      <HelpCard>
        <QuestionCircleOutlined style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }} />
        <Title level={3} style={{ color: '#2d3436', marginBottom: '16px' }}>Need Help?</Title>
        <Paragraph style={{ color: '#636e72', marginBottom: '24px' }}>
          Check out our documentation or contact support if you need assistance setting up your hospital.
        </Paragraph>
        <Space size="middle">
          <Button icon={<BookOutlined />} size="large">
            View Documentation
          </Button>
          <Button icon={<PhoneOutlined />} type="primary" size="large">
            Contact Support
          </Button>
        </Space>
      </HelpCard>
    </WizardContainer>
  );
};

export default SetupWizardEnhanced;
