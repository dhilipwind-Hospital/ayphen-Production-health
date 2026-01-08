import React, { useEffect, useMemo, useState } from 'react';
import { Table, Tag, Typography, Card, Alert, Spin, Button, DatePicker, Select, Input, Space, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api, { readToken } from '../../services/api';

const { Title } = Typography;

interface Bill {
  id: string;
  billNumber: string;
  amount: number;
  paidAmount: number;
  status: string;
  paymentMethod?: string;
  description?: string;
  billDate: string;
  dueDate?: string;
  paidDate?: string;
}

const BillingHistory: React.FC = () => {
  const [data, setData] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [range, setRange] = useState<[string | undefined, string | undefined]>([undefined, undefined]);
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState<string>('');
  const [msgApi, msgCtx] = message.useMessage();

  const load = async (opts?: { page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: opts?.page || page, limit: pageSize };
      if (range[0] && range[1]) { params.startDate = range[0]; params.endDate = range[1]; }
      if (status && status !== 'all') params.status = status;
      if (q) params.q = q;
      const res = await api.get('/patient-portal/bills', { params } as any);
      const items = res.data?.data || [];
      setData(items);
      const meta = res.data?.meta || {};
      if (meta?.total !== undefined) setTotal(Number(meta.total));
      if (opts?.page) setPage(opts.page);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load({ page: 1 }); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      case 'cancelled': return 'gray';
      default: return 'default';
    }
  };

  const columns: ColumnsType<Bill> = [
    {
      title: 'Bill #',
      dataIndex: 'billNumber',
      key: 'billNumber'
    },
    {
      title: 'Date',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.billDate).unix() - dayjs(b.billDate).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => `$${Number(amount ?? 0).toFixed(2)}`
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (paid: any) => `$${Number(paid ?? 0).toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date?: string) => date ? dayjs(date).format('MMM DD, YYYY') : '—'
    },
    {
      title: 'Invoice',
      key: 'invoice',
      render: (_: any, record: Bill) => (
        <Space>
          <Button type="link" size="small" className="no-print" onClick={async () => {
            try {
              const token = readToken();
              const res = await fetch(`/api/patient-portal/bills/${record.id}/invoice.pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
              if (!res.ok) throw new Error('Open failed');
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              window.open(url, '_blank');
            } catch (e: any) {
              msgApi.error(e?.message || 'Failed to open');
            }
          }}>View</Button>
          <Button type="link" size="small" className="no-print" onClick={async () => {
            try {
              const token = readToken();
              const res = await fetch(`/api/patient-portal/bills/${record.id}/invoice.pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
              if (!res.ok) throw new Error('Download failed');
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoice_${record.billNumber}.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e: any) {
              msgApi.error(e?.message || 'Failed to download');
            }
          }}>Download</Button>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Bill) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            disabled={record.status === 'paid' || record.status === 'cancelled'}
            onClick={() => {
              Modal.confirm({
                title: 'Confirm Payment',
                content: `Pay bill #${record.billNumber} for $${Number(record.amount || 0).toFixed(2)}?`,
                okText: 'Pay',
                onOk: async () => {
                  try {
                    await api.post(`/patient-portal/bills/${record.id}/pay`, { paymentMethod: 'online' } as any);
                    msgApi.success('Payment successful');
                    load({ page });
                  } catch (e: any) {
                    msgApi.error(e?.response?.data?.message || 'Payment failed');
                  }
                }
              });
            }}
          >
            Pay Now
          </Button>
          <Button
            size="small"
            onClick={async () => {
              try {
                const token = readToken();
                const res = await fetch(`/api/patient-portal/bills/${record.id}/invoice.pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                if (!res.ok) throw new Error('Download failed');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice_${record.billNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e: any) {
                msgApi.error(e?.message || 'Failed to download');
              }
            }}
          >
            Invoice PDF
          </Button>
          <Button
            size="small"
            onClick={async () => {
              try {
                const r = await api.post(`/patient-portal/bills/${record.id}/stripe-test`, {} as any);
                const url = (r.data as any)?.checkoutUrl;
                if (url) { window.open(url, '_blank'); }
                else { msgApi.info('Stripe not configured'); }
              } catch (e: any) {
                msgApi.error(e?.response?.data?.message || 'Failed to start Stripe test');
              }
            }}
          >
            Stripe (Test)
          </Button>
        </Space>
      )
    }
  ];

  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ], []);

  const exportCsv = () => {
    const rows = [
      ['Bill #','Date','Amount','Paid','Status','Due Date'],
      ...data.map((b) => [
        b.billNumber,
        dayjs(b.billDate).format('YYYY-MM-DD'),
        String(b.amount),
        String(b.paidAmount),
        b.status,
        b.dueDate ? dayjs(b.dueDate).format('YYYY-MM-DD') : ''
      ])
    ];
    const csv = rows.map(r => r.map(v => String(v ?? '').replace(/"/g,'""')).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bills.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <div>
      {msgCtx}
      <Title level={2}>Billing History</Title>
      <Card className="print-scope-bills">
        <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Input.Search
            placeholder="Search bill # / description"
            allowClear
            onSearch={(val) => { setQ(val); load({ page: 1 }); }}
            style={{ maxWidth: 320 }}
          />
          <Select
            options={statusOptions}
            value={status}
            onChange={(v) => { setStatus(v); load({ page: 1 }); }}
            style={{ width: 200 }}
          />
          <DatePicker.RangePicker
            onChange={(vals) => {
              const start = vals?.[0]?.toDate?.()?.toISOString?.();
              const end = vals?.[1]?.toDate?.()?.toISOString?.();
              setRange([start, end]);
              load({ page: 1 });
            }}
          />
          <Button onClick={() => load({ page: 1 })}>Refresh</Button>
          <Button onClick={exportCsv}>Export CSV</Button>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ current: page, pageSize, total, showSizeChanger: false }}
          onChange={(p) => load({ page: p.current || 1 })}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0 }}>
                {record.description && <p><strong>Description:</strong> {record.description}</p>}
                {record.paymentMethod && <p><strong>Payment Method:</strong> {record.paymentMethod}</p>}
                {record.paidDate && <p><strong>Paid Date:</strong> {dayjs(record.paidDate).format('MMM DD, YYYY')}</p>}
              </div>
            ),
            rowExpandable: (record) => !!(record.description || record.paymentMethod || record.paidDate)
          }}
        />
      </Card>
    </div>
  );
};

export default BillingHistory;
