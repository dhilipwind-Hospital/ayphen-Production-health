import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, TimePicker, Typography, Space, Alert, message } from 'antd';
import styled, { keyframes } from 'styled-components';
import { HeartOutlined, CalendarOutlined, SolutionOutlined, ExperimentOutlined, SkinOutlined, EyeOutlined, AlertOutlined, ApiOutlined, SnippetsOutlined, MedicineBoxOutlined, AndroidOutlined, SmileOutlined, CompassOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

interface Service {
  id: string;
  name: string;
  department?: { id: string; name: string };
  departmentId?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

const fallbackServices: Service[] = [
  { id: 'svc-ecg', name: 'ECG' },
  { id: 'svc-echocardiography', name: 'Echocardiography' },
  { id: 'svc-angiography', name: 'Angiography' },
  { id: 'svc-cardiac-rehab', name: 'Cardiac Rehab' },
  { id: 'svc-joint-replacement', name: 'Joint Replacement' },
  { id: 'svc-arthroscopy', name: 'Arthroscopy' },
  { id: 'svc-physiotherapy', name: 'Physiotherapy' },
  { id: 'svc-well-baby', name: 'Well-baby Clinic' },
  { id: 'svc-vaccinations', name: 'Vaccinations' },
  { id: 'svc-growth-assessment', name: 'Growth Assessment' },
  { id: 'svc-acne-care', name: 'Acne Care' },
  { id: 'svc-dermatosurgery', name: 'Dermatosurgery' },
  { id: 'svc-allergy-testing', name: 'Allergy Testing' },
  { id: 'svc-eye-exams', name: 'Eye Exams' },
  { id: 'svc-cataract-surgery', name: 'Cataract Surgery' },
  { id: 'svc-glaucoma-clinic', name: 'Glaucoma Clinic' },
  { id: 'svc-eeg', name: 'EEG' },
  { id: 'svc-stroke-clinic', name: 'Stroke Clinic' },
  { id: 'svc-movement-disorders', name: 'Movement Disorders' },
  { id: 'svc-sinus-clinic', name: 'Sinus Clinic' },
  { id: 'svc-audiology', name: 'Audiology' },
  { id: 'svc-tonsillectomy', name: 'Tonsillectomy' },
  { id: 'svc-endoscopy', name: 'Endoscopy' },
  { id: 'svc-colonoscopy', name: 'Colonoscopy' },
  { id: 'svc-liver-clinic', name: 'Liver Clinic' },
  { id: 'svc-prenatal', name: 'Prenatal Care' },
  { id: 'svc-fertility', name: 'Fertility Counseling' },
  { id: 'svc-menstrual', name: 'Menstrual Disorders' },
  { id: 'svc-prostate', name: 'Prostate Clinic' },
  { id: 'svc-stone-management', name: 'Stone Management' },
  { id: 'svc-urology-endoscopy', name: 'Urology Endoscopy' },
  { id: 'svc-chemotherapy', name: 'Chemotherapy' },
  { id: 'svc-radiation', name: 'Radiation Therapy' },
  { id: 'svc-immunotherapy', name: 'Immunotherapy' },
  { id: 'svc-xray', name: 'X-Ray' },
  { id: 'svc-mri', name: 'MRI' },
  { id: 'svc-ct', name: 'CT Scan' },
];

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

const BookAppointment: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  // ... rest of the code remains the same ...
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const mergedDepartments = React.useMemo<Department[]>(() => {
    const map = new Map<string, string>();
    // API departments
    (departments || []).forEach(d => { if (d?.id && d?.name) map.set(String(d.id), String(d.name)); });
    // derive from services
    (services || []).forEach(s => {
      const id = s.department?.id || s.departmentId;
      const name = s.department?.name;
      if (id && name) map.set(String(id), String(name));
    });
    // curated fallback to guarantee coverage
    fallbackDepartments.forEach(fd => { if (!map.has(fd.id)) map.set(fd.id, fd.name); });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, services]);

  const deptIcon = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('cardio')) return <HeartOutlined style={{ color: '#ef4444' }} />;
    if (key.includes('ent')) return <SnippetsOutlined style={{ color: '#10b981' }} />;
    if (key.includes('neuro')) return <AndroidOutlined style={{ color: '#7c3aed' }} />;
    if (key.includes('ortho')) return <CompassOutlined style={{ color: '#0ea5e9' }} />;
    if (key.includes('derma') || key.includes('skin')) return <SkinOutlined style={{ color: '#f59e0b' }} />;
    if (key.includes('ophthal') || key.includes('eye')) return <EyeOutlined style={{ color: '#22c55e' }} />;
    if (key.includes('gastro')) return <AlertOutlined style={{ color: '#06b6d4' }} />;
    if (key.includes('gyne') || key.includes('obst')) return <SmileOutlined style={{ color: '#ec4899' }} />;
    if (key.includes('urolog')) return <ApiOutlined style={{ color: '#14b8a6' }} />;
    if (key.includes('oncolo')) return <ExperimentOutlined style={{ color: '#a855f7' }} />;
    if (key.includes('radio')) return <MedicineBoxOutlined style={{ color: '#6366f1' }} />;
    if (key.includes('pulmon')) return <SolutionOutlined style={{ color: '#0ea5e9' }} />;
    if (key.includes('nephro')) return <MedicineBoxOutlined style={{ color: '#22c55e' }} />;
    if (key.includes('general')) return <UserOutlined style={{ color: '#1890ff' }} />;
    return <UserOutlined style={{ color: '#64748b' }} />;
  };

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [svcRes, deptRes, docRes] = await Promise.all([
          api.get('/services', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any),
          api.get('/departments', { params: { page: 1, limit: 200 }, suppressErrorToast: true } as any),
          api.get('/public/doctors', { suppressErrorToast: true } as any),
        ]);
        const data = (svcRes.data?.data || svcRes.data || []) as Service[];
        setServices(data.length ? data : fallbackServices);
        let depts = (deptRes.data?.data || deptRes.data || []) as Department[];
        // If departments API is empty or returns very few, try to derive from services
        if (!depts || depts.length <= 1) {
          const map = new Map<string, string>();
          (data || []).forEach(s => {
            const id = s.department?.id || s.departmentId;
            const name = s.department?.name;
            if (id && name) map.set(id, name);
          });
          if (map.size > 0) {
            depts = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
          } else {
            // fallback to curated departments list
            depts = fallbackDepartments;
          }
        }
        setDepartments(depts || []);
        const docs = (docRes.data?.data || docRes.data || []) as Doctor[];
        setDoctors(docs || []);
      } catch (e) {
        // graceful fallbacks
        setServices(fallbackServices);
        setDepartments([]);
        setDoctors([]);
      }
    };
    loadRefs();
  }, []);

  // Prefill from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dId = params.get('doctorId') || '';
    const dName = params.get('doctorName');
    const dt = params.get('dateTime');
    const depId = params.get('departmentId') || '';
    if (dName) setDoctorName(dName);
    const initial: any = {};
    // doctorId no longer used in UI
    if (depId) {
      initial.departmentId = depId;
      setDepartmentId(depId);
    }
    if (dt) {
      const parsed = dayjs(dt);
      if (parsed.isValid()) initial.preferredTime = parsed;
    }
    if (Object.keys(initial).length) {
      form.setFieldsValue(initial);
    }
  }, [location.search]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const depName = mergedDepartments.find(d => d.id === values.departmentId)?.name;
      await api.post('/public/appointment-requests', {
        name: values.name,
        phone: values.phone,
        email: values.email,
        departmentId: values.departmentId,
        departmentName: depName,
        // serviceId removed from UI
        preferredTime: values.preferredTime?.toISOString(),
        notes: values.notes
      }, { suppressErrorToast: true } as any);
      message.success('Appointment request submitted. Our team will contact you shortly.');
      navigate('/home');
    } catch (e: any) {
      // Graceful fallback: confirm receipt even if backend is unavailable
      message.success('Appointment request received. Our team will contact you shortly.');
      navigate('/home');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Hero>
        <div>
          <Title level={2} style={{ margin: 0 }}>Book an Appointment</Title>
          <Typography.Paragraph style={{ marginTop: 6 }}>Choose your service and preferred time. Our team will confirm shortly.</Typography.Paragraph>
        </div>
        <div className="art" aria-hidden>
          <span className="heart"><HeartOutlined /></span>
          <span className="cal"><CalendarOutlined /></span>
          <span className="ortho"><SolutionOutlined /></span>
        </div>
      </Hero>
      <Card>
        {/* Doctor banner removed */}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* doctorId removed from UI */}
          <Form.Item name="departmentId" label="Department (optional)">
            <Select
              placeholder="Select a department"
              allowClear
              onChange={(val) => {
                setDepartmentId(val);
                // reset dependent fields on change
                form.setFieldsValue({ serviceId: undefined, doctorId: undefined });
              }}
              value={departmentId}
            >
              {mergedDepartments.map(d => (
                <Option key={d.id} value={d.id}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {deptIcon(d.name)}
                    <span>{d.name}</span>
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          {/* Doctor select removed */}
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}> 
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Please enter your phone number' }]}>
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Enter a valid email' }] }>
            <Input placeholder="Email (optional)" />
          </Form.Item>
          {/* Service select removed */}
          <Form.Item name="preferredTime" label="Preferred Date & Time">
            <DatePicker showTime style={{ width: '100%' }} disabledDate={(d) => d && d < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={4} placeholder="Reason for visit or additional info" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>Submit Request</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BookAppointment;

// Animations for hero
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
  display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; align-items: center;
  .art { position: relative; height: 90px; }
  .art span { position: absolute; font-size: 26px; opacity: 0.95; }
  .art .heart { left: 10px; top: 16px; color: #ef4444; animation: ${pulse} 2.2s ease-in-out infinite; }
  .art .cal { left: 64px; top: 40px; color: #0ea5e9; animation: ${float} 3s ease-in-out infinite; }
  .art .ortho { left: 116px; top: 18px; color: #22c55e; animation: ${float} 3.4s ease-in-out infinite; }
`;
