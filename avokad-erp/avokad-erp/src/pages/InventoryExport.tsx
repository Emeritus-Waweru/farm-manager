import { useState } from 'react';
import { mockApi } from '../services/mockApi';
import { useAsync } from '../lib/useAsync';
import { fmtDateTime, fmtKg } from '../lib/format';
import Modal from '../components/Modal';
import type { IntakeBatch, PipelineStage, Shipment } from '../types';

const STAGES: PipelineStage[] = ['Receiving', 'Washing', 'Size Sorting', 'Grade Sorting', 'Packing'];
const SHIP_BADGE: Record<Shipment['status'], string> = { Packing: 'badge-warn', 'Awaiting inspection': 'badge-warn', 'In transit': 'badge-ok', Delivered: 'badge-ok' };
const load = () => Promise.all([mockApi.getBatches(), mockApi.getColdRooms(), mockApi.getCompliance(), mockApi.getShipments(), mockApi.getFarmers()]);

const traceCode = (b: IntakeBatch) => `AVK-${b.id}-${b.farmerId}-${b.receivedAt.slice(0, 10).replace(/-/g, '')}`;

/** Deterministic grid from the code. A visual placeholder, NOT a scannable QR. */
function CodeGrid({ code }: { code: string }) {
  let h = 2166136261;
  const cells: boolean[] = [];
  for (let i = 0; i < 81; i++) {
    h = Math.imul(h ^ code.charCodeAt(i % code.length), 16777619) + i;
    cells.push(((h >>> 7) & 1) === 1);
  }
  return (
    <svg viewBox="0 0 9 9" className="h-28 w-28 rounded border border-surface-line bg-white p-1" role="img" aria-label="Placeholder code pattern">
      {cells.map((on, i) => on && <rect key={i} x={i % 9} y={Math.floor(i / 9)} width="1" height="1" fill="#0a0a0a" />)}
    </svg>
  );
}

export default function InventoryExport() {
  const { data, error, loading, reload } = useAsync(load);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [trace, setTrace] = useState<IntakeBatch | null>(null);

  if (loading) return <p className="text-ink-soft" role="status">Loading packhouse data…</p>;
  if (error || !data) return (
    <div className="card p-6"><p className="font-medium text-clay-600">Could not load packhouse data. {error}</p>
      <button onClick={reload} className="mt-3 rounded bg-forest-800 px-3 py-1.5 text-sm text-white">Try again</button></div>
  );
  const [batches, rooms, compliance, shipments, farmers] = data;
  const farmer = trace ? farmers.find((f) => f.id === trace.farmerId) : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Processing, inventory and export</h1>

      <section aria-label="Processing pipeline" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((s, i) => {
          const inStage = batches.filter((b) => b.stage === s);
          return (
            <div key={s} className="card p-3">
              <p className="text-xs text-ink-soft">Stage {i + 1}</p>
              <h2 className="font-semibold">{s}</h2>
              <p className="text-sm text-ink-soft">{inStage.length} batches, {fmtKg(inStage.reduce((t, b) => t + b.weightKg, 0))}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {inStage.slice(0, 4).map((b) => (
                  <li key={b.id}><button onClick={() => setTrace(b)} className="text-forest-700 hover:underline">{b.id}</button> <span className="text-ink-soft">{b.crop}</span></li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Cold storage</h2>
          <div className="space-y-4">
            {rooms.map((r) => {
              const pct = Math.round((r.usedKg / r.capacityKg) * 100);
              return (
                <div key={r.id}>
                  <div className="flex justify-between text-sm"><span>{r.name} · {r.tempC}°C</span><span>{pct}% · {fmtKg(r.usedKg)} of {fmtKg(r.capacityKg)}</span></div>
                  <div className="mt-1 h-3 rounded bg-forest-100" role="progressbar" aria-label={`${r.name} capacity used`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className={`h-3 rounded ${pct > 85 ? 'bg-clay-600' : pct > 70 ? 'bg-amber-600' : 'bg-forest-700'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Export compliance</h2>
          {/* TODO(backend): persist toggles server-side and record who changed them and when. */}
          <ul className="space-y-2">
            {compliance.map((c) => {
              const on = done[c.id] ?? c.done;
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <span><span className="badge badge-ok mr-2">{c.scheme}</span>{c.label}</span>
                  <button role="switch" aria-checked={on} aria-label={c.label} onClick={() => setDone((d) => ({ ...d, [c.id]: !on }))}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-forest-700' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Export shipments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-line text-ink-soft"><tr><th className="py-2">Shipment</th><th>Destination</th><th>Crop</th><th>Weight</th><th>ETD</th><th>Status</th></tr></thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-surface-line last:border-0">
                  <td className="py-2 font-medium">{s.id}</td><td>{s.destination}</td><td>{s.crop}</td><td>{fmtKg(s.weightKg)}</td><td>{s.etd}</td>
                  <td><span className={`badge ${SHIP_BADGE[s.status]}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={!!trace} title={trace ? `Traceability: ${trace.id}` : ''} onClose={() => setTrace(null)}>
        {trace && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CodeGrid code={traceCode(trace)} />
              <div><p className="text-xs text-ink-soft">Trace code</p><p className="break-all font-mono text-sm">{traceCode(trace)}</p></div>
            </div>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
              <dt className="text-ink-soft">Farmer</dt><dd>{farmer ? `${farmer.name}, ${farmer.ward}, ${farmer.county}` : trace.farmerId}</dd>
              <dt className="text-ink-soft">GlobalGAP</dt><dd>{farmer?.gapCertified ? 'Certified grower' : 'Not certified'}</dd>
              <dt className="text-ink-soft">Crop and grade</dt><dd>{trace.crop}, Grade {trace.grade}</dd>
              <dt className="text-ink-soft">Weight</dt><dd>{fmtKg(trace.weightKg)} in {trace.crates} crates</dd>
              <dt className="text-ink-soft">Received</dt><dd>{fmtDateTime(trace.receivedAt)}</dd>
              <dt className="text-ink-soft">Stage</dt><dd>{trace.stage}</dd>
            </dl>
            <p className="text-xs text-ink-soft">The pattern is a placeholder. TODO(backend): generate a real QR from a server-issued trace ID.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
