import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Select, InputNumber, DatePicker, message, Tabs, Row, Col, Descriptions } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, HistoryOutlined, FilterOutlined, ExportOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import dayjs from 'dayjs';

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

const InventoryEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('medicines');
  const [medicineModalVisible, setMedicineModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [medicineForm] = Form.useForm();
  const [transactionForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterForm] = Form.useForm();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);

  useEffect(() => {
    // Mock data for medicines
    const mockMedicines = [
      {
        id: '1',
        name: 'Paracetamol',
        genericName: 'Paracetamol',
        brandName: 'Calpol',
        manufacturer: 'GSK',
        category: 'Analgesic',
        dosageForm: 'Tablet',
        strength: '500mg',
        unitPrice: 0.5,
        sellingPrice: 1.0,
        batchNumber: 'BATCH001',
        manufactureDate: '2023-01-01',
        expiryDate: '2025-01-01',
        currentStock: 1000,
        reorderLevel: 200,
        description: 'Pain reliever and fever reducer',
        sideEffects: 'Rare: allergic reactions',
        contraindications: 'Liver disease',
        storageInstructions: 'Store below 30°C'
      },
      {
        id: '2',
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        manufacturer: 'GSK',
        category: 'Antibiotic',
        dosageForm: 'Capsule',
        strength: '250mg',
        unitPrice: 1.0,
        sellingPrice: 2.0,
        batchNumber: 'BATCH002',
        manufactureDate: '2023-02-01',
        expiryDate: '2024-02-01',
        currentStock: 50,
        reorderLevel: 100,
        description: 'Antibiotic used to treat bacterial infections',
        sideEffects: 'Diarrhea, rash, nausea',
        contraindications: 'Penicillin allergy',
        storageInstructions: 'Store below 25°C'
      },
      {
        id: '3',
        name: 'Metformin',
        genericName: 'Metformin',
        brandName: 'Glucophage',
        manufacturer: 'Merck',
        category: 'Antidiabetic',
        dosageForm: 'Tablet',
        strength: '500mg',
        unitPrice: 0.6,
        sellingPrice: 1.2,
        batchNumber: 'BATCH004',
        manufactureDate: '2023-04-01',
        expiryDate: '2025-04-01',
        currentStock: 40,
        reorderLevel: 80,
        description: 'Oral diabetes medicine',
        sideEffects: 'Nausea, diarrhea',
        contraindications: 'Kidney disease',
        storageInstructions: 'Store at room temperature'
      },
      {
        id: '4',
        name: 'Atorvastatin',
        genericName: 'Atorvastatin',
        brandName: 'Lipitor',
        manufacturer: 'Pfizer',
        category: 'Statin',
        dosageForm: 'Tablet',
        strength: '20mg',
        unitPrice: 1.2,
        sellingPrice: 2.5,
        batchNumber: 'BATCH005',
        manufactureDate: '2023-05-01',
        expiryDate: '2025-05-01',
        currentStock: 250,
        reorderLevel: 50,
        description: 'Statin medication',
        sideEffects: 'Muscle pain',
        contraindications: 'Liver disease',
        storageInstructions: 'Store at room temperature'
      },
      {
        id: '5',
        name: 'Salbutamol',
        genericName: 'Salbutamol',
        brandName: 'Ventolin',
        manufacturer: 'GSK',
        category: 'Bronchodilator',
        dosageForm: 'Inhaler',
        strength: '100mcg/dose',
        unitPrice: 5.0,
        sellingPrice: 8.0,
        batchNumber: 'BATCH006',
        manufactureDate: '2023-06-01',
        expiryDate: '2024-06-01',
        currentStock: 20,
        reorderLevel: 20,
        description: 'Bronchodilator',
        sideEffects: 'Tremor, headache',
        contraindications: 'Hypersensitivity',
        storageInstructions: 'Store below 30°C'
      }
    ];
    
    setMedicines(mockMedicines);
    
    // Mock data for transactions
    const mockTransactions = [
      {
        id: '1',
        medicine: { id: '1', name: 'Paracetamol' },
        transactionType: 'purchase',
        quantity: 500,
        transactionDate: '2023-09-15',
        reference: 'PO-2023-001',
        notes: 'Initial stock purchase',
        performedBy: { id: '1', firstName: 'Pharmacy', lastName: 'Manager' }
      },
      {
        id: '2',
        medicine: { id: '2', name: 'Amoxicillin' },
        transactionType: 'purchase',
        quantity: 200,
        transactionDate: '2023-09-16',
        reference: 'PO-2023-002',
        notes: 'Regular restock',
        performedBy: { id: '1', firstName: 'Pharmacy', lastName: 'Manager' }
      },
      {
        id: '3',
        medicine: { id: '1', name: 'Paracetamol' },
        transactionType: 'sale',
        quantity: 50,
        transactionDate: '2023-09-20',
        reference: 'RX-2023-123',
        notes: 'Prescription dispensing',
        performedBy: { id: '1', firstName: 'Pharmacy', lastName: 'Manager' }
      },
      {
        id: '4',
        medicine: { id: '3', name: 'Metformin' },
        transactionType: 'adjustment',
        quantity: -10,
        transactionDate: '2023-09-22',
        reference: 'ADJ-2023-001',
        notes: 'Inventory count adjustment',
        performedBy: { id: '1', firstName: 'Pharmacy', lastName: 'Manager' }
      },
      {
        id: '5',
        medicine: { id: '2', name: 'Amoxicillin' },
        transactionType: 'expired',
        quantity: -20,
        transactionDate: '2023-09-25',
        reference: 'EXP-2023-001',
        notes: 'Expired stock removal',
        performedBy: { id: '1', firstName: 'Pharmacy', lastName: 'Manager' }
      }
    ];
    
    setTransactions(mockTransactions);
    setLoading(false);
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const applyFilters = (medicine: any) => {
    // Apply category filter
    if (categoryFilter && medicine.category !== categoryFilter) {
      return false;
    }
    
    // Apply stock filter
    if (stockFilter) {
      if (stockFilter === 'low' && medicine.currentStock > medicine.reorderLevel) {
        return false;
      }
      if (stockFilter === 'adequate' && medicine.currentStock <= medicine.reorderLevel) {
        return false;
      }
    }
    
    // Apply search text
    const searchLower = searchText.toLowerCase();
    return medicine.name.toLowerCase().includes(searchLower) ||
           medicine.genericName.toLowerCase().includes(searchLower) ||
           medicine.category.toLowerCase().includes(searchLower) ||
           medicine.manufacturer.toLowerCase().includes(searchLower);
  };

  const filteredMedicines = medicines.filter(applyFilters);

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchText.toLowerCase();
    return transaction.medicine.name.toLowerCase().includes(searchLower) ||
           (transaction.notes || '').toLowerCase().includes(searchLower) ||
           transaction.transactionType.toLowerCase().includes(searchLower);
  });

  const getStockStatus = (medicine: any) => {
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

  const showEditMedicineModal = (medicine: any) => {
    setModalMode('edit');
    setSelectedMedicine(medicine);
    
    medicineForm.setFieldsValue({
      ...medicine,
      manufactureDate: dayjs(medicine.manufactureDate),
      expiryDate: dayjs(medicine.expiryDate),
    });
    
    setMedicineModalVisible(true);
  };

  const showAddStockModal = (medicine: any) => {
    setSelectedMedicine(medicine);
    
    // Initialize form with default values
    transactionForm.setFieldsValue({
      medicineId: medicine.id,
      quantity: 10, // Default to a reasonable quantity
      transactionType: 'purchase',
      transactionDate: dayjs(),
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      expiryDate: dayjs().add(2, 'year'), // Default expiry date 2 years from now
      unitPrice: medicine.unitPrice || 0
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
      
      // In a real app, we would call the API here
      // For now, just update the local state
      if (modalMode === 'add') {
        // Generate a unique ID for the new medicine
        const newId = `MED-${Date.now().toString().slice(-6)}`;
        
        const newMedicine = {
          ...formattedValues,
          id: newId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add the new medicine to the list
        setMedicines([...medicines, newMedicine]);
        
        // Show success message with more details
        message.success(`Medicine "${values.name}" added successfully`);
        
        // Log the new medicine for debugging
        console.log('Added new medicine:', newMedicine);
        
        // Reset the form for next use
        medicineForm.resetFields();
      } else if (selectedMedicine) {
        // Update existing medicine
        const updatedMedicines = medicines.map(med => 
          med.id === selectedMedicine.id ? { 
            ...med, 
            ...formattedValues,
            updatedAt: new Date().toISOString() 
          } : med
        );
        
        setMedicines(updatedMedicines);
        message.success(`Medicine "${values.name}" updated successfully`);
      }
      
      setMedicineModalVisible(false);
    } catch (error) {
      console.error('Error submitting medicine:', error);
      message.error('Failed to save medicine: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransactionSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await transactionForm.validateFields();
      
      // Format dates
      const formattedValues = {
        ...values,
        transactionDate: values.transactionDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
      };
      
      // In a real app, we would call the API here
      // For now, just update the local state
      if (selectedMedicine) {
        // Calculate new stock level
        const newStockLevel = selectedMedicine.currentStock + Number(formattedValues.quantity);
        
        // Update medicine stock
        const updatedMedicines = medicines.map(med => {
          if (med.id === selectedMedicine.id) {
            return {
              ...med,
              currentStock: newStockLevel
            };
          }
          return med;
        });
        
        // Add transaction
        const newTransaction = {
          id: String(transactions.length + 1),
          medicine: { id: selectedMedicine.id, name: selectedMedicine.name },
          transactionType: formattedValues.transactionType || 'purchase',
          quantity: formattedValues.quantity,
          transactionDate: formattedValues.transactionDate,
          reference: formattedValues.reference || '',
          notes: formattedValues.notes || '',
          performedBy: { id: user?.id || '1', firstName: user?.firstName || 'Pharmacy', lastName: user?.lastName || 'Manager' }
        };
        setTransactions([...transactions, newTransaction]);
        
        message.success('Stock updated successfully');
      }
      
      setTransactionModalVisible(false);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      message.error('Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const showFilterModal = () => {
    filterForm.setFieldsValue({
      category: categoryFilter,
      stockStatus: stockFilter
    });
    setFilterModalVisible(true);
  };

  const handleFilterSubmit = async () => {
    try {
      const values = await filterForm.validateFields();
      setCategoryFilter(values.category);
      setStockFilter(values.stockStatus);
      setFilterModalVisible(false);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const clearFilters = () => {
    setCategoryFilter(null);
    setStockFilter(null);
    filterForm.resetFields();
    setFilterModalVisible(false);
  };

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewMedicine, setViewMedicine] = useState<any | null>(null);

  const showViewMedicineModal = (medicine: any) => {
    setViewMedicine(medicine);
    setViewModalVisible(true);
  };

  const medicineColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: any, b: any) => a.category.localeCompare(b.category),
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
      sorter: (a: any, b: any) => a.currentStock - b.currentStock,
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, medicine: any) => getStockStatus(medicine),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, medicine: any) => (
        <Space size="small">
          <Button size="small" type="default" onClick={() => showViewMedicineModal(medicine)}>
            View
          </Button>
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
      render: (text: string, record: any) => record.medicine.name,
    },
    {
      title: 'Type',
      key: 'transactionType',
      render: (text: string, record: any) => getTransactionTypeTag(record.transactionType),
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
      sorter: (a: any, b: any) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
    },
    {
      title: 'Performed By',
      key: 'performedBy',
      render: (text: string, record: any) => 
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

  const categories = [...new Set(medicines.map(med => med.category))];

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
            <>
              <Button icon={<FilterOutlined />} onClick={showFilterModal}>
                Filter
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showAddMedicineModal}
                size="middle"
                style={{ fontWeight: 'bold' }}
              >
                Add New Medicine
              </Button>
              <Button icon={<ExportOutlined />}>
                Export
              </Button>
            </>
          )}
        </Space>
        
        {(categoryFilter || stockFilter) && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>Filters:</span>
              {categoryFilter && (
                <Tag closable onClose={() => setCategoryFilter(null)}>
                  Category: {categoryFilter}
                </Tag>
              )}
              {stockFilter && (
                <Tag closable onClose={() => setStockFilter(null)}>
                  Stock: {stockFilter === 'low' ? 'Low Stock' : 'Adequate Stock'}
                </Tag>
              )}
              <Button size="small" onClick={clearFilters}>Clear All</Button>
            </Space>
          </div>
        )}
        
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
        title={modalMode === 'add' ? 'Add New Medicine' : 'Edit Medicine'}
        open={medicineModalVisible}
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
            icon={modalMode === 'add' ? <PlusOutlined /> : <EditOutlined />}
          >
            {modalMode === 'add' ? 'Add Medicine' : 'Save Changes'}
          </Button>,
        ]}
        width={800}
        maskClosable={false}
        destroyOnClose={true}
        centered={true}
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
        open={transactionModalVisible}
        onCancel={() => setTransactionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTransactionModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<PlusOutlined />}
            loading={submitting}
            onClick={handleTransactionSubmit}
          >
            Add Stock
          </Button>,
        ]}
        width={600}
        maskClosable={false}
        destroyOnClose={true}
        centered={true}
      >
        {selectedMedicine && (
          <div style={{ marginBottom: 24, background: '#f9f9f9', padding: 16, borderRadius: 8, border: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Medicine Information</h3>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>Name:</strong> {selectedMedicine.name}</p>
                <p><strong>Category:</strong> {selectedMedicine.category}</p>
                <p><strong>Dosage Form:</strong> {selectedMedicine.dosageForm}</p>
              </Col>
              <Col span={12}>
                <p><strong>Current Stock:</strong> <span style={{ 
                  fontWeight: 'bold', 
                  color: selectedMedicine.currentStock <= selectedMedicine.reorderLevel ? '#cf1322' : '#3f8600' 
                }}>{selectedMedicine.currentStock}</span></p>
                <p><strong>Reorder Level:</strong> {selectedMedicine.reorderLevel}</p>
                <p><strong>Strength:</strong> {selectedMedicine.strength}</p>
              </Col>
            </Row>
          </div>
        )}
        
        <Form form={transactionForm} layout="vertical">
          <Form.Item
            name="medicineId"
            hidden
          >
            <Input />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity to Add"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="unitPrice"
                label="Unit Purchase Price"
                rules={[{ required: true, message: 'Please enter unit price' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0} 
                  step={0.01} 
                  precision={2}
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="batchNumber"
                label="Batch Number"
                rules={[{ required: true, message: 'Please enter batch number' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                rules={[{ required: true, message: 'Please enter expiry date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transactionDate"
                label="Purchase Date"
                rules={[{ required: true, message: 'Please enter purchase date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="supplier"
                label="Supplier"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Enter any additional information about this stock addition" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* View Medicine Modal */}
      <Modal
        title="Medicine Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
        centered={true}
      >
        {viewMedicine && (
          <div>
            <Card bordered={false} className="medicine-details-card">
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <h2 style={{ margin: '0 0 16px 0', color: '#1890ff' }}>{viewMedicine.name}</h2>
                  <Tag color="blue">{viewMedicine.category}</Tag>
                  <Tag color="green">{viewMedicine.dosageForm}</Tag>
                  <Tag color="purple">{viewMedicine.strength}</Tag>
                </Col>
                
                <Col span={12}>
                  <Descriptions title="Basic Information" column={1} bordered size="small">
                    <Descriptions.Item label="Generic Name">{viewMedicine.genericName}</Descriptions.Item>
                    <Descriptions.Item label="Brand Name">{viewMedicine.brandName}</Descriptions.Item>
                    <Descriptions.Item label="Manufacturer">{viewMedicine.manufacturer}</Descriptions.Item>
                  </Descriptions>
                </Col>
                
                <Col span={12}>
                  <Descriptions title="Inventory Status" column={1} bordered size="small">
                    <Descriptions.Item label="Current Stock">
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: viewMedicine.currentStock <= viewMedicine.reorderLevel ? '#cf1322' : '#3f8600' 
                      }}>
                        {viewMedicine.currentStock}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Reorder Level">{viewMedicine.reorderLevel}</Descriptions.Item>
                    <Descriptions.Item label="Status">{getStockStatus(viewMedicine)}</Descriptions.Item>
                  </Descriptions>
                </Col>
                
                <Col span={12}>
                  <Descriptions title="Pricing" column={1} bordered size="small">
                    <Descriptions.Item label="Unit Price">${viewMedicine.unitPrice?.toFixed(2) || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Selling Price">${viewMedicine.sellingPrice?.toFixed(2) || 'N/A'}</Descriptions.Item>
                  </Descriptions>
                </Col>
                
                <Col span={12}>
                  <Descriptions title="Batch Information" column={1} bordered size="small">
                    <Descriptions.Item label="Batch Number">{viewMedicine.batchNumber || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Manufacture Date">
                      {viewMedicine.manufactureDate ? new Date(viewMedicine.manufactureDate).toLocaleDateString() : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expiry Date">
                      {viewMedicine.expiryDate ? new Date(viewMedicine.expiryDate).toLocaleDateString() : 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                
                <Col span={24}>
                  <Descriptions title="Additional Information" column={1} bordered size="small">
                    <Descriptions.Item label="Description">{viewMedicine.description || 'No description available'}</Descriptions.Item>
                    <Descriptions.Item label="Side Effects">{viewMedicine.sideEffects || 'No side effects listed'}</Descriptions.Item>
                    <Descriptions.Item label="Contraindications">{viewMedicine.contraindications || 'No contraindications listed'}</Descriptions.Item>
                    <Descriptions.Item label="Storage Instructions">{viewMedicine.storageInstructions || 'No storage instructions available'}</Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryEnhanced;
