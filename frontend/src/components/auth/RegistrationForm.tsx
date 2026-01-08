import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import api from '../../services/api';

const { Title } = Typography;

const StyledCard = styled(Card)`
  max-width: 500px;
  margin: 2rem auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

interface RegistrationFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegistrationForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [msg, msgCtx] = message.useMessage();
  const navigate = useNavigate();

  const onFinish = async (values: RegistrationFormValues) => {
    setLoading(true);
    try {
      await api.post('/auth/register', values as any, { suppressErrorToast: true } as any);
      msg.success('Registration successful. Please login.');
      navigate('/login');
    } catch (error: any) {
      const m = error?.response?.data?.message || 'Registration failed';
      msg.error(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledCard>
      {msgCtx}
      <Title level={2} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        Create an Account
      </Title>
      <Form
        name="registration"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="firstName"
          rules={[{ required: true, message: 'Please input your first name!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="First Name"
            autoComplete="given-name"
          />
        </Form.Item>

        <Form.Item
          name="lastName"
          rules={[{ required: true, message: 'Please input your last name!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Last Name"
            autoComplete="family-name"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email address!' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            type="email"
            placeholder="Email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[
            { required: true, message: 'Please input your phone number!' },
            { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number!' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Phone Number"
            autoComplete="tel"
            inputMode="tel"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 8, message: 'Password must be at least 8 characters long!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
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
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm Password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{ width: '100%' }}
          >
            Register
          </Button>
        </Form.Item>
      </Form>
    </StyledCard>
  );
};

export default RegistrationForm;
