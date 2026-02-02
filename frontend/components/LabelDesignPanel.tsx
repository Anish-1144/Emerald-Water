'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useLabelEditorStore,
  drawElementOnCanvas,
} from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import LabelEditorModal from '@/components/LabelEditorModal';
import LabelElementInspector from '@/components/LabelElementInspector';
import {
  Type,
  Image as ImageIcon,
  Edit3,
} from 'lucide-react';

interface LabelDesignPanelProps {
  capColor: string;
  setCapColor: (color: string) => void;
  setLabelTexture: (texture: string | null) => void;
  showColorPicker: string | null;
  setShowColorPicker: (picker: string | null) => void;
  onClearUploadedImage?: () => void;
}

export default function LabelDesignPanel({
  capColor,
  setCapColor,
  setLabelTexture,
  showColorPicker,
  setShowColorPicker,
  onClearUploadedImage,
}: LabelDesignPanelProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const {
    backgroundColor,
    elements,
    canvasWidth,
    canvasHeight,
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

  // Render preview canvas
  useEffect(() => {
    const renderPreview = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate preview size maintaining aspect ratio
      // Use a reasonable max width that fits well in the panel
      const maxPreviewWidth = 400;
      const aspectRatio = canvasWidth / canvasHeight;
      const parentWidth = canvas.parentElement?.clientWidth;
      const previewWidth = Math.min(maxPreviewWidth, parentWidth ? parentWidth - 32 : maxPreviewWidth);
      const previewHeight = previewWidth / aspectRatio;
      
      // Set canvas dimensions with high DPI support
      const dpr = window.devicePixelRatio || 1;
      canvas.width = previewWidth * dpr;
      canvas.height = previewHeight * dpr;
      canvas.style.width = `${previewWidth}px`;
      canvas.style.height = `${previewHeight}px`;
      ctx.scale(dpr, dpr);

      const scale = previewWidth / canvasWidth;

      // Clear canvas
      ctx.clearRect(0, 0, previewWidth, previewHeight);

      // Draw background
      ctx.fillStyle = backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, previewWidth, previewHeight);

      // Draw grid pattern if transparent
      if (backgroundColor === 'transparent' || (backgroundColor && backgroundColor.includes('rgba'))) {
        const gridSize = 10;
        ctx.fillStyle = '#f0f0f0';
        for (let x = 0; x < previewWidth; x += gridSize * 2) {
          for (let y = 0; y < previewHeight; y += gridSize * 2) {
            ctx.fillRect(x, y, gridSize, gridSize);
            ctx.fillRect(x + gridSize, y + gridSize, gridSize, gridSize);
          }
        }
      }

      // Draw all elements
      const drawElements = () => {
        elements.forEach((element) => {
          const scaledElement = {
            ...element,
            x: element.x * scale,
            y: element.y * scale,
            width: element.width * scale,
            height: element.height * scale,
          };

          if (element.type === 'image') {
            // Use cached image or load it
            let img = imageCacheRef.current.get(element.data);
            if (!img) {
              img = new Image();
              img.onload = () => {
                renderPreview(); // Re-render when image loads
              };
              img.src = element.data;
              imageCacheRef.current.set(element.data, img);
            }

            // Draw if loaded
            if (img.complete && img.naturalWidth > 0) {
              ctx.save();
              const centerX = scaledElement.x + scaledElement.width / 2;
              const centerY = scaledElement.y + scaledElement.height / 2;
              ctx.translate(centerX, centerY);
              ctx.rotate((scaledElement.rotation * Math.PI) / 180);
              ctx.scale(scaledElement.scaleX, scaledElement.scaleY);
              ctx.translate(-centerX, -centerY);
              ctx.drawImage(img, scaledElement.x, scaledElement.y, scaledElement.width, scaledElement.height);
              ctx.restore();
            }
          } else {
            drawElementOnCanvas(ctx, scaledElement, previewWidth, previewHeight);
          }
        });
      };

      drawElements();
    };

    // Initial render
    renderPreview();

    // Add resize observer to handle container size changes
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      renderPreview();
    });

    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [elements, backgroundColor, canvasWidth, canvasHeight]);

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
          const maxWidth = 2081 * 0.8;
          const maxHeight = 544 * 0.8;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = width * scale;
            height = height * scale;
          }

          // Clear uploaded image when user starts designing
          if (onClearUploadedImage) {
            onClearUploadedImage();
          }
          
          addElement({
            type: 'image',
            x: (2081 - width) / 2,
            y: (544 - height) / 2,
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
    // Clear uploaded image when user starts designing
    if (onClearUploadedImage) {
      onClearUploadedImage();
    }
    addElement({
      type: 'text',
      x: 2081 / 2 - 100,
      y: 544 / 2 - 12,
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

  // Handle apply design to bottle
  const handleApplyDesign = async () => {
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
      console.error('Error applying design:', error);
      alert('Error applying design. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cap Color Section */}
      <div 
        className="p-4 border-b transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <label 
          className="block text-sm font-medium mb-3 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Cap Color
        </label>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg border-2 cursor-pointer shadow-lg hover:scale-105 transition-transform"
            style={{ 
              backgroundColor: capColor,
              borderColor: 'var(--border-color)'
            }}
            onClick={() => setShowColorPicker(showColorPicker === 'cap' ? null : 'cap')}
          />
          <div className="flex-1">
            <p 
              className="text-xs mb-1 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Click to change cap color
            </p>
            <p 
              className="text-sm font-mono transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {capColor.toUpperCase()}
            </p>
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

      {/* Canvas Preview */}
      <div 
        className="p-4 border-b transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h3 
          className="text-sm font-semibold mb-3 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Preview
        </h3>
        <div 
          className="w-full border rounded-lg overflow-hidden flex items-center justify-center p-4 transition-colors"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border-color)',
            minHeight: '100px'
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{ 
              display: 'block',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="w-full mt-4 px-4 py-3 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" />
          Open Label Editor
        </button>
      </div>

      {/* Quick Actions */}
      <div 
        className="p-4 border-b transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h3 
          className="text-sm font-semibold mb-3 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddText}
            className="px-4 py-3 border rounded-lg flex items-center justify-center gap-2 transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">Add Text</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 border rounded-lg flex items-center justify-center gap-2 transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
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
        <div 
          className="p-4 border-b transition-colors"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h3 
            className="text-sm font-semibold mb-3 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Elements ({elements.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {elements.map((element, index) => (
              <div
                key={element.id}
                onClick={() => selectElement(element.id)}
                className="p-2 rounded-lg border cursor-pointer transition-colors"
                style={{
                  backgroundColor: element.selected ? 'rgba(77, 182, 79, 0.2)' : 'var(--card-bg)',
                  borderColor: element.selected ? '#4DB64F' : 'var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  if (!element.selected) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!element.selected) {
                    e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {element.type === 'text' ? (
                    <Type 
                      className="w-4 h-4 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  ) : (
                    <ImageIcon 
                      className="w-4 h-4 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  )}
                  <span 
                    className="text-sm transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {element.type === 'text'
                      ? `Text: "${element.data.substring(0, 20)}${element.data.length > 20 ? '...' : ''}"`
                      : 'Image'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Element Inspector */}
      {selectedElement && (
        <div 
          className="p-4 border-b transition-colors"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <LabelElementInspector element={selectedElement} />
        </div>
      )}

      {/* Apply Design */}
      <div 
        className="p-4 border-b transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <button
          onClick={handleApplyDesign}
          className="w-full px-4 py-3 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" />
          Apply Design
        </button>
      </div>

      {/* Info */}
      <div 
        className="p-4 text-xs transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <p>Canvas Size: 2081 × 544px</p>
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

