import { create } from 'zustand';
import { indexedDBManager } from './indexedDB';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  role: string;
}

interface Design {
  _id?: string;
  design_json: any;
  label_image: string;
  print_pdf: string;
  bottle_snapshot: string;
  is_draft?: boolean;
}

interface CartItem {
  design_id: string;
  design: Design;
  quantity: number;
  price: number;
  capColor?: 'white' | 'black' | 'blue' | 'other';
  shrinkWrap?: boolean;
}

// Lightweight cart item for storage (without large image data)
interface CartItemStorage {
  design_id: string;
  design: {
    _id?: string;
    design_json: any;
    label_image: string; // Keep URL only, not base64
    print_pdf: string;
    bottle_snapshot: string;
    is_draft?: boolean;
  };
  quantity: number;
  price: number;
  capColor?: 'white' | 'black' | 'blue' | 'other';
  shrinkWrap?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

interface DesignState {
  currentDesign: Design | null;
  setCurrentDesign: (design: Design | null) => void;
  savedDesigns: Design[];
  setSavedDesigns: (designs: Design[]) => void;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (designId: string) => void;
  updateQuantity: (designId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize from localStorage if available
  const initializeAuth = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          return { user, token };
        } catch (error) {
          // If user data is corrupted, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return { user: null, token: null };
        }
      }
    }
    return { user: null, token: null };
  };

  const initialState = initializeAuth();

  return {
    user: initialState.user,
    token: initialState.token,
    setAuth: (user, token) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ user, token });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      set({ user: null, token: null });
    },
  };
});

export const useDesignStore = create<DesignState>((set) => ({
  currentDesign: null,
  setCurrentDesign: (design) => set({ currentDesign: design }),
  savedDesigns: [],
  setSavedDesigns: (designs) => set({ savedDesigns: designs }),
}));

