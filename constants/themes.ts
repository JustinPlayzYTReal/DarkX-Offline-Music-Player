export interface Theme {
  name: string;
  colors: {
    background: string; // 'r g b'
    surface: string;    // 'r g b'
    primary: string;    // 'r g b' (for primary UI elements, often white or black)
    accent: string;     // 'r g b'
    textPrimary: string;// 'r g b'
    textSecondary: string;// 'r g b'
    border: string;     // 'r g b'
  };
  typography: {
    fontFamily: string;
    selectedFont: 'sans' | 'serif' | 'mono' | 'custom';
    customFontName?: string;
    customFontUrl?: string;
  };
  components: {
      borderRadius: string; // e.g., '0.5rem'
      buttonStyle: 'filled' | 'outline';
      songItemDensity: 'compact' | 'default' | 'spacious';
  };
  backgroundImage?: string; // base64 data URL
}

const sharedTypography = {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    selectedFont: 'sans' as const,
};

const sharedComponents = {
    borderRadius: '8px',
    buttonStyle: 'filled' as const,
    songItemDensity: 'default' as const,
}

export const darkTheme: Theme = {
  name: 'Dark',
  colors: {
    background: '0 0 0',
    surface: '17 24 39',
    primary: '241 245 249',
    accent: '255 0 0',
    textPrimary: '241 245 249',
    textSecondary: '156 163 175',
    border: '255 0 0',
  },
  typography: sharedTypography,
  components: sharedComponents,
};

export const lightTheme: Theme = {
  name: 'Light',
  colors: {
    background: '241 245 249', // slate-100
    surface: '255 255 255',   // white
    primary: '15 23 42',     // slate-900
    accent: '37 99 235',     // blue-600
    textPrimary: '15 23 42', // slate-900
    textSecondary: '71 85 105', // slate-500
    border: '203 213 225', // slate-300
  },
  typography: sharedTypography,
  components: sharedComponents,
};

export const amoledTheme: Theme = {
  name: 'AMOLED',
  colors: {
    background: '0 0 0',
    surface: '5 5 5',
    primary: '229 231 235',
    accent: '16 185 129', // emerald-500
    textPrimary: '229 231 235', // gray-200
    textSecondary: '107 114 128', // gray-500
    border: '55 65 81', // gray-600
  },
  typography: sharedTypography,
  components: sharedComponents,
};