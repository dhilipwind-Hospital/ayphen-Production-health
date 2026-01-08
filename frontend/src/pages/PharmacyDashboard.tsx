import React, { useState } from 'react';
import { Tabs } from 'antd';
import { 
  DashboardOutlined, 
  MedicineBoxOutlined, 
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';

import Dashboard from './pharmacy/Dashboard';
import InventoryEnhanced from './pharmacy/InventoryEnhanced';
import PrescriptionsEnhanced from './pharmacy/PrescriptionsEnhanced';
import ReportsEnhanced from './pharmacy/ReportsEnhanced';

const { TabPane } = Tabs;

const PharmacyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className="pharmacy-module">
      <h1>Pharmacy Management</h1>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        type="card"
        style={{ marginBottom: 24 }}
      >
        <TabPane 
          tab={<span><DashboardOutlined /> Dashboard</span>} 
          key="dashboard" 
        />
        <TabPane 
          tab={<span><MedicineBoxOutlined /> Inventory</span>} 
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

      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'inventory' && <InventoryEnhanced />}
      {activeTab === 'prescriptions' && <PrescriptionsEnhanced />}
      {activeTab === 'reports' && <ReportsEnhanced />}
    </div>
  );
};

export default PharmacyDashboard;
