import React, { useState } from 'react';
import { Form, Input, Button, Typography, Checkbox, message, Steps, Radio, App } from 'antd';
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

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #fef2f7 0%, #fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(217, 31, 94, 0.15);
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
    color: #d91f5e;
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
  background: linear-gradient(135deg, #d91f5e 0%, #14b8a6 100%);
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
    background: #EC407A;
    border-color: #EC407A;
  }
  
  .ant-steps-item-finish .ant-steps-item-icon {
    background: #EC407A;
    border-color: #EC407A;
  }
  
  .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon {
    color: white;
  }
  
  .ant-steps-item-title {
    font-size: 14px !important;
    font-weight: 500 !important;
  }
  
  .ant-steps-item-process .ant-steps-item-title {
    color: #EC407A !important;
    font-weight: 600 !important;
  }
`;

const StepContent = styled.div`
  min-height: 280px;
  margin-bottom: 24px;
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const PrimaryButton = styled(Button)`
  flex: 1;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  background: #EC407A;
  border: none;
  
  &:hover {
    background: #d81b60 !important;
  }
`;

const SecondaryButton = styled(Button)`
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #EC407A;
  color: #EC407A;
  
  &:hover {
    border-color: #d81b60 !important;
    color: #d81b60 !important;
  }
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 16px;
  
  .ant-input, .ant-input-password {
    height: 48px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    font-size: 15px;
    padding-left: 45px;
    
    &:focus, &:hover {
      border-color: #EC407A;
    }
    
    &::placeholder {
      color: #9ca3af;
      font-size: 15px;
    }
  }
  
  .ant-input-affix-wrapper {
    height: 48px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    padding-left: 16px;
    
    &:focus, &:hover, &-focused {
      border-color: #EC407A;
    }
    
    .ant-input {
      padding-left: 8px;
    }
  }
`;

const PasswordStrengthBar = styled.div<{ $strength: number }>`
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$strength}%;
    background: ${props => 
      props.$strength < 33 ? '#ef4444' : 
      props.$strength < 66 ? '#f59e0b' : 
      '#22c55e'
    };
    transition: all 0.3s;
  }
`;

const PasswordStrengthText = styled(Text)<{ $strength: number }>`
  font-size: 12px;
  color: ${props => 
    props.$strength < 33 ? '#ef4444' : 
    props.$strength < 66 ? '#f59e0b' : 
    '#22c55e'
  };
  margin-top: 4px;
  display: block;
`;

const RegisterStepper: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 25;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 33) return 'Weak';
    if (passwordStrength < 66) return 'Medium';
    return 'Strong';
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <UserOutlined />
    },
    {
      title: 'Security',
      icon: <LockOutlined />
    },
    {
      title: 'Confirm',
      icon: <CheckCircleOutlined />
    }
  ];

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['firstName', 'lastName', 'email', 'phone']);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        await form.validateFields(['password', 'confirmPassword']);
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Get all form values including unmounted fields
      const allValues = form.getFieldsValue(true);
      
      const registerData = {
        firstName: allValues.firstName,
        lastName: allValues.lastName,
        email: allValues.email,
        phone: allValues.phone,
        password: allValues.password,
        confirmPassword: allValues.confirmPassword,
        role: 'patient'
      };

      console.log('Registration data:', { ...registerData, password: '***', confirmPassword: '***' });
      console.log('Password length:', registerData.password?.length);
      console.log('Passwords match:', registerData.password === registerData.confirmPassword);

      const response = await api.post('/auth/register', registerData);
      
      if (response.data) {
        message.success('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Registration failed. Please try again.');
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
              name="firstName"
              rules={[{ required: true, message: 'Please enter your first name' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="First Name"
                size="large"
              />
            </StyledFormItem>

            <StyledFormItem
              name="lastName"
              rules={[{ required: true, message: 'Please enter your last name' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="Last Name"
                size="large"
              />
            </StyledFormItem>

            <StyledFormItem
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#999' }} />}
                placeholder="Email Address"
                size="large"
              />
            </StyledFormItem>

            <StyledFormItem
              name="phone"
              rules={[
                { required: true, message: 'Please enter your phone number' },
                { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: '#999' }} />}
                placeholder="Phone Number"
                size="large"
              />
            </StyledFormItem>
          </>
        );

      case 1:
        return (
          <>
            <StyledFormItem
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 8, message: 'Password must be at least 8 characters' },
                { 
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                  message: 'Password must contain uppercase, lowercase, number and special character'
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="Password"
                size="large"
                iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                onChange={(e) => calculatePasswordStrength(e.target.value)}
              />
            </StyledFormItem>
            
            {form.getFieldValue('password') && (
              <>
                <PasswordStrengthBar $strength={passwordStrength} />
                <PasswordStrengthText $strength={passwordStrength}>
                  Password strength: {getPasswordStrengthText()}
                </PasswordStrengthText>
              </>
            )}

            <StyledFormItem
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="Confirm Password"
                size="large"
                iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
              />
            </StyledFormItem>
          </>
        );

      case 2:
        return (
          <>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, color: '#666', display: 'block', marginBottom: 16 }}>
                Please review and accept our terms to complete registration
              </Text>
            </div>

            <StyledFormItem
              name="terms"
              valuePropName="checked"
              validateTrigger="onChange"
              rules={[
                { 
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions'))
                }
              ]}
            >
              <Checkbox>
                I agree to the{' '}
                <a href="/terms" target="_blank" style={{ color: '#EC407A' }}>
                  Terms & Conditions
                </a>
              </Checkbox>
            </StyledFormItem>

            <StyledFormItem
              name="privacy"
              valuePropName="checked"
              validateTrigger="onChange"
              rules={[
                { 
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Please accept the privacy policy'))
                }
              ]}
            >
              <Checkbox>
                I agree to the{' '}
                <a href="/privacy" target="_blank" style={{ color: '#EC407A' }}>
                  Privacy Policy
                </a>
              </Checkbox>
            </StyledFormItem>

            <div style={{ 
              background: '#f0f9ff', 
              padding: 16, 
              borderRadius: 12, 
              marginTop: 16,
              border: '1px solid #bae6fd'
            }}>
              <Text style={{ fontSize: 14, color: '#0369a1' }}>
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                By creating an account, you'll be able to book appointments, access medical records, and manage your healthcare online.
              </Text>
            </div>
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
          <WelcomeTitle>Create Your Account</WelcomeTitle>
        </LogoContainer>

        <Subtitle>
          Join AyphenHospital to access your health records and book appointments
        </Subtitle>

        <StepsContainer>
          <Steps current={currentStep} size="small">
            {steps.map((step, index) => (
              <Steps.Step key={index} title={step.title} icon={step.icon} />
            ))}
          </Steps>
        </StepsContainer>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <StepContent>
            {renderStepContent()}
          </StepContent>

          <NavigationButtons>
            {currentStep > 0 && (
              <SecondaryButton
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
              >
                Back
              </SecondaryButton>
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
              >
                Create Account
              </PrimaryButton>
            )}
          </NavigationButtons>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text style={{ color: '#666', fontSize: '15px' }}>
            Already have an account?{' '}
            <a 
              onClick={() => navigate('/login')} 
              style={{ color: '#EC407A', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            >
              Login
            </a>
          </Text>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default RegisterStepper;
