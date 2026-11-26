import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label={title} className="relative flex h-full w-full max-w-md flex-col bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-surface-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button ref={closeRef} aria-label="Close details" onClick={onClose} className="rounded p-1 hover:bg-forest-50"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
