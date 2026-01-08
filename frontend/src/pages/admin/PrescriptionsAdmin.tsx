import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Card, Typography, Statistic, Row, Col, message, Descriptions, Drawer, Table as AntTable } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;

type User = { id: string; firstName: string; lastName: string; email?: string };
type Medicine = { id: string; name: string; dosageForm?: string; strength?: string };

type PrescriptionItem = {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  status: 'pending' | 'dispensed' | 'out_of_stock' | 'cancelled';
  medicine?: Medicine;
};

type PrescriptionRow = {
  id: string;
  patient?: User;
  doctor?: User;
  diagnosis?: string;
  notes?: string;
  prescriptionDate: string;
  status: 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';
  items?: PrescriptionItem[];
  createdAt?: string;
};

const PrescriptionsAdmin: React.FC = () => {
  const [data, setData] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [viewing, setViewing] = useState<PrescriptionRow | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize, status };
      const res = await api.get('/pharmacy/prescriptions/admin', { params, suppressErrorToast: true } as any);
      const rows: PrescriptionRow[] = res.data?.prescriptions || res.data?.data || [];
      setData(rows);
      const meta = res.data?.meta;
      setTotal(meta?.total || rows.length || 0);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, status]);

  // Poll for new pending prescriptions every 30s
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await api.get('/pharmacy/prescriptions/admin', { params: { status: 'pending', page: 1, limit: 1 }, suppressErrorToast: true } as any);
        const total = res.data?.meta?.total ?? (res.data?.prescriptions?.length || 0);
        if (mounted && typeof total === 'number') {
          if (pendingCount && total > pendingCount) {
            setPendingNotice(`New pending prescriptions: +${total - pendingCount}`);
          }
          setPendingCount(total);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const onView = async (row: PrescriptionRow) => {
    setViewing(row);
  };

  const onCancelRx = async (row: PrescriptionRow) => {
    Modal.confirm({
      title: 'Cancel prescription?',
      content: 'This will mark the prescription as cancelled.',
      okText: 'Cancel Prescription',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.put(`/pharmacy/prescriptions/${row.id}/cancel`, { reason: 'Cancelled by admin' } as any);
          message.success('Prescription cancelled');
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to cancel prescription');
        }
      }
    });
  };

  const statusColorMap: Record<string, string> = {
    pending: 'orange',
    dispensed: 'green',
    partially_dispensed: 'blue',
    cancelled: 'red'
  };

  const columns: ColumnsType<PrescriptionRow> = [
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
      title: 'Date',
      key: 'prescriptionDate',
      render: (_, row) => new Date(row.prescriptionDate).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, row) => <Tag color={statusColorMap[row.status]}>{row.status.replace('_', ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, row) => `${row.items?.length || 0} medicine(s)`,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as any,
      width: 150,
      render: (_, row) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onView(row)}>View</Button>
          {row.status === 'pending' && (
            <Button type="link" size="small" danger onClick={() => onCancelRx(row)}>Cancel</Button>
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
              title="Total Pending"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={4}>Prescriptions</Title>}
        extra={
          <Space>
            <select
              value={status || ''}
              onChange={(e) => { setStatus(e.target.value || undefined); setPage(1); }}
              style={{ padding: '4px 8px' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="dispensed">Dispensed</option>
              <option value="partially_dispensed">Partially Dispensed</option>
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
          scroll={{ x: 800 }}
        />
      </Card>

      {/* View Details Drawer */}
      <Drawer
        title={`Prescription Details`}
        placement="right"
        onClose={() => setViewing(null)}
        open={!!viewing}
        width={600}
      >
        {viewing && (
          <>
            <Descriptions bordered column={1} style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Patient">
                {viewing.patient ? `${viewing.patient.firstName} ${viewing.patient.lastName}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Doctor">
                {viewing.doctor ? `${viewing.doctor.firstName} ${viewing.doctor.lastName}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Diagnosis">
                {viewing.diagnosis || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes">
                {viewing.notes || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Prescription Date">
                {new Date(viewing.prescriptionDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColorMap[viewing.status]}>{viewing.status.replace('_', ' ').toUpperCase()}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Medicines</Title>
            <AntTable
              columns={[
                {
                  title: 'Medicine',
                  key: 'medicine',
                  render: (_, item: PrescriptionItem) => item.medicine?.name || '—',
                },
                {
                  title: 'Dosage',
                  key: 'dosage',
                  render: (_, item: PrescriptionItem) => item.dosage,
                },
                {
                  title: 'Frequency',
                  key: 'frequency',
                  render: (_, item: PrescriptionItem) => item.frequency,
                },
                {
                  title: 'Duration',
                  key: 'duration',
                  render: (_, item: PrescriptionItem) => item.duration,
                },
                {
                  title: 'Quantity',
                  key: 'quantity',
                  render: (_, item: PrescriptionItem) => item.quantity,
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, item: PrescriptionItem) => <Tag>{item.status}</Tag>,
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

export default PrescriptionsAdmin;
