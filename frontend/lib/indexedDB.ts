// IndexedDB utility for storing large data like cart items with images

const DB_NAME = 'emeraldWaterDB';
const DB_VERSION = 1;
const CART_STORE = 'cartItems';
const DESIGN_STORE = 'designs';

interface DBOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`IndexedDB error: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create cart items store
        if (!db.objectStoreNames.contains(CART_STORE)) {
          const cartStore = db.createObjectStore(CART_STORE, { keyPath: 'design_id' });
          cartStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create designs store
        if (!db.objectStoreNames.contains(DESIGN_STORE)) {
          const designStore = db.createObjectStore(DESIGN_STORE, { keyPath: '_id' });
          designStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async getDB(): Promise<IDBDatabase> {
    try {
      return await this.initDB();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  // Cart operations
  async saveCartItem(item: any): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([CART_STORE], 'readwrite');
      const store = transaction.objectStore(CART_STORE);
      
      const itemWithTimestamp = {
        ...item,
        timestamp: Date.now(),
      };
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(itemWithTimestamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error saving cart item to IndexedDB:', error);
      throw error;
    }
  }

  async getAllCartItems(): Promise<any[]> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([CART_STORE], 'readonly');
      const store = transaction.objectStore(CART_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const items = request.result || [];
          // Remove timestamp before returning
          resolve(items.map(({ timestamp, ...item }) => item));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting cart items from IndexedDB:', error);
      return [];
    }
  }

  async removeCartItem(designId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([CART_STORE], 'readwrite');
      const store = transaction.objectStore(CART_STORE);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(designId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error removing cart item from IndexedDB:', error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([CART_STORE], 'readwrite');
      const store = transaction.objectStore(CART_STORE);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing cart from IndexedDB:', error);
      throw error;
    }
  }

  // Design operations
  async saveDesign(design: any): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([DESIGN_STORE], 'readwrite');
      const store = transaction.objectStore(DESIGN_STORE);
      
      const designWithTimestamp = {
        ...design,
        timestamp: Date.now(),
      };
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(designWithTimestamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error saving design to IndexedDB:', error);
      throw error;
    }
  }

  async getDesign(designId: string): Promise<any | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([DESIGN_STORE], 'readonly');
      const store = transaction.objectStore(DESIGN_STORE);
      
      return new Promise((resolve, reject) => {
        const request = store.get(designId);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const { timestamp, ...design } = result;
            resolve(design);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting design from IndexedDB:', error);
      return null;
    }
  }

  // Check if IndexedDB is available
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
}

export const indexedDBManager = new IndexedDBManager();

