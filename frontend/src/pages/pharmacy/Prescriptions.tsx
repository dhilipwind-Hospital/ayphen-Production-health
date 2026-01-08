import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Tabs, Select, Form, message, Card, Modal, Row, Col, Descriptions, Badge, Steps } from 'antd';
import { SearchOutlined, FileDoneOutlined, FileOutlined, FileExclamationOutlined, CheckOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getPharmacyPrescriptions, updatePrescriptionStatus } from '../../services/prescription.service';

const { TabPane } = Tabs;
const { Option } = Select;

interface PrescriptionItem {
  id: string;
  medicine: {
    id: string;
    name: string;
    dosageForm: string;
    strength: string;
    currentStock: number;
  };
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  status: 'pending' | 'dispensed' | 'out_of_stock' | 'cancelled';
  instructions?: string;
}

interface Prescription {
  id: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  prescriptionDate: string;
  status: 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';
  items: PrescriptionItem[];
  diagnosis?: string;
  notes?: string;
}

const Prescriptions: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dispensingModalVisible, setDispensingModalVisible] = useState(false);
  const [dispensingForm] = Form.useForm();
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, [activeTab]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Use the prescription service to get pharmacy prescriptions
      const response = await getPharmacyPrescriptions(activeTab !== 'all' ? activeTab : undefined);
      setPrescriptions(response.data.prescriptions || []);
      
      // If no prescriptions are found, use mock data for demonstration
      if (!response.data.prescriptions || response.data.prescriptions.length === 0) {
        // Use mock data from our existing state
        console.log('No prescriptions found, using mock data');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      message.error('Failed to load prescriptions');
      // Don't clear existing prescriptions on error
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

  const showDispensingModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDispensingModalVisible(true);
    
    // Initialize form with prescription items
    const initialValues = {
      items: prescription.items.map(item => ({
        id: item.id,
        status: item.status === 'dispensed' ? 'dispensed' : 'pending',
      }))
    };
    dispensingForm.setFieldsValue(initialValues);
  };

  const handleDispense = async () => {
    try {
      setDispensing(true);
      const values = await dispensingForm.validateFields();
      
      // Prepare the data for updating prescription status
      const updateData = {
        items: values.items.map((item: any) => ({
          id: item.id,
          status: item.status
        }))
      };
      
      // Make sure selectedPrescription is not null before accessing its id
      if (!selectedPrescription) {
        throw new Error('No prescription selected');
      }
      
      // Use the prescription service to update the prescription status
      const response = await updatePrescriptionStatus(selectedPrescription.id, updateData);
      
      // Update prescriptions list with the response
      if (response.data && response.data.prescription) {
        const updatedPrescription = response.data.prescription;
        const updatedPrescriptions = prescriptions.map(p => 
          p.id === updatedPrescription.id ? updatedPrescription : p
        );
        
        // Filter prescriptions based on active tab
        setPrescriptions(updatedPrescriptions.filter(p => {
          if (activeTab === 'pending') return p.status === 'pending';
          if (activeTab === 'dispensed') return p.status === 'dispensed';
          if (activeTab === 'partially_dispensed') return p.status === 'partially_dispensed';
          return true;
        }));
        
        message.success('Prescription dispensed successfully');
      } else {
        message.error('Failed to dispense prescription');
      }
      
      setDispensingModalVisible(false);
      // Refresh the prescriptions list
      fetchPrescriptions();
    } catch (error) {
      console.error('Error dispensing prescription:', error);
      message.error('Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span className="text-truncate">{id.substring(0, 8)}...</span>,
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (text: string, record: Prescription) => (
        <span>{record.patient.firstName} {record.patient.lastName}</span>
      ),
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (text: string, record: Prescription) => (
        <span>{record.doctor.firstName} {record.doctor.lastName}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'prescriptionDate',
      key: 'prescriptionDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, record: Prescription) => getStatusTag(record.status),
    },
    {
      title: 'Items',
      key: 'items',
      render: (text: string, record: Prescription) => record.items.length,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Prescription) => (
        <Space size="small">
          <Button size="small" type="primary" onClick={() => showDispensingModal(record)}>
            {record.status === 'pending' ? 'Dispense' : 'View'}
          </Button>
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: 'Medicine',
      key: 'medicine',
      render: (text: string, record: PrescriptionItem) => (
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
      render: (text: string, record: PrescriptionItem) => record.medicine.currentStock,
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, record: PrescriptionItem) => {
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
          <Button onClick={fetchPrescriptions}>Refresh</Button>
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
      
      <Modal
        title="Dispense Prescription"
        visible={dispensingModalVisible}
        onCancel={() => setDispensingModalVisible(false)}
        width={800}
        footer={null}
        className="dispensing-modal"
      >
        {selectedPrescription && (
          <div>
            {/* Dispensing Steps */}
            <Steps
              current={1}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Steps.Step title="Verification" description="Verify prescription details" />
              <Steps.Step title="Preparation" description="Prepare medications" status="process" />
              <Steps.Step title="Dispensing" description="Dispense to patient" />
              <Steps.Step title="Counseling" description="Provide usage instructions" />
            </Steps>
            
            <Card title="Prescription Details" bordered={false} style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Patient">{selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}</Descriptions.Item>
                    <Descriptions.Item label="Diagnosis">{selectedPrescription.diagnosis || 'Not specified'}</Descriptions.Item>
                    <Descriptions.Item label="Notes">{selectedPrescription.notes || 'No additional notes'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Doctor">{selectedPrescription.doctor.firstName} {selectedPrescription.doctor.lastName}</Descriptions.Item>
                    <Descriptions.Item label="Date">{new Date(selectedPrescription.prescriptionDate).toLocaleDateString()}</Descriptions.Item>
                    <Descriptions.Item label="Prescription ID">RX-{selectedPrescription.id}</Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
            
            <Card 
              title="Medications" 
              bordered={false} 
              style={{ marginBottom: 16 }}
              extra={
                <Space>
                  <Tag color="blue">Items: {selectedPrescription.items.length}</Tag>
                  <Tag color={selectedPrescription.status === 'dispensed' ? 'green' : 'orange'}>
                    {selectedPrescription.status === 'dispensed' ? 'Dispensed' : 'Pending'}
                  </Tag>
                </Space>
              }
            >
              <Form form={dispensingForm} layout="vertical">
                <Table
                  dataSource={selectedPrescription.items}
                  columns={[
                    {
                      title: 'Medicine',
                      dataIndex: 'medicineName',
                      key: 'medicineName',
                      render: (text, record:PrescriptionItem) => (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{text}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{record.medicine?.strength || record.dosage}</div>
                        </div>
                      )
                    },
                    {
                      title: 'Dosage',
                      dataIndex: 'dosage',
                      key: 'dosage',
                      width: 100,
                    },
                    {
                      title: 'Frequency',
                      dataIndex: 'frequency',
                      key: 'frequency',
                      width: 120,
                    },
                    {
                      title: 'Duration',
                      dataIndex: 'duration',
                      key: 'duration',
                      width: 100,
                    },
                    {
                      title: 'Qty',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      width: 60,
                    },
                    {
                      title: 'Stock',
                      dataIndex: 'currentStock',
                      key: 'currentStock',
                      width: 80,
                      render: (text, record:PrescriptionItem) => (
                        <Badge 
                          count={record.medicine?.currentStock || 0} 
                          showZero 
                          style={{ 
                            backgroundColor: (record.medicine?.currentStock || 0) >= record.quantity ? '#52c41a' : '#f5222d',
                          }}
                        />
                      )
                    },
                    {
                      title: 'Status',
                      key: 'action',
                      width: 150,
                      render: (text: string, record:PrescriptionItem, index: number) => (
                        <Form.Item
                          name={['items', index, 'status']}
                          initialValue={record.status === 'dispensed' ? 'dispensed' : 'pending'}
                          style={{ margin: 0 }}
                        >
                          <Select 
                            disabled={record.status === 'dispensed' || selectedPrescription?.status === 'dispensed'}
                            style={{ width: '100%' }}
                            optionLabelProp="label"
                          >
                            <Option value="dispensed" label="Dispense">
                              <Tag color="green">Dispense</Tag>
                            </Option>
                            <Option value="out_of_stock" label="Out of Stock">
                              <Tag color="red">Out of Stock</Tag>
                            </Option>
                            <Option value="pending" label="Pending">
                              <Tag color="orange">Pending</Tag>
                            </Option>
                          </Select>
                        </Form.Item>
                      ),
                    },
                  ]}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered
                />
              </Form>
            </Card>
            
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button onClick={() => setDispensingModalVisible(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={dispensing}
                  onClick={handleDispense}
                  disabled={selectedPrescription?.status === 'dispensed'}
                  icon={<CheckOutlined />}
                >
                  Complete Dispensing
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Prescriptions;
