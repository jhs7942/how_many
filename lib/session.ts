'use client';

// sessionStorage 타입 안전 헬퍼
export const session = {
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },
};
