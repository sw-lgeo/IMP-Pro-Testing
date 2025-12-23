import { useEffect, useRef } from 'react';
import { LuxEebSchema } from '../types/schema';

const STORAGE_KEY = 'hpform-luxeeb';

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable, skipping autosave', error);
    return null;
  }
}

export function useAutosave(data: LuxEebSchema) {
  const timer = useRef<number>();
  const storage = getStorage();

  useEffect(() => {
    if (!storage) return;

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 600);

    return () => {
      window.clearTimeout(timer.current);
    };
  }, [data, storage]);
}

export function loadAutosaved(): LuxEebSchema | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse autosave', e);
    return null;
  }
}
