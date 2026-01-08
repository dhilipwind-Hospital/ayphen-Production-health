import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Result } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../utils/api';

const { Title, Text } = Typography;

const ForgotPasswordContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #fce4ec 0%, #fff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const StyledCard = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(233, 30, 99, 0.15);
  max-width: 480px;
  width: 100%;
  padding: 40px 32px;
  position: relative;
`;

const StyledTitle = styled(Title)`
  text-align: center;
  margin-bottom: 8px !important;
  color: #e91e63;
  font-weight: 600;
`;

const BackButton = styled(Button)`
  margin-bottom: 16px;
  border: none;
  background: transparent;
  color: #666;
  padding: 4px 8px;
  height: auto;
  
  &:hover {
    color: #e91e63;
    background: transparent;
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 52px;
  border-radius: 50px;
  background: #e91e63;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
  
  &:hover {
    background: #ad1457 !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(233, 30, 99, 0.3);
  }
  
  &:active {
    transform: translateY(0);
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

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/forgot-password', {
        email: values.email
      });

      setEmailSent(true);
      message.success('Password reset instructions sent to your email!');
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      message.error(error?.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (emailSent) {
    return (
      <ForgotPasswordContainer>
        <StyledCard>
          <Result
            status="success"
            title="Email Sent!"
            subTitle="We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password."
            extra={[
              <Button type="primary" key="back" onClick={handleBackToLogin}>
                Back to Login
              </Button>
            ]}
          />
        </StyledCard>
      </ForgotPasswordContainer>
    );
  }

  return (
    <ForgotPasswordContainer>
      <StyledCard>
        <BackButton 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBackToLogin}
        >
          Back to Login
        </BackButton>
        
        <StyledTitle level={3}>Forgot Password?</StyledTitle>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        <Form
          form={form}
          name="forgot-password"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email address!' },
              { type: 'email', message: 'Please enter a valid email address!' },
            ]}
          >
            <StyledInput
              prefix={<UserOutlined />}
              placeholder="Enter your email address"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item>
            <SubmitButton 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large"
            >
              Send Reset Instructions
            </SubmitButton>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Remember your password?{' '}
            <Button type="link" onClick={handleBackToLogin} style={{ padding: 0 }}>
              Sign in here
            </Button>
          </Text>
        </div>
      </StyledCard>
    </ForgotPasswordContainer>
  );
};

export default ForgotPassword;
