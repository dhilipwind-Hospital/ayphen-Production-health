import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, InputNumber, DatePicker, message, Tabs } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Moment } from 'moment';
import moment from 'moment';

// Use a local API instance until the global one is properly set up
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  manufacturer: string;
  category: string;
  dosageForm: string;
  strength: string;
  unitPrice: number;
  sellingPrice: number;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  storageInstructions?: string;
}

interface Transaction {
  id: string;
  medicine: {
    id: string;
    name: string;
  };
  transactionType: 'purchase' | 'sale' | 'return' | 'adjustment' | 'expired' | 'damaged';
  quantity: number;
  transactionDate: string;
  reference?: string;
  notes?: string;
  performedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('medicines');
  const [medicineModalVisible, setMedicineModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [medicineForm] = Form.useForm();
  const [transactionForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'medicines') {
      fetchMedicines();
    } else {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacy/medicines');
      setMedicines(response.data.medicines || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      message.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacy/inventory/transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const searchLower = searchText.toLowerCase();
    return medicine.name.toLowerCase().includes(searchLower) ||
           medicine.genericName.toLowerCase().includes(searchLower) ||
           medicine.category.toLowerCase().includes(searchLower) ||
           medicine.manufacturer.toLowerCase().includes(searchLower);
  });

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchText.toLowerCase();
    return transaction.medicine.name.toLowerCase().includes(searchLower) ||
           (transaction.notes || '').toLowerCase().includes(searchLower) ||
           transaction.transactionType.toLowerCase().includes(searchLower);
  });

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.currentStock <= medicine.reorderLevel) {
      return <Tag color="red">Low Stock</Tag>;
    }
    
    const today = new Date();
    const expiryDate = new Date(medicine.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    if (expiryDate <= threeMonthsFromNow) {
      return <Tag color="orange">Expiring Soon</Tag>;
    }
    
    return <Tag color="green">Adequate</Tag>;
  };

  const getTransactionTypeTag = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Tag color="green">Purchase</Tag>;
      case 'sale':
        return <Tag color="blue">Sale</Tag>;
      case 'return':
        return <Tag color="purple">Return</Tag>;
      case 'adjustment':
        return <Tag color="cyan">Adjustment</Tag>;
      case 'expired':
        return <Tag color="orange">Expired</Tag>;
      case 'damaged':
        return <Tag color="red">Damaged</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const showAddMedicineModal = () => {
    setModalMode('add');
    setSelectedMedicine(null);
    medicineForm.resetFields();
    setMedicineModalVisible(true);
  };

  const showEditMedicineModal = (medicine: Medicine) => {
    setModalMode('edit');
    setSelectedMedicine(medicine);
    
    medicineForm.setFieldsValue({
      ...medicine,
      manufactureDate: moment(medicine.manufactureDate),
      expiryDate: moment(medicine.expiryDate),
    });
    
    setMedicineModalVisible(true);
  };

  const showAddStockModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    
    transactionForm.setFieldsValue({
      medicineId: medicine.id,
      quantity: 0,
      transactionType: 'purchase',
      transactionDate: moment(),
    });
    
    setTransactionModalVisible(true);
  };

  const handleMedicineSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await medicineForm.validateFields();
      
      // Format dates
      const formattedValues = {
        ...values,
        manufactureDate: values.manufactureDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
      };
      
      if (modalMode === 'add') {
        await api.post('/pharmacy/medicines', formattedValues);
        message.success('Medicine added successfully');
      } else {
        await api.put(`/pharmacy/medicines/${selectedMedicine?.id}`, formattedValues);
        message.success('Medicine updated successfully');
      }
      
      setMedicineModalVisible(false);
      fetchMedicines();
    } catch (error) {
      console.error('Error submitting medicine:', error);
      message.error('Failed to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransactionSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await transactionForm.validateFields();
      
      // Format date
      const formattedValues = {
        ...values,
        transactionDate: values.transactionDate.format('YYYY-MM-DD'),
      };
      
      await api.post('/pharmacy/inventory/add-stock', formattedValues);
      message.success('Stock updated successfully');
      
      setTransactionModalVisible(false);
      fetchMedicines();
      if (activeTab === 'transactions') {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      message.error('Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const medicineColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Medicine, b: Medicine) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: Medicine, b: Medicine) => a.category.localeCompare(b.category),
    },
    {
      title: 'Dosage Form',
      dataIndex: 'dosageForm',
      key: 'dosageForm',
    },
    {
      title: 'Strength',
      dataIndex: 'strength',
      key: 'strength',
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      sorter: (a: Medicine, b: Medicine) => a.currentStock - b.currentStock,
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, medicine: Medicine) => getStockStatus(medicine),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, medicine: Medicine) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => showEditMedicineModal(medicine)}>
            Edit
          </Button>
          <Button size="small" type="primary" onClick={() => showAddStockModal(medicine)}>
            Add Stock
          </Button>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: 'Medicine',
      key: 'medicine',
      render: (text: string, record: Transaction) => record.medicine.name,
    },
    {
      title: 'Type',
      key: 'transactionType',
      render: (text: string, record: Transaction) => getTransactionTypeTag(record.transactionType),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Date',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: Transaction, b: Transaction) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
    },
    {
      title: 'Performed By',
      key: 'performedBy',
      render: (text: string, record: Transaction) => 
        record.performedBy ? `${record.performedBy.firstName} ${record.performedBy.lastName}` : 'N/A',
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  return (
    <div className="pharmacy-inventory">
      <h1>Inventory Management</h1>
      
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          {activeTab === 'medicines' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={showAddMedicineModal}>
              Add Medicine
            </Button>
          )}
          <Button onClick={activeTab === 'medicines' ? fetchMedicines : fetchTransactions}>
            Refresh
          </Button>
        </Space>
        
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane
            tab={
              <span>
                <PlusOutlined />
                Medicines
              </span>
            }
            key="medicines"
          >
            <Table
              columns={medicineColumns}
              dataSource={filteredMedicines}
              rowKey="id"
              loading={loading && activeTab === 'medicines'}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                Transaction History
              </span>
            }
            key="transactions"
          >
            <Table
              columns={transactionColumns}
              dataSource={filteredTransactions}
              rowKey="id"
              loading={loading && activeTab === 'transactions'}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Medicine Form Modal */}
      <Modal
        title={modalMode === 'add' ? 'Add Medicine' : 'Edit Medicine'}
        visible={medicineModalVisible}
        onCancel={() => setMedicineModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMedicineModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleMedicineSubmit}
          >
            Save
          </Button>,
        ]}
        width={800}
      >
        <Form form={medicineForm} layout="vertical">
          <Form.Item
            name="name"
            label="Medicine Name"
            rules={[{ required: true, message: 'Please enter medicine name' }]}
          >
            <Input />
          </Form.Item>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="genericName"
              label="Generic Name"
              rules={[{ required: true, message: 'Please enter generic name' }]}
              style={{ width: '100%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="brandName"
              label="Brand Name"
              rules={[{ required: true, message: 'Please enter brand name' }]}
              style={{ width: '100%' }}
            >
              <Input />
            </Form.Item>
          </Space>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="manufacturer"
              label="Manufacturer"
              rules={[{ required: true, message: 'Please enter manufacturer' }]}
              style={{ width: '100%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please enter category' }]}
              style={{ width: '100%' }}
            >
              <Select>
                <Option value="Analgesic">Analgesic</Option>
                <Option value="Antibiotic">Antibiotic</Option>
                <Option value="Antihypertensive">Antihypertensive</Option>
                <Option value="Antidiabetic">Antidiabetic</Option>
                <Option value="Statin">Statin</Option>
                <Option value="Bronchodilator">Bronchodilator</Option>
                <Option value="Proton Pump Inhibitor">Proton Pump Inhibitor</Option>
                <Option value="NSAID">NSAID</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Space>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="dosageForm"
              label="Dosage Form"
              rules={[{ required: true, message: 'Please enter dosage form' }]}
              style={{ width: '100%' }}
            >
              <Select>
                <Option value="Tablet">Tablet</Option>
                <Option value="Capsule">Capsule</Option>
                <Option value="Syrup">Syrup</Option>
                <Option value="Injection">Injection</Option>
                <Option value="Inhaler">Inhaler</Option>
                <Option value="Cream">Cream</Option>
                <Option value="Ointment">Ointment</Option>
                <Option value="Drops">Drops</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="strength"
              label="Strength"
              rules={[{ required: true, message: 'Please enter strength' }]}
              style={{ width: '100%' }}
            >
              <Input />
            </Form.Item>
          </Space>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="unitPrice"
              label="Unit Price"
              rules={[{ required: true, message: 'Please enter unit price' }]}
              style={{ width: '100%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} />
            </Form.Item>
            
            <Form.Item
              name="sellingPrice"
              label="Selling Price"
              rules={[{ required: true, message: 'Please enter selling price' }]}
              style={{ width: '100%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} />
            </Form.Item>
          </Space>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="currentStock"
              label="Current Stock"
              rules={[{ required: true, message: 'Please enter current stock' }]}
              style={{ width: '100%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            
            <Form.Item
              name="reorderLevel"
              label="Reorder Level"
              rules={[{ required: true, message: 'Please enter reorder level' }]}
              style={{ width: '100%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="batchNumber"
              label="Batch Number"
              rules={[{ required: true, message: 'Please enter batch number' }]}
              style={{ width: '100%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="manufactureDate"
              label="Manufacture Date"
              rules={[{ required: true, message: 'Please enter manufacture date' }]}
              style={{ width: '100%' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="expiryDate"
              label="Expiry Date"
              rules={[{ required: true, message: 'Please enter expiry date' }]}
              style={{ width: '100%' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="sideEffects"
            label="Side Effects"
          >
            <TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="contraindications"
            label="Contraindications"
          >
            <TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="storageInstructions"
            label="Storage Instructions"
          >
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Transaction Form Modal */}
      <Modal
        title="Add Stock"
        visible={transactionModalVisible}
        onCancel={() => setTransactionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTransactionModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleTransactionSubmit}
          >
            Save
          </Button>,
        ]}
      >
        {selectedMedicine && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Medicine:</strong> {selectedMedicine.name}</p>
            <p><strong>Current Stock:</strong> {selectedMedicine.currentStock}</p>
          </div>
        )}
        
        <Form form={transactionForm} layout="vertical">
          <Form.Item
            name="medicineId"
            hidden
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          
          <Form.Item
            name="batchNumber"
            label="Batch Number"
            rules={[{ required: true, message: 'Please enter batch number' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="expiryDate"
            label="Expiry Date"
            rules={[{ required: true, message: 'Please enter expiry date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="transactionDate"
            label="Transaction Date"
            rules={[{ required: true, message: 'Please enter transaction date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="unitPrice"
            label="Unit Price"
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;
