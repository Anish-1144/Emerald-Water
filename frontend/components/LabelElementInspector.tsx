'use client';

import { useState } from 'react';
import { useLabelEditorStore } from '@/store/useLabelEditorStore';
import { LabelElement } from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import NumericInput from '@/components/ui/NumericInput';
import {
  Trash2,
} from 'lucide-react';

interface LabelElementInspectorProps {
  element: LabelElement;
}

export default function LabelElementInspector({ element }: LabelElementInspectorProps) {
  const {
    updateElement,
    deleteElement,
  } = useLabelEditorStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">
          {element.type === 'text' ? 'Text Element' : 'Image Element'}
        </h4>
        <button
          onClick={() => deleteElement(element.id)}
          className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Text Content
            </label>
            <textarea
              value={element.data}
              onChange={(e) => updateElement(element.id, { data: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F] text-sm"
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
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Font Family
            </label>
            <select
              value={element.fontFamily || 'Arial'}
              onChange={(e) =>
                updateElement(element.id, { fontFamily: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F] text-sm"
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
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded border-2 border-white/20 cursor-pointer"
                style={{ backgroundColor: element.color || '#000000' }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <span className="text-xs text-gray-400 flex-1">
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
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Text Align
            </label>
            <select
              value={element.textAlign || 'left'}
              onChange={(e) =>
                updateElement(element.id, {
                  textAlign: e.target.value as 'left' | 'center' | 'right',
                })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F] text-sm"
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
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                element.fontWeight === 'bold'
                  ? 'bg-[#4DB64F] text-white border-[#4DB64F]'
                  : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
              }`}
            >
              Bold
            </button>
            <button
              onClick={() =>
                updateElement(element.id, {
                  fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
                })
              }
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                element.fontStyle === 'italic'
                  ? 'bg-[#4DB64F] text-white border-[#4DB64F]'
                  : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
              }`}
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
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                element.textDecoration === 'underline'
                  ? 'bg-[#4DB64F] text-white border-[#4DB64F]'
                  : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
              }`}
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

