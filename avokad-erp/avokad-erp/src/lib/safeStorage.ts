/** localStorage wrapper: never throws, never trusts stored JSON. */
export function readJson<T>(key: string, fallback: T, guard?: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return guard ? (guard(parsed) ? parsed : fallback) : (parsed as T);
  } catch {
    return fallback;
  }
}
export function writeJson(key: string, value: unknown): boolean {
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
