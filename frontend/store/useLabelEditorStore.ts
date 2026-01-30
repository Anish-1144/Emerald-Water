import { create } from 'zustand';

export interface LabelElement {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  data: string;
  selected: boolean;
  // Text-only properties
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  letterSpacing?: number;
}

interface HistorySnapshot {
  backgroundColor: string;
  elements: LabelElement[];
}

interface LabelEditorState {
  backgroundColor: string;
  elements: LabelElement[];
  history: HistorySnapshot[];
  historyIndex: number;
  maxHistorySize: number;
  canvasWidth: number;
  canvasHeight: number;

  // Actions
  setBackgroundColor: (color: string) => void;
  addElement: (elementData: Omit<LabelElement, 'id' | 'selected'>) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  duplicateElement: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  flipHorizontal: (id: string) => void;
  flipVertical: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveHistory: () => void;
  exportCanvas: () => Promise<string>;
}

const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to draw element on canvas (used by export and preview)
export function drawElementOnCanvas(
  ctx: CanvasRenderingContext2D,
  element: LabelElement,
  canvasWidth: number,
  canvasHeight: number,
  preloadedImage?: HTMLImageElement
) {
  ctx.save();

  // Calculate center point
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  // Apply transforms: translate to center, rotate, scale, translate back
  ctx.translate(centerX, centerY);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.scale(element.scaleX, element.scaleY);
  ctx.translate(-centerX, -centerY);

  if (element.type === 'image') {
    // Draw image (use preloaded image if provided, otherwise try to load)
    if (preloadedImage && preloadedImage.complete) {
      ctx.drawImage(
        preloadedImage,
        element.x,
        element.y,
        element.width,
        element.height
      );
    } else {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(
          img,
          element.x,
          element.y,
          element.width,
          element.height
        );
      };
      img.src = element.data;
    }
  } else if (element.type === 'text') {
    // Draw text
    ctx.fillStyle = element.color || '#000000';
    ctx.strokeStyle = element.color || '#000000';
    
    // Build font string
    const fontStyle = element.fontStyle || 'normal';
    const fontWeight = element.fontWeight || 'normal';
    const fontSize = element.fontSize || 24;
    const fontFamily = element.fontFamily || 'Arial';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    
    ctx.textAlign = element.textAlign || 'left';
    ctx.textBaseline = 'top';
    
    // Calculate text position based on alignment
    let textX = element.x;
    if (element.textAlign === 'center') {
      textX = element.x + element.width / 2;
    } else if (element.textAlign === 'right') {
      textX = element.x + element.width;
    }

    // Apply letter spacing by drawing characters individually
    const text = element.data || ''; // Ensure text is always a string, even if empty
    const letterSpacing = element.letterSpacing || 0;
    
    // Only draw text if it's not empty
    if (text.length > 0) {
      if (letterSpacing === 0) {
        ctx.fillText(text, textX, element.y);
      } else {
        let currentX = textX;
        for (let i = 0; i < text.length; i++) {
          ctx.fillText(text[i], currentX, element.y);
          const metrics = ctx.measureText(text[i]);
          currentX += metrics.width + letterSpacing;
        }
      }
      
      // Draw underline if needed
      if (element.textDecoration === 'underline') {
        const metrics = ctx.measureText(text);
        const fontSize = element.fontSize || 24;
        const underlineY = element.y + fontSize;
        ctx.beginPath();
        ctx.moveTo(textX, underlineY);
        
        if (letterSpacing === 0) {
          ctx.lineTo(textX + metrics.width, underlineY);
        } else {
          let currentX = textX;
          for (let i = 0; i < text.length; i++) {
            const charMetrics = ctx.measureText(text[i]);
            currentX += charMetrics.width + letterSpacing;
          }
          ctx.lineTo(currentX - letterSpacing, underlineY);
        }
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

export const useLabelEditorStore = create<LabelEditorState>((set, get) => ({
  // Initial state
  backgroundColor: '#ffffff',
  elements: [],
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  canvasWidth: 2048,
  canvasHeight: 1024,

  // Set background color
  setBackgroundColor: (color) => {
    set({ backgroundColor: color });
    get().saveHistory();
  },

  // Add element
  addElement: (elementData) => {
    const newElement: LabelElement = {
      id: generateId(),
      selected: true, // Auto-select newly added elements
      ...elementData,
    };
    set((state) => ({
      // Deselect all other elements and add new one as selected
      elements: state.elements.map(el => ({ ...el, selected: false })).concat(newElement),
    }));
    get().saveHistory();
  },

  // Update element
  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
    // Don't save history on every update to avoid too many history entries
    // History will be saved on mouse up or when user finishes editing
  },

  // Delete element
  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    }));
    get().saveHistory();
  },

  // Select element (deselect others)
  selectElement: (id) => {
    set((state) => ({
      elements: state.elements.map((el) => ({
        ...el,
        selected: el.id === id,
      })),
    }));
  },

  // Duplicate element
  duplicateElement: (id) => {
    const element = get().elements.find((el) => el.id === id);
    if (element) {
      const newElement: LabelElement = {
        ...element,
        id: generateId(),
        selected: false,
        x: element.x + 20,
        y: element.y + 20,
      };
      set((state) => ({
        elements: [...state.elements, newElement],
      }));
      get().saveHistory();
    }
  },

  // Bring to front
  bringToFront: (id) => {
    set((state) => {
      const element = state.elements.find((el) => el.id === id);
      if (!element) return state;
      const otherElements = state.elements.filter((el) => el.id !== id);
      return {
        elements: [...otherElements, element],
      };
    });
    get().saveHistory();
  },

  // Send to back
  sendToBack: (id) => {
    set((state) => {
      const element = state.elements.find((el) => el.id === id);
      if (!element) return state;
      const otherElements = state.elements.filter((el) => el.id !== id);
      return {
        elements: [element, ...otherElements],
      };
    });
    get().saveHistory();
  },

  // Flip horizontal
  flipHorizontal: (id) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, scaleX: -el.scaleX } : el
      ),
    }));
    get().saveHistory();
  },

  // Flip vertical
  flipVertical: (id) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, scaleY: -el.scaleY } : el
      ),
    }));
    get().saveHistory();
  },

  // Save history
  saveHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    const newState = {
      backgroundColor: state.backgroundColor,
      elements: JSON.parse(JSON.stringify(state.elements)), // Deep clone
    };
    
    newHistory.push(newState);
    
    // Limit history size
    if (newHistory.length > state.maxHistorySize) {
      newHistory.shift();
    } else {
      set({ historyIndex: state.historyIndex + 1 });
    }
    
    set({ history: newHistory });
  },

  // Undo
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1];
      set({
        backgroundColor: previousState.backgroundColor,
        elements: JSON.parse(JSON.stringify(previousState.elements)),
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  // Redo
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      set({
        backgroundColor: nextState.backgroundColor,
        elements: JSON.parse(JSON.stringify(nextState.elements)),
        historyIndex: state.historyIndex + 1,
      });
    }
  },

  // Can undo
  canUndo: () => {
    return get().historyIndex > 0;
  },

  // Can redo
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  // Export canvas
  exportCanvas: async () => {
    return new Promise<string>((resolve) => {
      const state = get();
      const canvas = document.createElement('canvas');
      canvas.width = state.canvasWidth;
      canvas.height = state.canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Draw background
      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern for transparency indication
      if (state.backgroundColor === 'transparent' || state.backgroundColor.includes('rgba')) {
        const gridSize = 20;
        ctx.fillStyle = '#f0f0f0';
        for (let x = 0; x < canvas.width; x += gridSize * 2) {
          for (let y = 0; y < canvas.height; y += gridSize * 2) {
            ctx.fillRect(x, y, gridSize, gridSize);
            ctx.fillRect(x + gridSize, y + gridSize, gridSize, gridSize);
          }
        }
      }

      // Separate text and image elements
      const textElements = state.elements.filter((el) => el.type === 'text');
      const imageElements = state.elements.filter((el) => el.type === 'image');

      // Draw text elements first
      textElements.forEach((element) => {
        drawElementOnCanvas(ctx, element, state.canvasWidth, state.canvasHeight);
      });

      // Load and draw image elements
      if (imageElements.length === 0) {
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      let loadedCount = 0;
      const imageMap = new Map<string, HTMLImageElement>();
      
      imageElements.forEach((element) => {
        const img = new Image();
        img.onload = () => {
          imageMap.set(element.data, img);
          drawElementOnCanvas(ctx, element, state.canvasWidth, state.canvasHeight, img);
          loadedCount++;
          if (loadedCount === imageElements.length) {
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === imageElements.length) {
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.src = element.data;
      });
    });
  },
}));
