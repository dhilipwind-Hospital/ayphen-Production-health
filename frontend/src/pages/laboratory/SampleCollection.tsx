import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, message, Descriptions, Tag } from 'antd';
import { BarcodeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import styled from 'styled-components';

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
    sampleType: string;
    sampleInstructions: string;
  };
  status: string;
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

const SampleCollection: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const response = await api.get('/lab/orders/pending');
      const pendingOrders = response.data.filter((order: LabOrder) => 
        order.items.some(item => item.status === 'ordered')
      );
      setOrders(pendingOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to load pending orders');
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
      sampleType: item?.labTest.sampleType || ''
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const sampleData = {
        orderItemId: values.orderItemId,
        sampleType: values.sampleType,
        storageLocation: values.storageLocation
      };
      await api.post('/lab/samples', sampleData);
      message.success('Sample collected and registered successfully!');
      form.resetFields();
      setSelectedOrder(null);
      setSelectedItem(null);
      fetchPendingOrders();
    } catch (error) {
      console.error('Error registering sample:', error);
      message.error('Failed to register sample');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1>🧪 Sample Collection</h1>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
                  placeholder="Select test for sample collection"
                  onChange={handleItemSelect}
                  size="large"
                >
                  {selectedOrder.items
                    .filter(item => item.status === 'ordered')
                    .map(item => (
                      <Option key={item.id} value={item.id}>
                        {item.labTest.name} ({item.labTest.code})
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </>
          )}

          {selectedItem && (
            <>
              <Card 
                title={<><BarcodeOutlined /> Sample Details</>}
                size="small" 
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Test">
                    {selectedItem.labTest.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sample Type">
                    <Tag color="blue">{selectedItem.labTest.sampleType}</Tag>
                  </Descriptions.Item>
                  {selectedItem.labTest.sampleInstructions && (
                    <Descriptions.Item label="Instructions">
                      {selectedItem.labTest.sampleInstructions}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              <Form.Item
                label="Sample Type"
                name="sampleType"
                rules={[{ required: true, message: 'Please enter sample type' }]}
              >
                <Input placeholder="e.g., Blood, Urine, Stool" />
              </Form.Item>

              <Form.Item
                label="Storage Location"
                name="storageLocation"
              >
                <Input placeholder="e.g., Refrigerator A, Shelf 3" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                >
                  Collect Sample & Generate Barcode
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </Container>
  );
};

export default SampleCollection;
