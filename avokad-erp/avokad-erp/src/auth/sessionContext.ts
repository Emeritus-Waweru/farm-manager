import { createContext, useContext } from 'react';
import type { Role, Session } from '../types';

// TODO(backend): replace this placeholder with a server session (HttpOnly, Secure, SameSite cookie).
// The client must never store tokens in localStorage or build them itself.
export const DEMO_SESSIONS: Record<Role, Session> = {
  executive: { userId: 'u-exec', displayName: 'Executive Admin', role: 'executive' },
  field_agent: { userId: 'u-agent', displayName: 'Field Agent', role: 'field_agent' },
  packhouse: { userId: 'u-pack', displayName: 'Packhouse Compliance', role: 'packhouse' },
  hr: { userId: 'u-hr', displayName: 'HR Officer', role: 'hr' },
};

// TODO(backend): RBAC is enforced on the server. This table only decides which links the UI shows.
export const ROUTE_ACCESS: Record<string, Role[]> = {
  '/': ['executive', 'packhouse', 'hr'],
  '/intake': ['executive', 'field_agent'],
  '/inventory-export': ['executive', 'packhouse'],
  '/admin-hr': ['executive', 'hr'],
};
export const canView = (role: Role, path: string) => ROUTE_ACCESS[path]?.includes(role) ?? false;

export interface SessionContextValue { session: Session; setRole: (role: Role) => void }
export const SessionContext = createContext<SessionContextValue | null>(null);
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
