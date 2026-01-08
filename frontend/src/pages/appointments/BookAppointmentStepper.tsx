import React, { useEffect, useState } from 'react';
import { Steps, Button, Card, Select, DatePicker, Radio, Input, message, Descriptions, Tag, Alert, Space, Spin, Modal, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import dayjs, { Dayjs } from 'dayjs';
import { 
  MedicineBoxOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import './BookAppointmentStepper.css';

const { Option } = Select;
const { TextArea } = Input;

interface Service {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  department?: { id: string; name: string };
}

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  department?: { id: string; name: string };
  consultationFee?: number;
  experience?: number;
  rating?: number;
  availableDays?: string[];
}

const BookAppointmentStepper: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useAuth();

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [urgency, setUrgency] = useState('routine');
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [reason, setReason] = useState('');
  const [skipTriage, setSkipTriage] = useState(false);
  const [notes, setNotes] = useState('');

  // Success modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check authentication first
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('🔐 Authentication check:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        console.error('❌ No authentication token found');
        messageApi.error('Please login first');
        navigate('/login');
        return;
      }
      
      if (!user) {
        console.error('❌ No user context found');
        messageApi.error('Please login first');
        navigate('/login');
        return;
      }
      
      // Get user's organization info
      const userOrg = (user as any)?.organization;
      const orgId = userOrg?.id;
      const orgName = userOrg?.name || 'Unknown';
      
      console.log('🔍 Loading appointment booking data...');
      console.log('👤 Current user:', user?.firstName, user?.lastName, `(${user?.role})`);
      console.log('🏥 User organization:', orgName, `(ID: ${orgId})`);
      console.log('🔐 Token preview:', token?.substring(0, 20) + '...');
      
      // Check if user has organization context
      if (!orgId || orgId === 'default') {
        console.warn('⚠️ No valid organization context found');
        messageApi.warning('Please select your organization first');
        return;
      }
      
      // Test authentication with a simple API call first
      console.log('🧪 Testing authentication...');
      try {
        const testRes = await api.get('/auth/me');
        console.log('✅ Authentication test successful:', testRes.data);
      } catch (authError: any) {
        console.error('❌ Authentication test failed:', authError.response?.data);
        messageApi.error('Authentication failed. Please login again.');
        navigate('/login');
        return;
      }
      
      console.log('📡 Making API calls...');
      const [svcRes, deptRes, docRes] = await Promise.all([
        api.get('/services', { params: { page: 1, limit: 200 } }),
        api.get('/departments', { params: { page: 1, limit: 200 } }),
        api.get('/visits/available-doctors', { suppressErrorToast: true } as any)
      ]);
      
      console.log('📋 Services response:', svcRes.data);
      console.log('🏥 Departments response:', deptRes.data);
      console.log('👨‍⚕️ Doctors response:', docRes.data);
      
      const services = svcRes.data?.data || svcRes.data || [];
      const departments = deptRes.data?.data || deptRes.data || [];
      const doctors = docRes.data?.data || docRes.data || [];
      
      console.log('✅ Parsed services:', services.length, 'services found');
      console.log('✅ Parsed departments:', departments.length, 'departments found');
      console.log('✅ Parsed doctors:', doctors.length, 'doctors found');
      
      // Log first few items for debugging
      if (services.length > 0) {
        console.log('📋 First service:', services[0]);
      }
      if (doctors.length > 0) {
        console.log('👨‍⚕️ First doctor:', doctors[0]);
      }
      
      setServices(services);
      setDepartments(departments);
      setDoctors(doctors);
      
      // Show success message
      if (services.length === 0) {
        messageApi.info(`No services found for ${orgName}. Please contact your administrator to add services.`);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      console.error('❌ Error details:', error.response?.data);
      messageApi.error('Failed to load appointment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter doctors based on selected service/department
  const getFilteredDoctors = () => {
    if (!selectedService) return doctors;
    
    // If service has a department, filter doctors by that department
    if (selectedService.department?.id) {
      return doctors.filter(doctor => 
        doctor.department?.id === selectedService.department?.id
      );
    }
    
    return doctors;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: any = {
      morning: [],
      afternoon: [],
      evening: []
    };

    // Morning: 9 AM - 12 PM
    for (let hour = 9; hour < 12; hour++) {
      slots.morning.push({
        time: `${hour}:00 AM`,
        value: `${hour}:00`,
        available: Math.random() > 0.3
      });
      slots.morning.push({
        time: `${hour}:30 AM`,
        value: `${hour}:30`,
        available: Math.random() > 0.3
      });
    }

    // Afternoon: 12 PM - 5 PM
    for (let hour = 12; hour < 17; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      slots.afternoon.push({
        time: `${displayHour}:00 PM`,
        value: `${hour}:00`,
        available: Math.random() > 0.3
      });
      slots.afternoon.push({
        time: `${displayHour}:30 PM`,
        value: `${hour}:30`,
        available: Math.random() > 0.3
      });
    }

    // Evening: 5 PM - 8 PM
    for (let hour = 17; hour < 20; hour++) {
      const displayHour = hour - 12;
      slots.evening.push({
        time: `${displayHour}:00 PM`,
        value: `${hour}:00`,
        available: Math.random() > 0.3
      });
      slots.evening.push({
        time: `${displayHour}:30 PM`,
        value: `${hour}:30`,
        available: Math.random() > 0.3
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const next = () => {
    // Validate current step
    if (current === 0 && !selectedService) {
      messageApi.error('Please select a service');
      return;
    }
    if (current === 1 && !selectedDoctor) {
      messageApi.error('Please select a doctor');
      return;
    }
    if (current === 2 && (!selectedDate || !selectedTime)) {
      messageApi.error('Please select date and time');
      return;
    }
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDoctor || !selectedDate || !selectedTime) {
      messageApi.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const [hourStr, minuteStr] = selectedTime.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const startTime = selectedDate.hour(hour).minute(minute);
      const endTime = startTime.add(selectedService.duration || 30, 'minute');

      const payload = {
        serviceId: selectedService.id,
        doctorId: selectedDoctor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        reason: reason || 'General consultation',
        notes: notes,
        preferences: {
          urgency: urgency,
          departmentId: departmentId,
          priority: skipTriage ? 'urgent' : urgency
        }
      };

      const response = await api.post('/appointments', payload);
      
      setBookingDetails({
        date: selectedDate.format('MMMM D, YYYY'),
        time: selectedTime,
        service: selectedService.name,
        confirmationId: response.data?.id || 'N/A'
      });
      setShowSuccess(true);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Step content
  const steps = [
    {
      title: 'Service',
      icon: <MedicineBoxOutlined />,
      content: (
        <div className="step-content">
          <h3>Select a Service</h3>
          <p className="step-description">Choose the medical service you need</p>
          
          {(user as any)?.organization && (
            <Alert
              type="info"
              message={`Booking appointment for: ${(user as any).organization.name}`}
              style={{ marginBottom: 16 }}
              showIcon
            />
          )}
          
          <Select
            size="large"
            style={{ width: '100%' }}
            placeholder="Search and select a service"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
            value={selectedService?.id}
            onChange={(value) => {
              const service = services.find(s => s.id === value);
              setSelectedService(service || null);
              setSelectedDoctor(null); // Reset doctor selection when service changes
              if (service?.department?.id) {
                setDepartmentId(service.department.id);
              }
            }}
            loading={loading}
          >
            {services.map(service => (
              <Option key={service.id} value={service.id}>
                {service.name}
              </Option>
            ))}
          </Select>

          {selectedService && (
            <Card className="service-info-card" style={{ marginTop: 16 }}>
              <h4>{selectedService.name}</h4>
              {selectedService.description && <p>{selectedService.description}</p>}
              <Space>
                {selectedService.duration && (
                  <Tag color="blue">Duration: {selectedService.duration} mins</Tag>
                )}
                {selectedService.department && (
                  <Tag color="green">Department: {selectedService.department.name}</Tag>
                )}
              </Space>
            </Card>
          )}
        </div>
      )
    },
    {
      title: 'Doctor',
      icon: <UserOutlined />,
      content: (
        <div className="step-content">
          <h3>Select a Doctor</h3>
          <p className="step-description">Choose your preferred doctor for the consultation</p>
          
          {!selectedService ? (
            <Alert
              type="info"
              message="Please select a service first"
              description="You need to select a service before choosing a doctor."
              showIcon
            />
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <Select
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Search and select a doctor"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                  value={selectedDoctor?.id}
                  onChange={(value) => {
                    const doctor = getFilteredDoctors().find(d => d.id === value);
                    setSelectedDoctor(doctor || null);
                  }}
                  loading={loading}
                >
                  {getFilteredDoctors().map(doctor => (
                    <Option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                      {doctor.specialization && ` - ${doctor.specialization}`}
                    </Option>
                  ))}
                </Select>
              </div>

              {selectedDoctor && (
                <Card className="doctor-info-card" style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4>Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</h4>
                      {selectedDoctor.specialization && (
                        <p style={{ color: '#666', margin: '4px 0' }}>{selectedDoctor.specialization}</p>
                      )}
                      <Space wrap>
                        {selectedDoctor.department && (
                          <Tag color="blue">Department: {selectedDoctor.department.name}</Tag>
                        )}
                        {selectedDoctor.experience && (
                          <Tag color="green">{selectedDoctor.experience} years experience</Tag>
                        )}
                        {selectedDoctor.rating && (
                          <Tag color="gold">★ {selectedDoctor.rating}/5</Tag>
                        )}
                      </Space>
                    </div>
                    {selectedDoctor.consultationFee && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e91e63' }}>
                          ${selectedDoctor.consultationFee}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Consultation Fee</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {getFilteredDoctors().length === 0 && (
                <Alert
                  type="warning"
                  message="No doctors available"
                  description="No doctors are available for the selected service. Please try a different service or contact support."
                  showIcon
                />
              )}
            </>
          )}
        </div>
      )
    },
    {
      title: 'Date & Time',
      icon: <CalendarOutlined />,
      content: (
        <div className="step-content">
          <h3>Choose Date & Time</h3>
          <p className="step-description">Select your preferred appointment slot</p>

          <div style={{ marginBottom: 24 }}>
            <label className="step-label">Select Date</label>
            <DatePicker
              size="large"
              style={{ width: '100%' }}
              disabledDate={(d) => d && d < dayjs().startOf('day')}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              value={selectedDate}
              placeholder="Choose a date"
            />
          </div>

          {selectedDate && (
            <div className="time-slots-container">
              <div className="time-period">
                <div className="time-period-title">🌅 Morning (9:00 AM - 12:00 PM)</div>
                <div className="slot-grid">
                  {timeSlots.morning.map((slot: any) => (
                    <Button
                      key={slot.value}
                      className={`time-slot ${slot.available ? 'available' : 'booked'} ${selectedTime === slot.value ? 'selected' : ''}`}
                      onClick={() => slot.available && handleTimeSelect(slot.value)}
                      disabled={!slot.available}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="time-period">
                <div className="time-period-title">☀️ Afternoon (12:00 PM - 5:00 PM)</div>
                <div className="slot-grid">
                  {timeSlots.afternoon.map((slot: any) => (
                    <Button
                      key={slot.value}
                      className={`time-slot ${slot.available ? 'available' : 'booked'} ${selectedTime === slot.value ? 'selected' : ''}`}
                      onClick={() => slot.available && handleTimeSelect(slot.value)}
                      disabled={!slot.available}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="time-period">
                <div className="time-period-title">🌙 Evening (5:00 PM - 8:00 PM)</div>
                <div className="slot-grid">
                  {timeSlots.evening.map((slot: any) => (
                    <Button
                      key={slot.value}
                      className={`time-slot ${slot.available ? 'available' : 'booked'} ${selectedTime === slot.value ? 'selected' : ''}`}
                      onClick={() => slot.available && handleTimeSelect(slot.value)}
                      disabled={!slot.available}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Details',
      icon: <FileTextOutlined />,
      content: (
        <div className="step-content">
          <h3>Additional Information</h3>
          <p className="step-description">Provide any additional details for your appointment</p>

          <div style={{ marginBottom: 16 }}>
            <label className="step-label">Urgency</label>
            <Radio.Group 
              value={urgency} 
              onChange={(e) => setUrgency(e.target.value)}
              style={{ width: '100%' }}
            >
              <Radio.Button value="routine" style={{ width: '33.33%', textAlign: 'center' }}>
                📅 Routine
              </Radio.Button>
              <Radio.Button value="urgent" style={{ width: '33.33%', textAlign: 'center' }}>
                ⚡ Urgent
              </Radio.Button>
              <Radio.Button value="emergency" style={{ width: '33.33%', textAlign: 'center' }}>
                🚨 Emergency
              </Radio.Button>
            </Radio.Group>
          </div>

          {urgency === 'emergency' && (
            <Alert
              type="warning"
              message="For emergencies, please use our 24/7 Emergency page"
              description={<a href="/emergency">Go to Emergency</a>}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="step-label">Department (Optional)</label>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="Select department"
              value={departmentId}
              onChange={setDepartmentId}
              allowClear
            >
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="step-label">Appointment Type</label>
            <Radio.Group 
              value={skipTriage} 
              onChange={(e) => setSkipTriage(e.target.value)}
              style={{ width: '100%' }}
            >
              <Radio.Button value={false} style={{ width: '50%', textAlign: 'center' }}>
                🏥 Standard (with Triage)
              </Radio.Button>
              <Radio.Button value={true} style={{ width: '50%', textAlign: 'center' }}>
                👨‍⚕️ Direct Doctor Consultation
              </Radio.Button>
            </Radio.Group>
          </div>

          {skipTriage && (
            <Alert
              type="info"
              message="Direct Doctor Consultation"
              description="You will skip the triage station and go directly to the doctor. This is recommended for follow-up visits and pre-scheduled consultations."
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="step-label">Reason for Visit</label>
            <TextArea
              rows={3}
              placeholder="Brief description of your concern"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="step-label">Additional Notes (Optional)</label>
            <TextArea
              rows={2}
              placeholder="Any additional information"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Confirm',
      icon: <CheckCircleOutlined />,
      content: (
        <div className="step-content">
          <h3>Review Your Appointment</h3>
          <p className="step-description">Please review your appointment details before confirming</p>

          <Card className="confirmation-card">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Service">
                <strong>{selectedService?.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Doctor">
                <strong>
                  Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                  {selectedDoctor?.specialization && ` - ${selectedDoctor.specialization}`}
                </strong>
                {selectedDoctor?.consultationFee && (
                  <div style={{ color: '#e91e63', fontWeight: 'bold', marginTop: 4 }}>
                    Consultation Fee: ${selectedDoctor.consultationFee}
                  </div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                <strong>{selectedDate?.format('MMMM D, YYYY')}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Time">
                <strong>{selectedTime}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedService?.duration || 30} minutes
              </Descriptions.Item>
              <Descriptions.Item label="Urgency">
                <Tag color={urgency === 'emergency' ? 'red' : urgency === 'urgent' ? 'orange' : 'blue'}>
                  {urgency.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              {reason && (
                <Descriptions.Item label="Reason">
                  {reason}
                </Descriptions.Item>
              )}
              {notes && (
                <Descriptions.Item label="Notes">
                  {notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Alert
            type="info"
            message="By confirming, you agree to our terms and conditions"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    }
  ];

  return (
    <div className="appointment-stepper-container">
      {contextHolder}

      {/* Loading Overlay */}
      {submitting && (
        <div className="loading-overlay">
          <Spin size="large" />
          <p>Booking your appointment...</p>
        </div>
      )}

      {/* Success Modal */}
      <Modal
        open={showSuccess}
        footer={null}
        closable={false}
        centered
        className="success-modal"
      >
        <Result
          status="success"
          title="Appointment Booked Successfully!"
          subTitle={
            <Space direction="vertical" size="small">
              <p><strong>Date:</strong> {bookingDetails?.date}</p>
              <p><strong>Time:</strong> {bookingDetails?.time}</p>
              <p><strong>Service:</strong> {bookingDetails?.service}</p>
              <p><strong>Confirmation ID:</strong> {bookingDetails?.confirmationId}</p>
            </Space>
          }
          extra={[
            <Button type="primary" key="view" onClick={() => navigate('/appointments')}>
              View My Appointments
            </Button>,
            <Button key="home" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ]}
        />
      </Modal>

      <Card className="stepper-card">
        <h2 className="page-title">📅 Book an Appointment</h2>
        
        <Steps current={current} className="appointment-steps">
          {steps.map((item, index) => (
            <Steps.Step 
              key={index} 
              title={item.title} 
              icon={item.icon}
            />
          ))}
        </Steps>

        <div className="steps-content">
          {steps[current].content}
        </div>

        <div className="steps-action">
          {current > 0 && (
            <Button 
              size="large"
              onClick={prev}
              icon={<LeftOutlined />}
            >
              Back
            </Button>
          )}
          {current < steps.length - 1 && (
            <Button 
              type="primary" 
              size="large"
              onClick={next}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button 
              type="primary" 
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              icon={<CheckCircleOutlined />}
            >
              Confirm Booking
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BookAppointmentStepper;
