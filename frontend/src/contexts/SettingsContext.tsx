import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserSettings, 
  DEFAULT_SETTINGS, 
  loadSettings, 
  saveSettings, 
  applyAllSettings 
} from '../services/settings.service';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const userSettings = loadSettings();
    setSettings(userSettings);
    applyAllSettings(userSettings);
    setInitialized(true);
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      // Handle nested accessibility settings
      accessibility: {
        ...settings.accessibility,
        ...(newSettings.accessibility || {}),
      },
    };
    
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    applyAllSettings(updatedSettings);
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    applyAllSettings(DEFAULT_SETTINGS);
  };

  // Only render children after settings are initialized
  if (!initialized) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
