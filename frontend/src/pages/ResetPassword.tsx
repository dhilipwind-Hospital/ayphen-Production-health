import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Result, Progress } from 'antd';
import { LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import api from '../utils/api';

const { Title, Text } = Typography;

const ResetPasswordContainer = styled.div`
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

const PasswordStrengthIndicator = styled.div`
  margin-top: 8px;
`;

const RequirementsList = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
  font-size: 12px;
  color: #666;
`;

const RequirementItem = styled.li<{ met: boolean }>`
  color: ${props => props.met ? '#52c41a' : '#ff4d4f'};
  margin: 2px 0;
`;

const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token) {
      message.error('Invalid or missing reset token');
      navigate('/login');
    }
  }, [token, navigate]);

  const getPasswordStrength = (pwd: string) => {
    const requirements = {
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      digit: /\d/.test(pwd),
      special: /[@$!%*?&]/.test(pwd)
    };

    const metCount = Object.values(requirements).filter(Boolean).length;
    const percentage = (metCount / 5) * 100;
    
    let status: 'success' | 'normal' | 'exception' = 'exception';
    if (percentage >= 80) status = 'success';
    else if (percentage >= 60) status = 'normal';

    return { requirements, percentage, status };
  };

  const passwordStrength = getPasswordStrength(password);

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    try {
      setLoading(true);
      
      await api.post('/auth/reset-password', {
        token,
        newPassword: values.password
      });

      setResetComplete(true);
      message.success('Password reset successfully!');
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      message.error(error?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!token) {
    return (
      <ResetPasswordContainer>
        <StyledCard>
          <Result
            status="error"
            title="Invalid Reset Link"
            subTitle="The password reset link is invalid or has expired. Please request a new password reset."
            extra={[
              <Button type="primary" key="back" onClick={handleBackToLogin}>
                Back to Login
              </Button>
            ]}
          />
        </StyledCard>
      </ResetPasswordContainer>
    );
  }

  if (resetComplete) {
    return (
      <ResetPasswordContainer>
        <StyledCard>
          <Result
            status="success"
            title="Password Reset Complete!"
            subTitle="Your password has been successfully reset. You can now log in with your new password."
            extra={[
              <Button type="primary" key="login" onClick={handleBackToLogin}>
                Go to Login
              </Button>
            ]}
          />
        </StyledCard>
      </ResetPasswordContainer>
    );
  }

  return (
    <ResetPasswordContainer>
      <StyledCard>
        <BackButton 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBackToLogin}
        >
          Back to Login
        </BackButton>
        
        <StyledTitle level={3}>Reset Password</StyledTitle>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Enter your new password below.
        </Text>

        <Form
          form={form}
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter your new password!' },
              { min: 8, message: 'Password must be at least 8 characters long!' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const { requirements } = getPasswordStrength(value);
                  const allMet = Object.values(requirements).every(Boolean);
                  if (allMet) return Promise.resolve();
                  return Promise.reject(new Error('Password does not meet all requirements'));
                }
              }
            ]}
          >
            <StyledPasswordInput
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          {password && (
            <PasswordStrengthIndicator>
              <Progress 
                percent={passwordStrength.percentage} 
                status={passwordStrength.status}
                size="small"
                showInfo={false}
              />
              <RequirementsList>
                <RequirementItem met={passwordStrength.requirements.length}>
                  {passwordStrength.requirements.length ? <CheckCircleOutlined /> : '○'} At least 8 characters
                </RequirementItem>
                <RequirementItem met={passwordStrength.requirements.upper}>
                  {passwordStrength.requirements.upper ? <CheckCircleOutlined /> : '○'} One uppercase letter
                </RequirementItem>
                <RequirementItem met={passwordStrength.requirements.lower}>
                  {passwordStrength.requirements.lower ? <CheckCircleOutlined /> : '○'} One lowercase letter
                </RequirementItem>
                <RequirementItem met={passwordStrength.requirements.digit}>
                  {passwordStrength.requirements.digit ? <CheckCircleOutlined /> : '○'} One number
                </RequirementItem>
                <RequirementItem met={passwordStrength.requirements.special}>
                  {passwordStrength.requirements.special ? <CheckCircleOutlined /> : '○'} One special character (@$!%*?&)
                </RequirementItem>
              </RequirementsList>
            </PasswordStrengthIndicator>
          )}

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <StyledPasswordInput
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <SubmitButton 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large"
            >
              Reset Password
            </SubmitButton>
          </Form.Item>
        </Form>
      </StyledCard>
    </ResetPasswordContainer>
  );
};

export default ResetPassword;
