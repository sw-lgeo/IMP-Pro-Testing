import { useEffect, useRef } from 'react';
import { LuxEebSchema } from '../types/schema';

const STORAGE_KEY = 'hpform-luxeeb';

export function useAutosave(data: LuxEebSchema) {
  const timer = useRef<number>();

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 600);

    return () => {
      window.clearTimeout(timer.current);
    };
  }, [data]);
}

export function loadAutosaved(): LuxEebSchema | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse autosave', e);
    return null;
  }
}
