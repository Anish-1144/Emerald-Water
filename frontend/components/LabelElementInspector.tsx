'use client';

import { useState } from 'react';
import { useLabelEditorStore } from '@/store/useLabelEditorStore';
import { LabelElement } from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import NumericInput from '@/components/ui/NumericInput';

interface LabelElementInspectorProps {
  element: LabelElement;
}

export default function LabelElementInspector({ element }: LabelElementInspectorProps) {
  const {
    updateElement,
  } = useLabelEditorStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h4 
          className="text-sm font-semibold transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {element.type === 'text' ? 'Text Element' : 'Image Element'}
        </h4>
      </div>

      {/* Position & Size */}
      <div className="grid grid-cols-2 gap-2">
        <NumericInput
          label="X"
          value={Math.round(element.x)}
          onChange={(value) => updateElement(element.id, { x: value })}
        />
        <NumericInput
          label="Y"
          value={Math.round(element.y)}
          onChange={(value) => updateElement(element.id, { y: value })}
        />
        <NumericInput
          label="Width"
          value={Math.round(element.width)}
          onChange={(value) => updateElement(element.id, { width: value })}
          min={10}
        />
        <NumericInput
          label="Height"
          value={Math.round(element.height)}
          onChange={(value) => updateElement(element.id, { height: value })}
          min={10}
        />
      </div>

      {/* Rotation */}
      <NumericInput
        label="Rotation"
        value={Math.round(element.rotation)}
        onChange={(value) => updateElement(element.id, { rotation: value })}
        min={0}
        max={360}
      />

      {/* Text-specific controls */}
      {element.type === 'text' && (
        <>
          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Text Content
            </label>
            <textarea
              value={element.data}
              onChange={(e) => updateElement(element.id, { data: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] text-sm transition-colors"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
              rows={2}
            />
          </div>

          <NumericInput
            label="Font Size"
            value={element.fontSize || 24}
            onChange={(value) => updateElement(element.id, { fontSize: value })}
            min={8}
            max={200}
          />

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Font Family
            </label>
            <select
              value={element.fontFamily || 'Arial'}
              onChange={(e) =>
                updateElement(element.id, { fontFamily: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] text-sm transition-colors"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Palatino">Palatino</option>
              <option value="Garamond">Garamond</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Impact">Impact</option>
            </select>
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded border-2 cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: element.color || '#000000',
                  borderColor: 'var(--border-color)'
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <span 
                className="text-xs flex-1 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {(element.color || '#000000').toUpperCase()}
              </span>
            </div>
            {showColorPicker && (
              <div className="mt-2">
                <FigmaColorPicker
                  color={element.color || '#000000'}
                  onChange={(color) => updateElement(element.id, { color })}
                />
              </div>
            )}
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Text Align
            </label>
            <select
              value={element.textAlign || 'left'}
              onChange={(e) =>
                updateElement(element.id, {
                  textAlign: e.target.value as 'left' | 'center' | 'right',
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] text-sm transition-colors"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                updateElement(element.id, {
                  fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
              className="flex-1 px-3 py-2 rounded-lg border transition-colors text-sm"
              style={{
                backgroundColor: element.fontWeight === 'bold' ? '#4DB64F' : 'var(--card-bg)',
                borderColor: element.fontWeight === 'bold' ? '#4DB64F' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (element.fontWeight !== 'bold') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (element.fontWeight !== 'bold') {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
            >
              Bold
            </button>
            <button
              onClick={() =>
                updateElement(element.id, {
                  fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className="flex-1 px-3 py-2 rounded-lg border transition-colors text-sm"
              style={{
                backgroundColor: element.fontStyle === 'italic' ? '#4DB64F' : 'var(--card-bg)',
                borderColor: element.fontStyle === 'italic' ? '#4DB64F' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (element.fontStyle !== 'italic') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (element.fontStyle !== 'italic') {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
            >
              Italic
            </button>
            <button
              onClick={() =>
                updateElement(element.id, {
                  textDecoration:
                    element.textDecoration === 'underline' ? 'none' : 'underline',
                })
              }
              className="flex-1 px-3 py-2 rounded-lg border transition-colors text-sm"
              style={{
                backgroundColor: element.textDecoration === 'underline' ? '#4DB64F' : 'var(--card-bg)',
                borderColor: element.textDecoration === 'underline' ? '#4DB64F' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (element.textDecoration !== 'underline') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (element.textDecoration !== 'underline') {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
            >
              Underline
            </button>
          </div>

          <NumericInput
            label="Letter Spacing"
            value={element.letterSpacing || 0}
            onChange={(value) => updateElement(element.id, { letterSpacing: value })}
            min={-10}
            max={20}
            step={0.1}
          />
        </>
      )}

    </div>
  );
}

