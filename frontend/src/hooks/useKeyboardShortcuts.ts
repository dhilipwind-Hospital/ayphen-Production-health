import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { message } from 'antd';

/**
 * Hook to handle global keyboard shortcuts for settings
 */
const useKeyboardShortcuts = () => {
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process if Alt key is pressed
      if (!event.altKey) return;
      
      // Alt + T: Toggle theme
      if (event.key === 't' || event.key === 'T') {
        const newTheme = settings.theme === 'light' ? 'dark' : 'light';
        updateSettings({ theme: newTheme });
        message.info(`Switched to ${newTheme} theme`);
        event.preventDefault();
      }
      
      // Alt + A: Toggle high contrast mode
      if (event.key === 'a' || event.key === 'A') {
        const newValue = !settings.accessibility.highContrastMode;
        updateSettings({ 
          accessibility: { 
            ...settings.accessibility, 
            highContrastMode: newValue 
          } 
        });
        message.info(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`);
        event.preventDefault();
      }
      
      // Alt + F: Cycle through font sizes
      if (event.key === 'f' || event.key === 'F') {
        const fontSizes = ['small', 'medium', 'large'] as const;
        const currentIndex = fontSizes.indexOf(settings.fontSize);
        const nextIndex = (currentIndex + 1) % fontSizes.length;
        const newFontSize = fontSizes[nextIndex];
        
        updateSettings({ fontSize: newFontSize });
        message.info(`Font size set to ${newFontSize}`);
        event.preventDefault();
      }
      
      // Alt + M: Toggle reduced motion
      if (event.key === 'm' || event.key === 'M') {
        const newValue = !settings.accessibility.reducedMotion;
        updateSettings({ 
          accessibility: { 
            ...settings.accessibility, 
            reducedMotion: newValue 
          } 
        });
        message.info(`Reduced motion ${newValue ? 'enabled' : 'disabled'}`);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [settings, updateSettings]);
};

export default useKeyboardShortcuts;
