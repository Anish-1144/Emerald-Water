import { LabelElement } from '@/store/useLabelEditorStore';

/**
 * Hit detection for rotated rectangles
 * Uses point-in-rotated-rectangle algorithm
 */
export function isPointInElement(
  x: number,
  y: number,
  element: LabelElement
): boolean {
  // Get element bounds
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const rotation = (element.rotation * Math.PI) / 180;

  // Transform point to element's local coordinate system
  const dx = x - centerX;
  const dy = y - centerY;

  // Rotate point back by negative rotation
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // For text elements, use a more generous hitbox
  let halfWidth: number;
  let halfHeight: number;
  
  if (element.type === 'text') {
    // Text elements: use actual width/height but add padding for easier clicking
    halfWidth = (Math.abs(element.width * element.scaleX)) / 2;
    halfHeight = (Math.abs(element.height * element.scaleY)) / 2;
    // Add padding for easier text selection (20px on each side)
    halfWidth += 20;
    halfHeight += 10;
  } else {
    // Image elements: use exact bounds
    halfWidth = (Math.abs(element.width * element.scaleX)) / 2;
    halfHeight = (Math.abs(element.height * element.scaleY)) / 2;
  }

  return (
    localX >= -halfWidth &&
    localX <= halfWidth &&
    localY >= -halfHeight &&
    localY <= halfHeight
  );
}

/**
 * Get resize handle at point (if any)
 * Returns handle position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null
 */
export function getResizeHandle(
  x: number,
  y: number,
  element: LabelElement,
  handleSize: number = 5
): 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | null {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const rotation = (element.rotation * Math.PI) / 180;

  // Transform point to element's local coordinate system
  const dx = x - centerX;
  const dy = y - centerY;

  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const halfWidth = (Math.abs(element.width * element.scaleX)) / 2;
  const halfHeight = (Math.abs(element.height * element.scaleY)) / 2;

  // Check rotation handle (top center, above element)
  const rotateHandleY = -halfHeight - 30;
  const rotateHandleDistance = Math.sqrt(
    localX * localX + (localY - rotateHandleY) * (localY - rotateHandleY)
  );
  if (rotateHandleDistance <= handleSize) {
    return 'rotate';
  }

  // Check corner handles - use slightly larger threshold for easier clicking
  const handleThreshold = handleSize * 1.2; // 1.2x for easier clicking on smaller handles

  // Northwest
  if (
    Math.abs(localX + halfWidth) < handleThreshold &&
    Math.abs(localY + halfHeight) < handleThreshold
  ) {
    return 'nw';
  }
  // Northeast
  if (
    Math.abs(localX - halfWidth) < handleThreshold &&
    Math.abs(localY + halfHeight) < handleThreshold
  ) {
    return 'ne';
  }
  // Southwest
  if (
    Math.abs(localX + halfWidth) < handleThreshold &&
    Math.abs(localY - halfHeight) < handleThreshold
  ) {
    return 'sw';
  }
  // Southeast
  if (
    Math.abs(localX - halfWidth) < handleThreshold &&
    Math.abs(localY - halfHeight) < handleThreshold
  ) {
    return 'se';
  }

  // Check edge handles
  // North
  if (
    Math.abs(localY + halfHeight) < handleThreshold &&
    Math.abs(localX) < halfWidth
  ) {
    return 'n';
  }
  // South
  if (
    Math.abs(localY - halfHeight) < handleThreshold &&
    Math.abs(localX) < halfWidth
  ) {
    return 's';
  }
  // East
  if (
    Math.abs(localX - halfWidth) < handleThreshold &&
    Math.abs(localY) < halfHeight
  ) {
    return 'e';
  }
  // West
  if (
    Math.abs(localX + halfWidth) < handleThreshold &&
    Math.abs(localY) < halfHeight
  ) {
    return 'w';
  }

  return null;
}

/**
 * Get cursor style for resize handle
 */
