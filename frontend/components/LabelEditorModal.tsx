'use client';

/**
 * LabelEditorModal — rewritten with react-konva
 *
 * What disappears entirely:
 *   ✕  canvasUtils.ts          (isPointInElement, getResizeHandle, calculateResize,
 *                                calculateRotation, getElementCorners, getCursorForHandle)
 *   ✕  imageCacheRef           (Konva handles image loading/caching)
 *   ✕  isDragging / isResizing / isRotating state
 *   ✕  handleMouseMove cursor logic
 *   ✕  renderCanvas() + useEffect re-render loop
 *   ✕  All displayScale coordinate conversion math
 *
 * What replaces all of that:
 *   ✓  <Transformer> — one component that gives you 8 resize handles,
 *                       rotate handle, correct cursors, rotated hit detection,
 *                       snap-to-angle, min/max size, keep-ratio — all automatic.
 *   ✓  draggable prop on every node
 *   ✓  onDragEnd / onTransformEnd — two callbacks to sync back to your store
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Type, Image as ImageIcon } from 'lucide-react';
import {
  Stage, Layer, Rect, Image as KonvaImage, Text,
  Transformer, Group,
} from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import {
  useLabelEditorStore,
  LabelElement,
} from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import NumericInput from '@/components/ui/NumericInput';
import { useThemeStore } from '@/lib/store';

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 544;

// Company description constants (0.5 inch = 142.86px at 7 inches = 2000px)
const COMPANY_DESC_WIDTH = 143; // 0.5 inch in pixels (this will be the height after rotation)
const COMPANY_DESC_TEXT = `Bottled with Superior Quality High pH Alkaline Water
Bottled by/ Embouteillee par:
Emerald Water & Ice Inc, Regina, Sk
www.emeraldwater.ca 306-791-2291`;
const COMPANY_DESC_FONT_SIZE = 20; // Bigger font size
const COMPANY_DESC_PADDING = 25; // Padding on all sides

// ─────────────────────────────────────────────────────────────────────────────
// Tiny sub-components so each element controls its own Transformer
// ─────────────────────────────────────────────────────────────────────────────

function ImageNode({
  element,
  isSelected,
  onSelect,
  onChange,
}: {
  element: LabelElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<LabelElement>) => void;
}) {
  const [img] = useImage(element.data);
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
          useLabelEditorStore.getState().saveHistory();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          onChange({
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
            rotation: node.rotation(),
            scaleX: 1,
            scaleY: 1,
          });
          node.scaleX(1);
          node.scaleY(1);
          useLabelEditorStore.getState().saveHistory();
        }}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}

function TextNode({
  element,
  isSelected,
  onSelect,
  onChange,
  onDoubleClick,
}: {
  element: LabelElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<LabelElement>) => void;
  onDoubleClick?: () => void;
}) {
  const shapeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
    }
  }, [isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        x={element.x}
        y={element.y}
        width={element.width}
        text={element.data}
        fontSize={element.fontSize ?? 24}
        fontFamily={element.fontFamily ?? 'Arial'}
        fontStyle={[element.fontStyle, element.fontWeight].filter(Boolean).join(' ')}
        textDecoration={element.textDecoration ?? 'none'}
        align={element.textAlign ?? 'left'}
        fill={element.color ?? '#000000'}
        letterSpacing={element.letterSpacing ?? 0}
        rotation={element.rotation}
        scaleX={element.scaleX}
        scaleY={element.scaleY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
          useLabelEditorStore.getState().saveHistory();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          onChange({
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            rotation: node.rotation(),
            scaleX: 1,
            scaleY: 1,
          });
          node.scaleX(1);
          node.scaleY(1);
          useLabelEditorStore.getState().saveHistory();
        }}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'middle-left', 'middle-right',
            'top-left', 'top-right', 'bottom-left', 'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 ? oldBox : newBox
          }
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal component
// ─────────────────────────────────────────────────────────────────────────────

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
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(0.5);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingPosition, setEditingPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW = CANVAS_WIDTH * 0.8;
        const maxH = CANVAS_HEIGHT * 0.8;
        let { width: w, height: h } = img;
        if (w > maxW || h > maxH) {
          const sc = Math.min(maxW / w, maxH / h);
          w *= sc;
          h *= sc;
        }
        addElement({
          type: 'image',
          data,
          x: (CANVAS_WIDTH - w) / 2,
          y: (CANVAS_HEIGHT - h) / 2,
          width: w,
          height: h,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        });
      };
      img.src = data;
    };
    reader.readAsDataURL(file);
  };

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
      data: '',
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

  // ── handle double click for inline text editing ───────────────────────────
  const handleTextDoubleClick = (element: LabelElement) => {
    if (element.type !== 'text') return;

    selectElement(element.id);

    // Calculate position for inline input
    let textX = element.x;
    if (element.textAlign === 'center') {
      textX = element.x + element.width / 2;
    } else if (element.textAlign === 'right') {
      textX = element.x + element.width;
    }

    // Transform to container-relative coordinates
    if (containerRef.current && stageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const stageContainer = stageRef.current.container();
      const stageRect = stageContainer.getBoundingClientRect();
      const containerX = (stageRect.left - containerRect.left) + (textX * displayScale) + 50 * displayScale;
      const containerY = (stageRect.top - containerRect.top) + (element.y * displayScale) + 50 * displayScale;

      setEditingElementId(element.id);
      setEditingText(element.data || '');
      setEditingPosition({
        x: containerX,
        y: containerY,
        width: element.width * displayScale,
        height: element.height * displayScale,
      });

      setTimeout(() => {
        if (inlineInputRef.current) {
          inlineInputRef.current.focus();
          inlineInputRef.current.select();
        }
      }, 10);
    }
  };

  // ── export and close ──────────────────────────────────────────────────────
  const handleExportAndClose = async () => {
    try {
      if (stageRef.current) {
        // Temporarily scale stage to full resolution for export
        const stage = stageRef.current;
        const currentScale = displayScale;
        stage.scale({ x: 1, y: 1 });
        stage.size({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
        const dataURL = stage.toDataURL({ pixelRatio: 1 });
        stage.scale({ x: currentScale, y: currentScale });
        stage.size({ width: CANVAS_WIDTH * currentScale, height: CANVAS_HEIGHT * currentScale });

        if (onExport) {
          onExport(dataURL);
        }
        setTimeout(() => {
          onClose();
        }, 100);
      } else {
        // Fallback to store export
        const base64Image = await exportCanvas();
        if (onExport) {
          onExport(base64Image);
        }
        setTimeout(() => {
          onClose();
        }, 100);
      }
    } catch (error) {
      console.error('Error exporting canvas:', error);
      alert('Error exporting label. Please try again.');
    }
  };

  // ── deselect on stage background click ───────────────────────────────────
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      selectElement(null);
    }
  };

  // ── keyboard shortcuts ───────────────────────────────────────────────────
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
        const activeElement = document.activeElement;
        const isEditingText =
          (activeElement?.tagName === 'TEXTAREA' &&
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div
        className="rounded-xl border w-full max-w-[95vw] h-[90vh] flex flex-col transition-colors"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border-color)',
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
            <button
              onClick={handleAddText}
              className="px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors text-sm"
              style={{
                backgroundColor:
                  selectedElement?.type === 'text' ? '#4DB64F' : 'var(--card-bg)',
                borderColor:
                  selectedElement?.type === 'text'
                    ? '#4DB64F'
                    : 'var(--border-color)',
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
                backgroundColor:
                  selectedElement?.type === 'image' || !selectedElement
                    ? '#4DB64F'
                    : 'var(--card-bg)',
                borderColor:
                  selectedElement?.type === 'image' || !selectedElement
                    ? '#4DB64F'
                    : 'var(--border-color)',
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
                borderColor: 'var(--border-color)',
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
              className="rounded-lg inline-block relative transition-colors"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'var(--card-bg)',
                padding: `${50 * displayScale}px`,
              }}
            >
              {/* Dimension Overlay SVG */}
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: `0px`,
                  top: `0px`,
                  width: `${CANVAS_WIDTH * displayScale + 100 * displayScale}px`,
                  height: `${CANVAS_HEIGHT * displayScale + 100 * displayScale}px`,
                  zIndex: 2,
                }}
              >
                {/* Width dimension line */}
                <line
                  x1={50 * displayScale}
                  y1={CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale}
                  x2={CANVAS_WIDTH * displayScale + 50 * displayScale}
                  y2={CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale}
                  stroke="#4DB64F"
                  strokeWidth={2.5 * displayScale}
                />
                <path
                  d={`M ${50 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale} L ${50 * displayScale + 12 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale - 6 * displayScale} L ${50 * displayScale + 12 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale + 6 * displayScale} Z`}
                  fill="#4DB64F"
                />
                <path
                  d={`M ${CANVAS_WIDTH * displayScale + 50 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale} L ${CANVAS_WIDTH * displayScale + 50 * displayScale - 12 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale - 6 * displayScale} L ${CANVAS_WIDTH * displayScale + 50 * displayScale - 12 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale + 20 * displayScale + 6 * displayScale} Z`}
                  fill="#4DB64F"
                />
                <text
                  x={(CANVAS_WIDTH * displayScale + 100 * displayScale) / 2}
                  y={CANVAS_HEIGHT * displayScale + 50 * displayScale + 45 * displayScale}
                  fill="#4DB64F"
                  fontSize={24 * displayScale}
                  textAnchor="middle"
                  fontFamily="Arial"
                  fontWeight="700"
                >
                  7 inch
                </text>
                {/* Height dimension line */}
                <line
                  x1={CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale}
                  y1={50 * displayScale}
                  x2={CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale}
                  y2={CANVAS_HEIGHT * displayScale + 50 * displayScale}
                  stroke="#4DB64F"
                  strokeWidth={2.5 * displayScale}
                />
                <path
                  d={`M ${CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale},${50 * displayScale} L ${CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale - 6 * displayScale},${50 * displayScale + 12 * displayScale} L ${CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale + 6 * displayScale},${50 * displayScale + 12 * displayScale} Z`}
                  fill="#4DB64F"
                />
                <path
                  d={`M ${CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale} L ${CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale - 6 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale - 12 * displayScale} L ${CANVAS_WIDTH * displayScale + 50 * displayScale + 20 * displayScale + 6 * displayScale},${CANVAS_HEIGHT * displayScale + 50 * displayScale - 12 * displayScale} Z`}
                  fill="#4DB64F"
                />
                <text
                  x={CANVAS_WIDTH * displayScale + 50 * displayScale + 50 * displayScale}
                  y={(CANVAS_HEIGHT * displayScale + 100 * displayScale) / 2}
                  fill="#4DB64F"
                  fontSize={24 * displayScale}
                  textAnchor="middle"
                  fontFamily="Arial"
                  fontWeight="700"
                  transform={`rotate(-90 ${CANVAS_WIDTH * displayScale + 50 * displayScale + 50 * displayScale} ${(CANVAS_HEIGHT * displayScale + 100 * displayScale) / 2})`}
                >
                  2 inch
                </text>
              </svg>

              {/* Konva Stage */}
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH * displayScale}
                height={CANVAS_HEIGHT * displayScale}
                scaleX={displayScale}
                scaleY={displayScale}
                onClick={handleStageClick}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Layer>
                  {/* Background rect */}
                  <Rect
                    name="background"
                    x={0}
                    y={0}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    fill={backgroundColor}
                  />

                  {/* All elements */}
                  {elements.map((el) =>
                    el.type === 'image' ? (
                      <ImageNode
                        key={el.id}
                        element={el}
                        isSelected={!!el.selected}
                        onSelect={() => selectElement(el.id)}
                        onChange={(attrs) => updateElement(el.id, attrs)}
                      />
                    ) : (
                      <TextNode
                        key={el.id}
                        element={el}
                        isSelected={!!el.selected}
                        onSelect={() => selectElement(el.id)}
                        onChange={(attrs) => updateElement(el.id, attrs)}
                        onDoubleClick={() => handleTextDoubleClick(el)}
                      />
                    )
                  )}

                  {/* Fixed Company Description - Vertical, black background, white text, full height */}
                  <Group
                    x={CANVAS_WIDTH}
                    y={0}
                    rotation={90}
                    listening={false}
                  >
                    {/* Black background rectangle - full height, 0.5 inch width */}
                    <Rect
                      x={0}
                      y={0}
                      width={CANVAS_HEIGHT}
                      height={COMPANY_DESC_WIDTH}
                      fill="#000000"
                    />
                    {/* White text with padding on all sides */}
                    <Text
                      x={COMPANY_DESC_PADDING}
                      y={COMPANY_DESC_PADDING}
                      width={CANVAS_HEIGHT - (COMPANY_DESC_PADDING * 2)}
                      text={COMPANY_DESC_TEXT}
                      fontSize={COMPANY_DESC_FONT_SIZE}
                      fontFamily="Arial"
                      fill="#FFFFFF"
                      align="left"
                      listening={false}
                      perfectDrawEnabled={false}
                      hitStrokeWidth={0}
                    />
                  </Group>
                </Layer>
              </Stage>

              {/* Inline text editor overlay */}
              {editingElementId && (() => {
                const element = elements.find((el) => el.id === editingElementId);
                if (!element || element.type !== 'text') return null;

                return (
                  <textarea
                    ref={inlineInputRef}
                    value={editingText}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditingText(newValue);
                      updateElement(editingElementId, { data: newValue });
                    }}
                    onBlur={() => {
                      if (editingElementId) {
                        updateElement(editingElementId, { data: editingText });
                        useLabelEditorStore.getState().saveHistory();
                      }
                      setEditingElementId(null);
                      setEditingText('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.stopPropagation();
                        return;
                      }
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        if (editingElementId) {
                          updateElement(editingElementId, { data: editingText });
                          useLabelEditorStore.getState().saveHistory();
                        }
                        setEditingElementId(null);
                        setEditingText('');
                        inlineInputRef.current?.blur();
                      } else if (e.key === 'Escape') {
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
                      background: '#000000',
                      color: '#ffffff',
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
                      transform:
                        element.rotation !== 0
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

          {/* Right Sidebar - Keep all existing sidebar code */}
          <div
            className="w-80 border-l overflow-y-auto flex flex-col transition-colors"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--border-color)',
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
                    borderColor: 'var(--border-color)',
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

            {/* Image Properties Section */}
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
                        borderColor: 'var(--border-color)',
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
                          borderColor: 'var(--border-color)',
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

            {/* Text Color Section */}
            {selectedElement && selectedElement.type === 'text' && (
              <div
                className="p-4 border-b transition-colors"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
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
                      borderColor: 'var(--border-color)',
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
                          if (selectedElement) {
                            handleTextDoubleClick(selectedElement);
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
                          color: 'var(--text-primary)',
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
                          updateElement(selectedElement.id, { data: e.target.value });
                        }}
                        onBlur={() => {
                          useLabelEditorStore.getState().saveHistory();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' || e.key === 'Delete') {
                            e.stopPropagation();
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

                    {/* Font Size */}
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

                    {/* Font Style */}
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
                            backgroundColor:
                              selectedElement.fontWeight === 'bold'
                                ? '#4DB64F'
                                : 'var(--card-bg)',
                            borderColor:
                              selectedElement.fontWeight === 'bold'
                                ? '#4DB64F'
                                : 'var(--border-color)',
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
                            backgroundColor:
                              selectedElement.fontStyle === 'italic'
                                ? '#4DB64F'
                                : 'var(--card-bg)',
                            borderColor:
                              selectedElement.fontStyle === 'italic'
                                ? '#4DB64F'
                                : 'var(--border-color)',
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
                            backgroundColor:
                              selectedElement.textDecoration === 'underline'
                                ? '#4DB64F'
                                : 'var(--card-bg)',
                            borderColor:
                              selectedElement.textDecoration === 'underline'
                                ? '#4DB64F'
                                : 'var(--border-color)',
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

                    {/* Font Family */}
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
                          paddingRight: '36px',
                        }}
                      >
                        {[
                          'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
                          'Verdana', 'Georgia', 'Palatino', 'Garamond',
                          'Comic Sans MS', 'Impact', 'Roboto', 'Open Sans',
                          'Montserrat', 'Lato', 'Poppins', 'Inter',
                          'Playfair Display', 'Raleway', 'Oswald', 'Source Sans Pro',
                        ].map((f) => (
                          <option
                            key={f}
                            value={f}
                            style={{
                              fontFamily: f,
                              backgroundColor: '#1E1E1E',
                              color: '#ffffff',
                            }}
                          >
                            {f}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        Current:{' '}
                        <span style={{ fontFamily: selectedElement.fontFamily || 'Arial' }}>
                          {selectedElement.fontFamily || 'Arial'}
                        </span>
                      </p>
                    </div>

                    {/* Text Align */}
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
                          paddingRight: '36px',
                        }}
                      >
                        <option value="left" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}>
                          Left
                        </option>
                        <option value="center" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}>
                          Center
                        </option>
                        <option value="right" style={{ backgroundColor: '#1E1E1E', color: '#ffffff' }}>
                          Right
                        </option>
                      </select>
                    </div>

                    {/* Letter Spacing */}
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
                <p>
                  Click on a text or image element on the canvas to select it and edit its properties.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Click "Add Text" to create a new text element, then click on it to select.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div
          className="p-4 border-t flex items-center justify-between transition-colors"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--border-color)',
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
              Elements:{' '}
              <span
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
                <span className="text-[#4DB64F] font-medium transition-colors">
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
                color: 'var(--text-primary)',
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
                color: 'var(--text-primary)',
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
