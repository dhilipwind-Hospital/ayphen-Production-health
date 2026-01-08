import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, message, Descriptions, Radio, Tag } from 'antd';
import api from '../../services/api';
import styled from 'styled-components';

const { TextArea } = Input;
const { Option } = Select;

const Container = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

interface OrderItem {
  id: string;
  labTest: {
    name: string;
    code: string;
    normalRange: string;
    units: string;
  };
  status: string;
  sample: {
    sampleId: string;
  };
}

interface LabOrder {
  id: string;
  orderNumber: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  items: OrderItem[];
}

const ResultsEntry: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      const response = await api.get('/lab/orders/pending');
      const ordersWithSamples = response.data.filter((order: LabOrder) => 
        order.items.some(item => item.status === 'sample_collected' && item.sample)
      );
      setOrders(ordersWithSamples);
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to load pending results');
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    setSelectedItem(null);
    form.resetFields(['orderItemId']);
  };

  const handleItemSelect = (itemId: string) => {
    const item = selectedOrder?.items.find(i => i.id === itemId);
    setSelectedItem(item || null);
    form.setFieldsValue({
      units: item?.labTest.units || '',
      referenceRange: item?.labTest.normalRange || ''
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const resultData = {
        orderId: selectedOrder?.id,
        orderItemId: selectedItem?.id,
        resultValue: values.resultValue,
        units: values.units || selectedItem?.labTest.units,
        referenceRange: values.referenceRange || selectedItem?.labTest.normalRange,
        flag: values.flag,
        interpretation: values.interpretation,
        comments: values.comments
      };
      await api.post('/lab/results', resultData);
      message.success('Result entered successfully!');
      form.resetFields();
      setSelectedOrder(null);
      setSelectedItem(null);
      fetchPendingResults();
    } catch (error) {
      console.error('Error entering result:', error);
      message.error('Failed to enter result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1>📊 Results Entry</h1>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ flag: 'normal' }}
        >
          <Form.Item
            label="Select Lab Order"
            name="orderId"
            rules={[{ required: true, message: 'Please select an order' }]}
          >
            <Select
              placeholder="Select order"
              onChange={handleOrderSelect}
              size="large"
            >
              {orders.map(order => (
                <Option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.patient.firstName} {order.patient.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedOrder && (
            <>
              <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Patient">
                    {selectedOrder.patient.firstName} {selectedOrder.patient.lastName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Order #">
                    {selectedOrder.orderNumber}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Form.Item
                label="Select Test"
                name="orderItemId"
                rules={[{ required: true, message: 'Please select a test' }]}
              >
                <Select
                  placeholder="Select test for result entry"
                  onChange={handleItemSelect}
                  size="large"
                >
                  {selectedOrder.items
                    .filter(item => item.status === 'sample_collected' && item.sample)
                    .map(item => (
                      <Option key={item.id} value={item.id}>
                        {item.labTest.name} ({item.labTest.code}) - Sample: {item.sample.sampleId}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </>
          )}

          {selectedItem && (
            <>
              <Card 
                title="Test Information"
                size="small" 
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Test">
                    {selectedItem.labTest.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Normal Range">
                    <Tag color="green">{selectedItem.labTest.normalRange || 'N/A'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Units">
                    {selectedItem.labTest.units || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sample ID">
                    <Tag color="blue">{selectedItem.sample.sampleId}</Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Form.Item
                label="Result Value"
                name="resultValue"
                rules={[{ required: true, message: 'Please enter result value' }]}
              >
                <Input size="large" placeholder="Enter test result" />
              </Form.Item>

              <Form.Item
                label="Units"
                name="units"
              >
                <Input placeholder="e.g., mg/dL, cells/μL" />
              </Form.Item>

              <Form.Item
                label="Reference Range"
                name="referenceRange"
              >
                <Input placeholder="e.g., 70-100 mg/dL" />
              </Form.Item>

              <Form.Item
                label="Result Flag"
                name="flag"
                rules={[{ required: true, message: 'Please select result flag' }]}
              >
                <Radio.Group>
                  <Radio.Button value="normal">Normal</Radio.Button>
                  <Radio.Button value="abnormal">Abnormal</Radio.Button>
                  <Radio.Button value="critical">Critical</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Interpretation"
                name="interpretation"
              >
                <TextArea rows={3} placeholder="Clinical interpretation of the result" />
              </Form.Item>

              <Form.Item
                label="Comments"
                name="comments"
              >
                <TextArea rows={2} placeholder="Additional comments or notes" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                >
                  Submit Result
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </Container>
  );
};

export default ResultsEntry;
