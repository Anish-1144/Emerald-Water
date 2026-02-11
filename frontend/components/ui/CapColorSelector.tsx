'use client';

import { useState, useRef, useEffect } from 'react';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import { getCapColorPrice, hexToCapColor, type CapColor } from '@/lib/pricing';

interface CapColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export default function CapColorSelector({ selectedColor, onColorChange }: CapColorSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedOption, setSelectedOption] = useState<CapColor | 'custom'>('white');
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Determine current selection based on color
  useEffect(() => {
    const capColor = hexToCapColor(selectedColor);
    if (capColor === 'white' || capColor === 'black' || capColor === 'blue') {
      setSelectedOption(capColor);
      setShowColorPicker(false);
    } else {
      setSelectedOption('custom');
    }
  }, [selectedColor]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside the color picker container
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        // Check if it's a color button - if so, let handleColorOptionClick handle it
        const isColorButton = (target as Element)?.closest('[data-cap-color-button]');
        if (!isColorButton) {
          setShowColorPicker(false);
        }
      }
    };

    if (showColorPicker) {
      // Use a small delay to allow button clicks to process first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColorPicker]);

  const handleColorOptionClick = (option: CapColor | 'custom') => {
    setSelectedOption(option);
    
    if (option === 'white') {
      onColorChange('#FFFFFF');
      setShowColorPicker(false);
    } else if (option === 'black') {
      onColorChange('#000000');
      setShowColorPicker(false);
    } else if (option === 'blue') {
      onColorChange('#0000FF');
      setShowColorPicker(false);
    } else if (option === 'custom') {
      setShowColorPicker(true);
    }
  };

  const handleCustomColorChange = (color: string) => {
    onColorChange(color);
  };

  const getPriceText = (option: CapColor | 'custom'): string => {
    if (option === 'white') return 'Free (White caps included)';
    if (option === 'black') return '$0.05 per cap';
    if (option === 'blue') return '$0.08 per cap';
    if (option === 'custom') {
      const capColor = hexToCapColor(selectedColor);
      const price = getCapColorPrice(capColor);
      if (price === 0) return 'Free';
      return `$${price.toFixed(2)} per cap`;
    }
    return '';
  };

  return (
    <div className="py-1">
      <label 
        className="block text-xs font-medium mb-2 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        Cap Color
      </label>
      
      {/* Single Row Layout: Color Swatch + Text + Color Options */}
      <div className="flex items-center gap-3 mb-3">
        {/* Large Color Swatch */}
        <button
          onClick={() => {
            if (selectedOption !== 'custom') {
              setSelectedOption('custom');
            }
            setShowColorPicker(!showColorPicker);
          }}
          className="w-14 h-14 rounded-xl border-2 transition-all hover:scale-105 shadow-md flex-shrink-0 cursor-pointer"
          style={{ 
            backgroundColor: selectedColor,
            borderColor: 'var(--border-color)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
        </button>
        
        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <div 
            className="text-xs mb-0.5 transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => {
              if (selectedOption !== 'custom') {
                setSelectedOption('custom');
              }
              setShowColorPicker(!showColorPicker);
            }}
          >
            Click to change cap color
          </div>
          <div 
            className="text-xs font-mono mb-0.5 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {selectedColor.toUpperCase()}
          </div>
          <div 
            className="text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {getPriceText(selectedOption)}
          </div>
        </div>

        {/* Color Options in Rounded Circles */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* White */}
          <button
            data-cap-color-button
            onClick={() => handleColorOptionClick('white')}
            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
              selectedOption === 'white' 
                ? 'ring-2 ring-[#4DB64F] scale-110' 
                : 'hover:scale-105'
            }`}
            style={{ 
              backgroundColor: '#FFFFFF',
              borderColor: selectedOption === 'white' ? '#4DB64F' : 'var(--border-color)',
              boxShadow: selectedOption === 'white' ? '0 0 0 2px rgba(77, 182, 79, 0.2)' : 'none'
            }}
            title="White – Free (no extra charge)"
          >
            {selectedOption === 'white' && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#4DB64F] rounded-full border-2 border-white" />
            )}
          </button>

          {/* Black */}
          <button
            data-cap-color-button
            onClick={() => handleColorOptionClick('black')}
            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
              selectedOption === 'black' 
                ? 'ring-2 ring-[#4DB64F] scale-110' 
                : 'hover:scale-105'
            }`}
            style={{ 
              backgroundColor: '#000000',
              borderColor: selectedOption === 'black' ? '#4DB64F' : 'var(--border-color)',
              boxShadow: selectedOption === 'black' ? '0 0 0 2px rgba(77, 182, 79, 0.2)' : 'none'
            }}
            title="Black – $0.05 per cap"
          >
            {selectedOption === 'black' && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#4DB64F] rounded-full border-2 border-white" />
            )}
          </button>

          {/* Blue */}
          <button
            data-cap-color-button
            onClick={() => handleColorOptionClick('blue')}
            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
              selectedOption === 'blue' 
                ? 'ring-2 ring-[#4DB64F] scale-110' 
                : 'hover:scale-105'
            }`}
            style={{ 
              backgroundColor: '#0000FF',
              borderColor: selectedOption === 'blue' ? '#4DB64F' : 'var(--border-color)',
              boxShadow: selectedOption === 'blue' ? '0 0 0 2px rgba(77, 182, 79, 0.2)' : 'none'
            }}
            title="Blue – $0.08 per cap"
          >
            {selectedOption === 'blue' && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#4DB64F] rounded-full border-2 border-white" />
            )}
          </button>

          {/* Many other colours */}
          <button
            data-cap-color-button
            onClick={() => handleColorOptionClick('custom')}
            className={`relative w-10 h-10 rounded-full border-2 transition-all ${
              selectedOption === 'custom' 
                ? 'ring-2 ring-[#4DB64F] scale-110' 
                : 'hover:scale-105'
            }`}
            style={{ 
              borderColor: selectedOption === 'custom' ? '#4DB64F' : 'var(--border-color)',
              boxShadow: selectedOption === 'custom' ? '0 0 0 2px rgba(77, 182, 79, 0.2)' : 'none',
              background: selectedOption === 'custom' 
                ? selectedColor 
                : 'linear-gradient(45deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 57%, #4b0082 71%, #9400d3 85%, #ff0000 100%)'
            }}
            title="Many other colours – $0.08 per cap"
          >
            {selectedOption === 'custom' && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#4DB64F] rounded-full border-2 border-white" />
            )}
            {selectedOption !== 'custom' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white drop-shadow-md">+</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Color Picker (shown when custom is selected or clicked) */}
      {showColorPicker && (
        <div 
          ref={colorPickerRef}
          className="mb-3"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px'
          }}
        >
          <FigmaColorPicker
            color={selectedColor}
            onChange={handleCustomColorChange}
          />
        </div>
      )}
    </div>
  );
}

