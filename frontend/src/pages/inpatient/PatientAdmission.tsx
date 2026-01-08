import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Steps, message, DatePicker, Checkbox, Row, Col } from 'antd';
import { UserOutlined, MedicineBoxOutlined, HomeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  department: {
    name: string;
  };
}

interface Bed {
  id: string;
  bedNumber: string;
  room: {
    roomNumber: string;
    roomType: string;
    dailyRate: number;
    ward: {
      name: string;
    };
  };
}

const PatientAdmission: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchAvailableBeds();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/users?role=patient');
      setPatients(response.data.users || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/users?role=doctor');
      setDoctors(response.data.users || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const response = await api.get('/inpatient/beds/available');
      setBeds(response.data.beds || []);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const handleBedSelect = (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    setSelectedBed(bed || null);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const admissionData = {
        patientId: values.patientId,
        admittingDoctorId: values.admittingDoctorId,
        bedId: values.bedId,
        admissionReason: values.admissionReason,
        admissionDiagnosis: values.admissionDiagnosis,
        allergies: values.allergies,
        specialInstructions: values.specialInstructions,
        isEmergency: values.isEmergency || false
      };

      const response = await api.post('/inpatient/admissions', admissionData);
      message.success('Patient admitted successfully!');
      
      // Navigate to admission details
      navigate(`/inpatient/admissions/${response.data.admission.id}`);
    } catch (error: any) {
      console.error('Error admitting patient:', error);
      message.error(error.response?.data?.message || 'Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: 'Patient & Doctor',
      icon: <UserOutlined />,
      content: (
        <>
          <Form.Item
            label="Patient"
            name="patientId"
            rules={[{ required: true, message: 'Please select patient' }]}
          >
            <Select
              showSearch
              placeholder="Search and select patient"
              optionFilterProp="children"
              filterOption={(input, option: any) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {patients.map(patient => (
                <Option key={patient.id} value={patient.id}>
                  {`${patient.firstName} ${patient.lastName}`} - {patient.phone}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Admitting Doctor"
            name="admittingDoctorId"
            rules={[{ required: true, message: 'Please select doctor' }]}
          >
            <Select
              showSearch
              placeholder="Search and select doctor"
              optionFilterProp="children"
            >
              {doctors.map(doctor => (
                <Option key={doctor.id} value={doctor.id}>
                  Dr. {`${doctor.firstName} ${doctor.lastName}`} - {doctor.department?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isEmergency" valuePropName="checked">
            <Checkbox>Emergency Admission</Checkbox>
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Bed Selection',
      icon: <HomeOutlined />,
      content: (
        <>
          <Form.Item
            label="Select Bed"
            name="bedId"
            rules={[{ required: true, message: 'Please select bed' }]}
          >
            <Select
              placeholder="Select available bed"
              onChange={handleBedSelect}
            >
              {beds.map(bed => (
                <Option key={bed.id} value={bed.id}>
                  {bed.bedNumber} - {bed.room.ward.name} - Room {bed.room.roomNumber} ({bed.room.roomType})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedBed && (
            <Card size="small" style={{ marginTop: '16px', background: '#f0f2f5' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>Ward:</strong> {selectedBed.room.ward.name}</p>
                  <p><strong>Room:</strong> {selectedBed.room.roomNumber}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Room Type:</strong> {selectedBed.room.roomType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Daily Rate:</strong> ₹{selectedBed.room.dailyRate}</p>
                </Col>
              </Row>
            </Card>
          )}
        </>
      ),
    },
    {
      title: 'Medical Details',
      icon: <MedicineBoxOutlined />,
      content: (
        <>
          <Form.Item
            label="Admission Reason"
            name="admissionReason"
            rules={[{ required: true, message: 'Please enter admission reason' }]}
          >
            <TextArea rows={3} placeholder="Reason for admission" />
          </Form.Item>

          <Form.Item
            label="Admission Diagnosis"
            name="admissionDiagnosis"
          >
            <TextArea rows={3} placeholder="Initial diagnosis (optional)" />
          </Form.Item>

          <Form.Item
            label="Allergies"
            name="allergies"
          >
            <TextArea rows={2} placeholder="Known allergies (if any)" />
          </Form.Item>

          <Form.Item
            label="Special Instructions"
            name="specialInstructions"
          >
            <TextArea rows={3} placeholder="Any special care instructions" />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Card>
        <h1>Patient Admission</h1>
        
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div style={{ minHeight: '300px' }}>
            {steps[currentStep].content}
          </div>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button style={{ marginRight: '8px' }} onClick={prev}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<CheckCircleOutlined />}
              >
                Admit Patient
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PatientAdmission;
