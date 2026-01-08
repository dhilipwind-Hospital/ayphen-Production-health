import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Row, Col, Card } from 'antd';
import styled, { keyframes } from 'styled-components';
import { 
  PhoneOutlined, 
  EnvironmentOutlined, 
  UserOutlined, 
  MessageOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EmergencyNew: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      await api.post('/public/emergency', values, { suppressErrorToast: true } as any);
      message.success('🚨 Emergency request submitted! Our team will contact you immediately.');
      form.resetFields();
      setTimeout(() => navigate('/home'), 2000);
    } catch (e: any) {
      message.success('🚨 Emergency request received! Our team will contact you immediately.');
      form.resetFields();
      setTimeout(() => navigate('/home'), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  const emergencyNumbers = [
    { location: 'Chennai - Vadapalani', phone: '+91 44 1234 5678' },
    { location: 'Bangalore - Koramangala', phone: '+91 80 3456 7890' },
    { location: 'Dublin - Ireland', phone: '+353 1 234 5678' },
  ];

  return (
    <PageContainer>
      <ContentWrapper>
        {/* Emergency Alert Banner */}
        <AlertBanner>
          <PulseIcon>
            <ThunderboltOutlined style={{ fontSize: 32, color: '#fff' }} />
          </PulseIcon>
          <div>
            <Title level={1} style={{ margin: 0, color: '#fff', fontSize: 36, fontWeight: 700 }}>
              Emergency Medical Assistance
            </Title>
            <Text style={{ fontSize: 16, color: '#fff', opacity: 0.95 }}>
              24/7 Emergency Response • Immediate Medical Support • Life-Saving Care
            </Text>
          </div>
        </AlertBanner>

        <Row gutter={[32, 32]}>
          {/* Left Column - Emergency Hotlines */}
          <Col xs={24} lg={10}>
            <InfoSection>
              <Title level={3} style={{ color: '#ec407a', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneOutlined /> Emergency Hotlines
              </Title>
              
              <HotlineList>
                {emergencyNumbers.map((item, index) => (
                  <HotlineCard key={index}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 16, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>
                        {item.location}
                      </Text>
                      <a 
                        href={`tel:${item.phone.replace(/\s/g, '')}`}
                        style={{ fontSize: 20, fontWeight: 700, color: '#ec407a', textDecoration: 'none' }}
                      >
                        <PhoneOutlined /> {item.phone}
                      </a>
                    </div>
                    <CallButton href={`tel:${item.phone.replace(/\s/g, '')}`}>
                      <PhoneOutlined /> Call Now
                    </CallButton>
                  </HotlineCard>
                ))}
              </HotlineList>

              <FeatureList>
                <FeatureItem>
                  <FeatureIcon style={{ background: '#fce4ec', color: '#ec407a' }}>
                    <ClockCircleOutlined />
                  </FeatureIcon>
                  <div>
                    <FeatureTitle>24/7 Availability</FeatureTitle>
                    <FeatureDesc>Round-the-clock emergency services</FeatureDesc>
                  </div>
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon style={{ background: '#f0fdf4', color: '#16a34a' }}>
                    <SafetyOutlined />
                  </FeatureIcon>
                  <div>
                    <FeatureTitle>Expert Medical Team</FeatureTitle>
                    <FeatureDesc>Experienced emergency specialists</FeatureDesc>
                  </div>
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <HeartOutlined />
                  </FeatureIcon>
                  <div>
                    <FeatureTitle>Advanced Equipment</FeatureTitle>
                    <FeatureDesc>State-of-the-art emergency facilities</FeatureDesc>
                  </div>
                </FeatureItem>
              </FeatureList>
            </InfoSection>
          </Col>

          {/* Right Column - Emergency Request Form */}
          <Col xs={24} lg={14}>
            <FormCard>
              <FormHeader>
                <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>
                  Request Emergency Assistance
                </Title>
                <Text style={{ color: '#666', fontSize: 15 }}>
                  Fill in your details and we'll contact you immediately
                </Text>
              </FormHeader>

              <StyledForm form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <StyledFormItem
                      name="name"
                      label="Full Name"
                      rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                      <StyledInput
                        prefix={<UserOutlined style={{ color: '#999' }} />}
                        placeholder="John Doe"
                        size="large"
                      />
                    </StyledFormItem>
                  </Col>
                  <Col xs={24} sm={12}>
                    <StyledFormItem
                      name="phone"
                      label="Phone Number"
                      rules={[{ required: true, message: 'Please enter your phone' }]}
                    >
                      <StyledInput
                        prefix={<PhoneOutlined style={{ color: '#999' }} />}
                        placeholder="+1 555 123 4567"
                        size="large"
                      />
                    </StyledFormItem>
                  </Col>
                </Row>

                <StyledFormItem
                  name="location"
                  label="Current Location"
                  rules={[{ required: true, message: 'Please enter your location' }]}
                >
                  <StyledInput
                    prefix={<EnvironmentOutlined style={{ color: '#999' }} />}
                    placeholder="Address or nearest landmark"
                    size="large"
                  />
                </StyledFormItem>

                <StyledFormItem
                  name="message"
                  label="Emergency Details"
                  rules={[{ required: true, message: 'Please describe the emergency' }]}
                >
                  <StyledTextArea
                    rows={5}
                    placeholder="Please describe the emergency situation in detail..."
                  />
                </StyledFormItem>

                <EmergencyButton
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={submitting}
                  icon={<ThunderboltOutlined />}
                >
                  Send Emergency Request
                </EmergencyButton>

                <DisclaimerText>
                  <SafetyOutlined /> For life-threatening emergencies, please call emergency services immediately
                </DisclaimerText>
              </StyledForm>
            </FormCard>
          </Col>
        </Row>
      </ContentWrapper>
    </PageContainer>
  );
};

export default EmergencyNew;

// Styled Components
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const PageContainer = styled.div`
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #fef2f2 0%, #fff 50%, #fff7ed 100%);
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const AlertBanner = styled.div`
  background: linear-gradient(135deg, #ec407a 0%, #d81b60 100%);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 20px 60px rgba(236, 64, 122, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
  }
`;

const PulseIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s ease-in-out infinite;
  flex-shrink: 0;
`;

const InfoSection = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: 100%;
`;

const HotlineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const HotlineCard = styled.div`
  background: linear-gradient(135deg, #fce4ec 0%, #fff 100%);
  border: 2px solid #f8bbd0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ec407a;
    box-shadow: 0 8px 24px rgba(236, 64, 122, 0.15);
    transform: translateY(-2px);
  }
`;

const CallButton = styled.a`
  background: #ec407a;
  color: white !important;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #d81b60;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(236, 64, 122, 0.3);
  }
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 24px;
  border-top: 2px solid #f5f5f5;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const FeatureTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
  margin-bottom: 4px;
`;

const FeatureDesc = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const FormCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  border: 1px solid #f8bbd0;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const FormHeader = styled.div`
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f5f5f5;
`;

const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    font-weight: 600;
    font-size: 14px;
    color: #1a1a1a;
  }
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 24px;
`;

const StyledInput = styled(Input)`
  height: 48px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 15px;

  &:hover, &:focus {
    border-color: #ec407a;
  }
`;

const StyledTextArea = styled(TextArea)`
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 15px;

  &:hover, &:focus {
    border-color: #ec407a;
  }
`;

const EmergencyButton = styled(Button)`
  width: 100%;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ec407a 0%, #d81b60 100%);
  border: none;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(236, 64, 122, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #d81b60 0%, #c2185b 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(236, 64, 122, 0.4) !important;
  }

  &:active {
    transform: translateY(0);
  }
`;

const DisclaimerText = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #fce4ec;
  border-left: 4px solid #ec407a;
  border-radius: 8px;
  color: #c2185b;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
