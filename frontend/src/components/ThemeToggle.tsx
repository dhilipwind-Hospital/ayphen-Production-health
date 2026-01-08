import React from 'react';
import { Button, Tooltip } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useSettings } from '../contexts/SettingsContext';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
  showTooltip?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'middle',
  showTooltip = true
}) => {
  const { settings, updateSettings } = useSettings();
  
  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
  };
  
  const button = (
    <Button
      type="text"
      icon={settings.theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
      onClick={toggleTheme}
      size={size}
      aria-label={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}
    />
  );
  
  return showTooltip ? (
    <Tooltip title={`Switch to ${settings.theme === 'light' ? 'dark' : 'light'} mode`}>
      {button}
    </Tooltip>
  ) : button;
};

export default ThemeToggle;
