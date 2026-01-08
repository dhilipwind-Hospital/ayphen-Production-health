import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Select, Input, Space, Modal, Form, message, Statistic, Row, Col, DatePicker, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined, UserAddOutlined, PhoneOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../../services/api';
import styled from 'styled-components';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  department?: string;
  preferredTime?: string;
  message?: string;
  status: 'pending' | 'called' | 'completed' | 'cancelled' | 'no_answer';
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  callNotes?: string;
  callOutcome?: string;
  calledAt?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  responseTime?: number;
  waitingTime?: number;
}

interface Statistics {
  total: number;
  pending: number;
  called: number;
  completed: number;
  noAnswer: number;
  avgResponseTimeMinutes?: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const CallbackQueue: React.FC = () => {
  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CallbackRequest | null>(null);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadQueue();
    loadStatistics();
    loadStaffMembers();
  }, [statusFilter, searchText]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchText) params.search = searchText;

      const res = await api.get('/callback/queue', { params });
      setRequests(res.data?.data || []);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load callback requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const res = await api.get('/callback/statistics');
      setStatistics(res.data);
    } catch (error) {
      console.error('Failed to load statistics');
    }
  };

  const loadStaffMembers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'receptionist,nurse,admin', limit: 100 } });
      setStaffMembers(res.data?.data || []);
    } catch (error) {
      console.error('Failed to load staff members');
    }
  };

  const handleAssign = (request: CallbackRequest) => {
    setSelectedRequest(request);
    form.setFieldsValue({ userId: request.assignedTo?.id });
    setAssignModalVisible(true);
  };

  const handleMarkCalled = (request: CallbackRequest) => {
    setSelectedRequest(request);
    form.setFieldsValue({ 
      status: 'called',
      callNotes: '',
      callOutcome: '',
      followUpDate: null
    });
    setCallModalVisible(true);
  };

  const handleAddNotes = (request: CallbackRequest) => {
    setSelectedRequest(request);
    form.setFieldsValue({ notes: '' });
    setNotesModalVisible(true);
  };

  const submitAssignment = async () => {
    try {
      const values = await form.validateFields(['userId']);
      await api.patch(`/callback/${selectedRequest?.id}/assign`, { userId: values.userId });
      message.success('Callback request assigned successfully');
      setAssignModalVisible(false);
      loadQueue();
      loadStatistics();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Failed to assign request');
    }
  };

  const submitCallUpdate = async () => {
    try {
      const values = await form.validateFields(['status', 'callNotes', 'callOutcome']);
      const payload: any = {
        status: values.status,
        callNotes: values.callNotes,
        callOutcome: values.callOutcome
      };
      
      if (values.followUpDate) {
        payload.followUpDate = values.followUpDate.toISOString();
      }

      await api.patch(`/callback/${selectedRequest?.id}/status`, payload);
      message.success('Call status updated successfully');
      setCallModalVisible(false);
      loadQueue();
      loadStatistics();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const submitNotes = async () => {
    try {
      const values = await form.validateFields(['notes']);
      await api.post(`/callback/${selectedRequest?.id}/notes`, values);
      message.success('Notes added successfully');
      setNotesModalVisible(false);
      loadQueue();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Failed to add notes');
    }
  };

  const quickMarkCalled = async (id: string) => {
    try {
      await api.patch(`/callback/${id}/status`, { status: 'called' });
      message.success('Marked as called');
      loadQueue();
      loadStatistics();
    } catch (error: any) {
      message.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'gold';
      case 'called': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      case 'no_answer': return 'orange';
      default: return 'default';
    }
  };

  const columns: ColumnsType<CallbackRequest> = [
    {
      title: 'Patient Info',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div><strong>{record.name}</strong></div>
          <div><Text type="secondary"><PhoneOutlined /> {record.phone}</Text></div>
          {record.department && <div><Tag>{record.department}</Tag></div>}
        </div>
      )
    },
    {
      title: 'Preferred Time',
      dataIndex: 'preferredTime',
      key: 'preferredTime',
      render: (time: string) => time || <Text type="secondary">Any time</Text>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => message || <Text type="secondary">No message</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      width: 150,
      render: (_, record) => (
        record.assignedTo ? (
          <Text>{record.assignedTo.firstName} {record.assignedTo.lastName}</Text>
        ) : (
          <Text type="secondary">Unassigned</Text>
        )
      )
    },
    {
      title: 'Time',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <div>
          <div><Text type="secondary">Requested:</Text> {dayjs(record.createdAt).fromNow()}</div>
          {record.waitingTime && (
            <div><Text type="warning">Waiting: {record.waitingTime} min</Text></div>
          )}
          {record.calledAt && (
            <div><Text type="success">Called: {dayjs(record.calledAt).fromNow()}</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<PhoneOutlined />}
              onClick={() => quickMarkCalled(record.id)}
              block
            >
              Quick Call
            </Button>
          )}
          <Button
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => handleAssign(record)}
            block
          >
            {record.assignedTo ? 'Reassign' : 'Assign'}
          </Button>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkCalled(record)}
            block
          >
            Update Call
          </Button>
          <Button
            size="small"
            onClick={() => handleAddNotes(record)}
            block
          >
            Add Notes
          </Button>
        </Space>
      )
    }
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Callback Queue</Title>
        <Text type="secondary">Manage and track callback requests</Text>
      </div>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="Total Requests"
                value={statistics.total}
                prefix={<PhoneOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Pending"
                value={statistics.pending}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Called"
                value={statistics.called}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Completed"
                value={statistics.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="No Answer"
                value={statistics.noAnswer}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Avg Response"
                value={statistics.avgResponseTimeMinutes || 0}
                suffix="min"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="called">Called</Option>
            <Option value="completed">Completed</Option>
            <Option value="no_answer">No Answer</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>

          <Input
            placeholder="Search by name or phone"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={loadQueue}
          >
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* Assign Modal */}
      <Modal
        title="Assign Callback Request"
        open={assignModalVisible}
        onOk={submitAssignment}
        onCancel={() => setAssignModalVisible(false)}
        okText="Assign"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label="Assign To"
            rules={[{ required: true, message: 'Please select a staff member' }]}
          >
            <Select placeholder="Select staff member">
              {staffMembers.map(staff => (
                <Option key={staff.id} value={staff.id}>
                  {staff.firstName} {staff.lastName} ({staff.role})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Call Update Modal */}
      <Modal
        title="Update Call Status"
        open={callModalVisible}
        onOk={submitCallUpdate}
        onCancel={() => setCallModalVisible(false)}
        okText="Update"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value="called">Called</Option>
              <Option value="completed">Completed</Option>
              <Option value="no_answer">No Answer</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="callOutcome"
            label="Call Outcome"
          >
            <Select placeholder="Select outcome">
              <Option value="appointment_booked">Appointment Booked</Option>
              <Option value="information_provided">Information Provided</Option>
              <Option value="follow_up_needed">Follow-up Needed</Option>
              <Option value="not_interested">Not Interested</Option>
              <Option value="wrong_number">Wrong Number</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="callNotes"
            label="Call Notes"
            rules={[{ required: true, message: 'Please add call notes' }]}
          >
            <TextArea rows={4} placeholder="Enter details about the call..." />
          </Form.Item>

          <Form.Item
            name="followUpDate"
            label="Follow-up Date (Optional)"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Notes Modal */}
      <Modal
        title="Add Notes"
        open={notesModalVisible}
        onOk={submitNotes}
        onCancel={() => setNotesModalVisible(false)}
        okText="Add Notes"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="notes"
            label="Notes"
            rules={[{ required: true, message: 'Please enter notes' }]}
          >
            <TextArea rows={4} placeholder="Enter your notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default CallbackQueue;

const PageContainer = styled.div`
  .overdue-row {
    background-color: #fff7e6;
  }
`;
