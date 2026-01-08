import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Select, message, Tag, Space, Statistic, Row, Col } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const InventoryReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [expiryReport, setExpiryReport] = useState<any>(null);
  const [reorderReport, setReorderReport] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [expiryDays, setExpiryDays] = useState(90);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    await Promise.all([
      loadExpiryReport(),
      loadReorderReport(),
      loadMovements()
    ]);
  };

  const loadExpiryReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/inventory/expiry-report?days=${expiryDays}`);
      setExpiryReport(res.data.data);
    } catch (error) {
      console.error('Error loading expiry report:', error);
      message.error('Failed to load expiry report');
    } finally {
      setLoading(false);
    }
  };

  const loadReorderReport = async () => {
    try {
      const res = await api.get('/inventory/reorder-report');
      setReorderReport(res.data);
    } catch (error) {
      console.error('Error loading reorder report:', error);
      message.error('Failed to load reorder report');
    }
  };

  const loadMovements = async () => {
    try {
      const res = await api.get('/inventory/movements?limit=100');
      setMovements(res.data.data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
      message.error('Failed to load stock movements');
    }
  };

  const expiryColumns = [
    {
      title: 'Medicine',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.genericName}</div>
        </div>
      )
    },
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batchNumber'
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock'
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Days Left',
      key: 'daysLeft',
      render: (record: any) => {
        const days = dayjs(record.expiryDate).diff(dayjs(), 'day');
        return (
          <Tag color={days < 30 ? 'red' : days < 60 ? 'orange' : 'gold'}>
            {days} days
          </Tag>
        );
      }
    },
    {
      title: 'Value',
      key: 'value',
      render: (record: any) => `$${(record.currentStock * record.unitPrice).toFixed(2)}`
    }
  ];

  const expiredColumns = [
    ...expiryColumns.slice(0, 4),
    {
      title: 'Expired Since',
      key: 'expiredSince',
      render: (record: any) => {
        const days = Math.abs(dayjs(record.expiryDate).diff(dayjs(), 'day'));
        return <Tag color="red">{days} days ago</Tag>;
      }
    },
    expiryColumns[expiryColumns.length - 1]
  ];

  const reorderColumns = [
    {
      title: 'Medicine',
      dataIndex: ['medicine', 'name'],
      key: 'medicine',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.medicine?.genericName}</div>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number) => (
        <Tag color={stock === 0 ? 'red' : 'orange'}>{stock}</Tag>
      )
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel'
    },
    {
      title: 'Suggested Quantity',
      dataIndex: 'suggestedQuantity',
      key: 'suggestedQuantity',
      render: (qty: number) => <strong>{qty}</strong>
    },
    {
      title: 'Estimated Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (cost: number) => `$${cost.toFixed(2)}`
    }
  ];

  const movementColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Medicine',
      dataIndex: ['medicine', 'name'],
      key: 'medicine'
    },
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      render: (type: string) => (
        <Tag color={type === 'purchase' ? 'green' : type === 'sale' ? 'blue' : 'default'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'Previous Stock',
      dataIndex: 'previousStock',
      key: 'previousStock'
    },
    {
      title: 'New Stock',
      dataIndex: 'newStock',
      key: 'newStock'
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber'
    },
    {
      title: 'Performed By',
      dataIndex: ['performedBy', 'firstName'],
      key: 'performedBy',
      render: (firstName: string, record: any) => 
        `${firstName} ${record.performedBy?.lastName || ''}`
    }
  ];

  const tabItems = [
    {
      key: 'expiry',
      label: 'Expiry Report',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <span>Show medicines expiring within:</span>
              <Select value={expiryDays} onChange={setExpiryDays} style={{ width: 120 }}>
                <Option value={30}>30 days</Option>
                <Option value={60}>60 days</Option>
                <Option value={90}>90 days</Option>
                <Option value={180}>180 days</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={loadExpiryReport}>
                Refresh
              </Button>
            </Space>
          </div>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Expiring Soon"
                  value={expiryReport?.expiringCount || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Already Expired"
                  value={expiryReport?.expiredCount || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <h4>Expiring Soon:</h4>
          <Table
            columns={expiryColumns}
            dataSource={expiryReport?.expiring || []}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />

          <h4 style={{ marginTop: 24 }}>Expired:</h4>
          <Table
            columns={expiredColumns}
            dataSource={expiryReport?.expired || []}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </div>
      )
    },
    {
      key: 'reorder',
      label: 'Reorder Report',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Items Need Reordering"
                  value={reorderReport?.total || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="Total Estimated Cost"
                  value={reorderReport?.totalEstimatedCost || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={reorderColumns}
            dataSource={reorderReport?.data || []}
            rowKey={(record: any) => record.medicine?.id || record.id}
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </div>
      )
    },
    {
      key: 'movements',
      label: 'Stock Movements',
      children: (
        <Table
          columns={movementColumns}
          dataSource={movements}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      )
    }
  ];

  return (
    <Card
      title="Inventory Reports"
      extra={
        <Button icon={<DownloadOutlined />}>
          Export
        </Button>
      }
    >
      <Tabs items={tabItems} />
    </Card>
  );
};

export default InventoryReports;
