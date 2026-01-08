import React, { useState } from 'react';
import { Card, Button, Typography, Progress, Row, Col, Space } from 'antd';
import { 
  TeamOutlined, 
  BankOutlined, 
  UserOutlined, 
  CalendarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
  AppstoreOutlined,
  ShopOutlined,
  ExperimentFilled,
  UserSwitchOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Title, Text } = Typography;

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px;
  background: #fafafa;
  min-height: 100vh;
`;

const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: 48px;
  padding: 60px 24px;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #e91e63, #f06292, #e91e63);
    border-radius: 16px 16px 0 0;
  }
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const SectionDivider = styled.div`
  margin: 32px 0;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e91e63, transparent);
  }
  
  span {
    background: #fafafa;
    padding: 0 16px;
    color: #8c8c8c;
    font-size: 14px;
    font-weight: 500;
  }
`;

const StepCard = styled(Card)<{ priority?: string; completed?: boolean }>`
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => {
      if (props.completed) return '#e91e63';
      switch (props.priority) {
        case 'high': return '#e91e63';
        case 'medium': return '#f06292';
        case 'low': return '#ec407a';
        default: return '#ad1457';
      }
    }};
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(233, 30, 99, 0.15);
    border-color: ${props => {
      if (props.completed) return '#e91e63';
      switch (props.priority) {
        case 'high': return '#e91e63';
        case 'medium': return '#f06292';
        case 'low': return '#ec407a';
        default: return '#ad1457';
      }
    }};
  }
  
  .ant-card-body {
    padding: 28px;
  }
  
  ${props => props.completed && `
    background: linear-gradient(135deg, #fce4ec 0%, #ffffff 100%);
    border-color: #e91e63;
  `}
`;

const IconCircle = styled.div<{ priority?: string; completed?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => {
    if (props.completed) return 'rgba(233, 30, 99, 0.1)';
    switch (props.priority) {
      case 'high': return 'rgba(233, 30, 99, 0.1)';
      case 'medium': return 'rgba(240, 98, 146, 0.1)';
      case 'low': return 'rgba(236, 64, 122, 0.1)';
      default: return 'rgba(173, 20, 87, 0.1)';
    }
  }};
  border: 2px solid ${props => {
    if (props.completed) return '#e91e63';
    switch (props.priority) {
      case 'high': return '#e91e63';
      case 'medium': return '#f06292';
      case 'low': return '#ec407a';
      default: return '#ad1457';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  
  .anticon {
    font-size: 24px;
    color: ${props => {
      if (props.completed) return '#e91e63';
      switch (props.priority) {
        case 'high': return '#e91e63';
        case 'medium': return '#f06292';
        case 'low': return '#ec407a';
        default: return '#ad1457';
      }
    }};
  }
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(233, 30, 99, 0.2);
  }
`;

const StepTitle = styled(Title)`
  &&& {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #262626;
  }
`;

const StepDescription = styled(Text)`
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.5;
  display: block;
  margin-bottom: 16px;
`;

const ActionButton = styled(Button)<{ priority?: string; completed?: boolean }>`
  width: 100%;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
  
  ${props => {
    if (props.completed) {
      return `
        background: #e91e63;
        border-color: #e91e63;
        color: white;
        
        &:hover {
          background: #f06292;
          border-color: #f06292;
          color: white;
        }
      `;
    }
    
    switch (props.priority) {
      case 'high':
        return `
          background: #e91e63;
          border-color: #e91e63;
          color: white;
          
          &:hover {
            background: #f06292;
            border-color: #f06292;
            color: white;
          }
        `;
      case 'medium':
        return `
          background: #f06292;
          border-color: #f06292;
          color: white;
          
          &:hover {
            background: #f48fb1;
            border-color: #f48fb1;
            color: white;
          }
        `;
      case 'low':
        return `
          background: #ec407a;
          border-color: #ec407a;
          color: white;
          
          &:hover {
            background: #f06292;
            border-color: #f06292;
            color: white;
          }
        `;
      default:
        return `
          background: #ad1457;
          border-color: #ad1457;
          color: white;
          
          &:hover {
            background: #c2185b;
            border-color: #c2185b;
            color: white;
          }
        `;
    }
  }}
`;

const ProgressSection = styled.div`
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #e91e63, #f06292, #e91e63);
    border-radius: 16px 16px 0 0;
  }
`;

const PriorityBadge = styled.span<{ priority: string }>`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.priority) {
      case 'high':
        return `
          background: #fce4ec;
          color: #e91e63;
          border: 1px solid #f8bbd9;
        `;
      case 'medium':
        return `
          background: #fce4ec;
          color: #f06292;
          border: 1px solid #f8bbd9;
        `;
      case 'low':
        return `
          background: #fce4ec;
          color: #ec407a;
          border: 1px solid #f8bbd9;
        `;
      default:
        return `
          background: #fce4ec;
          color: #ad1457;
          border: 1px solid #f8bbd9;
        `;
    }
  }}
`;

