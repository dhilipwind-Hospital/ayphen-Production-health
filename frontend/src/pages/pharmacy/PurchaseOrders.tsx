import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Select, InputNumber, DatePicker, Input, message, Tag, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, InboxOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const PurchaseOrders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModal, setDetailsModal] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadOrders();
    loadSuppliers();
    loadMedicines();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/suppliers?isActive=true');
      setSuppliers(res.data.data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadMedicines = async () => {
    try {
      const res = await api.get('/pharmacy/medicines');
      setMedicines(res.data.data || res.data || []);
    } catch (error) {
      console.error('Error loading medicines:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ items: [{}] });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const items = values.items.map((item: any) => {
        const medicine = medicines.find(m => m.id === item.medicineId);
        return {
          medicineId: item.medicineId,
          medicineName: medicine?.name || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      });

      await api.post('/purchase-orders', {
        supplierId: values.supplierId,
        items,
        expectedDeliveryDate: values.expectedDeliveryDate?.toISOString(),
        notes: values.notes
      });

      message.success('Purchase order created successfully');
      setModalVisible(false);
      await loadOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      message.error('Failed to create purchase order');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status });
      message.success('Order status updated successfully');
      await loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update order status');
    }
  };

  const handleReceive = async (id: string) => {
    Modal.confirm({
      title: 'Receive Purchase Order',
      content: 'This will update stock levels. Are you sure?',
      onOk: async () => {
        try {
          await api.post(`/purchase-orders/${id}/receive`);
          message.success('Order received and stock updated successfully');
          await loadOrders();
        } catch (error) {
          console.error('Error receiving order:', error);
          message.error('Failed to receive order');
        }
      }
    });
  };

  const handleAutoGenerate = async () => {
    try {
      const res = await api.post('/purchase-orders/auto-generate');
      message.success('Auto purchase order generated successfully');
      await loadOrders();
      if (res.data.data) {
        setDetailsModal(res.data.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to generate order');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      draft: 'default',
      pending: 'orange',
      approved: 'blue',
      ordered: 'cyan',
      received: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier'
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      render: (date: string) => date ? dayjs(date).format('MMM DD, YYYY') : '-'
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailsModal(record)}
          >
            View
          </Button>
          {record.status === 'draft' && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleUpdateStatus(record.id, 'pending')}
            >
              Submit
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'approved')}
            >
              Approve
            </Button>
          )}
          {record.status === 'approved' && (
            <Button
              size="small"
              onClick={() => handleUpdateStatus(record.id, 'ordered')}
            >
              Send Order
            </Button>
          )}
          {record.status === 'ordered' && (
            <Button
              size="small"
              type="primary"
              icon={<InboxOutlined />}
              onClick={() => handleReceive(record.id)}
            >
              Receive
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Purchase Orders"
        extra={
          <Space>
            <Button onClick={handleAutoGenerate}>
              Auto-Generate Order
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Order
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title="Create Purchase Order"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Supplier"
            name="supplierId"
            rules={[{ required: true, message: 'Please select supplier' }]}
          >
            <Select placeholder="Select supplier">
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Expected Delivery Date"
            name="expectedDeliveryDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(field => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'medicineId']}
                      rules={[{ required: true, message: 'Select medicine' }]}
                    >
                      <Select placeholder="Medicine" style={{ width: 200 }}>
                        {medicines.map(med => (
                          <Option key={med.id} value={med.id}>{med.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      rules={[{ required: true, message: 'Enter quantity' }]}
                    >
                      <InputNumber placeholder="Quantity" min={1} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'unitPrice']}
                      rules={[{ required: true, message: 'Enter price' }]}
                    >
                      <InputNumber placeholder="Unit Price" min={0} step={0.01} />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)}>Remove</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Item
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={`Purchase Order: ${detailsModal?.orderNumber}`}
        open={!!detailsModal}
        onCancel={() => setDetailsModal(null)}
        footer={null}
        width={700}
      >
        {detailsModal && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Supplier">
                {detailsModal.supplier?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(detailsModal.status)}>
                  {detailsModal.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                ${detailsModal.totalAmount?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Delivery">
                {detailsModal.expectedDeliveryDate 
                  ? dayjs(detailsModal.expectedDeliveryDate).format('MMM DD, YYYY')
                  : '-'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {detailsModal.createdBy?.firstName} {detailsModal.createdBy?.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(detailsModal.createdAt).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 16 }}>Items:</h4>
            <Table
              dataSource={detailsModal.items}
              pagination={false}
              size="small"
              columns={[
                { title: 'Medicine', dataIndex: 'medicineName', key: 'medicine' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                { 
                  title: 'Unit Price', 
                  dataIndex: 'unitPrice', 
                  key: 'unitPrice',
                  render: (price: number) => `$${price.toFixed(2)}`
                },
                { 
                  title: 'Total', 
                  key: 'total',
                  render: (record: any) => `$${(record.quantity * record.unitPrice).toFixed(2)}`
                }
              ]}
            />

            {detailsModal.notes && (
              <div style={{ marginTop: 16 }}>
                <strong>Notes:</strong>
                <p>{detailsModal.notes}</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
