import React, { useState } from 'react';
import { Form, Input, Button, Typography, Checkbox, Steps, Radio, App } from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  PhoneOutlined, 
  EyeInvisibleOutlined, 
  EyeOutlined, 
  UserOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';

const { Title, Text } = Typography;
const { Step } = Steps;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #fce4ec 0%, #fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(233, 30, 99, 0.15);
  max-width: 520px;
  width: 100%;
  padding: 40px 32px;
  position: relative;
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: transparent;
  color: #999;
  
  &:hover {
    color: #e91e63;
    background: transparent;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const GradientLogo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e91e63 0%, #ad1457 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 700;
`;

const WelcomeTitle = styled(Title)`
  margin: 0 !important;
  font-size: 24px !important;
  font-weight: 600 !important;
  color: #1a1a1a;
`;

const Subtitle = styled(Text)`
  display: block;
  color: #666;
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 24px;
`;

const StepsContainer = styled.div`
  margin-bottom: 32px;
  
  .ant-steps-item-process .ant-steps-item-icon {
    background: #e91e63;
    border-color: #e91e63;
  }
  
  .ant-steps-item-finish .ant-steps-item-icon {
    background: #e91e63;
    border-color: #e91e63;
  }
`;

const StyledFormItem = styled(Form.Item)`
  .ant-form-item-label > label {
    font-weight: 500;
    color: #1a1a1a;
  }
`;

const StyledInput = styled(Input)`
  height: 52px;
  border-radius: 12px;
  background: #f5f5f5;
  border: 2px solid transparent;
  font-size: 15px;
  
  &:hover, &:focus {
    background: white;
    border-color: #e91e63;
  }
  
  .ant-input {
    background: transparent;
  }
`;

const StyledPasswordInput = styled(Input.Password)`
  height: 52px;
  border-radius: 12px;
  background: #f5f5f5;
  border: 2px solid transparent;
  font-size: 15px;
  
  &:hover, &:focus {
    background: white;
    border-color: #e91e63;
  }
  
  .ant-input {
    background: transparent;
  }
`;

const PrimaryButton = styled(Button)`
  height: 52px;
  border-radius: 50px;
  background: #e91e63;
  border: none;
  font-size: 16px;
  font-weight: 600;
  
  &:hover {
    background: #ad1457 !important;
  }
`;

const SecondaryButton = styled(Button)`
  height: 52px;
  border-radius: 50px;
  border: 2px solid #e5e5e5;
  font-size: 16px;
  font-weight: 600;
  
  &:hover {
    border-color: #e91e63;
    color: #e91e63;
  }
`;

const NavigationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  gap: 16px;
`;

const SummaryCard = styled.div`
  background: #fce4ec;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RegisterFixedContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [formData, setFormData] = useState<any>({});

  const steps = [
    {
      title: 'Personal Info',
      icon: <UserOutlined />,
    },
    {
      title: 'Account Setup',
      icon: <LockOutlined />,
    },
    {
      title: 'Verification',
      icon: <CheckCircleOutlined />,
    },
  ];

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setFormData({ ...formData, ...values });
      setCurrentStep(currentStep + 1);
    } catch (error) {
      message.warning('Please fill in all required fields correctly');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const finalData = { ...formData, ...values };
      
      const full = String(finalData.fullName || '').trim();
      const parts = full.split(/\s+/);
      const first = parts[0] || full;
      const last = parts.slice(1).join(' ') || first; // fallback to first when single-word name

      const registerData = {
        email: String(finalData.email || '').trim(),
        phone: String(finalData.phone || '').trim(),
        password: finalData.password,
        confirmPassword: finalData.confirmPassword,
        firstName: first,
        lastName: last,
        role: finalData.userType || 'patient',
        agreeToTerms: finalData.agreeToTerms
      };
      
      await api.post('/auth/register', registerData);
      message.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      const backendMsg = error?.response?.data?.message;
      const backendErrors = error?.response?.data?.errors;
      const firstDetail = Array.isArray(backendErrors) && backendErrors.length
        ? Object.values(backendErrors[0] || {})[0]
        : undefined;
      message.error(backendMsg || (firstDetail as string) || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <StyledFormItem
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <StyledInput
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="John Doe"
              />
            </StyledFormItem>

            <StyledFormItem
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <StyledInput
                prefix={<MailOutlined style={{ color: '#999' }} />}
                placeholder="your.email@example.com"
                autoComplete="email"
              />
            </StyledFormItem>

            <StyledFormItem
              label="Phone Number"
              name="phone"
              rules={[
                { required: true, message: 'Please input your phone number!' },
                { min: 7, max: 20, message: 'Phone number must be 7-20 characters' },
                { pattern: /^[+]?[\d\s-()]+$/, message: 'Please enter a valid phone number!' },
              ]}
            >
              <StyledInput
                prefix={<PhoneOutlined style={{ color: '#999' }} />}
                placeholder="+91 98765 43210"
              />
            </StyledFormItem>
          </>
        );

      case 1:
        return (
          <>
            <StyledFormItem 
              label="Password" 
              name="password" 
              rules={[
                { required: true, message: 'Please input your password!' },
                ({ getFieldValue }) => ({
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const violations: string[] = [];
                    if (!/^.{8,}$/.test(value)) violations.push('at least 8 characters');
                    if (!/[A-Z]/.test(value)) violations.push('one uppercase letter');
                    if (!/[a-z]/.test(value)) violations.push('one lowercase letter');
                    if (!/\d/.test(value)) violations.push('one number');
                    if (!/[@$!%*?&]/.test(value)) violations.push('one special character (@$!%*?&)');
                    return violations.length ? Promise.reject(new Error(`Password must contain ${violations.join(', ')}`)) : Promise.resolve();
                  }
                })
              ]}
            > 
              <StyledPasswordInput
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="At least 8 chars, include upper, lower, number, special"
                iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                autoComplete="new-password"
              />
            </StyledFormItem>

            <StyledFormItem 
              label="Confirm Password" 
              name="confirmPassword" 
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            > 
              <StyledPasswordInput
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="Re-enter your password"
                iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                autoComplete="new-password"
              />
            </StyledFormItem>

            <StyledFormItem
              label="I am a"
              name="userType"
              rules={[{ required: true, message: 'Please select your user type!' }]}
            >
              <Radio.Group>
                <Radio value="patient">Patient</Radio>
                <Radio value="doctor">Healthcare Provider</Radio>
              </Radio.Group>
            </StyledFormItem>
          </>
        );

      case 2:
        return (
          <>
            <Title level={4} style={{ marginBottom: '24px', color: '#e91e63' }}>
              Review & Confirm
            </Title>
            
            <SummaryCard>
              <SummaryItem>
                <Text strong>Full Name:</Text>
                <Text>{formData.fullName}</Text>
              </SummaryItem>
              <SummaryItem>
                <Text strong>Email:</Text>
                <Text>{formData.email}</Text>
              </SummaryItem>
              <SummaryItem>
                <Text strong>Phone:</Text>
                <Text>{formData.phone}</Text>
              </SummaryItem>
              <SummaryItem>
                <Text strong>Account Type:</Text>
                <Text>{formData.userType === 'patient' ? 'Patient' : 'Healthcare Provider'}</Text>
              </SummaryItem>
            </SummaryCard>

            <Form.Item 
              name="agreeToTerms" 
              valuePropName="checked"
              rules={[
                { 
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions')),
                },
              ]}
            >
              <Checkbox>
                I agree to the <a href="/terms" style={{ color: '#e91e63' }}>Terms & Conditions</a> and <a href="/privacy" style={{ color: '#e91e63' }}>Privacy Policy</a>
              </Checkbox>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <Modal>
        <CloseButton 
          icon={<CloseOutlined />} 
          onClick={() => navigate('/login')}
        />
        
        <LogoContainer>
          <GradientLogo>A</GradientLogo>
          <WelcomeTitle level={3}>Create Your Account</WelcomeTitle>
        </LogoContainer>
        
        <Subtitle>
          Join thousands of users managing their healthcare with Ayphen Care
        </Subtitle>
        
        <StepsContainer>
          <Steps current={currentStep} size="small">
            {steps.map((step, index) => (
              <Step key={index} title={step.title} icon={step.icon} />
            ))}
          </Steps>
        </StepsContainer>
        
        <Form
          form={form}
          layout="vertical"
          initialValues={formData}
        >
          {renderStepContent()}
          
          <NavigationRow>
            {currentStep > 0 && (
              <SecondaryButton 
                icon={<ArrowLeftOutlined />}
                onClick={handlePrevious}
              >
                Previous
              </SecondaryButton>
            )}
            
            {currentStep === 0 && (
              <div style={{ flex: 1 }} />
            )}
            
            {currentStep < steps.length - 1 ? (
              <PrimaryButton 
                type="primary"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
              >
                Next
              </PrimaryButton>
            ) : (
              <PrimaryButton 
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                icon={<CheckCircleOutlined />}
                iconPosition="end"
              >
                Create Account
              </PrimaryButton>
            )}
          </NavigationRow>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Text>
            Already have an account? <a href="/login" style={{ color: '#e91e63', fontWeight: 500 }}>Sign in</a>
          </Text>
        </div>
      </Modal>
    </PageContainer>
  );
};

const RegisterFixed: React.FC = () => {
  return (
    <App>
      <RegisterFixedContent />
    </App>
  );
};

export default RegisterFixed;
