/**
 * Pricing utility for custom labeled 500ml bottles
 * Based on client requirements:
 * - Minimum order: 10 cases (300 bottles)
 * - Pricing tiers based on quantity
 * - Cap color pricing (white free, black $0.05, blue/others $0.08)
 * - One-time setup fee: $150 for design and color of logo
 * - Poly Shrink Wrap: $1.99 per case of 30
 * - Shipping: Pick-up free, Local Scheduled Delivery $50
 */

export const BOTTLES_PER_CASE = 30;
export const MINIMUM_CASES = 10;
export const MINIMUM_BOTTLES = MINIMUM_CASES * BOTTLES_PER_CASE; // 300

export const SETUP_FEE = 150; // One-time fee for design and color of logo
export const SHRINK_WRAP_PER_CASE = 1.99;

export const SHIPPING_OPTIONS = {
  PICKUP: { name: 'Pick-up (Free)', price: 0 },
  LOCAL_DELIVERY: { name: 'Local Scheduled Delivery', price: 50 },
  SHIPPING: { name: 'Shipping (Quote Required)', price: 0 }, // Price calculated separately
};

export type CapColor = 'white' | 'black' | 'blue' | 'other';
export type ShippingMethod = 'pickup' | 'local_delivery' | 'shipping';

/**
 * Get price per bottle based on quantity
 */
export function getBottlePrice(quantity: number): number {
  if (quantity >= 1500) {
    // Pallet (1,500)
    return 0.90;
  } else if (quantity >= 900) {
    // 900 - 1,470
    return 0.94;
  } else if (quantity >= 600) {
    // 600 - 870
    return 0.96;
  } else if (quantity >= 300) {
    // 300 - 570
    return 1.05;
  } else {
    // Below minimum - return highest price as fallback
    return 1.05;
  }
}

/**
 * Map hex color to CapColor type
 */
export function hexToCapColor(hexColor: string): CapColor {
  // Normalize hex color (remove #, convert to lowercase)
  const normalized = hexColor.replace('#', '').toLowerCase();
  
  // Common white colors
  const whiteColors = ['ffffff', 'fff', 'white'];
  if (whiteColors.includes(normalized) || normalized.startsWith('fff')) {
    return 'white';
  }
  
  // Common black colors
  const blackColors = ['000000', '000', 'black'];
  if (blackColors.includes(normalized) || normalized.startsWith('000')) {
    return 'black';
  }
  
  // Common blue colors (approximate RGB values)
  // Blue typically has high blue component and lower red/green
  if (normalized.length === 6) {
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    
    // Check if it's a blue color (blue component is dominant)
    if (b > r + 30 && b > g + 30 && b > 100) {
      return 'blue';
    }
  }
  
  // Default to 'other' for any other color
  return 'other';
}

/**
 * Get cap color price per bottle
 */
export function getCapColorPrice(capColor: CapColor): number {
  switch (capColor) {
    case 'white':
      return 0; // White caps are free
    case 'black':
      return 0.05;
    case 'blue':
    case 'other':
      return 0.08;
    default:
      return 0;
  }
}

/**
 * Get cap color price from hex color
 */
export function getCapColorPriceFromHex(hexColor: string): number {
  const capColor = hexToCapColor(hexColor);
  return getCapColorPrice(capColor);
}

/**
 * Calculate total price for an order
 */
export interface OrderPricing {
  quantity: number;
  capColor: CapColor;
  shrinkWrap: boolean;
  shippingMethod: ShippingMethod;
  hasSetupFee: boolean; // Whether to include setup fee (first order or new design)
}

export function calculateOrderPrice(pricing: OrderPricing): {
  bottlePrice: number;
  capPrice: number;
  shrinkWrapPrice: number;
  setupFee: number;
  shippingPrice: number;
  subtotal: number;
  total: number;
  breakdown: {
    bottles: number;
    caps: number;
    shrinkWrap: number;
    setupFee: number;
    shipping: number;
  };
} {
  const { quantity, capColor, shrinkWrap, shippingMethod, hasSetupFee } = pricing;

  // Calculate number of cases
  const cases = Math.ceil(quantity / BOTTLES_PER_CASE);

  // Base bottle price
  const bottlePricePerUnit = getBottlePrice(quantity);
  const bottleTotal = quantity * bottlePricePerUnit;

  // Cap color price
  const capPricePerUnit = getCapColorPrice(capColor);
  const capTotal = quantity * capPricePerUnit;

  // Shrink wrap (if selected)
  const shrinkWrapTotal = shrinkWrap ? cases * SHRINK_WRAP_PER_CASE : 0;

  // Setup fee (one-time)
  const setupFeeTotal = hasSetupFee ? SETUP_FEE : 0;

  // Shipping
  let shippingTotal = 0;
  if (shippingMethod === 'local_delivery') {
    shippingTotal = SHIPPING_OPTIONS.LOCAL_DELIVERY.price;
  } else if (shippingMethod === 'shipping') {
    // Shipping quotes obtained separately
    shippingTotal = 0;
  } else {
    // Pickup is free
    shippingTotal = 0;
  }

  // Subtotal (before shipping)
  const subtotal = bottleTotal + capTotal + shrinkWrapTotal + setupFeeTotal;

  // Total (including shipping)
  const total = subtotal + shippingTotal;

  return {
    bottlePrice: bottlePricePerUnit,
    capPrice: capPricePerUnit,
    shrinkWrapPrice: shrinkWrap ? SHRINK_WRAP_PER_CASE : 0,
    setupFee: setupFeeTotal,
    shippingPrice: shippingTotal,
    subtotal,
    total,
    breakdown: {
      bottles: bottleTotal,
      caps: capTotal,
      shrinkWrap: shrinkWrapTotal,
      setupFee: setupFeeTotal,
      shipping: shippingTotal,
    },
  };
}

/**
 * Get pricing tier information for display
 */
export function getPricingTiers() {
  return [
    { min: 300, max: 570, price: 1.05, label: '300 - 570 bottles' },
    { min: 600, max: 870, price: 0.96, label: '600 - 870 bottles' },
    { min: 900, max: 1470, price: 0.94, label: '900 - 1,470 bottles' },
    { min: 1500, max: Infinity, price: 0.90, label: 'Pallet (1,500+)' },
  ];
}

/**
 * Get cap color options with pricing
 */
export function getCapColorOptions(): Array<{ value: CapColor; label: string; price: number }> {
  return [
    { value: 'white', label: 'White (Free)', price: 0 },
    { value: 'black', label: 'Black (+$0.05/bottle)', price: 0.05 },
    { value: 'blue', label: 'Blue (+$0.08/bottle)', price: 0.08 },
    { value: 'other', label: 'Other Colors (+$0.08/bottle)', price: 0.08 },
  ];
}

