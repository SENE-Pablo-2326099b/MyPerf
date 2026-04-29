export type MicroLabel = 'accumulation' | 'intensification' | 'deload' | 'realization' | 'custom';

export const MICRO_LABELS: Record<MicroLabel, string> = {
  accumulation: 'Accumulation',
  intensification: 'Intensification',
  deload: 'Décharge',
  realization: 'Réalisation',
  custom: 'Libre',
};

export const MICRO_COLORS: Record<MicroLabel, string> = {
  accumulation: '#10B981',
  intensification: '#3B82F6',
  deload: '#8B5CF6',
  realization: '#F59E0B',
  custom: '#6B7280',
};

export const MICRO_VOL_DEFAULTS: Record<MicroLabel, number> = {
  accumulation: 105,
  intensification: 90,
  deload: 60,
  realization: 70,
  custom: 100,
};

export const MICRO_LABEL_LIST: MicroLabel[] = [
  'accumulation',
  'intensification',
  'deload',
  'realization',
  'custom',
];
