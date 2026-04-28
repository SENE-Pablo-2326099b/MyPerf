export type BlockType =
  | 'accumulation'
  | 'hypertrophy'
  | 'transmutation'
  | 'realization'
  | 'deload'
  | 'power';

export const BLOCK_LABELS: Record<BlockType, string> = {
  accumulation: 'Volume',
  hypertrophy: 'Hypertrophie',
  transmutation: 'Force',
  realization: 'Pic',
  deload: 'Décharge',
  power: 'Puissance',
};

export const BLOCK_COLORS: Record<BlockType, string> = {
  accumulation: '#10B981',
  hypertrophy: '#3B82F6',
  transmutation: '#EF4444',
  realization: '#F59E0B',
  deload: '#8B5CF6',
  power: '#F97316',
};

export const BLOCK_DEFAULTS: Record<BlockType, { repMin: number; repMax: number; rpe: number; restSeconds: number }> = {
  accumulation:  { repMin: 10, repMax: 20, rpe: 7,   restSeconds: 90  },
  hypertrophy:   { repMin: 6,  repMax: 12, rpe: 7.5, restSeconds: 120 },
  transmutation: { repMin: 3,  repMax: 6,  rpe: 8,   restSeconds: 180 },
  realization:   { repMin: 1,  repMax: 3,  rpe: 9,   restSeconds: 300 },
  deload:        { repMin: 8,  repMax: 15, rpe: 5,   restSeconds: 90  },
  power:         { repMin: 1,  repMax: 5,  rpe: 8,   restSeconds: 240 },
};

export const BLOCK_LIST: BlockType[] = [
  'accumulation',
  'hypertrophy',
  'transmutation',
  'realization',
  'deload',
  'power',
];

export function formatRestTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min${s}s` : `${m}min`;
}
