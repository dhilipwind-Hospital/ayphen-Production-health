import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Space, Tag, message, Tabs, Statistic, DatePicker, Table as AntTable } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SendOutlined, DollarOutlined, FileOutlined, MailOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  taxRate: number;
  discountRate: number;
  emailSent: boolean;
  createdAt: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}

interface BillingStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

const BillingManagementE2E: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, statsRes] = await Promise.all([
        api.get('/billing'),
        api.get('/billing/stats/overview'),
      ]);
      setInvoices(invoicesRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (e: any) {
      message.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (values: any) => {
    try {
      if (invoiceItems.length === 0) {
        message.error('Add at least one item to the invoice');
        return;
      }

      setLoading(true);
      const res = await api.post('/billing', {
        patientId: values.patientId,
        patientName: values.patientName,
        patientEmail: values.patientEmail,
        patientPhone: values.patientPhone,
        items: invoiceItems,
        taxRate: values.taxRate || 0,
        discountRate: values.discountRate || 0,
        issueDate: values.issueDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        notes: values.notes,
        terms: values.terms,
      });
      setInvoices([...invoices, res.data?.data]);
      setIsInvoiceModalOpen(false);
      form.resetFields();
      setInvoiceItems([]);
      message.success('Invoice created successfully');
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const res = await api.post(`/billing/${invoiceId}/send`);
      setInvoices(invoices.map(i => i.id === invoiceId ? res.data?.data : i));
      message.success('Invoice sent successfully');
      loadData();
    } catch (e: any) {
      message.error('Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (values: any) => {
    try {
      setLoading(true);
      const res = await api.post(`/billing/${selectedInvoice?.id}/payment`, {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        transactionId: values.transactionId,
        reference: values.reference,
        notes: values.notes,
      });
      setPayments([...payments, res.data?.data]);
      setInvoices(invoices.map(i => i.id === selectedInvoice?.id ? res.data?.invoice : i));
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
      message.success('Payment recorded successfully');
      loadData();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      await api.delete(`/billing/${invoiceId}`);
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      message.success('Invoice deleted');
      loadData();
    } catch (e: any) {
      message.error('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].amount = updated[index].quantity * updated[index].unitPrice;
    }
    setInvoiceItems(updated);
  };

  const invoiceColumns = [
    { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (a: number) => `$${a.toFixed(2)}` },
    { title: 'Paid', dataIndex: 'paidAmount', key: 'paidAmount', render: (a: number) => `$${a.toFixed(2)}` },
    { title: 'Due', dataIndex: 'dueAmount', key: 'dueAmount', render: (a: number) => `$${a.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = s === 'Paid' ? 'green' : s === 'Overdue' ? 'red' : 'orange';
      return <Tag color={color}>{s}</Tag>;
    } },
    { title: 'Actions', key: 'actions', render: (_: any, r: Invoice) => (
      <Space size="small">
        {r.status === 'Draft' && <Button size="small" onClick={() => handleSendInvoice(r.id)} icon={<MailOutlined />}>Send</Button>}
        <Button size="small" onClick={() => { setSelectedInvoice(r); setIsPaymentModalOpen(true); }} icon={<DollarOutlined />}>Payment</Button>
        {r.status === 'Draft' && <Button size="small" danger onClick={() => handleDeleteInvoice(r.id)} icon={<DeleteOutlined />}>Delete</Button>}
      </Space>
    ) },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '📊 Dashboard',
          children: (
            <Row gutter={16}>
              <Col span={6}><Statistic title="Total Revenue" value={`$${stats?.totalRevenue || 0}`} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title="Pending Amount" value={`$${stats?.pendingAmount || 0}`} valueStyle={{ color: '#faad14' }} /></Col>
              <Col span={6}><Statistic title="Overdue Amount" value={`$${stats?.overdueAmount || 0}`} valueStyle={{ color: '#f5222d' }} /></Col>
              <Col span={6}><Statistic title="Collection Rate" value={`${stats?.collectionRate || 0}%`} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Total Invoices" value={stats?.totalInvoices || 0} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Paid" value={stats?.paidInvoices || 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Pending" value={stats?.pendingInvoices || 0} /></Col>
              <Col span={6} style={{ marginTop: 16 }}><Statistic title="Overdue" value={stats?.overdueInvoices || 0} valueStyle={{ color: '#f5222d' }} /></Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '📋 Invoices',
          children: (
            <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsInvoiceModalOpen(true)}>Create Invoice</Button>}>
              <Table rowKey="id" columns={invoiceColumns as any} dataSource={invoices} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '3',
          label: '💳 Payments',
          children: (
            <Card title="Payment Records">
              <Table rowKey="id" columns={[
                { title: 'Invoice', key: 'invoiceId', render: (_: any, r: Payment) => invoices.find(i => i.id === r.invoiceId)?.invoiceNumber },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => `$${a.toFixed(2)}` },
                { title: 'Method', dataIndex: 'paymentMethod', key: 'paymentMethod' },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Completed' ? 'green' : 'orange'}>{s}</Tag> },
                { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
              ] as any} dataSource={payments} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
      ]} />

      <Modal open={isInvoiceModalOpen} title="Create Invoice" onCancel={() => { setIsInvoiceModalOpen(false); setInvoiceItems([]); }} width={1000} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleCreateInvoice}>
          {/* Patient Information Section */}
          <Card title="📋 Patient Information" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="patientId" label="Patient ID" rules={[{ required: true, message: 'Patient ID is required' }]}>
                  <Input placeholder="Enter patient ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="patientName" label="Patient Name" rules={[{ required: true, message: 'Patient name is required' }]}>
                  <Input placeholder="Enter patient name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="patientEmail" label="Email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Invalid email' }]}>
                  <Input placeholder="patient@example.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="patientPhone" label="Phone" rules={[{ required: true, message: 'Phone number is required' }]}>
                  <Input placeholder="+1234567890" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Invoice Dates Section */}
          <Card title="📅 Invoice Dates" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true, message: 'Issue date is required' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dueDate" label="Due Date" rules={[{ required: true, message: 'Due date is required' }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Invoice Items Section */}
          <Card title="🛒 Invoice Items" extra={<Button type="dashed" onClick={addInvoiceItem}>+ Add Item</Button>} style={{ marginBottom: 16 }}>
            {invoiceItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <p>No items added. Click "+ Add Item" to start adding invoice items.</p>
              </div>
            ) : (
              <Table
                dataSource={invoiceItems.map((item, i) => ({ ...item, key: i }))}
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description', width: 200, render: (_: any, __: any, i: any) => (
                    <Input value={invoiceItems[i.key]?.description} placeholder="e.g., Consultation" onChange={(e) => updateInvoiceItem(i.key, 'description', e.target.value)} />
                  ) },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 80, render: (_: any, __: any, i: any) => (
                    <InputNumber min={1} value={invoiceItems[i.key]?.quantity} onChange={(v) => updateInvoiceItem(i.key, 'quantity', v)} />
                  ) },
                  { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, render: (_: any, __: any, i: any) => (
                    <InputNumber min={0} value={invoiceItems[i.key]?.unitPrice} onChange={(v) => updateInvoiceItem(i.key, 'unitPrice', v)} />
                  ) },
                  { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 100, render: (_: any, __: any, i: any) => <strong>${invoiceItems[i.key]?.amount.toFixed(2)}</strong> },
                  { title: 'Action', key: 'action', width: 80, render: (_: any, __: any, i: any) => (
                    <Button danger size="small" onClick={() => setInvoiceItems(invoiceItems.filter((_, idx) => idx !== i.key))}>Remove</Button>
                  ) },
                ] as any}
                pagination={false}
              />
            )}
            <div style={{ marginTop: 16, textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <Row gutter={16}>
                <Col span={12} style={{ textAlign: 'right' }}><strong>Subtotal:</strong></Col>
                <Col span={12} style={{ textAlign: 'right' }}><strong>${invoiceItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</strong></Col>
              </Row>
            </div>
          </Card>

          {/* Tax & Discount Section */}
          <Card title="💰 Tax & Discount" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="taxRate" label="Tax Rate (%)" rules={[{ required: true, message: 'Tax rate is required' }]}>
                  <InputNumber min={0} max={100} placeholder="0" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="discountRate" label="Discount (%)" rules={[{ required: true, message: 'Discount rate is required' }]}>
                  <InputNumber min={0} max={100} placeholder="0" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Notes Section */}
          <Card title="📝 Additional Information" style={{ marginBottom: 16 }}>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Add any additional notes or terms" />
            </Form.Item>
          </Card>

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setIsInvoiceModalOpen(false); setInvoiceItems([]); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large">💾 Create Invoice</Button>
          </Space>
        </Form>
      </Modal>

      <Modal open={isPaymentModalOpen} title={`Record Payment - ${selectedInvoice?.invoiceNumber}`} onCancel={() => setIsPaymentModalOpen(false)} footer={null} destroyOnClose>
        <Form layout="vertical" form={paymentForm} onFinish={handleRecordPayment}>
          <Form.Item label="Due Amount">
            <Input disabled value={`$${selectedInvoice?.dueAmount.toFixed(2)}`} />
          </Form.Item>
          <Form.Item name="amount" label="Payment Amount" rules={[{ required: true }]}>
            <InputNumber min={0} max={selectedInvoice?.dueAmount} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
            <Select>
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
              <Option value="Bank Transfer">Bank Transfer</Option>
              <Option value="UPI">UPI</Option>
              <Option value="Cash">Cash</Option>
            </Select>
          </Form.Item>
          <Form.Item name="transactionId" label="Transaction ID">
            <Input />
          </Form.Item>
          <Form.Item name="reference" label="Reference">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>Record Payment</Button>
            <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default BillingManagementE2E;
