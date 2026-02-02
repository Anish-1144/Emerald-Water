import { create } from 'zustand';

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
  // Initialize from localStorage if available
  const initializeCart = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          return parsedCart.items || [];
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
    return [];
  };

  const initialState = { items: initializeCart() };

  // Save to localStorage whenever cart changes
  const saveToLocalStorage = (items: CartItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cart', JSON.stringify({ items }));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
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
        saveToLocalStorage(newItems);
        return { items: newItems };
      });
    },
    removeFromCart: (designId) => {
      set((state) => {
        const newItems = state.items.filter(i => i.design_id !== designId);
        saveToLocalStorage(newItems);
        return { items: newItems };
      });
    },
    updateQuantity: (designId, quantity) => {
      set((state) => {
        const newItems = state.items.map(i =>
          i.design_id === designId ? { ...i, quantity } : i
        );
        saveToLocalStorage(newItems);
        return { items: newItems };
      });
    },
    clearCart: () => {
      saveToLocalStorage([]);
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

