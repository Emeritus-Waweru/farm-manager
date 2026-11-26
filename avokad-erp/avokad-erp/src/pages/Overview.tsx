import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { useAsync } from '../lib/useAsync';
import { CROP_COLOR, fmtDateTime, fmtKg } from '../lib/format';
import Drawer from '../components/Drawer';
import IntakeChart from '../components/IntakeChart';
import type { Crop, Grade, IntakeBatch } from '../types';

const load = () => Promise.all([mockApi.getBatches(), mockApi.getFarmers(), mockApi.getColdRooms(), mockApi.getCompliance()]);
const GRADE_BADGE: Record<Grade, string> = { A: 'badge-ok', B: 'badge-warn', C: 'badge-bad' };

export default function Overview() {
  const { data, error, loading, reload } = useAsync(load);
  const [q, setQ] = useState('');
  const [crop, setCrop] = useState<Crop | ''>('');
  const [grade, setGrade] = useState<Grade | ''>('');
  const [selected, setSelected] = useState<IntakeBatch | null>(null);

  const farmerName = useMemo(() => new Map((data?.[1] ?? []).map((f) => [f.id, f.name])), [data]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.[0] ?? [])
      .filter((b) => (!crop || b.crop === crop) && (!grade || b.grade === grade))
      .filter((b) => !term || b.id.toLowerCase().includes(term) || (farmerName.get(b.farmerId) ?? '').toLowerCase().includes(term))
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  }, [data, q, crop, grade, farmerName]);

  if (loading) return <p className="text-ink-soft" role="status">Loading overview…</p>;
  if (error || !data) return (
    <div className="card p-6"><p className="font-medium text-clay-600">Could not load the overview. {error}</p>
      <button onClick={reload} className="mt-3 rounded bg-forest-800 px-3 py-1.5 text-sm text-white">Try again</button></div>
  );

  const [batches, farmers, rooms, compliance] = data;
  const byCrop = (['Avocado', 'Pawpaw', 'Macadamia'] as Crop[]).map((c) => ({ c, kg: batches.filter((b) => b.crop === c).reduce((s, b) => s + b.weightKg, 0) }));
  const readiness = Math.round((compliance.filter((i) => i.done).length / Math.max(compliance.length, 1)) * 100);
  const used = rooms.reduce((s, r) => s + r.usedKg, 0), cap = rooms.reduce((s, r) => s + r.capacityKg, 0);
  const field = 'rounded border border-surface-line bg-white px-2 py-1.5 text-sm';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Executive overview</h1>

      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {byCrop.map(({ c, kg }) => (
          <div key={c} className="card border-l-4 p-4" style={{ borderLeftColor: CROP_COLOR[c] }}>
            <p className="text-sm text-ink-soft">{c} intake</p><p className="font-display text-2xl font-bold">{fmtKg(kg)}</p>
          </div>
        ))}
        <div className="card p-4"><p className="text-sm text-ink-soft">Active farmers</p>
          <p className="font-display text-2xl font-bold">{farmers.filter((f) => f.active).length} <span className="text-sm font-normal text-ink-soft">of {farmers.length}</span></p></div>
        <div className="card p-4"><p className="text-sm text-ink-soft">Export readiness</p>
          <p className="font-display text-2xl font-bold">{readiness}%</p><p className="text-xs text-ink-soft">Phytosanitary and GlobalGAP items done</p></div>
        <div className="card p-4 sm:col-span-2"><p className="text-sm text-ink-soft">Cold room utilization</p>
          <p className="font-display text-2xl font-bold">{Math.round((used / cap) * 100)}% <span className="text-sm font-normal text-ink-soft">{fmtKg(used)} of {fmtKg(cap)}</span></p>
          <div className="mt-2 h-2 rounded bg-forest-100" role="progressbar" aria-valuenow={Math.round((used / cap) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Cold room utilization">
            <div className="h-2 rounded bg-forest-700" style={{ width: `${(used / cap) * 100}%` }} /></div></div>
      </section>

      <section className="card p-4"><h2 className="mb-3 font-semibold">Daily intake by crop</h2><IntakeChart batches={batches} /></section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Recent batch intake</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative"><span className="sr-only">Search batches</span><Search size={14} className="absolute left-2 top-2.5 text-ink-soft" aria-hidden />
            <input value={q} maxLength={60} onChange={(e) => setQ(e.target.value)} placeholder="Batch ID or farmer" className={`${field} pl-7`} /></label>
          <select aria-label="Filter by crop" value={crop} onChange={(e) => setCrop(e.target.value as Crop | '')} className={field}>
            <option value="">All crops</option><option>Avocado</option><option>Pawpaw</option><option>Macadamia</option></select>
          <select aria-label="Filter by grade" value={grade} onChange={(e) => setGrade(e.target.value as Grade | '')} className={field}>
            <option value="">All grades</option><option>A</option><option>B</option><option>C</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-line text-ink-soft"><tr><th className="py-2">Batch</th><th>Farmer</th><th>Crop</th><th>Weight</th><th>Grade</th><th>Received</th></tr></thead>
            <tbody>
              {rows.slice(0, 15).map((b) => (
                <tr key={b.id} className="border-b border-surface-line last:border-0">
                  <td className="py-2"><button onClick={() => setSelected(b)} className="font-medium text-forest-700 underline-offset-2 hover:underline">{b.id}</button></td>
                  <td>{farmerName.get(b.farmerId) ?? b.farmerId}</td><td>{b.crop}</td><td>{fmtKg(b.weightKg)}</td>
                  <td><span className={`badge ${GRADE_BADGE[b.grade]}`}>Grade {b.grade}</span></td><td>{fmtDateTime(b.receivedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-6 text-center text-ink-soft">No batches match these filters. Clear the search or pick another crop.</p>}
        </div>
      </section>

      <Drawer open={!!selected} title={selected ? `Batch ${selected.id}` : ''} onClose={() => setSelected(null)}>
        {selected && (
          <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
            <dt className="text-ink-soft">Farmer</dt><dd>{farmerName.get(selected.farmerId) ?? selected.farmerId} ({selected.farmerId})</dd>
            <dt className="text-ink-soft">Crop</dt><dd>{selected.crop}</dd>
            <dt className="text-ink-soft">Crates</dt><dd>{selected.crates}</dd>
            <dt className="text-ink-soft">Weight</dt><dd>{fmtKg(selected.weightKg)}</dd>
            <dt className="text-ink-soft">Grade</dt><dd>{selected.grade}</dd>
            <dt className="text-ink-soft">Stage</dt><dd>{selected.stage}</dd>
            <dt className="text-ink-soft">Received</dt><dd>{fmtDateTime(selected.receivedAt)}</dd>
            <dt className="text-ink-soft">Sync</dt><dd>{selected.sync}</dd>
          </dl>
        )}
      </Drawer>
    </div>
  );
}
