import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Steps,
  Card,
  Typography,
  Space,
  message,
  Select,
  Checkbox,
  Row,
  Col,
  App,
} from 'antd';
import {
  MedicineBoxOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './OrganizationSignup.css';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

interface OrganizationData {
  name: string;
  subdomain: string;
  description?: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  plan: string;
}

const OrganizationSignupContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'professional';

  const [formData, setFormData] = useState<Partial<OrganizationData>>({
    plan: planFromUrl,
  });

  const handleNext = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setFormData({ ...formData, ...values });
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await form.validateFields();
      const values = form.getFieldsValue();
      const finalData = { ...formData, ...values };

      const response = await axios.post(
        `/api/organizations`,
        finalData
      );

      message.success('Organization created successfully!');
      
      // Redirect to login with the new subdomain
      setTimeout(() => {
        window.location.href = `https://${finalData.subdomain}.${window.location.hostname}/login`;
      }, 2000);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const validateSubdomain = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('Please enter a subdomain');
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      return Promise.reject('Subdomain can only contain lowercase letters, numbers, and hyphens');
    }
    if (value.length < 3) {
      return Promise.reject('Subdomain must be at least 3 characters');
    }
    const reserved = ['www', 'api', 'admin', 'app', 'default', 'mail', 'ftp'];
    if (reserved.includes(value)) {
      return Promise.reject('This subdomain is reserved');
    }
    return Promise.resolve();
  };

  const steps = [
    {
      title: 'Organization',
      icon: <MedicineBoxOutlined />,
      content: (
        <div className="step-content">
          <Title level={3}>Tell us about your hospital</Title>
          <Paragraph>This information will help us set up your account</Paragraph>
          
          <Form.Item
            name="name"
            label="Hospital Name"
            rules={[{ required: true, message: 'Please enter hospital name' }]}
          >
            <Input
              size="large"
              prefix={<MedicineBoxOutlined />}
              placeholder="Apollo Hospital"
            />
          </Form.Item>

          <Form.Item
            name="subdomain"
            label="Subdomain"
            rules={[{ validator: validateSubdomain }]}
            extra={
              <Text type="secondary">
                Your hospital will be accessible at: {form.getFieldValue('subdomain') || 'your-hospital'}.yourhospital.com
              </Text>
            }
          >
            <Input
              size="large"
              prefix={<GlobalOutlined />}
              placeholder="apollo"
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                form.setFieldsValue({ subdomain: value });
              }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Brief description of your hospital"
            />
          </Form.Item>
        </div>
      ),
    },
    {
      title: 'Admin Account',
      icon: <UserOutlined />,
      content: (
        <div className="step-content">
          <Title level={3}>Create admin account</Title>
          <Paragraph>This will be the primary administrator account</Paragraph>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="adminFirstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input size="large" placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="adminLastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input size="large" placeholder="Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="adminEmail"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="admin@example.com"
            />
          </Form.Item>

          <Form.Item
            name="adminPassword"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Enter strong password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['adminPassword']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('adminPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Passwords do not match');
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Confirm password"
            />
          </Form.Item>
        </div>
      ),
    },
    {
      title: 'Plan & Confirm',
      icon: <CheckCircleOutlined />,
      content: (
        <div className="step-content">
          <Title level={3}>Choose your plan</Title>
          <Paragraph>You can change your plan anytime</Paragraph>
          
          <Form.Item
            name="plan"
            label="Subscription Plan"
          >
            <Select size="large">
              <Option value="basic">
                <div>
                  <strong>Basic - $99/month</strong>
                  <br />
                  <Text type="secondary">Up to 5 doctors, 100 patients</Text>
                </div>
              </Option>
              <Option value="professional">
                <div>
                  <strong>Professional - $299/month</strong>
                  <br />
                  <Text type="secondary">Up to 20 doctors, 1000 patients</Text>
                </div>
              </Option>
              <Option value="enterprise">
                <div>
                  <strong>Enterprise - $999/month</strong>
                  <br />
                  <Text type="secondary">Unlimited doctors & patients</Text>
                </div>
              </Option>
            </Select>
          </Form.Item>

          <Card className="summary-card">
            <Title level={5}>Summary</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Hospital Name:</Text> {formData.name}
              </div>
              <div>
                <Text strong>Subdomain:</Text> {formData.subdomain}.yourhospital.com
              </div>
              <div>
                <Text strong>Admin Email:</Text> {formData.adminEmail}
              </div>
              <div>
                <Text strong>Plan:</Text> {form.getFieldValue('plan')}
              </div>
            </Space>
          </Card>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject('Please accept terms'),
              },
            ]}
          >
            <Checkbox>
              I agree to the <a href="#terms">Terms of Service</a> and{' '}
              <a href="#privacy">Privacy Policy</a>
            </Checkbox>
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div className="organization-signup">
      <div className="signup-container">
        <div className="signup-header">
          <MedicineBoxOutlined style={{ fontSize: '48px', color: '#e91e63' }} />
          <Title level={2}>Join Ayphen Care</Title>
          <Paragraph>
            Create your hospital account and start your 30-day free trial. No credit card required.
          </Paragraph>
        </div>

        <Card className="signup-card">
          <Steps current={currentStep} className="signup-steps">
            {steps.map((step) => (
              <Step key={step.title} title={step.title} icon={step.icon} />
            ))}
          </Steps>

          <Form
            form={form}
            layout="vertical"
            className="signup-form"
            initialValues={{ plan: planFromUrl }}
          >
            {steps[currentStep].content}

            <div className="step-actions">
              {currentStep > 0 && (
                <Button size="large" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" size="large" onClick={handleNext}>
                  Next
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Create Organization
                </Button>
              )}
            </div>
          </Form>
        </Card>

        <div className="signup-footer">
          <Text>
            Already have an account? <a href="/login">Sign in</a>
          </Text>
        </div>
      </div>
    </div>
  );
};

const OrganizationSignup: React.FC = () => {
  return (
    <App>
      <OrganizationSignupContent />
    </App>
  );
};

export default OrganizationSignup;
