import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useSession } from '../auth/sessionContext';
import { mockApi } from '../services/mockApi';
import { useAsync } from '../lib/useAsync';
import { loadQueue, saveQueue } from '../lib/offlineQueue';
import { fmtDateTime, fmtKg } from '../lib/format';
import type { Crop, Grade, IntakeBatch } from '../types';

const CROPS: Crop[] = ['Avocado', 'Pawpaw', 'Macadamia'];
const GRADES: Grade[] = ['A', 'B', 'C'];
// A scanned QR may carry text around the ID, so pull out the F-1234 part.
const parseFarmerId = (raw: string) => raw.toUpperCase().match(/F-\d{4}/)?.[0] ?? '';

export default function Intake() {
  const { session } = useSession();
  const farmers = useAsync(mockApi.getFarmers);
  const [queue, setQueue] = useState<IntakeBatch[]>(loadQueue);
  const [farmerRaw, setFarmerRaw] = useState('');
  const [crop, setCrop] = useState<Crop>('Avocado');
  const [crates, setCrates] = useState('');
  const [weight, setWeight] = useState('');
  const [grade, setGrade] = useState<Grade>('A');
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState<IntakeBatch | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => { saveQueue(queue); }, [queue]);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const farmerId = parseFarmerId(farmerRaw);
  const farmer = farmers.data?.find((f) => f.id === farmerId);
  const cratesN = Number(crates), weightN = Number(weight);
  const errors = {
    farmer: !farmerId ? 'Enter a farmer ID like F-1001 or scan their QR code.' : farmers.data && !farmer ? 'No farmer with this ID. Check the card and try again.' : '',
    crates: !Number.isInteger(cratesN) || cratesN < 1 || cratesN > 500 ? 'Enter a whole number of crates from 1 to 500.' : '',
    weight: !Number.isFinite(weightN) || weightN <= 0 || weightN > 20000 ? 'Enter the weight in kg, above 0 and up to 20,000.' : '',
  };
  const valid = !errors.farmer && !errors.crates && !errors.weight;
  const pending = useMemo(() => queue.filter((b) => b.sync === 'pending'), [queue]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    const batch: IntakeBatch = {
      id: `L-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, farmerId, crop, crates: cratesN, weightKg: weightN, grade,
      receivedAt: new Date().toISOString(), agentId: session.userId, stage: 'Receiving', sync: 'pending',
    };
    setQueue((q) => [batch, ...q]);
    setSaved(batch);
    setCrates(''); setWeight(''); setFarmerRaw(''); setTried(false);
  }

  async function syncNow() {
    setSyncing(true); setSyncMsg('');
    let done = 0;
    try {
      for (const b of pending) {
        const res = await mockApi.submitBatch(b); // TODO(backend): idempotent POST keyed by b.id
        setQueue((q) => q.map((x) => (x.id === b.id ? { ...x, sync: res.sync } : x)));
        done++;
      }
      setSyncMsg(`Synced ${done} ${done === 1 ? 'record' : 'records'}.`);
    } catch (err) {
      setSyncMsg(`Synced ${done}, then stopped: ${err instanceof Error ? err.message : 'network error'}. The rest stay queued.`);
    } finally { setSyncing(false); }
  }

  const field = 'mt-1 w-full rounded border border-surface-line bg-white px-3 py-2.5 text-base';
  const err = (m: string) => (tried && m ? <p className="mt-1 text-sm text-clay-600" role="alert">{m}</p> : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Field intake</h1>
        <span className={`badge ${online ? 'badge-ok' : 'badge-warn'} gap-1`}>{online ? <Wifi size={12} aria-hidden /> : <CloudOff size={12} aria-hidden />}{online ? 'Online' : 'Offline: records save on this device'}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} noValidate className="card space-y-4 p-4">
          <div>
            <label htmlFor="farmer" className="text-sm font-medium">Farmer ID or QR scan</label>
            <input id="farmer" value={farmerRaw} maxLength={60} autoComplete="off" onChange={(e) => setFarmerRaw(e.target.value)} className={field} placeholder="F-1001" />
            {farmer && <p className="mt-1 text-sm text-forest-700">{farmer.name}, {farmer.ward}, {farmer.county}{farmer.gapCertified ? '' : ' (not GlobalGAP certified)'}</p>}
            {err(errors.farmer)}
          </div>
          <div>
            <label htmlFor="crop" className="text-sm font-medium">Crop</label>
            <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value as Crop)} className={field}>{CROPS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="crates" className="text-sm font-medium">Crates</label>
              <input id="crates" inputMode="numeric" value={crates} maxLength={3} onChange={(e) => setCrates(e.target.value.replace(/\D/g, ''))} className={field} />
              {err(errors.crates)}
            </div>
            <div>
              <label htmlFor="weight" className="text-sm font-medium">Weight (kg)</label>
              <input id="weight" inputMode="decimal" value={weight} maxLength={7} onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ''))} className={field} />
              {err(errors.weight)}
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Quality grade</legend>
            <div className="mt-1 flex gap-2">
              {GRADES.map((g) => (
                <label key={g} className={`flex-1 cursor-pointer rounded border px-3 py-2.5 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest-500 ${grade === g ? 'border-forest-700 bg-forest-100 font-medium' : 'border-surface-line bg-white'}`}>
                  <input type="radio" name="grade" value={g} checked={grade === g} onChange={() => setGrade(g)} className="sr-only" />Grade {g}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="w-full rounded bg-forest-800 px-4 py-3 font-medium text-white hover:bg-forest-700">Save intake</button>
        </form>

        <section className="card p-4" aria-live="polite">
          <h2 className="mb-3 font-semibold">Receipt preview</h2>
          <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
            <dt className="text-ink-soft">Farmer</dt><dd>{farmer ? `${farmer.name} (${farmer.id})` : farmerId || 'Not entered'}</dd>
            <dt className="text-ink-soft">Crop</dt><dd>{crop}</dd>
            <dt className="text-ink-soft">Crates</dt><dd>{crates || '-'}</dd>
            <dt className="text-ink-soft">Weight</dt><dd>{weightN > 0 ? fmtKg(weightN) : '-'}</dd>
            <dt className="text-ink-soft">Grade</dt><dd>{grade}</dd>
          </dl>
          {saved && <p className="mt-4 rounded bg-forest-50 p-3 text-sm text-forest-800">Saved as {saved.id} at {fmtDateTime(saved.receivedAt)}. It is queued until you sync.</p>}
        </section>
      </div>

      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Offline queue <span className="font-normal text-ink-soft">({pending.length} pending, {queue.length - pending.length} synced)</span></h2>
          <button onClick={syncNow} disabled={syncing || pending.length === 0} className="inline-flex items-center gap-2 rounded bg-forest-800 px-3 py-2 text-sm text-white hover:bg-forest-700 disabled:opacity-50">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} aria-hidden />{syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        {syncMsg && <p className="mb-3 text-sm" role="status">{syncMsg}</p>}
        {queue.length === 0 ? <p className="py-4 text-center text-ink-soft">Nothing queued. Save an intake above and it shows up here.</p> : (
          <ul className="divide-y divide-surface-line text-sm">
            {queue.slice(0, 20).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><span className="font-medium">{b.id}</span> · {b.farmerId} · {b.crop} · {fmtKg(b.weightKg)} · Grade {b.grade}</span>
                <span className={`badge ${b.sync === 'pending' ? 'badge-warn' : 'badge-ok'}`}>{b.sync === 'pending' ? 'Pending' : 'Synced'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
