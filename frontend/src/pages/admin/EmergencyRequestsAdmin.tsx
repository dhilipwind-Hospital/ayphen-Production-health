import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Button, Space, Tag, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, PhoneOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;

interface EmergencyRequest {
  id: string;
  name: string;
  phone: string;
  location?: string | null;
  message?: string | null;
  status?: 'pending' | 'contacted' | 'resolved';
  createdAt: string;
}

const EmergencyRequestsAdmin: React.FC = () => {
  const [data, setData] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({ current: 1, pageSize: 20, total: 0 });

  const handleStatusUpdate = async (id: string, status: 'contacted' | 'resolved') => {
    try {
      // Map frontend status to backend status
      const backendStatus = status === 'contacted' ? 'in_progress' : 'resolved';
      
      // Update via API
      await api.patch(`/emergency/${id}/status`, { status: backendStatus });
      message.success(`Request marked as ${status}`);
      load(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/emergency/${id}`);
      message.success('Request deleted');
      load(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to delete request:', error);
      message.error('Failed to delete request. Please try again.');
    }
  };

  const columns: ColumnsType<EmergencyRequest> = [
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
    { title: 'Location', dataIndex: 'location', key: 'location', ellipsis: true, width: 120 },
    { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status: string = 'pending') => {
        const config = {
          pending: { color: 'red', text: 'Pending' },
          contacted: { color: 'orange', text: 'Contacted' },
          resolved: { color: 'green', text: 'Resolved' }
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
      width: 280,
      fixed: 'right',
      render: (_: any, record: EmergencyRequest) => (
        <Space size={4} wrap={false} style={{ display: 'flex', justifyContent: 'flex-start' }}>
          {record.status !== 'contacted' && record.status !== 'resolved' && (
            <Button
              size="small"
              icon={<PhoneOutlined />}
              onClick={() => handleStatusUpdate(record.id, 'contacted')}
              style={{ fontSize: 12 }}
            >
              Contact
            </Button>
          )}
          {record.status !== 'resolved' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusUpdate(record.id, 'resolved')}
              style={{ fontSize: 12 }}
            >
              Resolve
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
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const load = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const res = await api.get('/emergency/dashboard', { params: { limit: pageSize, offset: (page - 1) * pageSize } });
      const rows: any[] = res.data?.data || [];
      
      // Map backend status to frontend status
      const mappedRows = rows.map(row => ({
        ...row,
        status: row.status === 'in_progress' ? 'contacted' : row.status
      }));
      
      setData(mappedRows);
      setPagination({ current: page, pageSize, total: res.data?.total || rows.length });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <Title level={3}>Emergency Requests</Title>
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

export default EmergencyRequestsAdmin;
