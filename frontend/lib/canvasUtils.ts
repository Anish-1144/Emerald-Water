import { LabelElement } from '@/store/useLabelEditorStore';

/**
 * Hit detection for rotated rectangles
 */
export function isPointInElement(
  x: number,
  y: number,
  element: LabelElement
): boolean {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const rotation = (element.rotation * Math.PI) / 180;

  const dx = x - centerX;
  const dy = y - centerY;

  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  let halfWidth: number;
  let halfHeight: number;

  if (element.type === 'text') {
    halfWidth  = (Math.abs(element.width  * element.scaleX)) / 2 + 20;
    halfHeight = (Math.abs(element.height * element.scaleY)) / 2 + 10;
  } else {
    halfWidth  = (Math.abs(element.width  * element.scaleX)) / 2;
    halfHeight = (Math.abs(element.height * element.scaleY)) / 2;
  }

  return (
    localX >= -halfWidth  && localX <= halfWidth &&
    localY >= -halfHeight && localY <= halfHeight
  );
}

/**
 * Get resize handle at point.
 *
 * ALL values must be in the SAME coordinate space.
 * LabelEditor passes canvas-space coords (mouse / displayScale) and
 * raw store elements (also canvas-space), with handleSize in canvas units.
 *
 * rotationHandleOffset: how far above the element the rotate dot sits,
 * in the SAME units. Must match what renderCanvas draws.
 */
export function getResizeHandle(
  x: number,
  y: number,
  element: LabelElement,
  handleSize: number,
  rotationHandleOffset: number   // canvas units, positive = above element
): 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | null {
  const centerX  = element.x + element.width  / 2;
  const centerY  = element.y + element.height / 2;
  const rotation = (element.rotation * Math.PI) / 180;

  // Transform mouse point into element's local (un-rotated) space
  const dx = x - centerX;
  const dy = y - centerY;
  const cos    = Math.cos(-rotation);
  const sin    = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const hw = (Math.abs(element.width  * element.scaleX)) / 2;
  const hh = (Math.abs(element.height * element.scaleY)) / 2;

  // ── rotation handle (above top edge) ─────────────────────────────────────
  const rotLY   = -hh - rotationHandleOffset;
  const rotDist = Math.sqrt(localX * localX + (localY - rotLY) * (localY - rotLY));
  if (rotDist <= handleSize) return 'rotate';

  // ── corner handles ────────────────────────────────────────────────────────
  const t = handleSize;
  if (Math.abs(localX + hw) < t && Math.abs(localY + hh) < t) return 'nw';
  if (Math.abs(localX - hw) < t && Math.abs(localY + hh) < t) return 'ne';
  if (Math.abs(localX + hw) < t && Math.abs(localY - hh) < t) return 'sw';
  if (Math.abs(localX - hw) < t && Math.abs(localY - hh) < t) return 'se';

  // ── edge handles ──────────────────────────────────────────────────────────
  if (Math.abs(localY + hh) < t && Math.abs(localX) < hw) return 'n';
  if (Math.abs(localY - hh) < t && Math.abs(localX) < hw) return 's';
  if (Math.abs(localX - hw) < t && Math.abs(localY) < hh) return 'e';
  if (Math.abs(localX + hw) < t && Math.abs(localY) < hh) return 'w';

  return null;
}

/**
 * Get cursor style for resize handle
 */
export function getCursorForHandle(
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | null
): string {
  switch (handle) {
    case 'nw': case 'se': return 'nwse-resize';
    case 'ne': case 'sw': return 'nesw-resize';
    case 'n':  case 's':  return 'ns-resize';
    case 'e':  case 'w':  return 'ew-resize';
    case 'rotate':        return 'grab';
    default:              return 'default';
  }
}

/**
 * Calculate new element bounds when resizing
 */
export function calculateResize(
  element: LabelElement,
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w',
  deltaX: number,
  deltaY: number
): Partial<LabelElement> {
  // Non-rotated path
  if (element.rotation === 0 || Math.abs(element.rotation) < 0.01) {
    let newX = element.x, newY = element.y;
    let newW = element.width, newH = element.height;

    switch (handle) {
      case 'nw': newX += deltaX; newY += deltaY; newW -= deltaX; newH -= deltaY; break;
      case 'ne':                 newY += deltaY; newW += deltaX; newH -= deltaY; break;
      case 'sw': newX += deltaX;                newW -= deltaX; newH += deltaY; break;
      case 'se':                                newW += deltaX; newH += deltaY; break;
      case 'n':                  newY += deltaY;                newH -= deltaY; break;
      case 's':                                                 newH += deltaY; break;
      case 'e':                                 newW += deltaX;                 break;
      case 'w':  newX += deltaX;                newW -= deltaX;                 break;
    }

    const min = 10;
    if (newW < min) { if (['nw','sw','w'].includes(handle)) newX = element.x + element.width - min; newW = min; }
    if (newH < min) { if (['nw','ne','n'].includes(handle)) newY = element.y + element.height - min; newH = min; }
    return { x: newX, y: newY, width: newW, height: newH };
  }

  // Rotated path — convert delta to element-local space first
  const rad = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const ldx =  deltaX * cos + deltaY * sin;
  const ldy = -deltaX * sin + deltaY * cos;

  let newX = element.x, newY = element.y;
  let newW = element.width, newH = element.height;

  switch (handle) {
    case 'nw': newX += ldx; newY += ldy; newW -= ldx; newH -= ldy; break;
    case 'ne':              newY += ldy; newW += ldx; newH -= ldy; break;
    case 'sw': newX += ldx;              newW -= ldx; newH += ldy; break;
    case 'se':                           newW += ldx; newH += ldy; break;
    case 'n':               newY += ldy;              newH -= ldy; break;
    case 's':                                         newH += ldy; break;
    case 'e':                            newW += ldx;              break;
    case 'w':  newX += ldx;              newW -= ldx;              break;
  }

  const min = 10;
  if (newW < min) { if (['nw','sw','w'].includes(handle)) newX = element.x + element.width - min; newW = min; }
  if (newH < min) { if (['nw','ne','n'].includes(handle)) newY = element.y + element.height - min; newH = min; }
  return { x: newX, y: newY, width: newW, height: newH };
}

/**
 * Calculate rotation angle from mouse position relative to element center
 */
export function calculateRotation(
  element: LabelElement,
  mouseX: number,
  mouseY: number
): number {
  const cx = element.x + element.width  / 2;
  const cy = element.y + element.height / 2;
  let angle = Math.atan2(mouseY - cy, mouseX - cx) * (180 / Math.PI);
  return (angle + 360) % 360 - 90;
}

/**
 * Get element corners in world coordinates (for drawing selection box)
 */
export function getElementCorners(element: LabelElement): { x: number; y: number }[] {
  const cx  = element.x + element.width  / 2;
  const cy  = element.y + element.height / 2;
  const rad = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const hw  = (element.width  * Math.abs(element.scaleX)) / 2;
  const hh  = (element.height * Math.abs(element.scaleY)) / 2;

  return [
    { x: -hw, y: -hh }, { x: hw, y: -hh },
    { x:  hw, y:  hh }, { x: -hw, y: hh },
  ].map(({ x, y }) => ({
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos,
  }));
}