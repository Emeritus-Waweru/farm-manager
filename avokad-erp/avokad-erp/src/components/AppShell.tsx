import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, ClipboardList, LayoutDashboard, Menu, PanelLeftClose, Users } from 'lucide-react';
import { canView, DEMO_SESSIONS, useSession } from '../auth/sessionContext';
import type { Role } from '../types';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/intake', label: 'Field intake', icon: ClipboardList },
  { to: '/inventory-export', label: 'Processing and export', icon: Boxes },
  { to: '/admin-hr', label: 'Admin and HR', icon: Users },
];
const ROLE_LABEL: Record<Role, string> = { executive: 'Executive / Admin', field_agent: 'Field Agent', packhouse: 'Packhouse / Compliance', hr: 'HR' };

export default function AppShell() {
  const { session, setRole } = useSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-forest-900 text-forest-50 transition-all lg:static ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'w-16' : 'w-60'}`}>
        <div className="flex h-14 items-center justify-between px-4">
          {!collapsed && <span className="font-display text-lg font-bold"><span className="text-brand-green">Avo</span>kad</span>}
          <button aria-label="Collapse sidebar" onClick={() => setCollapsed((c) => !c)} className="hidden rounded p-1 hover:bg-forest-800 lg:block"><PanelLeftClose size={18} /></button>
        </div>
        <nav className="flex-1 space-y-1 px-2" aria-label="Main">
          {NAV.filter((n) => canView(session.role, n.to)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded px-3 py-2 text-sm ${isActive ? 'bg-forest-700 font-medium' : 'hover:bg-forest-800'}`}>
              <Icon size={18} aria-hidden /> {!collapsed && label}
            </NavLink>
          ))}
        </nav>
        {!collapsed && <p className="px-4 py-3 text-xs text-forest-100/70">Avokad Fruits (K) Limited</p>}
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-surface-line bg-surface-card px-4">
          <button aria-label="Open menu" className="rounded p-1 hover:bg-forest-50 lg:hidden" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="role" className="text-sm text-ink-soft">Viewing as</label>
            <select id="role" value={session.role} onChange={(e) => setRole(e.target.value as Role)}
              className="rounded border border-surface-line bg-white px-2 py-1 text-sm">
              {(Object.keys(DEMO_SESSIONS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
