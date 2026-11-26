import type { Crop, IntakeBatch } from '../types';
import { CROP_COLOR, fmtKg } from '../lib/format';

const CROPS: Crop[] = ['Avocado', 'Pawpaw', 'Macadamia'];

export default function IntakeChart({ batches }: { batches: IntakeBatch[] }) {
  const byDay = new Map<string, Record<Crop, number>>();
  for (const b of batches) {
    const day = b.receivedAt.slice(0, 10);
    const row = byDay.get(day) ?? { Avocado: 0, Pawpaw: 0, Macadamia: 0 };
    row[b.crop] += b.weightKg;
    byDay.set(day, row);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-7);
  const max = Math.max(1, ...days.map(([, r]) => CROPS.reduce((s, c) => s + r[c], 0)));
  const W = 560, H = 200, pad = 28, slot = (W - pad) / Math.max(days.length, 1), bw = Math.min(40, slot * 0.6);
  const summary = days.map(([d, r]) => `${d}: ${fmtKg(CROPS.reduce((s, c) => s + r[c], 0))}`).join('; ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={`Daily intake by crop. ${summary}`} className="w-full">
        {days.map(([day, r], i) => {
          let y = H;
          const x = pad + i * slot + (slot - bw) / 2;
          return (
            <g key={day}>
              {CROPS.map((c) => {
                const h = (r[c] / max) * (H - 10);
                y -= h;
                return <rect key={c} x={x} y={y} width={bw} height={h} fill={CROP_COLOR[c]}><title>{`${c}: ${fmtKg(r[c])}`}</title></rect>;
              })}
              <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="11" fill="#5c5c5c">{day.slice(8)} Nov</text>
            </g>
          );
        })}
        <line x1={pad} x2={W} y1={H} y2={H} stroke="#e3e3e3" />
      </svg>
      <ul className="mt-2 flex flex-wrap gap-4 text-sm text-ink-soft">
        {CROPS.map((c) => (
          <li key={c} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: CROP_COLOR[c] }} />{c}</li>
        ))}
      </ul>
    </div>
  );
}
