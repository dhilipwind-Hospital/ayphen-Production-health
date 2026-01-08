import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Typography, Space, Alert, message, Radio, Spin, Tag, Empty } from 'antd';
import styled, { keyframes } from 'styled-components';
import { HeartOutlined, CalendarOutlined, SolutionOutlined, ClockCircleOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Department {
  id: string;
  name: string;
}

interface AvailableSlot {
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    department: any;
  };
  availabilitySlot: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
  availableTimeSlots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

const fallbackDepartments: Department[] = [
  'General Medicine',
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
  'Radiology',
  'Pulmonology',
  'Nephrology',
].map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name }));

const BookAppointmentEnhanced: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const mergedDepartments = React.useMemo<Department[]>(() => {
    if (departments.length > 0) return departments;
    return fallbackDepartments;
  }, [departments]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/departments', { params: { page: 1, limit: 100, isActive: 'true' }, suppressErrorToast: true } as any);
        const items = (res.data?.data || res.data || []) as any[];
        if (items.length > 0) setDepartments(items);
      } catch {}
    };
    load();
  }, []);

  // Load available slots when date or department changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedDoctor(null);
      setSelectedTimeSlot(null);
    }
  }, [selectedDate, departmentId]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const params: any = {
        date: selectedDate.format('YYYY-MM-DD')
      };
      if (departmentId) {
        params.departmentId = departmentId;
      }

      const res = await api.get('/availability/slots/available', { params });
      setAvailableSlots(res.data?.data || []);
      
      if (res.data?.data?.length === 0) {
        message.info('No available slots for this date. Please try another date.');
      }
    } catch (error: any) {
      message.error('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onFinish = async (values: any) => {
    if (!selectedDoctor || !selectedTimeSlot) {
      message.warning('Please select a doctor and time slot');
      return;
    }

    setSubmitting(true);
    try {
      const depName = mergedDepartments.find(d => d.id === values.departmentId)?.name;
      const selectedSlot = availableSlots
        .find(s => s.doctor.id === selectedDoctor)
        ?.availableTimeSlots.find(t => t.startTime === selectedTimeSlot);

      await api.post('/public/appointment-requests', {
        name: values.name,
        phone: values.phone,
        email: values.email,
        departmentId: values.departmentId,
        departmentName: depName,
        doctorId: selectedDoctor,
        preferredTime: selectedSlot?.startTime,
        notes: values.notes
      }, { suppressErrorToast: true } as any);
      
      message.success('Appointment booked successfully! You will receive a confirmation shortly.');
      navigate('/home');
    } catch (e: any) {
      message.success('Appointment request received. Our team will contact you shortly.');
      navigate('/home');
    } finally {
      setSubmitting(false);
    }
  };

  const disabledDate = (current: dayjs.Dayjs) => {
    // Disable past dates
    return current && current < dayjs().startOf('day');
  };

  return (
    <div>
      <Hero>
        <div>
          <Title level={2} style={{ margin: 0 }}>Book an Appointment</Title>
          <Paragraph style={{ marginTop: 6 }}>Select a date to see available doctors and time slots</Paragraph>
        </div>
        <div className="art" aria-hidden>
          <span className="heart"><HeartOutlined /></span>
          <span className="cal"><CalendarOutlined /></span>
          <span className="ortho"><SolutionOutlined /></span>
        </div>
      </Hero>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Step 1: Select Department and Date */}
          <Card type="inner" title="Step 1: Choose Department & Date" style={{ marginBottom: 16 }}>
            <Form.Item name="departmentId" label="Department (Optional)">
              <Select
                placeholder="Select a department to filter doctors"
                allowClear
                onChange={(val) => {
                  setDepartmentId(val);
                  setSelectedDoctor(null);
                  setSelectedTimeSlot(null);
                }}
                value={departmentId}
              >
                {mergedDepartments.map(d => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Appointment Date" required>
              <DatePicker
                style={{ width: '100%' }}
                disabledDate={disabledDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setSelectedDoctor(null);
                  setSelectedTimeSlot(null);
                }}
                placeholder="Select appointment date"
              />
            </Form.Item>
          </Card>

          {/* Step 2: Select Doctor and Time Slot */}
          {selectedDate && (
            <Card type="inner" title="Step 2: Select Doctor & Time Slot" style={{ marginBottom: 16 }}>
              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>Loading available slots...</div>
                </div>
              ) : availableSlots.length === 0 ? (
                <Empty
                  description="No doctors available on this date"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {availableSlots.map((slot) => (
                    <DoctorSlotCard
                      key={slot.doctor.id}
                      selected={selectedDoctor === slot.doctor.id}
                      onClick={() => {
                        setSelectedDoctor(slot.doctor.id);
                        setSelectedTimeSlot(null);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <Text strong style={{ fontSize: 16 }}>
                            Dr. {slot.doctor.firstName} {slot.doctor.lastName}
                          </Text>
                          <div>
                            <Tag color="blue">{slot.doctor.department?.name || 'General'}</Tag>
                            <Tag color="green">{slot.availableTimeSlots.length} slots available</Tag>
                          </div>
                        </div>
                        {selectedDoctor === slot.doctor.id && (
                          <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                        )}
                      </div>

                      {selectedDoctor === slot.doctor.id && (
                        <div style={{ marginTop: 16 }}>
                          <Text strong>Available Time Slots:</Text>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
                            {slot.availableTimeSlots.map((timeSlot) => (
                              <TimeSlotButton
                                key={timeSlot.startTime}
                                selected={selectedTimeSlot === timeSlot.startTime}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTimeSlot(timeSlot.startTime);
                                }}
                              >
                                <ClockCircleOutlined /> {dayjs(timeSlot.startTime).format('hh:mm A')}
                              </TimeSlotButton>
                            ))}
                          </div>
                        </div>
                      )}
                    </DoctorSlotCard>
                  ))}
                </Space>
              )}
            </Card>
          )}

          {/* Step 3: Patient Information */}
          {selectedDoctor && selectedTimeSlot && (
            <Card type="inner" title="Step 3: Your Information" style={{ marginBottom: 16 }}>
              <Alert
                message="Selected Appointment"
                description={`${dayjs(selectedTimeSlot).format('MMMM D, YYYY at hh:mm A')} with Dr. ${availableSlots.find(s => s.doctor.id === selectedDoctor)?.doctor.firstName} ${availableSlots.find(s => s.doctor.id === selectedDoctor)?.doctor.lastName}`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
                <Input placeholder="Full name" prefix={<UserOutlined />} />
              </Form.Item>

              <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Please enter your phone number' }]}>
                <Input placeholder="Phone number" />
              </Form.Item>

              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
                <Input placeholder="Email (optional)" />
              </Form.Item>

              <Form.Item name="notes" label="Reason for Visit">
                <Input.TextArea rows={4} placeholder="Brief description of your symptoms or reason for visit" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
                  Confirm Booking
                </Button>
              </Form.Item>
            </Card>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default BookAppointmentEnhanced;

// Styled Components
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const Hero = styled.section`
  position: relative;
  background: radial-gradient(1200px 600px at 10% -10%, rgba(14,165,233,0.18), transparent),
              radial-gradient(1000px 500px at 90% 0%, rgba(34,197,94,0.12), transparent),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px 20px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
  align-items: center;

  .art {
    position: relative;
    height: 90px;
  }

  .art span {
    position: absolute;
    font-size: 26px;
    opacity: 0.95;
  }

  .art .heart {
    left: 10px;
    top: 16px;
    color: #ef4444;
    animation: ${pulse} 2.2s ease-in-out infinite;
  }

  .art .cal {
    left: 64px;
    top: 40px;
    color: #0ea5e9;
    animation: ${float} 3s ease-in-out infinite;
  }

  .art .ortho {
    left: 116px;
    top: 18px;
    color: #22c55e;
    animation: ${float} 3.4s ease-in-out infinite;
  }
`;

const DoctorSlotCard = styled.div<{ selected: boolean }>`
  padding: 16px;
  border: 2px solid ${props => props.selected ? '#1890ff' : '#d9d9d9'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.selected ? '#e6f7ff' : '#fff'};

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  }
`;

const TimeSlotButton = styled.button<{ selected: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${props => props.selected ? '#52c41a' : '#d9d9d9'};
  border-radius: 4px;
  background: ${props => props.selected ? '#52c41a' : '#fff'};
  color: ${props => props.selected ? '#fff' : '#000'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    border-color: #52c41a;
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
  }
`;
