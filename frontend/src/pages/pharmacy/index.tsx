import React from 'react';
import { Tabs } from 'antd';
import { 
  DashboardOutlined, 
  MedicineBoxOutlined, 
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';

import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Prescriptions from './Prescriptions';

const { TabPane } = Tabs;

const PharmacyModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab should be active based on the current path
  const getActiveKey = () => {
    const path = location.pathname;
    if (path.includes('/pharmacy/inventory')) return 'inventory';
    if (path.includes('/pharmacy/prescriptions')) return 'prescriptions';
    if (path.includes('/pharmacy/reports')) return 'reports';
    return 'dashboard'; // Default to dashboard
  };

  const handleTabChange = (key: string) => {
    switch (key) {
      case 'dashboard':
        navigate('/pharmacy');
        break;
      case 'inventory':
        navigate('/pharmacy/inventory');
        break;
      case 'prescriptions':
        navigate('/pharmacy/prescriptions');
        break;
      case 'reports':
        navigate('/pharmacy/reports');
        break;
      default:
        navigate('/pharmacy');
    }
  };

  return (
    <div className="pharmacy-module">
      <Tabs 
        activeKey={getActiveKey()} 
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

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/reports" element={<div>Reports - Coming Soon</div>} />
      </Routes>
    </div>
  );
};

export default PharmacyModule;
