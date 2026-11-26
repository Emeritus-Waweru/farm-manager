import { useState } from 'react';
import { mockApi } from '../services/mockApi';
import { useAsync } from '../lib/useAsync';
import type { HeadcountForecast, Task } from '../types';

const load = () => Promise.all([mockApi.getStaff(), mockApi.getTasks(), mockApi.getForecast()]);
const COLUMNS: Task['status'][] = ['Todo', 'Doing', 'Done'];
const TRAIN_BADGE = { Complete: 'badge-ok', 'In progress': 'badge-warn', 'Not started': 'badge-bad' } as const;

function ForecastChart({ rows }: { rows: HeadcountForecast[] }) {
  const max = Math.max(1, ...rows.map((r) => r.permanent + r.seasonal));
  const W = 560, H = 180, pad = 28, slot = (W - pad) / rows.length, bw = Math.min(44, slot * 0.6);
  const summary = rows.map((r) => `${r.month}: ${r.permanent} permanent, ${r.seasonal} seasonal`).join('; ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`Headcount forecast. ${summary}`} className="w-full">
        {rows.map((r, i) => {
          const x = pad + i * slot + (slot - bw) / 2;
          const hp = (r.permanent / max) * (H - 10), hs = (r.seasonal / max) * (H - 10);
          return (
            <g key={r.month}>
              <rect x={x} y={H - hp} width={bw} height={hp} fill="#009a4f"><title>{`${r.month} permanent: ${r.permanent}`}</title></rect>
              <rect x={x} y={H - hp - hs} width={bw} height={hs} fill="#f67b00"><title>{`${r.month} seasonal: ${r.seasonal}`}</title></rect>
              <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="11" fill="#5c5c5c">{r.month}</text>
            </g>
          );
        })}
        <line x1={pad} x2={W} y1={H} y2={H} stroke="#e3e3e3" />
      </svg>
      <ul className="mt-2 flex gap-4 text-sm text-ink-soft">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand-green" />Permanent</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand-orange" />Seasonal</li>
      </ul>
    </div>
  );
}

export default function AdminHr() {
  const { data, error, loading, reload } = useAsync(load);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [moved, setMoved] = useState<Record<string, Task['status']>>({});

  if (loading) return <p className="text-ink-soft" role="status">Loading admin and HR data…</p>;
  if (error || !data) return (
    <div className="card p-6"><p className="font-medium text-clay-600">Could not load admin and HR data. {error}</p>
      <button onClick={reload} className="mt-3 rounded bg-forest-800 px-3 py-1.5 text-sm text-white">Try again</button></div>
  );
  const [staff, tasks, forecast] = data;
  const isIn = (id: string, base: boolean) => present[id] ?? base;
  const status = (t: Task) => moved[t.id] ?? t.status;
  const nameOf = (id: string) => staff.find((s) => s.id === id)?.name ?? id;
  const peak = forecast.reduce((a, b) => (b.permanent + b.seasonal > a.permanent + a.seasonal ? b : a));
  const trained = staff.filter((s) => s.trainingStatus === 'Complete').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Office admin and HR</h1>

      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Attendance today</h2>
        <p className="mb-3 text-sm text-ink-soft">{staff.filter((s) => isIn(s.id, s.present)).length} of {staff.length} present</p>
        {/* TODO(backend): attendance is recorded server-side with the signed-in user and a timestamp. */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-line text-ink-soft"><tr><th className="py-2">Name</th><th>Department</th><th>Shift</th><th>Attendance</th></tr></thead>
            <tbody>
              {staff.map((s) => {
                const on = isIn(s.id, s.present);
                return (
                  <tr key={s.id} className="border-b border-surface-line last:border-0">
                    <td className="py-2 font-medium">{s.name}</td><td>{s.department}</td><td>{s.shift}</td>
                    <td><button onClick={() => setPresent((p) => ({ ...p, [s.id]: !on }))} aria-label={`${s.name}: ${on ? 'present' : 'absent'}. Toggle`}
                      className={`badge ${on ? 'badge-ok' : 'badge-bad'}`}>{on ? 'Present' : 'Absent'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Daily task board">
        <h2 className="mb-3 font-semibold">Daily tasks</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col} className="rounded-lg bg-forest-50 p-3">
              <h3 className="mb-2 text-sm font-semibold">{col} <span className="font-normal text-ink-soft">({tasks.filter((t) => status(t) === col).length})</span></h3>
              <ul className="space-y-2">
                {tasks.filter((t) => status(t) === col).map((t) => (
                  <li key={t.id} className="card p-3 text-sm">
                    <p className="font-medium">{t.title}</p><p className="text-ink-soft">{nameOf(t.assigneeId)}</p>
                    <div className="mt-2 flex gap-1.5">
                      {COLUMNS.filter((c) => c !== col).map((c) => (
                        <button key={c} onClick={() => setMoved((m) => ({ ...m, [t.id]: c }))} aria-label={`Move ${t.title} to ${c}`}
                          className="rounded border border-surface-line px-2 py-0.5 text-xs hover:bg-forest-50">Move to {c}</button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-1 font-semibold">Workforce forecast</h2>
          <p className="mb-3 text-sm text-ink-soft">Seasonal harvest staffing peaks in {peak.month} at {peak.permanent + peak.seasonal} people ({peak.seasonal} seasonal).</p>
          <ForecastChart rows={forecast} />
        </section>
        <section className="card p-4">
          <h2 className="mb-1 font-semibold">Training and development</h2>
          <p className="mb-3 text-sm text-ink-soft">{trained} of {staff.length} staff have completed their current training.</p>
          <ul className="divide-y divide-surface-line text-sm">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span>{s.name} <span className="text-ink-soft">· {s.department}</span></span>
                <span className={`badge ${TRAIN_BADGE[s.trainingStatus]}`}>{s.trainingStatus}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
