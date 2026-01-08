import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Select,
  Spin,
  Typography,
  Space,
  Alert,
  Divider,
  Result,
  Statistic
} from 'antd';
import { AlertOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

interface Service {
  id: string;
  name: string;
}

interface EmergencyFormData {
  doctorId: string;
  serviceId: string;
  reason: string;
  priority: 'high' | 'critical';
}

const EmergencyAppointment: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm<EmergencyFormData>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();
  const [appointmentCreated, setAppointmentCreated] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorsRes, servicesRes] = await Promise.all([
        api.get('/users?role=doctor'),
        api.get('/services')
      ]);
      setDoctors(doctorsRes.data?.data || []);
      setServices(servicesRes.data?.data || []);
    } catch (error: any) {
      msgApi.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: EmergencyFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        patientId: user?.id,
        doctorId: values.doctorId,
        serviceId: values.serviceId,
        reason: values.reason,
        priority: values.priority
      };

      const res = await api.post('/appointments/emergency', payload);
      setAppointmentCreated(res.data);
      msgApi.success('Emergency appointment created successfully!');
      form.resetFields();
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to create emergency appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (appointmentCreated) {
    return (
      <>
        {contextHolder}
        <Result
          status="success"
          title="Emergency Appointment Scheduled"
          subTitle="Your emergency appointment has been confirmed. A doctor will see you shortly."
          extra={
            <Card style={{ marginTop: 30, maxWidth: 600, margin: '30px auto 0' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic
                  title="Appointment ID"
                  value={appointmentCreated.id}
                  valueStyle={{ fontSize: 14, fontFamily: 'monospace' }}
                />
                <Divider />
                <div>
                  <Text strong>Doctor: </Text>
                  <Text>
                    Dr. {appointmentCreated.doctor?.firstName} {appointmentCreated.doctor?.lastName}
                  </Text>
                </div>
                <div>
                  <Text strong>Appointment Time: </Text>
                  <Text>
                    {new Date(appointmentCreated.startTime).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text strong>Priority: </Text>
                  <Text>{appointmentCreated.appointmentType?.toUpperCase()}</Text>
                </div>
                <Alert
                  message="Important"
                  description="Please arrive 10 minutes early. Keep your appointment ID handy for quick check-in."
                  type="info"
                  icon={<AlertOutlined />}
                />
                <Button type="primary" onClick={() => window.location.href = '/appointments'} size="large">
                  Go to My Appointments
                </Button>
              </Space>
            </Card>
          }
        />
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px', maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Title level={2}>
            <AlertOutlined style={{ color: '#ff4d4f', marginRight: 10 }} />
            Emergency Appointment
          </Title>

          <Alert
            message="Quick Response"
            description="Emergency appointments are scheduled within 30 minutes. A doctor will see you as soon as possible."
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              name="doctorId"
              label="Preferred Doctor (if available)"
              rules={[{ required: true, message: 'Please select a doctor' }]}
            >
              <Select
                placeholder="Select a doctor or leave blank for next available"
                allowClear
                options={doctors.map(d => ({
                  value: d.id,
                  label: `Dr. ${d.firstName} ${d.lastName}${d.specialization ? ` - ${d.specialization}` : ''}`
                }))}
              />
            </Form.Item>

            <Form.Item
              name="serviceId"
              label="Type of Emergency"
              rules={[{ required: true, message: 'Please select the type of emergency' }]}
            >
              <Select
                placeholder="Select the emergency type"
                options={services
                  .filter(s => s.name.toLowerCase().includes('emergency') || s.name.toLowerCase().includes('urgent'))
                  .map(s => ({
                    value: s.id,
                    label: s.name
                  }))}
              />
            </Form.Item>

            <Form.Item
              name="priority"
              label="Priority Level"
              rules={[{ required: true, message: 'Please select priority level' }]}
              initialValue="high"
            >
              <Select
                options={[
                  { value: 'high', label: '🔴 High - Urgent but stable' },
                  { value: 'critical', label: '🔴🔴 Critical - Life-threatening' }
                ]}
              />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Symptoms / Reason"
              rules={[{ required: true, message: 'Please describe your symptoms' }]}
            >
              <Input.TextArea
                placeholder="Describe your emergency symptoms in detail"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Divider />

            <Card type="inner" style={{ backgroundColor: '#fffbe6', marginBottom: 20 }}>
              <Title level={5}>For Critical Emergencies:</Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PhoneOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                <div>
                  <Text strong>Call our emergency hotline:</Text>
                  <br />
                  <Text style={{ fontSize: 16 }}>+1 (555) 123-4567</Text>
                </div>
              </div>
            </Card>

            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={submitting}
              block
              size="large"
            >
              <AlertOutlined /> Schedule Emergency Appointment
            </Button>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default EmergencyAppointment;
