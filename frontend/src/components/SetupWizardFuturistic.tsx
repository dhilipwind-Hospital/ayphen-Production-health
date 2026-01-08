import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Progress, Row, Col, Badge, Avatar, Tooltip } from 'antd';
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
  PhoneOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  SafetyOutlined,
  GlobalOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';

const { Title, Text, Paragraph } = Typography;

// Futuristic animations
const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`;

const hologram = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

const WizardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const WelcomeCard = styled(Card)`
  margin-bottom: 32px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  animation: ${glow} 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: ${slideInUp} 2s ease-in-out infinite;
  }
  
  .ant-card-body {
    text-align: center;
    padding: 48px 24px;
    position: relative;
    z-index: 1;
  }
  
  h1, h2, p {
    color: white !important;
    margin-bottom: 16px;
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StepCard = styled(Card)<{ priority?: string; isCompleted?: boolean }>`
  border-radius: 20px;
  border: 1px solid ${props => {
    if (props.isCompleted) return 'rgba(16, 185, 129, 0.5)';
    switch (props.priority) {
      case 'high': return 'rgba(239, 68, 68, 0.5)';
      case 'medium': return 'rgba(245, 158, 11, 0.5)';
      case 'low': return 'rgba(59, 130, 246, 0.5)';
      default: return 'rgba(99, 102, 241, 0.5)';
    }
  }};
  background: ${props => {
    if (props.isCompleted) {
      return 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)';
    }
    switch (props.priority) {
      case 'high':
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)';
      case 'medium':
        return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)';
      case 'low':
        return 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)';
    }
  }};
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  animation: ${slideInUp} 0.6s ease-out;
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 40px ${props => {
        if (props.isCompleted) return 'rgba(16, 185, 129, 0.4)';
        switch (props.priority) {
          case 'high': return 'rgba(239, 68, 68, 0.4)';
          case 'medium': return 'rgba(245, 158, 11, 0.4)';
          case 'low': return 'rgba(59, 130, 246, 0.4)';
          default: return 'rgba(99, 102, 241, 0.4)';
        }
      }};
    border-color: ${props => {
      if (props.isCompleted) return 'rgba(16, 185, 129, 0.8)';
      switch (props.priority) {
        case 'high': return 'rgba(239, 68, 68, 0.8)';
        case 'medium': return 'rgba(245, 158, 11, 0.8)';
        case 'low': return 'rgba(59, 130, 246, 0.8)';
        default: return 'rgba(99, 102, 241, 0.8)';
      }
    }};
  }
  
  .ant-card-body {
    padding: 24px;
    position: relative;
    z-index: 1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const IconWrapper = styled.div<{ priority?: string; isCompleted?: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => {
    if (props.isCompleted) {
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  animation: ${props => props.isCompleted ? pulse : 'none'} 2s ease-in-out infinite;
  
  .anticon {
    font-size: 36px;
    color: white;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background: ${props => {
      if (props.isCompleted) return 'conic-gradient(from 0deg, #10b981, #059669, #10b981)';
      switch (props.priority) {
        case 'high': return 'conic-gradient(from 0deg, #ef4444, #dc2626, #ef4444)';
        case 'medium': return 'conic-gradient(from 0deg, #f59e0b, #d97706, #f59e0b)';
        case 'low': return 'conic-gradient(from 0deg, #3b82f6, #2563eb, #3b82f6)';
        default: return 'conic-gradient(from 0deg, #6366f1, #4f46e5, #6366f1)';
      }
    }};
    z-index: -1;
    animation: ${hologram} 2s ease-in-out infinite;
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const StepTitle = styled(Title)`
  &&& {
    font-size: 20px;
    margin-bottom: 12px;
    color: white;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    font-weight: 600;
  }
`;

const StepDescription = styled(Text)`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
`;

const ActionButton = styled(Button)<{ priority?: string; isCompleted?: boolean }>`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  margin-top: 20px;
  border: none;
  position: relative;
  overflow: hidden;
  
  background: ${props => {
    if (props.isCompleted) {
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
  
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
    color: white;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const ProgressCard = styled(Card)`
  margin-bottom: 32px;
  border-radius: 20px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.8) 0%, rgba(26, 26, 46, 0.8) 100%);
  backdrop-filter: blur(20px);
  
  .ant-card-body {
    padding: 24px;
  }
`;

const HelpCard = styled(Card)`
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 20px;
  text-align: center;
  backdrop-filter: blur(20px);
  
  .ant-card-body {
    padding: 40px 24px;
  }
`;

const CompletionBadge = styled(Badge)`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  
  .ant-badge-count {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
`;

const PriorityBadge = styled.div<{ priority: string }>`
  position: absolute;
  top: 16px;
  left: 16px;
  background: ${props => {
    switch (props.priority) {
      case 'high': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'medium': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'low': return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      default: return 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
    }
  }};
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 2;
  backdrop-filter: blur(10px);
`;

const TenantInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(20px);
`;

const TenantBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

interface SetupStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  completed?: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

interface SetupWizardFuturisticProps {
  organizationName?: string;
  onStepComplete?: (stepKey: string) => void;
}

const SetupWizardFuturistic: React.FC<SetupWizardFuturisticProps> = ({ 
  organizationName = 'your hospital',
  onStepComplete 
}) => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const setupSteps: SetupStep[] = [
    {
      key: 'departments',
      title: 'Configure Departments',
      description: 'Set up medical departments with AI-powered organization structure',
      icon: <BankOutlined />,
      path: '/admin/departments',
      priority: 'high',
      estimatedTime: '3 min',
    },
    {
      key: 'staff',
      title: 'Add Staff Members',
      description: 'Onboard your team with smart role assignment and permissions',
      icon: <TeamOutlined />,
      path: '/admin/staff',
      priority: 'high',
      estimatedTime: '5 min',
    },
    {
      key: 'doctors',
      title: 'Register Doctors',
      description: 'Add medical professionals with specialization matching',
      icon: <UserOutlined />,
      path: '/admin/doctors',
      priority: 'high',
      estimatedTime: '4 min',
    },
    {
      key: 'services',
      title: 'Configure Services',
      description: 'Set up medical services with dynamic pricing algorithms',
      icon: <SettingOutlined />,
      path: '/admin/services',
      priority: 'medium',
      estimatedTime: '6 min',
    },
    {
      key: 'pharmacy',
      title: 'Setup Pharmacy',
      description: 'Initialize smart inventory with automated reordering',
      icon: <MedicineBoxOutlined />,
      path: '/pharmacy/medicines',
      priority: 'medium',
      estimatedTime: '4 min',
    },
    {
      key: 'lab',
      title: 'Configure Laboratory',
      description: 'Deploy IoT-enabled lab equipment and digital workflows',
      icon: <ExperimentOutlined />,
      path: '/lab/tests',
      priority: 'medium',
      estimatedTime: '5 min',
    },
    {
      key: 'patients',
      title: 'Add First Patient',
      description: 'Register patient with biometric authentication setup',
      icon: <UserOutlined />,
      path: '/patients/new',
      priority: 'low',
      estimatedTime: '2 min',
    },
    {
      key: 'appointment',
      title: 'Schedule First Appointment',
      description: 'Book appointment with AI-powered scheduling optimization',
      icon: <CalendarOutlined />,
      path: '/appointments/new',
      priority: 'low',
      estimatedTime: '3 min',
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
  const totalEstimatedTime = setupSteps.reduce((acc, step) => acc + parseInt(step.estimatedTime), 0);

  return (
    <WizardContainer>
      {/* Futuristic Welcome Header */}
      <WelcomeCard>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <RobotOutlined style={{ fontSize: '64px', color: '#3b82f6', marginBottom: '16px' }} />
            <Title level={1}>🚀 Welcome to {organizationName}</Title>
            <Paragraph style={{ fontSize: '18px', marginBottom: '24px' }}>
              AI-Powered Hospital Management System • Multi-Tenant Architecture • Cloud-Native Infrastructure
            </Paragraph>
          </div>
          
          {/* Tenant Information */}
          <TenantInfo>
            <TenantBadge>
              <GlobalOutlined />
              Multi-Tenant Instance
            </TenantBadge>
            <TenantBadge>
              <CloudOutlined />
              Cloud Infrastructure
            </TenantBadge>
            <TenantBadge>
              <SafetyOutlined />
              HIPAA Compliant
            </TenantBadge>
            <TenantBadge>
              <DatabaseOutlined />
              Real-time Sync
            </TenantBadge>
          </TenantInfo>
          
          <Row gutter={32} style={{ marginTop: '24px' }}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#3b82f6', margin: 0 }}>8</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Smart Steps</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#10b981', margin: 0 }}>{totalEstimatedTime}min</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Total Time</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#f59e0b', margin: 0 }}>{completedSteps.length}</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Completed</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#8b5cf6', margin: 0 }}>
                  {currentTime.toLocaleTimeString()}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>System Time</Text>
              </div>
            </Col>
          </Row>
        </Space>
      </WelcomeCard>

      {/* Advanced Progress Overview */}
      <ProgressCard>
        <Row gutter={24} align="middle">
          <Col span={18}>
            <Title level={4} style={{ marginBottom: '12px', color: 'white' }}>
              <ThunderboltOutlined style={{ color: '#f59e0b', marginRight: '8px' }} />
              Setup Progress - AI Assisted
            </Title>
            <Progress 
              percent={completionPercentage} 
              strokeColor={{
                '0%': '#ef4444',
                '25%': '#f59e0b',
                '75%': '#3b82f6',
                '100%': '#10b981',
              }}
              trailColor="rgba(255, 255, 255, 0.1)"
              strokeWidth={12}
              format={(percent) => (
                <span style={{ color: 'white', fontWeight: 'bold' }}>
                  {percent}%
                </span>
              )}
            />
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {completedHighPriority}/{highPrioritySteps.length} critical systems online • 
              {setupSteps.length - completedSteps.length} steps remaining
            </Text>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button 
              type="text" 
              onClick={handleSkipSetup}
              style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                marginBottom: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              Skip to Dashboard <RightOutlined />
            </Button>
          </Col>
        </Row>
      </ProgressCard>

      {/* Futuristic Setup Steps Grid */}
      <StepsGrid>
        {setupSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          
          return (
            <StepCard 
              key={step.key} 
              priority={step.priority}
              isCompleted={isCompleted}
              onClick={() => handleStepClick(step)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {isCompleted && (
                <CompletionBadge count={<CheckCircleOutlined />} />
              )}
              
              {!isCompleted && (
                <PriorityBadge priority={step.priority}>
                  {step.priority === 'high' ? 'CRITICAL' : 
                   step.priority === 'medium' ? 'IMPORTANT' : 'OPTIONAL'}
                </PriorityBadge>
              )}
              
              <StepHeader>
                <IconWrapper 
                  priority={step.priority} 
                  isCompleted={isCompleted}
                >
                  {isCompleted ? <CheckCircleOutlined /> : step.icon}
                </IconWrapper>
                <StepTitle level={4}>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                <div style={{ marginTop: '12px' }}>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '8px'
                  }}>
                    ⏱️ {step.estimatedTime}
                  </Text>
                </div>
              </StepHeader>
              
              <ActionButton 
                type="primary" 
                priority={step.priority}
                isCompleted={isCompleted}
                icon={isCompleted ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
              >
                {isCompleted ? 'System Online' : 'Initialize'}
              </ActionButton>
            </StepCard>
          );
        })}
      </StepsGrid>

      {/* Futuristic Help Section */}
      <HelpCard>
        <RobotOutlined style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }} />
        <Title level={3} style={{ color: 'white', marginBottom: '16px' }}>AI Assistant Available</Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px' }}>
          Our intelligent setup assistant can guide you through the configuration process with 
          real-time recommendations and automated optimizations.
        </Paragraph>
        <Space size="middle">
          <Button 
            icon={<BookOutlined />} 
            size="large"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              color: 'white'
            }}
          >
            Smart Documentation
          </Button>
          <Button 
            icon={<PhoneOutlined />} 
            type="primary" 
            size="large"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none'
            }}
          >
            24/7 AI Support
          </Button>
        </Space>
      </HelpCard>
    </WizardContainer>
  );
};

export default SetupWizardFuturistic;
