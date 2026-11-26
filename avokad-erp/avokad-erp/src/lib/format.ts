import type { Crop } from '../types';
export const CROP_COLOR: Record<Crop, string> = { Avocado: '#009a4f', Pawpaw: '#f67b00', Macadamia: '#2b2b2b' };
export const fmtKg = (n: number) => `${Math.round(n).toLocaleString('en-KE')} kg`;
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' });
