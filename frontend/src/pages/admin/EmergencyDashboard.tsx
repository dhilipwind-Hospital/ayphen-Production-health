import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Select, Input, Space, Modal, Form, message, Statistic, Row, Col, Badge, Tooltip, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined, UserAddOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, FireOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../../services/api';
import styled from 'styled-components';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface EmergencyRequest {
  id: string;
  name: string;
  phone: string;
  location?: string;
  message?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  responseNotes?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
  responseTime?: number;
  waitingTime?: number;
}

interface Statistics {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  critical: number;
  avgResponseTimeMinutes?: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

const EmergencyDashboard: React.FC = () => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDashboard();
    loadStatistics();
    loadStaffMembers();
  }, [statusFilter, priorityFilter, searchText]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchText) params.search = searchText;

      const res = await api.get('/emergency/dashboard', { params });
      setRequests(res.data?.data || []);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const res = await api.get('/emergency/statistics');
      setStatistics(res.data);
    } catch (error) {
      console.error('Failed to load statistics');
    }
  };

  const loadStaffMembers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'doctor,nurse,admin', limit: 100 } });
      setStaffMembers(res.data?.data || []);
    } catch (error) {
      console.error('Failed to load staff members');
    }
  };

  const handleAssign = (request: EmergencyRequest) => {
    setSelectedRequest(request);
    form.setFieldsValue({ userId: request.assignedTo?.id });
    setAssignModalVisible(true);
  };

  const handleUpdateStatus = (request: EmergencyRequest) => {
    setSelectedRequest(request);
    form.setFieldsValue({ status: request.status, responseNotes: '' });
    setStatusModalVisible(true);
  };

  const handleAddNotes = (request: EmergencyRequest) => {
    setSelectedRequest(request);
    form.setFieldsValue({ notes: '' });
    setNotesModalVisible(true);
  };

  const submitAssignment = async () => {
    try {
      const values = await form.validateFields(['userId']);
      await api.patch(`/emergency/${selectedRequest?.id}/assign`, { userId: values.userId });
      message.success('Emergency request assigned successfully');
      setAssignModalVisible(false);
      loadDashboard();
      loadStatistics();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Failed to assign request');
    }
  };

  const submitStatusUpdate = async () => {
    try {
      const values = await form.validateFields(['status', 'responseNotes']);
      await api.patch(`/emergency/${selectedRequest?.id}/status`, values);
      message.success('Status updated successfully');
      setStatusModalVisible(false);
      loadDashboard();
      loadStatistics();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const submitNotes = async () => {
    try {
      const values = await form.validateFields(['notes']);
      await api.post(`/emergency/${selectedRequest?.id}/notes`, values);
      message.success('Notes added successfully');
      setNotesModalVisible(false);
      loadDashboard();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Failed to add notes');
    }
  };

  const updatePriority = async (id: string, priority: string) => {
    try {
      await api.patch(`/emergency/${id}/priority`, { priority });
      message.success('Priority updated');
      loadDashboard();
      loadStatistics();
    } catch (error: any) {
      message.error('Failed to update priority');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <FireOutlined />;
      case 'high': return <WarningOutlined />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'gold';
      case 'in_progress': return 'blue';
      case 'resolved': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const columns: ColumnsType<EmergencyRequest> = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string, record) => (
        <Select
          value={priority}
          onChange={(value) => updatePriority(record.id, value)}
          style={{ width: '100%' }}
          size="small"
        >
          <Option value="critical">
            <Tag color="red" icon={<FireOutlined />}>Critical</Tag>
          </Option>
          <Option value="high">
            <Tag color="orange" icon={<WarningOutlined />}>High</Tag>
          </Option>
          <Option value="medium">
            <Tag color="blue">Medium</Tag>
          </Option>
          <Option value="low">
            <Tag color="green">Low</Tag>
          </Option>
        </Select>
      ),
      sorter: (a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
    },
    {
      title: 'Patient Info',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div><strong>{record.name}</strong></div>
          <div><Text type="secondary">{record.phone}</Text></div>
          {record.location && <div><Text type="secondary">{record.location}</Text></div>}
        </div>
      )
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
          <div><Text type="secondary">Created:</Text> {dayjs(record.createdAt).fromNow()}</div>
          {record.waitingTime && (
            <div>
              <Badge status="processing" />
              <Text type="warning">Waiting: {record.waitingTime} min</Text>
            </div>
          )}
          {record.responseTime && (
            <div><Text type="success">Responded in: {record.responseTime} min</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
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
            onClick={() => handleUpdateStatus(record)}
            block
          >
            Update Status
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
        <Title level={3}>Emergency Dashboard</Title>
        <Text type="secondary">Manage and respond to emergency requests</Text>
      </div>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="Total Requests"
                value={statistics.total}
                prefix={<WarningOutlined />}
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
                title="In Progress"
                value={statistics.inProgress}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Resolved"
                value={statistics.resolved}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Critical"
                value={statistics.critical}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<FireOutlined />}
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
            <Option value="in_progress">In Progress</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Priority</Option>
            <Option value="critical">Critical</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
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
            onClick={loadDashboard}
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
          rowClassName={(record) => record.priority === 'critical' ? 'critical-row' : ''}
        />
      </Card>

      {/* Assign Modal */}
      <Modal
        title="Assign Emergency Request"
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

      {/* Status Update Modal */}
      <Modal
        title="Update Status"
        open={statusModalVisible}
        onOk={submitStatusUpdate}
        onCancel={() => setStatusModalVisible(false)}
        okText="Update"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Option value="pending">Pending</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="resolved">Resolved</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="responseNotes"
            label="Response Notes"
          >
            <TextArea rows={4} placeholder="Add notes about the response..." />
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

export default EmergencyDashboard;

const PageContainer = styled.div`
  .critical-row {
    background-color: #fff1f0;
  }
`;
