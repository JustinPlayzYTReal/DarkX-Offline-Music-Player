import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ChevronDownIcon, ChevronRightIcon } from '../constants';
import { Theme, darkTheme } from '../constants/themes';


const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-theme">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                {isOpen ? <ChevronDownIcon className="w-6 h-6"/> : <ChevronRightIcon className="w-6 h-6"/>}
            </button>
            {isOpen && <div className="pb-4 space-y-6">{children}</div>}
        </div>
    );
};

const SegmentedControl: React.FC<{ options: {label: string, value: string}[], value: string, onChange: (value: string) => void }> = ({ options, value, onChange }) => (
    <div className="flex gap-2 rounded-lg p-1 bg-surface max-w-md border border-theme">
      {options.map(({ label, value: optValue }) => (
          <button 
              key={optValue}
              onClick={() => onChange(optValue)}
              className={`w-full py-2 rounded-md transition-colors text-sm font-medium capitalize ${value === optValue ? 'bg-accent text-white shadow' : 'hover:bg-white/10'}`}
          >
              {label}
          </button>
      ))}
    </div>
);


const SettingsScreen: React.FC = () => {
  const { layout, activeThemeName, customTheme, changeTheme, updateCustomTheme, changeLayout } = useTheme();
  
  const handleComponentStyleChange = (key: keyof Theme['components'], value: string) => {
      updateCustomTheme({ ...customTheme, components: { ...customTheme.components, [key]: value }});
  }

  // --- Color Customization Helpers ---
  const rgbStringToHex = (rgb: string): string => {
    if (!rgb || typeof rgb !== 'string') return '#000000';
    const parts = rgb.split(' ');
    if (parts.length !== 3) return '#000000';
    const [r, g, b] = parts.map(Number);
    if ([r, g, b].some(isNaN)) return '#000000';
    return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
  };

  const hexToRgbString = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '0 0 0';
  };
  
  const handleColorChange = (key: keyof Theme['colors'], value: string) => {
    const newColors = { ...customTheme.colors, [key]: hexToRgbString(value) };
    updateCustomTheme({ ...customTheme, colors: newColors });
  };
  
  const resetColors = () => {
    updateCustomTheme({ ...customTheme, colors: darkTheme.colors });
  };
  
  const colorSettings: { key: keyof Theme['colors']; label: string }[] = [
      { key: 'background', label: 'Background' },
      { key: 'surface', label: 'Surface' },
      { key: 'primary', label: 'Primary UI' },
      { key: 'accent', label: 'Accent' },
      { key: 'textPrimary', label: 'Primary Text' },
      { key: 'textSecondary', label: 'Secondary Text' },
      { key: 'border', label: 'Border' },
  ];

  return (
    <div className="h-full p-4">
      <header className="border-b border-theme mb-8">
        <h1 className="text-4xl font-bold text-accent">Settings</h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-accent border-b border-theme pb-2">Appearance</h2>
          
          <div>
            <h3 className="text-lg mb-3">Theme</h3>
            <SegmentedControl
              options={[
                { label: 'dark', value: 'dark' },
                { label: 'light', value: 'light' },
                { label: 'amoled', value: 'amoled' },
                { label: 'custom', value: 'custom' },
              ]}
              value={activeThemeName}
              onChange={(val) => changeTheme(val as any)}
            />
          </div>

          {activeThemeName === 'custom' && (
            <div className="mt-6">
                 <Accordion title="Layout & Components">
                    <div>
                        <h3 className="text-lg mb-3">Grid View Layout</h3>
                         <SegmentedControl
                            options={[ { label: 'list', value: 'list' }, { label: 'grid', value: 'grid' } ]}
                            value={layout}
                            onChange={changeLayout}
                        />
                    </div>
                    <div>
                        <h3 className="text-lg mb-3">List Item Density</h3>
                         <SegmentedControl
                            options={[
                                { label: 'Compact', value: 'compact' },
                                { label: 'Default', value: 'default' },
                                { label: 'Spacious', value: 'spacious' }
                            ]}
                            value={customTheme.components.songItemDensity}
                            onChange={(val) => handleComponentStyleChange('songItemDensity', val)}
                        />
                    </div>
                     <div>
                        <h3 className="text-lg mb-3">Button Style</h3>
                         <SegmentedControl
                            options={[ { label: 'Filled', value: 'filled' }, { label: 'Outline', value: 'outline' } ]}
                            value={customTheme.components.buttonStyle}
                            onChange={(val) => handleComponentStyleChange('buttonStyle', val)}
                        />
                    </div>
                     <div>
                        <label htmlFor="cornerRadius" className="block text-lg mb-2">Corner Radius</label>
                         <div className="flex items-center space-x-4">
                             <span>0px</span>
                             <input
                                id="cornerRadius"
                                type="range"
                                min="0"
                                max="24"
                                value={parseInt(customTheme.components.borderRadius, 10)}
                                onChange={e => handleComponentStyleChange('borderRadius', `${e.target.value}px`)}
                                className="flex-grow"
                            />
                             <span>24px</span>
                         </div>
                    </div>
                </Accordion>
                <Accordion title="Colors">
                  <p className="text-sm text-secondary -mt-2 mb-4">Customize the color palette for your theme.</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {colorSettings.map(({ key, label }) => (
                      <div key={key}>
                        <label htmlFor={key} className="block text-sm font-medium mb-1">{label}</label>
                        <div className="relative w-full h-10 rounded-md border border-theme" style={{ backgroundColor: rgbStringToHex(customTheme.colors[key])}}>
                          <input
                            id={key}
                            type="color"
                            value={rgbStringToHex(customTheme.colors[key])}
                            onChange={e => handleColorChange(key, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label={`Change ${label} color`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={resetColors} className="btn btn-secondary w-full mt-6">
                    Reset Colors
                  </button>
                </Accordion>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SettingsScreen;