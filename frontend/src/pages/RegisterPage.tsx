import React from 'react';
import { Layout, Typography, Card } from 'antd';
import RegistrationForm from '../components/auth/RegistrationForm';
import styled, { keyframes } from 'styled-components';
import { HeartOutlined, MedicineBoxOutlined, SolutionOutlined, SafetyOutlined, ScheduleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const RegisterContainer = styled.div`
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
  animation: ${spin} 55s linear infinite; animation-direction: alternate;

  &::before { content: ''; position: absolute; inset: 10px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(2,6,23,0.06); }
  &::after { content: ''; position: absolute; inset: 80px; border-radius: 50%; background: radial-gradient(circle, rgba(217,31,94,0.12), rgba(255,255,255,0)); filter: blur(2px); animation: ${breathe} 6s ease-in-out infinite; }

  .icon { position: absolute; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; color: var(--hl, #d91f5e); background: #ffffff; box-shadow: 0 10px 24px rgba(2,6,23,0.14); animation: ${glow} 8s ease-in-out infinite; }
  .icon::after { content: ''; position: absolute; inset: -8px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--hl, #d91f5e) 35%, transparent) 0%, transparent 70%); opacity: 0; animation: ${pulse} 8s ease-in-out infinite; }
  .center { position: absolute; inset: 120px; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle, rgba(255,255,255,0.98), rgba(255,255,255,0.85)); box-shadow: 0 8px 24px rgba(2,6,23,0.08), inset 0 0 0 2px rgba(2,6,23,0.04); color: #d91f5e; font-size: 64px; animation: ${breathe} 6s ease-in-out infinite; }

  .icon.i1 { animation-delay: 0s; } .icon.i1::after { animation-delay: 0s; }
  .icon.i2 { animation-delay: 1s; } .icon.i2::after { animation-delay: 1s; }
  .icon.i3 { animation-delay: 2s; } .icon.i3::after { animation-delay: 2s; }
  .icon.i4 { animation-delay: 3s; } .icon.i4::after { animation-delay: 3s; }
  .icon.i5 { animation-delay: 4s; } .icon.i5::after { animation-delay: 4s; }
  .icon.i6 { animation-delay: 5s; } .icon.i6::after { animation-delay: 5s; }
  .icon.i7 { animation-delay: 6s; } .icon.i7::after { animation-delay: 6s; }
  .icon.i8 { animation-delay: 7s; } .icon.i8::after { animation-delay: 7s; }

  .c-rose { --hl: #f43f5e; }
  .c-red { --hl: #ef4444; }
  .c-amber { --hl: #f59e0b; }
  .c-green { --hl: #22c55e; }
  .c-cyan { --hl: #06b6d4; }
  .c-teal { --hl: #14b8a6; }
  .c-blue { --hl: #1677ff; }
  .c-violet { --hl: #8b5cf6; }

  @media (hover: hover) {
    &:hover { animation-play-state: paused; .icon { animation-play-state: paused; } &::after, .center { animation-play-state: paused; } }
  }
`;

const RegisterPage: React.FC = () => {
  return (
    <RegisterContainer>
      <LeftPane>
        <Board>
          <Title level={3} style={{ marginBottom: 8, textAlign: 'left' }}>Create an Account</Title>
          <Text style={{ display: 'block', marginBottom: 16, color: '#334155' }}>Join our hospital portal to book appointments and access services.</Text>
          <Card variant="borderless">
            <RegistrationForm />
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              Already have an account? <a href="/login">Login here</a>
            </div>
          </Card>
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
    </RegisterContainer>
  );
};

export default RegisterPage;
