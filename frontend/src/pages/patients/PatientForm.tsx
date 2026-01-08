import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Radio, Row, Col, Typography, Space, Alert, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PatientFormContainer = styled.div`
  .form-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    gap: 16px;
  }
  
  .back-button {
    margin-right: 8px;
  }
  
  .form-actions {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
  }
`;

const PatientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      // Fetch patient data if in edit mode
      fetchPatient(id);
    }
  }, [id]);

  const fetchPatient = async (patientId: string) => {
    setLoading(true);
    try {
      const data = await patientService.getPatient(patientId);
      form.setFieldsValue({
        ...data,
        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth, 'YYYY-MM-DD') : undefined,
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      message.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: any = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
      };
      if (isEditMode && id) {
        await patientService.updatePatient(id, payload);
      } else {
        await patientService.createPatient(payload);
      }
      message.success(`Patient ${isEditMode ? 'updated' : 'created'} successfully!`);
      const role = String(user?.role || '').toLowerCase();
      if (role === 'admin' || role === 'super_admin') {
        navigate('/patients');
      } else {
        navigate('/queue/reception');
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      message.error(error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} patient`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientFormContainer>
      <div className="form-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="back-button"
        />
        <Title level={4} style={{ margin: 0 }}>
          {isEditMode ? 'Edit Patient' : 'Add New Patient'}
        </Title>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'active',
            gender: 'male',
            bloodGroup: 'A+',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Title level={5} style={{ marginBottom: 16 }}>Personal Information</Title>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Please enter first name' }]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="First name" 
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Please enter last name' }]}
                  >
                    <Input placeholder="Last name" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                      <Option value="prefer_not_to_say">Prefer not to say</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                    rules={[{ required: true, message: 'Please select date of birth' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="bloodGroup"
                label="Blood Group"
              >
                <Select>
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O-">O-</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Title level={5} style={{ marginBottom: 16 }}>Contact Information</Title>
              
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: 'Please enter email' }, { type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email address" 
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="Phone number" 
                />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder="Street address" 
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="city" label="City">
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="state" label="State/Province">
                    <Input placeholder="State" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="zipCode" label="ZIP/Postal Code">
                    <Input placeholder="ZIP code" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Emergency Contact</Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name={['emergencyContact', 'name']} label="Name">
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name={['emergencyContact', 'relationship']} label="Relationship">
                <Input placeholder="Relationship to patient" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item 
                name={['emergencyContact', 'phone']} 
                label="Phone Number"
              >
                <Input placeholder="Emergency phone number" />
              </Form.Item>
            </Col>
          </Row>

          {isEditMode && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item name="notes" label="Notes">
            <TextArea rows={4} placeholder="Additional notes about the patient" />
          </Form.Item>

          <div className="form-actions">
            <Button onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
            >
              {isEditMode ? 'Update' : 'Create'} Patient
            </Button>
          </div>
        </Form>
      </Card>
    </PatientFormContainer>
  );
};

export default PatientForm;
