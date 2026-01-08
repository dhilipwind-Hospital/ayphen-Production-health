import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Rate, Button, Table, Tag, message, Space } from 'antd';
import { StarOutlined, MessageOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const Feedback: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadMyFeedback();
  }, []);

  const loadMyFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/feedback/my-feedback');
      setMyFeedback(res.data.data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      await api.post('/feedback', values);
      message.success('Feedback submitted successfully');
      form.resetFields();
      await loadMyFeedback();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      general: 'default',
      appointment: 'blue',
      doctor: 'green',
      facility: 'orange',
      staff: 'purple',
      suggestion: 'cyan',
      complaint: 'red'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'orange',
      reviewed: 'blue',
      resolved: 'green',
      closed: 'default'
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
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => rating ? <Rate disabled value={rating} /> : '-'
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
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Response',
      key: 'response',
      render: (record: any) => (
        record.response ? (
          <div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.response}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              By: {record.respondedBy?.firstName} {record.respondedBy?.lastName}
            </div>
          </div>
        ) : '-'
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Submit Feedback Form */}
        <Card
          title={
            <Space>
              <MessageOutlined />
              <span>Submit Feedback</span>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Feedback Type"
              name="type"
              rules={[{ required: true, message: 'Please select feedback type' }]}
            >
              <Select placeholder="Select feedback type">
                <Option value="general">General</Option>
                <Option value="appointment">Appointment</Option>
                <Option value="doctor">Doctor</Option>
                <Option value="facility">Facility</Option>
                <Option value="staff">Staff</Option>
                <Option value="suggestion">Suggestion</Option>
                <Option value="complaint">Complaint</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ required: true, message: 'Please enter subject' }]}
            >
              <Input placeholder="Enter feedback subject" />
            </Form.Item>

            <Form.Item
              label="Message"
              name="message"
              rules={[{ required: true, message: 'Please enter your feedback' }]}
            >
              <TextArea
                rows={4}
                placeholder="Please share your feedback, suggestions, or concerns..."
              />
            </Form.Item>

            <Form.Item
              label="Rating (Optional)"
              name="rating"
            >
              <Rate />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<MessageOutlined />}
              >
                Submit Feedback
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* My Feedback History */}
        <Card
          title={
            <Space>
              <StarOutlined />
              <span>My Feedback History</span>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={myFeedback}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default Feedback;
