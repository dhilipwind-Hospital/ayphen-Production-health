import React, { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Button, 
  Space, 
  Radio, 
  Switch, 
  Select, 
  Typography, 
  Divider,
  message
} from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  LockOutlined, 
  SaveOutlined, 
  UndoOutlined 
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const navigate = useNavigate();

  const handleChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setLocalSettings({
        ...localSettings,
        [parent]: {
          ...(localSettings[parent as keyof typeof localSettings] as Record<string, any>),
          [child]: value
        }
      });
    } else {
      setLocalSettings({
        ...localSettings,
        [key]: value
      });
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    message.success('Settings saved successfully');
    setHasChanges(false);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings({ ...settings });
    message.info('Settings reset to defaults');
    setHasChanges(false);
  };

  return (
    <div className="settings-page">
      <Card
        title={<Title level={2}>Settings</Title>}
        extra={
          <Space>
            <Button 
              onClick={() => navigate('/onboarding/choose-hospital')}
            >
              Change Hospital
            </Button>
            <Button 
              onClick={handleReset} 
              icon={<UndoOutlined />}
            >
              Reset to Defaults
            </Button>
            <Button 
              type="primary" 
              onClick={handleSave} 
              disabled={!hasChanges}
              icon={<SaveOutlined />}
            >
              Save Changes
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="user">
          <TabPane 
            tab={<span><UserOutlined /> User Preferences</span>} 
            key="user"
          >
            <div className="settings-section">
              <Title level={4}>Customize your user interface preferences</Title>
              
              <div className="setting-item">
                <Text strong>Theme</Text>
                <Radio.Group 
                  value={localSettings.theme} 
                  onChange={(e) => handleChange('theme', e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="light">Light</Radio.Button>
                  <Radio.Button value="dark">Dark</Radio.Button>
                  <Radio.Button value="system">System</Radio.Button>
                </Radio.Group>
              </div>
              
              <div className="setting-item">
                <Text strong>Font Size</Text>
                <Radio.Group 
                  value={localSettings.fontSize} 
                  onChange={(e) => handleChange('fontSize', e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="small">Small</Radio.Button>
                  <Radio.Button value="medium">Medium</Radio.Button>
                  <Radio.Button value="large">Large</Radio.Button>
                </Radio.Group>
              </div>
              
              <div className="setting-item">
                <Text strong>Language</Text>
                <Select 
                  value={localSettings.language} 
                  onChange={(value) => handleChange('language', value)}
                  style={{ width: 200 }}
                >
                  <Option value="english">English</Option>
                  <Option value="spanish">Spanish</Option>
                  <Option value="french">French</Option>
                  <Option value="german">German</Option>
                  <Option value="chinese">Chinese</Option>
                  <Option value="japanese">Japanese</Option>
                  <Option value="arabic">Arabic</Option>
                  <Option value="hindi">Hindi</Option>
                </Select>
              </div>
              
              <Divider />
              
              <Title level={4}>Accessibility</Title>
              
              <div className="setting-item">
                <Text strong>High Contrast Mode</Text>
                <Switch 
                  checked={localSettings.accessibility.highContrastMode} 
                  onChange={(checked) => handleChange('accessibility.highContrastMode', checked)}
                />
              </div>
              
              <div className="setting-item">
                <Text strong>Reduced Motion</Text>
                <Switch 
                  checked={localSettings.accessibility.reducedMotion} 
                  onChange={(checked) => handleChange('accessibility.reducedMotion', checked)}
                />
              </div>
              
              <div className="setting-item">
                <Text strong>Large Text</Text>
                <Switch 
                  checked={localSettings.accessibility.largeText} 
                  onChange={(checked) => handleChange('accessibility.largeText', checked)}
                />
              </div>
              
              <Divider />
              
              <Title level={4}>Keyboard Shortcuts</Title>
              
              <div className="keyboard-shortcuts">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #f0f0f0' }}>Shortcut</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #f0f0f0' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>Alt</kbd> + <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>T</kbd>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>Toggle between light and dark theme</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>Alt</kbd> + <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>A</kbd>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>Toggle high contrast mode</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>Alt</kbd> + <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>F</kbd>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>Cycle through font sizes (small, medium, large)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>Alt</kbd> + <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ddd' }}>M</kbd>
                      </td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>Toggle reduced motion</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabPane>
          
          <TabPane 
            tab={<span><BellOutlined /> Notifications</span>} 
            key="notifications"
          >
            <div className="settings-section">
              <Title level={4}>Notification Preferences</Title>
              <Text>Configure your notification preferences here.</Text>
              {/* Notification settings will be implemented in future updates */}
            </div>
          </TabPane>
          
          <TabPane 
            tab={<span><LockOutlined /> Security</span>} 
            key="security"
          >
            <div className="settings-section">
              <Title level={4}>Security Settings</Title>
              <Text>Configure your security settings here.</Text>
              {/* Security settings will be implemented in future updates */}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
