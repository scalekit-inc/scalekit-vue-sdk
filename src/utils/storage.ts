import { WebStorageStateStore } from 'oidc-client-ts';
import type { StorageType } from '../types';

/**
 * In-memory storage implementation for environments without Web Storage
 */
class InMemoryStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

/**
 * Singleton instance of in-memory storage
 */
let memoryStorage: InMemoryStorage | null = null;

/**
 * Gets the in-memory storage instance
 */
function getMemoryStorage(): InMemoryStorage {
  if (!memoryStorage) {
    memoryStorage = new InMemoryStorage();
  }
  return memoryStorage;
}

/**
 * Gets the appropriate storage object based on the storage type
 */
export function getStorage(storageType: StorageType): Storage {
  switch (storageType) {
    case 'localStorage':
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
      console.warn('localStorage not available, falling back to memory storage');
      return getMemoryStorage();

    case 'sessionStorage':
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage;
      }
      console.warn('sessionStorage not available, falling back to memory storage');
      return getMemoryStorage();

    case 'memory':
      return getMemoryStorage();

    default:
      return getMemoryStorage();
  }
}

/**
 * Creates a WebStorageStateStore for oidc-client-ts
 */
export function createStateStore(storageType: StorageType): WebStorageStateStore {
  const storage = getStorage(storageType);
  return new WebStorageStateStore({ store: storage });
}

/**
 * Checks if storage is available in the current environment
 */
export function isStorageAvailable(storageType: 'localStorage' | 'sessionStorage'): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storage = window[storageType];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
