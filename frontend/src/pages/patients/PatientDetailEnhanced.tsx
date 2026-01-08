import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Button, 
  Tabs, 
  Typography, 
  Tag, 
  Space, 
  Avatar, 
  Skeleton, 
  Upload, 
  App, 
  Alert,
  Table,
  Empty,
  Timeline,
  Row,
  Col,
  Statistic
} from 'antd';
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
  HeartOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';
import api from '../../services/api';

const { Title, Text } = Typography;

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
    background-color: #EC407A;
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

  .stat-card {
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      background-color: #fef2f7 !important;
      border-color: #EC407A !important;
    }
  }

  .ant-card {
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #EC407A;
    }
  }
`;

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  reason?: string;
  doctor?: {
    firstName: string;
    lastName: string;
  };
  department?: string;
}

interface Prescription {
  id: string;
  createdAt: string;
  status: string;
  doctor?: {
    firstName: string;
    lastName: string;
  };
  items?: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
  }>;
}

interface LabResult {
  id: string;
  testDate: string;
  testName: string;
  result: string;
  status: string;
  orderedBy?: {
    firstName: string;
    lastName: string;
  };
}

const PatientDetailEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const { message } = App.useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Additional data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loadingLabResults, setLoadingLabResults] = useState(false);

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
        setErrorMsg('Unable to load patient details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  // Fetch appointments
  const fetchAppointments = async () => {
    if (!id) return;
    try {
      setLoadingAppointments(true);
      const response = await api.get(`/appointments`, {
        params: { patientId: id, limit: 10 }
      });
      const data = response.data?.data || response.data || [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    if (!id) return;
    try {
      setLoadingPrescriptions(true);
      const response = await api.get(`/pharmacy/prescriptions`, {
        params: { patientId: id, limit: 10 }
      });
      const data = response.data?.data || response.data || [];
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Fetch lab results
  const fetchLabResults = async () => {
    if (!id) return;
    try {
      setLoadingLabResults(true);
      const response = await api.get(`/lab/orders`, {
        params: { patientId: id, limit: 10 }
      });
      const data = response.data?.data || response.data || [];
      setLabResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching lab results:', error);
      setLabResults([]);
    } finally {
      setLoadingLabResults(false);
    }
  };

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
    return false as any;
  };

  const statusVal = String((patient as any)?.status || '').toLowerCase();
  const statusColor = statusVal === 'active' ? 'green' : statusVal === 'inactive' ? 'red' : 'default';
  const statusLabel = statusVal ? statusVal.toUpperCase() : '—';

  // Appointment columns
  const appointmentColumns = [
    {
      title: 'Date & Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: string) => dayjs(date).format('MMM D, YYYY h:mm A')
    },
    {
      title: 'Doctor',
      dataIndex: 'doctor',
      key: 'doctor',
      render: (doctor: any) => doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'N/A'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || 'N/A'
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => reason || 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          'completed': 'green',
          'pending': 'orange',
          'confirmed': 'blue',
          'cancelled': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      }
    }
  ];

  // Prescription columns
  const prescriptionColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Doctor',
      dataIndex: 'doctor',
      key: 'doctor',
      render: (doctor: any) => doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'N/A'
    },
    {
      title: 'Medications',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          'active': 'green',
          'completed': 'blue',
          'cancelled': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      }
    }
  ];

  // Lab result columns
  const labColumns = [
    {
      title: 'Test Date',
      dataIndex: 'testDate',
      key: 'testDate',
      render: (date: string) => dayjs(date).format('MMM D, YYYY')
    },
    {
      title: 'Test Name',
      dataIndex: 'testName',
      key: 'testName'
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          'completed': 'green',
          'pending': 'orange',
          'in_progress': 'blue'
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      }
    }
  ];

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <UserOutlined /> Overview
        </span>
      ),
      children: (
        <>
          {/* Quick Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="Total Appointments"
                  value={appointments.length}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="Prescriptions"
                  value={prescriptions.length}
                  prefix={<MedicineBoxOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="Lab Tests"
                  value={labResults.length}
                  prefix={<ExperimentOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="Age"
                  value={getAge(patient.dateOfBirth)}
                  suffix="years"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Personal Information */}
          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
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

          {/* Medical Information */}
          <Card title="Medical Information" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Title level={5}>Allergies</Title>
                {patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0 ? (
                  patient.allergies.map((allergy, index) => (
                    <Tag key={index} color="red" style={{ marginBottom: 8 }}>
                      {allergy}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">No known allergies</Text>
                )}
              </Col>
              <Col span={8}>
                <Title level={5}>Conditions</Title>
                {patient.conditions && Array.isArray(patient.conditions) && patient.conditions.length > 0 ? (
                  patient.conditions.map((condition, index) => (
                    <Tag key={index} color="orange" style={{ marginBottom: 8 }}>
                      {condition}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">No chronic conditions</Text>
                )}
              </Col>
              <Col span={8}>
                <Title level={5}>Current Medications</Title>
                {patient.medications && Array.isArray(patient.medications) && patient.medications.length > 0 ? (
                  patient.medications.map((med, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 8 }}>
                      {med}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">No current medications</Text>
                )}
              </Col>
            </Row>
          </Card>
        </>
      )
    },
    {
      key: 'appointments',
      label: (
        <span>
          <CalendarOutlined /> Appointments
        </span>
      ),
      children: (
        <Card>
          <Button 
            type="primary" 
            style={{ marginBottom: 16 }}
            onClick={fetchAppointments}
          >
            Load Appointments
          </Button>
          <Table
            columns={appointmentColumns}
            dataSource={appointments}
            rowKey="id"
            loading={loadingAppointments}
            locale={{
              emptyText: <Empty description="No appointments found. Click 'Load Appointments' to fetch data." />
            }}
          />
        </Card>
      )
    },
    {
      key: 'prescriptions',
      label: (
        <span>
          <MedicineBoxOutlined /> Prescriptions
        </span>
      ),
      children: (
        <Card>
          <Button 
            type="primary" 
            style={{ marginBottom: 16 }}
            onClick={fetchPrescriptions}
          >
            Load Prescriptions
          </Button>
          <Table
            columns={prescriptionColumns}
            dataSource={prescriptions}
            rowKey="id"
            loading={loadingPrescriptions}
            locale={{
              emptyText: <Empty description="No prescriptions found. Click 'Load Prescriptions' to fetch data." />
            }}
          />
        </Card>
      )
    },
    {
      key: 'lab-results',
      label: (
        <span>
          <ExperimentOutlined /> Lab Results
        </span>
      ),
      children: (
        <Card>
          <Button 
            type="primary" 
            style={{ marginBottom: 16 }}
            onClick={fetchLabResults}
          >
            Load Lab Results
          </Button>
          <Table
            columns={labColumns}
            dataSource={labResults}
            rowKey="id"
            loading={loadingLabResults}
            locale={{
              emptyText: <Empty description="No lab results found. Click 'Load Lab Results' to fetch data." />
            }}
          />
        </Card>
      )
    }
  ];

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
              Patient ID: {patient.id?.substring(0, 8)} • Registered on {dayjs(patient.registrationDate).format('MMM D, YYYY')}
            </Text>
          </div>
        </div>

        <Tabs
          defaultActiveKey="overview"
          style={{ marginTop: 24 }}
          items={tabItems}
        />
      </Card>
    </PatientDetailContainer>
  );
};

export default PatientDetailEnhanced;
