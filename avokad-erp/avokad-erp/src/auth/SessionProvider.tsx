import { useMemo, useState, type ReactNode } from 'react';
import { DEMO_SESSIONS, SessionContext } from './sessionContext';
import type { Role } from '../types';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('executive');
  const value = useMemo(() => ({ session: DEMO_SESSIONS[role], setRole }), [role]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
