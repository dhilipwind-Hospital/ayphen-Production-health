import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Input, Space, Alert } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Use a local API instance until the global one is properly set up
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

const PharmacyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, we would fetch data from the API
        // For now, use mock data
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
            currentStock: 1000,
            reorderLevel: 200,
            expiryDate: '2027-01-01'
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
            currentStock: 50,
            reorderLevel: 100,
            expiryDate: '2026-02-01'
          },
          {
            id: '3',
            name: 'Lisinopril',
            genericName: 'Lisinopril',
            brandName: 'Zestril',
            manufacturer: 'AstraZeneca',
            category: 'Antihypertensive',
            dosageForm: 'Tablet',
            strength: '10mg',
            currentStock: 300,
            reorderLevel: 50,
            expiryDate: '2027-03-01'
          },
          {
            id: '4',
            name: 'Metformin',
            genericName: 'Metformin',
            brandName: 'Glucophage',
            manufacturer: 'Merck',
            category: 'Antidiabetic',
            dosageForm: 'Tablet',
            strength: '500mg',
            currentStock: 40,
            reorderLevel: 80,
            expiryDate: '2027-04-01'
          },
          {
            id: '5',
            name: 'Atorvastatin',
            genericName: 'Atorvastatin',
            brandName: 'Lipitor',
            manufacturer: 'Pfizer',
            category: 'Statin',
            dosageForm: 'Tablet',
            strength: '20mg',
            currentStock: 250,
            reorderLevel: 50,
            expiryDate: '2027-05-01'
          }
        ];
        
        setMedicines(mockMedicines);

        // Calculate low stock count
        const lowStockItems = mockMedicines.filter(med => med.currentStock <= med.reorderLevel);
        setLowStockCount(lowStockItems.length);

        // Calculate expiring medicines (those expiring in the next 3 months)
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);
        
        const expiringItems = mockMedicines.filter(med => {
          const expiryDate = new Date(med.expiryDate);
          return expiryDate <= threeMonthsFromNow;
        });
        setExpiringCount(expiringItems.length);

      } catch (err) {
        console.error('Error fetching pharmacy dashboard data:', err);
        setError('Failed to load pharmacy data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredMedicines = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(searchText.toLowerCase()) ||
    medicine.genericName.toLowerCase().includes(searchText.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const columns = [
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
          <Button size="small" type="primary">View</Button>
          <Button size="small">Update Stock</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="pharmacy-dashboard">
      <h1>Pharmacy Dashboard</h1>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={medicines.length}
              prefix={<MedicineBoxOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Low Stock Medicines"
              value={lowStockCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={expiringCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Medicine Inventory" extra={
        <Space>
          <Input
            placeholder="Search medicines"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary">Add Medicine</Button>
          <Button type="default" href="/pharmacy/medicines">View All Medicines</Button>
        </Space>
      }>
        <Table
          columns={columns}
          dataSource={filteredMedicines}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default PharmacyDashboard;
