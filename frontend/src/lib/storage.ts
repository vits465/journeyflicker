/**
 * JourneyFlicker — Robust Multi-Platform Safe Storage Layer
 * Wrap local & session storage reads/writes in try/catch to protect React from crashing
 * in strict browser modes, corporate sandboxes, Brave shields, and Safari private/incognito tabs.
 */

// In-memory fallback if the browser completely blocks the storage API
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read localStorage key "${key}":`, e);
      return memoryStorage[key] || null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write localStorage key "${key}":`, e);
      memoryStorage[key] = String(value);
    }
  },

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove localStorage key "${key}":`, e);
      delete memoryStorage[key];
    }
  }
};

const memorySessionStorage: Record<string, string> = {};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read sessionStorage key "${key}":`, e);
      return memorySessionStorage[key] || null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write sessionStorage key "${key}":`, e);
      memorySessionStorage[key] = String(value);
    }
  },

  removeItem(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove sessionStorage key "${key}":`, e);
      delete memorySessionStorage[key];
    }
  }
};
