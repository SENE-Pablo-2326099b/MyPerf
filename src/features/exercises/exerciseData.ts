import type { Equipment, ExerciseType, Grip, SpecificMuscle, WorkingAngle } from '@/db/models/Exercise';

// ── Hiérarchie musculaire ─────────────────────────────────────────────────

export interface MuscleGroup {
  value: string;
  label: string;
  muscles: Array<{ value: SpecificMuscle; label: string }>;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    value: 'chest',
    label: 'Pectoraux',
    muscles: [
      { value: 'pec_upper', label: 'Pec supérieur' },
      { value: 'pec_mid', label: 'Pec moyen' },
      { value: 'pec_lower', label: 'Pec inférieur' },
      { value: 'serratus', label: 'Dentelé antérieur' },
    ],
  },
  {
    value: 'back',
    label: 'Dos',
    muscles: [
      { value: 'lats', label: 'Grands dorsaux' },
      { value: 'upper_traps', label: 'Trapèzes (haut)' },
      { value: 'mid_traps', label: 'Trapèzes (mid)' },
      { value: 'lower_traps', label: 'Trapèzes (bas)' },
      { value: 'rhomboids', label: 'Rhomboïdes' },
      { value: 'lower_back', label: 'Lombaires' },
      { value: 'teres_major', label: 'Grand rond' },
    ],
  },
  {
    value: 'legs',
    label: 'Jambes',
    muscles: [
      { value: 'quads', label: 'Quadriceps' },
      { value: 'hamstrings', label: 'Ischio-jambiers' },
      { value: 'glutes', label: 'Fessiers' },
      { value: 'calves', label: 'Mollets' },
      { value: 'hip_flexors', label: 'Fléchisseurs hanches' },
      { value: 'adductors', label: 'Adducteurs' },
    ],
  },
  {
    value: 'shoulders',
    label: 'Épaules',
    muscles: [
      { value: 'front_delt', label: 'Deltoïde antérieur' },
      { value: 'mid_delt', label: 'Deltoïde latéral' },
      { value: 'rear_delt', label: 'Deltoïde postérieur' },
      { value: 'rotator_cuff', label: 'Coiffe des rotateurs' },
    ],
  },
  {
    value: 'arms',
    label: 'Bras',
    muscles: [
      { value: 'bicep_long', label: 'Bicep (longue portion)' },
      { value: 'bicep_short', label: 'Bicep (courte portion)' },
      { value: 'brachialis', label: 'Brachial antérieur' },
      { value: 'tricep_long', label: 'Tricep (longue portion)' },
      { value: 'tricep_lateral', label: 'Tricep (vaste latéral)' },
      { value: 'tricep_medial', label: 'Tricep (vaste médial)' },
      { value: 'forearms', label: 'Avant-bras' },
    ],
  },
  {
    value: 'core',
    label: 'Core',
    muscles: [
      { value: 'rectus', label: 'Grand droit' },
      { value: 'obliques', label: 'Obliques' },
      { value: 'transverse', label: 'Transverse' },
      { value: 'lower_abs', label: 'Bas-ventre' },
    ],
  },
];

export const MUSCLE_GROUP_MAP = Object.fromEntries(
  MUSCLE_GROUPS.map(g => [g.value, g]),
);

// ── Équipements ────────────────────────────────────────────────────────────

export interface EquipmentOption {
  value: Equipment;
  label: string;
  sub?: string;
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { value: 'barbell', label: 'Barre olympique' },
  { value: 'ez_bar', label: 'Barre EZ' },
  { value: 'smith_machine', label: 'Smith Machine' },
  { value: 'dumbbell', label: 'Haltères' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'cable', label: 'Câble' },
  { value: 'machine', label: 'Machine guidée' },
  { value: 'bodyweight', label: 'Poids du corps' },
  { value: 'weighted_bodyweight', label: 'Lestable', sub: 'Poids corps + lest' },
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = Object.fromEntries(
  EQUIPMENT_OPTIONS.map(e => [e.value, e.label]),
) as Record<Equipment, string>;

// ── Types ──────────────────────────────────────────────────────────────────

export const EXERCISE_TYPES: Array<{ value: ExerciseType; label: string }> = [
  { value: 'compound', label: 'Poly-articulaire' },
  { value: 'isolation', label: 'Isolation' },
];

// ── Prise ──────────────────────────────────────────────────────────────────

export const GRIP_OPTIONS: Array<{ value: Grip; label: string; sub: string }> = [
  { value: 'pronation', label: 'Pronation', sub: 'Paumes vers le bas' },
  { value: 'supination', label: 'Supination', sub: 'Paumes vers le haut' },
  { value: 'neutral', label: 'Neutre', sub: 'Paumes face à face' },
  { value: 'mixed', label: 'Mixte', sub: 'Une de chaque' },
];

// ── Angle de travail ───────────────────────────────────────────────────────

export const ANGLE_OPTIONS: Array<{ value: WorkingAngle; label: string }> = [
  { value: 'flat', label: 'Plat' },
  { value: 'incline', label: 'Incliné' },
  { value: 'decline', label: 'Décliné' },
  { value: 'overhead', label: 'Vertical' },
  { value: 'low_pulley', label: 'Poulie basse' },
  { value: 'high_pulley', label: 'Poulie haute' },
];

export const MUSCLE_GROUP_SHORT: Record<string, string> = {
  chest: 'Pecto',
  back: 'Dos',
  legs: 'Jambes',
  shoulders: 'Épaules',
  arms: 'Bras',
  core: 'Core',
};
