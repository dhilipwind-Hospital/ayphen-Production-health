import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined, HeartOutlined, MedicineBoxOutlined, SolutionOutlined, SafetyOutlined, ScheduleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const { Title } = Typography;

const LoginContainer = styled.div`
  min-height: 100svh;
  width: 100%;
  background: linear-gradient(to right, #d91f5e 0 50%, #fef2f7 50% 100%);
  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: 960px) { grid-template-columns: 1fr 1fr; }
`;

const LeftPane = styled.div`
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;

const RightPane = styled.div`
  position: relative; display: none; align-items: center; justify-content: center; padding: 24px;
  @media (min-width: 960px) { display: flex; }
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  .ant-card-head {
    text-align: center;
  }
`;

const StyledTitle = styled(Title)`
  text-align: center;
  margin-bottom: 24px !important;
  color: #d91f5e;
`;

const LoginButton = styled(Button)`
  width: 100%;
`;

const FooterCredit = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 10px;
  text-align: center;
  color: rgba(15, 23, 42, 0.75);
  font-weight: 600;
`;

const Board = styled.div`
  width: 100%; max-width: 640px; background: #fff; border-radius: 16px;
  box-shadow: 0 16px 40px rgba(2,6,23,0.12);
  padding: 24px;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const breathe = keyframes`
  0%, 100% { opacity: .55; transform: scale(1); }
  50% { opacity: .95; transform: scale(1.06); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 8px 18px rgba(2,6,23,0.10); color: var(--hl, #d91f5e); }
  10% { box-shadow: 0 10px 22px rgba(2,6,23,0.14); color: var(--hl, #d91f5e); }
  15% { box-shadow: 0 8px 18px rgba(2,6,23,0.10); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0; transform: scale(1); }
  10% { opacity: .9; transform: scale(1.08); }
  15% { opacity: 0; transform: scale(1); }
`;

const Ring = styled.div`
  position: relative; width: 420px; height: 420px; border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 58%, transparent 59%);
  box-shadow: inset 0 0 0 2px rgba(0,0,0,0.04);
  animation: ${spin} 55s linear infinite;
  animation-direction: alternate;

  &::before { content: ''; position: absolute; inset: 10px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(2,6,23,0.06); }
  &::after { content: ''; position: absolute; inset: 80px; border-radius: 50%; background: radial-gradient(circle, rgba(14,165,233,0.12), rgba(255,255,255,0)); filter: blur(2px); animation: breathe 6s ease-in-out infinite; }

  .icon {
    position: absolute; width: 52px; height: 52px; border-radius: 50%;
    display: grid; place-items: center; color: var(--hl, #d91f5e); background: #ffffff;
    box-shadow: 0 10px 24px rgba(2,6,23,0.14);
    animation: ${glow} 8s ease-in-out infinite;
  }
  .icon::after { content: ''; position: absolute; inset: -8px; border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--hl, #d91f5e) 35%, transparent) 0%, transparent 70%);
    opacity: 0; animation: ${pulse} 8s ease-in-out infinite; }
  .center { position: absolute; inset: 120px; border-radius: 50%; display: grid; place-items: center; 
    background: radial-gradient(circle, rgba(255,255,255,0.98), rgba(255,255,255,0.85));
    box-shadow: 0 8px 24px rgba(2,6,23,0.08), inset 0 0 0 2px rgba(2,6,23,0.04);
    color: #d91f5e; font-size: 64px; animation: ${breathe} 6s ease-in-out infinite; }

  .icon.i1 { animation-delay: 0s; } .icon.i1::after { animation-delay: 0s; }
  .icon.i2 { animation-delay: 1s; } .icon.i2::after { animation-delay: 1s; }
  .icon.i3 { animation-delay: 2s; } .icon.i3::after { animation-delay: 2s; }
  .icon.i4 { animation-delay: 3s; } .icon.i4::after { animation-delay: 3s; }
  .icon.i5 { animation-delay: 4s; } .icon.i5::after { animation-delay: 4s; }
  .icon.i6 { animation-delay: 5s; } .icon.i6::after { animation-delay: 5s; }
  .icon.i7 { animation-delay: 6s; } .icon.i7::after { animation-delay: 6s; }
  .icon.i8 { animation-delay: 7s; } .icon.i8::after { animation-delay: 7s; }

  /* Color utilities for icon highlight */
  .c-rose { --hl: #d91f5e; }
  .c-red { --hl: #ef4444; }
  .c-amber { --hl: #f59e0b; }
  .c-green { --hl: #22c55e; }
  .c-cyan { --hl: #06b6d4; }
  .c-teal { --hl: #14b8a6; }
  .c-pink { --hl: #d91f5e; }
  .c-violet { --hl: #8b5cf6; }

  @media (hover: hover) {
    &:hover {
      animation-play-state: paused;
      .icon { animation-play-state: paused; }
      &::after, .center { animation-play-state: paused; }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    .icon { animation: none; }
  }
`;


const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [msg, msgCtx] = message.useMessage();

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

  const onFinish = async (values: { email: string; password: string; remember?: boolean }) => {
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
    <LoginContainer>
      {msgCtx}
      <LeftPane>
        <Board>
          <StyledTitle level={3} style={{ textAlign: 'left', marginBottom: 8 }}>HOSPITAL</StyledTitle>
          <Typography.Text style={{ display: 'block', marginBottom: 16, color: '#334155' }}>Management Service</Typography.Text>
          <StyledCard variant="borderless">
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              layout="vertical"
              form={form}
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input
                  data-testid="login-email-input"
                  prefix={<UserOutlined />}
                  placeholder="Email"
                  size="large"
                  autoComplete="email"
                  onPressEnter={() => form.submit()}
                />
              </Form.Item>

              <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please input your password!' }]}> 
                <Input.Password
                  data-testid="login-password-input"
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                  autoComplete="current-password"
                  onPressEnter={() => form.submit()}
                />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 8 }}>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span />
                <a href="/forgot-password">Forgot password?</a>
              </div>

              <Form.Item>
                <LoginButton data-testid="login-submit-button" type="primary" htmlType="submit" loading={loading} size="large" onClick={() => form.submit()}>
                  Log in
                </LoginButton>
              </Form.Item>
            </Form>
          </StyledCard>
        </Board>
      </LeftPane>
      <RightPane aria-hidden>
        <Ring>
          <div className="center"><MedicineBoxOutlined /></div>
          <div className="icon i1 c-rose" style={{ left: '50%', top: '-22px', transform: 'translateX(-50%)' }}><HeartOutlined /></div>
          <div className="icon i2 c-green" style={{ right: '-22px', top: '50%', transform: 'translateY(-50%)' }}><MedicineBoxOutlined /></div>
          <div className="icon i3 c-amber" style={{ left: '50%', bottom: '-22px', transform: 'translateX(-50%)' }}><ScheduleOutlined /></div>
          <div className="icon i4 c-cyan" style={{ left: '-22px', top: '50%', transform: 'translateY(-50%)' }}><SafetyOutlined /></div>
          <div className="icon i5 c-violet" style={{ left: '10%', top: '18%' }}><SolutionOutlined /></div>
          <div className="icon i6 c-blue" style={{ right: '10%', top: '18%' }}><HeartOutlined /></div>
          <div className="icon i7 c-teal" style={{ left: '10%', bottom: '18%' }}><MedicineBoxOutlined /></div>
          <div className="icon i8 c-red" style={{ right: '10%', bottom: '18%' }}><SafetyOutlined /></div>
        </Ring>
      </RightPane>
      <FooterCredit>Developed By DHILIP</FooterCredit>
    </LoginContainer>
  );
};

export default Login;
