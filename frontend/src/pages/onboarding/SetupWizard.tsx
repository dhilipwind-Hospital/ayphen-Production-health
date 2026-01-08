import React, { useState, useEffect } from 'react';
import { Steps, Card, Button, Form, Input, Select, Upload, Row, Col, Typography, Progress, Alert, Space, Divider, List, Avatar, Tag, message } from 'antd';
import { 
  BankOutlined,
  TeamOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  DatabaseOutlined,
  BookOutlined,
  RocketOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SetupWizardProps {
  hospitalId?: string;
  onComplete?: () => void;
}

interface SetupData {
  [key: string]: any;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ hospitalId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({});

  const steps = [
    {
      title: 'Hospital Profile',
      icon: <BankOutlined />,
      description: 'Complete your hospital information',
      estimatedTime: '15 minutes'
    },
    {
      title: 'Departments',
      icon: <SettingOutlined />,
      description: 'Configure medical departments',
      estimatedTime: '20 minutes'
    },
    {
      title: 'Services',
      icon: <MedicineBoxOutlined />,
      description: 'Set up medical services and pricing',
      estimatedTime: '25 minutes'
    },
    {
      title: 'Staff Setup',
      icon: <TeamOutlined />,
      description: 'Add your medical staff',
      estimatedTime: '30 minutes'
    },
    {
      title: 'Scheduling',
      icon: <CalendarOutlined />,
      description: 'Configure appointment schedules',
      estimatedTime: '20 minutes'
    },
    {
      title: 'Technology',
      icon: <VideoCameraOutlined />,
      description: 'Test telemedicine and integrations',
      estimatedTime: '15 minutes'
    },
    {
      title: 'Data Import',
      icon: <DatabaseOutlined />,
      description: 'Import existing patient data (optional)',
      estimatedTime: '30 minutes'
    },
    {
      title: 'Training',
      icon: <BookOutlined />,
      description: 'Schedule staff training',
      estimatedTime: '10 minutes'
    }
  ];

  const defaultDepartments = [
    { name: 'Emergency Department', code: 'ER', description: 'Emergency and trauma care', active: true },
    { name: 'Cardiology', code: 'CARD', description: 'Heart and cardiovascular care', active: true },
    { name: 'Neurology', code: 'NEURO', description: 'Brain and nervous system', active: true },
    { name: 'Orthopedics', code: 'ORTHO', description: 'Bone and joint care', active: true },
    { name: 'Pediatrics', code: 'PEDS', description: 'Children\'s healthcare', active: true },
    { name: 'Obstetrics & Gynecology', code: 'OBGYN', description: 'Women\'s health and childbirth', active: true },
    { name: 'Internal Medicine', code: 'IM', description: 'General adult medicine', active: true },
    { name: 'Surgery', code: 'SURG', description: 'Surgical procedures', active: true },
    { name: 'Radiology', code: 'RAD', description: 'Medical imaging', active: true },
    { name: 'Laboratory', code: 'LAB', description: 'Diagnostic testing', active: true },
    { name: 'Pharmacy', code: 'PHARM', description: 'Medication management', active: true },
    { name: 'ICU', code: 'ICU', description: 'Intensive care unit', active: true }
  ];

  const defaultServices = [
    { name: 'General Consultation', department: 'IM', duration: 30, price: 150, description: 'General medical consultation' },
    { name: 'Specialist Consultation', department: 'CARD', duration: 45, price: 200, description: 'Cardiology specialist consultation' },
    { name: 'Emergency Visit', department: 'ER', duration: 60, price: 300, description: 'Emergency room visit' },
    { name: 'Telemedicine Consultation', department: 'IM', duration: 20, price: 100, description: 'Video consultation' },
    { name: 'Health Checkup', department: 'IM', duration: 60, price: 250, description: 'Comprehensive health screening' },
    { name: 'Vaccination', department: 'PEDS', duration: 15, price: 50, description: 'Immunization services' },
    { name: 'X-Ray', department: 'RAD', duration: 30, price: 120, description: 'Radiographic imaging' },
    { name: 'Blood Test', department: 'LAB', duration: 15, price: 80, description: 'Laboratory blood work' }
  ];

  const handleNext = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Save current step data
      setSetupData((prev: SetupData) => ({
        ...prev,
        [`step${currentStep}`]: values
      }));

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        form.resetFields();
      } else {
        // Complete setup
        await handleCompleteSetup();
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to complete setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('🎉 Hospital setup completed successfully!');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      message.error('Setup completion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Hospital Profile
        return (
          <Card title="Complete Hospital Profile" style={{ minHeight: '400px' }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="hospitalName" label="Hospital Name" rules={[{ required: true }]}>
                    <Input placeholder="Enter hospital name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="hospitalType" label="Hospital Type" rules={[{ required: true }]}>
                    <Select placeholder="Select hospital type">
                      <Option value="General Hospital">General Hospital</Option>
                      <Option value="Specialty Hospital">Specialty Hospital</Option>
                      <Option value="Teaching Hospital">Teaching Hospital</Option>
                      <Option value="Clinic">Clinic</Option>
                      <Option value="Medical Center">Medical Center</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="description" label="Hospital Description">
                <TextArea rows={3} placeholder="Brief description of your hospital" />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}>
                    <Input placeholder="+1-555-0123" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="contact@hospital.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="website" label="Website">
                    <Input placeholder="https://hospital.com" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="logo" label="Hospital Logo">
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload Logo</div>
                  </div>
                </Upload>
              </Form.Item>
            </Form>
          </Card>
        );

      case 1: // Departments
        return (
          <Card title="Configure Medical Departments" style={{ minHeight: '400px' }}>
            <Alert
              message="Pre-configured Departments"
              description="We've set up common medical departments for you. You can enable/disable or customize them."
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Form.Item name="departments" label="Select Active Departments">
                <List
                  dataSource={defaultDepartments}
                  renderItem={(dept, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: '#e91e63' }} />}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{dept.name}</span>
                            <Tag color="blue">{dept.code}</Tag>
                          </div>
                        }
                        description={dept.description}
                      />
                      <Button type={dept.active ? 'primary' : 'default'}>
                        {dept.active ? 'Enabled' : 'Disabled'}
                      </Button>
                    </List.Item>
                  )}
                />
              </Form.Item>
            </Form>
          </Card>
        );

      case 2: // Services
        return (
          <Card title="Set Up Medical Services" style={{ minHeight: '400px' }}>
            <Alert
              message="Default Services Configured"
              description="Common medical services with standard pricing. You can modify prices and add more services later."
              type="success"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <List
                dataSource={defaultServices}
                renderItem={(service, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{service.name}</span>
                          <Tag color="green">${service.price}</Tag>
                          <Tag>{service.duration} min</Tag>
                        </div>
                      }
                      description={`${service.description} - Department: ${service.department}`}
                    />
                  </List.Item>
                )}
              />
              
              <Divider />
              
              <Button type="dashed" block icon={<MedicineBoxOutlined />}>
                Add Custom Service
              </Button>
            </Form>
          </Card>
        );

      case 3: // Staff Setup
        return (
          <Card title="Add Your Medical Staff" style={{ minHeight: '400px' }}>
            <Alert
              message="Start with Key Staff"
              description="Add at least one doctor to begin accepting appointments. You can add more staff members later."
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Title level={5}>Add Your First Doctor</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="doctorFirstName" label="First Name" rules={[{ required: true }]}>
                    <Input placeholder="Dr. John" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="doctorLastName" label="Last Name" rules={[{ required: true }]}>
                    <Input placeholder="Smith" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="doctorEmail" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="doctor@hospital.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="doctorSpecialization" label="Specialization" rules={[{ required: true }]}>
                    <Select placeholder="Select specialization">
                      <Option value="Internal Medicine">Internal Medicine</Option>
                      <Option value="Cardiology">Cardiology</Option>
                      <Option value="Neurology">Neurology</Option>
                      <Option value="Orthopedics">Orthopedics</Option>
                      <Option value="Pediatrics">Pediatrics</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="doctorBio" label="Doctor Bio">
                <TextArea rows={3} placeholder="Brief professional background" />
              </Form.Item>
            </Form>
          </Card>
        );

      case 4: // Scheduling
        return (
          <Card title="Configure Appointment Scheduling" style={{ minHeight: '400px' }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="workingHoursStart" label="Working Hours Start" rules={[{ required: true }]}>
                    <Select placeholder="Select start time">
                      <Option value="08:00">8:00 AM</Option>
                      <Option value="09:00">9:00 AM</Option>
                      <Option value="10:00">10:00 AM</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="workingHoursEnd" label="Working Hours End" rules={[{ required: true }]}>
                    <Select placeholder="Select end time">
                      <Option value="17:00">5:00 PM</Option>
                      <Option value="18:00">6:00 PM</Option>
                      <Option value="19:00">7:00 PM</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="appointmentDuration" label="Default Appointment Duration" rules={[{ required: true }]}>
                <Select placeholder="Select duration">
                  <Option value="15">15 minutes</Option>
                  <Option value="30">30 minutes</Option>
                  <Option value="45">45 minutes</Option>
                  <Option value="60">60 minutes</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="workingDays" label="Working Days" rules={[{ required: true }]}>
                <Select mode="multiple" placeholder="Select working days">
                  <Option value="monday">Monday</Option>
                  <Option value="tuesday">Tuesday</Option>
                  <Option value="wednesday">Wednesday</Option>
                  <Option value="thursday">Thursday</Option>
                  <Option value="friday">Friday</Option>
                  <Option value="saturday">Saturday</Option>
                  <Option value="sunday">Sunday</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>
        );

      case 5: // Technology
        return (
          <Card title="Technology Setup & Testing" style={{ minHeight: '400px' }}>
            <Alert
              message="Test Your Technology"
              description="Verify that telemedicine and other technology features work properly."
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card size="small" title="Telemedicine Testing">
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <VideoCameraOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                      <div>Camera Test</div>
                      <Button size="small" style={{ marginTop: '8px' }}>Test Camera</Button>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <VideoCameraOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                      <div>Microphone Test</div>
                      <Button size="small" style={{ marginTop: '8px' }}>Test Microphone</Button>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                      <div>Connection Test</div>
                      <Button size="small" style={{ marginTop: '8px' }}>Test Connection</Button>
                    </div>
                  </Col>
                </Row>
              </Card>
              
              <Card size="small" title="Integration Testing">
                <List size="small">
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Email notifications - Ready
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    SMS notifications - Ready
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Payment processing - Ready
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Mobile apps - Ready
                  </List.Item>
                </List>
              </Card>
            </Space>
          </Card>
        );

      case 6: // Data Import
        return (
          <Card title="Import Existing Data (Optional)" style={{ minHeight: '400px' }}>
            <Alert
              message="Optional Step"
              description="You can skip this step and add data manually later, or import existing patient records."
              type="warning"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card size="small" title="Patient Data Import">
                  <Upload.Dragger>
                    <p className="ant-upload-drag-icon">
                      <DatabaseOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag patient data file to upload</p>
                    <p className="ant-upload-hint">
                      Supports CSV, Excel files. Maximum 10,000 records.
                    </p>
                  </Upload.Dragger>
                </Card>
                
                <Card size="small" title="Medical Records Import">
                  <Upload.Dragger>
                    <p className="ant-upload-drag-icon">
                      <DatabaseOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag medical records to upload</p>
                    <p className="ant-upload-hint">
                      Supports PDF, DICOM, and standard medical formats.
                    </p>
                  </Upload.Dragger>
                </Card>
              </Space>
            </Form>
          </Card>
        );

      case 7: // Training
        return (
          <Card title="Schedule Staff Training" style={{ minHeight: '400px' }}>
            <Alert
              message="Free Training Included"
              description="Schedule a comprehensive training session for your staff to get the most out of Ayphen Care."
              type="success"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="trainingDate" label="Preferred Training Date">
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="trainingTime" label="Preferred Time">
                    <Select placeholder="Select time">
                      <Option value="09:00">9:00 AM</Option>
                      <Option value="10:00">10:00 AM</Option>
                      <Option value="11:00">11:00 AM</Option>
                      <Option value="14:00">2:00 PM</Option>
                      <Option value="15:00">3:00 PM</Option>
                      <Option value="16:00">4:00 PM</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="attendees" label="Number of Attendees">
                <Select placeholder="How many staff members will attend?">
                  <Option value="1-5">1-5 people</Option>
                  <Option value="6-10">6-10 people</Option>
                  <Option value="11-20">11-20 people</Option>
                  <Option value="20+">20+ people</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="trainingTopics" label="Training Focus Areas">
                <Select mode="multiple" placeholder="Select areas of focus">
                  <Option value="basic-navigation">Basic Navigation</Option>
                  <Option value="patient-management">Patient Management</Option>
                  <Option value="appointment-scheduling">Appointment Scheduling</Option>
                  <Option value="telemedicine">Telemedicine</Option>
                  <Option value="billing">Billing & Payments</Option>
                  <Option value="reports">Reports & Analytics</Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="trainingNotes" label="Special Requirements">
                <TextArea rows={3} placeholder="Any specific training needs or questions?" />
              </Form.Item>
            </Form>
          </Card>
        );

      default:
        return null;
    }
  };

  const completedSteps = currentStep;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2} style={{ color: '#e91e63' }}>
          <RocketOutlined /> Hospital Setup Wizard
        </Title>
        <Paragraph>
          Complete these steps to get your hospital management system ready for patients
        </Paragraph>
        
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#e91e63' }}>
                  {progressPercentage}%
                </div>
                <div>Setup Progress</div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                  {completedSteps}/{totalSteps}
                </div>
                <div>Steps Completed</div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                <div>{steps[currentStep]?.estimatedTime}</div>
                <div>Estimated Time</div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Progress Steps */}
      <Card style={{ marginBottom: '24px' }}>
        <Steps current={currentStep} size="small">
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>
        
        <Progress 
          percent={progressPercentage} 
          strokeColor="#e91e63" 
          style={{ marginTop: '16px' }}
        />
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <Card style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Step {currentStep + 1} of {steps.length}
            </Text>
          </div>
          
          <Button 
            type="primary" 
            onClick={handleNext}
            loading={loading}
            style={{ background: '#e91e63', borderColor: '#e91e63' }}
          >
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SetupWizard;
