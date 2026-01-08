import React, { useEffect, useMemo, useState } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Typography, message, Radio, Alert, Collapse, Checkbox, Modal, Spin, Result, Space, Descriptions, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../services/api';
import { CheckCircleOutlined, CloseCircleOutlined, MedicineBoxOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './BookAppointmentAuth.css';

const { Title } = Typography;
const { Option } = Select;

interface Service { id: string; name: string; duration?: number; averageDuration?: number; department?: { id: string; name: string }; departmentId?: string }
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  department?: { id: string; name: string };
  preferences?: { seniority?: string };
  seniority?: string; // fallback if server sends it top-level
}
interface Department { id: string; name: string }

const BookAppointmentAuth: React.FC = () => {
  const [form] = Form.useForm();
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [start, setStart] = useState<Dayjs | null>(null);
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [manualDoctor, setManualDoctor] = useState<boolean>(false);
  const [lastValues, setLastValues] = useState<any>();
  const [suggestion, setSuggestion] = useState<{ doctorId: string; startTime: string; endTime: string } | null>(null);
  const [pendingApptId, setPendingApptId] = useState<string | undefined>(undefined);
  const [accepting, setAccepting] = useState<boolean>(false);
  
  // New state for enhanced UI
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  // Watch doctor seniority preference from the form (AntD v5)
  const seniorityPref = (Form as any).useWatch ? (Form as any).useWatch('doctorSeniority', form) as string | undefined : undefined;

  useEffect(() => {
    const load = async () => {
      try {
        const fetchAll = async () => {
          const [svcRes, deptRes, docRes] = await Promise.all([
            api.get('/services', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any),
            api.get('/departments', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any),
            api.get('/public/doctors', { suppressErrorToast: true } as any),
          ]);
          const svcs = (svcRes.data?.data || svcRes.data || []) as Service[];
          setServices(svcs || []);
          setDepartments((deptRes.data?.data || deptRes.data || []) as Department[]);
          setDoctors((docRes.data?.data || docRes.data || []) as Doctor[]);
          return { svcs };
        };

        let { svcs } = await fetchAll();

        // If no services found in non-production, seed demo data then re-fetch
        if ((svcs?.length ?? 0) === 0 && process.env.NODE_ENV !== 'production') {
          try {
            // Ensure departments and doctors exist so service seeding can attach to them
            await api.post('/dev/seed-doctors-by-department');
          } catch { /* ignore */ }
          try {
            await api.post('/dev/seed-services-by-department');
            const result = await fetchAll();
            svcs = result.svcs;
            if ((svcs?.length ?? 0) > 0) {
              messageApi.info('Loaded demo services for quick booking.');
            }
          } catch { /* ignore */ }
        }
      } catch (e) {
        // graceful fallback: leave arrays empty and let user select without filters
        setServices([]);
        setDepartments([]);
        setDoctors([]);
      }
    };
    load();
  }, []);

  const fallbackDepartments: Department[] = [
    'General Medicine','Cardiology','Orthopedics','Pediatrics','Dermatology',
    'Ophthalmology','Neurology','ENT','Gastroenterology','Gynecology','Urology','Oncology','Radiology','Psychiatry','Pulmonology','Nephrology'
  ].map(name => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name }));

  // Derived department list (merge from departments and services if needed) without duplicate names
  const mergedDepartments = useMemo<Department[]>(() => {
    const byName = new Map<string, { id: string; name: string }>();
    const norm = (n?: string) => String(n || '').trim().toLowerCase();
    // Prefer real departments first
    (departments || []).forEach(d => {
      if (d?.id && d?.name) {
        const key = norm(d.name);
        if (!byName.has(key)) byName.set(key, { id: String(d.id), name: String(d.name) });
      }
    });
    // Then fill from services if missing by name
    (services || []).forEach(s => {
      const id = s.department?.id || s.departmentId;
      const name = s.department?.name;
      if (id && name) {
        const key = norm(name);
        if (!byName.has(key)) byName.set(key, { id: String(id), name: String(name) });
      }
    });
    // Finally add curated fallbacks only if name missing
    fallbackDepartments.forEach(fd => {
      const key = norm(fd.name);
      if (!byName.has(key)) byName.set(key, { id: fd.id, name: fd.name });
    });
    return Array.from(byName.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [departments, services]);

  // Filtered options based on selected department
  const filteredServices = useMemo(() => {
    if (!departmentId) return services;
    return services.filter(s => (s.department?.id || s.departmentId) === departmentId);
  }, [services, departmentId]);
  const selectedDeptName = useMemo(() => (mergedDepartments.find(d => d.id === departmentId)?.name || ''), [mergedDepartments, departmentId]);
  const filteredDoctors = useMemo(() => {
    const getSen = (d: any) => String(((d as any)?.preferences?.seniority || (d as any)?.seniority || '')).toLowerCase();
    // Base filter by department via id, fallback to name match if ids differ
    const base = departmentId
      ? doctors.filter(d => ((d as any)?.department?.id === departmentId) || (!!selectedDeptName && (d as any)?.department?.name === selectedDeptName))
      : doctors;
    const want = String(seniorityPref || '').toLowerCase();
    if (want && want !== 'any') {
      return base.filter(d => getSen(d) === want);
    }
    return base;
  }, [doctors, departmentId, selectedDeptName, seniorityPref]);

  // Auto-select doctor when exactly one matches filters; clear if current selection not in the filtered list
  useEffect(() => {
    const cur = form.getFieldValue('doctorId');
    const ids = new Set(filteredDoctors.map(d => d.id));
    if (ids.size === 1) {
      const onlyId = filteredDoctors[0]?.id;
      if (onlyId && cur !== onlyId) form.setFieldsValue({ doctorId: onlyId });
    } else if (cur && !ids.has(cur)) {
      form.setFieldsValue({ doctorId: undefined });
    }
  }, [filteredDoctors, form]);

  const doctorExtraText = useMemo(() => {
    const want = String(seniorityPref || '').toLowerCase();
    if (want && want !== 'any') {
      const count = filteredDoctors.length;
      return count > 0
        ? `Showing ${count} doctor(s) with seniority: ${String(seniorityPref).toUpperCase()}`
        : `No ${String(seniorityPref).toUpperCase()} found in ${selectedDeptName || 'this department'}`;
    }
    return undefined;
  }, [seniorityPref, selectedDeptName, filteredDoctors]);

  // If selected doctor no longer matches current department/seniority, clear it
  useEffect(() => {
    const currentDoctorId = form.getFieldValue('doctorId');
    if (!currentDoctorId) return;
    const doc = doctors.find(d => d.id === currentDoctorId);
    if (!doc) return form.setFieldsValue({ doctorId: undefined });
    const depOk = departmentId ? ((doc as any)?.department?.id === departmentId) : true;
    const want = String(seniorityPref || '').toLowerCase();
    const docSen = String(((doc as any)?.preferences?.seniority || (doc as any)?.seniority || '')).toLowerCase();
    const senOk = !want || want === 'any' ? true : (docSen === want);
    if (!depOk || !senOk) form.setFieldsValue({ doctorId: undefined });
  }, [departmentId, seniorityPref, doctors, form]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      setLastValues(values);
      const startTimeISO = values.startTime?.toISOString();
      const durationMin = selectedService?.averageDuration ?? selectedService?.duration ?? 30;
      const endTimeISO = values.endTime
        ? values.endTime.toISOString()
        : dayjs(values.startTime).add(durationMin, 'minute').toISOString();

      const resp = await api.post('/appointments', {
        serviceId: values.serviceId,
        doctorId: manualDoctor ? (values.doctorId || undefined) : undefined,
        startTime: startTimeISO,
        endTime: endTimeISO,
        notes: values.notes,
        reason: values.reason,
        preferences: {
          urgency: values.urgency || 'routine',
          doctorPreference: { seniority: values.doctorSeniority || 'any' }
        }
      });
      const appt = resp?.data;
      if (appt?.status === 'confirmed') {
        const doc = appt?.doctor ? ` with Dr. ${appt.doctor.firstName || ''} ${appt.doctor.lastName || ''}`.trim() : '';
        messageApi.success(`Appointment confirmed${doc}`);
        // Redirect to My Appointments so the patient can see the booking immediately
        const newId = appt?.id || appt?.appointment?.id;
        const url = newId ? `/appointments?highlight=${encodeURIComponent(newId)}` : '/appointments';
        setTimeout(() => navigate(url), 300);
      } else if (appt?.suggestion) {
        // Pending with backend suggestion: prompt user to accept
        setPendingApptId(appt?.id);
        setSuggestion({
          doctorId: appt.suggestion.doctorId,
          startTime: appt.suggestion.startTime,
          endTime: appt.suggestion.endTime,
        });
        messageApi.info('No doctor was available at the selected time. We found a closest available slot.');
      } else {
        messageApi.success('Appointment request submitted. We will confirm shortly.');
        const newId = appt?.id || appt?.appointment?.id;
        const url = newId ? `/appointments?highlight=${encodeURIComponent(newId)}` : '/appointments';
        setTimeout(() => navigate(url), 300);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to book appointment';
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
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
      const period = 'PM';
      slots.afternoon.push({
        time: `${displayHour}:00 ${period}`,
        value: `${hour}:00`,
        available: Math.random() > 0.3
      });
      slots.afternoon.push({
        time: `${displayHour}:30 ${period}`,
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

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hourStr, minuteStr] = time.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const datetime = selectedDate.hour(hour).minute(minute);
      form.setFieldsValue({ startTime: datetime });
      setStart(datetime);
    }
  };

  return (
    <div className="book-appointment-container">
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

      <Title level={2} className="book-appointment-title">
        📅 Book an Appointment
      </Title>
      <Card>
        {contextHolder}
        <Form layout="vertical" form={form} onFinish={onFinish} initialValues={{ urgency: 'routine' }}>
          <Form.Item name="serviceId" label="Service" rules={[{ required: true, message: 'Select a service' }]}> 
            <Select
              placeholder="Select a service"
              onChange={(v) => {
                setSelectedServiceId(v);
                const svc = services.find(s => s.id === v);
                const depId = svc?.department?.id || svc?.departmentId;
                if (depId) {
                  setDepartmentId(String(depId));
                  form.setFieldsValue({ departmentId: String(depId) });
                }
                // If current doctor no longer matches the department, clear it
                const currentDoctorId = form.getFieldValue('doctorId');
                if (currentDoctorId) {
                  const doc = doctors.find(d => d.id === currentDoctorId);
                  const docDeptId = (doc as any)?.department?.id;
                  if (depId && docDeptId && String(docDeptId) !== String(depId)) {
                    form.setFieldsValue({ doctorId: undefined });
                  }
                }
              }}
              allowClear
            >
              {filteredServices.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Date & Time Selection with Slots */}
          <Card title={<span><CalendarOutlined className="section-icon" />Choose Date & Time</span>} className="form-section" style={{ marginBottom: 16 }}>
            <Form.Item label="Select Date" required>
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                disabledDate={(d) => d && d < dayjs().startOf('day')}
                onChange={handleDateChange}
                placeholder="Choose a date"
                value={selectedDate}
              />
            </Form.Item>

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

            <Form.Item name="startTime" hidden>
              <Input />
            </Form.Item>
          </Card>

          <Collapse
            ghost
            style={{ background: 'transparent', marginTop: 8 }}
            items={[{
              key: 'adv',
              label: 'Advanced options',
              children: (
                <>
                  <Form.Item label="Urgency" name="urgency">
                    <Radio.Group>
                      <Radio.Button value="routine">Routine</Radio.Button>
                      <Radio.Button value="urgent">Urgent</Radio.Button>
                      <Radio.Button value="emergency">Emergency</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item shouldUpdate noStyle>
                    {({ getFieldValue }) => getFieldValue('urgency') === 'emergency' ? (
                      <Alert type="warning" showIcon message="For emergencies, please use our 24/7 Emergency page." description={<a href="/emergency">Go to Emergency</a>} style={{ marginBottom: 12 }} />
                    ) : null}
                  </Form.Item>

                  <Form.Item name="doctorSeniority" label="Doctor seniority">
                    <Select allowClear placeholder="Any">
                      <Option value="chief">Chief</Option>
                      <Option value="senior">Senior</Option>
                      <Option value="consultant">Consultant</Option>
                      <Option value="practitioner">Practitioner</Option>
                      <Option value="any">Any</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="departmentId" label="Department">
                    <Select
                      placeholder="Select a department"
                      allowClear
                      onChange={(val) => {
                        setDepartmentId(val);
                        // Reset dependent selects when department changes
                        setSelectedServiceId(undefined);
                        // Clear service and doctor fields in the form to avoid cross-department combos
                        form.setFieldsValue({ serviceId: undefined, doctorId: undefined });
                      }}
                      value={departmentId}
                    >
                      {mergedDepartments.map(d => (
                        <Option key={d.id} value={d.id}>{d.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Checkbox checked={manualDoctor} onChange={(e) => setManualDoctor(e.target.checked)} style={{ marginBottom: 8 }}>Pick doctor manually</Checkbox>
                  {manualDoctor && (
                    <Form.Item
                      name="doctorId"
                      label="Doctor"
                      extra={doctorExtraText}
                    >
                      <Select placeholder="Select a doctor" allowClear>
                        {filteredDoctors.map(d => (
                          <Option key={d.id} value={d.id}>{d.firstName} {d.lastName}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}

                  <Form.Item name="reason" label="Reason">
                    <Input placeholder="Reason for visit" />
                  </Form.Item>

                  <Form.Item name="notes" label="Notes">
                    <Input.TextArea rows={3} placeholder="Any additional notes" />
                  </Form.Item>
                </>
              )
            }]}
          />

          {/* Confirmation Summary */}
          {selectedServiceId && selectedDate && selectedTime && (
            <Card 
              title={<span><CheckCircleOutlined className="section-icon" />Appointment Summary</span>}
              className="confirmation-summary"
              style={{ marginTop: 16 }}
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Service">
                  <strong>{selectedService?.name}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                  <strong>{selectedDate.format('MMMM D, YYYY')}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Time">
                  <strong>{selectedTime}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {departmentId ? departments.find(d => d.id === departmentId)?.name : 'Auto-assigned'}
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  <Tag color={form.getFieldValue('urgency') === 'emergency' ? 'red' : form.getFieldValue('urgency') === 'urgent' ? 'orange' : 'blue'}>
                    {(form.getFieldValue('urgency') || 'routine').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
              
              <Alert
                type="info"
                message="Please review your appointment details before confirming"
                style={{ marginTop: 16 }}
                showIcon
              />
            </Card>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <div className="action-buttons">
              <Button size="large" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                size="large"
                htmlType="submit"
                loading={submitting}
                icon={<CheckCircleOutlined />}
                disabled={!selectedServiceId || !selectedDate || !selectedTime}
              >
                Confirm Booking
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Nearest available time"
        open={!!suggestion}
        onCancel={() => {
          // Keep pending and go to appointments list
          setSuggestion(null);
          const url = pendingApptId ? `/appointments?highlight=${encodeURIComponent(pendingApptId)}` : '/appointments';
          navigate(url);
        }}
        okText={accepting ? 'Booking…' : 'Accept and Book'}
        okButtonProps={{ loading: accepting }}
        cancelText="Keep as pending"
        onOk={async () => {
          if (!suggestion || !lastValues?.serviceId) {
            setSuggestion(null);
            const url = pendingApptId ? `/appointments?highlight=${encodeURIComponent(pendingApptId)}` : '/appointments';
            return navigate(url);
          }
          try {
            setAccepting(true);
            const resp = await api.post('/appointments', {
              serviceId: lastValues.serviceId,
              doctorId: suggestion.doctorId,
              startTime: suggestion.startTime,
              endTime: suggestion.endTime,
              notes: lastValues.notes,
              reason: lastValues.reason,
              preferences: lastValues.preferences,
            } as any);
            const appt = resp?.data;
            messageApi.success('Booked the suggested time');
            const newId = appt?.id || appt?.appointment?.id;
            const url = newId ? `/appointments?highlight=${encodeURIComponent(newId)}` : '/appointments';
            setSuggestion(null);
            navigate(url);
          } catch (e: any) {
            messageApi.error(e?.response?.data?.message || 'Failed to book suggested time');
          } finally {
            setAccepting(false);
          }
        }}
      >
        {suggestion && (
          <div>
            <p>
              Closest available slot: <strong>{dayjs(suggestion.startTime).format('ddd, MMM D HH:mm')}</strong>
              {' '}to{' '}
              <strong>{dayjs(suggestion.endTime).format('HH:mm')}</strong>.
            </p>
            <p>Do you want to accept this suggested time?</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookAppointmentAuth;
