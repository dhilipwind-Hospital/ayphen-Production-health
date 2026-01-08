import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Card, Typography, Statistic, Row, Col, message, Descriptions, Drawer, Table as AntTable } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;

type User = { id: string; firstName: string; lastName: string; email?: string };
type LabTest = { id: string; name: string; code?: string };

type LabOrderItem = {
  id: string;
  labTestId: string;
  labTest?: LabTest;
  status: 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
};

type LabOrderRow = {
  id: string;
  orderNumber: string;
  patient?: User;
  doctor?: User;
  diagnosis?: string;
  clinicalNotes?: string;
  orderDate: string;
  isUrgent: boolean;
  status: 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
  items?: LabOrderItem[];
  createdAt?: string;
};

const LabOrdersAdmin: React.FC = () => {
  const [data, setData] = useState<LabOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>('ordered');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [viewing, setViewing] = useState<LabOrderRow | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize, status };
      const res = await api.get('/lab/orders', { params, suppressErrorToast: true } as any);
      const rows: LabOrderRow[] = res.data?.orders || res.data?.data || [];
      setData(rows);
      setTotal(res.data?.total || rows.length || 0);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, status]);

  // Poll for new pending lab orders every 30s
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await api.get('/lab/orders', { params: { status: 'ordered', page: 1, limit: 1 }, suppressErrorToast: true } as any);
        const total = res.data?.total ?? (res.data?.orders?.length || 0);
        if (mounted && typeof total === 'number') {
          if (pendingCount && total > pendingCount) {
            setPendingNotice(`New pending lab orders: +${total - pendingCount}`);
          }
          setPendingCount(total);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const onView = async (row: LabOrderRow) => {
    setViewing(row);
  };

  const onCancelOrder = async (row: LabOrderRow) => {
    Modal.confirm({
      title: 'Cancel lab order?',
      content: 'This will mark the lab order as cancelled.',
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.put(`/lab/orders/${row.id}/cancel`, { reason: 'Cancelled by admin' } as any);
          message.success('Lab order cancelled');
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to cancel lab order');
        }
      }
    });
  };

  const statusColorMap: Record<string, string> = {
    ordered: 'orange',
    sample_collected: 'blue',
    in_progress: 'cyan',
    completed: 'green',
    cancelled: 'red'
  };

  const columns: ColumnsType<LabOrderRow> = [
    {
      title: 'Order #',
      key: 'orderNumber',
      render: (_, row) => row.orderNumber,
      width: 120,
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_, row) => row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : '—',
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_, row) => row.doctor ? `${row.doctor.firstName} ${row.doctor.lastName}` : '—',
    },
    {
      title: 'Diagnosis',
      key: 'diagnosis',
      render: (_, row) => row.diagnosis || '—',
      ellipsis: true,
    },
    {
      title: 'Order Date',
      key: 'orderDate',
      render: (_, row) => new Date(row.orderDate).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, row) => <Tag color={statusColorMap[row.status]}>{row.status.replace('_', ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Priority',
      key: 'isUrgent',
      render: (_, row) => row.isUrgent ? <Tag color="red">URGENT</Tag> : <Tag>Standard</Tag>,
    },
    {
      title: 'Tests',
      key: 'items',
      render: (_, row) => `${row.items?.length || 0} test(s)`,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as any,
      width: 150,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onView(row)}>View</Button>
          {row.status === 'ordered' && (
            <Button type="link" size="small" danger onClick={() => onCancelOrder(row)}>Cancel</Button>
          )}
        </Space>
      ),
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {pendingNotice && (
        <Card style={{ marginBottom: '16px', background: '#fffbe6', border: '1px solid #ffe58f' }}>
          {pendingNotice}
        </Card>
      )}

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={4}>Lab Orders</Title>}
        extra={
          <Space>
            <select
              value={status || ''}
              onChange={(e) => { setStatus(e.target.value || undefined); setPage(1); }}
              style={{ padding: '4px 8px' }}
            >
              <option value="">All Statuses</option>
              <option value="ordered">Ordered</option>
              <option value="sample_collected">Sample Collected</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* View Details Drawer */}
      <Drawer
        title={`Lab Order #${viewing?.orderNumber || ''}`}
        placement="right"
        onClose={() => setViewing(null)}
        open={!!viewing}
        width={600}
      >
        {viewing && (
          <>
            <Descriptions bordered column={1} style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Order Number">
                {viewing.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Patient">
                {viewing.patient ? `${viewing.patient.firstName} ${viewing.patient.lastName}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Doctor">
                {viewing.doctor ? `${viewing.doctor.firstName} ${viewing.doctor.lastName}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Diagnosis">
                {viewing.diagnosis || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Clinical Notes">
                {viewing.clinicalNotes || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {new Date(viewing.orderDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                {viewing.isUrgent ? <Tag color="red">URGENT</Tag> : <Tag>Standard</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColorMap[viewing.status]}>{viewing.status.replace('_', ' ').toUpperCase()}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Tests Ordered</Title>
            <AntTable
              columns={[
                {
                  title: 'Test Name',
                  key: 'labTest',
                  render: (_, item: LabOrderItem) => item.labTest?.name || '—',
                },
                {
                  title: 'Code',
                  key: 'code',
                  render: (_, item: LabOrderItem) => item.labTest?.code || '—',
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, item: LabOrderItem) => <Tag>{item.status.replace('_', ' ')}</Tag>,
                },
              ]}
              dataSource={viewing.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default LabOrdersAdmin;
