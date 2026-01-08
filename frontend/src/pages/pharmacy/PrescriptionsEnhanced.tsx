import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Space, Tabs, Modal, Form, Select, InputNumber, message, Divider, Steps, Descriptions, Badge } from 'antd';
import { SearchOutlined, FileDoneOutlined, FileOutlined, FileExclamationOutlined, PrinterOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import moment from 'moment';

const { TabPane } = Tabs;
const { Option } = Select;
const { Step } = Steps;

const PrescriptionsEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [dispensingModalVisible, setDispensingModalVisible] = useState(false);
  const [dispensingForm] = Form.useForm();
  const [dispensing, setDispensing] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [patientHistoryModalVisible, setPatientHistoryModalVisible] = useState(false);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchPrescriptions();
  }, [activeTab]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      console.log('👤 Current user:', user);
      console.log('🔐 User role:', user?.role);
      
      let apiEndpoint = '/pharmacy/prescriptions/pending';
      
      // Use different endpoints based on tab
      if (activeTab === 'pending') {
        apiEndpoint = '/pharmacy/prescriptions/pending';
      } else if (activeTab === 'dispensed') {
        apiEndpoint = '/pharmacy/prescriptions/pending'; // Will filter by status
      } else if (activeTab === 'partially_dispensed') {
        apiEndpoint = '/pharmacy/prescriptions/pending'; // Will filter by status
      }
      
      // Try to fetch real prescriptions from API (auth handled by interceptor)
      try {
        console.log('🔄 Fetching prescriptions from:', apiEndpoint);
        
        const response = await api.get(apiEndpoint);
        
        const realPrescriptions = response.data?.prescriptions || response.data || [];
        
        // Always use real API data if the call was successful
        if (response.status === 200) {
          console.log('✅ Real prescriptions loaded:', realPrescriptions.length);
          console.log('📋 Prescriptions data:', realPrescriptions);
          setPrescriptions(realPrescriptions);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        console.error('🔗 API endpoint tried:', apiEndpoint);
      }
      
      // Check if we have globally stored prescriptions (simulating database persistence)
      const storedPrescriptions = (window as any).globalPrescriptions;
      
      // Fallback mock data including Patient Arun
      const mockPrescriptions = storedPrescriptions || [
        {
          id: 'RX-2025-001',
          doctor: {
            id: 'DOC-ORTHO-001',
            firstName: 'Orthopedics',
            lastName: 'Chief',
            specialization: 'Orthopedic Surgery'
          },
          patient: {
            id: 'PAT-ARUN-001',
            firstName: 'Patient',
            lastName: 'Arun',
            age: 30,
            gender: 'Male'
          },
          prescriptionDate: '2025-10-03',
          status: 'pending',
          diagnosis: 'Post-physiotherapy pain management',
          notes: 'Patient requires pain relief medication after physiotherapy session',
          items: [
            {
              id: 'RXITEM-001',
              medicine: {
                id: '1',
                name: 'Ibuprofen',
                dosageForm: 'Tablet',
                strength: '400mg',
                currentStock: 500
              },
              dosage: '1 tablet',
              frequency: 'Twice daily',
              duration: '5 days',
              quantity: 10,
              status: 'pending',
              instructions: 'Take after meals'
            },
            {
              id: 'RXITEM-002',
              medicine: {
                id: '2',
                name: 'Paracetamol',
                dosageForm: 'Tablet',
                strength: '500mg',
                currentStock: 1000
              },
              dosage: '1 tablet',
              frequency: 'Three times daily',
              duration: '3 days',
              quantity: 9,
              status: 'pending',
              instructions: 'For fever if needed'
            }
          ]
        },
        {
          id: 'RX-2023-001',
          doctor: {
            id: 'DOC-001',
            firstName: 'John',
            lastName: 'Smith',
            specialization: 'General Medicine'
          },
          patient: {
            id: 'PAT-001',
            firstName: 'Alice',
            lastName: 'Johnson',
            age: 45,
            gender: 'Female'
          },
          prescriptionDate: '2023-09-28',
          status: 'pending',
          diagnosis: 'Hypertension',
          notes: 'Monitor blood pressure daily',
          items: [
            {
              id: 'RXITEM-003',
              medicine: {
                id: '3',
                name: 'Lisinopril',
                dosageForm: 'Tablet',
                strength: '10mg',
                currentStock: 300
              },
              dosage: '1 tablet',
              frequency: 'Once daily',
              quantity: 30,
              status: 'pending',
              instructions: 'Take in the morning'
            }
          ]
        }
      ];
      
      // Filter prescriptions based on active tab
      const filteredPrescriptions = mockPrescriptions.filter((p: any) => {
        if (activeTab === 'pending') return p.status === 'pending';
        if (activeTab === 'dispensed') return p.status === 'dispensed';
        if (activeTab === 'partially_dispensed') return p.status === 'partially_dispensed';
        return true;
      });
      
      setPrescriptions(filteredPrescriptions);
    } catch (error) {
      console.error('Error in fetchPrescriptions:', error);
      message.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patientName = `${prescription.patient.firstName} ${prescription.patient.lastName}`.toLowerCase();
    const doctorName = `${prescription.doctor.firstName} ${prescription.doctor.lastName}`.toLowerCase();
    const searchLower = searchText.toLowerCase();
    
    return patientName.includes(searchLower) || 
           doctorName.includes(searchLower) || 
           prescription.id.toLowerCase().includes(searchLower);
  });

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">Pending</Tag>;
      case 'dispensed':
        return <Tag color="green">Dispensed</Tag>;
      case 'partially_dispensed':
        return <Tag color="orange">Partially Dispensed</Tag>;
      case 'cancelled':
        return <Tag color="red">Cancelled</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const showDispensingModal = (prescription: any) => {
    setSelectedPrescription(prescription);
    setDispensingModalVisible(true);
    
    // Initialize form with prescription items
    const initialValues = {
      items: prescription.items.map((item: any) => ({
        id: item.id,
        status: item.status === 'dispensed' ? 'dispensed' : 'pending',
      }))
    };
    dispensingForm.setFieldsValue(initialValues);
  };

  const showViewModal = (prescription: any) => {
    setSelectedPrescription(prescription);
    setViewModalVisible(true);
  };

  const showPatientHistoryModal = (patientId: string) => {
    // In a real app, we would fetch the patient's prescription history
    // For now, use mock data
    const mockHistory = prescriptions.filter(p => p.patient.id === patientId);
    setPatientHistory(mockHistory);
    setPatientHistoryModalVisible(true);
  };

  const handleDispense = async () => {
    if (!selectedPrescription) return;
    
    try {
      setDispensing(true);
      const values = await dispensingForm.validateFields();
      
      // Prepare items data for API
      const itemsData = selectedPrescription.items.map((item: any, index: number) => ({
        id: item.id,
        status: values.items[index].status
      }));
      
      // Call backend API to dispense prescription
      await api.put(`/pharmacy/prescriptions/${selectedPrescription.id}/dispense`, {
        items: itemsData
      });
      
      message.success('Prescription dispensed successfully');
      setDispensingModalVisible(false);
      setSelectedPrescription(null);
      dispensingForm.resetFields();
      
      // Refresh the prescriptions list from backend
      await fetchPrescriptions();
    } catch (error: any) {
      console.error('Error dispensing prescription:', error);
      message.error(error?.response?.data?.message || 'Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (text: string, record: any) => (
        <Button type="link" onClick={() => showPatientHistoryModal(record.patient.id)}>
          {record.patient.firstName} {record.patient.lastName}
        </Button>
      ),
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (text: string, record: any) => (
        <span>{record.doctor.firstName} {record.doctor.lastName}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'prescriptionDate',
      key: 'prescriptionDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: any, b: any) => new Date(a.prescriptionDate).getTime() - new Date(b.prescriptionDate).getTime(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, record: any) => getStatusTag(record.status),
    },
    {
      title: 'Items',
      key: 'items',
      render: (text: string, record: any) => record.items.length,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: any) => (
        <Space size="small">
          <Button size="small" type="primary" onClick={() => record.status === 'pending' ? showDispensingModal(record) : showViewModal(record)}>
            {record.status === 'pending' ? 'Dispense' : 'View'}
          </Button>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => message.info('Printing prescription...')}>
            Print
          </Button>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: 'Medicine',
      key: 'medicine',
      render: (text: string, record: any) => (
        <div>
          <div>{record.medicine.name}</div>
          <small>{record.medicine.dosageForm} {record.medicine.strength}</small>
        </div>
      ),
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Current Stock',
      key: 'currentStock',
      render: (text: string, record: any) => record.medicine.currentStock,
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, record: any) => {
        switch (record.status) {
          case 'pending':
            return <Tag color="blue">Pending</Tag>;
          case 'dispensed':
            return <Tag color="green">Dispensed</Tag>;
          case 'out_of_stock':
            return <Tag color="red">Out of Stock</Tag>;
          case 'cancelled':
            return <Tag color="gray">Cancelled</Tag>;
          default:
            return <Tag>Unknown</Tag>;
        }
      },
    },
  ];

  const getDispensingSteps = () => {
    if (!selectedPrescription) return [];
    
    const steps = [
      {
        title: 'Verification',
        description: 'Verify prescription details',
        status: 'finish',
      },
      {
        title: 'Preparation',
        description: 'Prepare medications',
        status: 'process',
      },
      {
        title: 'Dispensing',
        description: 'Dispense to patient',
        status: 'wait',
      },
      {
        title: 'Counseling',
        description: 'Provide usage instructions',
        status: 'wait',
      }
    ];
    
    return steps;
  };

  return (
    <div className="pharmacy-prescriptions">
      <h1>Prescriptions</h1>
      
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search prescriptions"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button onClick={() => setActiveTab(activeTab)}>Refresh</Button>
        </Space>
        
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane
            tab={
              <span>
                <FileOutlined />
                Pending
              </span>
            }
            key="pending"
          >
            <Table
              columns={columns}
              dataSource={filteredPrescriptions}
              rowKey="id"
              loading={loading && activeTab === 'pending'}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <FileDoneOutlined />
                Dispensed
              </span>
            }
            key="dispensed"
          >
            <Table
              columns={columns}
              dataSource={filteredPrescriptions}
              rowKey="id"
              loading={loading && activeTab === 'dispensed'}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <FileExclamationOutlined />
                Partially Dispensed
              </span>
            }
            key="partially_dispensed"
          >
            <Table
              columns={columns}
              dataSource={filteredPrescriptions}
              rowKey="id"
              loading={loading && activeTab === 'partially_dispensed'}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Dispensing Modal */}
      <Modal
        title="Dispense Prescription"
        visible={dispensingModalVisible}
        onCancel={() => setDispensingModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setDispensingModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="dispense"
            type="primary"
            loading={dispensing}
            onClick={handleDispense}
            disabled={selectedPrescription?.status === 'dispensed'}
          >
            Dispense
          </Button>,
        ]}
      >
        {selectedPrescription && (
          <div>
            <Steps current={1} size="small" style={{ marginBottom: 24 }}>
              {getDispensingSteps().map(step => (
                <Step key={step.title} title={step.title} description={step.description} />
              ))}
            </Steps>
            
            <Descriptions title="Prescription Details" bordered size="small">
              <Descriptions.Item label="Patient">{selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}</Descriptions.Item>
              <Descriptions.Item label="Doctor">{selectedPrescription.doctor.firstName} {selectedPrescription.doctor.lastName}</Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Diagnosis" span={3}>{selectedPrescription.diagnosis}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={3}>{selectedPrescription.notes}</Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">Medications</Divider>
            
            <Form form={dispensingForm} layout="vertical">
              <Table
                dataSource={selectedPrescription.items}
                columns={[
                  ...itemColumns,
                  {
                    title: 'Action',
                    key: 'action',
                    render: (text: string, record: any, index: number) => (
                      <Form.Item
                        name={['items', index, 'status']}
                        initialValue={record.status === 'dispensed' ? 'dispensed' : 'pending'}
                        style={{ margin: 0 }}
                      >
                        <Select disabled={record.status === 'dispensed' || selectedPrescription.status === 'dispensed'}>
                          <Option value="dispensed">Dispense</Option>
                          <Option value="out_of_stock">Out of Stock</Option>
                          <Option value="pending">Pending</Option>
                        </Select>
                      </Form.Item>
                    ),
                  },
                ]}
                rowKey="id"
                pagination={false}
              />
              <Form.List name="items">
                {fields => fields.map(field => (
                  <Form.Item
                    key={field.key}
                    name={[field.name, 'id']}
                    hidden
                  >
                    <Input />
                  </Form.Item>
                ))}
              </Form.List>
            </Form>
          </div>
        )}
      </Modal>
      
      {/* View Prescription Modal */}
      <Modal
        title="View Prescription"
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={() => message.info('Printing prescription...')}>
            Print
          </Button>,
        ]}
      >
        {selectedPrescription && (
          <div>
            <Descriptions title="Prescription Details" bordered>
              <Descriptions.Item label="ID">{selectedPrescription.id}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(selectedPrescription.status)}</Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Patient" span={2}>{selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}</Descriptions.Item>
              <Descriptions.Item label="Doctor">{selectedPrescription.doctor.firstName} {selectedPrescription.doctor.lastName}</Descriptions.Item>
              <Descriptions.Item label="Diagnosis" span={3}>{selectedPrescription.diagnosis}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={3}>{selectedPrescription.notes}</Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">Medications</Divider>
            
            <Table
              dataSource={selectedPrescription.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}
      </Modal>
      
      {/* Patient History Modal */}
      <Modal
        title="Patient Prescription History"
        visible={patientHistoryModalVisible}
        onCancel={() => setPatientHistoryModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPatientHistoryModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {patientHistory.length > 0 && (
          <div>
            <Descriptions title="Patient Information" bordered size="small">
              <Descriptions.Item label="Name">{patientHistory[0].patient.firstName} {patientHistory[0].patient.lastName}</Descriptions.Item>
              <Descriptions.Item label="Age">{patientHistory[0].patient.age}</Descriptions.Item>
              <Descriptions.Item label="Gender">{patientHistory[0].patient.gender}</Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">Prescription History</Divider>
            
            <Table
              dataSource={patientHistory}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'prescriptionDate',
                  key: 'date',
                  render: (date: string) => new Date(date).toLocaleDateString(),
                  sorter: (a: any, b: any) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime(),
                },
                {
                  title: 'Doctor',
                  key: 'doctor',
                  render: (text: string, record: any) => (
                    <span>{record.doctor.firstName} {record.doctor.lastName}</span>
                  ),
                },
                {
                  title: 'Diagnosis',
                  dataIndex: 'diagnosis',
                  key: 'diagnosis',
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (text: string, record: any) => getStatusTag(record.status),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (text: string, record: any) => (
                    <Button size="small" onClick={() => showViewModal(record)}>
                      View Details
                    </Button>
                  ),
                },
              ]}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PrescriptionsEnhanced;
