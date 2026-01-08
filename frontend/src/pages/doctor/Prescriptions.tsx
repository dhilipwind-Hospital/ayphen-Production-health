import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Tabs, Card, Modal, Descriptions, message, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicine: {
    id: string;
    name: string;
    dosageForm: string;
    strength: string;
  };
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  status: 'pending' | 'dispensed' | 'out_of_stock' | 'cancelled';
}

interface Prescription {
  id: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  prescriptionDate: string;
  diagnosis: string;
  notes?: string;
  status: 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';
  items: PrescriptionItem[];
}

const DoctorPrescriptions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch real prescriptions for the logged-in doctor
      const response = await api.get('/pharmacy/prescriptions/doctor');
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      message.error('Failed to load prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

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

  const showViewModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setViewModalVisible(true);
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (activeTab !== 'all' && prescription.status !== activeTab) {
      return false;
    }
    
    const patientName = `${prescription.patient.firstName} ${prescription.patient.lastName}`.toLowerCase();
    return patientName.includes(searchText.toLowerCase());
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'prescriptionDate',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: Prescription, b: Prescription) => 
        dayjs(a.prescriptionDate).unix() - dayjs(b.prescriptionDate).unix(),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, record: Prescription) => 
        `${record.patient.firstName} ${record.patient.lastName}`,
    },
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
    },
    {
      title: 'Medicines',
      key: 'medicines',
      render: (_: any, record: Prescription) => record.items.length,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Prescription) => getStatusTag(record.status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Prescription) => (
        <Space size="small">
          <Button 
            size="small" 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record)}
          >
            View
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/doctor/prescriptions/${record.id}/edit`)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            icon={<PrinterOutlined />}
            onClick={() => message.info('Printing prescription...')}
          >
            Print
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>My Prescriptions</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/doctor/write-prescription')}
          >
            New Prescription
          </Button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by patient name..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="All" key="all" />
          <TabPane tab="Pending" key="pending" />
          <TabPane tab="Dispensed" key="dispensed" />
          <TabPane tab="Partially Dispensed" key="partially_dispensed" />
          <TabPane tab="Cancelled" key="cancelled" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={filteredPrescriptions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* View Modal */}
      <Modal
        title="Prescription Details"
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={() => message.info('Printing prescription...')}
          >
            Print
          </Button>
        ]}
      >
        {selectedPrescription && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Patient">
                {selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(selectedPrescription.prescriptionDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Diagnosis" span={2}>
                {selectedPrescription.diagnosis}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {selectedPrescription.notes || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                {getStatusTag(selectedPrescription.status)}
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 16 }}>Medications</h3>
            <Table
              dataSource={selectedPrescription.items}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Medicine',
                  key: 'medicine',
                  render: (_: any, item: PrescriptionItem) => 
                    `${item.medicine.name} ${item.medicine.strength}`
                },
                {
                  title: 'Dosage',
                  dataIndex: 'dosage',
                  key: 'dosage'
                },
                {
                  title: 'Frequency',
                  dataIndex: 'frequency',
                  key: 'frequency'
                },
                {
                  title: 'Duration',
                  dataIndex: 'duration',
                  key: 'duration'
                },
                {
                  title: 'Instructions',
                  dataIndex: 'instructions',
                  key: 'instructions'
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorPrescriptions;