export const useCartStore = create<CartState>((set, get) => {
  // Initialize from IndexedDB or localStorage
  const initializeCart = async (): Promise<CartItem[]> => {
    if (typeof window === 'undefined') {
      return [];
    }

    // Try IndexedDB first (for large data)
    if (indexedDBManager.isAvailable()) {
      try {
        const items = await indexedDBManager.getAllCartItems();
        if (items && items.length > 0) {
          console.log('Loaded cart from IndexedDB:', items.length, 'items');
          return items;
        }
      } catch (error) {
        console.warn('Error loading cart from IndexedDB, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        const items = parsedCart.items || [];
        // Migrate to IndexedDB if available
        if (items.length > 0 && indexedDBManager.isAvailable()) {
          try {
            await indexedDBManager.clearCart();
            for (const item of items) {
              await indexedDBManager.saveCartItem(item);
            }
            // Clear localStorage after migration
            localStorage.removeItem('cart');
            console.log('Migrated cart from localStorage to IndexedDB');
          } catch (error) {
            console.warn('Failed to migrate cart to IndexedDB:', error);
          }
        }
        return items;
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem('cart');
    }

    return [];
  };

  // Initialize synchronously with empty array, then load async
  const initialState = { items: [] };
  
  // Load cart asynchronously after store creation
  if (typeof window !== 'undefined') {
    initializeCart().then(items => {
      if (items.length > 0) {
        set({ items });
      }
    });
  }

  // Save to IndexedDB (or localStorage as fallback)
  const saveToStorage = async (items: CartItem[]) => {
    if (typeof window === 'undefined') {
      return;
    }

    // Use IndexedDB if available (handles large data better)
    if (indexedDBManager.isAvailable()) {
      try {
        // Clear existing items
        await indexedDBManager.clearCart();
        
        // Save all items to IndexedDB (can handle large base64 images)
        for (const item of items) {
          await indexedDBManager.saveCartItem(item);
        }
        
        console.log('Saved cart to IndexedDB:', items.length, 'items');
        
        // Also save a lightweight version to localStorage as backup
        try {
          const lightweightItems: CartItemStorage[] = items.map(item => ({
            design_id: item.design_id,
            design: {
              _id: item.design._id,
              design_json: item.design.design_json,
              label_image: item.design.label_image.startsWith('data:') && item.design.label_image.length > 50000 
                ? '' // Skip large base64 in localStorage backup
                : item.design.label_image,
              print_pdf: item.design.print_pdf,
              bottle_snapshot: item.design.bottle_snapshot,
              is_draft: item.design.is_draft,
            },
            quantity: item.quantity,
            price: item.price,
            capColor: item.capColor,
            shrinkWrap: item.shrinkWrap,
          }));
          
          localStorage.setItem('cart', JSON.stringify({ items: lightweightItems }));
        } catch (localError) {
          // localStorage backup failed, but IndexedDB succeeded - that's okay
          console.warn('Failed to save cart backup to localStorage:', localError);
        }
        
        return;
      } catch (error) {
        console.error('Error saving cart to IndexedDB, falling back to localStorage:', error);
        // Fall through to localStorage fallback
      }
    }

    // Fallback to localStorage (with size limits)
    try {
      const lightweightItems: CartItemStorage[] = items.map(item => {
        const design = item.design;
        let labelImage = design.label_image;
        // Remove large base64 images for localStorage
        if (labelImage && labelImage.startsWith('data:image') && labelImage.length > 50000) {
          labelImage = '';
        }
        
        return {
          design_id: item.design_id,
          design: {
            _id: design._id,
            design_json: design.design_json,
            label_image: labelImage,
            print_pdf: design.print_pdf,
            bottle_snapshot: design.bottle_snapshot,
            is_draft: design.is_draft,
          },
          quantity: item.quantity,
          price: item.price,
          capColor: item.capColor,
          shrinkWrap: item.shrinkWrap,
        };
      });
      
      const cartData = JSON.stringify({ items: lightweightItems });
      
      // Check if data is too large (approximate 4MB limit for safety)
      if (cartData.length > 4 * 1024 * 1024) {
        console.warn('Cart data too large for localStorage');
        // Try saving just the last few items
        const lastItems = lightweightItems.slice(-3);
        localStorage.setItem('cart', JSON.stringify({ items: lastItems }));
        console.warn('Only the last 3 items were saved due to storage limits');
        return;
      }
      
      localStorage.setItem('cart', cartData);
    } catch (error: any) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('localStorage quota exceeded');
        try {
          // Clear old cart data
          localStorage.removeItem('cart');
          // Try saving just the last item
          if (items.length > 0) {
            const lastItem = items[items.length - 1];
            const lightweightItem: CartItemStorage = {
              design_id: lastItem.design_id,
              design: {
                _id: lastItem.design._id,
                design_json: lastItem.design.design_json,
                label_image: '',
                print_pdf: lastItem.design.print_pdf,
                bottle_snapshot: lastItem.design.bottle_snapshot,
                is_draft: lastItem.design.is_draft,
              },
              quantity: lastItem.quantity,
              price: lastItem.price,
              capColor: lastItem.capColor,
              shrinkWrap: lastItem.shrinkWrap,
            };
            localStorage.setItem('cart', JSON.stringify({ items: [lightweightItem] }));
            console.warn('Storage cleared. Only the most recent item was saved.');
          }
        } catch (clearError) {
          console.error('Failed to save cart:', clearError);
        }
      } else {
        console.error('Error saving cart:', error);
      }
    }
  };

  return {
    items: initialState.items,
    addToCart: (item) => {
      set((state) => {
        const existing = state.items.find(i => i.design_id === item.design_id);
        let newItems;
        if (existing) {
          newItems = state.items.map(i =>
            i.design_id === item.design_id ? { ...i, quantity: item.quantity } : i
          );
        } else {
          newItems = [...state.items, item];
        }
        saveToStorage(newItems);
        return { items: newItems };
      });
    },
    removeFromCart: (designId) => {
      set((state) => {
        const newItems = state.items.filter(i => i.design_id !== designId);
        saveToStorage(newItems);
        // Also remove from IndexedDB
        if (indexedDBManager.isAvailable()) {
          indexedDBManager.removeCartItem(designId).catch(err => 
            console.warn('Failed to remove from IndexedDB:', err)
          );
        }
        return { items: newItems };
      });
    },
    updateQuantity: (designId, quantity) => {
      set((state) => {
        const newItems = state.items.map(i =>
          i.design_id === designId ? { ...i, quantity } : i
        );
        saveToStorage(newItems);
        return { items: newItems };
      });
    },
    clearCart: () => {
      saveToStorage([]);
      // Also clear IndexedDB
      if (indexedDBManager.isAvailable()) {
        indexedDBManager.clearCart().catch(err => 
          console.warn('Failed to clear IndexedDB:', err)
        );
      }
      set({ items: [] });
    },
  };
});

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialize theme - default to dark, will be set by ThemeProvider
  const initialTheme: 'dark' | 'light' = 'dark';

  return {
    theme: initialTheme,
    toggleTheme: () => {
      const newTheme = get().theme === 'dark' ? 'light' : 'dark';
      set({ theme: newTheme });
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
      }
    },
    setTheme: (theme) => {
      set({ theme });
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
      }
    },
  };
});

