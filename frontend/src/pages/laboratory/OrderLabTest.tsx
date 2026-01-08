import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Card, Table, message, Checkbox, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  cost: number;
  sampleType: string;
  turnaroundTimeMinutes: number;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const OrderLabTest: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [searchTest, setSearchTest] = useState('');

  useEffect(() => {
    fetchTests();
    fetchPatients();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await api.get('/lab/tests', {
        params: { isActive: 'true', limit: 100 }
      });
      console.log('Lab tests response:', response.data);
      const testsData = response.data.tests || response.data || [];
      console.log('Tests data:', testsData);
      setTests(testsData);
      
      if (testsData.length === 0) {
        message.warning('No lab tests found. Please seed the database first.');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      message.error('Failed to load lab tests');
    }
  };

  const fetchPatients = async () => {
    try {
      // Use doctor's patients endpoint (accessible to doctors without special permissions)
      const response = await api.get('/users/doctor/my-patients');
      console.log('Patients response:', response.data);
      const patientsData = response.data.data || response.data || [];
      setPatients(patientsData);
      
      if (patientsData.length === 0) {
        message.warning('No patients found. Patients will appear here after you have appointments with them.');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      message.error('Failed to load patients. Please try again.');
      setPatients([]);
    }
  };

  const addTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test && !selectedTests.find(t => t.id === testId)) {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const handleSubmit = async (values: any) => {
    if (selectedTests.length === 0) {
      message.error('Please select at least one test');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        patientId: values.patientId,
        tests: selectedTests.map(t => t.id),
        clinicalNotes: values.clinicalNotes,
        diagnosis: values.diagnosis,
        isUrgent: values.isUrgent || false
      };

      const response = await api.post('/lab/orders', orderData);
      message.success(`Lab order created successfully! Order #${response.data.orderNumber}`);
      form.resetFields();
      setSelectedTests([]);
      navigate('/doctor/lab-orders');
    } catch (error) {
      console.error('Error creating lab order:', error);
      message.error('Failed to create lab order');
    } finally {
      setLoading(false);
    }
  };

  const testColumns = [
    {
      title: 'Test Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Sample',
      dataIndex: 'sampleType',
      key: 'sampleType'
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `₹${cost}`
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: LabTest) => (
        <Button 
          type="link" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => removeTest(record.id)}
        >
          Remove
        </Button>
      )
    }
  ];

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTest.toLowerCase()) ||
    test.code.toLowerCase().includes(searchTest.toLowerCase())
  );

  return (
    <Container>
      <h1>🔬 Order Lab Tests</h1>

      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Patient"
            name="patientId"
            rules={[{ required: true, message: 'Please select a patient' }]}
          >
            <Select
              showSearch
              placeholder="Select patient"
              optionFilterProp="children"
              size="large"
            >
              {patients.map(patient => (
                <Option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} ({patient.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Select Tests">
            <Input.Search
              placeholder="Search tests by name or code"
              value={searchTest}
              onChange={(e) => setSearchTest(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Select
              placeholder="Select a test to add"
              onChange={addTest}
              value={undefined}
              size="large"
              style={{ width: '100%' }}
            >
              {filteredTests.map(test => (
                <Option 
                  key={test.id} 
                  value={test.id}
                  disabled={selectedTests.some(t => t.id === test.id)}
                >
                  {test.name} ({test.code}) - ₹{test.cost}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedTests.length > 0 && (
            <Card title={`Selected Tests (${selectedTests.length})`} style={{ marginBottom: 16 }}>
              <Table
                columns={testColumns}
                dataSource={selectedTests}
                rowKey="id"
                pagination={false}
                size="small"
              />
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <strong>Total Cost: ₹{selectedTests.reduce((sum, test) => sum + test.cost, 0)}</strong>
              </div>
            </Card>
          )}

          <Form.Item label="Clinical Notes" name="clinicalNotes">
            <TextArea rows={3} placeholder="Enter clinical notes or symptoms" />
          </Form.Item>

          <Form.Item label="Diagnosis" name="diagnosis">
            <Input placeholder="Enter provisional diagnosis" />
          </Form.Item>

          <Form.Item name="isUrgent" valuePropName="checked">
            <Checkbox>Mark as Urgent</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              disabled={selectedTests.length === 0}
            >
              Create Lab Order
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/doctor/lab-orders')}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Container>
  );
};

export default OrderLabTest;
