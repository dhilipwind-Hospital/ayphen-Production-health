import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Button, Space, Tag, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, PhoneOutlined, DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;

interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  department?: string | null;
  preferredTime?: string | null;
  message?: string | null;
  status?: 'pending' | 'called' | 'completed' | 'no_answer';
  createdAt: string;
}

const CallbackRequestsAdmin: React.FC = () => {
  const [data, setData] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 20, total: 0 });

  const handleStatusUpdate = async (id: string, status: 'called' | 'completed' | 'no_answer') => {
    try {
      await api.patch(`/callback/${id}/status`, { status });
      message.success(`Request marked as ${status}`);
      load(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/callback/${id}`);
      message.success('Request deleted');
      load(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to delete request:', error);
      message.error('Failed to delete request. Please try again.');
    }
  };

  const columns: ColumnsType<CallbackRequest> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
    { 
      title: 'Phone', 
      dataIndex: 'phone', 
      key: 'phone',
      width: 130,
      render: (phone: string) => (
        <a href={`tel:${phone}`} style={{ color: '#ec407a' }}>
          <PhoneOutlined /> {phone}
        </a>
      )
    },
    { title: 'Department', dataIndex: 'department', key: 'department', width: 120 },
    { title: 'Preferred Time', dataIndex: 'preferredTime', key: 'preferredTime', width: 130 },
    { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status: string = 'pending') => {
        const config = {
          pending: { color: 'red', text: 'Pending' },
          called: { color: 'orange', text: 'Called' },
          completed: { color: 'green', text: 'Completed' },
          no_answer: { color: 'default', text: 'No Answer' }
        };
        const { color, text } = config[status as keyof typeof config] || config.pending;
        return <Tag color={color}>{text}</Tag>;
      }
    },
    { 
      title: 'Received At', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString() 
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_: any, record: CallbackRequest) => (
        <Space size={4} wrap={false}>
          {record.status !== 'called' && record.status !== 'completed' && (
            <Button
              size="small"
              icon={<PhoneOutlined style={{ fontSize: 11 }} />}
              onClick={() => handleStatusUpdate(record.id, 'called')}
              style={{ fontSize: 11, padding: '0 8px' }}
            >
              Contact
            </Button>
          )}
          {record.status !== 'completed' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
              onClick={() => handleStatusUpdate(record.id, 'completed')}
              style={{ fontSize: 11, padding: '0 8px' }}
            >
              Done
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              size="small"
              icon={<CloseCircleOutlined style={{ fontSize: 11 }} />}
              onClick={() => handleStatusUpdate(record.id, 'no_answer')}
              style={{ fontSize: 11, padding: '0 6px' }}
              title="No Answer"
            >
              N/A
            </Button>
          )}
          <Popconfirm
            title="Delete this request?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined style={{ fontSize: 11 }} />}
              style={{ padding: '0 8px' }}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const load = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await api.get('/callback/queue', { params: { limit: pageSize, offset: (page - 1) * pageSize } });
      const rows: CallbackRequest[] = res.data?.data || [];
      setData(rows);
      setPagination({ current: page, pageSize, total: res.data?.total || rows.length });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <Title level={3}>Callback Requests</Title>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={pagination}
        onChange={(p) => load(p.current || 1, p.pageSize || 20)}
        style={{ border: '1px solid #e5e7eb' }}
      />
    </Card>
  );
};

export default CallbackRequestsAdmin;
