import React, { useEffect, useState } from 'react';
import { Card, Typography, Form, Input, Switch, Button, Space, Tabs, Select, Radio, Divider, Alert, message, Spin, Tooltip, Collapse } from 'antd';
import { BellOutlined, UserOutlined, ToolOutlined, GlobalOutlined, LockOutlined, MailOutlined, MobileOutlined, SaveOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  language?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    appointments?: boolean;
    reminders?: boolean;
    marketing?: boolean;
    reports?: boolean;
  };
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
  };
  dashboard?: {
    defaultView?: string;
    widgets?: string[];
  };
  systemSettings?: {
    hospitalName?: string;
    supportEmail?: string;
    maintenanceMode?: boolean;
    allowRegistration?: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  fontSize: 'medium',
  language: 'en',
  notifications: {
    email: true,
    sms: true,
    push: true,
    appointments: true,
    reminders: true,
    marketing: false,
    reports: true
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false
  },
  dashboard: {
    defaultView: 'summary',
    widgets: ['appointments', 'patients', 'tasks']
  },
  systemSettings: {
    hospitalName: 'Hospital MS',
    supportEmail: 'support@example.com',
    maintenanceMode: false,
    allowRegistration: true
  }
};

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/me');
        const userPrefs = res.data?.preferences || {};
        
        // Merge with defaults for any missing properties
        setPreferences({
          ...defaultPreferences,
          ...userPrefs,
          notifications: {
            ...defaultPreferences.notifications,
            ...userPrefs?.notifications
          },
          accessibility: {
            ...defaultPreferences.accessibility,
            ...userPrefs?.accessibility
          },
          dashboard: {
            ...defaultPreferences.dashboard,
            ...userPrefs?.dashboard
          },
          systemSettings: {
            ...defaultPreferences.systemSettings,
            ...userPrefs?.systemSettings
          }
        });
        
        // Set form values
        form.setFieldsValue({
          theme: userPrefs?.theme || defaultPreferences.theme,
          fontSize: userPrefs?.fontSize || defaultPreferences.fontSize,
          language: userPrefs?.language || defaultPreferences.language,
          emailNotifications: userPrefs?.notifications?.email ?? defaultPreferences.notifications?.email,
          smsNotifications: userPrefs?.notifications?.sms ?? defaultPreferences.notifications?.sms,
          pushNotifications: userPrefs?.notifications?.push ?? defaultPreferences.notifications?.push,
          appointmentNotifications: userPrefs?.notifications?.appointments ?? defaultPreferences.notifications?.appointments,
          reminderNotifications: userPrefs?.notifications?.reminders ?? defaultPreferences.notifications?.reminders,
          marketingNotifications: userPrefs?.notifications?.marketing ?? defaultPreferences.notifications?.marketing,
          reportNotifications: userPrefs?.notifications?.reports ?? defaultPreferences.notifications?.reports,
          highContrast: userPrefs?.accessibility?.highContrast ?? defaultPreferences.accessibility?.highContrast,
          reducedMotion: userPrefs?.accessibility?.reducedMotion ?? defaultPreferences.accessibility?.reducedMotion,
          largeText: userPrefs?.accessibility?.largeText ?? defaultPreferences.accessibility?.largeText,
          defaultView: userPrefs?.dashboard?.defaultView || defaultPreferences.dashboard?.defaultView,
          widgets: userPrefs?.dashboard?.widgets || defaultPreferences.dashboard?.widgets,
          hospitalName: userPrefs?.systemSettings?.hospitalName || defaultPreferences.systemSettings?.hospitalName,
          supportEmail: userPrefs?.systemSettings?.supportEmail || defaultPreferences.systemSettings?.supportEmail,
          maintenanceMode: userPrefs?.systemSettings?.maintenanceMode ?? defaultPreferences.systemSettings?.maintenanceMode,
          allowRegistration: userPrefs?.systemSettings?.allowRegistration ?? defaultPreferences.systemSettings?.allowRegistration
        });
      } catch (error) {
        console.error('Failed to load preferences from API:', error);
        message.info('Loading preferences from local storage...');
        
        // Try to load from localStorage as fallback
        try {
          const storedPrefs = localStorage.getItem('userPreferences');
          let localPrefs = {};
          
          if (storedPrefs) {
            localPrefs = JSON.parse(storedPrefs);
            console.log('Loaded preferences from localStorage');
          } else {
            // Individual settings
            const theme = localStorage.getItem('theme') || defaultPreferences.theme;
            const fontSize = localStorage.getItem('fontSize') || defaultPreferences.fontSize;
            const language = localStorage.getItem('language') || defaultPreferences.language;
            const highContrast = localStorage.getItem('highContrast') === 'true';
            
            localPrefs = {
              theme,
              fontSize,
              language,
              accessibility: { ...defaultPreferences.accessibility, highContrast }
            };
          }
          
          // Merge with defaults
          const mergedPrefs = {
            ...defaultPreferences,
            ...localPrefs,
            notifications: {
              ...defaultPreferences.notifications,
              ...(localPrefs as any)?.notifications
            },
            accessibility: {
              ...defaultPreferences.accessibility,
              ...(localPrefs as any)?.accessibility
            },
            dashboard: {
              ...defaultPreferences.dashboard,
              ...(localPrefs as any)?.dashboard
            },
            systemSettings: {
              ...defaultPreferences.systemSettings,
              ...(localPrefs as any)?.systemSettings
            }
          };
          
          setPreferences(mergedPrefs);
          
          // Set form values from merged preferences
          form.setFieldsValue({
            theme: mergedPrefs.theme,
            fontSize: mergedPrefs.fontSize,
            language: mergedPrefs.language,
            emailNotifications: mergedPrefs.notifications?.email,
            smsNotifications: mergedPrefs.notifications?.sms,
            pushNotifications: mergedPrefs.notifications?.push,
            appointmentNotifications: mergedPrefs.notifications?.appointments,
            reminderNotifications: mergedPrefs.notifications?.reminders,
            marketingNotifications: mergedPrefs.notifications?.marketing,
            reportNotifications: mergedPrefs.notifications?.reports,
            highContrast: mergedPrefs.accessibility?.highContrast,
            reducedMotion: mergedPrefs.accessibility?.reducedMotion,
            largeText: mergedPrefs.accessibility?.largeText,
            defaultView: mergedPrefs.dashboard?.defaultView,
            widgets: mergedPrefs.dashboard?.widgets,
            hospitalName: mergedPrefs.systemSettings?.hospitalName,
            supportEmail: mergedPrefs.systemSettings?.supportEmail,
            maintenanceMode: mergedPrefs.systemSettings?.maintenanceMode,
            allowRegistration: mergedPrefs.systemSettings?.allowRegistration
          });
          
        } catch (localError) {
          console.error('Failed to load preferences from localStorage:', localError);
          message.error('Failed to load preferences. Using defaults.');
          
          // Use defaults as last resort
          form.setFieldsValue({
            theme: defaultPreferences.theme,
            fontSize: defaultPreferences.fontSize,
            language: defaultPreferences.language,
            emailNotifications: defaultPreferences.notifications?.email,
            smsNotifications: defaultPreferences.notifications?.sms,
            pushNotifications: defaultPreferences.notifications?.push,
            appointmentNotifications: defaultPreferences.notifications?.appointments,
            reminderNotifications: defaultPreferences.notifications?.reminders,
            marketingNotifications: defaultPreferences.notifications?.marketing,
            reportNotifications: defaultPreferences.notifications?.reports,
            highContrast: defaultPreferences.accessibility?.highContrast,
            reducedMotion: defaultPreferences.accessibility?.reducedMotion,
            largeText: defaultPreferences.accessibility?.largeText,
            defaultView: defaultPreferences.dashboard?.defaultView,
            widgets: defaultPreferences.dashboard?.widgets,
            hospitalName: defaultPreferences.systemSettings?.hospitalName,
            supportEmail: defaultPreferences.systemSettings?.supportEmail,
            maintenanceMode: defaultPreferences.systemSettings?.maintenanceMode,
            allowRegistration: defaultPreferences.systemSettings?.allowRegistration
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Handle form value changes
  const handleFormChange = () => {
    setHasChanges(true);
  };
  
  // Save preferences
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      // Construct preferences object
      const updatedPreferences: UserPreferences = {
        theme: values.theme,
        fontSize: values.fontSize,
        language: values.language,
        notifications: {
          email: values.emailNotifications,
          sms: values.smsNotifications,
          push: values.pushNotifications,
          appointments: values.appointmentNotifications,
          reminders: values.reminderNotifications,
          marketing: values.marketingNotifications,
          reports: values.reportNotifications
        },
        accessibility: {
          highContrast: values.highContrast,
          reducedMotion: values.reducedMotion,
          largeText: values.largeText
        },
        dashboard: {
          defaultView: values.defaultView,
          widgets: values.widgets
        },
        systemSettings: isAdmin ? {
          hospitalName: values.hospitalName,
          supportEmail: values.supportEmail,
          maintenanceMode: values.maintenanceMode,
          allowRegistration: values.allowRegistration
        } : preferences.systemSettings
      };
      
      // Update user preferences
      await api.patch('/users/me', { preferences: updatedPreferences });
      
      // If admin, also update system settings via admin API
      if (isAdmin) {
        try {
          await api.post('/admin/settings', {
            hospitalName: values.hospitalName,
            supportEmail: values.supportEmail,
            maintenanceMode: values.maintenanceMode,
            allowRegistration: values.allowRegistration
          }, { suppressErrorToast: true } as any).catch(() => {
            // Graceful fallback if admin settings API doesn't exist
            console.log('Admin settings API not available - settings saved to user preferences only');
          });
        } catch (error) {
          // Ignore admin settings errors - they're saved in user preferences anyway
        }
      }
      
      setPreferences(updatedPreferences);
      setHasChanges(false);
      message.success('Settings saved successfully');
      
      // Apply theme changes immediately
      if (updatedPreferences.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
      
      // Apply font size changes
      if (updatedPreferences.fontSize === 'large') {
        document.documentElement.style.fontSize = '18px';
        localStorage.setItem('fontSize', 'large');
      } else if (updatedPreferences.fontSize === 'small') {
        document.documentElement.style.fontSize = '14px';
        localStorage.setItem('fontSize', 'small');
      } else {
        document.documentElement.style.fontSize = '16px';
        localStorage.setItem('fontSize', 'medium');
      }
      
      // Apply accessibility settings
      if (updatedPreferences.accessibility?.highContrast) {
        document.documentElement.classList.add('high-contrast-mode');
        localStorage.setItem('highContrast', 'true');
      } else {
        document.documentElement.classList.remove('high-contrast-mode');
        localStorage.setItem('highContrast', 'false');
      }
      
      // Store other preferences in localStorage for persistence
      localStorage.setItem('language', updatedPreferences.language || 'en');
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      message.error(error?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Reset to defaults
  const handleReset = () => {
    form.setFieldsValue({
      theme: defaultPreferences.theme,
      fontSize: defaultPreferences.fontSize,
      language: defaultPreferences.language,
      emailNotifications: defaultPreferences.notifications?.email,
      smsNotifications: defaultPreferences.notifications?.sms,
      pushNotifications: defaultPreferences.notifications?.push,
      appointmentNotifications: defaultPreferences.notifications?.appointments,
      reminderNotifications: defaultPreferences.notifications?.reminders,
      marketingNotifications: defaultPreferences.notifications?.marketing,
      reportNotifications: defaultPreferences.notifications?.reports,
      highContrast: defaultPreferences.accessibility?.highContrast,
      reducedMotion: defaultPreferences.accessibility?.reducedMotion,
      largeText: defaultPreferences.accessibility?.largeText,
      defaultView: defaultPreferences.dashboard?.defaultView,
      widgets: defaultPreferences.dashboard?.widgets,
      hospitalName: defaultPreferences.systemSettings?.hospitalName,
      supportEmail: defaultPreferences.systemSettings?.supportEmail,
      maintenanceMode: defaultPreferences.systemSettings?.maintenanceMode,
      allowRegistration: defaultPreferences.systemSettings?.allowRegistration
    });
    setHasChanges(true);
  };
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Settings</Title>
        <Space>
          <Button onClick={handleReset}>Reset to Defaults</Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            loading={saving} 
            disabled={!hasChanges}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Space>
      </div>
      
      {loading ? (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Loading settings..." />
          </div>
        </Card>
      ) : (
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  User Preferences
                </span>
              } 
              key="preferences"
            >
              <Form 
                form={form} 
                layout="vertical" 
                onValuesChange={handleFormChange}
                initialValues={{
                  theme: preferences.theme,
                  fontSize: preferences.fontSize,
                  language: preferences.language
                }}
              >
                <Paragraph>Customize your user interface preferences</Paragraph>
                
                <Form.Item name="theme" label="Theme">
                  <Radio.Group>
                    <Radio.Button value="light">Light</Radio.Button>
                    <Radio.Button value="dark">Dark</Radio.Button>
                    <Radio.Button value="system">System</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item name="fontSize" label="Font Size">
                  <Radio.Group>
                    <Radio.Button value="small">Small</Radio.Button>
                    <Radio.Button value="medium">Medium</Radio.Button>
                    <Radio.Button value="large">Large</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item name="language" label="Language">
                  <Select>
                    <Option value="en">English</Option>
                    <Option value="es">Español</Option>
                    <Option value="fr">Français</Option>
                    <Option value="de">Deutsch</Option>
                    <Option value="zh">中文</Option>
                    <Option value="ja">日本語</Option>
                    <Option value="ar">العربية</Option>
                    <Option value="hi">हिन्दी</Option>
                  </Select>
                </Form.Item>
                
                <Divider orientation="left">Accessibility</Divider>
                
                <Form.Item name="highContrast" valuePropName="checked" label="High Contrast Mode">
                  <Switch />
                </Form.Item>
                
                <Form.Item name="reducedMotion" valuePropName="checked" label="Reduced Motion">
                  <Switch />
                </Form.Item>
                
                <Form.Item name="largeText" valuePropName="checked" label="Large Text">
                  <Switch />
                </Form.Item>
                
                <Divider orientation="left">Dashboard</Divider>
                
                <Form.Item name="defaultView" label="Default Dashboard View">
                  <Select>
                    <Option value="summary">Summary</Option>
                    <Option value="appointments">Appointments</Option>
                    <Option value="patients">Patients</Option>
                    <Option value="analytics">Analytics</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="widgets" label="Dashboard Widgets">
                  <Select mode="multiple">
                    <Option value="appointments">Appointments</Option>
                    <Option value="patients">Patients</Option>
                    <Option value="tasks">Tasks</Option>
                    <Option value="analytics">Analytics</Option>
                    <Option value="messages">Messages</Option>
                    <Option value="calendar">Calendar</Option>
                  </Select>
                </Form.Item>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <BellOutlined />
                  Notifications
                </span>
              } 
              key="notifications"
            >
              <Form 
                form={form} 
                layout="vertical"
                onValuesChange={handleFormChange}
                initialValues={{
                  emailNotifications: preferences.notifications?.email,
                  smsNotifications: preferences.notifications?.sms,
                  pushNotifications: preferences.notifications?.push,
                  appointmentNotifications: preferences.notifications?.appointments,
                  reminderNotifications: preferences.notifications?.reminders,
                  marketingNotifications: preferences.notifications?.marketing,
                  reportNotifications: preferences.notifications?.reports
                }}
              >
                <Paragraph>Configure how you receive notifications</Paragraph>
                
                <Divider orientation="left">Notification Channels</Divider>
                
                <Form.Item name="emailNotifications" valuePropName="checked" label={
                  <span>
                    <MailOutlined style={{ marginRight: 8 }} />
                    Email Notifications
                  </span>
                }>
                  <Switch />
                </Form.Item>
                
                <Form.Item name="smsNotifications" valuePropName="checked" label={
                  <span>
                    <MobileOutlined style={{ marginRight: 8 }} />
                    SMS Notifications
                  </span>
                }>
                  <Switch />
                </Form.Item>
                
                <Form.Item name="pushNotifications" valuePropName="checked" label="Push Notifications">
                  <Switch />
                </Form.Item>
                
                <Divider orientation="left">Notification Types</Divider>
                
                <Form.Item name="appointmentNotifications" valuePropName="checked" label="Appointment Updates">
                  <Switch />
                </Form.Item>
                
                <Form.Item name="reminderNotifications" valuePropName="checked" label="Reminders">
                  <Switch />
                </Form.Item>
                
                <Form.Item name="reportNotifications" valuePropName="checked" label="Medical Reports">
                  <Switch />
                </Form.Item>
                
                <Form.Item name="marketingNotifications" valuePropName="checked" label="Marketing & Promotions">
                  <Switch />
                </Form.Item>
              </Form>
            </TabPane>
            
            {isAdmin && (
              <TabPane 
                tab={
                  <span>
                    <ToolOutlined />
                    System Settings
                  </span>
                } 
                key="system"
              >
                <Form 
                  form={form} 
                  layout="vertical"
                  onValuesChange={handleFormChange}
                  initialValues={{
                    hospitalName: preferences.systemSettings?.hospitalName,
                    supportEmail: preferences.systemSettings?.supportEmail,
                    maintenanceMode: preferences.systemSettings?.maintenanceMode,
                    allowRegistration: preferences.systemSettings?.allowRegistration
                  }}
                >
                  <Alert 
                    message="Administrator Settings" 
                    description="These settings affect the entire system. Changes will be applied to all users." 
                    type="info" 
                    showIcon 
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Form.Item name="hospitalName" label="Hospital Name" rules={[{ required: true }]}>
                    <Input placeholder="Hospital MS" />
                  </Form.Item>
                  
                  <Form.Item name="supportEmail" label="Support Email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="support@example.com" />
                  </Form.Item>
                  
                  <Divider orientation="left">System Status</Divider>
                  
                  <Form.Item 
                    name="maintenanceMode" 
                    valuePropName="checked" 
                    label={
                      <span>
                        Maintenance Mode
                        <Tooltip title="When enabled, only administrators can access the system. All other users will see a maintenance message.">
                          <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </span>
                    }
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item 
                    name="allowRegistration" 
                    valuePropName="checked" 
                    label={
                      <span>
                        Allow New Registrations
                        <Tooltip title="When disabled, new users cannot register for accounts.">
                          <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </span>
                    }
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Collapse ghost>
                    <Panel header="Advanced Settings" key="advanced">
                      <Alert 
                        message="These settings are for advanced users only" 
                        description="Incorrect configuration may cause system instability." 
                        type="warning" 
                        showIcon 
                        style={{ marginBottom: 16 }}
                      />
                      
                      <Form.Item label="API Rate Limit (requests/minute)">
                        <Input type="number" defaultValue="60" disabled />
                      </Form.Item>
                      
                      <Form.Item label="Session Timeout (minutes)">
                        <Input type="number" defaultValue="30" disabled />
                      </Form.Item>
                      
                      <Form.Item label="Database Backup">
                        <Button type="primary" disabled>Configure Backups</Button>
                      </Form.Item>
                    </Panel>
                  </Collapse>
                </Form>
              </TabPane>
            )}
            
            <TabPane 
              tab={
                <span>
                  <LockOutlined />
                  Security
                </span>
              } 
              key="security"
            >
              <Alert 
                message="Security Settings" 
                description={
                  <span>
                    Password and security settings are managed in your profile. 
                    <Button type="link" href="/profile" style={{ padding: 0 }}>Go to Profile</Button>
                  </span>
                }
                type="info" 
                showIcon 
              />
            </TabPane>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default Settings;
