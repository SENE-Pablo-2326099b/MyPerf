export interface VolumeLandmark {
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrv: number;
}

// Seuils de volume hebdomadaire par groupe musculaire (séries de travail).
// Valeurs issues de la littérature (Israetel et al.) — ajustables par l'utilisateur à terme.
export const VOLUME_LANDMARKS: Record<string, VolumeLandmark> = {
  chest:     { mev: 8,  mavLow: 12, mavHigh: 20, mrv: 22 },
  back:      { mev: 10, mavLow: 14, mavHigh: 22, mrv: 25 },
  legs:      { mev: 8,  mavLow: 12, mavHigh: 20, mrv: 22 },
  shoulders: { mev: 6,  mavLow: 16, mavHigh: 22, mrv: 26 },
  arms:      { mev: 8,  mavLow: 14, mavHigh: 20, mrv: 26 },
  core:      { mev: 0,  mavLow: 8,  mavHigh: 16, mrv: 20 },
};

export function volumeZone(sets: number, group: string): 'none' | 'below_mev' | 'mav' | 'above_mav' | 'mrv' {
  const lm = VOLUME_LANDMARKS[group];
  if (!lm || sets === 0) return 'none';
  if (sets >= lm.mrv) return 'mrv';
  if (sets >= lm.mavHigh) return 'above_mav';
  if (sets >= lm.mev) return 'mav';
  return 'below_mev';
}
