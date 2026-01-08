import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tabs, Typography, Tag, Space, Divider, Badge, Avatar, Skeleton, Upload, App, Alert } from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  HomeOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  HeartOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';

const { Title, Text } = Typography;
// Use Tabs items API instead of deprecated TabPane

const PatientDetailContainer = styled.div`
  .patient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .patient-avatar {
    background-color: #1890ff;
    margin-right: 16px;
  }
  
  .patient-info {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .patient-actions {
    display: flex;
    gap: 8px;
  }
`;

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const { message } = App.useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mock data for testing (remove this in production)
  const mockPatient: Patient = {
    id: id || '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateOfBirth: '1985-05-15',
    gender: 'male',
    bloodGroup: 'A+',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    status: 'active',
    registrationDate: '2023-01-15',
    lastVisit: '2023-10-15',
    notes: 'Patient has a history of allergies to penicillin.',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1987654321',
      email: 'jane.doe@example.com'
    },
    insurance: {
      provider: 'HealthPlus',
      policyNumber: 'HP12345678',
      validUntil: '2025-12-31'
    },
    allergies: ['Penicillin', 'Peanuts'],
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    medications: ['Lisinopril 10mg', 'Metformin 500mg']
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await patientService.getPatient(id);
        setPatient(data);
        setErrorMsg(null);
      } catch (error) {
        console.error('Error fetching patient:', error);
        // Friendly message and graceful fallback
        setErrorMsg('Unable to load patient details. Showing limited information.');
        setPatient(mockPatient);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id, mockPatient]);

  if (loading || !patient) {
    return <Skeleton active />;
  }

  const getAge = (dateOfBirth: string) => {
    return dayjs().diff(dayjs(dateOfBirth), 'year');
  };

  const avatarSrc = patient?.profileImage ? patient.profileImage : undefined;

  const beforeUpload = async (file: File) => {
    if (!id) return false as any;
    try {
      setUploading(true);
      const { photoUrl } = await patientService.uploadPatientPhoto(id, file);
      setPatient(prev => prev ? { ...prev, profileImage: photoUrl } as any : prev);
      message.success('Photo uploaded');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
    return false as any; // prevent auto upload by AntD Upload
  };

  const statusVal = String((patient as any)?.status || '').toLowerCase();
  const statusColor = statusVal === 'active' ? 'green' : statusVal === 'inactive' ? 'red' : 'default';
  const statusLabel = statusVal ? statusVal.toUpperCase() : '—';

  return (
    <PatientDetailContainer>
      {errorMsg && (
        <Alert type="warning" message={errorMsg} showIcon style={{ marginBottom: 12 }} />
      )}
      <div className="patient-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Back to Patients
        </Button>
        <div className="patient-actions">
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
            <Button loading={uploading}>Upload Photo</Button>
          </Upload>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            Edit Patient
          </Button>
        </div>
      </div>

      <Card loading={loading}>
        <div className="patient-info">
          <Avatar size={64} src={avatarSrc} icon={<UserOutlined />} className="patient-avatar" />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {patient.firstName} {patient.lastName}
              <Tag color={statusColor} style={{ marginLeft: 8 }}>
                {statusLabel}
              </Tag>
            </Title>
            <Text type="secondary">
              Patient ID: {patient.id} • Registered on {dayjs(patient.registrationDate).format('MMM D, YYYY')}
            </Text>
          </div>
        </div>

        <Tabs
          defaultActiveKey="overview"
          style={{ marginTop: 24 }}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Full Name">
                    {patient.firstName} {patient.lastName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date of Birth">
                    <Space>
                      <CalendarOutlined />
                      {dayjs(patient.dateOfBirth).format('MMMM D, YYYY')}
                      <Text type="secondary">({getAge(patient.dateOfBirth)} years old)</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {patient.gender}
                  </Descriptions.Item>
                  <Descriptions.Item label="Blood Group">
                    <Tag color="red" style={{ fontSize: '14px' }}>
                      <HeartOutlined /> {patient.bloodGroup}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Space>
                      <MailOutlined />
                      {patient.email}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space>
                      <PhoneOutlined />
                      {patient.phone}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Address" span={2}>
                    <Space direction="vertical" size={0}>
                      <div>
                        <HomeOutlined /> {patient.address}
                      </div>
                      <div>
                        {patient.city}, {patient.state} {patient.zipCode}
                      </div>
                      <div>{patient.country}</div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Emergency Contact" span={2}>
                    <Space direction="vertical" size={0}>
                      <div><strong>{patient.emergencyContact?.name}</strong></div>
                      <div>{patient.emergencyContact?.relationship}</div>
                      <div>
                        <PhoneOutlined /> {patient.emergencyContact?.phone}
                      </div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {patient.notes || 'No notes available'}
                  </Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: 'records',
              label: 'Medical Records',
              children: (
                <Card>
                  <Text type="secondary">Medical records will be displayed here.</Text>
                </Card>
              )
            },
            {
              key: 'appointments',
              label: 'Appointments',
              children: (
                <Card>
                  <Text type="secondary">Appointment history will be displayed here.</Text>
                </Card>
              )
            },
            {
              key: 'prescriptions',
              label: 'Prescriptions',
              children: (
                <Card>
                  <Text type="secondary">Prescription history will be displayed here.</Text>
                </Card>
              )
            }
          ]}
        />
      </Card>
    </PatientDetailContainer>
  );
};

export default PatientDetail;
