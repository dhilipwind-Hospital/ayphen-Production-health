import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Switch, message, Tag, Space } from 'antd';
import { PlusOutlined, BellOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const Reminders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reminders');
      setReminders(res.data.data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      message.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const userId = (window as any).user?.id; // Get from auth context
      await api.post('/reminders', {
        ...values,
        userId,
        scheduledFor: values.scheduledFor.toISOString()
      });

      message.success('Reminder created successfully');
      setModalVisible(false);
      form.resetFields();
      await loadReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
      message.error('Failed to create reminder');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Delete Reminder',
      content: 'Are you sure you want to delete this reminder?',
      onOk: async () => {
        try {
          await api.delete(`/reminders/${id}`);
          message.success('Reminder deleted');
          await loadReminders();
        } catch (error) {
          console.error('Error deleting reminder:', error);
          message.error('Failed to delete reminder');
        }
      }
    });
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      appointment: 'blue',
      medication: 'green',
      followup: 'orange',
      lab_result: 'purple',
      custom: 'default'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'orange',
      sent: 'green',
      failed: 'red',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: 'Scheduled For',
      dataIndex: 'scheduledFor',
      key: 'scheduledFor',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm')
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
      title: 'Channels',
      key: 'channels',
      render: (record: any) => (
        <Space>
          {record.sendEmail && <Tag>Email</Tag>}
          {record.sendSms && <Tag>SMS</Tag>}
          {record.sendNotification && <Tag>Notification</Tag>}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
          disabled={record.status === 'sent'}
        >
          Delete
        </Button>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>My Reminders</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Create Reminder
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={reminders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="Create Reminder"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select placeholder="Select reminder type">
              <Option value="appointment">Appointment</Option>
              <Option value="medication">Medication</Option>
              <Option value="followup">Follow-up</Option>
              <Option value="lab_result">Lab Result</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="Enter reminder title" />
          </Form.Item>

          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <TextArea rows={3} placeholder="Enter reminder message" />
          </Form.Item>

          <Form.Item
            label="Scheduled For"
            name="scheduledFor"
            rules={[{ required: true, message: 'Please select date and time' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Delivery Channels">
            <Space direction="vertical">
              <Form.Item name="sendEmail" valuePropName="checked" noStyle>
                <Switch /> <span style={{ marginLeft: 8 }}>Send Email</span>
              </Form.Item>
              <Form.Item name="sendSms" valuePropName="checked" noStyle>
                <Switch /> <span style={{ marginLeft: 8 }}>Send SMS</span>
              </Form.Item>
              <Form.Item name="sendNotification" valuePropName="checked" initialValue={true} noStyle>
                <Switch defaultChecked /> <span style={{ marginLeft: 8 }}>Send Notification</span>
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reminders;
