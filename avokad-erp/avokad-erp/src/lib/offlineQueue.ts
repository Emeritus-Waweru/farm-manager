import type { Crop, Grade, IntakeBatch } from '../types';
import { readJson, writeJson } from './safeStorage';

const KEY = 'avokad.intakeQueue.v1';
const CROPS: Crop[] = ['Avocado', 'Pawpaw', 'Macadamia'];
const GRADES: Grade[] = ['A', 'B', 'C'];

/** Stored data is untrusted: check every field before the UI uses it. */
function isBatch(v: unknown): v is IntakeBatch {
  if (typeof v !== 'object' || v === null) return false;
  const b = v as Record<string, unknown>;
  return typeof b.id === 'string' && typeof b.farmerId === 'string' && CROPS.includes(b.crop as Crop)
    && GRADES.includes(b.grade as Grade) && Number.isFinite(b.crates) && Number.isFinite(b.weightKg)
    && typeof b.receivedAt === 'string' && (b.sync === 'pending' || b.sync === 'synced');
}
const isQueue = (v: unknown): v is IntakeBatch[] => Array.isArray(v) && v.every(isBatch);

// TODO(backend): the queue holds only intake records, never credentials. Keep it that way.
export const loadQueue = (): IntakeBatch[] => readJson<IntakeBatch[]>(KEY, [], isQueue);
export const saveQueue = (q: IntakeBatch[]): boolean => writeJson(KEY, q);
