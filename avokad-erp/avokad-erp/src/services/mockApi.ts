import type { ColdRoom, ComplianceItem, Farmer, HeadcountForecast, IntakeBatch, Shipment, Staff, Task } from '../types';

export const mockConfig = { minLatencyMs: 250, maxLatencyMs: 700, errorRate: 0 };

async function respond<T>(data: T): Promise<T> {
  const { minLatencyMs, maxLatencyMs, errorRate } = mockConfig;
  await new Promise((r) => setTimeout(r, minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs)));
  if (Math.random() < errorRate) throw new Error('Simulated network error. Try again.');
  return structuredClone(data);
}

const farmers: Farmer[] = [
  { id: 'F-1001', name: 'Wanjiru Mugo', county: 'Kirinyaga', ward: 'Mutira', crops: ['Avocado'], gapCertified: true, active: true },
  { id: 'F-1002', name: 'Peter Kariuki', county: 'Nyeri', ward: 'Mukurweini', crops: ['Avocado', 'Macadamia'], gapCertified: true, active: true },
  { id: 'F-1003', name: 'Grace Njeri', county: 'Embu', ward: 'Runyenjes', crops: ['Pawpaw'], gapCertified: false, active: true },
  { id: 'F-1004', name: 'Samuel Mwangi', county: 'Kirinyaga', ward: 'Kiine', crops: ['Macadamia'], gapCertified: true, active: false },
];
const batches: IntakeBatch[] = [
  { id: 'B-2401', farmerId: 'F-1001', crop: 'Avocado', crates: 40, weightKg: 620, grade: 'A', receivedAt: '2026-11-24T07:40:00+03:00', agentId: 'u-agent', stage: 'Washing', sync: 'synced' },
  { id: 'B-2402', farmerId: 'F-1002', crop: 'Macadamia', crates: 25, weightKg: 380, grade: 'B', receivedAt: '2026-11-24T09:10:00+03:00', agentId: 'u-agent', stage: 'Receiving', sync: 'synced' },
  { id: 'B-2403', farmerId: 'F-1003', crop: 'Pawpaw', crates: 30, weightKg: 510, grade: 'B', receivedAt: '2026-11-25T06:55:00+03:00', agentId: 'u-agent', stage: 'Packing', sync: 'synced' },
];
// Deterministic extra intake history so charts and tables have something to show.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STAGES = ['Receiving', 'Washing', 'Size Sorting', 'Grade Sorting', 'Packing'] as const;
for (let i = 0; i < 28; i++) {
  const f = farmers[Math.floor(rnd() * 3)];
  const crates = 15 + Math.floor(rnd() * 40);
  batches.push({
    id: `B-${2300 + i}`, farmerId: f.id, crop: f.crops[Math.floor(rnd() * f.crops.length)], crates,
    weightKg: Math.round(crates * (14 + rnd() * 3)), grade: (['A', 'B', 'C'] as const)[Math.floor(rnd() * 3)],
    receivedAt: `2026-11-${19 + Math.floor(i / 4)}T0${6 + (i % 4)}:30:00+03:00`, agentId: 'u-agent',
    stage: STAGES[i % 5], sync: 'synced',
  });
}
const coldRooms: ColdRoom[] = [
  { id: 'CR-1', name: 'Cold room 1', capacityKg: 20000, usedKg: 14200, tempC: 5.5 },
  { id: 'CR-2', name: 'Cold room 2', capacityKg: 12000, usedKg: 3100, tempC: 6.0 },
];
const compliance: ComplianceItem[] = [
  { id: 'C-1', label: 'Phytosanitary certificate issued', scheme: 'Phytosanitary', done: true },
  { id: 'C-2', label: 'Pre-shipment inspection booked', scheme: 'Phytosanitary', done: false },
  { id: 'C-3', label: 'Grower GGN verified', scheme: 'GlobalGAP', done: true },
  { id: 'C-4', label: 'Pesticide residue results on file', scheme: 'GlobalGAP', done: false },
];
const shipments: Shipment[] = [
  { id: 'S-310', destination: 'Rotterdam', crop: 'Avocado', weightKg: 18000, status: 'Awaiting inspection', etd: '2026-11-29' },
  { id: 'S-309', destination: 'Dubai', crop: 'Pawpaw', weightKg: 6000, status: 'In transit', etd: '2026-11-22' },
];
const staff: Staff[] = [
  { id: 'E-01', name: 'Mercy Atieno', department: 'Packhouse', shift: 'Day', present: true, trainingStatus: 'Complete' },
  { id: 'E-02', name: 'Brian Kamau', department: 'Cold chain', shift: 'Night', present: false, trainingStatus: 'In progress' },
  { id: 'E-03', name: 'Faith Wambui', department: 'Quality control', shift: 'Day', present: true, trainingStatus: 'Complete' },
  { id: 'E-04', name: 'Dennis Otieno', department: 'Logistics', shift: 'Day', present: true, trainingStatus: 'Not started' },
  { id: 'E-05', name: 'Lucy Muthoni', department: 'Packhouse', shift: 'Harvest', present: true, trainingStatus: 'In progress' },
  { id: 'E-06', name: 'Kevin Ndungu', department: 'Field operations', shift: 'Harvest', present: false, trainingStatus: 'Not started' },
  { id: 'E-07', name: 'Joyce Chebet', department: 'Office admin', shift: 'Day', present: true, trainingStatus: 'Complete' },
  { id: 'E-08', name: 'Hassan Abdi', department: 'Cold chain', shift: 'Night', present: true, trainingStatus: 'In progress' },
];
const tasks: Task[] = [
  { id: 'T-1', title: 'Calibrate sorting line scales', assigneeId: 'E-01', status: 'Doing' },
  { id: 'T-2', title: 'File November GlobalGAP records', assigneeId: 'E-07', status: 'Todo' },
  { id: 'T-3', title: 'Service cold room 1 compressor', assigneeId: 'E-02', status: 'Todo' },
  { id: 'T-4', title: 'Book Rotterdam pre-shipment inspection', assigneeId: 'E-04', status: 'Doing' },
  { id: 'T-5', title: 'Update farmer register for Embu', assigneeId: 'E-06', status: 'Done' },
  { id: 'T-6', title: 'Print crate labels for harvest week', assigneeId: 'E-07', status: 'Done' },
];
const forecast: HeadcountForecast[] = [
  { month: 'Dec', permanent: 42, seasonal: 18 }, { month: 'Jan', permanent: 42, seasonal: 30 }, { month: 'Feb', permanent: 44, seasonal: 36 },
  { month: 'Mar', permanent: 44, seasonal: 48 }, { month: 'Apr', permanent: 46, seasonal: 60 }, { month: 'May', permanent: 46, seasonal: 52 },
];

export const mockApi = {
  getFarmers: () => respond(farmers),
  getBatches: () => respond(batches),
  getColdRooms: () => respond(coldRooms),
  getCompliance: () => respond(compliance),
  getShipments: () => respond(shipments),
  getStaff: () => respond(staff),
  getTasks: () => respond(tasks),
  getForecast: () => respond(forecast),
  // TODO(backend): POST /intake-batches, idempotent on a client-generated id so retried syncs never duplicate.
  submitBatch: (b: IntakeBatch) => respond({ ...b, sync: 'synced' as const }),
};
