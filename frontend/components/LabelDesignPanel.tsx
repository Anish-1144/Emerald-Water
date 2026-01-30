'use client';

import { useState, useRef } from 'react';
import {
  useLabelEditorStore,
} from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import LabelEditorModal from '@/components/LabelEditorModal';
import LabelElementInspector from '@/components/LabelElementInspector';
import {
  Type,
  Image as ImageIcon,
  Download,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  FlipVertical,
  Undo,
  Redo,
  Edit3,
} from 'lucide-react';

interface LabelDesignPanelProps {
  capColor: string;
  setCapColor: (color: string) => void;
  setLabelTexture: (texture: string | null) => void;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
}

export default function LabelDesignPanel({
  capColor,
  setCapColor,
  setLabelTexture,
  showColorPicker,
  setShowColorPicker,
}: LabelDesignPanelProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    backgroundColor,
    elements,
    setBackgroundColor,
    addElement,
    deleteElement,
    selectElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    flipHorizontal,
    flipVertical,
    undo,
    redo,
    canUndo,
    canRedo,
    exportCanvas,
  } = useLabelEditorStore();

  const selectedElement = elements.find((el) => el.selected);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Auto-scale to fit canvas (max 80% of canvas size)
          const maxWidth = 2048 * 0.8;
          const maxHeight = 1024 * 0.8;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = width * scale;
            height = height * scale;
          }

          addElement({
            type: 'image',
            x: (2048 - width) / 2,
            y: (1024 - height) / 2,
            width,
            height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            data: imageData,
          });
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle add text
  const handleAddText = () => {
    addElement({
      type: 'text',
      x: 2048 / 2 - 100,
      y: 1024 / 2 - 12,
      width: 200,
      height: 24,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      data: 'New Text',
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      textAlign: 'center',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      letterSpacing: 0,
    });
  };

  // Handle export
  const handleExport = async () => {
    try {
      const base64Image = await exportCanvas();
      if (base64Image) {
        setLabelTexture(base64Image);
        // Force a small delay to ensure texture updates
        setTimeout(() => {
          // Trigger a re-render by updating the store
          useLabelEditorStore.setState({});
        }, 50);
      }
    } catch (error) {
      console.error('Error exporting label:', error);
      alert('Error exporting label. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cap Color Section */}
      <div className="p-4 border-b border-white/10">
        <label className="block text-sm font-medium mb-3 text-gray-300">Cap Color</label>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg border-2 border-white/20 cursor-pointer shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: capColor }}
            onClick={() => setShowColorPicker(showColorPicker === 'cap' ? null : 'cap')}
          />
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Click to change cap color</p>
            <p className="text-sm text-white font-mono">{capColor.toUpperCase()}</p>
          </div>
        </div>
        {showColorPicker === 'cap' && (
          <div className="mt-4">
            <FigmaColorPicker
              color={capColor}
              onChange={(color) => setCapColor(color)}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddText}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">Add Text</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">Add Image</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>


      {/* Elements List */}
      {elements.length > 0 && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">
              Elements ({elements.length})
            </h3>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="px-3 py-1.5 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              Open Editor
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {elements.map((element, index) => (
              <div
                key={element.id}
                onClick={() => selectElement(element.id)}
                className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                  element.selected
                    ? 'bg-[#4DB64F]/20 border-[#4DB64F]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {element.type === 'text' ? (
                      <Type className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-white">
                      {element.type === 'text'
                        ? `Text: "${element.data.substring(0, 20)}${element.data.length > 20 ? '...' : ''}"`
                        : 'Image'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(element.id);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Element Inspector */}
      {selectedElement && (
        <div className="p-4 border-b border-white/10">
          <LabelElementInspector element={selectedElement} />
        </div>
      )}

      {/* Editor Actions */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <button
          onClick={() => setIsEditorOpen(true)}
          className="w-full px-4 py-3 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" />
          Open Label Editor
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Undo className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Redo className="w-4 h-4" />
            Redo
          </button>
        </div>
        <button
          onClick={handleExport}
          className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export Label
        </button>
      </div>

      {/* Info */}
      <div className="p-4 text-xs text-gray-500">
        <p>Canvas Size: 2048 × 1024px</p>
        <p className="mt-1">Click "Open Label Editor" to design your label</p>
      </div>

      {/* Modal */}
      <LabelEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onExport={(base64Image) => {
          setLabelTexture(base64Image);
          setIsEditorOpen(false);
        }}
      />
    </div>
  );
}

