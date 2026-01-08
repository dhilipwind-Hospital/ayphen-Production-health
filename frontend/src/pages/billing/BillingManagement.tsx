import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Row, Col, Typography, Input, Select, Modal, Form, message, Tabs, Statistic, DatePicker, Progress } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  DollarOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  services: ServiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  insuranceClaimId?: string;
  notes?: string;
}

interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  department: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Credit Card' | 'Insurance' | 'Bank Transfer' | 'Check';
  paymentDate: string;
  transactionId?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

const BillingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();

  // Sample data - initialized as empty, fetch from API
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [payments, setPayments] = useState<Payment[]>([]);

  const invoiceColumns = [
    {
      title: 'Invoice',
      key: 'invoice',
      render: (record: Invoice) => (
        <div>
          <div style={{ fontWeight: 600, color: '#e91e63' }}>{record.invoiceNumber}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.issueDate}</div>
        </div>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (record: Invoice) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patientName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.patientEmail}</div>
        </div>
      ),
    },
    {
      title: 'Services',
      dataIndex: 'services',
      key: 'services',
      render: (services: ServiceItem[]) => (
        <div>
          <Text strong>{services.length}</Text>
          <Text type="secondary"> services</Text>
          <div style={{ marginTop: 4 }}>
            {services.slice(0, 2).map(service => (
              <Tag key={service.id} style={{ fontSize: '10px', marginBottom: 2 }}>
                {service.description}
              </Tag>
            ))}
            {services.length > 2 && (
              <Tag style={{ fontSize: '10px' }}>
                +{services.length - 2} more
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#e91e63' }}>
            ${total.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Invoice) => {
        const colors = {
          Draft: '#d9d9d9',
          Sent: '#1890ff',
          Paid: '#52c41a',
          Overdue: '#ff4d4f',
          Cancelled: '#ff4d4f'
        };
        const icons = {
          Draft: <EditOutlined />,
          Sent: <ClockCircleOutlined />,
          Paid: <CheckCircleOutlined />,
          Overdue: <ExclamationCircleOutlined />,
          Cancelled: <ExclamationCircleOutlined />
        };
        return (
          <div>
            <Tag color={colors[status as keyof typeof colors]} icon={icons[status as keyof typeof icons]}>
              {status}
            </Tag>
            {status === 'Overdue' && (
              <div style={{ fontSize: '10px', color: '#ff4d4f' }}>
                Due: {record.dueDate}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Invoice) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewInvoice(record)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditInvoice(record)}
          />
          <Button 
            type="text" 
            icon={<PrinterOutlined />} 
            onClick={() => handlePrintInvoice(record)}
          />
          {record.status === 'Sent' && (
            <Button 
              type="text" 
              style={{ color: '#52c41a' }}
              onClick={() => handleMarkPaid(record)}
            >
              Mark Paid
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: 'Payment ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code>PAY-{id.padStart(3, '0')}</Text>
      ),
    },
    {
      title: 'Invoice',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        return invoice ? invoice.invoiceNumber : 'N/A';
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#e91e63' }}>${amount.toFixed(2)}</Text>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => (
        <Tag color="blue">{method}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'green' : status === 'Pending' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  const handleViewInvoice = (invoice: Invoice) => {
    Modal.info({
      title: `Invoice ${invoice.invoiceNumber}`,
      width: 800,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="Patient Information">
                <p><strong>Name:</strong> {invoice.patientName}</p>
                <p><strong>Email:</strong> {invoice.patientEmail}</p>
                <p><strong>Issue Date:</strong> {invoice.issueDate}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate}</p>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Payment Information">
                <p><strong>Subtotal:</strong> ${invoice.subtotal.toFixed(2)}</p>
                <p><strong>Tax:</strong> ${invoice.tax.toFixed(2)}</p>
                <p><strong>Discount:</strong> ${invoice.discount.toFixed(2)}</p>
                <p><strong>Total:</strong> <Text strong style={{ color: '#e91e63' }}>${invoice.total.toFixed(2)}</Text></p>
              </Card>
            </Col>
          </Row>
          <Card size="small" title="Services" style={{ marginTop: '16px' }}>
            <Table
              size="small"
              dataSource={invoice.services}
              rowKey="id"
              pagination={false}
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Department', dataIndex: 'department', key: 'department' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
                { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: (price: number) => `$${price}` },
                { title: 'Total', dataIndex: 'total', key: 'total', render: (total: number) => `$${total}` }
              ]}
            />
          </Card>
        </div>
      ),
    });
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue(invoice);
    setIsModalVisible(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    message.success(`Printing invoice ${invoice.invoiceNumber}`);
  };

  const handleMarkPaid = (invoice: Invoice) => {
    Modal.confirm({
      title: 'Mark Invoice as Paid',
      content: `Mark invoice ${invoice.invoiceNumber} as paid?`,
      onOk: () => {
        setInvoices(invoices.map(inv => 
          inv.id === invoice.id 
            ? { ...inv, status: 'Paid' as const, paidDate: new Date().toISOString().split('T')[0] }
            : inv
        ));
        message.success('Invoice marked as paid');
      },
    });
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Calculate statistics
  const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'Sent').reduce((sum, inv) => sum + inv.total, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
  const totalInvoices = invoices.length;
  const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          <DollarOutlined /> Billing Management
        </Title>
        <Text type="secondary">
          Manage invoices, payments, and billing operations
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={pendingAmount}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Overdue Amount"
              value={overdueAmount}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">Collection Rate</Text>
              </div>
              <Progress
                type="circle"
                percent={collectionRate}
                size={80}
                strokeColor="#e91e63"
                format={percent => `${percent?.toFixed(0)}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><FileTextOutlined />Invoices</span>} key="invoices">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search invoices..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Status</Option>
                  <Option value="draft">Draft</Option>
                  <Option value="sent">Sent</Option>
                  <Option value="paid">Paid</Option>
                  <Option value="overdue">Overdue</Option>
                </Select>
                <RangePicker />
              </Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddInvoice}
                style={{ background: '#e91e63', borderColor: '#e91e63' }}
              >
                Create Invoice
              </Button>
            </div>
            
            <Table
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} invoices`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><CreditCardOutlined />Payments</span>} key="payments">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search payments..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Methods</Option>
                  <Option value="cash">Cash</Option>
                  <Option value="card">Credit Card</Option>
                  <Option value="insurance">Insurance</Option>
                </Select>
                <RangePicker />
              </Space>
              <Button 
                type="primary"
                style={{ background: '#e91e63', borderColor: '#e91e63' }}
              >
                Record Payment
              </Button>
            </div>
            
            <Table
              columns={paymentColumns}
              dataSource={payments}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} payments`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Invoice Modal */}
      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" style={{ background: '#e91e63', borderColor: '#e91e63' }}>
            Save Invoice
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientName" label="Patient Name" rules={[{ required: true }]}>
                <Input placeholder="Enter patient name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientEmail" label="Patient Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Enter patient email" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Enter any notes or comments" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillingManagement;
