import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, DatePicker, Card, message, Row, Col, Space, Divider, Table, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, PrinterOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface Medicine {
  id: string;
  name: string;
  dosageForm: string;
  strength: string;
  currentStock: number;
}

interface MedicineItem {
  id: string;
  medicineId: string | null;
  medicineName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  contactNumber?: string;
}

const WritePrescription: React.FC = () => {
  const { user } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get patient name from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const patientNameFromUrl = urlParams.get('patientName');
  
  // Debug logging (can be removed in production)
  console.log('WritePrescription Debug:', {
    patientId,
    patientNameFromUrl,
    fullUrl: location.pathname + location.search
  });
  const [form] = Form.useForm();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null);

  // Fetch patient info and available medicines on component mount
  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
    }
    fetchAvailableMedicines();
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real patient data from API
      try {
        const response = await api.get(`/users/${patientId}`);
        const patient = response.data;
        
        // Calculate age from dateOfBirth if available
        let age = 'Unknown';
        if (patient.dateOfBirth) {
          const birthDate = new Date(patient.dateOfBirth);
          const today = new Date();
          const calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age = (calculatedAge - 1).toString();
          } else {
            age = calculatedAge.toString();
          }
        }
        
        setPatientInfo({
          id: patient.id,
          firstName: patient.firstName || 'Unknown',
          lastName: patient.lastName || 'Patient',
          age: parseInt(age) || 0,
          gender: patient.gender || 'Unknown',
          bloodGroup: patient.bloodGroup || 'Unknown',
          contactNumber: patient.phone || 'Not provided'
        });
      } catch (apiError) {
        console.warn('API call failed, using fallback data:', apiError);
        
        // Try to get patient info from the doctor's appointments
        try {
          const appointmentsResponse = await api.get('/appointments/my-appointments');
          const appointments = appointmentsResponse.data?.appointments || appointmentsResponse.data || [];
          
          // Find appointment with this patient ID
          const appointment = appointments.find((apt: any) => apt.patient?.id === patientId);
          
          if (appointment && appointment.patient) {
            setPatientInfo({
              id: appointment.patient.id,
              firstName: appointment.patient.firstName || 'Patient',
              lastName: appointment.patient.lastName || 'Unknown',
              age: appointment.patient.age || 25,
              gender: appointment.patient.gender || 'Unknown',
              bloodGroup: appointment.patient.bloodGroup || 'Unknown',
              contactNumber: appointment.patient.phone || 'Not provided'
            });
          } else {
            // Use patient name from URL if available, otherwise generate dynamic patient based on doctor's department
            let patientFirstName = 'Patient';
            let patientLastName = 'Unknown';
            
            if (patientNameFromUrl) {
              const nameParts = patientNameFromUrl.split(' ');
              patientFirstName = nameParts[0] || 'Patient';
              patientLastName = nameParts.slice(1).join(' ') || 'Unknown';
            } else {
              // Generate dynamic patient based on doctor's department
              const doctorEmail = user?.email || '';
              
              if (doctorEmail.includes('cardiology')) {
                patientLastName = 'Heart Patient';
              } else if (doctorEmail.includes('orthopedics')) {
                patientLastName = 'Arun';
              } else if (doctorEmail.includes('pediatrics')) {
                patientLastName = 'Child Patient';
              } else if (doctorEmail.includes('dermatology')) {
                patientLastName = 'Skin Patient';
              } else if (doctorEmail.includes('general-medicine')) {
                patientLastName = 'General Patient';
              } else if (doctorEmail.includes('ophthalmology')) {
                patientLastName = 'Eye Patient';
              }
            }
            
            setPatientInfo({
              id: patientId || 'PAT-001',
              firstName: patientFirstName,
              lastName: patientLastName,
              age: 30,
              gender: 'Male',
              bloodGroup: 'Unknown',
              contactNumber: 'Not provided'
            });
          }
        } catch (appointmentError) {
          console.warn('Failed to fetch appointments, using generic patient:', appointmentError);
          
          // Final fallback - use URL parameter if available
          let finalFirstName = 'Patient';
          let finalLastName = 'Unknown';
          
          if (patientNameFromUrl) {
            console.log('Using patient name from URL in final fallback:', patientNameFromUrl);
            const nameParts = patientNameFromUrl.split(' ');
            finalFirstName = nameParts[0] || 'Patient';
            finalLastName = nameParts.slice(1).join(' ') || 'Unknown';
          }
          
          setPatientInfo({
            id: patientId || 'PAT-001',
            firstName: finalFirstName,
            lastName: finalLastName,
            age: 30,
            gender: 'Unknown',
            bloodGroup: 'Unknown',
            contactNumber: 'Not provided'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching patient info:', error);
      message.error('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMedicines = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real medicines data from API
      try {
        const response = await api.get('/pharmacy/medicines');
        const medicinesData = response.data?.medicines || response.data || [];
        
        setMedicines(medicinesData.map((med: any) => ({
          id: med.id,
          name: med.name,
          dosageForm: med.dosageForm,
          strength: med.strength,
          currentStock: med.currentStock || 0
        })));
      } catch (apiError) {
        console.warn('API call failed, using fallback medicines:', apiError);
        
        // Fallback medicines data
        setMedicines([
          {
            id: '1',
            name: 'Paracetamol',
            dosageForm: 'Tablet',
            strength: '500mg',
            currentStock: 1000
          },
          {
            id: '2',
            name: 'Ibuprofen',
            dosageForm: 'Tablet',
            strength: '400mg',
            currentStock: 500
          },
          {
            id: '3',
            name: 'Amoxicillin',
            dosageForm: 'Capsule',
            strength: '250mg',
            currentStock: 50
          },
          {
            id: '4',
            name: 'Metformin',
            dosageForm: 'Tablet',
            strength: '500mg',
            currentStock: 40
          },
          {
            id: '5',
            name: 'Atorvastatin',
            dosageForm: 'Tablet',
            strength: '20mg',
            currentStock: 250
          },
          {
            id: '6',
            name: 'Salbutamol',
            dosageForm: 'Inhaler',
            strength: '100mcg/dose',
            currentStock: 20
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      message.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const addMedicineItem = (selectedMedicine?: Medicine) => {
    const newItem: MedicineItem = {
      id: `item-${Date.now()}`,
      medicineId: selectedMedicine ? selectedMedicine.id : null,
      medicineName: selectedMedicine ? selectedMedicine.name : '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 0,
      instructions: ''
    };
    
    setMedicineItems([...medicineItems, newItem]);
  };
  
  // Check for medicine ID in URL query params
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const medicineId = queryParams.get('medicineId');
    
    if (medicineId) {
      // Find the medicine in the list and add it
      const medicine = medicines.find(med => med.id === medicineId);
      if (medicine) {
        addMedicineItem(medicine);
      }
    }
  }, [medicines]);

  const removeMedicineItem = (id: string) => {
    setMedicineItems(medicineItems.filter(item => item.id !== id));
  };

  const handleMedicineChange = (id: string, field: keyof MedicineItem, value: any) => {
    setMedicineItems(medicineItems.map(item => {
      if (item.id === id) {
        if (field === 'medicineId' && value) {
          const selectedMedicine = medicines.find(med => med.id === value);
          return {
            ...item,
            [field]: value,
            medicineName: selectedMedicine ? selectedMedicine.name : ''
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = async (values: any) => {
    if (medicineItems.length === 0) {
      message.warning('Please add at least one medicine');
      return;
    }

    // Check if all medicine items have a selected medicine
    const invalidItems = medicineItems.filter(item => !item.medicineId);
    if (invalidItems.length > 0) {
      message.warning('Please select a medicine for all items');
      return;
    }

    setSubmitting(true);
    try {
      const prescriptionData = {
        patientId: patientInfo?.id,
        doctorId: user?.id,
        diagnosis: values.diagnosis,
        notes: values.notes,
        prescriptionDate: values.prescriptionDate.format('YYYY-MM-DD'),
        items: medicineItems.map(item => ({
          medicineId: item.medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions,
        })),
      };
      
      // Create prescription via API
      console.log('Prescription data:', prescriptionData);
      const response = await api.post('/pharmacy/prescriptions', prescriptionData);
      
      if (response.data) {
        message.success('Prescription created successfully');
        navigate('/doctor/prescriptions');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      message.error('Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const medicineColumns = [
    {
      title: 'Medicine',
      key: 'medicine',
      render: (_: any, record: MedicineItem) => (
        <Select
          showSearch
          placeholder="Select medicine"
          style={{ width: '100%' }}
          value={record.medicineId}
          onChange={(value) => handleMedicineChange(record.id, 'medicineId', value)}
          filterOption={(input, option) =>
            (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
          }
        >
          {medicines.map(medicine => (
            <Option key={medicine.id} value={medicine.id}>
              {medicine.name} ({medicine.dosageForm} {medicine.strength})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Dosage',
      key: 'dosage',
      render: (_: any, record: MedicineItem) => (
        <Input
          placeholder="e.g., 1 tablet"
          value={record.dosage}
          onChange={(e) => handleMedicineChange(record.id, 'dosage', e.target.value)}
        />
      ),
    },
    {
      title: 'Frequency',
      key: 'frequency',
      render: (_: any, record: MedicineItem) => (
        <Input
          placeholder="e.g., Twice daily"
          value={record.frequency}
          onChange={(e) => handleMedicineChange(record.id, 'frequency', e.target.value)}
        />
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: MedicineItem) => (
        <Input
          placeholder="e.g., 7 days"
          value={record.duration}
          onChange={(e) => handleMedicineChange(record.id, 'duration', e.target.value)}
        />
      ),
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_: any, record: MedicineItem) => (
        <Input
          type="number"
          placeholder="Total quantity"
          value={record.quantity || ''}
          onChange={(e) => handleMedicineChange(record.id, 'quantity', parseInt(e.target.value) || 0)}
        />
      ),
    },
    {
      title: 'Instructions',
      key: 'instructions',
      render: (_: any, record: MedicineItem) => (
        <Input
          placeholder="Special instructions"
          value={record.instructions}
          onChange={(e) => handleMedicineChange(record.id, 'instructions', e.target.value)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: MedicineItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeMedicineItem(record.id)}
        />
      ),
    },
  ];

  return (
    <div className="write-prescription">
      <Card
        title="Write Prescription"
        extra={
          <Space>
            <Button onClick={() => navigate('/doctor/prescriptions')}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={submitting}
            >
              Save Prescription
            </Button>
            <Button icon={<PrinterOutlined />}>
              Print Preview
            </Button>
          </Space>
        }
      >
        {patientInfo && (
          <Card className="patient-info-card" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <h3>{patientInfo.firstName} {patientInfo.lastName}</h3>
                <p>
                  <strong>Age:</strong> {patientInfo.age} | 
                  <strong> Gender:</strong> {patientInfo.gender} | 
                  <strong> Blood Group:</strong> {patientInfo.bloodGroup || 'N/A'}
                </p>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <p><strong>Patient ID:</strong> {patientInfo.id}</p>
                <p><strong>Contact:</strong> {patientInfo.contactNumber || 'N/A'}</p>
              </Col>
            </Row>
          </Card>
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            prescriptionDate: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="diagnosis"
                label="Diagnosis"
                rules={[{ required: true, message: 'Please enter diagnosis' }]}
              >
                <TextArea rows={2} placeholder="Enter diagnosis" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="prescriptionDate"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">Medicines</Divider>
          
          <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
            <Button
              type="dashed"
              onClick={() => addMedicineItem()}
              icon={<PlusOutlined />}
              style={{ flex: 1 }}
            >
              Add Medicine
            </Button>
            <Button
              type="primary"
              onClick={() => window.open('/doctor/medicines', '_blank')}
              icon={<MedicineBoxOutlined />}
            >
              Browse Medicine Catalog
            </Button>
          </div>
          
          <Table
            columns={medicineColumns}
            dataSource={medicineItems}
            rowKey="id"
            pagination={false}
            bordered
            size="small"
            locale={{ emptyText: 'No medicines added yet' }}
          />
          
          <Form.Item
            name="notes"
            label="Additional Notes"
            style={{ marginTop: 16 }}
          >
            <TextArea rows={3} placeholder="Enter any additional notes or instructions" />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default WritePrescription;
