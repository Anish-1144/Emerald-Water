'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Type, Image as ImageIcon } from 'lucide-react';
import {
  useLabelEditorStore,
  drawElementOnCanvas,
  LabelElement,
} from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import NumericInput from '@/components/ui/NumericInput';
import { useThemeStore } from '@/lib/store';
import {
  isPointInElement,
  getResizeHandle,
  getCursorForHandle,
  calculateResize,
  calculateRotation,
  getElementCorners,
} from '@/lib/canvasUtils';

const CANVAS_WIDTH = 2081;
const CANVAS_HEIGHT = 544;

interface LabelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (base64Image: string) => void;
}

export default function LabelEditorModal({
  isOpen,
  onClose,
  onExport,
}: LabelEditorModalProps) {
  const { theme } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(0.5);
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
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPosition, setEditingPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    backgroundColor,
    elements,
    setBackgroundColor,
    addElement: addElementToStore,
    updateElement: updateElementInStore,
    deleteElement,
    selectElement: selectElementInStore,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
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
      data: '', // Empty by default
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      textAlign: 'center',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      letterSpacing: 0,
    });
    // Force re-render to show the new element as selected
    setTimeout(() => {
      renderCanvas();
    }, 50);
  };

  const selectedElement = elements.find((el: LabelElement) => el.selected);

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
    elements.forEach((element: LabelElement) => {
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

      // Draw resize handles - smaller size for better precision
      const handleSize = 3 / displayScale; // Reduced to 3 for smaller handles
      const centerX = (selectedElement.x + selectedElement.width / 2) * displayScale;
      const centerY = (selectedElement.y + selectedElement.height / 2) * displayScale;
      const rotation = (selectedElement.rotation * Math.PI) / 180;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      const halfWidth =
        (selectedElement.width * Math.abs(selectedElement.scaleX) * displayScale) / 2;
      const halfHeight =
        (selectedElement.height * Math.abs(selectedElement.scaleY) * displayScale) / 2;

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
        ctx.lineWidth = 1.5 / displayScale; // Thinner stroke for smaller handles
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
      ctx.lineWidth = 1.5 / displayScale; // Thinner stroke for smaller handles
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

  // Wrapper functions that ensure canvas re-renders (defined after renderCanvas)
  const updateElement = useCallback((id: string, updates: Partial<LabelElement>) => {
    updateElementInStore(id, updates);
    // Force immediate canvas re-render
    requestAnimationFrame(() => {
      renderCanvas();
    });
  }, [updateElementInStore, renderCanvas]);

  const addElement = useCallback((elementData: Omit<LabelElement, 'id' | 'selected'>) => {
    addElementToStore(elementData);
    // Force canvas re-render after element is added
    requestAnimationFrame(() => {
      renderCanvas();
    });
  }, [addElementToStore, renderCanvas]);

  const selectElement = useCallback((id: string | null) => {
    selectElementInStore(id);
    // Force canvas re-render to show selection
    requestAnimationFrame(() => {
      renderCanvas();
    });
  }, [selectElementInStore, renderCanvas]);

  // Re-render when state changes
  useEffect(() => {
    if (isOpen) {
      renderCanvas();
    }
  }, [renderCanvas, isOpen]);

  // Handle double click for inline text editing
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / displayScale;
    const canvasY = (e.clientY - rect.top) / displayScale;

    // Check if double-clicking on a text element
    let clickedElement: LabelElement | null = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i].type === 'text' && isPointInElement(canvasX, canvasY, elements[i])) {
        clickedElement = elements[i];
        break;
      }
    }

    if (clickedElement && clickedElement.type === 'text') {
      // Select the element first
      selectElement(clickedElement.id);
      
      // Calculate position for inline input
      // Calculate text position based on alignment
      let textX = clickedElement.x;
      if (clickedElement.textAlign === 'center') {
        textX = clickedElement.x + clickedElement.width / 2;
      } else if (clickedElement.textAlign === 'right') {
        textX = clickedElement.x + clickedElement.width;
      }

      // Transform to container-relative coordinates (for absolute positioning)
      const containerRect = containerRef.current.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const containerX = (canvasRect.left - containerRect.left) + (textX * displayScale) + 16; // 16px for padding
      const containerY = (canvasRect.top - containerRect.top) + (clickedElement.y * displayScale) + 16; // 16px for padding
      
      setEditingElementId(clickedElement.id);
      setEditingText(clickedElement.data || '');
      setEditingPosition({
        x: containerX,
        y: containerY,
        width: clickedElement.width * displayScale,
        height: clickedElement.height * displayScale,
      });

      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        if (inlineInputRef.current) {
          inlineInputRef.current.focus();
          inlineInputRef.current.select();
        }
      }, 10);
    }
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / displayScale;
    const canvasY = (e.clientY - rect.top) / displayScale;

    // Check if clicking on a resize handle (use smaller threshold to match smaller handles)
    if (selectedElement) {
      // Use handle size that matches the visual size (5px base, scaled)
      const actualHandleSize = 5;
      const handle = getResizeHandle(canvasX, canvasY, selectedElement, actualHandleSize);
      if (handle) {
        e.preventDefault();
        e.stopPropagation();
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
      // Force re-render to show selection
      requestAnimationFrame(() => {
        renderCanvas();
      });
      console.log('Selected element:', clickedElement.type, clickedElement.id);
    } else {
      selectElement(null);
      requestAnimationFrame(() => {
        renderCanvas();
      });
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
      // Use handle size that matches the visual size (5px base)
      const actualHandleSize = 5;
      const handle = getResizeHandle(canvasX, canvasY, selectedElement, actualHandleSize);
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
      // Type guard: ensure activeHandle is not 'rotate'
      if (activeHandle === 'rotate') {
        // This shouldn't happen, but handle it gracefully
        return;
      }
      const deltaX = canvasX - dragStart.x;
      const deltaY = canvasY - dragStart.y;
      
      // Only resize if there's actual movement
      if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
        // TypeScript now knows activeHandle is not 'rotate'
        const updates = calculateResize(selectedElement, activeHandle, deltaX, deltaY);
        updateElement(selectedElement.id, updates);
        setDragStart({ x: canvasX, y: canvasY });
      }
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
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        if (canRedo()) redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete element if user is editing text in textarea or inline editor
        const activeElement = document.activeElement;
        const isEditingText = (activeElement?.tagName === 'TEXTAREA' && 
                              activeElement?.getAttribute('data-text-edit') !== null) ||
                              editingElementId !== null;
        
        if (selectedElement && !isEditingText) {
          deleteElement(selectedElement.id);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedElement) {
          duplicateElement(selectedElement.id);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedElement,
    editingElementId,
    canUndo,
    canRedo,
    undo,
    redo,
    deleteElement,
    duplicateElement,
    onClose,
  ]);

  // Handle export and close
  const handleExportAndClose = async () => {
    try {
      const base64Image = await exportCanvas();
      if (onExport) {
        onExport(base64Image);
      }
      // Small delay to ensure texture is updated before closing
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Error exporting canvas:', error);
      alert('Error exporting label. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-xl border w-full max-w-[95vw] h-[90vh] flex flex-col transition-colors"
        style={{ 
          backgroundColor: 'var(--background)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center justify-between transition-colors"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h2 
            className="text-xl font-semibold transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            Label Editor
          </h2>
          <div className="flex items-center gap-3">
            {/* Add Elements */}
            <button
              onClick={handleAddText}
              className="px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors text-sm"
              style={{
                backgroundColor: selectedElement?.type === 'text' ? '#4DB64F' : 'var(--card-bg)',
                borderColor: selectedElement?.type === 'text' ? '#4DB64F' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (selectedElement?.type !== 'text') {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedElement?.type !== 'text') {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
            >
              <Type className="w-4 h-4" />
              Add Text
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border rounded-full flex items-center gap-2 transition-colors text-sm"
              style={{
                backgroundColor: (selectedElement?.type === 'image' || !selectedElement) ? '#4DB64F' : 'var(--card-bg)',
                borderColor: (selectedElement?.type === 'image' || !selectedElement) ? '#4DB64F' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (selectedElement?.type !== 'image' && selectedElement) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedElement?.type !== 'image' && selectedElement) {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
              title="Upload PNG, JPG, or GIF image"
            >
              <ImageIcon className="w-4 h-4" />
              Add Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* Zoom Controls */}
            <div 
              className="flex items-center gap-2 rounded-lg px-2 py-1 border transition-colors"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              <button
                onClick={() => setDisplayScale(Math.max(0.1, displayScale - 0.1))}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span 
                className="text-sm min-w-[60px] text-center transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {Math.round(displayScale * 100)}%
              </span>
              <button
                onClick={() => setDisplayScale(Math.min(1, displayScale + 0.1))}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area - Canvas + Right Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div 
            className="flex-1 overflow-auto p-4 flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <div
              ref={containerRef}
              className="rounded-lg p-4 inline-block relative transition-colors"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'var(--card-bg)',
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                className="border rounded cursor-default transition-colors"
                style={{
                  width: `${CANVAS_WIDTH * displayScale}px`,
                  height: `${CANVAS_HEIGHT * displayScale}px`,
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--background)',
                }}
              />
              {/* Inline text editor overlay */}
              {editingElementId && (() => {
                const element = elements.find(el => el.id === editingElementId);
                if (!element || element.type !== 'text') return null;
                
                return (
                  <textarea
                    ref={inlineInputRef}
                    value={editingText}
                    onChange={(e) => {
                      // Update text in real-time
                      const newValue = e.target.value;
                      setEditingText(newValue);
                      
                      // Update element immediately for real-time canvas preview
                      if (editingElementId) {
                        const element = elements.find(el => el.id === editingElementId);
                        if (element && element.type === 'text') {
                          // Calculate text width based on actual text measurement
                          const canvas = canvasRef.current;
                          if (canvas && newValue.length > 0) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              // Ensure canvas is properly sized for accurate measurement
                              const tempWidth = canvas.width || CANVAS_WIDTH;
                              const tempHeight = canvas.height || CANVAS_HEIGHT;
                              
                              // Set font to match element's font properties
                              const fontStyle = element.fontStyle || 'normal';
                              const fontWeight = element.fontWeight || 'normal';
                              const fontSize = element.fontSize || 24;
                              const fontFamily = element.fontFamily || 'Arial';
                              ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                              ctx.textAlign = element.textAlign || 'left';
                              ctx.textBaseline = 'top';
                              
                              // Measure text width
                              const letterSpacing = element.letterSpacing || 0;
                              let textWidth: number;
                              
                              if (letterSpacing === 0) {
                                const metrics = ctx.measureText(newValue);
                                textWidth = metrics.width;
                                // Add actualBoundingBoxLeft/Right for more accurate width
                                if (metrics.actualBoundingBoxLeft !== undefined && metrics.actualBoundingBoxRight !== undefined) {
                                  textWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
                                }
                              } else {
                                // Calculate width with letter spacing
                                let totalWidth = 0;
                                for (let i = 0; i < newValue.length; i++) {
                                  const charMetrics = ctx.measureText(newValue[i]);
                                  totalWidth += charMetrics.width;
                                  if (i < newValue.length - 1) {
                                    totalWidth += letterSpacing;
                                  }
                                }
                                textWidth = totalWidth;
                              }
                              
                              // Update element with new text and calculated width (add generous padding)
                              const minWidth = 50;
                              const padding = Math.max(40, fontSize * 0.5); // Dynamic padding based on font size, minimum 40px
                              const buffer = 10; // Additional buffer for font rendering differences
                              const newWidth = Math.max(minWidth, Math.ceil(textWidth + padding + buffer));
                              
                              // Also update height based on font size
                              const newHeight = Math.max(element.fontSize || 24, element.height);
                              
                              updateElement(editingElementId, {
                                data: newValue,
                                width: newWidth,
                                height: newHeight,
                              });
                              
                              // Force immediate re-render
                              requestAnimationFrame(() => {
                                renderCanvas();
                              });
                            } else {
                              // Fallback: just update text
                              updateElement(editingElementId, { data: newValue });
                            }
                          } else {
                            // Update text even if empty or canvas not ready
                            updateElement(editingElementId, { data: newValue });
                          }
                        } else {
                          // Fallback: just update text
                          updateElement(editingElementId, { data: newValue });
                        }
                      }
                    }}
                    onBlur={() => {
                      // Save the text when done editing
                      if (editingElementId) {
                        updateElement(editingElementId, { data: editingText });
                        useLabelEditorStore.getState().saveHistory();
                      }
                      setEditingElementId(null);
                      setEditingText('');
                    }}
                    onKeyDown={(e) => {
                      // Prevent backspace from deleting element or closing section
                      if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.stopPropagation();
                        // Allow normal text editing behavior
                        return;
                      }
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        // Ctrl/Cmd + Enter to finish editing
                        e.preventDefault();
                        if (editingElementId) {
                          updateElement(editingElementId, { data: editingText });
                          useLabelEditorStore.getState().saveHistory();
                        }
                        setEditingElementId(null);
                        setEditingText('');
                        inlineInputRef.current?.blur();
                      } else if (e.key === 'Escape') {
                        // Cancel editing and restore original text
                        e.preventDefault();
                        setEditingElementId(null);
                        setEditingText('');
                        inlineInputRef.current?.blur();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: `${editingPosition.x}px`,
                      top: `${editingPosition.y}px`,
                      width: `${Math.max(editingPosition.width, 100)}px`,
                      minHeight: `${editingPosition.height}px`,
                      // Editor styling: black background, white text for better visibility while editing
                      background: '#000000',
                      color: '#ffffff',
                      // Keep font properties from element for proper sizing/alignment (but not color)
                      fontFamily: element.fontFamily || 'Arial',
                      fontSize: `${(element.fontSize || 24) * displayScale}px`,
                      fontWeight: element.fontWeight || 'normal',
                      fontStyle: element.fontStyle || 'normal',
                      textAlign: element.textAlign || 'left',
                      border: '2px solid #4DB64F',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      outline: 'none',
                      resize: 'none',
                      overflow: 'hidden',
                      zIndex: 1000,
                      transform: element.rotation !== 0 
                        ? `rotate(${element.rotation}deg)` 
                        : 'none',
                      transformOrigin: 'top left',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                    }}
                    className="shadow-lg"
                  />
                );
              })()}
            </div>
          </div>

          {/* Right Sidebar */}
          <div 
            className="w-80 border-l overflow-y-auto flex flex-col transition-colors"
            style={{ 
              backgroundColor: 'var(--background)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            {/* Background Color Section */}
            <div 
              className="p-4 border-b transition-colors"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <label 
                className="block text-sm font-semibold mb-3 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Background Color
              </label>
              <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-16 h-16 rounded-lg border-2 cursor-pointer shadow-lg hover:scale-105 transition-transform shrink-0"
                  style={{ 
                    backgroundColor,
                    borderColor: 'var(--border-color)'
                  }}
                  onClick={() => {
                    setShowBgColorPicker(!showBgColorPicker);
                    setShowTextColorPicker(false);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-xs mb-1 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Label background
                  </p>
                  <p 
                    className="text-sm font-mono truncate transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {backgroundColor.toUpperCase()}
                  </p>
                </div>
              </div>
              {showBgColorPicker && (
                <div className="mt-3">
                  <FigmaColorPicker
                    color={backgroundColor}
                    onChange={setBackgroundColor}
                  />
                </div>
              )}
            </div>

            {/* Image Properties Section - Show by default when no element selected or when image is selected */}
            {(!selectedElement || selectedElement.type === 'image') && (
              <div 
                className="p-4 border-b transition-colors"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <h3 
                  className="text-sm font-semibold mb-3 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Image Properties
                </h3>
                <div className="space-y-3">
                  {!selectedElement && (
                    <div 
                      className="rounded-lg p-3 border transition-colors"
                      style={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--border-color)' 
                      }}
                    >
                      <p 
                        className="text-xs mb-2 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        No Image Selected
                      </p>
                      <p 
                        className="text-xs transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Click "Add Image" to upload an image, or select an existing image on the canvas to edit its properties.
                      </p>
                    </div>
                  )}
                  {selectedElement && selectedElement.type === 'image' && (
                    <>
                      <div 
                        className="rounded-lg p-3 border transition-colors"
                        style={{ 
                          backgroundColor: 'var(--card-bg)', 
                          borderColor: 'var(--border-color)' 
                        }}
                      >
                        <p 
                          className="text-xs mb-2 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Resize Instructions
                        </p>
                        <p 
                          className="text-xs transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Click and drag the small green circles around the image to resize. Corner handles resize proportionally, edge handles resize one dimension.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumericInput
                          label="Width"
                          value={Math.round(selectedElement.width)}
                          onChange={(value) => updateElement(selectedElement.id, { width: value })}
                          min={10}
                          className="text-sm"
                        />
                        <NumericInput
                          label="Height"
                          value={Math.round(selectedElement.height)}
                          onChange={(value) => updateElement(selectedElement.id, { height: value })}
                          min={10}
                          className="text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Text Color Section (for selected text element) - Moved to top for better visibility */}
            {selectedElement && selectedElement.type === 'text' && (
              <div 
                className="p-4 border-b transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--border-color)' 
                }}
              >
                <label 
                  className="block text-sm font-semibold mb-3 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Text Color
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-16 h-16 rounded-lg border-2 cursor-pointer shadow-lg hover:scale-105 transition-transform shrink-0"
                    style={{ 
                      backgroundColor: selectedElement.color || '#000000',
                      borderColor: 'var(--border-color)'
                    }}
                    onClick={() => {
                      setShowTextColorPicker(!showTextColorPicker);
                      setShowBgColorPicker(false);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-xs mb-1 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Click to change text color
                    </p>
                    <p 
                      className="text-sm font-mono truncate transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {(selectedElement.color || '#000000').toUpperCase()}
                    </p>
                  </div>
                </div>
                {showTextColorPicker && (
                  <div className="mt-3">
                    <FigmaColorPicker
                      color={selectedElement.color || '#000000'}
                      onChange={(color) => {
                        updateElement(selectedElement.id, { color });
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Selected Element Properties */}
            {selectedElement && (
              <div 
                className="p-4 border-b space-y-4 transition-colors"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <h3 
                  className="text-sm font-semibold transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedElement.type === 'text' ? 'Text Properties' : 'Image Properties'}
                </h3>

                {/* Position & Size */}
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="X"
                    value={Math.round(selectedElement.x)}
                    onChange={(value) => updateElement(selectedElement.id, { x: value })}
                    className="text-sm"
                  />
                  <NumericInput
                    label="Y"
                    value={Math.round(selectedElement.y)}
                    onChange={(value) => updateElement(selectedElement.id, { y: value })}
                    className="text-sm"
                  />
                  <NumericInput
                    label="Width"
                    value={Math.round(selectedElement.width)}
                    onChange={(value) => updateElement(selectedElement.id, { width: value })}
                    min={10}
                    className="text-sm"
                  />
                  <NumericInput
                    label="Height"
                    value={Math.round(selectedElement.height)}
                    onChange={(value) => updateElement(selectedElement.id, { height: value })}
                    min={10}
                    className="text-sm"
                  />
                </div>

                {/* Rotation */}
                <NumericInput
                  label="Rotation"
                  value={Math.round(selectedElement.rotation)}
                  onChange={(value) => updateElement(selectedElement.id, { rotation: value })}
                  min={0}
                  max={360}
                  className="text-sm"
                />

                {/* Text-specific controls */}
                {selectedElement.type === 'text' && (
                  <>
                    {/* Text Actions */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => {
                          const textarea = document.querySelector('textarea[data-text-edit]') as HTMLTextAreaElement;
                          if (textarea) {
                            textarea.focus();
                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-[#4DB64F] hover:bg-[#45a049] border border-[#4DB64F] rounded-lg text-white flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                      >
                        <Type className="w-4 h-4" />
                        Edit Text
                      </button>
                      <button
                        onClick={handleAddText}
                        className="flex-1 px-3 py-2 border rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
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
                        Add New Text
                      </button>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Text Content
                      </label>
                      <textarea
                        data-text-edit
                        value={selectedElement.data ?? ''}
                        onChange={(e) => {
                          const newText = e.target.value;
                          // Calculate text width based on actual text measurement
                          const canvas = canvasRef.current;
                          if (canvas && newText.length > 0) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              // Ensure canvas is properly sized for accurate measurement
                              const tempWidth = canvas.width || CANVAS_WIDTH;
                              const tempHeight = canvas.height || CANVAS_HEIGHT;
                              
                              // Set font to match element's font properties
                              const fontStyle = selectedElement.fontStyle || 'normal';
                              const fontWeight = selectedElement.fontWeight || 'normal';
                              const fontSize = selectedElement.fontSize || 24;
                              const fontFamily = selectedElement.fontFamily || 'Arial';
                              ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                              ctx.textAlign = selectedElement.textAlign || 'left';
                              ctx.textBaseline = 'top';
                              
                              // Measure text width
                              const letterSpacing = selectedElement.letterSpacing || 0;
                              let textWidth: number;
                              
                              if (letterSpacing === 0) {
                                const metrics = ctx.measureText(newText);
                                textWidth = metrics.width;
                                // Add actualBoundingBoxLeft/Right for more accurate width
                                if (metrics.actualBoundingBoxLeft !== undefined && metrics.actualBoundingBoxRight !== undefined) {
                                  textWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
                                }
                              } else {
                                // Calculate width with letter spacing
                                let totalWidth = 0;
                                for (let i = 0; i < newText.length; i++) {
                                  const charMetrics = ctx.measureText(newText[i]);
                                  totalWidth += charMetrics.width;
                                  if (i < newText.length - 1) {
                                    totalWidth += letterSpacing;
                                  }
                                }
                                textWidth = totalWidth;
                              }
                              
                              // Update element with new text and calculated width (add generous padding)
                              const minWidth = 50;
                              const padding = Math.max(40, fontSize * 0.5); // Dynamic padding based on font size, minimum 40px
                              const buffer = 10; // Additional buffer for font rendering differences
                              const newWidth = Math.max(minWidth, Math.ceil(textWidth + padding + buffer));
                              
                              // Also update height based on font size
                              const newHeight = Math.max(selectedElement.fontSize || 24, selectedElement.height);
                              
                              updateElement(selectedElement.id, {
                                data: newText,
                                width: newWidth,
                                height: newHeight,
                              });
                              
                              // Force immediate re-render
                              requestAnimationFrame(() => {
                                renderCanvas();
                              });
                            } else {
                              // Fallback: just update text
                              updateElement(selectedElement.id, { data: newText });
                            }
                          } else {
                            // Update text even if empty or canvas not ready
                            updateElement(selectedElement.id, { data: newText });
                          }
                        }}
                        onBlur={() => {
                          // Save history when user finishes editing
                          useLabelEditorStore.getState().saveHistory();
                        }}
                        onKeyDown={(e) => {
                          // Prevent backspace from deleting element or closing section
                          if (e.key === 'Backspace' || e.key === 'Delete') {
                            e.stopPropagation();
                            // Allow normal text editing behavior - don't prevent default
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#4DB64F] text-sm transition-colors"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--input-border)',
                          color: 'var(--text-primary)',
                        }}
                        rows={3}
                        placeholder="Enter your text here..."
                      />
                    </div>

                    {/* Font Size - More Prominent with Live Preview */}
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Font Size: {selectedElement.fontSize || 24}px
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="8"
                          max="200"
                          value={selectedElement.fontSize || 24}
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value);
                          updateElement(selectedElement.id, { fontSize: newSize });
                        }}
                          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#4DB64F]"
                        />
                        <NumericInput
                          value={selectedElement.fontSize || 24}
                          onChange={(value) => {
                            updateElement(selectedElement.id, { fontSize: value });
                          }}
                          min={8}
                          max={200}
                          className="w-20 text-sm"
                        />
                      </div>
                    </div>

                    {/* Font Style - More Prominent */}
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Font Style
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            updateElement(selectedElement.id, {
                              fontWeight:
                                selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                            });
                          }}
                          className="px-3 py-2.5 rounded-lg border transition-colors text-sm font-medium"
                          style={{
                            backgroundColor: selectedElement.fontWeight === 'bold' ? '#4DB64F' : 'var(--card-bg)',
                            borderColor: selectedElement.fontWeight === 'bold' ? '#4DB64F' : 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedElement.fontWeight !== 'bold') {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedElement.fontWeight !== 'bold') {
                              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                            }
                          }}
                        >
                          Bold
                        </button>
                        <button
                          onClick={() => {
                            updateElement(selectedElement.id, {
                              fontStyle:
                                selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                            });
                          }}
                          className="px-3 py-2.5 rounded-lg border transition-colors text-sm font-medium"
                          style={{
                            backgroundColor: selectedElement.fontStyle === 'italic' ? '#4DB64F' : 'var(--card-bg)',
                            borderColor: selectedElement.fontStyle === 'italic' ? '#4DB64F' : 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedElement.fontStyle !== 'italic') {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedElement.fontStyle !== 'italic') {
                              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                            }
                          }}
                        >
                          Italic
                        </button>
                        <button
                          onClick={() => {
                            updateElement(selectedElement.id, {
                              textDecoration:
                                selectedElement.textDecoration === 'underline'
                                  ? 'none'
                                  : 'underline',
                            });
                          }}
                          className="px-3 py-2.5 rounded-lg border transition-colors text-sm font-medium"
                          style={{
                            backgroundColor: selectedElement.textDecoration === 'underline' ? '#4DB64F' : 'var(--card-bg)',
                            borderColor: selectedElement.textDecoration === 'underline' ? '#4DB64F' : 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedElement.textDecoration !== 'underline') {
                              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedElement.textDecoration !== 'underline') {
                              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                            }
                          }}
                        >
                          Underline
                        </button>
                      </div>
                    </div>

                    {/* Font Family - More Prominent with Live Preview */}
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Font Family
                      </label>
                      <select
                        value={selectedElement.fontFamily || 'Arial'}
                        onChange={(e) => {
                          updateElement(selectedElement.id, { fontFamily: e.target.value });
                        }}
                        className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:border-[#4DB64F] text-sm font-medium appearance-none cursor-pointer transition-colors"
                        style={{ 
                          fontFamily: selectedElement.fontFamily || 'Arial',
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--input-border)',
                          color: 'var(--text-primary)',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          paddingRight: '36px'
                        }}
                      >
                        <option value="Arial" style={{ fontFamily: 'Arial', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Arial</option>
                        <option value="Helvetica" style={{ fontFamily: 'Helvetica', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Helvetica</option>
                        <option value="Times New Roman" style={{ fontFamily: 'Times New Roman', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Times New Roman</option>
                        <option value="Courier New" style={{ fontFamily: 'Courier New', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Courier New</option>
                        <option value="Verdana" style={{ fontFamily: 'Verdana', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Verdana</option>
                        <option value="Georgia" style={{ fontFamily: 'Georgia', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Georgia</option>
                        <option value="Palatino" style={{ fontFamily: 'Palatino', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Palatino</option>
                        <option value="Garamond" style={{ fontFamily: 'Garamond', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Garamond</option>
                        <option value="Comic Sans MS" style={{ fontFamily: 'Comic Sans MS', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Comic Sans MS</option>
                        <option value="Impact" style={{ fontFamily: 'Impact', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Impact</option>
                        <option value="Roboto" style={{ fontFamily: 'Roboto', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Roboto</option>
                        <option value="Open Sans" style={{ fontFamily: 'Open Sans', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Open Sans</option>
                        <option value="Montserrat" style={{ fontFamily: 'Montserrat', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Montserrat</option>
                        <option value="Lato" style={{ fontFamily: 'Lato', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Lato</option>
                        <option value="Poppins" style={{ fontFamily: 'Poppins', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Poppins</option>
                        <option value="Inter" style={{ fontFamily: 'Inter', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Inter</option>
                        <option value="Playfair Display" style={{ fontFamily: 'Playfair Display', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Playfair Display</option>
                        <option value="Raleway" style={{ fontFamily: 'Raleway', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Raleway</option>
                        <option value="Oswald" style={{ fontFamily: 'Oswald', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Oswald</option>
                        <option value="Source Sans Pro" style={{ fontFamily: 'Source Sans Pro', backgroundColor: '#1E1E1E', color: '#ffffff' }}>Source Sans Pro</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Current: <span style={{ fontFamily: selectedElement.fontFamily || 'Arial' }}>{selectedElement.fontFamily || 'Arial'}</span>
                      </p>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Text Align
                      </label>
                      <select
                        value={selectedElement.textAlign || 'left'}
                        onChange={(e) => {
                          updateElement(selectedElement.id, {
                            textAlign: e.target.value as 'left' | 'center' | 'right',
                          });
                        }}
                        className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:border-[#4DB64F] text-sm font-medium appearance-none cursor-pointer transition-colors"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--input-border)',
                          color: 'var(--text-primary)',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%23111827' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 12px center',
                          paddingRight: '36px'
                        }}
                      >
                        <option value="left" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}>Left</option>
                        <option value="center" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}>Center</option>
                        <option value="right" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}>Right</option>
                      </select>
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
                      className="text-sm"
                    />
                  </>
                )}
              </div>
            )}

            {/* Info when no element selected */}
            {!selectedElement && (
              <div className="p-4 text-sm text-gray-400 space-y-2">
                <p 
                  className="font-semibold mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  No Element Selected
                </p>
                <p>Click on a text or image element on the canvas to select it and edit its properties.</p>
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Click "Add Text" to create a new text element, then click on it to select.
                </p>
              </div>
            )}

            {/* Debug info - Remove in production */}
            {selectedElement && (
              <div className="p-4 border-t border-white/10 text-xs text-gray-500">
                <p>Element ID: {selectedElement.id}</p>
                <p>Type: {selectedElement.type}</p>
                <p>Selected: {selectedElement.selected ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div 
          className="p-4 border-t flex items-center justify-between transition-colors"
          style={{ 
            backgroundColor: 'var(--background)', 
            borderColor: 'var(--border-color)' 
          }}
        >
          <div 
            className="flex items-center gap-3 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <span 
              className="font-medium transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px
            </span>
            <span 
              className="transition-colors"
              style={{ color: 'var(--border-color)' }}
            >
              •
            </span>
            <span>
              Elements: <span 
                className="font-medium transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {elements.length}
              </span>
            </span>
            {selectedElement && (
              <>
                <span 
                  className="transition-colors"
                  style={{ color: 'var(--border-color)' }}
                >
                  •
                </span>
                <span 
                  className="text-[#4DB64F] font-medium transition-colors"
                >
                  Selected: {selectedElement.type}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                }
              }}
              title="Redo (Ctrl+Y)"
            >
              Redo
            </button>
            <button
              onClick={handleExportAndClose}
              className="px-6 py-2.5 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white transition-colors font-medium text-sm"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

