import { message } from 'antd';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  accessibility: {
    highContrastMode: boolean;
    reducedMotion: boolean;
    largeText: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  language: 'english',
  accessibility: {
    highContrastMode: false,
    reducedMotion: false,
    largeText: false,
  },
};

const SETTINGS_STORAGE_KEY = 'hospital_user_settings';

export const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    message.error('Failed to save settings');
  }
};

export const loadSettings = (): UserSettings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    message.error('Failed to load settings');
  }
  return DEFAULT_SETTINGS;
};

export const applyTheme = (theme: 'light' | 'dark' | 'system'): void => {
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('theme-light', 'theme-dark');
  
  // Determine theme based on system preference if set to 'system'
  let effectiveTheme = theme;
  if (theme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  // Apply theme class
  root.classList.add(`theme-${effectiveTheme}`);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff'
    );
  }
};

export const applyFontSize = (fontSize: 'small' | 'medium' | 'large'): void => {
  const root = document.documentElement;
  
  // Remove existing font size classes
  root.classList.remove('font-small', 'font-medium', 'font-large');
  
  // Apply font size class
  root.classList.add(`font-${fontSize}`);
  
  // Set CSS variable for base font size
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  
  root.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
};

export const applyAccessibilitySettings = (settings: UserSettings['accessibility']): void => {
  const root = document.documentElement;
  
  // High contrast mode
  if (settings.highContrastMode) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Reduced motion
  if (settings.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
  
  // Large text (beyond font size setting)
  if (settings.largeText) {
    root.classList.add('large-text');
  } else {
    root.classList.remove('large-text');
  }
};

export const applyAllSettings = (settings: UserSettings): void => {
  applyTheme(settings.theme);
  applyFontSize(settings.fontSize);
  applyAccessibilitySettings(settings.accessibility);
};

export default {
  DEFAULT_SETTINGS,
  saveSettings,
  loadSettings,
  applyTheme,
  applyFontSize,
  applyAccessibilitySettings,
  applyAllSettings,
};