export function getCursorForHandle(
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'rotate' | null
): string {
  if (handle === null) {
    return 'default';
  }
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'rotate':
      return 'grab';
    default:
      return 'default';
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
  // If element is not rotated, use delta directly (simpler and more accurate)
  if (element.rotation === 0 || Math.abs(element.rotation) < 0.01) {
    let newX = element.x;
    let newY = element.y;
    let newWidth = element.width;
    let newHeight = element.height;

    switch (handle) {
      case 'nw':
        newX += deltaX;
        newY += deltaY;
        newWidth -= deltaX;
        newHeight -= deltaY;
        break;
      case 'ne':
        newY += deltaY;
        newWidth += deltaX;
        newHeight -= deltaY;
        break;
      case 'sw':
        newX += deltaX;
        newWidth -= deltaX;
        newHeight += deltaY;
        break;
      case 'se':
        // Southeast corner: resize both width and height
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 'n':
        newY += deltaY;
        newHeight -= deltaY;
        break;
      case 's':
        newHeight += deltaY;
        break;
      case 'e':
        newWidth += deltaX;
        break;
      case 'w':
        newX += deltaX;
        newWidth -= deltaX;
        break;
    }

    // Ensure minimum size
    const minSize = 10;
    if (newWidth < minSize) {
      if (handle === 'nw' || handle === 'sw' || handle === 'w') {
        newX = element.x + element.width - minSize;
      }
      newWidth = minSize;
    }
    if (newHeight < minSize) {
      if (handle === 'nw' || handle === 'ne' || handle === 'n') {
        newY = element.y + element.height - minSize;
      }
      newHeight = minSize;
    }

    return { x: newX, y: newY, width: newWidth, height: newHeight };
  }

  // For rotated elements, transform delta to element's local space
  const rotation = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  // Transform delta to element's local coordinate space
  const localDeltaX = deltaX * cos + deltaY * sin;
  const localDeltaY = -deltaX * sin + deltaY * cos;

  let newX = element.x;
  let newY = element.y;
  let newWidth = element.width;
  let newHeight = element.height;

  switch (handle) {
    case 'nw':
      newX += localDeltaX;
      newY += localDeltaY;
      newWidth -= localDeltaX;
      newHeight -= localDeltaY;
      break;
    case 'ne':
      newY += localDeltaY;
      newWidth += localDeltaX;
      newHeight -= localDeltaY;
      break;
    case 'sw':
      newX += localDeltaX;
      newWidth -= localDeltaX;
      newHeight += localDeltaY;
      break;
    case 'se':
      // Southeast corner: resize both width and height
      newWidth += localDeltaX;
      newHeight += localDeltaY;
      break;
    case 'n':
      newY += localDeltaY;
      newHeight -= localDeltaY;
      break;
    case 's':
      newHeight += localDeltaY;
      break;
    case 'e':
      newWidth += localDeltaX;
      break;
    case 'w':
      newX += localDeltaX;
      newWidth -= localDeltaX;
      break;
  }

  // Ensure minimum size
  const minSize = 10;
  if (newWidth < minSize) {
    if (handle === 'nw' || handle === 'sw' || handle === 'w') {
      newX = element.x + element.width - minSize;
    }
    newWidth = minSize;
  }
  if (newHeight < minSize) {
    if (handle === 'nw' || handle === 'ne' || handle === 'n') {
      newY = element.y + element.height - minSize;
    }
    newHeight = minSize;
  }

  return { x: newX, y: newY, width: newWidth, height: newHeight };
}

/**
 * Calculate rotation angle from center point
 */
export function calculateRotation(
  element: LabelElement,
  mouseX: number,
  mouseY: number
): number {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  
  // Calculate angle in radians, convert to degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Normalize to 0-360
  angle = (angle + 360) % 360;
  
  return angle - 90; // Adjust so 0° is up
}

/**
 * Get element corners in world coordinates (for drawing selection box)
 */
export function getElementCorners(element: LabelElement): { x: number; y: number }[] {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const rotation = (element.rotation * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const halfWidth = (element.width * Math.abs(element.scaleX)) / 2;
  const halfHeight = (element.height * Math.abs(element.scaleY)) / 2;

  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  return corners.map((corner) => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
}

