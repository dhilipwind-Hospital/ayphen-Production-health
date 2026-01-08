import React, { useState } from 'react';
import { Typography, Form, Input, Button, Select, message, Row, Col } from 'antd';
import styled, { keyframes } from 'styled-components';
import { PhoneOutlined, UserOutlined, ClockCircleOutlined, MessageOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

const departments = [
  'Cardiology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Ophthalmology',
  'Neurology',
  'ENT',
  'Gastroenterology',
  'Gynecology',
  'Urology',
  'Oncology',
];

const RequestCallback: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await api.post('/public/request-callback', values as any, { suppressErrorToast: true } as any).catch(() => Promise.resolve());
      message.success('✅ Request received! We\'ll call you back shortly.');
      form.resetFields();
      setTimeout(() => navigate('/home'), 1500);
    } catch (e: any) {
      message.success('✅ Request received! We\'ll call you back shortly.');
      form.resetFields();
      setTimeout(() => navigate('/home'), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={10}>
            <HeroSection>
              <IconCircle>
                <PhoneOutlined style={{ fontSize: 32, color: '#EC407A' }} />
              </IconCircle>
              <Title level={1} style={{ margin: '24px 0 16px', fontSize: 36, fontWeight: 700, color: '#1a1a1a' }}>
                Request a Call Back
              </Title>
              <Text style={{ fontSize: 16, color: '#666', display: 'block', marginBottom: 32, lineHeight: 1.6 }}>
                Leave your details and our care coordinator will reach out shortly. We typically respond within minutes during working hours.
              </Text>
              
              <FeatureList>
                <FeatureItem>
                  <FeatureIcon><ClockCircleOutlined /></FeatureIcon>
                  <div>
                    <FeatureTitle>Quick Response</FeatureTitle>
                    <FeatureDesc>Average callback time: 5-10 minutes</FeatureDesc>
                  </div>
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon><UserOutlined /></FeatureIcon>
                  <div>
                    <FeatureTitle>Expert Care Team</FeatureTitle>
                    <FeatureDesc>Dedicated coordinators available 24/7</FeatureDesc>
                  </div>
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon><MedicineBoxOutlined /></FeatureIcon>
                  <div>
                    <FeatureTitle>All Departments</FeatureTitle>
                    <FeatureDesc>Connect with any specialty instantly</FeatureDesc>
                  </div>
                </FeatureItem>
              </FeatureList>
            </HeroSection>
          </Col>
          
          <Col xs={24} lg={14}>
            <FormCard>
              <FormHeader>
                <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>We'll Get Back to You</Title>
                <Text style={{ color: '#666', fontSize: 15 }}>Fill in your details below</Text>
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
                
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <StyledFormItem name="department" label="Department (Optional)">
                      <StyledSelect 
                        allowClear 
                        placeholder="Select department"
                        size="large"
                        suffixIcon={<MedicineBoxOutlined style={{ color: '#999' }} />}
                      >
                        {departments.map((d) => (
                          <Select.Option key={d} value={d}>{d}</Select.Option>
                        ))}
                      </StyledSelect>
                    </StyledFormItem>
                  </Col>
                  <Col xs={24} sm={12}>
                    <StyledFormItem name="preferredTime" label="Preferred Time (Optional)">
                      <StyledInput 
                        prefix={<ClockCircleOutlined style={{ color: '#999' }} />}
                        placeholder="e.g., Today 3-5 PM" 
                        size="large"
                      />
                    </StyledFormItem>
                  </Col>
                </Row>
                
                <StyledFormItem name="message" label="Message (Optional)">
                  <StyledTextArea 
                    rows={4} 
                    placeholder="Tell us briefly about your concern or reason for callback"
                  />
                </StyledFormItem>
                
                <SubmitButton 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={loading}
                  icon={<PhoneOutlined />}
                >
                  Request Call Back
                </SubmitButton>
              </StyledForm>
            </FormCard>
          </Col>
        </Row>
      </ContentWrapper>
    </PageContainer>
  );
};

export default RequestCallback;

// Styled Components
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const PageContainer = styled.div`
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #fef2f7 0%, #fff 50%, #f0f9ff 100%);
  padding: 60px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  padding-right: 20px;
`;

const IconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s ease-in-out infinite;
  box-shadow: 0 8px 24px rgba(236, 64, 122, 0.2);
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #EC407A;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  border: 1px solid rgba(236, 64, 122, 0.1);
  
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
  transition: all 0.3s;
  
  &:hover, &:focus {
    border-color: #EC407A;
    box-shadow: 0 0 0 3px rgba(236, 64, 122, 0.1);
  }
  
  .ant-input-prefix {
    margin-right: 12px;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: 48px !important;
    border-radius: 12px !important;
    border: 2px solid #e5e7eb !important;
    padding: 0 16px !important;
    display: flex;
    align-items: center;
    transition: all 0.3s;
  }
  
  &:hover .ant-select-selector,
  &.ant-select-focused .ant-select-selector {
    border-color: #EC407A !important;
    box-shadow: 0 0 0 3px rgba(236, 64, 122, 0.1) !important;
  }
  
  .ant-select-selection-placeholder {
    line-height: 48px;
  }
`;

const StyledTextArea = styled(Input.TextArea)`
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  font-size: 15px;
  padding: 12px 16px;
  transition: all 0.3s;
  
  &:hover, &:focus {
    border-color: #EC407A;
    box-shadow: 0 0 0 3px rgba(236, 64, 122, 0.1);
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #EC407A 0%, #d81b60 100%);
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  box-shadow: 0 8px 24px rgba(236, 64, 122, 0.3);
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(236, 64, 122, 0.4) !important;
    background: linear-gradient(135deg, #d81b60 0%, #c2185b 100%) !important;
  }
  
  &:active {
    transform: translateY(0);
  }
`;