const CompleteBadge = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: #fce4ec;
  color: #e91e63;
  border: 1px solid #f8bbd9;
`;

const TimeEstimate = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 12px;
  padding: 6px 12px;
  background: rgba(233, 30, 99, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(233, 30, 99, 0.1);
  width: fit-content;
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

interface SetupWizardSleekProps {
  organizationName?: string;
  onStepComplete?: (stepKey: string) => void;
}

const SetupWizardSleek: React.FC<SetupWizardSleekProps> = ({ 
  organizationName = 'your hospital',
  onStepComplete 
}) => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const setupSteps: SetupStep[] = [
    {
      key: 'departments',
      title: 'Configure Departments',
      description: 'Set up medical departments and organizational structure',
      icon: <HomeOutlined />,
      path: '/admin/departments',
      priority: 'high',
      estimatedTime: '3 min',
    },
    {
      key: 'staff',
      title: 'Add Staff Members',
      description: 'Register nurses, receptionists, and administrative staff',
      icon: <UsergroupAddOutlined />,
      path: '/admin/staff',
      priority: 'high',
      estimatedTime: '5 min',
    },
    {
      key: 'doctors',
      title: 'Register Doctors',
      description: 'Add medical professionals and their specializations',
      icon: <UserAddOutlined />,
      path: '/admin/doctors',
      priority: 'high',
      estimatedTime: '4 min',
    },
    {
      key: 'services',
      title: 'Configure Services',
      description: 'Set up medical services and pricing',
      icon: <AppstoreOutlined />,
      path: '/admin/services',
      priority: 'medium',
      estimatedTime: '6 min',
    },
    {
      key: 'pharmacy',
      title: 'Setup Pharmacy',
      description: 'Configure medicine inventory and suppliers',
      icon: <ShopOutlined />,
      path: '/pharmacy/medicines',
      priority: 'medium',
      estimatedTime: '4 min',
    },
    {
      key: 'lab',
      title: 'Configure Laboratory',
      description: 'Set up lab tests and equipment',
      icon: <ExperimentFilled />,
      path: '/lab/tests',
      priority: 'medium',
      estimatedTime: '5 min',
    },
    {
      key: 'patients',
      title: 'Add First Patient',
      description: 'Register your first patient',
      icon: <UserSwitchOutlined />,
      path: '/patients/new',
      priority: 'low',
      estimatedTime: '2 min',
    },
    {
      key: 'appointment',
      title: 'Schedule Appointment',
      description: 'Book your first appointment',
      icon: <ScheduleOutlined />,
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

  const completionPercentage = Math.round((completedSteps.length / setupSteps.length) * 100);
  const highPrioritySteps = setupSteps.filter(step => step.priority === 'high');
  const completedHighPriority = highPrioritySteps.filter(step => completedSteps.includes(step.key)).length;

  return (
    <Container>
      {/* Enhanced Welcome Section */}
      <WelcomeSection>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'linear-gradient(135deg, #e91e63, #f06292)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)'
          }}>
            <span style={{ fontSize: '32px', color: 'white' }}>🏥</span>
          </div>
          <Title level={1} style={{ marginBottom: '16px', color: '#262626', fontSize: '32px' }}>
            Welcome to <span style={{ color: '#e91e63' }}>{organizationName}</span>
          </Title>
          <Text style={{ fontSize: '18px', color: '#595959', lineHeight: '1.6' }}>
            Complete these steps to set up your hospital management system
          </Text>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '32px', 
          marginTop: '32px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e91e63' }}>8</div>
            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Total Steps</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f06292' }}>32min</div>
            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Est. Time</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec407a' }}>3</div>
            <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Essential</div>
          </div>
        </div>
      </WelcomeSection>

      {/* Simple Progress Section */}
      <ProgressSection>
        <Row align="middle" justify="space-between" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0, color: '#262626' }}>
              Setup Progress
            </Title>
          </Col>
          <Col>
            <Text style={{ color: '#8c8c8c' }}>
              {completedSteps.length} of {setupSteps.length} completed
            </Text>
          </Col>
        </Row>
        <Progress 
          percent={completionPercentage} 
          strokeColor={{
            '0%': '#e91e63',
            '50%': '#f06292',
            '100%': '#e91e63',
          }}
          trailColor="#f5f5f5"
          strokeWidth={10}
          showInfo={true}
          format={(percent) => (
            <span style={{ color: '#e91e63', fontWeight: 'bold' }}>
              {percent}%
            </span>
          )}
        />
        <Text style={{ color: '#8c8c8c', fontSize: '14px', marginTop: '8px', display: 'block' }}>
          {completedHighPriority}/{highPrioritySteps.length} essential steps completed
        </Text>
      </ProgressSection>

      {/* Enhanced Steps Grid with Priority Grouping */}
      <div>
        {/* Essential Steps */}
        <SectionDivider>
          <span>🔴 Essential Steps</span>
        </SectionDivider>
        <StepsContainer>
          {setupSteps.filter(step => step.priority === 'high').map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            
            return (
              <StepCard 
                key={step.key} 
                priority={step.priority}
                completed={isCompleted}
                onClick={() => handleStepClick(step)}
                style={{ position: 'relative' }}
              >
                {isCompleted ? (
                  <CompleteBadge>Complete</CompleteBadge>
                ) : (
                  <PriorityBadge priority={step.priority}>Essential</PriorityBadge>
                )}
                
                <IconCircle priority={step.priority} completed={isCompleted}>
                  {isCompleted ? <CheckCircleOutlined /> : step.icon}
                </IconCircle>
                
                <StepTitle level={5}>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                
                <TimeEstimate>
                  <ClockCircleOutlined />
                  <span>{step.estimatedTime}</span>
                </TimeEstimate>
                
                <ActionButton 
                  priority={step.priority}
                  completed={isCompleted}
                  icon={isCompleted ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
                  style={{ marginTop: '16px' }}
                >
                  {isCompleted ? 'Completed' : 'Start Setup'}
                </ActionButton>
              </StepCard>
            );
          })}
        </StepsContainer>

        {/* Important Steps */}
        <SectionDivider>
          <span>🟠 Important Steps</span>
        </SectionDivider>
        <StepsContainer>
          {setupSteps.filter(step => step.priority === 'medium').map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            
            return (
              <StepCard 
                key={step.key} 
                priority={step.priority}
                completed={isCompleted}
                onClick={() => handleStepClick(step)}
                style={{ position: 'relative' }}
              >
                {isCompleted ? (
                  <CompleteBadge>Complete</CompleteBadge>
                ) : (
                  <PriorityBadge priority={step.priority}>Important</PriorityBadge>
                )}
                
                <IconCircle priority={step.priority} completed={isCompleted}>
                  {isCompleted ? <CheckCircleOutlined /> : step.icon}
                </IconCircle>
                
                <StepTitle level={5}>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                
                <TimeEstimate>
                  <ClockCircleOutlined />
                  <span>{step.estimatedTime}</span>
                </TimeEstimate>
                
                <ActionButton 
                  priority={step.priority}
                  completed={isCompleted}
                  icon={isCompleted ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
                  style={{ marginTop: '16px' }}
                >
                  {isCompleted ? 'Completed' : 'Start Setup'}
                </ActionButton>
              </StepCard>
            );
          })}
        </StepsContainer>

        {/* Optional Steps */}
        <SectionDivider>
          <span>🔵 Optional Steps</span>
        </SectionDivider>
        <StepsContainer>
          {setupSteps.filter(step => step.priority === 'low').map((step) => {
            const isCompleted = completedSteps.includes(step.key);
            
            return (
              <StepCard 
                key={step.key} 
                priority={step.priority}
                completed={isCompleted}
                onClick={() => handleStepClick(step)}
                style={{ position: 'relative' }}
              >
                {isCompleted ? (
                  <CompleteBadge>Complete</CompleteBadge>
                ) : (
                  <PriorityBadge priority={step.priority}>Optional</PriorityBadge>
                )}
                
                <IconCircle priority={step.priority} completed={isCompleted}>
                  {isCompleted ? <CheckCircleOutlined /> : step.icon}
                </IconCircle>
                
                <StepTitle level={5}>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
                
                <TimeEstimate>
                  <ClockCircleOutlined />
                  <span>{step.estimatedTime}</span>
                </TimeEstimate>
                
                <ActionButton 
                  priority={step.priority}
                  completed={isCompleted}
                  icon={isCompleted ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
                  style={{ marginTop: '16px' }}
                >
                  {isCompleted ? 'Completed' : 'Start Setup'}
                </ActionButton>
              </StepCard>
            );
          })}
        </StepsContainer>
      </div>

      {/* Simple Skip Option */}
      <div style={{ textAlign: 'center' }}>
        <Button 
          type="text" 
          onClick={() => navigate('/')}
          style={{ color: '#8c8c8c' }}
        >
          Skip setup and go to dashboard
        </Button>
      </div>
    </Container>
  );
};

export default SetupWizardSleek;
