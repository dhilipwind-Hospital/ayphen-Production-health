import React, { useState } from 'react';
import { Card, Steps, Button, Form, Input, Select, Row, Col, Typography, Space, Divider, Alert, Timeline, Tag, Checkbox, Modal, message } from 'antd';
import { 
  BankOutlined, 
  UserOutlined, 
  SettingOutlined, 
  CheckCircleOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  TeamOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

interface OnboardingData {
  // Step 1: Organization Details
  organizationName: string;
  hospitalType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  website: string;
  
  // Step 2: Admin User
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminRole: string;
  
  // Step 3: Plan Selection
  selectedPlan: 'Basic' | 'Professional' | 'Enterprise';
  billingCycle: 'Monthly' | 'Yearly';
  userLimit: number;
  
  // Step 4: Configuration
  departments: string[];
  services: string[];
  customizations: string[];
  
  // Step 5: Payment
  paymentMethod: string;
  billingAddress: string;
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isModalVisible, setIsModalVisible] = useState(false);

  const hospitalTypes = [
    'General Hospital',
    'Specialty Hospital',
    'Teaching Hospital',
    'Clinic',
    'Medical Center',
    'Emergency Care',
    'Rehabilitation Center',
    'Psychiatric Hospital'
  ];

  const defaultDepartments = [
    'Emergency Department',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Obstetrics & Gynecology',
    'Internal Medicine',
    'Surgery',
    'Radiology',
    'Laboratory',
    'Pharmacy',
    'ICU',
    'Outpatient'
  ];

  const defaultServices = [
    'Patient Registration',
    'Appointment Scheduling',
    'Medical Records Management',
    'Billing & Insurance',
    'Pharmacy Management',
    'Laboratory Management',
    'Radiology Services',
    'Emergency Services',
    'Inpatient Management',
    'Outpatient Services',
    'Telemedicine',
    'Health Checkups'
  ];

  const planFeatures = {
    Basic: {
      price: { monthly: 99, yearly: 990 },
      users: 25,
      storage: '10GB',
      features: [
        'Basic Patient Management',
        'Simple Appointments',
        'Basic Medical Records',
        'Email Support',
        'Standard Security'
      ]
    },
    Professional: {
      price: { monthly: 299, yearly: 2990 },
      users: 100,
      storage: '100GB',
      features: [
        'Advanced Patient Management',
        'Smart Scheduling',
        'Complete Medical Records',
        'Pharmacy Management',
        'Laboratory Management',
        'Billing & Invoicing',
        'Basic Reports',
        'Phone & Email Support',
        'Enhanced Security'
      ]
    },
    Enterprise: {
      price: { monthly: 999, yearly: 9990 },
      users: 500,
      storage: '1TB',
      features: [
        'All Professional Features',
        'Advanced Analytics',
        'API Access',
        'Custom Integrations',
        'Multi-Location Support',
        'Priority Support',
        'Advanced Security & Compliance',
        'Custom Branding',
        'Dedicated Account Manager'
      ]
    }
  };

  const inheritedSystemFeatures = [
    {
      category: 'Core System',
      items: [
        'Multi-tenant architecture',
        'Role-based access control',
        'Audit logging',
        'Data encryption',
        'Automated backups',
        'System monitoring'
      ]
    },
    {
      category: 'Default Templates',
      items: [
        'Standard medical forms',
        'Common prescription templates',
        'Default report formats',
        'Email templates',
        'Invoice templates',
        'Appointment reminder templates'
      ]
    },
    {
      category: 'Compliance & Security',
      items: [
        'HIPAA compliance framework',
        'Data privacy controls',
        'Security policies',
        'Access controls',
        'Audit trails',
        'Incident response procedures'
      ]
    },
    {
      category: 'Integration Capabilities',
      items: [
        'HL7 FHIR support',
        'Lab equipment integration',
        'Pharmacy systems',
        'Insurance verification',
        'Payment gateways',
        'Telemedicine platforms'
      ]
    }
  ];

  const steps = [
    {
      title: 'Organization Details',
      icon: <BankOutlined />,
      content: (
        <Card title="Hospital Information">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="organizationName" label="Hospital Name" rules={[{ required: true }]}>
                <Input placeholder="Enter hospital name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hospitalType" label="Hospital Type" rules={[{ required: true }]}>
                <Select placeholder="Select hospital type">
                  {hospitalTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                <TextArea rows={2} placeholder="Enter complete address" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="City" rules={[{ required: true }]}>
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="state" label="State" rules={[{ required: true }]}>
                <Input placeholder="State" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="zipCode" label="ZIP Code" rules={[{ required: true }]}>
                <Input placeholder="ZIP Code" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="website" label="Website">
                <Input placeholder="Website URL" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="country" label="Country" rules={[{ required: true }]}>
                <Select placeholder="Select country">
                  <Option value="US">United States</Option>
                  <Option value="CA">Canada</Option>
                  <Option value="UK">United Kingdom</Option>
                  <Option value="IN">India</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      title: 'Admin User',
      icon: <UserOutlined />,
      content: (
        <Card title="Primary Administrator">
          <Alert 
            message="This user will have full administrative access to your hospital's system"
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="adminFirstName" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="First name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="adminLastName" label="Last Name" rules={[{ required: true }]}>
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="adminEmail" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="admin@hospital.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="adminPhone" label="Phone" rules={[{ required: true }]}>
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="adminRole" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select admin role">
              <Option value="Hospital Administrator">Hospital Administrator</Option>
              <Option value="IT Director">IT Director</Option>
              <Option value="Chief Medical Officer">Chief Medical Officer</Option>
              <Option value="Operations Manager">Operations Manager</Option>
            </Select>
          </Form.Item>
        </Card>
      )
    },
    {
      title: 'Plan Selection',
      icon: <CreditCardOutlined />,
      content: (
        <div>
          <Title level={4}>Choose Your Plan</Title>
          <Row gutter={16}>
            {Object.entries(planFeatures).map(([plan, details]) => (
              <Col span={8} key={plan}>
                <Card 
                  hoverable
                  className={onboardingData.selectedPlan === plan ? 'selected-plan' : ''}
                  onClick={() => setOnboardingData({...onboardingData, selectedPlan: plan as any})}
                  style={{ 
                    border: onboardingData.selectedPlan === plan ? '2px solid #e91e63' : '1px solid #d9d9d9',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ color: '#e91e63' }}>{plan}</Title>
                    <Title level={2}>
                      ${onboardingData.billingCycle === 'Yearly' ? details.price.yearly : details.price.monthly}
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        /{onboardingData.billingCycle === 'Yearly' ? 'year' : 'month'}
                      </Text>
                    </Title>
                    {onboardingData.billingCycle === 'Yearly' && (
                      <Tag color="green">Save 17%</Tag>
                    )}
                  </div>
                  
                  <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
                    <li><CheckCircleOutlined style={{ color: '#52c41a' }} /> Up to {details.users} users</li>
                    <li><CheckCircleOutlined style={{ color: '#52c41a' }} /> {details.storage} storage</li>
                    {details.features.map((feature, index) => (
                      <li key={index}>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Col>
            ))}
          </Row>
          
          <Card style={{ marginTop: 16 }}>
            <Form.Item name="billingCycle" label="Billing Cycle">
              <Select 
                value={onboardingData.billingCycle} 
                onChange={(value) => setOnboardingData({...onboardingData, billingCycle: value})}
              >
                <Option value="Monthly">Monthly</Option>
                <Option value="Yearly">Yearly (Save 17%)</Option>
              </Select>
            </Form.Item>
          </Card>
        </div>
      )
    },
    {
      title: 'Configuration',
      icon: <SettingOutlined />,
      content: (
        <div>
          <Card title="Departments & Services Setup" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5}>Select Departments</Title>
                <Form.Item name="departments">
                  <Checkbox.Group>
                    <Row>
                      {defaultDepartments.map(dept => (
                        <Col span={24} key={dept} style={{ marginBottom: 8 }}>
                          <Checkbox value={dept}>{dept}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Select Services</Title>
                <Form.Item name="services">
                  <Checkbox.Group>
                    <Row>
                      {defaultServices.map(service => (
                        <Col span={24} key={service} style={{ marginBottom: 8 }}>
                          <Checkbox value={service}>{service}</Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Checkbox.Group>
                </Form.Item>
              </Col>
            </Row>
          </Card>
          
          <Card title="What Your Hospital Will Inherit">
            <Row gutter={16}>
              {inheritedSystemFeatures.map((category, index) => (
                <Col span={12} key={index}>
                  <Title level={5} style={{ color: '#e91e63' }}>
                    {category.category === 'Core System' && <DatabaseOutlined />}
                    {category.category === 'Default Templates' && <MedicineBoxOutlined />}
                    {category.category === 'Compliance & Security' && <SecurityScanOutlined />}
                    {category.category === 'Integration Capabilities' && <ApiOutlined />}
                    {' '}{category.category}
                  </Title>
                  <ul>
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} style={{ marginBottom: 4 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      )
    },
    {
      title: 'Review & Launch',
      icon: <CheckCircleOutlined />,
      content: (
        <div>
          <Card title="Review Your Setup">
            <Row gutter={16}>
              <Col span={12}>
                <Title level={5}>Organization Details</Title>
                <p><strong>Name:</strong> {onboardingData.organizationName}</p>
                <p><strong>Type:</strong> {onboardingData.hospitalType}</p>
                <p><strong>Admin:</strong> {onboardingData.adminFirstName} {onboardingData.adminLastName}</p>
                <p><strong>Email:</strong> {onboardingData.adminEmail}</p>
              </Col>
              
              <Col span={12}>
                <Title level={5}>Plan & Billing</Title>
                <p><strong>Plan:</strong> {onboardingData.selectedPlan}</p>
                <p><strong>Billing:</strong> {onboardingData.billingCycle}</p>
                <p><strong>Price:</strong> ${onboardingData.billingCycle === 'Yearly' ? 
                  planFeatures[onboardingData.selectedPlan || 'Professional'].price.yearly : 
                  planFeatures[onboardingData.selectedPlan || 'Professional'].price.monthly}
                </p>
              </Col>
            </Row>
          </Card>
          
          <Card title="Deployment Timeline" style={{ marginTop: 16 }}>
            <Timeline>
              <Timeline.Item color="green">
                <strong>Step 1:</strong> Organization created and configured (Immediate)
              </Timeline.Item>
              <Timeline.Item color="blue">
                <strong>Step 2:</strong> Database provisioned and secured (2-5 minutes)
              </Timeline.Item>
              <Timeline.Item color="blue">
                <strong>Step 3:</strong> Default templates and configurations applied (5-10 minutes)
              </Timeline.Item>
              <Timeline.Item color="blue">
                <strong>Step 4:</strong> Admin user created and access granted (Immediate)
              </Timeline.Item>
              <Timeline.Item color="orange">
                <strong>Step 5:</strong> Welcome email sent with login credentials (Immediate)
              </Timeline.Item>
              <Timeline.Item color="green">
                <strong>Complete:</strong> Hospital system ready for use (10-15 minutes total)
              </Timeline.Item>
            </Timeline>
          </Card>
        </div>
      )
    }
  ];

  const next = () => {
    form.validateFields().then(values => {
      setOnboardingData({...onboardingData, ...values});
      setCurrentStep(currentStep + 1);
    }).catch(errorInfo => {
      console.log('Validation failed:', errorInfo);
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    Modal.confirm({
      title: 'Launch Hospital System',
      content: 'Are you ready to create and launch this hospital system? This will start the deployment process.',
      okText: 'Launch System',
      okType: 'primary',
      onOk: () => {
        message.success('Hospital system deployment started! You will receive updates via email.');
        // Here you would typically call an API to create the organization
        setIsModalVisible(true);
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          <TeamOutlined /> New Hospital Onboarding
        </Title>
        <Text type="secondary">
          Complete setup for a new hospital organization
        </Text>
      </div>

      <Card>
        <Steps current={currentStep} style={{ marginBottom: '24px' }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <Form form={form} layout="vertical">
          <div style={{ minHeight: '400px' }}>
            {steps[currentStep].content}
          </div>
        </Form>

        <Divider />
        
        <div style={{ textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={prev}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next} style={{ background: '#e91e63', borderColor: '#e91e63' }}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" onClick={handleFinish} style={{ background: '#e91e63', borderColor: '#e91e63' }}>
                Launch Hospital System
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Success Modal */}
      <Modal
        title="🎉 Hospital System Deployment Started!"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIsModalVisible(false)}>
            Got it!
          </Button>
        ]}
      >
        <div>
          <Alert
            message="Deployment in Progress"
            description="Your hospital system is being created. You'll receive email updates at each step."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Title level={5}>What happens next:</Title>
          <ul>
            <li>✅ Organization record created in SaaS platform</li>
            <li>🔄 Dedicated database provisioned</li>
            <li>🔄 Security and compliance settings applied</li>
            <li>🔄 Default templates and configurations deployed</li>
            <li>📧 Admin credentials sent via email</li>
            <li>🎯 System ready for first login (10-15 minutes)</li>
          </ul>
          
          <Alert
            message="Where to monitor progress"
            description="Check the Organizations Management page to see real-time deployment status."
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default OnboardingFlow;
