'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disableAlpha?: boolean;
}

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFD700',
  '#4B0082', '#FF6347', '#00CED1', '#32CD32', '#FF1493',
];

export default function FigmaColorPicker({ color, onChange, disableAlpha = true }: ColorPickerProps) {
  const [hsl, setHsl] = useState(() => {
    const rgb = hexToRgb(color);
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  });
  const [rgb, setRgb] = useState(() => hexToRgb(color));
  const [hex, setHex] = useState(color.toUpperCase());
  const spectrumRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [isDraggingSpectrum, setIsDraggingSpectrum] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Update state when color prop changes externally
  useEffect(() => {
    const newRgb = hexToRgb(color);
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setRgb(newRgb);
    setHsl(newHsl);
    setHex(color.toUpperCase());
  }, [color]);

  const updateColor = (newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    onChange(newHex);
  };

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spectrumRef.current) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newHsl = {
      h: hsl.h,
      s: x * 100,
      l: (1 - y) * 100,
    };
    updateColor(newHsl);
  };

  const handleSpectrumDrag = useCallback((e: MouseEvent) => {
    if (!spectrumRef.current || !isDraggingSpectrum) return;
    const rect = spectrumRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    setHsl((currentHsl) => {
      const newHsl = {
        h: currentHsl.h,
        s: x * 100,
        l: (1 - y) * 100,
      };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      setRgb(newRgb);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setHex(newHex);
      onChange(newHex);
      return newHsl;
    });
  }, [isDraggingSpectrum, onChange]);

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    
    const newHsl = { ...hsl, h };
    updateColor(newHsl);
  };

  const handleHueDrag = useCallback((e: MouseEvent) => {
    if (!hueRef.current || !isDraggingHue) return;
    const rect = hueRef.current.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    
    setHsl((currentHsl) => {
      const newHsl = { ...currentHsl, h };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      setRgb(newRgb);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setHex(newHex);
      onChange(newHex);
      return newHsl;
    });
  }, [isDraggingHue, onChange]);

  useEffect(() => {
    if (isDraggingSpectrum) {
      const handleMouseUp = () => setIsDraggingSpectrum(false);
      document.addEventListener('mousemove', handleSpectrumDrag);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleSpectrumDrag);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingSpectrum, handleSpectrumDrag]);

  useEffect(() => {
    if (isDraggingHue) {
      const handleMouseUp = () => setIsDraggingHue(false);
      document.addEventListener('mousemove', handleHueDrag);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleHueDrag);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingHue, handleHueDrag]);

  // Create gradient for spectrum
  const spectrumStyle = {
    background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsl.h}, 100%, 50%))`,
  };

  // Create gradient for hue slider
  const hueGradient = `linear-gradient(to right, 
    hsl(0, 100%, 50%), 
    hsl(60, 100%, 50%), 
    hsl(120, 100%, 50%), 
    hsl(180, 100%, 50%), 
    hsl(240, 100%, 50%), 
    hsl(300, 100%, 50%), 
    hsl(360, 100%, 50%))`;

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [component]: Math.max(0, Math.min(255, value)) };
    setRgb(newRgb);
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHsl(newHsl);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    onChange(newHex);
  };

  const handleHexChange = (value: string) => {
    setHex(value.toUpperCase());
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const newRgb = hexToRgb(value);
      setRgb(newRgb);
      const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
      setHsl(newHsl);
      onChange(value);
    }
  };

  return (
    <div className="bg-[#2A2A2A] rounded-xl p-4 border border-[#4DB64F]/30 shadow-xl w-full max-w-sm">
      {/* Color Spectrum */}
      <div className="mb-4">
        <div
          ref={spectrumRef}
          className="w-full h-48 rounded-lg cursor-crosshair relative overflow-hidden border border-white/20"
          style={spectrumStyle}
          onMouseDown={(e) => {
            setIsDraggingSpectrum(true);
            handleSpectrumClick(e);
          }}
        >
          {/* Color picker indicator */}
          <div
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${hsl.s}%`,
              top: `${100 - hsl.l}%`,
            }}
          />
        </div>
      </div>

      {/* Hue Slider */}
      <div className="mb-4">
        <div
          ref={hueRef}
          className="w-full h-6 rounded-md cursor-pointer relative overflow-hidden border border-white/20"
          style={{ background: hueGradient }}
          onMouseDown={(e) => {
            setIsDraggingHue(true);
            handleHueClick(e);
          }}
        >
          {/* Hue indicator */}
          <div
            className="absolute w-2 h-full border-2 border-white shadow-lg pointer-events-none transform -translate-x-1/2"
            style={{
              left: `${(hsl.h / 360) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* RGB Inputs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className="block text-xs font-medium text-[#4DB64F] mb-1">R</label>
          <input
            type="number"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-[#1E1E1E] border border-[#4DB64F]/50 rounded-md text-[#4DB64F] text-sm focus:outline-none focus:ring-2 focus:ring-[#4DB64F] focus:border-[#4DB64F] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4DB64F] mb-1">G</label>
          <input
            type="number"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-[#1E1E1E] border border-[#4DB64F]/50 rounded-md text-[#4DB64F] text-sm focus:outline-none focus:ring-2 focus:ring-[#4DB64F] focus:border-[#4DB64F] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4DB64F] mb-1">B</label>
          <input
            type="number"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1.5 bg-[#1E1E1E] border border-[#4DB64F]/50 rounded-md text-[#4DB64F] text-sm focus:outline-none focus:ring-2 focus:ring-[#4DB64F] focus:border-[#4DB64F] transition-all"
          />
        </div>
      </div>

      {/* Hex Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#4DB64F] mb-1">Hex</label>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md border-2 border-[#4DB64F]/50 flex-shrink-0"
            style={{ backgroundColor: hex }}
          />
          <input
            type="text"
            value={hex}
            onChange={(e) => handleHexChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-[#1E1E1E] border border-[#4DB64F]/50 rounded-md text-[#4DB64F] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4DB64F] focus:border-[#4DB64F] transition-all"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Preset Colors */}
      <div>
        <label className="block text-xs font-medium text-[#4DB64F] mb-2">Presets</label>
        <div className="grid grid-cols-10 gap-1.5">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => {
                handleHexChange(presetColor);
              }}
              className="w-full aspect-square rounded-md border-2 transition-all hover:scale-110 hover:border-[#4DB64F] focus:outline-none focus:ring-2 focus:ring-[#4DB64F]"
              style={{
                backgroundColor: presetColor,
                borderColor: hex === presetColor.toUpperCase() ? '#4DB64F' : 'rgba(77, 182, 79, 0.3)',
              }}
              title={presetColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}







