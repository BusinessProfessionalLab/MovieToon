// Shared localStorage helpers (client only). Pure + testable guards.
export function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleInList(key: string, slug: string): string[] {
  const list = readList(key);
  const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
  return next;
}

export function inList(key: string, slug: string): boolean {
  return readList(key).includes(slug);
}

export const FAV_KEY = 'movietoon-favorites';
export const WATCH_KEY = 'movietoon-watchlist';
export const PROGRESS_KEY = 'movietoon-progress';

export function getProgress(slug: string): number {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return 0;
    return Number(JSON.parse(raw)[slug] ?? 0);
  } catch {
    return 0;
  }
}

export function setProgress(slug: string, seconds: number): void {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[slug] = Math.round(seconds);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(obj));
  } catch {}
}

declare global {
  interface Window {
    movietoonToast?: (msg: string) => void;
  }
}
