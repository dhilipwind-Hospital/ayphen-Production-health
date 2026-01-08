import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Space, Select, Row, Col, Statistic, Tooltip } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// Use a local API instance until the global one is properly set up
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

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

const MedicineList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [dosageFormFilter, setDosageFormFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would call the API here
      try {
        const response = await api.get('/pharmacy/medicines');
        setMedicines(response.data.medicines || []);
      } catch (error) {
        console.error('API error, using fallback data:', error);
        
        // Mock data for global medicines
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
            isActive: true,
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
            isActive: true,
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
            isActive: true,
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
            isActive: true,
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
            isActive: true,
            description: 'Bronchodilator',
            sideEffects: 'Tremor, headache',
            contraindications: 'Hypersensitivity',
            storageInstructions: 'Store below 30°C'
          },
          {
            id: '6',
            name: 'Lisinopril',
            genericName: 'Lisinopril',
            brandName: 'Zestril',
            manufacturer: 'AstraZeneca',
            category: 'Antihypertensive',
            dosageForm: 'Tablet',
            strength: '10mg',
            unitPrice: 0.8,
            sellingPrice: 1.5,
            batchNumber: 'BATCH007',
            manufactureDate: '2023-03-15',
            expiryDate: '2025-03-15',
            currentStock: 300,
            reorderLevel: 50,
            isActive: true,
            description: 'ACE inhibitor for hypertension',
            sideEffects: 'Dry cough, dizziness',
            contraindications: 'Pregnancy, history of angioedema',
            storageInstructions: 'Store at room temperature'
          },
          {
            id: '7',
            name: 'Omeprazole',
            genericName: 'Omeprazole',
            brandName: 'Prilosec',
            manufacturer: 'AstraZeneca',
            category: 'Proton Pump Inhibitor',
            dosageForm: 'Capsule',
            strength: '20mg',
            unitPrice: 0.9,
            sellingPrice: 1.8,
            batchNumber: 'BATCH008',
            manufactureDate: '2023-04-20',
            expiryDate: '2025-04-20',
            currentStock: 180,
            reorderLevel: 30,
            isActive: true,
            description: 'Reduces stomach acid production',
            sideEffects: 'Headache, nausea',
            contraindications: 'Hypersensitivity to PPIs',
            storageInstructions: 'Store below 25°C'
          },
          {
            id: '8',
            name: 'Amlodipine',
            genericName: 'Amlodipine',
            brandName: 'Norvasc',
            manufacturer: 'Pfizer',
            category: 'Calcium Channel Blocker',
            dosageForm: 'Tablet',
            strength: '5mg',
            unitPrice: 0.7,
            sellingPrice: 1.4,
            batchNumber: 'BATCH009',
            manufactureDate: '2023-05-10',
            expiryDate: '2025-05-10',
            currentStock: 220,
            reorderLevel: 40,
            isActive: true,
            description: 'Calcium channel blocker for hypertension',
            sideEffects: 'Edema, dizziness',
            contraindications: 'Severe hypotension',
            storageInstructions: 'Store at room temperature'
          },
          {
            id: '9',
            name: 'Sertraline',
            genericName: 'Sertraline',
            brandName: 'Zoloft',
            manufacturer: 'Pfizer',
            category: 'SSRI',
            dosageForm: 'Tablet',
            strength: '50mg',
            unitPrice: 1.1,
            sellingPrice: 2.2,
            batchNumber: 'BATCH010',
            manufactureDate: '2023-06-15',
            expiryDate: '2025-06-15',
            currentStock: 90,
            reorderLevel: 20,
            isActive: true,
            description: 'Antidepressant',
            sideEffects: 'Nausea, insomnia',
            contraindications: 'MAO inhibitors',
            storageInstructions: 'Store at room temperature'
          },
          {
            id: '10',
            name: 'Albuterol',
            genericName: 'Albuterol',
            brandName: 'ProAir',
            manufacturer: 'Teva',
            category: 'Bronchodilator',
            dosageForm: 'Inhaler',
            strength: '90mcg/dose',
            unitPrice: 4.5,
            sellingPrice: 7.5,
            batchNumber: 'BATCH011',
            manufactureDate: '2023-07-01',
            expiryDate: '2024-07-01',
            currentStock: 15,
            reorderLevel: 10,
            isActive: true,
            description: 'Short-acting bronchodilator',
            sideEffects: 'Tremor, nervousness',
            contraindications: 'Hypersensitivity',
            storageInstructions: 'Store below 25°C'
          }
        ];
        
        setMedicines(mockMedicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (medicine: Medicine) => {
    // Apply category filter
    if (categoryFilter && medicine.category !== categoryFilter) {
      return false;
    }
    
    // Apply dosage form filter
    if (dosageFormFilter && medicine.dosageForm !== dosageFormFilter) {
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

  const categories = [...new Set(medicines.map(med => med.category))];
  const dosageForms = [...new Set(medicines.map(med => med.dosageForm))];

  const lowStockCount = medicines.filter(med => med.currentStock <= med.reorderLevel).length;
  const expiringCount = medicines.filter(med => {
    const expiryDate = new Date(med.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  }).length;

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Medicine, b: Medicine) => a.name.localeCompare(b.name),
      render: (text: string, record: Medicine) => (
        <Tooltip title={record.description}>
          <span>{text}</span>
        </Tooltip>
      ),
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
      render: (text: number, record: Medicine) => (
        <span style={{ 
          color: record.currentStock <= record.reorderLevel ? '#cf1322' : 'inherit',
          fontWeight: record.currentStock <= record.reorderLevel ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
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
          <Button size="small" type="primary">
            View
          </Button>
          <Button size="small">
            Update Stock
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="medicine-list">
      <h1>Global Medicine Inventory</h1>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Medicines" 
              value={medicines.length} 
              prefix={<MedicineBoxOutlined />} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Low Stock Medicines" 
              value={lowStockCount} 
              valueStyle={{ color: lowStockCount > 0 ? '#cf1322' : 'inherit' }}
              prefix={<WarningOutlined />} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Expiring Soon" 
              value={expiringCount} 
              valueStyle={{ color: expiringCount > 0 ? '#fa8c16' : 'inherit' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search medicines"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          
          <Select
            placeholder="Filter by Category"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setCategoryFilter(value)}
            value={categoryFilter}
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          
          <Select
            placeholder="Filter by Dosage Form"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setDosageFormFilter(value)}
            value={dosageFormFilter}
          >
            {dosageForms.map(form => (
              <Option key={form} value={form}>{form}</Option>
            ))}
          </Select>
          
          <Select
            placeholder="Filter by Stock Status"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setStockFilter(value)}
            value={stockFilter}
          >
            <Option value="low">Low Stock</Option>
            <Option value="adequate">Adequate Stock</Option>
          </Select>
          
          <Button onClick={() => {
            setCategoryFilter(null);
            setDosageFormFilter(null);
            setStockFilter(null);
            setSearchText('');
          }}>
            Clear Filters
          </Button>
          
          <Button icon={<MedicineBoxOutlined />} type="primary">
            Add Medicine
          </Button>
        </Space>
        
        <Table
          columns={columns}
          dataSource={filteredMedicines}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          summary={(pageData) => {
            const totalStock = pageData.reduce((total, medicine) => total + medicine.currentStock, 0);
            
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}><strong>{totalStock}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={3}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default MedicineList;
