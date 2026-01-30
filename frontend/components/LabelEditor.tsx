'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useLabelEditorStore,
  drawElementOnCanvas,
  LabelElement,
} from '@/store/useLabelEditorStore';
import {
  isPointInElement,
  getResizeHandle,
  getCursorForHandle,
  calculateResize,
  calculateRotation,
  getElementCorners,
} from '@/lib/canvasUtils';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import NumericInput from '@/components/ui/NumericInput';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  FlipVertical,
  Undo,
  Redo,
  Download,
  Type,
  Image as ImageIcon,
} from 'lucide-react';

const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 1024;
const SCALE = 0.5; // Display scale for UI (canvas is 2048x1024, displayed at 50%)

interface LabelEditorProps {
  onExport?: (base64Image: string) => void;
}

export default function LabelEditor({ onExport }: LabelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(SCALE);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<
    'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | null
  >(null);
  const [hoverHandle, setHoverHandle] = useState<
    'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | null
  >(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const {
    backgroundColor,
    elements,
    setBackgroundColor,
    addElement,
    updateElement,
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

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback(
    (x: number, y: number) => {
      if (!containerRef.current) return { x, y };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (x - rect.left) / displayScale,
        y: (y - rect.top) / displayScale,
      };
    },
    [displayScale]
  );

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (x: number, y: number) => {
      if (!containerRef.current) return { x, y };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (x - rect.left) / displayScale,
        y: (y - rect.top) / displayScale,
      };
    },
    [displayScale]
  );

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH * displayScale;
    canvas.height = CANVAS_HEIGHT * displayScale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern for transparency indication
    if (backgroundColor === 'transparent' || backgroundColor.includes('rgba')) {
      const gridSize = 20 * displayScale;
      ctx.fillStyle = '#f0f0f0';
      for (let x = 0; x < canvas.width; x += gridSize * 2) {
        for (let y = 0; y < canvas.height; y += gridSize * 2) {
          ctx.fillRect(x, y, gridSize, gridSize);
          ctx.fillRect(x + gridSize, y + gridSize, gridSize, gridSize);
        }
      }
    }

    // Draw all elements
    elements.forEach((element) => {
      const scaledElement = {
        ...element,
        x: element.x * displayScale,
        y: element.y * displayScale,
        width: element.width * displayScale,
        height: element.height * displayScale,
      };
      
      if (element.type === 'image') {
        // Use cached image or load it
        let img = imageCacheRef.current.get(element.data);
        if (!img) {
          img = new Image();
          img.onload = () => {
            // Re-render when image loads
            renderCanvas();
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
          ctx.drawImage(
            img,
            scaledElement.x,
            scaledElement.y,
            scaledElement.width,
            scaledElement.height
          );
          ctx.restore();
        }
      } else {
        drawElementOnCanvas(ctx, scaledElement, canvas.width, canvas.height);
      }
    });

    // Draw selection box and handles for selected element
    if (selectedElement) {
      ctx.strokeStyle = '#4DB64F';
      ctx.lineWidth = 2 / displayScale;
      ctx.setLineDash([5 / displayScale, 5 / displayScale]);

      const corners = getElementCorners({
        ...selectedElement,
        x: selectedElement.x * displayScale,
        y: selectedElement.y * displayScale,
        width: selectedElement.width * displayScale,
        height: selectedElement.height * displayScale,
      });

      // Draw selection box
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw resize handles
      const handleSize = 8 / displayScale;
      const centerX = (selectedElement.x + selectedElement.width / 2) * displayScale;
      const centerY = (selectedElement.y + selectedElement.height / 2) * displayScale;
      const rotation = (selectedElement.rotation * Math.PI) / 180;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      const halfWidth = (selectedElement.width * Math.abs(selectedElement.scaleX) * displayScale) / 2;
      const halfHeight = (selectedElement.height * Math.abs(selectedElement.scaleY) * displayScale) / 2;

      const handles = [
        { x: -halfWidth, y: -halfHeight, name: 'nw' },
        { x: halfWidth, y: -halfHeight, name: 'ne' },
        { x: -halfWidth, y: halfHeight, name: 'sw' },
        { x: halfWidth, y: halfHeight, name: 'se' },
        { x: 0, y: -halfHeight, name: 'n' },
        { x: 0, y: halfHeight, name: 's' },
        { x: halfWidth, y: 0, name: 'e' },
        { x: -halfWidth, y: 0, name: 'w' },
      ];

      handles.forEach((handle) => {
        const worldX = centerX + handle.x * cos - handle.y * sin;
        const worldY = centerY + handle.x * sin + handle.y * cos;

        ctx.fillStyle = '#4DB64F';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / displayScale;
        ctx.beginPath();
        ctx.arc(worldX, worldY, handleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Draw rotation handle
      const rotateHandleY = -halfHeight - 30 / displayScale;
      const rotateHandleX = centerX + 0 * cos - rotateHandleY * sin;
      const rotateHandleYWorld = centerY + 0 * sin + rotateHandleY * cos;

      ctx.fillStyle = '#4DB64F';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / displayScale;
      ctx.beginPath();
      ctx.arc(rotateHandleX, rotateHandleYWorld, handleSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw rotation line
      ctx.strokeStyle = '#4DB64F';
      ctx.lineWidth = 1 / displayScale;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - halfHeight);
      ctx.lineTo(rotateHandleX, rotateHandleYWorld);
      ctx.stroke();
    }
  }, [elements, selectedElement, backgroundColor, displayScale]);

  // Re-render when state changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / displayScale;
    const canvasY = (e.clientY - rect.top) / displayScale;

    // Check if clicking on a resize handle
    if (selectedElement) {
      const handle = getResizeHandle(canvasX, canvasY, selectedElement);
      if (handle) {
        if (handle === 'rotate') {
          setIsRotating(true);
        } else {
          setIsResizing(true);
          setActiveHandle(handle);
        }
        setDragStart({ x: canvasX, y: canvasY });
        return;
      }
    }

    // Check if clicking on an element
    let clickedElement: LabelElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (isPointInElement(canvasX, canvasY, elements[i])) {
        clickedElement = elements[i];
        break;
      }
    }

    if (clickedElement) {
      selectElement(clickedElement.id);
      setIsDragging(true);
      setDragStart({ x: canvasX, y: canvasY });
    } else {
      selectElement(null);
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / displayScale;
    const canvasY = (e.clientY - rect.top) / displayScale;

    // Update cursor
    if (!isDragging && !isResizing && !isRotating && selectedElement) {
      const handle = getResizeHandle(canvasX, canvasY, selectedElement);
      setHoverHandle(handle);
      if (handle) {
        canvasRef.current!.style.cursor = getCursorForHandle(handle);
      } else if (isPointInElement(canvasX, canvasY, selectedElement)) {
        canvasRef.current!.style.cursor = 'move';
      } else {
        canvasRef.current!.style.cursor = 'default';
      }
    }

    if (isRotating && selectedElement) {
      const newRotation = calculateRotation(selectedElement, canvasX, canvasY);
      updateElement(selectedElement.id, { rotation: newRotation });
    } else if (isResizing && selectedElement && activeHandle) {
      const deltaX = canvasX - dragStart.x;
      const deltaY = canvasY - dragStart.y;
      const updates = calculateResize(selectedElement, activeHandle, deltaX, deltaY);
      updateElement(selectedElement.id, updates);
      setDragStart({ x: canvasX, y: canvasY });
    } else if (isDragging && selectedElement) {
      const deltaX = canvasX - dragStart.x;
      const deltaY = canvasY - dragStart.y;
      updateElement(selectedElement.id, {
        x: selectedElement.x + deltaX,
        y: selectedElement.y + deltaY,
      });
      setDragStart({ x: canvasX, y: canvasY });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setActiveHandle(null);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo()) redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          deleteElement(selectedElement.id);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedElement) {
          duplicateElement(selectedElement.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, canUndo, canRedo, undo, redo, deleteElement, duplicateElement]);

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
          const maxWidth = CANVAS_WIDTH * 0.8;
          const maxHeight = CANVAS_HEIGHT * 0.8;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = width * scale;
            height = height * scale;
          }

          addElement({
            type: 'image',
            x: (CANVAS_WIDTH - width) / 2,
            y: (CANVAS_HEIGHT - height) / 2,
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
      x: CANVAS_WIDTH / 2 - 100,
      y: CANVAS_HEIGHT / 2 - 12,
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
    const base64Image = await exportCanvas();
    if (onExport) {
      onExport(base64Image);
    } else {
      // Download as file
      const link = document.createElement('a');
      link.download = 'label-design.png';
      link.href = base64Image;
      link.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <button
          onClick={handleAddText}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center gap-2 transition-colors"
        >
          <Type className="w-4 h-4" />
          Add Text
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center gap-2 transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          Add Image
        </button>
        <div className="flex-1" />
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/10 overflow-y-auto p-4 space-y-6">
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Background Color
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded border-2 border-white/20 cursor-pointer"
                style={{ backgroundColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
            </div>
            {showColorPicker && (
              <div className="mt-2">
                <FigmaColorPicker
                  color={backgroundColor}
                  onChange={setBackgroundColor}
                />
              </div>
            )}
          </div>

          {/* Selected Element Inspector */}
          {selectedElement && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white">
                {selectedElement.type === 'text' ? 'Text Properties' : 'Image Properties'}
              </h3>

              {/* Position & Size */}
              <div className="grid grid-cols-2 gap-2">
                <NumericInput
                  label="X"
                  value={Math.round(selectedElement.x)}
                  onChange={(value) => updateElement(selectedElement.id, { x: value })}
                />
                <NumericInput
                  label="Y"
                  value={Math.round(selectedElement.y)}
                  onChange={(value) => updateElement(selectedElement.id, { y: value })}
                />
                <NumericInput
                  label="Width"
                  value={Math.round(selectedElement.width)}
                  onChange={(value) => updateElement(selectedElement.id, { width: value })}
                  min={10}
                />
                <NumericInput
                  label="Height"
                  value={Math.round(selectedElement.height)}
                  onChange={(value) => updateElement(selectedElement.id, { height: value })}
                  min={10}
                />
              </div>

              {/* Rotation */}
              <NumericInput
                label="Rotation"
                value={Math.round(selectedElement.rotation)}
                onChange={(value) => updateElement(selectedElement.id, { rotation: value })}
                min={0}
                max={360}
              />

              {/* Text-specific controls */}
              {selectedElement.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Text Content
                    </label>
                    <textarea
                      value={selectedElement.data}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { data: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                      rows={3}
                    />
                  </div>

                  <NumericInput
                    label="Font Size"
                    value={selectedElement.fontSize || 24}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { fontSize: value })
                    }
                    min={8}
                    max={200}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Font Family
                    </label>
                    <select
                      value={selectedElement.fontFamily || 'Arial'}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { fontFamily: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
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
                    <div
                      className="w-12 h-12 rounded border-2 border-white/20 cursor-pointer"
                      style={{ backgroundColor: selectedElement.color || '#000000' }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    />
                    {showColorPicker && (
                      <div className="mt-2">
                        <FigmaColorPicker
                          color={selectedElement.color || '#000000'}
                          onChange={(color) =>
                            updateElement(selectedElement.id, { color })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Text Align
                    </label>
                    <select
                      value={selectedElement.textAlign || 'left'}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          textAlign: e.target.value as 'left' | 'center' | 'right',
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          fontWeight:
                            selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                        selectedElement.fontWeight === 'bold'
                          ? 'bg-[#4DB64F] text-white border-[#4DB64F]'
                          : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Bold
                    </button>
                    <button
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          fontStyle:
                            selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                        selectedElement.fontStyle === 'italic'
                          ? 'bg-[#4DB64F] text-white border-[#4DB64F]'
                          : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Italic
                    </button>
                    <button
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          textDecoration:
                            selectedElement.textDecoration === 'underline'
                              ? 'none'
                              : 'underline',
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                        selectedElement.textDecoration === 'underline'
                          ? 'bg-[#4DB64F] text-white border-[#4DB64F]'
                          : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Underline
                    </button>
                  </div>

                  <NumericInput
                    label="Letter Spacing"
                    value={selectedElement.letterSpacing || 0}
                    onChange={(value) =>
                      updateElement(selectedElement.id, { letterSpacing: value })
                    }
                    min={-10}
                    max={20}
                    step={0.1}
                  />
                </>
              )}

              {/* Element Actions */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => bringToFront(selectedElement.id)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
                    title="Bring to Front"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => sendToBack(selectedElement.id)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
                    title="Send to Back"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => flipHorizontal(selectedElement.id)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => flipVertical(selectedElement.id)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
                    title="Duplicate (Ctrl+D)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 flex items-center justify-center gap-2 transition-colors"
                    title="Delete (Del)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-4">
          <div
            ref={containerRef}
            className="bg-white/5 rounded-lg p-4 inline-block"
            style={{
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-white/20 rounded cursor-default"
              style={{
                width: `${CANVAS_WIDTH * displayScale}px`,
                height: `${CANVAS_HEIGHT * displayScale}px`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}

