import { useState, useCallback, useEffect } from 'react';
import { darkTheme, lightTheme, amoledTheme, Theme } from '../constants/themes';

type ThemeName = 'dark' | 'light' | 'amoled' | 'custom';

interface SavedThemeState {
  activeTheme: ThemeName;
  customTheme?: Theme;
  layout: 'list' | 'grid';
}

const themes: Record<Exclude<ThemeName, 'custom'>, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  amoled: amoledTheme,
};

let themeState: any = null;
const listeners: Set<() => void> = new Set();

const getInitialState = () => {
    try {
      const savedStateString = localStorage.getItem('music-player-theme-v2');
      if (savedStateString) {
        const savedState = JSON.parse(savedStateString);
        
        // Deep merge custom theme to ensure new properties from updates are included
        const savedCustom = savedState.customTheme || {};
        const customTheme = {
            ...darkTheme,
            ...savedCustom,
            colors: { ...darkTheme.colors, ...savedCustom.colors },
            typography: { ...darkTheme.typography, ...savedCustom.typography },
            components: { ...darkTheme.components, ...savedCustom.components },
        };

        return {
            activeThemeName: savedState.activeTheme || 'dark',
            customTheme: customTheme,
            layout: savedState.layout || 'list',
        };
      }
    } catch (error) {
      console.error("Failed to load theme state", error);
    }
    return {
        activeThemeName: 'dark' as ThemeName,
        customTheme: darkTheme,
        layout: 'list' as 'list' | 'grid',
    };
};

themeState = getInitialState();

const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    const customStyleId = 'custom-font-style';

    // Remove any existing custom font style element to prevent residue
    document.getElementById(customStyleId)?.remove();

    Object.entries(theme.colors).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--color-${formattedKey}`, value);
    });

    // Typography
    const fontMap = {
        sans: 'var(--font-family-stack-sans)',
        serif: 'var(--font-family-stack-serif)',
        mono: 'var(--font-family-stack-mono)',
        custom: 'var(--font-family-stack-sans)', // Fallback
    };
    
    let activeFontFamily = fontMap[theme.typography.selectedFont];

    if (theme.typography.selectedFont === 'custom' && theme.typography.customFontUrl && theme.typography.customFontName) {
        if (theme.typography.customFontUrl.startsWith('https://fonts.googleapis.com')) {
            const link = document.createElement('link');
            link.id = customStyleId;
            link.rel = 'stylesheet';
            link.href = theme.typography.customFontUrl;
            document.head.appendChild(link);
        } else { // Assumes base64 data URL
            const style = document.createElement('style');
            style.id = customStyleId;
            style.innerHTML = `
                @font-face {
                    font-family: "${theme.typography.customFontName}";
                    src: url(${theme.typography.customFontUrl});
                }
            `;
            document.head.appendChild(style);
        }
        activeFontFamily = `"${theme.typography.customFontName}", ${fontMap.sans}`;
    }

    root.style.setProperty('--font-family-sans', activeFontFamily);
    
    // Components
    root.style.setProperty(`--border-radius`, theme.components.borderRadius);
    root.dataset.buttonStyle = theme.components.buttonStyle;
    root.dataset.songDensity = theme.components.songItemDensity;
    
    root.style.setProperty('--accent-color', theme.colors.accent);
    root.style.setProperty('--text-color', theme.colors.textPrimary);
    root.style.setProperty('--bg-color', theme.colors.background);
    root.style.setProperty('--scrollbar-color', theme.colors.accent);

    if (theme.backgroundImage) {
      body.style.backgroundImage = `url(${theme.backgroundImage})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
    } else {
      body.style.backgroundImage = 'none';
    }
};

// Apply initial theme on script load
const initialTheme = themeState.activeThemeName === 'custom' ? themeState.customTheme : themes[themeState.activeThemeName as Exclude<ThemeName, 'custom'>];
applyTheme(initialTheme);


const saveState = (state: SavedThemeState) => {
     try {
       localStorage.setItem('music-player-theme-v2', JSON.stringify(state));
     } catch (error) {
       console.error("Failed to save theme state", error);
     }
};

const notifyListeners = () => {
    listeners.forEach(listener => listener());
};

const actions = {
  changeTheme: (name: ThemeName) => {
    themeState.activeThemeName = name;
    const themeToApply = name === 'custom' ? themeState.customTheme : themes[name];
    applyTheme(themeToApply);
    saveState({ activeTheme: name, customTheme: themeState.customTheme, layout: themeState.layout });
    notifyListeners();
  },
  updateCustomTheme: (updatedCustomTheme: Theme) => {
    themeState.customTheme = updatedCustomTheme;
    if (themeState.activeThemeName === 'custom') {
      applyTheme(updatedCustomTheme);
    }
    saveState({ activeTheme: themeState.activeThemeName, customTheme: updatedCustomTheme, layout: themeState.layout });
    notifyListeners();
  },
  changeLayout: (newLayout: 'list' | 'grid') => {
    themeState.layout = newLayout;
    saveState({ activeTheme: themeState.activeThemeName, customTheme: themeState.customTheme, layout: newLayout });
    notifyListeners();
  },
  setCustomFont: (font: { name: string, url: string }) => {
    const newTypography = {
        ...themeState.customTheme.typography,
        selectedFont: 'custom' as const,
        customFontName: font.name,
        customFontUrl: font.url,
    };
    const updatedCustomTheme = { ...themeState.customTheme, typography: newTypography };
    actions.updateCustomTheme(updatedCustomTheme);
    if (themeState.activeThemeName !== 'custom') {
        actions.changeTheme('custom');
    }
  },
  removeCustomFont: () => {
    const { customFontName, customFontUrl, ...restTypography } = themeState.customTheme.typography;
    const newTypography = {
        ...restTypography,
        selectedFont: 'sans' as const,
    };
    const updatedCustomTheme = { ...themeState.customTheme, typography: newTypography };
    actions.updateCustomTheme(updatedCustomTheme);
  }
};

export const useTheme = () => {
  const [state, setState] = useState(themeState);

  useEffect(() => {
    const listener = () => setState({ ...themeState });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  
  const currentTheme = state.activeThemeName === 'custom' 
      ? state.customTheme 
      : themes[state.activeThemeName as Exclude<ThemeName, 'custom'>];

  return {
    theme: currentTheme,
    layout: state.layout,
    activeThemeName: state.activeThemeName,
    customTheme: state.customTheme,
    ...actions,
  };
};