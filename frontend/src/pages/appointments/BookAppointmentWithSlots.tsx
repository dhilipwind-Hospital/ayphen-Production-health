import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  message,
  Card,
  DatePicker,
  Select,
  Spin,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Radio,
  Empty,
  Divider,
  Steps
} from 'antd';
import { CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
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
  duration: number;
  description?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface BookingFormData {
  serviceId: string;
  doctorId: string;
  date: Dayjs;
  appointmentMode: 'in-person' | 'telemedicine' | 'home-visit';
  reason?: string;
}

const BookAppointmentWithSlots: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm<BookingFormData>();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  useEffect(() => {
    loadServices();
    loadDoctors();
  }, []);

  const loadServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data?.data || []);
    } catch (error: any) {
      msgApi.error('Failed to load services');
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get('/users?role=doctor');
      setDoctors(res.data?.data || []);
    } catch (error: any) {
      msgApi.error('Failed to load doctors');
    }
  };

  const loadAvailableSlots = async (doctorId: string, date: Dayjs) => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/availability/${doctorId}/${date.format('YYYY-MM-DD')}`);
      setTimeSlots(res.data?.slots || []);
    } catch (error: any) {
      msgApi.error('Failed to load available slots');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    const doctorId = form.getFieldValue('doctorId');
    if (date && doctorId) {
      loadAvailableSlots(doctorId, date);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    setSelectedSlot(null);
    if (selectedDate) {
      loadAvailableSlots(doctorId, selectedDate);
    }
  };

  const handleServiceChange = async (serviceId: string) => {
    // Load available doctors for this service
    try {
      const res = await api.get(`/doctors?serviceId=${serviceId}`);
      setAvailableDoctors(res.data?.data || []);
    } catch (error: any) {
      msgApi.error('Failed to load available doctors');
    }
  };

  const onFinish = async (values: BookingFormData) => {
    if (!selectedSlot) {
      msgApi.error('Please select a time slot');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        serviceId: values.serviceId,
        doctorId: values.doctorId,
        startTime: `${selectedDate?.format('YYYY-MM-DD')} ${selectedSlot.startTime}`,
        endTime: `${selectedDate?.format('YYYY-MM-DD')} ${selectedSlot.endTime}`,
        mode: values.appointmentMode,
        reason: values.reason
      };

      await api.post('/appointments', payload);
      msgApi.success('Appointment booked successfully!');
      form.resetFields();
      setStep(0);
      setSelectedDate(null);
      setSelectedSlot(null);
      setTimeSlots([]);
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Select Service',
      icon: <CheckCircleOutlined />
    },
    {
      title: 'Choose Doctor',
      icon: <CheckCircleOutlined />
    },
    {
      title: 'Pick Date & Time',
      icon: <CalendarOutlined />
    },
    {
      title: 'Confirm',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px', maxWidth: 1000, margin: '0 auto' }}>
        <Title level={2}>Book an Appointment</Title>

        <Steps current={step} items={steps} style={{ marginBottom: 30 }} />

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            {/* Step 1: Service Selection */}
            {step === 0 && (
              <div>
                <Title level={4}>Select a Service</Title>
                <Form.Item
                  name="serviceId"
                  rules={[{ required: true, message: 'Please select a service' }]}
                >
                  <Select
                    placeholder="Choose a service"
                    onChange={handleServiceChange}
                    options={services.map(s => ({
                      value: s.id,
                      label: (
                        <div>
                          <Text strong>{s.name}</Text>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {s.duration} minutes | {s.description}
                          </div>
                        </div>
                      )
                    }))}
                  />
                </Form.Item>
              </div>
            )}

            {/* Step 2: Doctor Selection */}
            {step === 1 && (
              <div>
                <Title level={4}>Choose a Doctor</Title>
                <Form.Item
                  name="doctorId"
                  rules={[{ required: true, message: 'Please select a doctor' }]}
                >
                  <Select
                    placeholder="Select a doctor"
                    onChange={handleDoctorChange}
                    options={availableDoctors.length > 0 ? availableDoctors.map(d => ({
                      value: d.id,
                      label: `Dr. ${d.firstName} ${d.lastName}${d.specialization ? ` - ${d.specialization}` : ''}`
                    })) : doctors.map(d => ({
                      value: d.id,
                      label: `Dr. ${d.firstName} ${d.lastName}${d.specialization ? ` - ${d.specialization}` : ''}`
                    }))}
                  />
                </Form.Item>
              </div>
            )}

            {/* Step 3: Date & Time Selection */}
            {step === 2 && (
              <div>
                <Title level={4}>Select Date and Time</Title>

                <Form.Item
                  label="Appointment Date"
                  rules={[{ required: true, message: 'Please select a date' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    disabledDate={(current) => current && current.isBefore(dayjs(), 'day')}
                    onChange={handleDateChange}
                  />
                </Form.Item>

                {selectedDate && (
                  <>
                    <Divider>Available Time Slots</Divider>
                    {loading ? (
                      <Spin />
                    ) : timeSlots.length > 0 ? (
                      <div>
                        <Row gutter={[10, 10]}>
                          {timeSlots.map((slot) => (
                            <Col key={slot.startTime} xs={12} sm={8} md={6}>
                              <Card
                                hoverable
                                onClick={() => slot.isAvailable && setSelectedSlot(slot)}
                                style={{
                                  borderColor: selectedSlot?.startTime === slot.startTime ? '#1890ff' : undefined,
                                  backgroundColor: selectedSlot?.startTime === slot.startTime ? '#e6f7ff' : undefined,
                                  opacity: slot.isAvailable ? 1 : 0.5,
                                  cursor: slot.isAvailable ? 'pointer' : 'not-allowed'
                                }}
                              >
                                <div style={{ textAlign: 'center' }}>
                                  <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 10 }} />
                                  <div>
                                    <Text strong>{slot.startTime}</Text>
                                  </div>
                                  <Tag
                                    color={slot.isAvailable ? 'green' : 'red'}
                                    style={{ marginTop: 5 }}
                                  >
                                    {slot.isAvailable ? 'Available' : 'Booked'}
                                  </Tag>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ) : (
                      <Empty description="No available slots for this date" />
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 3 && (
              <div>
                <Title level={4}>Confirm Your Appointment</Title>

                <Card type="inner" style={{ marginBottom: 20, backgroundColor: '#f5f5f5' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Service: </Text>
                      <Text>{services.find(s => s.id === form.getFieldValue('serviceId'))?.name}</Text>
                    </div>
                    <div>
                      <Text strong>Doctor: </Text>
                      <Text>
                        Dr. {doctors.find(d => d.id === form.getFieldValue('doctorId'))?.firstName}{' '}
                        {doctors.find(d => d.id === form.getFieldValue('doctorId'))?.lastName}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Date & Time: </Text>
                      <Text>
                        {selectedDate?.format('MMMM DD, YYYY')} at {selectedSlot?.startTime}
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Form.Item
                  name="appointmentMode"
                  label="Appointment Mode"
                  rules={[{ required: true, message: 'Please select appointment mode' }]}
                  initialValue="in-person"
                >
                  <Radio.Group>
                    <Radio value="in-person">In-Person</Radio>
                    <Radio value="telemedicine">Telemedicine (Video Call)</Radio>
                    <Radio value="home-visit">Home Visit</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="reason"
                  label="Reason for Visit (Optional)"
                >
                  <Input.TextArea
                    placeholder="Describe your symptoms or reason for visit"
                    rows={3}
                  />
                </Form.Item>
              </div>
            )}

            {/* Navigation Buttons */}
            <Space style={{ marginTop: 30, width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => step > 0 && setStep(step - 1)}>
                {step === 0 ? 'Cancel' : 'Previous'}
              </Button>
              {step < 3 ? (
                <Button
                  type="primary"
                  onClick={() => {
                    form.validateFields().then(() => {
                      if (step === 2 && !selectedSlot) {
                        msgApi.error('Please select a time slot');
                        return;
                      }
                      setStep(step + 1);
                    });
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                >
                  Confirm Appointment
                </Button>
              )}
            </Space>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default BookAppointmentWithSlots;
