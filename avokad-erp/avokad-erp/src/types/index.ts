export type Crop = 'Avocado' | 'Pawpaw' | 'Macadamia';
export type Grade = 'A' | 'B' | 'C';
export type County = 'Kirinyaga' | 'Nyeri' | 'Embu';
export type Role = 'executive' | 'field_agent' | 'packhouse' | 'hr';
export type SyncState = 'pending' | 'synced';
export type PipelineStage = 'Receiving' | 'Washing' | 'Size Sorting' | 'Grade Sorting' | 'Packing';

export interface Farmer { id: string; name: string; county: County; ward: string; crops: Crop[]; gapCertified: boolean; active: boolean }
export interface IntakeBatch {
  id: string; farmerId: string; crop: Crop; crates: number; weightKg: number; grade: Grade;
  receivedAt: string; agentId: string; stage: PipelineStage; sync: SyncState;
}
export interface ColdRoom { id: string; name: string; capacityKg: number; usedKg: number; tempC: number }
export interface ComplianceItem { id: string; label: string; scheme: 'Phytosanitary' | 'GlobalGAP'; done: boolean }
export interface Shipment { id: string; destination: string; crop: Crop; weightKg: number; status: 'Packing' | 'Awaiting inspection' | 'In transit' | 'Delivered'; etd: string }
export interface Staff { id: string; name: string; department: string; shift: 'Day' | 'Night' | 'Harvest'; present: boolean; trainingStatus: 'Not started' | 'In progress' | 'Complete' }
export interface Task { id: string; title: string; assigneeId: string; status: 'Todo' | 'Doing' | 'Done' }
export interface HeadcountForecast { month: string; permanent: number; seasonal: number }
export interface Session { userId: string; displayName: string; role: Role }
