'use client';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export default function NumericInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  className = '',
}: NumericInputProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-1 text-gray-300">
          {label}
        </label>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const numValue = parseFloat(e.target.value) || 0;
          let finalValue = numValue;
          if (min !== undefined && finalValue < min) finalValue = min;
          if (max !== undefined && finalValue > max) finalValue = max;
          onChange(finalValue);
        }}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
      />
    </div>
  );
}



