'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ThemeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export default function ThemeSelect({ value, onChange, options, className = '' }: ThemeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] transition-colors flex items-center justify-between"
        style={{ 
          backgroundColor: 'var(--input-bg)', 
          borderColor: 'var(--input-border)',
          color: 'var(--text-primary)'
        }}
      >
        <span className="text-sm">{selectedOption.label}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm transition-colors"
              style={{
                backgroundColor: value === option.value 
                  ? 'rgba(77, 182, 79, 0.2)' 
                  : 'var(--card-bg)',
                color: value === option.value ? '#4DB64F' : 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

