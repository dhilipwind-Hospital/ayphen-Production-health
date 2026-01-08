import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Space, Select, Row, Col, Statistic, Tabs, Radio, Divider } from 'antd';
import { DownloadOutlined, PieChartOutlined, BarChartOutlined, LineChartOutlined, TableOutlined, DollarOutlined, MedicineBoxOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
const { RangePicker } = DatePicker;

const ReportsEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(30, 'day'), dayjs()]);
  const [reportType, setReportType] = useState<string>('table');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [consumptionData, setConsumptionData] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for inventory report
    const mockInventoryData = [
      {
        id: '1',
        name: 'Paracetamol',
        category: 'Analgesic',
        currentStock: 1000,
        reorderLevel: 200,
        expiryDate: '2025-01-01',
        value: 1000 * 0.5, // currentStock * unitPrice
        status: 'Adequate'
      },
      {
        id: '2',
        name: 'Amoxicillin',
        category: 'Antibiotic',
        currentStock: 50,
        reorderLevel: 100,
        expiryDate: '2024-02-01',
        value: 50 * 1.0,
        status: 'Low Stock'
      },
      {
        id: '3',
        name: 'Metformin',
        category: 'Antidiabetic',
        currentStock: 40,
        reorderLevel: 80,
        expiryDate: '2025-04-01',
        value: 40 * 0.6,
        status: 'Low Stock'
      },
      {
        id: '4',
        name: 'Atorvastatin',
        category: 'Statin',
        currentStock: 250,
        reorderLevel: 50,
        expiryDate: '2025-05-01',
        value: 250 * 1.2,
        status: 'Adequate'
      },
      {
        id: '5',
        name: 'Salbutamol',
        category: 'Bronchodilator',
        currentStock: 20,
        reorderLevel: 20,
        expiryDate: '2024-06-01',
        value: 20 * 5.0,
        status: 'Low Stock'
      }
    ];
    
    // Mock data for consumption report
    const mockConsumptionData = [
      {
        id: '1',
        name: 'Paracetamol',
        category: 'Analgesic',
        consumed: 500,
        month: 'September',
        department: 'General Medicine'
      },
      {
        id: '2',
        name: 'Amoxicillin',
        category: 'Antibiotic',
        consumed: 150,
        month: 'September',
        department: 'Pediatrics'
      },
      {
        id: '3',
        name: 'Metformin',
        category: 'Antidiabetic',
        consumed: 200,
        month: 'September',
        department: 'Endocrinology'
      },
      {
        id: '4',
        name: 'Atorvastatin',
        category: 'Statin',
        consumed: 100,
        month: 'September',
        department: 'Cardiology'
      },
      {
        id: '5',
        name: 'Salbutamol',
        category: 'Bronchodilator',
        consumed: 80,
        month: 'September',
        department: 'Pulmonology'
      }
    ];
    
    // Mock data for financial report
    const mockFinancialData = [
      {
        id: '1',
        category: 'Analgesic',
        purchases: 2500,
        sales: 3000,
        profit: 500,
        month: 'September'
      },
      {
        id: '2',
        category: 'Antibiotic',
        purchases: 3000,
        sales: 4500,
        profit: 1500,
        month: 'September'
      },
      {
        id: '3',
        category: 'Antidiabetic',
        purchases: 1800,
        sales: 2400,
        profit: 600,
        month: 'September'
      },
      {
        id: '4',
        category: 'Statin',
        purchases: 3600,
        sales: 5000,
        profit: 1400,
        month: 'September'
      },
      {
        id: '5',
        category: 'Bronchodilator',
        purchases: 2000,
        sales: 3200,
        profit: 1200,
        month: 'September'
      }
    ];
    
    setInventoryData(mockInventoryData);
    setConsumptionData(mockConsumptionData);
    setFinancialData(mockFinancialData);
    setLoading(false);
  }, []);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleReportTypeChange = (e: any) => {
    setReportType(e.target.value);
  };

  const handleCategoryFilterChange = (value: string | null) => {
    setCategoryFilter(value);
  };

  const getFilteredInventoryData = () => {
    if (!categoryFilter) return inventoryData;
    return inventoryData.filter(item => item.category === categoryFilter);
  };

  const getFilteredConsumptionData = () => {
    if (!categoryFilter) return consumptionData;
    return consumptionData.filter(item => item.category === categoryFilter);
  };

  const getFilteredFinancialData = () => {
    if (!categoryFilter) return financialData;
    return financialData.filter(item => item.category === categoryFilter);
  };

  const getTotalInventoryValue = () => {
    return getFilteredInventoryData().reduce((total, item) => total + item.value, 0).toFixed(2);
  };

  const getLowStockCount = () => {
    return getFilteredInventoryData().filter(item => item.status === 'Low Stock').length;
  };

  const getTotalConsumption = () => {
    return getFilteredConsumptionData().reduce((total, item) => total + item.consumed, 0);
  };

  const getTotalProfit = () => {
    return getFilteredFinancialData().reduce((total, item) => total + item.profit, 0).toFixed(2);
  };

  const categories = [...new Set(inventoryData.map(item => item.category))];

  const inventoryColumns = [
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
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: any, b: any) => a.value - b.value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  const consumptionColumns = [
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
      title: 'Consumed',
      dataIndex: 'consumed',
      key: 'consumed',
      sorter: (a: any, b: any) => a.consumed - b.consumed,
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
  ];

  const financialColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: any, b: any) => a.category.localeCompare(b.category),
    },
    {
      title: 'Purchases',
      dataIndex: 'purchases',
      key: 'purchases',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: any, b: any) => a.purchases - b.purchases,
    },
    {
      title: 'Sales',
      dataIndex: 'sales',
      key: 'sales',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: any, b: any) => a.sales - b.sales,
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (value: number) => `$${value.toFixed(2)}`,
      sorter: (a: any, b: any) => a.profit - b.profit,
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
  ];

  return (
    <div className="pharmacy-reports">
      <h1>Reports</h1>
      
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Select
            placeholder="Filter by Category"
            style={{ width: 200 }}
            allowClear
            onChange={handleCategoryFilterChange}
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Radio.Group value={reportType} onChange={handleReportTypeChange}>
            <Radio.Button value="table"><TableOutlined /> Table</Radio.Button>
            <Radio.Button value="chart"><BarChartOutlined /> Chart</Radio.Button>
          </Radio.Group>
          <Button icon={<DownloadOutlined />}>Export</Button>
        </Space>
        
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane
            tab={
              <span>
                <MedicineBoxOutlined />
                Inventory Report
              </span>
            }
            key="inventory"
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Inventory Value"
                    value={getTotalInventoryValue()}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Low Stock Items"
                    value={getLowStockCount()}
                    valueStyle={{ color: '#cf1322' }}
                    prefix={<ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Items"
                    value={getFilteredInventoryData().length}
                  />
                </Card>
              </Col>
            </Row>
            
            <Divider orientation="left">Inventory Details</Divider>
            
            {reportType === 'table' ? (
              <Table
                columns={inventoryColumns}
                dataSource={getFilteredInventoryData()}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <PieChartOutlined style={{ fontSize: 100, color: '#1890ff' }} />
                <h3>Chart View - Inventory by Category</h3>
                <p>In a real implementation, this would show a chart visualization of the inventory data.</p>
              </div>
            )}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                Consumption Report
              </span>
            }
            key="consumption"
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Consumption"
                    value={getTotalConsumption()}
                    suffix="units"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Most Consumed"
                    value={getFilteredConsumptionData().length > 0 ? getFilteredConsumptionData().sort((a, b) => b.consumed - a.consumed)[0].name : 'N/A'}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Period"
                    value={dateRange[0].format('MMM D') + ' - ' + dateRange[1].format('MMM D, YYYY')}
                  />
                </Card>
              </Col>
            </Row>
            
            <Divider orientation="left">Consumption Details</Divider>
            
            {reportType === 'table' ? (
              <Table
                columns={consumptionColumns}
                dataSource={getFilteredConsumptionData()}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <BarChartOutlined style={{ fontSize: 100, color: '#1890ff' }} />
                <h3>Chart View - Consumption by Department</h3>
                <p>In a real implementation, this would show a chart visualization of the consumption data.</p>
              </div>
            )}
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <DollarOutlined />
                Financial Report
              </span>
            }
            key="financial"
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Purchases"
                    value={getFilteredFinancialData().reduce((total, item) => total + item.purchases, 0).toFixed(2)}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Sales"
                    value={getFilteredFinancialData().reduce((total, item) => total + item.sales, 0).toFixed(2)}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Profit"
                    value={getTotalProfit()}
                    valueStyle={{ color: '#3f8600' }}
                    prefix="$"
                  />
                </Card>
              </Col>
            </Row>
            
            <Divider orientation="left">Financial Details</Divider>
            
            {reportType === 'table' ? (
              <Table
                columns={financialColumns}
                dataSource={getFilteredFinancialData()}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <LineChartOutlined style={{ fontSize: 100, color: '#1890ff' }} />
                <h3>Chart View - Financial Performance</h3>
                <p>In a real implementation, this would show a chart visualization of the financial data.</p>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ReportsEnhanced;
