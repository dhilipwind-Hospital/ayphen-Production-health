import React, { useState, useEffect } from 'react';
import { Table, Input, Card, Tag, Space, Button, Tooltip } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

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
  category: string;
  dosageForm: string;
  strength: string;
  currentStock: number;
  reorderLevel: number;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
}

interface MedicineListProps {
  onSelectMedicine?: (medicine: Medicine) => void;
  selectable?: boolean;
}

const MedicineList: React.FC<MedicineListProps> = ({ onSelectMedicine, selectable = false }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      // In a real app, we would call the API here
      // const response = await api.get('/pharmacy/medicines');
      // setMedicines(response.data.medicines || []);
      
      // Mock data for now
      setMedicines([
        {
          id: '1',
          name: 'Paracetamol',
          genericName: 'Paracetamol',
          brandName: 'Calpol',
          category: 'Analgesic',
          dosageForm: 'Tablet',
          strength: '500mg',
          currentStock: 1000,
          reorderLevel: 200,
          description: 'Pain reliever and fever reducer',
          sideEffects: 'Rare: allergic reactions',
          contraindications: 'Liver disease'
        },
        {
          id: '2',
          name: 'Amoxicillin',
          genericName: 'Amoxicillin',
          brandName: 'Amoxil',
          category: 'Antibiotic',
          dosageForm: 'Capsule',
          strength: '250mg',
          currentStock: 50,
          reorderLevel: 100,
          description: 'Antibiotic used to treat bacterial infections',
          sideEffects: 'Diarrhea, rash, nausea',
          contraindications: 'Penicillin allergy'
        },
        {
          id: '3',
          name: 'Metformin',
          genericName: 'Metformin',
          brandName: 'Glucophage',
          category: 'Antidiabetic',
          dosageForm: 'Tablet',
          strength: '500mg',
          currentStock: 40,
          reorderLevel: 80,
          description: 'Oral diabetes medicine',
          sideEffects: 'Nausea, diarrhea',
          contraindications: 'Kidney disease'
        },
        {
          id: '4',
          name: 'Atorvastatin',
          genericName: 'Atorvastatin',
          brandName: 'Lipitor',
          category: 'Statin',
          dosageForm: 'Tablet',
          strength: '20mg',
          currentStock: 250,
          reorderLevel: 50,
          description: 'Statin medication',
          sideEffects: 'Muscle pain',
          contraindications: 'Liver disease'
        },
        {
          id: '5',
          name: 'Salbutamol',
          genericName: 'Salbutamol',
          brandName: 'Ventolin',
          category: 'Bronchodilator',
          dosageForm: 'Inhaler',
          strength: '100mcg/dose',
          currentStock: 20,
          reorderLevel: 20,
          description: 'Bronchodilator',
          sideEffects: 'Tremor, headache',
          contraindications: 'Hypersensitivity'
        },
        {
          id: '6',
          name: 'Lisinopril',
          genericName: 'Lisinopril',
          brandName: 'Zestril',
          category: 'ACE Inhibitor',
          dosageForm: 'Tablet',
          strength: '10mg',
          currentStock: 300,
          reorderLevel: 50,
          description: 'ACE inhibitor for hypertension',
          sideEffects: 'Dry cough, dizziness',
          contraindications: 'Pregnancy, history of angioedema'
        },
        {
          id: '7',
          name: 'Omeprazole',
          genericName: 'Omeprazole',
          brandName: 'Prilosec',
          category: 'Proton Pump Inhibitor',
          dosageForm: 'Capsule',
          strength: '20mg',
          currentStock: 180,
          reorderLevel: 30,
          description: 'Reduces stomach acid production',
          sideEffects: 'Headache, nausea',
          contraindications: 'Hypersensitivity to PPIs'
        },
        {
          id: '8',
          name: 'Amlodipine',
          genericName: 'Amlodipine',
          brandName: 'Norvasc',
          category: 'Calcium Channel Blocker',
          dosageForm: 'Tablet',
          strength: '5mg',
          currentStock: 220,
          reorderLevel: 40,
          description: 'Calcium channel blocker for hypertension',
          sideEffects: 'Edema, dizziness',
          contraindications: 'Severe hypotension'
        },
        {
          id: '9',
          name: 'Sertraline',
          genericName: 'Sertraline',
          brandName: 'Zoloft',
          category: 'SSRI',
          dosageForm: 'Tablet',
          strength: '50mg',
          currentStock: 90,
          reorderLevel: 20,
          description: 'Antidepressant',
          sideEffects: 'Nausea, insomnia',
          contraindications: 'MAO inhibitors'
        },
        {
          id: '10',
          name: 'Albuterol',
          genericName: 'Albuterol',
          brandName: 'ProAir',
          category: 'Bronchodilator',
          dosageForm: 'Inhaler',
          strength: '90mcg/dose',
          currentStock: 15,
          reorderLevel: 10,
          description: 'Short-acting bronchodilator',
          sideEffects: 'Tremor, nervousness',
          contraindications: 'Hypersensitivity'
        }
      ]);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.currentStock <= medicine.reorderLevel) {
      return <Tag color="red">Low Stock</Tag>;
    }
    return <Tag color="green">In Stock</Tag>;
  };

  const filteredMedicines = medicines.filter(medicine => {
    const searchLower = searchText.toLowerCase();
    return medicine.name.toLowerCase().includes(searchLower) ||
           medicine.genericName.toLowerCase().includes(searchLower) ||
           medicine.category.toLowerCase().includes(searchLower) ||
           medicine.dosageForm.toLowerCase().includes(searchLower);
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Medicine, b: Medicine) => a.name.localeCompare(b.name),
      render: (text: string, record: Medicine) => (
        <Space>
          {text}
          <Tooltip title={record.description}>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Generic Name',
      dataIndex: 'genericName',
      key: 'genericName',
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
      title: 'Stock Status',
      key: 'stockStatus',
      render: (text: string, medicine: Medicine) => (
        <Space>
          {getStockStatus(medicine)}
          <span>{medicine.currentStock} available</span>
        </Space>
      ),
    }
  ];

  // Add action column if selectable
  if (selectable && onSelectMedicine) {
    columns.push({
      title: 'Action',
      key: 'action',
      render: (text: string, record: Medicine) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => onSelectMedicine(record)}
          disabled={record.currentStock <= 0}
        >
          Select
        </Button>
      ),
    } as any);
  }

  return (
    <Card title="Medicine List" className="medicine-list">
      <Input
        placeholder="Search medicines"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />
      
      <Table
        columns={columns}
        dataSource={filteredMedicines}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />
    </Card>
  );
};

export default MedicineList;
