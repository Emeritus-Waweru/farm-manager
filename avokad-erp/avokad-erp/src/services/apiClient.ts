const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Typed fetch wrapper. TODO(backend): auth rides on the server's HttpOnly cookie, so no token handling here. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new ApiError(0, 'VITE_API_BASE_URL is not set. Copy .env.example to .env.');
  const res = await fetch(`${BASE.replace(/\/$/, '')}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return (await res.json()) as T;
}
