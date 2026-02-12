'use client';

/**
 * LabelEditor — rewritten with react-konva
 *
 * Install:  npm install konva react-konva
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
import {
  Stage, Layer, Rect, Image as KonvaImage, Text,
  Transformer, Group,
} from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';           // npm install use-image
import {
  useLabelEditorStore,
  LabelElement,
} from '@/store/useLabelEditorStore';
import FigmaColorPicker from '@/components/ui/FigmaColorPicker';
import NumericInput from '@/components/ui/NumericInput';
import {
  Trash2, Copy, ArrowUp, ArrowDown,
  FlipHorizontal, FlipVertical, Undo, Redo,
  Download, Type, Image as ImageIcon,
} from 'lucide-react';

const CANVAS_WIDTH  = 2000;
const CANVAS_HEIGHT = 544;
const DISPLAY_SCALE = 0.5;          // Stage is rendered at 50 %

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
  const [img] = useImage(element.data);          // use-image handles caching + async load
  const shapeRef = useRef<Konva.Image>(null);
  const trRef    = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);   // attach Transformer to this node
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
        draggable                                // ← all dragging handled by Konva
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({            // sync position back to store
          x: e.target.x(),
          y: e.target.y(),
        })}
        onTransformEnd={(e) => {               // sync resize/rotate back to store
          const node = shapeRef.current!;
          onChange({
            x:        node.x(),
            y:        node.y(),
            width:    node.width()  * node.scaleX(),
            height:   node.height() * node.scaleY(),
            rotation: node.rotation(),
            scaleX:   1,                        // bake scale into width/height
            scaleY:   1,
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />

      {/* Transformer renders the 8 handles + rotate handle automatically */}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={false}                     // set true to lock aspect ratio
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
}: {
  element: LabelElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<LabelElement>) => void;
}) {
  const shapeRef = useRef<Konva.Text>(null);
  const trRef    = useRef<Konva.Transformer>(null);

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
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          onChange({
            x:        node.x(),
            y:        node.y(),
            width:    node.width() * node.scaleX(),
            rotation: node.rotation(),
            scaleX:   1,
            scaleY:   1,
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[            // text only needs width resizing
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
// Main editor
// ─────────────────────────────────────────────────────────────────────────────

interface LabelEditorProps {
  onExport?: (base64Image: string) => void;
}

export default function LabelEditor({ onExport }: LabelEditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    backgroundColor, elements,
    setBackgroundColor, addElement, updateElement, deleteElement,
    selectElement, duplicateElement, bringToFront, sendToBack,
    flipHorizontal, flipVertical, undo, redo, canUndo, canRedo,
  } = useLabelEditorStore();

  const selectedElement = elements.find((el) => el.selected);

  // ── keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); if (canUndo()) undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); if (canRedo()) redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) deleteElement(selectedElement.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault(); if (selectedElement) duplicateElement(selectedElement.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedElement, canUndo, canRedo, undo, redo, deleteElement, duplicateElement]);

  // ── image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      const img  = new Image();
      img.onload = () => {
        const maxW = CANVAS_WIDTH * 0.8, maxH = CANVAS_HEIGHT * 0.8;
        let { width: w, height: h } = img;
        if (w > maxW || h > maxH) { const sc = Math.min(maxW/w, maxH/h); w *= sc; h *= sc; }
        addElement({
          type: 'image', data,
          x: (CANVAS_WIDTH - w) / 2, y: (CANVAS_HEIGHT - h) / 2,
          width: w, height: h,
          rotation: 0, scaleX: 1, scaleY: 1,
        });
      };
      img.src = data;
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => addElement({
    type: 'text',
    x: CANVAS_WIDTH / 2 - 100, y: CANVAS_HEIGHT / 2 - 12,
    width: 200, height: 24,
    rotation: 0, scaleX: 1, scaleY: 1,
    data: 'New Text', fontSize: 24, fontFamily: 'Arial',
    color: '#000000', textAlign: 'center',
    fontWeight: 'normal', fontStyle: 'normal',
    textDecoration: 'none', letterSpacing: 0,
  });

  // ── export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!stageRef.current) return;
    // Temporarily scale stage to full resolution for export
    const stage = stageRef.current;
    stage.scale({ x: 1, y: 1 });
    stage.size({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    const dataURL = stage.toDataURL({ pixelRatio: 1 });
    stage.scale({ x: DISPLAY_SCALE, y: DISPLAY_SCALE });
    stage.size({ width: CANVAS_WIDTH * DISPLAY_SCALE, height: CANVAS_HEIGHT * DISPLAY_SCALE });

    if (onExport) { onExport(dataURL); }
    else { const a = document.createElement('a'); a.download = 'label-design.png'; a.href = dataURL; a.click(); }
  };

  // ── deselect on stage background click ───────────────────────────────────
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      selectElement(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E]">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <button onClick={handleAddText} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center gap-2">
          <Type className="w-4 h-4" /> Add Text
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Add Image
        </button>
        <div className="flex-1" />
        <button onClick={undo}  disabled={!canUndo()} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50"><Undo  className="w-4 h-4" /></button>
        <button onClick={redo}  disabled={!canRedo()} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50"><Redo  className="w-4 h-4" /></button>
        <button onClick={handleExport} className="px-4 py-2 bg-[#4DB64F] hover:bg-[#45a049] rounded-lg text-white flex items-center gap-2">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="w-80 border-r border-white/10 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Background Color</label>
            <div className="w-12 h-12 rounded border-2 border-white/20 cursor-pointer" style={{ backgroundColor }} onClick={() => setShowColorPicker(!showColorPicker)} />
            {showColorPicker && <div className="mt-2"><FigmaColorPicker color={backgroundColor} onChange={setBackgroundColor} /></div>}
          </div>

          {selectedElement && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white">
                {selectedElement.type === 'text' ? 'Text Properties' : 'Image Properties'}
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <NumericInput label="X"      value={Math.round(selectedElement.x)}      onChange={(v) => updateElement(selectedElement.id, { x: v })} />
                <NumericInput label="Y"      value={Math.round(selectedElement.y)}      onChange={(v) => updateElement(selectedElement.id, { y: v })} />
                <NumericInput label="Width"  value={Math.round(selectedElement.width)}  onChange={(v) => updateElement(selectedElement.id, { width: v })}  min={10} />
                <NumericInput label="Height" value={Math.round(selectedElement.height)} onChange={(v) => updateElement(selectedElement.id, { height: v })} min={10} />
              </div>
              <NumericInput label="Rotation" value={Math.round(selectedElement.rotation)} onChange={(v) => updateElement(selectedElement.id, { rotation: v })} min={0} max={360} />

              {selectedElement.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Text Content</label>
                    <textarea value={selectedElement.data} onChange={(e) => updateElement(selectedElement.id, { data: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]" rows={3} />
                  </div>
                  <NumericInput label="Font Size" value={selectedElement.fontSize ?? 24} onChange={(v) => updateElement(selectedElement.id, { fontSize: v })} min={8} max={200} />
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Font Family</label>
                    <select value={selectedElement.fontFamily ?? 'Arial'} onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]">
                      {['Arial','Helvetica','Times New Roman','Courier New','Verdana','Georgia','Palatino','Garamond','Comic Sans MS','Impact'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Text Color</label>
                    <div className="w-12 h-12 rounded border-2 border-white/20 cursor-pointer" style={{ backgroundColor: selectedElement.color ?? '#000000' }} onClick={() => setShowColorPicker(!showColorPicker)} />
                    {showColorPicker && <div className="mt-2"><FigmaColorPicker color={selectedElement.color ?? '#000000'} onChange={(c) => updateElement(selectedElement.id, { color: c })} /></div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Text Align</label>
                    <select value={selectedElement.textAlign ?? 'left'} onChange={(e) => updateElement(selectedElement.id, { textAlign: e.target.value as 'left'|'center'|'right' })} className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#4DB64F]">
                      <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`flex-1 px-3 py-2 rounded-lg border ${selectedElement.fontWeight === 'bold' ? 'bg-[#4DB64F] text-white border-[#4DB64F]' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}>Bold</button>
                    <button onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`flex-1 px-3 py-2 rounded-lg border ${selectedElement.fontStyle === 'italic' ? 'bg-[#4DB64F] text-white border-[#4DB64F]' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}>Italic</button>
                    <button onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })} className={`flex-1 px-3 py-2 rounded-lg border ${selectedElement.textDecoration === 'underline' ? 'bg-[#4DB64F] text-white border-[#4DB64F]' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}>Underline</button>
                  </div>
                  <NumericInput label="Letter Spacing" value={selectedElement.letterSpacing ?? 0} onChange={(v) => updateElement(selectedElement.id, { letterSpacing: v })} min={-10} max={20} step={0.1} />
                </>
              )}

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => bringToFront(selectedElement.id)} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center"><ArrowUp   className="w-4 h-4" /></button>
                  <button onClick={() => sendToBack(selectedElement.id)}   className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center"><ArrowDown className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => flipHorizontal(selectedElement.id)} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center"><FlipHorizontal className="w-4 h-4" /></button>
                  <button onClick={() => flipVertical(selectedElement.id)}   className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center"><FlipVertical   className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => duplicateElement(selectedElement.id)} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-center"><Copy   className="w-4 h-4" /></button>
                  <button onClick={() => deleteElement(selectedElement.id)}    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Canvas (Stage) ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white/5 rounded-lg p-4 inline-block" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>

            {/*
              Stage replaces <canvas> entirely.
              - scale handles the displayScale coordinate conversion automatically
              - No more manual screenToCanvas() math anywhere
            */}
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH  * DISPLAY_SCALE}
              height={CANVAS_HEIGHT * DISPLAY_SCALE}
              scaleX={DISPLAY_SCALE}
              scaleY={DISPLAY_SCALE}
              onClick={handleStageClick}
            >
              <Layer>
                {/* Background rect — deselects when clicked */}
                <Rect
                  name="background"
                  x={0} y={0}
                  width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
                  fill={backgroundColor}
                />

                {/* All elements — order = z-order */}
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

          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
    </div>
  );
}
