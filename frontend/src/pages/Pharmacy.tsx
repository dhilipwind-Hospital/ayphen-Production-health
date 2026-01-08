import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Input, Space, Alert, Tabs } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, WarningOutlined, ClockCircleOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const Pharmacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // Mock data for medicines
    const mockMedicines = [
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
        expiryDate: '2027-01-01'
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
        expiryDate: '2026-02-01'
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
        expiryDate: '2027-04-01'
      }
    ];
    
    setMedicines(mockMedicines);
    setLoading(false);
  }, []);

  const getStockStatus = (medicine: any) => {
    if (medicine.currentStock <= medicine.reorderLevel) {
      return <Tag color="red">Low Stock</Tag>;
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
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, medicine: any) => getStockStatus(medicine),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space size="small">
          <Button size="small" type="primary">View</Button>
          <Button size="small">Update Stock</Button>
        </Space>
      ),
    },
  ];

  const filteredMedicines = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(searchText.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const lowStockCount = medicines.filter(med => med.currentStock <= med.reorderLevel).length;
  const totalMedicines = medicines.length;

  return (
    <div>
      <h1>Pharmacy Management</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={<span><MedicineBoxOutlined /> Dashboard</span>} 
          key="dashboard"
        />
        <TabPane 
          tab={<span><SearchOutlined /> Inventory</span>} 
          key="inventory"
        />
        <TabPane 
          tab={<span><FileTextOutlined /> Prescriptions</span>} 
          key="prescriptions"
        />
        <TabPane 
          tab={<span><BarChartOutlined /> Reports</span>} 
          key="reports"
        />
      </Tabs>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16, marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={totalMedicines}
              prefix={<MedicineBoxOutlined />}
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
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
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

export default Pharmacy;
