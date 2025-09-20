import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { PlusIcon, UploadIcon, ChevronDownIcon, ChevronRightIcon } from '../constants';
import { Theme } from '../constants/themes';

// --- COLOR UTILITIES ---

const rgbStringToHsl = (rgbStr: string): { h: number; s: number; l: number } => {
  if (!rgbStr) return { h: 0, s: 0, l: 0 };
  let [r, g, b] = rgbStr.split(' ').map(Number);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgbString = (h: number, s: number, l: number): string => {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { [r, g, b] = [c, x, 0]; }
  else if (h >= 60 && h < 120) { [r, g, b] = [x, c, 0]; }
  else if (h >= 120 && h < 180) { [r, g, b] = [0, c, x]; }
  else if (h >= 180 && h < 240) { [r, g, b] = [0, x, c]; }
  else if (h >= 240 && h < 300) { [r, g, b] = [x, 0, c]; }
  else if (h >= 300 && h < 360) { [r, g, b] = [c, 0, x]; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `${r} ${g} ${b}`;
};

const rgbStringToHex = (rgbString: string) => {
    if (!rgbString) return '#000000';
    const [r, g, b] = rgbString.split(' ').map(Number);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const hexToRgbString = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '0 0 0';
};

// --- COLOR PICKER MODAL ---

interface ColorPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newColor: string) => void;
    initialColor: string; // 'r g b'
    label: string;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onClose, onSave, initialColor, label }) => {
    const [hsl, setHsl] = useState({ h: 0, s: 0, l: 0 });
    const [hex, setHex] = useState('#000000');
    
    useEffect(() => {
        if (isOpen) {
            const initialHsl = rgbStringToHsl(initialColor);
            setHsl(initialHsl);
            setHex(rgbStringToHex(initialColor));
        }
    }, [isOpen, initialColor]);
    
    const handleHslChange = (newHsl: { h: number, s: number, l: number }) => {
        setHsl(newHsl);
        setHex(rgbStringToHex(hslToRgbString(newHsl.h, newHsl.s, newHsl.l)));
    }

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setHex(newHex);
        if (/^#[0-9A-F]{6}$/i.test(newHex)) {
            setHsl(rgbStringToHsl(hexToRgbString(newHex)));
        }
    }
    
    const handleSave = () => {
        onSave(hslToRgbString(hsl.h, hsl.s, hsl.l));
    }
    
    if (!isOpen) return null;
    
    const currentColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    const hueGradient = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
    const saturationGradient = `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`;
    const lightnessGradient = `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`;
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-surface rounded-lg shadow-2xl w-full max-w-sm p-6 space-y-6"
                style={{ borderRadius: 'var(--border-radius)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-accent">{label}</h2>
                    <div className="w-12 h-12 rounded-full border-2 border-theme" style={{ backgroundColor: currentColor }}/>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm">Hue</label>
                        <input type="range" min="0" max="360" value={hsl.h} onChange={e => handleHslChange({...hsl, h: +e.target.value})} className="w-full h-4 rounded-lg appearance-none cursor-pointer" style={{ background: hueGradient }}/>
                    </div>
                    <div>
                        <label className="text-sm">Saturation</label>
                        <input type="range" min="0" max="100" value={hsl.s} onChange={e => handleHslChange({...hsl, s: +e.target.value})} className="w-full h-4 rounded-lg appearance-none cursor-pointer" style={{ background: saturationGradient }}/>
                    </div>
                    <div>
                        <label className="text-sm">Lightness</label>
                        <input type="range" min="0" max="100" value={hsl.l} onChange={e => handleHslChange({...hsl, l: +e.target.value})} className="w-full h-4 rounded-lg appearance-none cursor-pointer" style={{ background: lightnessGradient }}/>
                    </div>
                </div>

                <div>
                    <label htmlFor="hex-input" className="text-sm">Hex</label>
                    <input id="hex-input" type="text" value={hex} onChange={handleHexChange} className="input-base text-center font-mono mt-1" />
                </div>
                
                <div className="flex justify-end space-x-4 pt-2">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn btn-accent">Save</button>
                </div>
            </div>
        </div>
    );
};


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
  const { theme, layout, activeThemeName, customTheme, changeTheme, updateCustomTheme, changeLayout, setCustomFont, removeCustomFont } = useTheme();
  const [editingColor, setEditingColor] = useState<{ key: keyof Theme['colors'], label: string, value: string } | null>(null);
  const [googleFontUrl, setGoogleFontUrl] = useState('');
  const [fontInputMode, setFontInputMode] = useState<'upload' | 'url'>('upload');
  const fontFileRef = useRef<HTMLInputElement>(null);

  const handleCustomThemeChange = (key: keyof Theme['colors'], value: string) => {
    const newColors = { ...customTheme.colors, [key]: value };
    updateCustomTheme({ ...customTheme, colors: newColors });
  };
  
  const handleComponentStyleChange = (key: keyof Theme['components'], value: string) => {
      updateCustomTheme({ ...customTheme, components: { ...customTheme.components, [key]: value }});
  }
  
  const handleTypographyChange = (key: keyof Theme['typography'], value: string) => {
      updateCustomTheme({ ...customTheme, typography: { ...customTheme.typography, [key]: value as any }});
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          updateCustomTheme({ ...customTheme, backgroundImage: e.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundImage = () => {
    const { backgroundImage, ...themeWithoutImage } = customTheme;
    updateCustomTheme(themeWithoutImage);
  };

  const handleFontFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!/\.(ttf|otf|woff|woff2)$/i.test(file.name)) {
        alert("Please select a valid font file (e.g., .ttf, .otf, .woff2).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          const fontName = file.name.replace(/\.[^/.]+$/, "");
          setCustomFont({ name: fontName, url: e.target.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoogleFontLoad = () => {
    try {
      if (!googleFontUrl.startsWith('https://fonts.googleapis.com/css')) {
        alert('Please use a valid Google Fonts share URL (starts with "https://fonts.googleapis.com/css...").');
        return;
      }
      const url = new URL(googleFontUrl);
      const families = url.searchParams.getAll('family');
      if (!families.length) {
        alert('URL does not contain a valid font family parameter.');
        return;
      }
      const fontName = families[0].split(':')[0].replace(/\+/g, ' ');
      setCustomFont({ name: fontName, url: googleFontUrl });
      setGoogleFontUrl('');
    } catch (error) {
      alert('Invalid URL. Please check the format and try again.');
    }
  };

  const fontOptions = [
    { label: 'Sans-Serif', value: 'sans' },
    { label: 'Serif', value: 'serif' },
    { label: 'Monospace', value: 'mono' },
  ];
  if (customTheme.typography.customFontUrl) {
    fontOptions.push({ label: 'Custom', value: 'custom' });
  }
  
  const colorSettings: { key: keyof Theme['colors'], label: string }[] = [
      { key: 'background', label: 'Background' },
      { key: 'surface', label: 'Surface' },
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
                <Accordion title="Colors">
                    {colorSettings.map(({ key, label }) => {
                        const colorValue = customTheme.colors[key];
                        return (
                            <div key={key} className="flex items-center justify-between">
                                <label className="text-primary">{label}</label>
                                <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono text-secondary">{rgbStringToHex(colorValue)}</span>
                                <button
                                    onClick={() => setEditingColor({ key, label, value: colorValue })}
                                    className="w-8 h-8 rounded-full border-2 border-theme"
                                    style={{ backgroundColor: `rgb(${colorValue})` }}
                                    aria-label={`Change ${label} color`}
                                />
                                </div>
                            </div>
                        );
                    })}
                </Accordion>
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
                                value={parseInt(customTheme.components.borderRadius)}
                                onChange={e => handleComponentStyleChange('borderRadius', `${e.target.value}px`)}
                                className="flex-grow"
                            />
                             <span>24px</span>
                         </div>
                    </div>
                </Accordion>
                <Accordion title="Typography & Background">
                    <div>
                      <h3 className="text-lg mb-3">Font</h3>
                      <SegmentedControl
                        options={fontOptions}
                        value={theme.typography.selectedFont}
                        onChange={(val) => handleTypographyChange('selectedFont', val)}
                      />
                       {theme.typography.selectedFont === 'custom' && theme.typography.customFontName && (
                          <p className="text-sm text-secondary mt-2">
                            Active custom font: <span className="font-semibold text-accent">{theme.typography.customFontName}</span>
                          </p>
                       )}
                    </div>
                    
                    <div className="border border-theme/50 rounded-lg p-4 space-y-4">
                        <h4 className="text-md font-semibold text-secondary">Load Custom Font</h4>
                        <div className="flex bg-surface rounded-lg p-1 border border-theme">
                            <button onClick={() => setFontInputMode('upload')} className={`w-1/2 py-1.5 rounded-md transition-colors text-sm font-medium ${fontInputMode === 'upload' ? 'bg-accent/40' : 'hover:bg-white/10'}`}>From File</button>
                            <button onClick={() => setFontInputMode('url')} className={`w-1/2 py-1.5 rounded-md transition-colors text-sm font-medium ${fontInputMode === 'url' ? 'bg-accent/40' : 'hover:bg-white/10'}`}>From URL</button>
                        </div>

                        {fontInputMode === 'upload' ? (
                            <div>
                                <button onClick={() => fontFileRef.current?.click()} className="btn btn-secondary w-full">
                                Upload Font File
                                </button>
                                <input type="file" accept=".ttf,.otf,.woff,.woff2" ref={fontFileRef} onChange={handleFontFileChange} className="hidden" />
                            </div>
                        ) : (
                            <div className="flex space-x-2">
                                <input type="text" placeholder="Paste Google Fonts URL" value={googleFontUrl} onChange={(e) => setGoogleFontUrl(e.target.value)} className="input-base flex-grow"/>
                                <button onClick={handleGoogleFontLoad} className="btn btn-secondary">Load</button>
                            </div>
                        )}

                        {customTheme.typography.customFontUrl && (
                            <button onClick={removeCustomFont} className="btn bg-red-600/20 text-red-400 hover:bg-red-600/40 w-full !mt-4">
                                Remove Custom Font
                            </button>
                        )}
                    </div>

                    <div>
                      <h3 className="text-lg mb-3">Background Image</h3>
                      <p className="text-sm text-secondary -mt-2 mb-2">Overrides the background color. Applied on top of the 'Surface' color.</p>
                      <div className="flex flex-wrap gap-4 items-center">
                          <label className="btn btn-secondary flex items-center space-x-2 cursor-pointer">
                            <UploadIcon className="w-5 h-5" />
                            <span>Upload Image</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                          {customTheme.backgroundImage && (
                            <button
                              onClick={removeBackgroundImage}
                              className="btn bg-red-600/20 text-red-400 hover:bg-red-600/40"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>
                    </div>
                </Accordion>
            </div>
          )}
        </section>
      </div>

      {editingColor && (
        <ColorPickerModal
            isOpen={!!editingColor}
            onClose={() => setEditingColor(null)}
            label={editingColor.label}
            initialColor={editingColor.value}
            onSave={(newColor) => {
                handleCustomThemeChange(editingColor.key, newColor);
                setEditingColor(null);
            }}
        />
      )}
    </div>
  );
};

export default SettingsScreen;