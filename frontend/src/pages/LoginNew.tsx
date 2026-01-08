import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Typography, Checkbox, message, App } from 'antd';
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined, GoogleOutlined, FacebookOutlined, CloseOutlined } from '@ant-design/icons';
import GoogleSignIn from '../components/GoogleSignIn';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
  max-width: 480px;
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
  margin-bottom: 32px;
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
    border-color: #d91f5e;
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
    border-color: #d91f5e;
  }
  
  .ant-input {
    background: transparent;
  }
`;

const RememberRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ForgotLink = styled.a`
  color: #d91f5e;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    color: #b01849;
    text-decoration: underline;
  }
`;

const PrimaryButton = styled(Button)`
  width: 100%;
  height: 52px;
  border-radius: 50px;
  background: #d91f5e;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
  
  &:hover {
    background: #b01849 !important;
  }
`;

const Divider = styled.div`
  text-align: center;
  color: #999;
  font-size: 14px;
  margin: 24px 0;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: #e5e5e5;
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
`;

const SocialButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const SocialButton = styled(Button)`
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e5e5e5;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    border-color: #d91f5e;
    color: #d91f5e;
  }
`;

const LoginNewContent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loginForm] = Form.useForm();
  const { message: msg } = App.useApp();

  // If already logged in, redirect based on role
  useEffect(() => {
    if (user) {
      const role = String(user.role || '').toLowerCase();
      if (role === 'admin' || role === 'super_admin') navigate('/admin/appointments', { replace: true });
      else if (role === 'doctor') navigate('/availability', { replace: true });
      else if (role === 'lab_technician' || role === 'lab_supervisor') navigate('/laboratory/dashboard', { replace: true });
      else if (role === 'pharmacist') navigate('/pharmacy', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const onLoginFinish = async (values: { email: string; password: string; remember?: boolean }) => {
    try {
      if (loading) return;
      setLoading(true);
      await login(values.email, values.password, !!values.remember);
      msg.success('Login successful!');
    } catch (error) {
      msg.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  const onFinishFailed = (info: any) => {
    const first = info?.errorFields?.[0]?.errors?.[0] || 'Please fix the highlighted fields';
    msg.warning(first);
  };

  return (
    <PageContainer>
      <Modal>
        <CloseButton 
          icon={<CloseOutlined />} 
          onClick={() => navigate('/home')}
        />
        
        <LogoContainer>
          <GradientLogo>A</GradientLogo>
          <WelcomeTitle level={3}>Welcome to AyphenHospital</WelcomeTitle>
        </LogoContainer>
        
        <Subtitle>
          Access your health records, book appointments, and manage your healthcare
        </Subtitle>
        
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onLoginFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
          form={loginForm}
        >
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
            label="Password" 
            name="password" 
            rules={[{ required: true, message: 'Please input your password!' }]}
          > 
            <StyledPasswordInput
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="Enter your password"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
              autoComplete="current-password"
            />
          </StyledFormItem>

          <RememberRow>
            <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <ForgotLink href="/forgot-password">Forgot password?</ForgotLink>
          </RememberRow>

          <Form.Item style={{ margin: 0 }}>
            <PrimaryButton 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              Login
            </PrimaryButton>
          </Form.Item>
        </Form>
        
        <Divider>or continue with</Divider>
        
        <SocialButtons>
          <GoogleSignIn block />
          <SocialButton icon={<FacebookOutlined />}>
            Facebook
          </SocialButton>
        </SocialButtons>
      </Modal>
    </PageContainer>
  );
};

const LoginNew: React.FC = () => {
  return (
    <App>
      <LoginNewContent />
    </App>
  );
};

export default LoginNew;
