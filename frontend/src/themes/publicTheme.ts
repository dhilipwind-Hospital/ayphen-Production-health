// Pink/Teal Theme for Ayphen Care (Enhanced Pink)
export const publicTheme = {
  token: {
    // Primary Colors (Enhanced Pink)
    colorPrimary: '#e91e63',      // Primary Pink (Pink 500) - Main brand color
    colorPrimaryHover: '#f48fb1',  // Lighter pink (Pink 200)
    colorPrimaryActive: '#ad1457', // Darker pink (Pink 800)
    
    // Secondary Colors (Teal/Mint)
    colorSuccess: '#4ECDC4',       // Teal/Mint (from reference)
    colorInfo: '#5DD9D1',          // Lighter teal
    colorLink: '#4ECDC4',          // Teal
    
    // Background Colors
    colorBgLayout: '#FFFFFF',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    
    // Border & Radius
    borderRadius: 16,
    colorBorder: '#f0f0f0',
    
    // Typography
    fontFamily: "'Poppins', 'Montserrat', 'Open Sans', 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Text Colors
    colorText: '#333333',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    
    // Shadows
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.12)',
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 24, // Rounded buttons per design
      borderRadiusLG: 24,
      borderRadiusSM: 20,
      colorPrimary: '#e91e63',      // Primary pink
      colorPrimaryHover: '#f48fb1',  // Lighter pink
      colorPrimaryActive: '#ad1457', // Darker pink
      fontWeight: 600,
    },
    Card: {
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Menu: {
      itemBorderRadius: 8,
    },
    Tag: {
      borderRadius: 12,
    },
  },
};

// Default theme for internal portals (keep existing teal)
export const defaultTheme = {
  token: {
    colorPrimary: '#0ea5a5',
    colorInfo: '#0ea5a5',
    colorLink: '#0ea5a5',
    colorSuccess: '#22c55e',
    borderRadius: 12,
    fontFamily: 'Inter, "Open Sans", Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    colorBgLayout: '#f2fbfb',
    colorBorder: '#e6eef2',
    colorTextSecondary: '#64748b',
  },
  components: {
    Button: {
      colorPrimary: '#0ea5a5',
      colorPrimaryHover: '#12b2b2',
      colorPrimaryActive: '#0b8e8e',
      colorSuccess: '#22c55e',
      controlHeight: 38,
    },
    Tag: { colorPrimary: '#0ea5a5' },
    Switch: { colorPrimary: '#0ea5a5' },
    Select: { colorPrimary: '#0ea5a5' },
  },
};

// Color palette constants for use in components (Softer Pink Tones)
export const colors = {
  pink: {
    50: '#FCE4EC',      // Background - Light Pink
    100: '#F8BBD0',     // Very light pink
    200: '#F48FB1',     // Soft pink for hover states
    400: '#EC407A',     // Primary Buttons (Softer Pink 400) - Main color
    500: '#E91E63',     // Brighter pink (less used)
    600: '#D81B60',     // Darker pink
    700: '#C2185B',     // Headings (Pink 700)
    800: '#AD1457',     // Very dark pink
  },
  maroon: {
    50: '#F9E6EC',
    100: '#F0C2D3',
    400: '#EC407A',  // Alias to pink for backward compatibility
    500: '#E91E63',  // Alias to pink for backward compatibility
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
  },
  teal: {
    50: '#E6F9F7',
    100: '#B3F0EB',
    400: '#4ECDC4',  // Primary teal/mint
    500: '#3DBDB5',  // Darker teal
  },
  neutral: {
    text: '#333333',
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
  },
};
