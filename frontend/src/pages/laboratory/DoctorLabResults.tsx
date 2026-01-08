import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Select, Descriptions, Modal, Empty } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../services/api';
import styled from 'styled-components';

const { Option } = Select;

const Container = styled.div`
  padding: 24px;
`;

interface LabOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  status: string;
  isUrgent: boolean;
  items: Array<{
    id: string;
    labTest: {
      name: string;
      code: string;
    };
    status: string;
    result?: {
      resultValue: string;
      units: string;
      referenceRange: string;
      flag: string;
      interpretation: string;
      isVerified: boolean;
      resultTime: string;
    };
  }>;
}

const DoctorLabResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<LabOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDoctorOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchText, statusFilter]);

  const fetchDoctorOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab/orders/doctor');
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching doctor orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
        `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const viewDetails = (order: LabOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ordered: 'blue',
      sample_collected: 'cyan',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const getFlagColor = (flag: string) => {
    const colors: Record<string, string> = {
      normal: 'green',
      abnormal: 'orange',
      critical: 'red'
    };
    return colors[flag] || 'default';
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: LabOrder) => (
        <>
          {text}
          {record.isUrgent && <Tag color="red" style={{ marginLeft: 8 }}>URGENT</Tag>}
        </>
      )
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, record: LabOrder) =>
        `${record.patient.firstName} ${record.patient.lastName}`
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Tests',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Results',
      key: 'results',
      render: (_: any, record: LabOrder) => {
        const completedTests = record.items.filter(item => item.result);
        const totalTests = record.items.length;
        return `${completedTests.length}/${totalTests}`;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: LabOrder) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewDetails(record)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <Container>
      <h1>🔬 Lab Test Results</h1>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Input
            placeholder="Search by order number or patient name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
          >
            <Option value="all">All Status</Option>
            <Option value="ordered">Ordered</Option>
            <Option value="sample_collected">Sample Collected</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
          </Select>
        </div>

        {filteredOrders.length === 0 && !loading ? (
          <Empty description="No lab orders found" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title={`Lab Order Details - ${selectedOrder?.orderNumber}`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={900}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Order Number" span={2}>
                {selectedOrder.orderNumber}
                {selectedOrder.isUrgent && <Tag color="red" style={{ marginLeft: 8 }}>URGENT</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Patient">
                {selectedOrder.patient.firstName} {selectedOrder.patient.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {new Date(selectedOrder.orderDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 24, marginBottom: 16 }}>Test Results:</h3>

            {selectedOrder.items.map((item) => (
              <Card
                key={item.id}
                size="small"
                style={{ marginBottom: 16 }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.labTest.name} ({item.labTest.code})</span>
                    <Tag color={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Tag>
                  </div>
                }
              >
                {item.result ? (
                  <>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="Result" span={2}>
                        <strong style={{ fontSize: '16px' }}>
                          {item.result.resultValue} {item.result.units}
                        </strong>
                        <Tag
                          color={getFlagColor(item.result.flag)}
                          style={{ marginLeft: 8 }}
                        >
                          {item.result.flag.toUpperCase()}
                        </Tag>
                        {item.result.isVerified && (
                          <Tag color="green" style={{ marginLeft: 8 }}>
                            ✓ VERIFIED
                          </Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Reference Range" span={2}>
                        {item.result.referenceRange}
                      </Descriptions.Item>
                      {item.result.interpretation && (
                        <Descriptions.Item label="Interpretation" span={2}>
                          {item.result.interpretation}
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Result Time" span={2}>
                        {new Date(item.result.resultTime).toLocaleString()}
                      </Descriptions.Item>
                    </Descriptions>

                    {item.result.flag === 'critical' && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#fff2e8',
                        border: '1px solid #ffbb96',
                        borderRadius: 4
                      }}>
                        <strong style={{ color: '#ff4d4f' }}>⚠️ Critical Result</strong>
                        <p style={{ margin: '8px 0 0 0' }}>
                          This result requires immediate attention. Please review and take appropriate action.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
                    <p>Result not yet available</p>
                    <Tag color="orange">{item.status.replace('_', ' ').toUpperCase()}</Tag>
                  </div>
                )}
              </Card>
            ))}
          </>
        )}
      </Modal>
    </Container>
  );
};

export default DoctorLabResults;
