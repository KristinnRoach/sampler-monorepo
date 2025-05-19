export function saveValue(key: string, value: string | number): void {
  localStorage.setItem(key, value.toString());
}

export function getValue<T extends string | number>(
  key: string,
  fallback: T
): T {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  if (typeof fallback === 'number') return Number(stored) as T;
  return stored as T;
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItem<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  return item ? (JSON.parse(item) as T) : null;
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

export function exists(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

export function clear(): void {
  localStorage.clear();
}

export function keys(): string[] {
  return Object.keys(localStorage);
}
