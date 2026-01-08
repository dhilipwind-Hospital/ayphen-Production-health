import React from 'react';
import { Card, Steps, Button, Typography, Space, Divider } from 'antd';
import { 
  TeamOutlined, 
  BankOutlined, 
  UserOutlined, 
  CalendarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  SettingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const WizardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`;

const WelcomeCard = styled(Card)`
  margin-bottom: 24px;
  background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
  color: white;
  
  .ant-card-body {
    text-align: center;
    padding: 40px 24px;
  }
  
  h2, p {
    color: white !important;
  }
`;

const SetupCard = styled(Card)`
  .ant-steps-item-finish .ant-steps-item-icon {
    background-color: #52c41a;
    border-color: #52c41a;
  }
  
  .ant-steps-item-process .ant-steps-item-icon {
    background-color: #e91e63;
    border-color: #e91e63;
  }
`;

const ActionButton = styled(Button)`
  &.ant-btn-primary {
    background: #e91e63;
    border-color: #e91e63;
    
    &:hover {
      background: #ad1457;
      border-color: #ad1457;
    }
  }
`;

interface SetupStep {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  completed?: boolean;
}

interface SetupWizardProps {
  organizationName?: string;
  onStepComplete?: (stepKey: string) => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ 
  organizationName = 'your hospital',
  onStepComplete 
}) => {
  const navigate = useNavigate();

  const setupSteps: SetupStep[] = [
    {
      key: 'departments',
      title: 'Configure Departments',
      description: 'Set up medical departments like Cardiology, Pediatrics, etc.',
      icon: <BankOutlined />,
      path: '/admin/departments',
    },
    {
      key: 'staff',
      title: 'Add Staff Members',
      description: 'Add nurses, receptionists, and administrative staff',
      icon: <TeamOutlined />,
      path: '/admin/staff',
    },
    {
      key: 'doctors',
      title: 'Add Doctors',
      description: 'Register doctors and assign them to departments',
      icon: <UserOutlined />,
      path: '/admin/doctors',
    },
    {
      key: 'services',
      title: 'Configure Services',
      description: 'Set up medical services and their pricing',
      icon: <SettingOutlined />,
      path: '/admin/services',
    },
    {
      key: 'pharmacy',
      title: 'Setup Pharmacy',
      description: 'Add medicines and configure inventory',
      icon: <MedicineBoxOutlined />,
      path: '/pharmacy/medicines',
    },
    {
      key: 'lab',
      title: 'Configure Laboratory',
      description: 'Set up lab tests and equipment',
      icon: <ExperimentOutlined />,
      path: '/lab/tests',
    },
    {
      key: 'patients',
      title: 'Add First Patient',
      description: 'Register your first patient to start operations',
      icon: <UserOutlined />,
      path: '/patients/new',
    },
    {
      key: 'appointment',
      title: 'Schedule First Appointment',
      description: 'Book the first appointment to test the system',
      icon: <CalendarOutlined />,
      path: '/appointments/new',
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

  return (
    <WizardContainer>
      <WelcomeCard>
        <Title level={2} style={{ margin: 0, color: 'white' }}>
          Welcome to {organizationName}! 🏥
        </Title>
        <Paragraph style={{ fontSize: '16px', margin: '16px 0 0 0', color: 'white' }}>
          Let's get your hospital management system set up. Follow these steps to configure your system and start managing patients.
        </Paragraph>
      </WelcomeCard>

      <SetupCard title="Setup Checklist" extra={
        <ActionButton type="default" onClick={handleSkipSetup}>
          Skip Setup
        </ActionButton>
      }>
        <Steps direction="vertical" current={-1}>
          {setupSteps.map((step, index) => (
            <Step
              key={step.key}
              title={
                <Space>
                  <span>{step.title}</span>
                  {step.completed && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                </Space>
              }
              description={
                <div>
                  <Text type="secondary">{step.description}</Text>
                  <div style={{ marginTop: 8 }}>
                    <ActionButton 
                      type="primary" 
                      size="small"
                      onClick={() => handleStepClick(step)}
                    >
                      {step.completed ? 'Review' : 'Start'}
                    </ActionButton>
                  </div>
                </div>
              }
              icon={step.icon}
              status={step.completed ? 'finish' : 'wait'}
            />
          ))}
        </Steps>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Title level={4}>Need Help?</Title>
          <Paragraph type="secondary">
            Check out our documentation or contact support if you need assistance setting up your hospital.
          </Paragraph>
          <Space>
            <Button type="default">View Documentation</Button>
            <Button type="default">Contact Support</Button>
          </Space>
        </div>
      </SetupCard>
    </WizardContainer>
  );
};

export default SetupWizard;
