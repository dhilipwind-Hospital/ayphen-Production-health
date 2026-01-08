import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Switch, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const { TextArea } = Input;
const { Option } = Select;

const Container = styled.div`
  padding: 24px;
`;

interface LabTest {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  sampleType: string;
  sampleInstructions: string;
  normalRange: string;
  units: string;
  cost: number;
  turnaroundTimeMinutes: number;
  isActive: boolean;
}

const TestCatalog: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchTests();
    fetchCategories();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/lab/tests', {
        params: { isActive: 'all', limit: 100 }
      });
      setTests(response.data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      message.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/lab/tests/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const showModal = (test?: LabTest) => {
    if (test) {
      setEditingTest(test);
      form.setFieldsValue(test);
    } else {
      setEditingTest(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingTest) {
        await axios.put(`/api/lab/tests/${editingTest.id}`, values);
        message.success('Test updated successfully');
      } else {
        await axios.post('/api/lab/tests', values);
        message.success('Test created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchTests();
    } catch (error: any) {
      console.error('Error saving test:', error);
      message.error(error.response?.data?.message || 'Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Test',
      content: 'Are you sure you want to delete this test? This will deactivate it.',
      onOk: async () => {
        try {
          await axios.delete(`/api/lab/tests/${id}`);
          message.success('Test deleted successfully');
          fetchTests();
        } catch (error) {
          console.error('Error deleting test:', error);
          message.error('Failed to delete test');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100
    },
    {
      title: 'Test Name',
      dataIndex: 'name',
      key: 'name'
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
      title: 'Sample Type',
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
      title: 'TAT',
      dataIndex: 'turnaroundTimeMinutes',
      key: 'turnaroundTimeMinutes',
      render: (minutes: number) => `${minutes} min`
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
      render: (_: any, record: LabTest) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>🧪 Lab Test Catalog</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Add New Test
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tests}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            turnaroundTimeMinutes: 60,
            category: 'other'
          }}
        >
          <Form.Item
            label="Test Code"
            name="code"
            rules={[{ required: true, message: 'Please enter test code' }]}
          >
            <Input placeholder="e.g., CBC, FBS, HbA1c" />
          </Form.Item>

          <Form.Item
            label="Test Name"
            name="name"
            rules={[{ required: true, message: 'Please enter test name' }]}
          >
            <Input placeholder="e.g., Complete Blood Count" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Detailed description of the test" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select>
              {categories.map(cat => (
                <Option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Sample Type"
            name="sampleType"
          >
            <Input placeholder="e.g., Blood, Urine, Stool" />
          </Form.Item>

          <Form.Item
            label="Sample Instructions"
            name="sampleInstructions"
          >
            <TextArea rows={2} placeholder="Special instructions for sample collection" />
          </Form.Item>

          <Form.Item
            label="Normal Range"
            name="normalRange"
          >
            <Input placeholder="e.g., 70-100 mg/dL" />
          </Form.Item>

          <Form.Item
            label="Units"
            name="units"
          >
            <Input placeholder="e.g., mg/dL, cells/μL" />
          </Form.Item>

          <Form.Item
            label="Cost (₹)"
            name="cost"
            rules={[{ required: true, message: 'Please enter cost' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Turnaround Time (minutes)"
            name="turnaroundTimeMinutes"
            rules={[{ required: true, message: 'Please enter turnaround time' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Active"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingTest ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};

export default TestCatalog;
