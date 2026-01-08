import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Switch, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;

const SupplierManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      message.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Deactivate Supplier',
      content: 'Are you sure you want to deactivate this supplier?',
      onOk: async () => {
        try {
          await api.delete(`/suppliers/${id}`);
          message.success('Supplier deactivated successfully');
          await loadSuppliers();
        } catch (error) {
          console.error('Error deleting supplier:', error);
          message.error('Failed to deactivate supplier');
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, values);
        message.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', values);
        message.success('Supplier created successfully');
      }
      setModalVisible(false);
      await loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      message.error('Failed to save supplier');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.contactPerson && (
            <div style={{ fontSize: 12, color: '#666' }}>
              Contact: {record.contactPerson}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Contact Information',
      key: 'contact',
      render: (record: any) => (
        <div>
          {record.phone && <div>📞 {record.phone}</div>}
          {record.email && <div>✉️ {record.email}</div>}
        </div>
      )
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.isActive && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              Deactivate
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Supplier Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Supplier
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Supplier Name"
            name="name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>

          <Form.Item
            label="Contact Person"
            name="contactPerson"
          >
            <Input placeholder="Enter contact person name" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Please enter valid email' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
          >
            <TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>

          <Form.Item
            label="Active"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierManagement;
